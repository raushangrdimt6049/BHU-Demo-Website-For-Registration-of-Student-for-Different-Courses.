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
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
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

// New Multer setup for multiple document uploads
const docStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/documents/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Generate a temporary name. We will rename it in the route handler.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `temp-${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});
const docUpload = multer({ storage: docStorage });

// New Multer setup for admin profile pictures
const adminPicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/admin-pics/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const username = req.body.username.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize username
        const uniqueSuffix = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `${username}-${uniqueSuffix}${extension}`);
    }
});
const adminPicUpload = multer({ storage: adminPicStorage });

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// The root URL ('/') will now automatically serve index.html (the landing page)
// because of the express.static middleware above. No explicit route is needed.

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
        // 1. Generate unique IDs
        const enrollmentNumber = generateEnrollmentNumber();
        const rollNumber = generateRollNumber(); // Assuming these are sufficiently unique for now

        // --- Password Hashing ---
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 2. Insert the new user into the database
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
        
        // Asynchronously send welcome email and registration SMS
        sendWelcomeEmail(newStudent.email, newStudent.name);
        sendRegistrationSms(newStudent.mobilenumber, newStudent.rollnumber, newStudent.enrollmentnumber);

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
        // This is a more robust way to handle unique constraints than a pre-check.
        // It catches the error directly from the database insert attempt.
        if (error.code === '23505') { // PostgreSQL unique_violation error code
            // The constraint name depends on how the table was created.
            // These are common default names.
            if (error.constraint && error.constraint.includes('email')) {
                return res.status(409).json({ message: `Email ${email} is already registered.` });
            }
            if (error.constraint && error.constraint.includes('mobilenumber')) {
                return res.status(409).json({ message: `Mobile Number ${mobileNumber} is already registered.` });
            }
            return res.status(409).json({ message: 'A user with this email or mobile number already exists.' });
        }
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Failed to save data to the server.' });
    }
});

// --- Email Sending Function ---
async function sendWelcomeEmail(toEmail, studentName) {
    // Construct the login URL, ensuring it works in both production and development
    const loginUrl = `${process.env.BASE_URL || 'http://localhost:' + port}/login.html`;

    const mailOptions = {
        from: process.env.EMAIL_USER, // Your email address from environment variables
        to: toEmail,
        subject: 'Welcome to DAV PG College! Your Registration is Complete.',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0056b3;">Welcome to DAV PG College, Varanasi!</h2>
                <p>Dear ${studentName},</p>
                <p>We are thrilled to welcome you to our community! Your registration for the student admission portal has been successfully completed.</p>
                
                <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">How to Log In:</h3>
                <p>You can now access your student dashboard to complete your application process. Here's how:</p>
                <ol>
                    <li>Go to the student login page by clicking the link below.</li>
                    <li>Use your <strong>registered email address</strong> as the login identifier.</li>
                    <li>Enter the <strong>password</strong> you created during registration.</li>
                </ol>
                
                <p style="text-align: center; margin: 2rem 0;">
                    <a href="${loginUrl}" style="background-color: #0056b3; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Student Login</a>
                </p>
                
                <p>Once logged in, you can fill out your academic details, upload documents, and complete the admission process.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p>If you have any questions or need assistance, please do not hesitate to contact our support team.</p>
                <p><strong>Support Contact:</strong> +91-542-2450722</p>
                
                <p>Best regards,</p>
                <p><strong>The DAV PG College Admissions Team</strong></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${toEmail}`);
    } catch (error) {
        console.error(`Error sending welcome email to ${toEmail}:`, error);
    }
}

// --- SMS Sending Function (using Twilio) ---
async function sendRegistrationSms(toMobileNumber, rollNumber, enrollmentNumber) {
    // Ensure you have TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('Twilio credentials not found in .env file. Skipping SMS.');
        return;
    }

    // Initialize Twilio client here to avoid server crash if credentials are not set on startup
    const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Ensure mobile number is in E.164 format (e.g., +91XXXXXXXXXX for India)
    // This logic assumes a 10-digit Indian number. Adjust if needed for other countries.
    const formattedMobileNumber = `+91${toMobileNumber}`;
    const loginUrl = `${process.env.BASE_URL || 'http://localhost:' + port}/login.html`;
    const messageBody = `Welcome to DAV PG College! Your registration is successful. Your Roll No is ${rollNumber} and Enrollment No is ${enrollmentNumber}. Please log in with your email and the password you created. Login here: ${loginUrl}`;

    try {
        await twilioClient.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedMobileNumber
        });
        console.log(`Registration SMS sent to ${formattedMobileNumber}`);
    } catch (error) {
        // Log the error but don't fail the entire registration process if SMS fails.
        // This could be due to an invalid number, DND, or Twilio account issues.
        console.error(`Error sending registration SMS to ${formattedMobileNumber}:`, error.message);
    }
}

// --- PDF Generation Helper for Admission Summary ---
async function generateAdmissionSummaryPdf(studentData, courseData, orderId) {
    // --- 1. Generate HTML for the Admission Summary PDF ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}-${month}-${year}`;
    };
    const calculateAge = (dobString) => {
        if (!dobString) return 'N/A';
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) { age--; }
        return age >= 0 ? age : 'N/A';
    };
    const fullAddress = [studentData.addressLine1, studentData.addressLine2].filter(Boolean).join(', ');

    let profilePictureSrc = 'https://www.clipartmax.com/png/middle/323-3235972_banaras-hindu-university.png'; // Fallback
    if (studentData.profilePicture) {
        const picPath = path.join(__dirname, studentData.profilePicture);
        if (fs.existsSync(picPath)) {
            profilePictureSrc = `file:///${picPath.replace(/\\/g, '/')}`;
        }
    }

    const summaryHtmlContent = `
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Admission Summary</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; background-color: #fff; margin: 0; padding: 0; }
            .main-header { display: flex; align-items: center; padding: 1rem 2rem; background-color: rgba(255, 255, 255, 0.8); border-bottom: 2px solid #0056b3; gap: 1rem; }
            .header-branding { display: flex; align-items: center; gap: 1rem; flex-grow: 1; }
            .logo-container { flex: 0 1 80px; display: flex; justify-content: center; align-items: center; }
            .logo { max-height: 60px; width: auto; }
            .header-text { text-align: center; flex: 1; color: #002147; }
            .header-text h1 { margin-bottom: 0.25rem; font-size: 1.8rem; }
            .header-text h2 { font-size: 1.4rem; font-weight: 400; }
            .login-main { padding: 2rem; }
            .details-container { background: #fff; padding: 2.5rem; border-radius: 12px; border: 1px solid #ccc; width: 100%; max-width: 900px; margin: 0 auto; }
            .details-container h3 { text-align: center; margin-bottom: 1rem; font-size: 1.75rem; color: #333; }
            .details-container > p { text-align: center; margin-bottom: 2rem; color: #555; }
            .profile-picture-container { width: 150px; height: 150px; margin: 0 auto 2rem auto; border-radius: 50%; overflow: hidden; border: 3px solid #28a745; }
            .profile-picture { width: 100%; height: 100%; object-fit: cover; }
            .preview-section { margin-bottom: 2rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem; }
            .preview-section:last-of-type { border-bottom: none; }
            .preview-section h4 { font-size: 1.5rem; color: #0056b3; margin-bottom: 1.5rem; border-bottom: 2px solid #0056b3; padding-bottom: 0.5rem; }
            .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem; }
            .preview-field { display: flex; flex-direction: column; }
            .preview-field label { font-weight: 600; font-size: 0.9rem; color: #333; opacity: 0.8; margin-bottom: 0.25rem; }
            .preview-field span { font-size: 1.1rem; min-height: 24px; word-wrap: break-word; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style></head><body>
            <header class="main-header"><div class="header-branding"><div class="logo-container"><img src="https://media.collegedekho.com/media/img/institute/logo/1436976975.jpg" alt="DAV PG College Logo" class="logo"></div><div class="header-text"><h1>Banaras Hindu University</h1><h2>DAV PG College, Varanasi</h2></div><div class="logo-container"><img src="https://www.clipartmax.com/png/middle/323-3235972_banaras-hindu-university.png" alt="BHU Logo" class="logo"></div></div></header>
            <main class="login-main"><div class="details-container"><h3>Admission Summary</h3><p>Your application and payment have been successfully processed. This document serves as your official admission summary.</p><div class="profile-picture-container"><img src="${profilePictureSrc}" alt="Profile Picture" class="profile-picture"></div>
            <div class="preview-section"><h4>Personal Details</h4><div class="preview-grid"><div class="preview-field"><label>Full Name</label><span>${studentData.name || 'N/A'}</span></div><div class="preview-field"><label>Email</label><span>${studentData.email || 'N/A'}</span></div><div class="preview-field"><label>Roll Number</label><span>${studentData.rollNumber || 'N/A'}</span></div><div class="preview-field"><label>Enrollment Number</label><span>${studentData.enrollmentNumber || 'N/A'}</span></div><div class="preview-field"><label>Mobile Number</label><span>${studentData.mobileNumber || 'N/A'}</span></div><div class="preview-field"><label>Date of Birth</label><span>${formatDate(studentData.dob)}</span></div><div class="preview-field"><label>Age</label><span>${calculateAge(studentData.dob)}</span></div><div class="preview-field"><label>Gender</label><span>${studentData.gender || 'N/A'}</span></div></div></div>
            <div class="preview-section"><h4>Address & Parents Detail</h4><div class="preview-grid"><div class="preview-field"><label>Address</label><span>${fullAddress || 'N/A'}</span></div><div class="preview-field"><label>City</label><span>${studentData.city || 'N/A'}</span></div><div class="preview-field"><label>State</label><span>${studentData.state || 'N/A'}</span></div><div class="preview-field"><label>Pincode</label><span>${studentData.pincode || 'N/A'}</span></div><div class="preview-field"><label>Father's Name</label><span>${studentData.fatherName || 'N/A'}</span></div><div class="preview-field"><label>Father's Occupation</label><span>${studentData.fatherOccupation || 'N/A'}</span></div><div class="preview-field"><label>Mother's Name</label><span>${studentData.motherName || 'N/A'}</span></div><div class="preview-field"><label>Mother's Occupation</label><span>${studentData.motherOccupation || 'N/A'}</span></div><div class="preview-field"><label>Parent's Mobile</label><span>${studentData.parentMobile || 'N/A'}</span></div></div></div>
            <div class="preview-section"><h4>Academic Details</h4><div class="preview-grid"><div class="preview-field"><label>10th Board</label><span>${studentData.board10 || 'N/A'}</span></div><div class="preview-field"><label>10th Percentage</label><span>${studentData.percentage10 ? `${studentData.percentage10}%` : 'N/A'}</span></div><div class="preview-field"><label>10th Passing Year</label><span>${studentData.year10 || 'N/A'}</span></div><div class="preview-field"><label>12th Board</label><span>${studentData.board12 || 'N/A'}</span></div><div class="preview-field"><label>12th Percentage</label><span>${studentData.percentage12 ? `${studentData.percentage12}%` : 'N/A'}</span></div><div class="preview-field"><label>12th Passing Year</label><span>${studentData.year12 || 'N/A'}</span></div></div></div>
            <div class="preview-section"><h4>Payment & Course Details</h4><div class="preview-grid"><div class="preview-field"><label>Course Enrolled</label><span>${courseData.level} - ${courseData.branch}</span></div><div class="preview-field"><label>Amount Paid</label><span>₹ ${(courseData.amount / 100).toLocaleString('en-IN')}</span></div><div class="preview-field"><label>Order ID</label><span>${orderId || 'N/A'}</span></div><div class="preview-field"><label>Payment Status</label><span style="color: #28a745; font-weight: bold;">Successful</span></div><div class="preview-field"><label>Transaction Date</label><span>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div></div></div>
            <div class="footer"><p>This is a computer-generated document and does not require a signature.</p></div></div></main></body></html>`;

    // --- 2. Generate PDF ---
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    await page.setContent(summaryHtmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });

    await browser.close();
    return pdfBuffer;
}

// --- Admission Summary Email Function ---
async function sendAdmissionSummaryEmail(studentData, courseData, orderId) {
    const toEmail = studentData.email;
    const studentName = studentData.name;

    try {
        const summaryPdfBuffer = await generateAdmissionSummaryPdf(studentData, courseData, orderId);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: `Your Admission Summary for ${studentName}`,
            html: `<p>Dear ${studentName},</p><p>Congratulations! Your admission process is complete.</p><p>Please find your detailed <strong>Admission Summary</strong> attached to this email for your records.</p><p>Best regards,</p><p><strong>The DAV PG College Admissions Team</strong></p>`,
            attachments: [{
                filename: `Admission_Summary_${studentData.rollNumber}.pdf`,
                content: summaryPdfBuffer,
                contentType: 'application/pdf'
            }]
        };
        await transporter.sendMail(mailOptions);
        console.log(`Admission summary email sent successfully to ${toEmail}`);
    } catch (error) {
        console.error(`Failed to send admission summary email to ${toEmail}:`, error);
    }
}

// --- Payment Receipt Email Function ---
async function sendPaymentReceiptEmail(studentData, courseData, orderId) {
    const toEmail = studentData.email;
    const studentName = studentData.name;

    // --- 1. Generate HTML for the Payment Receipt PDF ---
    const receiptHtmlContent = `
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Payment Receipt</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9; }
            .receipt-container { max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; padding: 30px; background-color: #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
            h2 { text-align: center; color: #28a745; font-size: 24px; margin-bottom: 10px; }
            p { text-align: center; color: #555; margin-bottom: 25px; }
            .receipt-details { border-top: 2px dashed #ccc; padding-top: 20px; }
            .receipt-details h3 { text-align: center; margin-bottom: 20px; font-size: 20px; color: #0056b3; }
            .detail-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
            .detail-item:last-child { border-bottom: none; }
            .detail-item span:first-child { font-weight: 600; color: #444; }
            .detail-item span:last-child { font-weight: 500; text-align: right; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style></head><body>
            <div class="receipt-container">
                <h2>Payment Successful!</h2>
                <p>Thank you for your payment. Here is a summary of your transaction.</p>
                <div class="receipt-details">
                    <h3>Payment Receipt</h3>
                    <div class="detail-item"><span>Order ID:</span><span>${orderId}</span></div>
                    <div class="detail-item"><span>Payment Date:</span><span>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <div class="detail-item"><span>Amount Paid:</span><span>₹ ${(courseData.amount / 100).toLocaleString('en-IN')}</span></div>
                    <div class="detail-item"><span>Course Details:</span><span>${courseData.level} - ${courseData.branch}</span></div>
                    <div class="detail-item"><span>Paid By:</span><span>${studentName}</span></div>
                </div>
                <div class="footer"><p>This is a computer-generated receipt.</p></div>
            </div>
        </body></html>`;

    // --- 2. Generate PDF and Send Email ---
    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();

        await page.setContent(receiptHtmlContent, { waitUntil: 'networkidle0' });
        const receiptPdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: `Payment Receipt for Your Admission Fee`,
            html: `<p>Dear ${studentName},</p><p>Thank you for your payment. Your transaction was successful.</p><p>Please find your <strong>Payment Receipt</strong> attached to this email for your records.</p><p>Best regards,</p><p><strong>The DAV PG College Admissions Team</strong></p>`,
            attachments: [{
                filename: `Payment_Receipt_${orderId}.pdf`,
                content: receiptPdfBuffer,
                contentType: 'application/pdf'
            }]
        };
        await transporter.sendMail(mailOptions);
        console.log(`Payment receipt email sent successfully to ${toEmail}`);
    } catch (error) {
        console.error(`Failed to send payment receipt email to ${toEmail}:`, error);
    }
}

// --- PDF Generation Helper for Payment History ---
async function generatePaymentHistoryPdf(studentName, rollNumber, history) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    let tableRows = '';
    if (history.length > 0) {
        history.forEach(record => {
            const statusClass = record.status === 'success' ? 'status-success' : 'status-failure';
            tableRows += `
                <tr>
                    <td>${record.paymentId || 'N/A'}</td>
                    <td>${record.orderId || 'N/A'}</td>
                    <td>${record.course || 'N/A'}</td>
                    <td>₹${record.amount ? parseFloat(record.amount).toFixed(2) : '0.00'}</td>
                    <td>${formatDate(record.paymentDate)}</td>
                    <td class="${statusClass}">${record.status || 'N/A'}</td>
                </tr>
            `;
        });
    } else {
        tableRows = '<tr><td colspan="6" style="text-align: center;">No payment history found.</td></tr>';
    }

    const historyHtmlContent = `
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Payment History</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333; margin: 0; padding: 20px; background-color: #fff; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
            .header h1 { color: #002147; margin: 0; }
            .header h2 { font-weight: 400; margin: 5px 0 0 0; }
            .student-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: 600; }
            .status-success { color: #155724; background-color: #d4edda; text-transform: capitalize; }
            .status-failure { color: #721c24; background-color: #f8d7da; text-transform: capitalize; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style></head><body>
            <div class="container">
                <div class="header"><h1>DAV PG College, Varanasi</h1><h2>Payment History Report</h2></div>
                <div class="student-info"><p><strong>Student Name:</strong> ${studentName}</p><p><strong>Roll Number:</strong> ${rollNumber}</p><p><strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                <table><thead><tr><th>Payment ID</th><th>Order ID</th><th>Details</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
                <div class="footer"><p>This is a computer-generated document.</p></div>
            </div>
        </body></html>`;

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    await page.setContent(historyHtmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
    await browser.close();
    return pdfBuffer;
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

// New endpoint for handling multiple document uploads
app.post('/upload-documents', docUpload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'marksheet10', maxCount: 1 },
    { name: 'marksheet12', maxCount: 1 }
]), async (req, res) => {
    console.log("Received a request at /upload-documents endpoint.");
    const { rollNumber } = req.body;

    if (!rollNumber) {
        // Clean up any uploaded files if roll number is missing
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => fs.unlinkSync(file.path));
            });
        }
        return res.status(400).json({ message: 'Roll number is required to upload documents.' });
    }

    const filePaths = {};
    try {
        const studentDocDir = path.join(__dirname, 'uploads', 'documents', rollNumber);
        // Create the student-specific directory. The recursive option prevents errors if it already exists.
        fs.mkdirSync(studentDocDir, { recursive: true });

        if (!req.files || Object.keys(req.files).length === 0) {
            // This can happen if the form is submitted with no files, possibly due to a network issue or malformed request.
            // The frontend 'required' attribute should prevent this, but this is a necessary server-side safeguard.
            throw new Error("No files were uploaded. Please select all required documents and try again.");
        }

        const renamePromises = Object.keys(req.files).map(fieldname => {
            return new Promise((resolve, reject) => {
                const file = req.files[fieldname][0];
                const newFileName = `${fieldname}${path.extname(file.originalname)}`;
                const newPath = path.join(studentDocDir, newFileName); // studentDocDir is now defined inside the try block

                fs.rename(file.path, newPath, (err) => {
                    if (err) {
                        console.error(`Error renaming file for ${fieldname}:`, err);
                        return reject(new Error(`Could not process ${fieldname} upload.`));
                    }
                    filePaths[fieldname] = `/uploads/documents/${rollNumber}/${newFileName}`.replace(/\\/g, "/");
                    resolve();
                });
            });
        });
        await Promise.all(renamePromises);

        // --- Fetch existing paths and merge with new ones ---
        const existingPathsResult = await pool.query(
            'SELECT profilepicture, signature, marksheet10, marksheet12 FROM students WHERE rollnumber = $1',
            [rollNumber]
        );

        if (existingPathsResult.rows.length === 0) {
            throw new Error('Student not found when fetching existing documents.');
        }
        const existingPaths = existingPathsResult.rows[0];

        // Merge new paths over existing ones. If a new path is undefined, the existing one is used.
        const finalFilePaths = {
            profilePicture: filePaths.profilePicture || existingPaths.profilepicture,
            signature: filePaths.signature || existingPaths.signature,
            marksheet10: filePaths.marksheet10 || existingPaths.marksheet10,
            marksheet12: filePaths.marksheet12 || existingPaths.marksheet12
        };

        const query = `
            UPDATE students 
            SET profilepicture=$1, signature=$2, marksheet10=$3, marksheet12=$4, updatedat=CURRENT_TIMESTAMP
            WHERE rollnumber = $5
            RETURNING *;
        `;
        const values = [finalFilePaths.profilePicture, finalFilePaths.signature, finalFilePaths.marksheet10, finalFilePaths.marksheet12, rollNumber];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            throw new Error('Student not found during database update.');
        }

        const finalUpdatedStudent = rows[0];
        delete finalUpdatedStudent.passwordhash;
        console.log('Documents uploaded and paths saved for roll number:', rollNumber);
        res.status(200).json({ message: 'Documents uploaded successfully.', studentData: mapDbToCamelCase(finalUpdatedStudent) });
    } catch (error) {
        // --- IMPORTANT: Cleanup uploaded files on error ---
        // Cleanup renamed files
        Object.values(filePaths).forEach(filePath => {
            const serverPath = path.join(__dirname, filePath);
            if (fs.existsSync(serverPath)) {
                fs.unlinkSync(serverPath);
            }
        });
        // Cleanup any temp files that might not have been renamed
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
        }

        console.error('Error processing document uploads:', error);
        res.status(500).json({ message: error.message || 'Failed to upload documents.' });
    }
});

// POST endpoint to handle login
app.post('/login', jsonParser, async (req, res) => {
    console.log("Received a request at /login endpoint.");
    const { loginIdentifier, password } = req.body;
    console.log(`Login attempt for identifier: ${loginIdentifier}`);

    try {
        const query = 'SELECT * FROM students WHERE email = $1';
        const { rows } = await pool.query(query, [loginIdentifier.toLowerCase()]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email not found.' });
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
        const query = 'SELECT * FROM students WHERE email = $1 AND securityquestion = $2';
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
    const { rollNumber, board10, marks10, totalMarks10, percentage10, year10, board12, marks12, totalMarks12, percentage12, year12 } = req.body;

    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll Number is missing.' });
    }

    try {
        const query = `
            UPDATE students 
            SET 
                board10=$1, marks10=$2, totalmarks10=$3, percentage10=$4, year10=$5, 
                board12=$6, marks12=$7, totalmarks12=$8, percentage12=$9, year12=$10, 
                updatedat=CURRENT_TIMESTAMP
            WHERE rollnumber = $11
            RETURNING *;
        `;
        const values = [
            board10, marks10, totalMarks10, percentage10, year10, 
            board12, marks12, totalMarks12, percentage12, year12, 
            rollNumber
        ];
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

            const finalUpdatedStudent = studentUpdateResult.rows[0];
            delete finalUpdatedStudent.passwordhash;
            console.log('Payment history saved and student record updated for roll number:', rollNumber);
            // Asynchronously send the admission summary and receipt emails separately
            const studentDataForEmail = mapDbToCamelCase(finalUpdatedStudent);
            sendAdmissionSummaryEmail(studentDataForEmail, course, razorpay_order_id);
            sendPaymentReceiptEmail(studentDataForEmail, course, razorpay_order_id);

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
        // --- NEW: Log failed payment attempt ---
        try {
            const studentResult = await pool.query('SELECT name FROM students WHERE rollnumber = $1', [rollNumber]);
            const studentName = studentResult.rows.length > 0 ? studentResult.rows[0].name : 'N/A';

            const paymentQuery = `
                INSERT INTO payments (paymentid, orderid, studentrollnumber, studentname, coursedetails, amount, currency, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `;
            const paymentValues = [
                razorpay_payment_id,
                razorpay_order_id,
                rollNumber,
                studentName,
                `${course.level} - ${course.branch}`,
                course.amount / 100,
                'INR',
                'failure'
            ];
            await pool.query(paymentQuery, paymentValues);
            console.log(`Logged failed payment attempt for order ${razorpay_order_id}`);
        } catch (dbError) {
            console.error('Error saving failed payment record:', dbError);
        }
        res.status(400).json({ status: 'failure', message: 'Payment verification failed. Signature mismatch.' });
    }
});

// POST endpoint to verify HOBBY COURSE payment signature
app.post('/verify-hobby-payment', jsonParser, async (req, res) => {
    console.log("Received a request at /verify-hobby-payment endpoint.");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rollNumber, course } = req.body;
    const key_secret = razorpay.key_secret;

    const shasum = crypto.createHmac('sha256', key_secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = shasum.digest('hex');

    if (generated_signature === razorpay_signature) {
        console.log("Hobby course payment is successful and signature is valid.");

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // --- Part 1: Get current student data ---
            const studentResult = await client.query('SELECT name, hobbycourses FROM students WHERE rollnumber = $1', [rollNumber]);
            if (studentResult.rows.length === 0) {
                throw new Error('Student not found during payment verification.');
            }
            const studentName = studentResult.rows[0].name;
            // Get existing hobby courses, defaulting to an empty array if null/undefined
            const existingHobbyCourses = studentResult.rows[0].hobbycourses || [];

            // --- Part 2: Save Payment History ---
            const paymentQuery = `
                INSERT INTO payments (paymentid, orderid, studentrollnumber, studentname, coursedetails, amount, currency, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `;
            const paymentValues = [
                razorpay_payment_id, razorpay_order_id, rollNumber, studentName,
                `${course.name} (Hobby)`, course.fee / 100, 'INR', 'success'
            ];
            await client.query(paymentQuery, paymentValues);

            // --- Part 3: Update Student Record with the new hobby course ---
            // Add the new course to the array of existing courses
            const updatedHobbyCourses = [...existingHobbyCourses, course];

            const updateStudentQuery = `
                UPDATE students 
                SET hobbycourses = $1, updatedat = CURRENT_TIMESTAMP 
                WHERE rollnumber = $2 
                RETURNING *;
            `;
            const studentUpdateResult = await client.query(updateStudentQuery, [JSON.stringify(updatedHobbyCourses), rollNumber]);

            // --- Part 4: Create Notification ---
            const notificationMessage = `You have successfully enrolled in the "${course.name}" course.`;
            const notificationQuery = `
                INSERT INTO notifications (studentrollnumber, type, message, link)
                VALUES ($1, 'new_course', $2, '#');
            `;
            await client.query(notificationQuery, [rollNumber, notificationMessage]);

            await client.query('COMMIT');

            const finalUpdatedStudent = studentUpdateResult.rows[0];
            delete finalUpdatedStudent.passwordhash;
            console.log(`Hobby course payment and notification saved for roll number: ${rollNumber}`);
            
            res.json({ status: 'success', orderId: razorpay_order_id, studentData: mapDbToCamelCase(finalUpdatedStudent) });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error saving hobby course payment:', error);
            res.status(500).json({ status: 'failure', message: 'Error saving payment details.' });
        } finally {
            client.release();
        }
    } else {
        console.error("Hobby course payment verification failed. Signature mismatch.");
        // --- NEW: Log failed payment attempt ---
        try {
            const studentResult = await pool.query('SELECT name FROM students WHERE rollnumber = $1', [rollNumber]);
            const studentName = studentResult.rows.length > 0 ? studentResult.rows[0].name : 'N/A';

            const paymentQuery = `
                INSERT INTO payments (paymentid, orderid, studentrollnumber, studentname, coursedetails, amount, currency, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `;
            const paymentValues = [
                razorpay_payment_id,
                razorpay_order_id,
                rollNumber,
                studentName,
                `${course.name} (Hobby)`,
                course.fee / 100,
                'INR',
                'failure'
            ];
            await pool.query(paymentQuery, paymentValues);
            console.log(`Logged failed hobby course payment attempt for order ${razorpay_order_id}`);
        } catch (dbError) {
            console.error('Error saving failed hobby course payment record:', dbError);
        }
        res.status(400).json({ status: 'failure', message: 'Payment verification failed. Signature mismatch.' });
    }
});

// GET endpoint to fetch all notifications for a student
app.get('/api/notifications/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    try {
        const query = 'SELECT * FROM notifications WHERE studentrollnumber = $1 ORDER BY createdat DESC';
        const { rows } = await pool.query(query, [rollNumber]);
        res.json(rows.map(n => mapDbToCamelCase(n)));
    } catch (error) {
        console.error(`Error fetching notifications for ${rollNumber}:`, error);
        res.status(500).json({ message: 'Server error while fetching notifications.' });
    }
});

// POST endpoint to mark notifications as read
app.post('/api/notifications/mark-as-read', jsonParser, async (req, res) => {
    const { notificationIds } = req.body; // Expect an array of IDs
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ message: 'Notification IDs are required.' });
    }

    try {
        // Use ANY($1::int[]) to efficiently update multiple rows
        const query = 'UPDATE notifications SET isread = TRUE WHERE id = ANY($1::int[])';
        const result = await pool.query(query, [notificationIds]);
        
        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Notifications marked as read.' });
        } else {
            res.status(404).json({ message: 'No matching notifications found to update.' });
        }
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error while updating notifications.' });
    }
});

app.get('/payment-history/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Fetching payment history for roll number: ${rollNumber}`);

    try {
        const query = 'SELECT * FROM payments WHERE studentrollnumber = $1 ORDER BY paymentdate DESC';
        const { rows } = await pool.query(query, [rollNumber]);
        // Map database keys (lowercase) to camelCase for frontend consistency
        const mappedRows = rows.map(payment => ({
            paymentId: payment.paymentid,
            orderId: payment.orderid,
            studentRollNumber: payment.studentrollnumber,
            studentName: payment.studentname,
            course: payment.coursedetails, // Rename for clarity on frontend
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentDate: payment.paymentdate
        }));
        res.json(mappedRows);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'Server error while fetching payment history.' });
    }
});

// New endpoint to download payment history as PDF
app.get('/download-payment-history/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Received request to download payment history PDF for roll number: ${rollNumber}`);

    try {
        // Fetch student name and payment history in parallel
        const studentQuery = pool.query('SELECT name FROM students WHERE rollnumber = $1', [rollNumber]);
        const historyQuery = pool.query('SELECT * FROM payments WHERE studentrollnumber = $1 ORDER BY paymentdate DESC', [rollNumber]);

        const [studentResult, historyResult] = await Promise.all([studentQuery, historyQuery]);

        if (studentResult.rows.length === 0) {
            return res.status(404).send('Student not found.');
        }
        const studentName = studentResult.rows[0].name;
        
        // Map DB rows to camelCase for consistency
        const history = historyResult.rows.map(payment => ({
            paymentId: payment.paymentid,
            orderId: payment.orderid,
            course: payment.coursedetails,
            amount: payment.amount,
            status: payment.status,
            paymentDate: payment.paymentdate
        }));

        const pdfBuffer = await generatePaymentHistoryPdf(studentName, rollNumber, history);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Payment_History_${rollNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating payment history PDF:', error);
        res.status(500).send('Could not generate PDF. Please try again later.');
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

// New endpoint to get history of admin notices
app.get('/api/admin/notices', async (req, res) => {
    console.log('Fetching history of admin notices.');
    try {
        // Group by message and get the most recent creation date for each unique message.
        const query = `
            SELECT message, MAX(createdat) as createdat
            FROM notifications
            WHERE type = 'admin_notice'
            GROUP BY message
            ORDER BY MAX(createdat) DESC;
        `;
        const { rows } = await pool.query(query);
        // The mapDbToCamelCase function will correctly handle 'createdat'
        res.json(rows.map(notice => mapDbToCamelCase(notice)));
    } catch (error) {
        console.error('Error fetching admin notice history:', error);
        res.status(500).json({ message: 'Server error while fetching notice history.' });
    }
});

// New endpoint for admin to search for users (students and faculty)
app.get('/api/admin/search-users', async (req, res) => {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
        return res.json([]); // Return empty if query is too short
    }
    console.log(`Admin searching for user with query: ${query}`);

    const searchTerm = `%${query.trim()}%`;

    try {
        const studentQuery = pool.query(
            "SELECT name, rollnumber as identifier, 'Student' as type FROM students WHERE name ILIKE $1 LIMIT 5",
            [searchTerm]
        );

        const facultyQuery = pool.query(
            "SELECT name, username as identifier, 'Faculty' as type FROM faculty WHERE name ILIKE $1 LIMIT 5",
            [searchTerm]
        );

        const [studentResults, facultyResults] = await Promise.all([studentQuery, facultyQuery]);

        const combinedResults = [...studentResults.rows, ...facultyResults.rows];
        
        res.json(combinedResults);
    } catch (error) {
        console.error('Error during user search:', error);
        res.status(500).json({ message: 'Server error during search.' });
    }
});

// New endpoint to get full details for a specific faculty member
app.get('/api/faculty/:identifier', async (req, res) => {
    const { identifier } = req.params;
    console.log(`Fetching full details for faculty: ${identifier}`);

    try {
        const query = 'SELECT id, username, name, email, createdat FROM faculty WHERE username = $1 OR id::text = $1';
        const { rows } = await pool.query(query, [identifier]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Faculty member not found.' });
        }

        res.json(mapDbToCamelCase(rows[0]));
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({ message: 'Server error while fetching faculty details.' });
    }
});

// New endpoint to get all faculty records for an admin view
app.get('/api/all-faculty', async (req, res) => {
    console.log('Fetching all faculty records for admin view.');
    try {
        // Select all relevant fields, but EXCLUDE the password hash and security answers for safety.
        const query = `
            SELECT 
                username, name, email, createdat 
            FROM faculty 
            ORDER BY createdat DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows.map(faculty => mapDbToCamelCase(faculty)));
    } catch (error) {
        console.error('Error fetching all faculty data:', error);
        res.status(500).json({ message: 'Server error while fetching all faculty data.' });
    }
});

// New endpoint for admin to send a notification to all students
app.post('/api/admin/send-notification', jsonParser, async (req, res) => {
    const { message } = req.body;
    console.log(`Received request to send notice to all students: "${message}"`);

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'Notification message cannot be empty.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get all student roll numbers to ensure there are students to notify
        const { rows: students } = await client.query('SELECT rollnumber FROM students');
        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found to send notifications to.' });
        }

        // 2. Prepare a single, efficient query to insert notifications for all students
        const notificationQuery = `
            INSERT INTO notifications (studentrollnumber, type, message, link)
            SELECT rollnumber, 'admin_notice', $1, '#'
            FROM students;
        `;
        const result = await client.query(notificationQuery, [message.trim()]);

        await client.query('COMMIT');

        console.log(`Successfully created ${result.rowCount} notifications for all students.`);
        res.status(200).json({ message: `Notice successfully sent to ${result.rowCount} students.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error sending notification to all students:', error);
        res.status(500).json({ message: 'Server error while sending notifications.' });
    } finally {
        client.release();
    }
});

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

// New endpoint to delete a student record
app.delete('/api/student/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Received request to delete student with roll number: ${rollNumber}`);

    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll number is required.' });
    }

    const client = await pool.connect();
    try {
        // --- Step 1: Fetch file paths BEFORE deleting the record ---
        const studentRes = await client.query(
            'SELECT profilepicture FROM students WHERE rollnumber = $1',
            [rollNumber]
        );

        if (studentRes.rowCount === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        const studentFiles = studentRes.rows[0];

        // --- Step 2: Perform database deletions in a transaction ---
        await client.query('BEGIN');

        // Optional but good practice: Delete related payment records first
        await client.query('DELETE FROM payments WHERE studentrollnumber = $1', [rollNumber]);

        // Delete the student record
        await client.query('DELETE FROM students WHERE rollnumber = $1', [rollNumber]);

        await client.query('COMMIT');
        console.log(`Successfully deleted DB records for student ${rollNumber}.`);

        // --- Step 3: Delete associated files from the filesystem AFTER successful commit ---
        try {
            // Delete the student's profile picture if it exists
            if (studentFiles.profilepicture) {
                const profilePicPath = path.join(__dirname, studentFiles.profilepicture);
                // Use fs.promises.unlink and ignore "file not found" errors
                await fs.promises.unlink(profilePicPath).catch(err => { if (err.code !== 'ENOENT') throw err; });
                console.log(`Cleaned up profile picture for ${rollNumber}.`);
            }

            // Delete the entire document directory for the student.
            // The `force: true` option prevents an error if the directory doesn't exist.
            const studentDocDir = path.join(__dirname, 'uploads', 'documents', rollNumber);
            await fs.promises.rm(studentDocDir, { recursive: true, force: true });
            console.log(`Cleaned up document directory for ${rollNumber}.`);
        } catch (fileError) {
            // Log the error, but don't fail the request since the DB record is already gone.
            console.error(`Error during file cleanup for ${rollNumber}:`, fileError);
        }

        res.status(200).json({ message: `Student with roll number ${rollNumber} has been deleted successfully.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error while deleting student.' });
    } finally {
        client.release();
    }
});

// New endpoint to update a student record from the admin page
app.put('/api/student/:rollNumber', jsonParser, async (req, res) => {
    const { rollNumber } = req.params;
    const { name, email, mobileNumber, city } = req.body;
    console.log(`Received request to update student with roll number: ${rollNumber}`);

    if (!rollNumber) {
        return res.status(400).json({ message: 'Roll number is required.' });
    }

    try {
        // Dynamically build the update query to only change provided fields
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); values.push(name); }
        if (email !== undefined) { updateFields.push(`email = $${paramIndex++}`); values.push(email.toLowerCase()); }
        if (mobileNumber !== undefined) { updateFields.push(`mobilenumber = $${paramIndex++}`); values.push(mobileNumber); }
        if (city !== undefined) { updateFields.push(`city = $${paramIndex++}`); values.push(city); }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update provided.' });
        }

        values.push(rollNumber); // Add the roll number for the WHERE clause
        const query = `
            UPDATE students 
            SET ${updateFields.join(', ')}, updatedat = CURRENT_TIMESTAMP 
            WHERE rollnumber = $${paramIndex} 
            RETURNING enrollmentnumber, rollnumber, name, email, gender, mobilenumber, city, createdat;
        `;

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const updatedStudent = rows[0];
        console.log(`Successfully updated student ${rollNumber}.`);
        res.status(200).json({ 
            message: 'Student details updated successfully.',
            studentData: mapDbToCamelCase(updatedStudent) // Send back the updated data
        });

    } catch (error) {
        // Handle potential unique constraint violations (e.g., if email is changed to an existing one)
        if (error.code === '23505') {
            return res.status(409).json({ message: 'An account with the provided email or mobile number already exists.' });
        }
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Server error while updating student.' });
    }
});

// New endpoint for admin login
app.post('/api/admin/login', jsonParser, async (req, res) => {
    const { username, password } = req.body;
    console.log(`Admin login attempt for: ${username}`);

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // --- Special Case for Primary Admin ---
    if (username.toLowerCase() === 'raushan_143' && password === '4gh4m01r') {
        console.log('Primary admin login successful.');
        try {
            // Fetch the user's data from the DB to ensure consistency, but bypass password check.
            const { rows } = await pool.query('SELECT * FROM admins WHERE LOWER(username) = LOWER($1)', [username]);
            if (rows.length > 0) {
                const admin = rows[0];
                delete admin.passwordhash;
                return res.status(200).json({ message: 'Login successful', adminData: mapDbToCamelCase(admin) });
            } else {
                // If the primary admin is not in the DB for some reason, create a mock object.
                const adminData = { name: 'Raushan Kumar', username: 'raushan_143' };
                return res.status(200).json({ message: 'Login successful', adminData: adminData });
            }
        } catch (dbError) {
            console.error('DB error during primary admin login:', dbError);
            // Fallback to mock object if DB fails
            const adminData = { name: 'Raushan Kumar', username: 'raushan_143' };
            return res.status(200).json({ message: 'Login successful', adminData: adminData });
        }
    }

    try {
        const query = 'SELECT * FROM admins WHERE LOWER(username) = LOWER($1)';
        const { rows } = await pool.query(query, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Incorrect username or password.' });
        }

        const admin = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, admin.passwordhash);

        if (isPasswordMatch) {
            delete admin.passwordhash;
            res.status(200).json({ message: 'Login successful', adminData: mapDbToCamelCase(admin) });
        } else {
            res.status(401).json({ message: 'Incorrect username or password.' });
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// New endpoint to get details for the logged-in admin
app.get('/api/admin/me', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'Username is required.' });

    try {
        const query = 'SELECT id, name, username, email, mobilenumber, profilepicture FROM admins WHERE LOWER(username) = LOWER($1)';
        const { rows } = await pool.query(query, [username]);
        if (rows.length === 0) return res.status(404).json({ message: 'Admin not found.' });
        res.status(200).json(mapDbToCamelCase(rows[0]));
    } catch (error) {
        console.error('Error fetching admin details:', error);
        res.status(500).json({ message: 'Server error while fetching admin details.' });
    }
});

// New endpoint to update admin settings
app.post('/api/admin/update-settings', jsonParser, async (req, res) => {
    const { username, name, email, mobileNumber, currentPassword, newPassword } = req.body;
    console.log(`Updating settings for admin: ${username}`);

    if (!username || !currentPassword) {
        return res.status(400).json({ message: 'Username and Current Password are required to save changes.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const adminRes = await client.query('SELECT * FROM admins WHERE LOWER(username) = LOWER($1)', [username]);
        if (adminRes.rows.length === 0) throw new Error('Admin user not found.');

        const admin = adminRes.rows[0];
        
        let isPasswordMatch = false;
        // Special check for the primary admin's master password
        if (username.toLowerCase() === 'raushan_143' && currentPassword === '4gh4m01r') {
            isPasswordMatch = true;
        } else {
            // For all other cases, use bcrypt against the stored hash
            isPasswordMatch = await bcrypt.compare(currentPassword, admin.passwordhash);
        }

        if (!isPasswordMatch) throw new Error('Incorrect current password.');

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (name) { updateFields.push(`name = $${paramIndex++}`); values.push(name); }
        if (email) { updateFields.push(`email = $${paramIndex++}`); values.push(email); }
        if (mobileNumber) { updateFields.push(`mobilenumber = $${paramIndex++}`); values.push(mobileNumber); }
        if (newPassword) {
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
            updateFields.push(`passwordhash = $${paramIndex++}`);
            values.push(newPasswordHash);
        }

        if (updateFields.length === 0) {
            return res.status(200).json({ message: 'No changes were made.', adminData: admin });
        }

        values.push(username);
        const query = `UPDATE admins SET ${updateFields.join(', ')}, updatedat = CURRENT_TIMESTAMP WHERE LOWER(username) = LOWER($${paramIndex}) RETURNING *;`;
        const { rows } = await client.query(query, values);

        await client.query('COMMIT');
        const updatedAdmin = rows[0];
        delete updatedAdmin.passwordhash;
        res.status(200).json({ message: 'Settings updated successfully!', adminData: mapDbToCamelCase(updatedAdmin) });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating admin settings:', error);
        res.status(500).json({ message: error.message || 'Server error during update.' });
    } finally {
        client.release();
    }
});

// New endpoint to get all admin users
app.get('/api/admins', async (req, res) => {
    console.log('Fetching all admin users.');
    try {
        const { rows } = await pool.query('SELECT id, name, username, profilepicture FROM admins ORDER BY name');
        res.status(200).json(rows.map(admin => mapDbToCamelCase(admin)));
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ message: 'Server error while fetching admins.' });
    }
});

// New endpoint to add a new admin user
app.post('/api/admin/add-admin', jsonParser, async (req, res) => {
    const { name, username, password } = req.body;
    console.log(`Request to add new admin: ${username}`);

    if (!name || !username || !password) {
        return res.status(400).json({ message: 'Name, username, and password are required.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const query = `INSERT INTO admins (name, username, passwordhash) VALUES ($1, $2, $3) RETURNING id, name, username, profilepicture;`;
        const { rows } = await pool.query(query, [name, username.toLowerCase(), passwordHash]);
        res.status(201).json({ message: `Admin user '${username}' created successfully.`, adminData: mapDbToCamelCase(rows[0]) });
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'An admin with this username already exists.' });
        }
        console.error('Error adding admin:', error);
        res.status(500).json({ message: 'Server error while creating admin.' });
    }
});

// New endpoint to delete an admin user
app.delete('/api/admin/delete/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`Received request to delete admin with username: ${username}`);

    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    // Basic safeguard to prevent deletion of the main admin account
    if (username.toLowerCase() === 'raushan_143') {
        return res.status(403).json({ message: 'Cannot delete the primary administrator account.' });
    }

    try {
        const result = await pool.query('DELETE FROM admins WHERE LOWER(username) = LOWER($1)', [username]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Admin user not found.' });
        }
        res.status(200).json({ message: `Admin user "${username}" has been deleted successfully.` });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ message: 'Server error while deleting admin user.' });
    }
});

// New endpoint for admin to add a faculty user
app.post('/api/admin/add-user', jsonParser, async (req, res) => {
    const { name, username, email, password } = req.body;
    console.log(`Admin request to add new faculty user: ${username}`);

    if (!name || !username || !email || !password) {
        return res.status(400).json({ message: 'Name, username, email, and password are required.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        // We set isprofilecomplete to false, so the faculty member is forced to update details on first login.
        // We leave security question/answer as null.
        const query = `
            INSERT INTO faculty (name, username, email, passwordhash, isprofilecomplete)
            VALUES ($1, $2, $3, $4, FALSE)
            RETURNING id, name, username, email;
        `;
        const values = [name, username.toLowerCase(), email.toLowerCase(), passwordHash];
        const { rows } = await pool.query(query, values);
        
        console.log(`Faculty member ${username} created successfully by admin.`);
        res.status(201).json({ message: `Faculty user '${rows[0].username}' created successfully.`, facultyData: rows[0] });
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'A faculty member with this username or email already exists.' });
        }
        console.error('Error during admin-add-user:', error);
        res.status(500).json({ message: 'Server error during user creation.' });
    }
});

// New endpoint for faculty to complete their profile
app.post('/api/faculty/complete-profile', jsonParser, async (req, res) => {
    const { 
        username, currentPassword, newPassword, 
        email, mobileNumber, dob, teacherChoice, subject 
    } = req.body;
    console.log(`Profile completion attempt for faculty: ${username}`);

    if (!username || !currentPassword || !newPassword || !email || !mobileNumber || !dob || !teacherChoice || !subject) {
        return res.status(400).json({ message: 'All fields are required to complete your profile.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const facultyRes = await client.query('SELECT * FROM faculty WHERE username = $1', [username]);
        if (facultyRes.rows.length === 0) {
            throw new Error('Faculty member not found.');
        }
        const faculty = facultyRes.rows[0];

        const isPasswordMatch = await bcrypt.compare(currentPassword, faculty.passwordhash);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        const updateQuery = `
            UPDATE faculty 
            SET email = $1, mobilenumber = $2, dob = $3, teacherchoice = $4, subject = $5, 
                passwordhash = $6, isprofilecomplete = TRUE, updatedat = CURRENT_TIMESTAMP
            WHERE username = $7
            RETURNING *;
        `;
        const values = [email.toLowerCase(), mobileNumber, dob, teacherChoice, subject, newPasswordHash, username];
        const updatedResult = await client.query(updateQuery, values);

        await client.query('COMMIT');

        const updatedFaculty = updatedResult.rows[0];
        delete updatedFaculty.passwordhash;
        res.status(200).json({ message: 'Profile updated successfully!', facultyData: mapDbToCamelCase(updatedFaculty) });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error completing faculty profile:', error);
        res.status(500).json({ message: 'Server error during profile update.' });
    } finally {
        client.release();
    }
});

// New endpoint to get details for the logged-in faculty member
app.get('/api/faculty/me', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'Username is required.' });

    try {
        const query = 'SELECT id, name, username, email, mobilenumber, teacherchoice, profilepicture FROM faculty WHERE LOWER(username) = LOWER($1)';
        const { rows } = await pool.query(query, [username]);
        if (rows.length === 0) return res.status(404).json({ message: 'Faculty not found.' });
        res.status(200).json(mapDbToCamelCase(rows[0]));
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({ message: 'Server error while fetching faculty details.' });
    }
});

// New endpoint to update faculty settings
app.post('/api/faculty/update-settings', jsonParser, async (req, res) => {
    const { username, name, email, mobileNumber, teacherChoice, currentPassword, newPassword } = req.body;
    console.log(`Updating settings for faculty: ${username}`);

    if (!username || !currentPassword) {
        return res.status(400).json({ message: 'Username and Current Password are required to save changes.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const facultyRes = await client.query('SELECT * FROM faculty WHERE LOWER(username) = LOWER($1)', [username]);
        if (facultyRes.rows.length === 0) throw new Error('Faculty user not found.');

        const faculty = facultyRes.rows[0];
        const isPasswordMatch = await bcrypt.compare(currentPassword, faculty.passwordhash);
        if (!isPasswordMatch) throw new Error('Incorrect current password.');

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (name) { updateFields.push(`name = $${paramIndex++}`); values.push(name); }
        if (email) { updateFields.push(`email = $${paramIndex++}`); values.push(email); }
        if (mobileNumber) { updateFields.push(`mobilenumber = $${paramIndex++}`); values.push(mobileNumber); }
        if (teacherChoice) { updateFields.push(`teacherchoice = $${paramIndex++}`); values.push(teacherChoice); }
        if (newPassword) {
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
            updateFields.push(`passwordhash = $${paramIndex++}`);
            values.push(newPasswordHash);
        }

        if (updateFields.length === 0) {
            return res.status(200).json({ message: 'No changes were made.', facultyData: mapDbToCamelCase(faculty) });
        }

        values.push(username);
        const query = `UPDATE faculty SET ${updateFields.join(', ')}, updatedat = CURRENT_TIMESTAMP WHERE LOWER(username) = LOWER($${paramIndex}) RETURNING *;`;
        const { rows } = await client.query(query, values);

        await client.query('COMMIT');
        const updatedFaculty = rows[0];
        delete updatedFaculty.passwordhash;
        res.status(200).json({ message: 'Settings updated successfully!', facultyData: mapDbToCamelCase(updatedFaculty) });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating faculty settings:', error);
        res.status(500).json({ message: error.message || 'Server error during update.' });
    } finally {
        client.release();
    }
});

// New endpoint for admin dashboard stats
app.get('/api/admin/stats', async (req, res) => {
    console.log('Fetching admin dashboard stats.');
    try {
        const studentCountQuery = pool.query('SELECT COUNT(*) AS count FROM students;');
        const facultyCountQuery = pool.query('SELECT COUNT(*) AS count FROM faculty;');

        const [studentResult, facultyResult] = await Promise.all([
            studentCountQuery,
            facultyCountQuery
        ]);

        const stats = {
            totalStudents: parseInt(studentResult.rows[0].count, 10),
            totalFaculty: parseInt(facultyResult.rows[0].count, 10)
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard stats.' });
    }
});

// Endpoint for faculty registration
app.post('/api/faculty/register', jsonParser, async (req, res) => {
    const { name, username, email, password, securityQuestion, securityAnswer } = req.body;
    console.log(`Faculty registration attempt for username: ${username}`);

    try {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const query = `
            INSERT INTO faculty (name, username, email, passwordhash, securityquestion, securityanswer)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, username, email;
        `;
        const values = [name, username, email.toLowerCase(), passwordHash, securityQuestion, securityAnswer];
        const { rows } = await pool.query(query, values);
        
        console.log(`Faculty member ${username} registered successfully.`);
        res.status(201).json({ message: 'Faculty registration successful!', facultyData: rows[0] });
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'A faculty member with this username or email already exists.' });
        }
        console.error('Error during faculty registration:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Endpoint for faculty login
app.post('/api/faculty/login', jsonParser, async (req, res) => {
    const { loginIdentifier, password } = req.body;
    console.log(`Faculty login attempt for identifier: ${loginIdentifier}`);

    try {
        const query = 'SELECT * FROM faculty WHERE username = $1 OR email = $1';
        const { rows } = await pool.query(query, [loginIdentifier]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username or email not found.' });
        }

        const faculty = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, faculty.passwordhash);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        delete faculty.passwordhash;
        delete faculty.securityanswer;

        res.status(200).json({ message: 'Login successful', facultyData: mapDbToCamelCase(faculty) });
    } catch (error) {
        console.error('Error during faculty login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Endpoint for faculty password reset
app.post('/api/faculty/reset-password', jsonParser, async (req, res) => {
    const { identifier, securityQuestion, securityAnswer, newPassword } = req.body;
    console.log(`Faculty password reset attempt for identifier: ${identifier}`);

    try {
        const query = 'SELECT * FROM faculty WHERE (username = $1 OR email = $1) AND securityquestion = $2';
        const { rows } = await pool.query(query, [identifier, securityQuestion]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid identifier or security question.' });
        }

        const faculty = rows[0];
        if (faculty.securityanswer.toLowerCase() !== securityAnswer.toLowerCase()) {
            return res.status(401).json({ message: 'Incorrect security answer.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE faculty SET passwordhash = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, faculty.id]);

        console.log(`Password successfully reset for faculty: ${faculty.username}`);
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error during faculty password reset:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
});

// New endpoint to delete a faculty member
app.delete('/api/faculty/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`Received request to delete faculty with username: ${username}`);

    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    try {
        const result = await pool.query('DELETE FROM faculty WHERE username = $1', [username]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Faculty member not found.' });
        }

        console.log(`Successfully deleted faculty member ${username}.`);
        res.status(200).json({ message: `Faculty member "${username}" has been deleted successfully.` });
    } catch (error) {
        console.error('Error deleting faculty:', error);
        res.status(500).json({ message: 'Server error while deleting faculty member.' });
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
        // This map defines conversions from snake_case or all-lowercase to camelCase.
        // If a key from the DB isn't in this map, it will be added to the new object as-is.
        const keyMap = {
            enrollmentnumber: 'enrollmentNumber',
            rollnumber: 'rollNumber',
            passwordhash: 'passwordHash',
            mobilenumber: 'mobileNumber',
            securityquestion: 'securityQuestion',
            securityanswer: 'securityAnswer',
            profilepicture: 'profilePicture',
            addressline1: 'addressLine1',
            addressline2: 'addressLine2',
            fathername: 'fatherName',
            fatheroccupation: 'fatherOccupation',
            mothername: 'motherName',
            motheroccupation: 'motherOccupation',
            parentmobile: 'parentMobile',
            board10: 'board10',
            marks10: 'marks10',
            totalmarks10: 'totalMarks10',
            percentage10: 'percentage10',
            year10: 'year10',
            board12: 'board12',
            marks12: 'marks12',
            totalmarks12: 'totalMarks12',
            percentage12: 'percentage12',
            year12: 'year12',
            selectedcourse: 'selectedCourse',
            hobbycourses: 'hobbyCourses',
            isprofilecomplete: 'isProfileComplete',
            teacherchoice: 'teacherChoice',
            isread: 'isRead',
            createdat: 'createdAt',
            updatedat: 'updatedAt'
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