const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer'); // Import nodemailer
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

// --- Security Constants ---
const saltRounds = 10; // For bcrypt password hashing

// Store server start time
const serverStartTime = new Date();

// Middleware
app.use(cors()); // Allow requests from the frontend
// Create a JSON parser middleware instance. We will apply it to specific routes.
const jsonParser = express.json();

// --- PostgreSQL Pool Setup ---
// The pool will use connection information from the environment variables.
// On Render, DATABASE_URL is automatically set for your web service.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render's internal connections
});

// --- Razorpay Instance ---
// IMPORTANT: Replace with your actual Razorpay Key ID and Key Secret from your dashboard.
// It's best practice to store these in environment variables for production.
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// --- Nodemailer Transporter Setup ---
// Configure your email service. Example uses Gmail.
// For production, use environment variables for user and pass.
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/profile-pics/';
        // Create the directory if it doesn't exist
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // This is a known issue with multer: req.body is not populated here.
        // We will generate a temporary name and rename it in the route handler.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `temp-${uniqueSuffix}${extension}`);
    }
});
const upload = multer({ storage: storage });

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// Redirect root to the login page, making it the default entry point
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// A simple function to generate a unique enrollment number
function generateEnrollmentNumber() {
    const year = new Date().getFullYear();
    const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `DAV${year}${randomPart}`;
}

// A simple function to generate a unique roll number
function generateRollNumber() {
    const year = new Date().getFullYear();
    const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `R${year}${randomPart}`;
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint to check server status
app.get('/api/status', (req, res) => {
    res.json({ serverStartTime });
});

// New endpoint to check for email existence
app.post('/check-email', jsonParser, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const { rows } = await pool.query('SELECT email FROM students WHERE email = $1', [email.toLowerCase()]);
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ message: 'Server error while checking email.' });
    }
});

// POST endpoint to handle registration data
app.post('/register', jsonParser, async (req, res) => {
    console.log("Received a request at /register endpoint.");
    const { name, email, dob, password, securityQuestion, securityAnswer, mobileNumber, gender } = req.body;
    console.log('Received registration data for email:', email);

    try {
        // 1. Check if user already exists
        const userCheck = await pool.query('SELECT email, mobilenumber FROM students WHERE email = $1 OR mobilenumber = $2', [email.toLowerCase(), mobileNumber]);
        if (userCheck.rows.length > 0) {
            const existing = userCheck.rows[0];
            if (existing.email === email.toLowerCase()) {
                return res.status(409).json({ message: `Email ${email} is already registered.` });
            }
            if (existing.mobilenumber === mobileNumber) {
                return res.status(409).json({ message: `Mobile Number ${mobileNumber} is already registered.` });
            }
        }

        // 2. Generate unique IDs
        const enrollmentNumber = generateEnrollmentNumber();
        const rollNumber = generateRollNumber(); // Assuming these are sufficiently unique for now

        // --- Password Hashing ---
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Insert the new user into the database
        // Note: Column names are lowercase as PostgreSQL folds unquoted identifiers to lowercase.
        const newUserQuery = `
            INSERT INTO students(enrollmentnumber, rollnumber, name, email, passwordhash, dob, mobilenumber, gender, securityquestion, securityanswer)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        const values = [enrollmentNumber, rollNumber, name, email.toLowerCase(), passwordHash, dob, mobileNumber, gender, securityQuestion, securityAnswer];
        
        const { rows } = await pool.query(newUserQuery, values);
        const newStudent = rows[0];

        // IMPORTANT: Never send the password hash back to the client!
        delete newStudent.passwordhash;

        console.log('Data successfully written to database for roll number:', newStudent.rollnumber);
        sendWelcomeEmail(newStudent.email, newStudent.name); // Send welcome email

        // Map DB columns (lowercase) to JS-friendly camelCase for the client
        const clientSafeStudentData = {
            enrollmentNumber: newStudent.enrollmentnumber,
            rollNumber: newStudent.rollnumber,
            name: newStudent.name,
            email: newStudent.email,
            dob: newStudent.dob,
            mobileNumber: newStudent.mobilenumber,
            gender: newStudent.gender,
            securityQuestion: newStudent.securityquestion,
            securityAnswer: newStudent.securityanswer
            // Add other fields as needed
        };

        res.status(201).json({ message: 'Registration successful!', studentData: clientSafeStudentData });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Failed to save data to the server.' });
    }
});

// --- Email Sending Function ---
async function sendWelcomeEmail(toEmail, studentName) {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Your email address from environment variables
        to: toEmail,
        subject: 'Welcome to DAV PG College!',
        html: `
            <p>Dear ${studentName},</p>
            <p>Welcome to DAV PG College, Varanasi! We are thrilled to have you join our community.</p>
            <p>Your registration was successful. You can now log in to your student portal using your Roll Number.</p>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Best regards,</p>
            <p>The DAV PG College Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${toEmail}`);
    } catch (error) {
        console.error(`Error sending welcome email to ${toEmail}:`, error);
    }
}

// POST endpoint to handle updating registration data
app.post('/update', upload.single('profilePicture'), async (req, res) => {
    console.log("Received a request at /update endpoint.");
    const updatedStudentData = req.body;
    console.log('Received update for roll number:', updatedStudentData.rollNumber);

    let profilePictureUrl = null;
    if (req.file) {
        const rollNumber = updatedStudentData.rollNumber;
        if (!rollNumber) {
            // Clean up the temporary file if roll number is missing
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Roll number is required to upload a picture.' });
        }

        // Construct the new path and rename the file
        const newFileName = `${rollNumber}${path.extname(req.file.originalname)}`;
        const newPath = path.join(path.dirname(req.file.path), newFileName);

        try {
            fs.renameSync(req.file.path, newPath);
            profilePictureUrl = newPath.replace(/\\/g, "/");
            console.log('Profile picture renamed and saved to:', profilePictureUrl);
        } catch (renameError) {
            console.error('Error renaming uploaded file:', renameError);
            fs.unlinkSync(req.file.path); // Clean up temp file
            return res.status(500).json({ message: 'Could not process file upload.' });
        }
    }
    
    try {
        const { rollNumber, name, email, dob, gender, mobileNumber } = updatedStudentData;

        // Dynamically build the update query to only change provided fields
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (name) { updateFields.push(`name = $${paramIndex++}`); values.push(name); }
        if (email) { updateFields.push(`email = $${paramIndex++}`); values.push(email); }
        if (dob) { updateFields.push(`dob = $${paramIndex++}`); values.push(dob); }
        if (gender) { updateFields.push(`gender = $${paramIndex++}`); values.push(gender); }
        if (mobileNumber) { updateFields.push(`mobilenumber = $${paramIndex++}`); values.push(mobileNumber); }
        if (profilePictureUrl) { updateFields.push(`profilepicture = $${paramIndex++}`); values.push(profilePictureUrl); }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update.' });
        }

        values.push(rollNumber);
        const query = `UPDATE students SET ${updateFields.join(', ')}, updatedat = CURRENT_TIMESTAMP WHERE rollnumber = $${paramIndex} RETURNING *`;

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student with that roll number not found.' });
        }

        const finalUpdatedStudent = rows[0];
        delete finalUpdatedStudent.passwordhash;
        console.log('Data successfully updated for roll number:', updatedStudentData.rollNumber);
        res.status(200).json({ message: 'Update successful.', studentData: mapDbToCamelCase(finalUpdatedStudent) });
    } catch (error) {
        console.error('Error updating student data:', error);
        res.status(500).json({ message: 'Failed to update data on the server.' });
    }
});

// POST endpoint to handle login
app.post('/login', jsonParser, async (req, res) => {
    console.log("Received a request at /login endpoint.");
    const { loginIdentifier, password } = req.body;
    console.log(`Login attempt for identifier: ${loginIdentifier}`);

    try {
        const query = 'SELECT * FROM students WHERE email = $1 OR mobilenumber = $1';
        const { rows } = await pool.query(query, [loginIdentifier.toLowerCase()]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email or Mobile Number not found.' });
        }

        const student = rows[0];

        // --- Password Verification ---
        // Compare the provided password with the stored hash.
        const isPasswordMatch = await bcrypt.compare(password, student.passwordhash);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        // For security, do not send the password hash back to the client.
        delete student.passwordhash;

        // Map DB fields to camelCase for frontend consistency
        res.status(200).json({ message: 'Login successful', studentData: mapDbToCamelCase(student) });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// POST endpoint to handle password change from home page
app.post('/change-password', jsonParser, async (req, res) => {
    console.log("Received a request at /change-password endpoint.");
    const { rollNumber, currentPassword, newPassword } = req.body;

    try {
        // 1. Get the current password hash
        const { rows } = await pool.query('SELECT passwordhash FROM students WHERE rollnumber = $1', [rollNumber]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const student = rows[0];

        // Verify current password
        const isPasswordMatch = await bcrypt.compare(currentPassword, student.passwordhash);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        // 2. Hash and update to the new password
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE students SET passwordhash = $1, updatedat = CURRENT_TIMESTAMP WHERE rollnumber = $2', [newPasswordHash, rollNumber]);

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error during password change:', error);
        res.status(500).json({ message: 'Server error during password change.' });
    }
});

// POST endpoint to handle password reset
app.post('/reset-password', jsonParser, async (req, res) => {
    console.log("Received a request at /reset-password endpoint.");
    const { identifier, securityQuestion, securityAnswer, newPassword } = req.body;
    console.log(`Password reset attempt for identifier: ${identifier}`);

    try {
        const query = 'SELECT * FROM students WHERE (email = $1 OR mobilenumber = $1) AND securityquestion = $2';
        const { rows } = await pool.query(query, [identifier.toLowerCase(), securityQuestion]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid identifier, security question, or answer.' });
        }

        const student = rows[0];
        // Case-insensitive answer check
        if (student.securityanswer.toLowerCase() !== securityAnswer.toLowerCase()) {
            return res.status(401).json({ message: 'Invalid identifier, security question, or answer.' });
        }

        // --- Password Hashing ---
        // Hash the new password before saving it.
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query('UPDATE students SET passwordhash = $1, updatedat = CURRENT_TIMESTAMP WHERE rollnumber = $2', [newPasswordHash, student.rollnumber]);

        console.log('Password successfully reset for roll number:', student.rollnumber);
        res.status(200).json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
});

// New endpoint to add academic details
app.post('/add-academic-details', jsonParser, async (req, res) => {
    console.log("Received a request at /add-academic-details endpoint.");
    const { rollNumber, board10, percentage10, year10, board12, percentage12, year12 } = req.body;

    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll Number is missing.' });
    }

    try {
        const query = `
            UPDATE students 
            SET board10=$1, percentage10=$2, year10=$3, board12=$4, percentage12=$5, year12=$6, updatedat=CURRENT_TIMESTAMP
            WHERE rollnumber = $7
            RETURNING *;
        `;
        const values = [board10, percentage10, year10, board12, percentage12, year12, rollNumber];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const finalUpdatedStudent = rows[0];
        delete finalUpdatedStudent.passwordhash;
        console.log('Academic details added for roll number:', rollNumber);
        res.status(200).json({ message: 'Academic details saved successfully.', studentData: mapDbToCamelCase(finalUpdatedStudent) });
    } catch (error) {
        console.error('Error updating academic details:', error);
        res.status(500).json({ message: 'Failed to save academic details on the server.' });
    }
});

// New endpoint to add contact and parent details
app.post('/add-contact-details', jsonParser, async (req, res) => {
    console.log("Received a request at /add-contact-details endpoint.");
    const { rollNumber, addressLine1, addressLine2, city, state, pincode, fatherName, fatherOccupation, motherName, motherOccupation, parentMobile } = req.body;

    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll Number is missing.' });
    }

    try {
        const query = `
            UPDATE students 
            SET addressline1=$1, addressline2=$2, city=$3, state=$4, pincode=$5, fathername=$6, fatheroccupation=$7, mothername=$8, motheroccupation=$9, parentmobile=$10, updatedat=CURRENT_TIMESTAMP
            WHERE rollnumber = $11
            RETURNING *;
        `;
        const values = [addressLine1, addressLine2, city, state, pincode, fatherName, fatherOccupation, motherName, motherOccupation, parentMobile, rollNumber];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const finalUpdatedStudent = rows[0];
        delete finalUpdatedStudent.passwordhash;
        console.log('Contact details added for roll number:', rollNumber);
        res.status(200).json({ message: 'Contact details saved successfully.', studentData: mapDbToCamelCase(finalUpdatedStudent) });
    } catch (error) {
        console.error('Error updating contact details:', error);
        res.status(500).json({ message: 'Failed to save contact details on the server.' });
    }
});

// New endpoint to save course selection (pre-payment)
app.post('/add-course-selection', jsonParser, async (req, res) => {
    console.log("Received a request at /add-course-selection endpoint.");
    const { rollNumber, selectionData } = req.body;

    if (!rollNumber || !selectionData) {
        return res.status(400).json({ message: 'Roll Number and selection data are required.' });
    }

    try {
        const query = `
            UPDATE students SET selectedcourse = $1, updatedat = CURRENT_TIMESTAMP 
            WHERE rollnumber = $2 RETURNING *;
        `;
        const values = [JSON.stringify(selectionData), rollNumber];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const finalUpdatedStudent = rows[0];
        delete finalUpdatedStudent.passwordhash;

        console.log('Course selection saved for roll number:', rollNumber);
        res.status(200).json({ message: 'Course selection saved successfully.', studentData: mapDbToCamelCase(finalUpdatedStudent) });
    } catch (error) {
        console.error('Error updating course selection:', error);
        res.status(500).json({ message: 'Failed to save course selection on the server.' });
    }
});

// --- PAYMENT GATEWAY ENDPOINTS ---

// POST endpoint to create a Razorpay order
app.post('/create-order', jsonParser, async (req, res) => {
    console.log("Received a request at /create-order endpoint.");
    const { amount, currency } = req.body;

    const options = {
        amount: amount, // amount in the smallest currency unit (e.g., paise for INR)
        currency: currency,
        receipt: `receipt_order_${new Date().getTime()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        console.log("Razorpay order created:", order);
        // Send back the order details plus your Key ID for the frontend
        res.json({ ...order, key_id: razorpay.key_id });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ message: "Could not create payment order." });
    }
});

// POST endpoint to verify payment signature
app.post('/verify-payment', jsonParser, async (req, res) => {
    console.log("Received a request at /verify-payment endpoint.");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rollNumber, course } = req.body;
    const key_secret = razorpay.key_secret;

    // This is the official way to create the signature for verification
    const shasum = crypto.createHmac('sha256', key_secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = shasum.digest('hex');

    if (generated_signature === razorpay_signature) {
        console.log("Payment is successful and signature is valid.");

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // --- Part 1: Save Payment History ---
            const studentResult = await client.query('SELECT name FROM students WHERE rollnumber = $1', [rollNumber]);
            const studentName = studentResult.rows.length > 0 ? studentResult.rows[0].name : 'N/A';

            const paymentQuery = `
                INSERT INTO payments (paymentid, orderid, studentrollnumber, studentname, coursedetails, amount, currency, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `;
            const paymentValues = [
                razorpay_payment_id, razorpay_order_id, rollNumber, studentName,
                `${course.level} - ${course.branch}`, course.amount / 100, 'INR', 'success'
            ];
            await client.query(paymentQuery, paymentValues);

            // --- Part 2: Update Student Record with Selected Course ---
            const courseWithStatus = { ...course, paymentStatus: 'paid' };
            const updateStudentQuery = `
                UPDATE students 
                SET selectedcourse = $1, updatedat = CURRENT_TIMESTAMP 
                WHERE rollnumber = $2 
                RETURNING *;
            `;
            const studentUpdateResult = await client.query(updateStudentQuery, [JSON.stringify(courseWithStatus), rollNumber]);

            await client.query('COMMIT');

            console.log('Payment history saved and student record updated for roll number:', rollNumber);

            const finalUpdatedStudent = studentUpdateResult.rows[0];
            delete finalUpdatedStudent.passwordhash;

            res.json({ status: 'success', orderId: razorpay_order_id, studentData: mapDbToCamelCase(finalUpdatedStudent) });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error saving payment history:', error);
            res.status(500).json({ status: 'failure', message: 'Error saving payment details.' });
        } finally {
            client.release();
        }
    } else {
        console.error("Payment verification failed. Signature mismatch.");
        res.status(400).json({ status: 'failure' });
    }
});

app.get('/payment-history/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Fetching payment history for roll number: ${rollNumber}`);

    try {
        const query = 'SELECT * FROM payments WHERE studentrollnumber = $1 ORDER BY paymentdate DESC';
        const { rows } = await pool.query(query, [rollNumber]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'Server error while fetching payment history.' });
    }
});

app.get('/student-data/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Fetching latest data for roll number: ${rollNumber}`);

    try {
        const query = 'SELECT * FROM students WHERE rollnumber = $1';
        const { rows } = await pool.query(query, [rollNumber]);

        if (rows.length > 0) {
            const student = rows[0];
            delete student.passwordhash;
            res.json({ studentData: mapDbToCamelCase(student) });
        } else {
            res.status(404).json({ message: 'Student not found.' });
        }
    } catch (error) {
        console.error('Error fetching student data:', error);
        res.status(500).json({ message: 'Server error while fetching student data.' });
    }
});

/**
 * =============================================================================
 * ADMIN-FACING ENDPOINTS
 * =============================================================================
 */

// New endpoint to get all student records for an admin view
app.get('/api/all-students', async (req, res) => {
    console.log('Fetching all student records for admin view.');
    try {
        // Select all relevant fields, but EXCLUDE the password hash and security answers for safety.
        const query = `
            SELECT 
                enrollmentnumber, rollnumber, name, email, gender, mobilenumber, city, createdat 
            FROM students 
            ORDER BY createdat DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows.map(student => mapDbToCamelCase(student)));
    } catch (error) {
        console.error('Error fetching all student data:', error);
        res.status(500).json({ message: 'Server error while fetching all student data.' });
    }
});

/**
 * Helper function to map database object (lowercase keys) to a frontend-friendly
 * camelCase object.
 * @param {object} dbObject The object with lowercase keys from the database.
 * @returns {object} A new object with camelCase keys.
 */
function mapDbToCamelCase(dbObject) {
    const camelCaseObject = {};
    for (const key in dbObject) {
        const keyMap = {
            enrollmentnumber: 'enrollmentNumber', rollnumber: 'rollNumber',
            passwordhash: 'passwordHash', securityquestion: 'securityQuestion',
            securityanswer: 'securityAnswer', profilepicture: 'profilePicture',
            addressline1: 'addressLine1', addressline2: 'addressLine2',
            fathername: 'fatherName', fatheroccupation: 'fatherOccupation',
            mothername: 'motherName', motheroccupation: 'motherOccupation',
            parentmobile: 'parentMobile', percentage10: 'percentage10',
            year10: 'year10', board10: 'board10', percentage12: 'percentage12',
            year12: 'year12', board12: 'board12', selectedcourse: 'selectedCourse',
            createdat: 'createdAt', updatedat: 'updatedAt', mobilenumber: 'mobileNumber'
        };
        camelCaseObject[keyMap[key] || key] = dbObject[key];
    }
    return camelCaseObject;
}

app.listen(port, () => {
    console.log("\n✅ Backend server is running!");
    console.log(`   Please open your web browser and go to:`);
    console.log(`   => http://localhost:${port}\n`);
});