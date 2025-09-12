const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer'); // Import nodemailer
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = 3000;

// Store server start time
const serverStartTime = new Date();

// Define a single source of truth for student data headers to ensure consistency.
const ALL_STUDENT_HEADERS = ['name', 'email', 'rollNumber', 'enrollmentNumber', 'dob', 'age', 'gender', 'mobileNumber', 'password', 'securityQuestion', 'securityAnswer', 'profilePicture', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'fatherName', 'fatherOccupation', 'motherName', 'motherOccupation', 'parentMobile', 'board10', 'percentage10', 'year10', 'board12', 'percentage12', 'year12', 'selectedCourse'];

// Middleware
app.use(cors()); // Allow requests from the frontend
// Create a JSON parser middleware instance. We will apply it to specific routes.
const jsonParser = express.json();

// --- Razorpay Instance ---
// IMPORTANT: Replace with your actual Razorpay Key ID and Key Secret from your dashboard.
// It's best practice to store these in environment variables for production.
const razorpay = new Razorpay({
    key_id: 'rzp_test_R9gu7rbC2p8saU', // <-- Replace with your Key ID from Razorpay Dashboard
    key_secret: 'jnAvO1J3CbF3ZCACmxR1bNtP' // <-- Replace with your Key Secret from Razorpay Dashboard
});

// --- Nodemailer Transporter Setup ---
// Configure your email service. Example uses Gmail.
// For production, use environment variables for user and pass.
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like 'Outlook', 'SendGrid', etc.
    auth: {
        user: 'raushanphotobackup.20@gmail.com', // Replace with your email address
        pass: 'R@u$h@n6049'   // Replace with your email password or app-specific password
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


const excelFilePath = path.join(__dirname, 'students.xlsx');
const sheetName = 'Registrations';

// POST endpoint to handle registration data
app.post('/register', jsonParser, (req, res) => {
    console.log("Received a request at /register endpoint.");
    const studentData = req.body;
    studentData.profilePicture = ''; // Add an empty profile picture field for new users
    console.log('Received registration data:', studentData);

    try {
        let workbook;
        let worksheet;
        let students = []; // Initialize students array

        // Check if the Excel file exists
        if (fs.existsSync(excelFilePath)) {
            // If it exists, read it
            workbook = xlsx.readFile(excelFilePath);
            worksheet = workbook.Sheets[sheetName];
            
            if (worksheet) {
                students = xlsx.utils.sheet_to_json(worksheet);
                // Check for duplicate Email or Mobile Number
                const existingStudentByEmail = students.find(s => String(s.email).toLowerCase() === String(studentData.email).toLowerCase());
                if (existingStudentByEmail) {
                    return res.status(409).json({ message: `Email ${studentData.email} is already registered.` });
                }
                const existingStudentByMobile = students.find(s => String(s.mobileNumber) === String(studentData.mobileNumber));
                if (existingStudentByMobile) {
                    return res.status(409).json({ message: `Mobile Number ${studentData.mobileNumber} is already registered.` });
                }
            }
        } else {
            // If it doesn't exist, create a new workbook and worksheet with headers
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.json_to_sheet([], { header: ALL_STUDENT_HEADERS });
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        // Note: The Roll Number and Enrollment Number are not submitted by the client during registration.
        // They are generated here on the server to ensure uniqueness and proper formatting.
        // Any 'rollNumber' field sent from the client would be overwritten here.

        // Generate a unique Roll Number
        let newRollNumber;
        let isUnique = false;
        while (!isUnique) {
            newRollNumber = generateRollNumber();
            // Check against the students list to ensure uniqueness
            const existingStudent = students.find(s => String(s.rollNumber) === String(newRollNumber));
            if (!existingStudent) {
                isUnique = true;
            }
        }
        studentData.rollNumber = newRollNumber;
        studentData.enrollmentNumber = generateEnrollmentNumber();

        // Append the new student data to the worksheet
        xlsx.utils.sheet_add_json(worksheet, [studentData], {
            skipHeader: true, // Don't add headers again
            origin: -1,       // Append to the end of the sheet
            header: ALL_STUDENT_HEADERS   // Ensure consistent column order
        });

        // Write the updated workbook back to the file
        xlsx.writeFile(workbook, excelFilePath);

        console.log('Data successfully written to students.xlsx');
        sendWelcomeEmail(studentData.email, studentData.name); // Send welcome email
        res.status(200).json({ message: 'Registration successful and data saved.', studentData: studentData });
    } catch (error) {
        console.error('Error writing to Excel file:', error);
        res.status(500).json({ message: 'Failed to save data to the server.' });
    }
});

// --- Email Sending Function ---
async function sendWelcomeEmail(toEmail, studentName) {
    const mailOptions = {
        from: 'YOUR_EMAIL@gmail.com', // Your email address
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
app.post('/update', upload.single('profilePicture'), (req, res) => {
    console.log("Received a request at /update endpoint.");
    const updatedStudentData = req.body;
    console.log('Received update for roll number:', updatedStudentData.rollNumber);

    // If a file was uploaded, add its path to the data to be saved
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
            // Save the web-compatible path to the student data
            updatedStudentData.profilePicture = newPath.replace(/\\/g, "/");
            console.log('Profile picture renamed and saved to:', updatedStudentData.profilePicture);
        } catch (renameError) {
            console.error('Error renaming uploaded file:', renameError);
            fs.unlinkSync(req.file.path); // Clean up temp file
            return res.status(500).json({ message: 'Could not process file upload.' });
        }
    }

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'Excel file not found. Cannot update.' });
    }

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];
        const students = xlsx.utils.sheet_to_json(worksheet);

        // Find the student and update their data
        let studentFound = false;
        const updatedStudents = students.map(student => {
            // Convert both to string for reliable comparison
            if (String(student.rollNumber) === String(updatedStudentData.rollNumber)) {
                studentFound = true;
                // Merge existing student data with new data from the form
                return { ...student, ...updatedStudentData };
            }
            return student;
        });

        if (!studentFound) {
            return res.status(404).json({ message: 'Student with that roll number not found.' });
        }

        // Create a new worksheet with the updated data and replace the old one
        // Ensure consistent header order
        const newWorksheet = xlsx.utils.json_to_sheet(updatedStudents, { header: ALL_STUDENT_HEADERS });
        workbook.Sheets[sheetName] = newWorksheet;

        // Write the changes back to the file
        xlsx.writeFile(workbook, excelFilePath);

        const finalUpdatedStudent = updatedStudents.find(s => String(s.rollNumber) === String(updatedStudentData.rollNumber));
        console.log('Data successfully updated for roll number:', updatedStudentData.rollNumber);
        res.status(200).json({ message: 'Update successful.', studentData: finalUpdatedStudent });
    } catch (error) {
        console.error('Error updating Excel file:', error);
        res.status(500).json({ message: 'Failed to update data on the server.' });
    }
});

// POST endpoint to handle login
app.post('/login', jsonParser, (req, res) => {
    console.log("Received a request at /login endpoint.");
    const { loginIdentifier, password } = req.body;
    console.log(`Login attempt for identifier: ${loginIdentifier}`);

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'No student data found. Please register first.' });
    }

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return res.status(404).json({ message: 'Registration sheet not found.' });
        }
        const students = xlsx.utils.sheet_to_json(worksheet);

        // Find the student by email OR mobile number
        const student = students.find(s =>
            (String(s.email).toLowerCase() === String(loginIdentifier).toLowerCase()) ||
            (String(s.mobileNumber) === String(loginIdentifier))
        );

        if (!student) {
            return res.status(401).json({ message: 'Email or Mobile Number not found.' });
        }

        // Check if the password matches
        if (String(student.password) !== String(password)) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        res.status(200).json({ message: 'Login successful', studentData: student });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// POST endpoint to handle password change from home page
app.post('/change-password', jsonParser, (req, res) => {
    console.log("Received a request at /change-password endpoint.");
    const { rollNumber, currentPassword, newPassword } = req.body;

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'No student data found.' });
    }

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return res.status(404).json({ message: 'Registration sheet not found.' });
        }
        const students = xlsx.utils.sheet_to_json(worksheet);
        // Find the student by email OR mobile number
        const student = students.find(s =>
            (String(s.email).toLowerCase() === String(loginIdentifier).toLowerCase()) ||
            (String(s.mobileNumber) === String(loginIdentifier))
        );

        if (!student) {
            return res.status(401).json({ message: 'Email or Mobile Number not found.' });
        }
        let studentFound = false;
        const updatedStudents = students.map(student => {
            if (String(student.rollNumber) === String(rollNumber)) {
                studentFound = true;
                // Verify current password
                if (String(student.password) !== String(currentPassword)) {
                    // Throw an error that will be caught and sent as a 401 response
                    throw new Error('Incorrect current password.');
                }
                // Update to the new password
                student.password = newPassword;
            }
            return student;
        });

        if (!studentFound) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Use a consistent header order to prevent column scrambling
        const newWorksheet = xlsx.utils.json_to_sheet(updatedStudents, { header: ALL_STUDENT_HEADERS });
        workbook.Sheets[sheetName] = newWorksheet;
        xlsx.writeFile(workbook, excelFilePath);

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error during password change:', error);
        res.status(error.message.includes('Incorrect') ? 401 : 500).json({ message: error.message || 'Server error during password change.' });
    }
});

// POST endpoint to handle password reset
app.post('/reset-password', jsonParser, (req, res) => {
    console.log("Received a request at /reset-password endpoint.");
    const { identifier, securityQuestion, securityAnswer, newPassword } = req.body;
    console.log(`Password reset attempt for identifier: ${identifier}`);

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'No student data found. Please register first.' });
    }

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return res.status(404).json({ message: 'Registration sheet not found.' });
        }
        const students = xlsx.utils.sheet_to_json(worksheet);

        // Find the student by email/mobile and security question/answer
        const student = students.find(s =>
            ((String(s.email).toLowerCase() === String(identifier).toLowerCase()) || (String(s.mobileNumber) === String(identifier))) &&
            String(s.securityQuestion) === String(securityQuestion) &&
            String(s.securityAnswer).toLowerCase() === String(securityAnswer).toLowerCase() // Case-insensitive answer check
        );

        if (!student) {
            return res.status(401).json({ message: 'Invalid identifier, security question, or answer.' });
        }

        // Update the password
        student.password = newPassword;

        // Create a new worksheet with the updated data and replace the old one
        // Use a consistent header order to prevent column scrambling
        const newWorksheet = xlsx.utils.json_to_sheet(students, { header: ALL_STUDENT_HEADERS });
        workbook.Sheets[sheetName] = newWorksheet;

        // Write the changes back to the file
        xlsx.writeFile(workbook, excelFilePath);

        console.log('Password successfully reset for roll number:', student.rollNumber);
        res.status(200).json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
});

// New endpoint to add academic details
app.post('/add-academic-details', jsonParser, (req, res) => {
    console.log("Received a request at /add-academic-details endpoint.");
    const academicData = req.body;
    const rollNumber = academicData.rollNumber;

    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll Number is missing.' });
    }

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'Data file not found. Cannot update.' });
    }

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return res.status(404).json({ message: 'Registrations sheet not found.' });
        }
        const students = xlsx.utils.sheet_to_json(worksheet);

        let studentFound = false;
        const updatedStudents = students.map(student => {
            if (String(student.rollNumber) === String(rollNumber)) {
                studentFound = true;
                return { ...student, ...academicData };
            }
            return student;
        });

        if (!studentFound) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const newWorksheet = xlsx.utils.json_to_sheet(updatedStudents, { header: ALL_STUDENT_HEADERS });
        workbook.Sheets[sheetName] = newWorksheet;
        xlsx.writeFile(workbook, excelFilePath);

        const finalUpdatedStudent = updatedStudents.find(s => String(s.rollNumber) === String(rollNumber));
        console.log('Academic details added for roll number:', rollNumber);
        res.status(200).json({ message: 'Academic details saved successfully.', studentData: finalUpdatedStudent });

    } catch (error) {
        console.error('Error updating academic details:', error);
        res.status(500).json({ message: 'Failed to save academic details on the server.' });
    }
});

// New endpoint to add contact and parent details
app.post('/add-contact-details', jsonParser, (req, res) => {
    console.log("Received a request at /add-contact-details endpoint.");
    const contactData = req.body;
    const rollNumber = contactData.rollNumber;

    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll Number is missing.' });
    }

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'Data file not found. Cannot update.' });
    }

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return res.status(404).json({ message: 'Registrations sheet not found.' });
        }
        const students = xlsx.utils.sheet_to_json(worksheet);

        let studentFound = false;
        const updatedStudents = students.map(student => {
            if (String(student.rollNumber) === String(rollNumber)) {
                studentFound = true;
                // Merge new contact data into the existing student record
                return { ...student, ...contactData };
            }
            return student;
        });

        if (!studentFound) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Define the complete, consistent header order
        const newWorksheet = xlsx.utils.json_to_sheet(updatedStudents, { header: ALL_STUDENT_HEADERS });
        workbook.Sheets[sheetName] = newWorksheet;

        xlsx.writeFile(workbook, excelFilePath);

        const finalUpdatedStudent = updatedStudents.find(s => String(s.rollNumber) === String(rollNumber));
        console.log('Contact details added for roll number:', rollNumber);
        res.status(200).json({ message: 'Contact details saved successfully.', studentData: finalUpdatedStudent });

    } catch (error) {
        console.error('Error updating contact details:', error);
        res.status(500).json({ message: 'Failed to save contact details on the server.' });
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
app.post('/verify-payment', jsonParser, (req, res) => {
    console.log("Received a request at /verify-payment endpoint.");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rollNumber, course } = req.body;
    const key_secret = razorpay.key_secret;

    // This is the official way to create the signature for verification
    const shasum = crypto.createHmac('sha256', key_secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = shasum.digest('hex');

    if (generated_signature === razorpay_signature) {
        console.log("Payment is successful and signature is valid.");

        try {
            const workbook = fs.existsSync(excelFilePath) ? xlsx.readFile(excelFilePath) : xlsx.utils.book_new();
            
            let updatedStudents = []; // Declare here to be accessible in the whole try block
            // --- Part 1: Save Payment History ---
            let studentName = 'N/A';
            if (workbook.Sheets[sheetName]) {
                const students = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
                const student = students.find(s => String(s.rollNumber) === String(rollNumber));
                if (student) studentName = student.name;
            }

            const paymentData = {
                rollNumber, studentName, orderId: razorpay_order_id, paymentId: razorpay_payment_id,
                amount: course.amount / 100, currency: 'INR', course: `${course.level} - ${course.branch}`,
                paymentDate: new Date().toISOString()
            };

            const paymentSheetName = 'Payments';
            const paymentHeaders = ['rollNumber', 'studentName', 'orderId', 'paymentId', 'amount', 'currency', 'course', 'paymentDate'];
            let paymentWorksheet = workbook.Sheets[paymentSheetName];
            if (!paymentWorksheet) {
                paymentWorksheet = xlsx.utils.json_to_sheet([], { header: paymentHeaders });
                xlsx.utils.book_append_sheet(workbook, paymentWorksheet, paymentSheetName);
            }
            xlsx.utils.sheet_add_json(paymentWorksheet, [paymentData], { skipHeader: true, origin: -1 });

            // --- Part 2: Update Student Record with Selected Course ---
            if (workbook.Sheets[sheetName]) {
                const students = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
                updatedStudents = students.map(student => {
                    if (String(student.rollNumber) === String(rollNumber)) {
                        // Store the entire course object as a JSON string for later retrieval
                        return { ...student, selectedCourse: JSON.stringify(course) };
                    }
                    return student;
                });
                const newStudentSheet = xlsx.utils.json_to_sheet(updatedStudents, { header: ALL_STUDENT_HEADERS });
                workbook.Sheets[sheetName] = newStudentSheet; // Replace the old sheet
            }

            // --- Part 3: Write the updated workbook to file ---
            xlsx.writeFile(workbook, excelFilePath);
            console.log('Payment history saved and student record updated for roll number:', rollNumber);

            // Find the newly updated student data to return to the client
            const finalUpdatedStudent = updatedStudents.find(s => String(s.rollNumber) === String(rollNumber));
            const { password, ...studentDataWithoutPassword } = finalUpdatedStudent || {};

            res.json({ status: 'success', orderId: razorpay_order_id, studentData: studentDataWithoutPassword });
        } catch (error) {
            console.error('Error saving payment history:', error);
            res.status(500).json({ status: 'failure', message: 'Error saving payment details.' });
        }
    } else {
        console.error("Payment verification failed. Signature mismatch.");
        res.status(400).json({ status: 'failure' });
    }
});

app.get('/payment-history/:rollNumber', (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Fetching payment history for roll number: ${rollNumber}`);

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'Data file not found.' });
    }

    try {
        const paymentSheetName = 'Payments';
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[paymentSheetName];

        if (!worksheet) {
            // If the sheet doesn't exist, it means no payments have been made yet.
            return res.json([]);
        }

        const allPayments = xlsx.utils.sheet_to_json(worksheet);
        const studentPayments = allPayments.filter(p => String(p.rollNumber) === String(rollNumber));

        res.json(studentPayments);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'Server error while fetching payment history.' });
    }
});

app.get('/student-data/:rollNumber', (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Fetching latest data for roll number: ${rollNumber}`);

    if (!fs.existsSync(excelFilePath)) {
        return res.status(404).json({ message: 'Data file not found.' });
    }

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            return res.status(404).json({ message: 'Registrations sheet not found.' });
        }

        const students = xlsx.utils.sheet_to_json(worksheet);
        const student = students.find(s => String(s.rollNumber) === String(rollNumber));

        if (student) {
            // Return the student data, but omit the password for security.
            const { password, ...studentDataWithoutPassword } = student;
            res.json({ studentData: studentDataWithoutPassword });
        } else {
            res.status(404).json({ message: 'Student not found.' });
        }
    } catch (error) {
        console.error('Error fetching student data:', error);
        res.status(500).json({ message: 'Server error while fetching student data.' });
    }
});

app.listen(port, () => {
    console.log("\n✅ Backend server is running!");
    console.log(`   Please open your web browser and go to:`);
    console.log(`   => http://localhost:${port}\n`);
});