const fs = require('fs');
const xlsx = require('xlsx');
const db = require('./db');
const path = require('path');

const excelFilePath = path.join(__dirname, 'students.xlsx');
const sheetName = 'Registrations';

const migrate = async () => {
    if (!fs.existsSync(excelFilePath)) {
        console.log('students.xlsx not found. Nothing to migrate.');
        await db.pool.end();
        return;
    }

    console.log('Starting migration from students.xlsx to PostgreSQL...');

    try {
        // Step 1: Ensure the 'students' table exists.
        // This makes the script idempotent and safe to run multiple times.
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                roll_number VARCHAR(255) UNIQUE,
                enrollment_number VARCHAR(255),
                dob DATE,
                age INTEGER,
                gender VARCHAR(50),
                mobile_number VARCHAR(20) UNIQUE,
                password VARCHAR(255),
                security_question TEXT,
                security_answer TEXT,
                profile_picture VARCHAR(255),
                address_line1 TEXT,
                address_line2 TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                father_name VARCHAR(255),
                father_occupation VARCHAR(255),
                mother_name VARCHAR(255),
                mother_occupation VARCHAR(255),
                parent_mobile VARCHAR(20),
                board10 VARCHAR(100),
                percentage10 VARCHAR(10),
                year10 VARCHAR(10),
                board12 VARCHAR(100),
                percentage12 VARCHAR(10),
                year12 VARCHAR(10),
                selected_course TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log('Ensuring "students" table exists...');
        await db.query(createTableQuery);
        console.log('"students" table is ready.');

        // Also ensure the mobile_number column has a UNIQUE constraint for new registrations.
        // This is non-destructive and won't fail if the constraint already exists.
        try {
            await db.query('ALTER TABLE students ADD CONSTRAINT students_mobile_number_key UNIQUE (mobile_number)');
            console.log('Added UNIQUE constraint to mobile_number.');
        } catch (e) {
            if (e.code === '42P07') { // duplicate_object error code
                console.log('UNIQUE constraint on mobile_number already exists.');
            } else {
                // We re-throw the error if it's not the one we're expecting.
                throw e;
            }
        }

        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            console.log(`Sheet "${sheetName}" not found in Excel file.`);
            return;
        }
        const students = xlsx.utils.sheet_to_json(worksheet);

        if (students.length === 0) {
            console.log('No students found in the Excel file.');
            return;
        }

        console.log(`Found ${students.length} students to migrate.`);

        for (const student of students) {
            // Map camelCase from Excel to snake_case for DB
            const insertQuery = `
                INSERT INTO students (
                    name, email, roll_number, enrollment_number, dob, age, gender,
                    mobile_number, password, security_question, security_answer,
                    profile_picture, address_line1, address_line2, city, state, pincode,
                    father_name, father_occupation, mother_name, mother_occupation,
                    parent_mobile, board10, percentage10, year10, board12, percentage12,
                    year12, selected_course
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                    $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
                ) ON CONFLICT (email) DO NOTHING;
            `;

            // Convert Excel date number to JS Date if necessary
            let dob = student.dob || null;
            if (typeof dob === 'number') {
                dob = new Date((dob - 25569) * 86400 * 1000);
            }

            const values = [
                student.name, student.email, student.rollNumber, student.enrollmentNumber, dob, student.age, student.gender,
                String(student.mobileNumber || ''), student.password, student.securityQuestion, student.securityAnswer,
                student.profilePicture, student.addressLine1, student.addressLine2, student.city, student.state, String(student.pincode || ''),
                student.fatherName, student.fatherOccupation, student.motherName, student.motherOccupation,
                String(student.parentMobile || ''), String(student.board10 || ''), String(student.percentage10 || ''), String(student.year10 || ''),
                String(student.board12 || ''), String(student.percentage12 || ''), String(student.year12 || ''), student.selectedCourse
            ].map(v => v === undefined ? null : v); // Ensure undefined becomes null

            await db.query(insertQuery, values);
            console.log(`Migrated or skipped student: ${student.name} (${student.email})`);
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // End the pool so the script will exit
        await db.pool.end();
        console.log('Database pool closed.');
    }
};

migrate();