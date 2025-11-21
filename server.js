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
  ssl: { rejectUnauthorized: false },
  // --- Recommended settings for robust, long-running applications ---
    // Maximum number of clients in the pool
    max: 20,
  // How long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000, // 30 seconds
  // How long to wait for a client from the pool before timing out
  connectionTimeoutMillis: 20000, // 20 seconds
    // --- Additional settings to handle connection issues ---
    // Check connection health periodically
    validationQuery: 'SELECT 1',
    // Number of milliseconds to wait before considering a connection invalid
    // Should be less than server's timeout
    statement_timeout: 60000, // 60 seconds
    // Frequency to check and prune idle clients
    reapIntervalMillis: 60000, // 60 seconds
  // --- Recommended settings for long-running applications ---
    // Test the connection before using it
    // Detects broken connections early
    test: function (client) {
        return client.query('SELECT 1');
    }
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

// New Multer setup for faculty profile pictures
const facultyPicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/faculty-pics/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Generate a temporary name. We will rename it in the route handler
        // where req.body is guaranteed to be populated.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `temp-faculty-${uniqueSuffix}${extension}`);
    }
});
const facultyPicUpload = multer({ storage: facultyPicStorage });

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
        // Generate a temporary name. We will rename it in the route handler.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `temp-admin-${uniqueSuffix}${extension}`);
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

// --- New SMS Sending Function for Attendance ---
async function sendAttendanceSms(toMobileNumber, messageBody) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('Twilio credentials not found in .env file. Skipping attendance SMS.');
        return;
    }

    // Initialize Twilio client
    const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Ensure mobile number is in E.164 format
    const formattedMobileNumber = `+91${toMobileNumber}`;

    try {
        await twilioClient.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedMobileNumber
        });
        console.log(`Attendance SMS sent to ${formattedMobileNumber}`);
    } catch (error) {
        // Log the error but don't fail the entire process if SMS fails.
        console.error(`Error sending attendance SMS to ${formattedMobileNumber}:`, error.message);
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
    const launchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    };
    // For local development, puppeteer can find a local chrome install.
    // For production (like on Render), we must use the path from @sparticuz/chromium.
    if (chromium.headless) {
        launchOptions.executablePath = await chromium.executablePath();
    }
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(summaryHtmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });

    await browser.close();
    return pdfBuffer;
}

// --- PDF Generation Helper for Student ID Card ---
// Helper function to format class names with ordinal suffixes
const formatClassNameForIdCard = (className) => {
    if (!className) return 'N/A';
    if (className.toLowerCase().includes('nursery')) return 'Nursery';
    if (className.toLowerCase().includes('lkg')) return 'LKG';
    if (className.toLowerCase().includes('ukg')) return 'UKG';

    const numberMatch = className.match(/\d+/);
    if (!numberMatch) return className; // Return as is if no number found

    const number = parseInt(numberMatch[0], 10);
    if (isNaN(number)) return className;

    // Special case for 11, 12, 13
    if (number >= 11 && number <= 13) {
        return `${number}th`;
    }

    const lastDigit = number % 10;
    switch (lastDigit) {
        case 1: return `${number}st`;
        case 2: return `${number}nd`;
        case 3: return `${number}rd`;
        default: return `${number}th`;
    }
};

async function generateIdCardHtml(studentData, courseData) {
    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Determine Issue and Expiry Date
    // Use the student's creation date as the 'joining date'
    const issueDate = new Date(studentData.createdAt);
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    let profilePictureSrc = 'https://www.clipartmax.com/png/middle/323-3235972_banaras-hindu-university.png'; // Fallback
    if (studentData.profilePicture) {
        const picPath = path.join(__dirname, studentData.profilePicture);
        if (fs.existsSync(picPath)) {
            // Convert to base64 to embed directly in HTML, avoiding file path issues in Puppeteer
            const imageBuffer = fs.readFileSync(picPath);
            const imageType = path.extname(picPath).substring(1);
            profilePictureSrc = `data:image/${imageType};base64,${imageBuffer.toString('base64')}`;
        }
    }

    const idCardHtmlContent = `
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Student ID Card</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; margin: 0; }
            .id-card {
                width: 320px;
                border-radius: 15px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                background: #fff;
                overflow: hidden;
                border: 4px solid transparent; /* Border thickness */
                background-clip: padding-box; /* Important: keeps background from showing under the border */
                border-image: linear-gradient(45deg, #4f46e5, #7c3aed, #db2777, #f472b6) 1;
            }
            .id-header { background-color: #002147; color: white; padding: 10px; text-align: center; }
            .id-header h3 { margin: 0; font-size: 16px; }
            .id-header p { margin: 2px 0 0 0; font-size: 12px; opacity: 0.9; }
            .id-body { padding: 15px; text-align: center; }
            .profile-pic { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #002147; margin-bottom: 10px; }
            .student-name { font-size: 20px; font-weight: 600; margin: 0 0 5px 0; color: #002147; }
            .student-class { font-size: 16px; font-weight: 500; margin: 0 0 15px 0; color: #333; }
            .details-grid { text-align: left; font-size: 13px; }
            .detail-item { display: flex; margin-bottom: 6px; }
            .detail-item label { font-weight: 600; color: #555; width: 80px; flex-shrink: 0; }
            .detail-item span { word-break: break-all; }
            .id-footer { background-color: #f0f2f5; padding: 8px; text-align: center; font-size: 11px; color: #555; border-top: 1px solid #ddd; }
        </style></head><body><div class="id-card-container">
                <div class="id-card">
                    <div class="id-header"><h3>DAV PG College, Varanasi</h3><p>Student Identity Card</p></div>
                    <div class="id-body">
                        <img src="${profilePictureSrc}" alt="Profile" class="profile-pic">
                        <h4 class="student-name">${studentData.name || 'N/A'}</h4>
                    <p class="student-class">Class: ${formatClassNameForIdCard(courseData.branch)}</p>
                        <div class="details-grid">
                            <div class="detail-item"><label>Roll No:</label><span>${studentData.rollNumber || 'N/A'}</span></div>
                            <div class="detail-item"><label>Mobile:</label><span>${studentData.mobileNumber || 'N/A'}</span></div>
                            <div class="detail-item"><label>Email:</label><span>${studentData.email || 'N/A'}</span></div>
                        </div>
                    </div>
                    <div class="id-footer"><span>Issued: ${formatDate(issueDate)}</span> | <span>Expires: ${formatDate(expiryDate)}</span></div>
                </div>
            </div></body></html>`;

    return idCardHtmlContent;
}

async function generateIdCardPdf(studentData, courseData) {
    const idCardHtmlContent = await generateIdCardHtml(studentData, courseData);

    const launchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    };
    if (chromium.headless) {
        launchOptions.executablePath = await chromium.executablePath();
    }
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(idCardHtmlContent, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ width: '360px', height: '580px' }); // Custom dimensions for ID card
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
        const launchOptions = {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        };
        if (chromium.headless) {
            launchOptions.executablePath = await chromium.executablePath();
        }
        const browser = await puppeteer.launch(launchOptions);
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

    const launchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    };
    if (chromium.headless) {
        launchOptions.executablePath = await chromium.executablePath();
    }
    const browser = await puppeteer.launch(launchOptions);
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
    { name: 'migrationCertificate', maxCount: 1 },
    { name: 'tcCertificate', maxCount: 1 }
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
            'SELECT profilepicture, signature, marksheet10, marksheet12 FROM students WHERE rollnumber = $1', // DB columns remain the same
            [rollNumber]
        );

        if (existingPathsResult.rows.length === 0) {
            throw new Error('Student not found when fetching existing documents.');
        }
        const existingPaths = existingPathsResult.rows[0];

        // Merge new paths over existing ones. If a new path is undefined, the existing one from the DB is used.
        const finalFilePaths = {
            profilePicture: filePaths.profilePicture || existingPaths.profilepicture,
            signature: filePaths.signature || existingPaths.signature,
            migrationCertificate: filePaths.migrationCertificate || existingPaths.marksheet10,
            tcCertificate: filePaths.tcCertificate || existingPaths.marksheet12
        };

        const query = `
            UPDATE students 
            SET profilepicture=$1, signature=$2, marksheet10=$3, marksheet12=$4, updatedat=CURRENT_TIMESTAMP /* DB columns remain marksheet10/12 */
            WHERE rollnumber = $5
            RETURNING *;
        `;
        const values = [finalFilePaths.profilePicture, finalFilePaths.signature, finalFilePaths.migrationCertificate, finalFilePaths.tcCertificate, rollNumber];
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

// New GET endpoint to fetch all notifications for a faculty member
app.get('/api/faculty/notifications/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`Fetching notifications for faculty: ${username}`);
    try {
        // The current implementation correctly inserts a row for each faculty member, so we just need to query by username.
        const query = "SELECT * FROM notifications WHERE LOWER(faculty_username) = LOWER($1) ORDER BY createdat DESC";
        const { rows } = await pool.query(query, [username]);
        res.json(rows.map(n => mapDbToCamelCase(n)));
    } catch (error) {
        console.error(`Error fetching notifications for faculty ${username}:`, error);
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

// New endpoint to download the student ID card
app.get('/api/student/id-card/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Received request to download ID card for roll number: ${rollNumber}`);

    try {
        const { rows } = await pool.query('SELECT * FROM students WHERE rollnumber = $1', [rollNumber]);
        if (rows.length === 0) {
            return res.status(404).send('Student not found.');
        }

        const student = rows[0];
        if (!student.selectedcourse || !student.selectedcourse.trim().startsWith('{')) {
            return res.status(400).send('Admission details not found for this student.');
        }

        const studentData = mapDbToCamelCase(student);
        const courseData = JSON.parse(student.selectedcourse);

        const pdfBuffer = await generateIdCardPdf(studentData, courseData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ID_Card_${rollNumber}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating ID card PDF:', error);
        res.status(500).send('Could not generate ID card. Please try again later.');
    }
});

// New endpoint for a printable ID card
app.get('/api/student/printable-id-card/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Received request for printable ID card for roll number: ${rollNumber}`);

    try {
        const { rows } = await pool.query('SELECT * FROM students WHERE rollnumber = $1', [rollNumber]);
        if (rows.length === 0) {
            return res.status(404).send('<h1>Student not found.</h1>');
        }

        const student = rows[0];
        if (!student.selectedcourse || !student.selectedcourse.trim().startsWith('{')) {
            return res.status(400).send('<h1>Admission details not found for this student.</h1>');
        }

        const studentData = mapDbToCamelCase(student);
        const courseData = JSON.parse(student.selectedcourse);

        let htmlContent = await generateIdCardHtml(studentData, courseData);

        // Inject a script to automatically trigger the print dialog
        const printScript = `
            <script>
                window.onload = () => { window.print(); };
                window.onafterprint = () => { window.close(); };
            </script>
        `;
        htmlContent = htmlContent.replace('</body>', `${printScript}</body>`);

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error generating printable ID card:', error);
        res.status(500).send('<h1>Could not generate ID card. Please try again later.</h1>');
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
 * TIMETABLE ENDPOINTS
 * =============================================================================
 */

// Helper function to get subjects for a class (moved from admin.js)
const getSubjectsForClass = (className) => {
    const prePrimary = ['Nursery', 'LKG', 'UKG'];
    const primary = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
    const middle = ['Class 6', 'Class 7', 'Class 8'];
    const secondary = ['Class 9', 'Class 10'];
    const seniorSecondary = ['Class 11', 'Class 12'];

    if (prePrimary.includes(className)) {
        return ['English (Alphabet)', 'Hindi (Basics)', 'Numbers (Maths)', 'General Knowledge', 'Drawing & Coloring', 'Rhymes / Stories', 'Games / P.E.'];
    }
    if (primary.includes(className)) {
        return ['English', 'Hindi', 'Mathematics', 'E.V.S.', 'Computer Basics', 'Moral Science', 'Art & Craft', 'P.E. / Music'];
    }
    if (middle.includes(className)) {
        return ['English', 'Hindi', 'Sanskrit', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Moral Science', 'Art/Craft', 'P.E./Music'];
    }
    if (secondary.includes(className)) {
        return ['English', 'Hindi', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Computer Apps', 'P.E.'];
    }
    if (seniorSecondary.includes(className)) {
        return ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Pol. Science', 'Computer Sci.', 'P.E.'];
    }
    return ['English', 'Maths', 'Science', 'History', 'Geography', 'Hindi', 'Art', 'Music', 'P.E.'];
};

// Helper function to generate the timetable data structure (moved from admin.js)
const generateFullSchoolTimetableData = async () => {
    const allClasses = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = [1, 2, 3, 4, 5, 6];

    // 1. Fetch all subjects and create a name-to-ID map
    const subjectsResult = await pool.query('SELECT id, subject_name FROM subjects');
    const subjectNameToIdMap = subjectsResult.rows.reduce((acc, subject) => {
        acc[subject.subject_name] = subject.id;
        return acc;
    }, {});

    let generatedTimetable = {};
    allClasses.forEach(c => { generatedTimetable[c] = {}; days.forEach(d => { generatedTimetable[c][d] = {}; }); });
    let periodBookings = {};
    days.forEach(d => { periodBookings[d] = {}; periods.forEach(p => { periodBookings[d][p] = new Set(); }); }); // This will store subject IDs
    const shuffleArray = (array) => { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; };
    
    allClasses.forEach(className => {
        const subjectsForClass = getSubjectsForClass(className);
        days.forEach(day => {
            let subjectsUsedToday = new Set();
            periods.forEach(period => {
                // Filter based on subject name, but check bookings using subject ID
                let availableSubjects = shuffleArray(subjectsForClass.filter(s => {
                    const subjectId = subjectNameToIdMap[s];
                    return !periodBookings[day][period].has(subjectId);
                }));
                let preferredSubjects = availableSubjects.filter(s => !subjectsUsedToday.has(s));
                let subjectNameToAssign = preferredSubjects.length > 0 ? preferredSubjects[0] : (availableSubjects.length > 0 ? availableSubjects[0] : null);

                if (subjectNameToAssign) {
                    const subjectIdToAssign = subjectNameToIdMap[subjectNameToAssign];
                    generatedTimetable[className][day][period] = subjectIdToAssign;
                    periodBookings[day][period].add(subjectIdToAssign);
                    subjectsUsedToday.add(subjectNameToAssign); // Track by name for today's class
                } else {
                    generatedTimetable[className][day][period] = null; // Represents a free period
                }
            });
        });
    });

    return generatedTimetable;
};

// New endpoint to get the entire timetable from the database
app.get('/api/timetable/all', async (req, res) => {
    console.log('Fetching entire school timetable from DB.');
    try {
        const query = `
            SELECT 
                t.class_name, t.day_of_week, t.period, s.subject_name 
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            ORDER BY t.class_name, t.day_of_week, t.period;
        `;
        const { rows } = await pool.query(query);
        
        // If no records, it means it hasn't been generated yet.
        if (rows.length === 0) {
            return res.json({ exists: false, data: {} });
        }

        // Reconstruct the nested object structure for the frontend
        const timetable = {};
        rows.forEach(row => {
            if (!timetable[row.class_name]) {
                timetable[row.class_name] = {};
            }
            if (!timetable[row.class_name][row.day_of_week]) {
                timetable[row.class_name][row.day_of_week] = {};
            }
            timetable[row.class_name][row.day_of_week][row.period] = row.subject_name || '---';
        });

        res.json({ exists: true, data: timetable });
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ message: 'Server error while fetching timetable.' });
    }
});

// New endpoint to generate and save the timetable if it doesn't exist
app.post('/api/timetable/generate', async (req, res) => {
    console.log('Request to generate and save timetable.');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if data already exists to prevent accidental overwrite
        const checkResult = await client.query('SELECT id FROM timetables LIMIT 1');
        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Timetable already exists in the database.' });
        }

        const timetableData = await generateFullSchoolTimetableData();
        const insertQuery = 'INSERT INTO timetables (class_name, day_of_week, period, subject_id) VALUES ($1, $2, $3, $4)';

        // Flatten the object and insert into the database
        for (const className in timetableData) {
            for (const day in timetableData[className]) {
                for (const period in timetableData[className][day]) {
                    const subjectId = timetableData[className][day][period]; // This is now an ID or null
                    await client.query(insertQuery, [className, day, period, subjectId]);
                }
            }
        }

        await client.query('COMMIT');
        console.log('Timetable generated and saved to database successfully.');
        res.status(201).json({ message: 'Timetable generated and saved successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error generating/saving timetable:', error);
        res.status(500).json({ message: 'Server error while generating timetable.' });
    } finally {
        client.release();
    }
});

// New endpoint to update a timetable entry
app.put('/api/timetable/update', jsonParser, async (req, res) => {
    const { className, day, period, subject } = req.body;
    console.log(`Updating timetable for ${className}, ${day}, Period ${period} to ${subject}`);

    if (!className || !day || !period || subject === undefined) {
        return res.status(400).json({ message: 'Class name, day, period, and subject are required.' });
    }

    try {
        let subjectId = null;
        // Find the subject_id for the given subject name.
        // If the subject is "---" or an empty string, we'll treat it as a free period (null ID).
        if (subject && subject !== '---') {
            const subjectRes = await pool.query('SELECT id FROM subjects WHERE subject_name = $1', [subject]);
            if (subjectRes.rows.length === 0) {
                // If an admin types a subject that doesn't exist, we can't save it.
                return res.status(400).json({ message: `Subject "${subject}" not found in the database.` });
            }
            subjectId = subjectRes.rows[0].id;
        }

        const query = `
            UPDATE timetables 
            SET subject_id = $1, updated_at = NOW()
            WHERE class_name = $2 AND day_of_week = $3 AND period = $4
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [subjectId, className, day, period]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Timetable entry not found.' });
        }

        res.status(200).json({ message: 'Timetable updated successfully.' });
    } catch (error) {
        console.error('Error updating timetable:', error);
        res.status(500).json({ message: 'Server error while updating timetable.' });
    }
});

/**
 * =============================================================================
 * ATTENDANCE ENDPOINTS
 * =============================================================================
 */

// Endpoint to get real student attendance data, ensuring all enrolled subjects are included.
app.get('/api/student/attendance/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Fetching attendance for roll number: ${rollNumber}`);

    try {
        // Step 1: Get the student's class from their profile
        const studentRes = await pool.query('SELECT selectedcourse FROM students WHERE rollnumber = $1', [rollNumber]);
        if (studentRes.rows.length === 0 || !studentRes.rows[0].selectedcourse || !studentRes.rows[0].selectedcourse.trim().startsWith('{')) {
            return res.json([]); // No class found, so no attendance data
        }
        const courseData = JSON.parse(studentRes.rows[0].selectedcourse);
        const className = courseData.branch;
        if (!className) {
            return res.json([]); // No class name in the course data
        }

        // Step 2: Get all unique subjects for that class from the timetable
        const subjectsQuery = `
            SELECT DISTINCT s.subject_name
            FROM timetables t
            JOIN subjects s ON t.subject_id = s.id
            WHERE t.class_name = $1 AND s.subject_name IS NOT NULL;
        `;
        const subjectsRes = await pool.query(subjectsQuery, [className]);
        const allEnrolledSubjects = subjectsRes.rows.map(row => row.subject_name);

        // Step 3: Get the actual marked attendance from the attendance table
        const attendanceQuery = `
            SELECT
                subject AS course,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'present') AS present,
                COUNT(*) FILTER (WHERE status = 'absent') AS absent
            FROM attendance
            WHERE student_rollnumber = $1 GROUP BY subject;
        `;
        const attendanceRes = await pool.query(attendanceQuery, [rollNumber]);
        const markedAttendanceMap = new Map(attendanceRes.rows.map(row => [row.course, row]));

        // Step 4: Merge the two lists
        const finalAttendanceData = allEnrolledSubjects.map(subjectName => {
            return markedAttendanceMap.get(subjectName) || { course: subjectName, total: 0, present: 0, absent: 0 };
        }).sort((a, b) => a.course.localeCompare(b.course)); // Sort alphabetically

        res.json(finalAttendanceData);
    } catch (error) {
        console.error('Error fetching real attendance data:', error);
        res.status(500).json({ message: 'Server error while fetching attendance data.' });
    }
});

// New endpoint to get detailed attendance records for a student
app.get('/api/student/attendance-details/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;
    console.log(`Fetching detailed attendance for roll number: ${rollNumber}`);

    try {
        const query = `
            SELECT 
                subject, 
                attendance_date, 
                status 
            FROM attendance 
            WHERE student_rollnumber = $1
            ORDER BY attendance_date DESC;
        `;
        const { rows } = await pool.query(query, [rollNumber]);

        // Map to camelCase for consistency
        const attendanceDetails = rows.map(row => ({
            subject: row.subject,
            attendanceDate: row.attendance_date,
            status: row.status
        }));

        res.json(attendanceDetails);
    } catch (error) {
        console.error('Error fetching detailed attendance:', error);
        res.status(500).json({ message: 'Server error while fetching detailed attendance.' });
    }
});
// Multer setup for attendance correction file uploads
const correctionFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/corrections/';
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Ensure req.body is available for the filename
        const rollNumber = req.body.rollNumber || 'unknown';
        cb(null, `${rollNumber}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const correctionUpload = multer({ storage: correctionFileStorage });

// Endpoint to handle attendance correction requests
app.post('/api/student/request-attendance-correction', correctionUpload.single('supportingFile'), (req, res) => {
    const { rollNumber, course, comment } = req.body;
    console.log(`Received attendance correction request for Roll No: ${rollNumber}, Course: ${course}`);
    console.log(`Comment: ${comment}`);
    if (req.file) console.log(`Supporting File: ${req.file.path}`);

    res.status(200).json({ message: 'Your attendance correction request has been submitted successfully.' });
});

// New endpoint to get students by class name for attendance marking
app.get('/api/students-by-class/:className', async (req, res) => {
    const { className } = req.params;
    console.log(`Fetching students for class: ${className}`);

    try {
        // This query now correctly checks both the main admission course ('selectedcourse' JSON)
        // and any additional hobby courses ('hobbycourses' JSON array) to find all students
        // belonging to a specific class.
        const query = `
            SELECT name, rollnumber, profilepicture 
            FROM students 
            WHERE selectedcourse::jsonb->>'branch' = $1 
               OR hobbycourses @> jsonb_build_array(jsonb_build_object('name', $1))
            ORDER BY name;
        `;
        const { rows } = await pool.query(query, [className]);
        res.json(rows.map(student => mapDbToCamelCase(student)));
    } catch (error) {
        console.error(`Error fetching students for class ${className}:`, error);
        res.status(500).json({ message: 'Server error while fetching students.' });
    }
});

app.post('/api/faculty/mark-attendance', jsonParser, async (req, res) => {
    const { className, subject, attendanceData, facultyUsername } = req.body;
    console.log(`Received attendance for ${className} - ${subject} from ${facultyUsername}`);

    if (!className || !subject || !attendanceData || !facultyUsername) {
        return res.status(400).json({ message: 'Missing required attendance information.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const attendanceDate = new Date(); // Use server time for consistency

         const insertQuery = `
            INSERT INTO attendance (faculty_username, student_rollnumber, class_name, subject, attendance_date, status)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;

        for (const rollNumber in attendanceData) {
            const status = attendanceData[rollNumber];
            await client.query(insertQuery, [facultyUsername, rollNumber, className, subject, attendanceDate, status]);
        }

        // Fetch faculty name for a more detailed notification message
        const facultyResult = await client.query('SELECT name FROM faculty WHERE username = $1', [facultyUsername]);
        const facultyName = facultyResult.rows.length > 0 ? facultyResult.rows[0].name : facultyUsername;


        // Fetch student details for notification
        const studentDetailsQuery = 'SELECT name, mobilenumber FROM students WHERE rollnumber = ANY($1::text[])';
        const rollNumbersArray = Object.keys(attendanceData);
        const studentDetailsResult = await client.query(studentDetailsQuery, [rollNumbersArray]);
        const studentDetailsMap = studentDetailsResult.rows.reduce((acc, student) => {
            acc[student.rollnumber] = student;
            return acc;
        }, {});

        // Send notifications and SMS messages
        for (const rollNumber in attendanceData) {
            const status = attendanceData[rollNumber];
            const student = studentDetailsMap[rollNumber];

            if (student) {
                const formattedDate = attendanceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
                const notificationMessage = `Your attendance for ${subject} in ${className} on ${formattedDate} was marked as '${status}' by ${facultyName}.`;
                const insertNotificationQuery = `
                    INSERT INTO notifications (studentrollnumber, type, message)
                    VALUES ($1, 'attendance', $2)
                `;
                await client.query(insertNotificationQuery, [rollNumber, notificationMessage]);

                // Use the new, correct SMS function
                sendAttendanceSms(student.mobilenumber, notificationMessage);
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Attendance for ${className} - ${subject} has been submitted successfully.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving attendance data:', error);
        res.status(500).json({ message: 'Failed to save attendance data to the server.' });
    } finally {
       client.release();
    }
});

// New endpoint for faculty to view their submitted attendance records
app.get('/api/faculty/view-attendance/:facultyUsername', async (req, res) => {
    const { facultyUsername } = req.params;
    console.log(`Fetching attendance records for faculty: ${facultyUsername}`);
    try {
        const query = `
            SELECT
                class_name,
                subject,
                attendance_date,
                COUNT(*) AS total_students,
                COUNT(*) FILTER (WHERE status = 'present') AS present_count,
                COUNT(*) FILTER (WHERE status = 'absent') AS absent_count
            FROM attendance
            WHERE faculty_username = $1
            GROUP BY class_name, subject, attendance_date
            ORDER BY attendance_date DESC, class_name;
        `;
        const { rows } = await pool.query(query, [facultyUsername]);
        // Manually map and convert types for this specific query
        const mappedRows = rows.map(row => ({
            ...mapDbToCamelCase(row), // Apply general mapping
            totalStudents: parseInt(row.total_students, 10) || 0,
            presentCount: parseInt(row.present_count, 10) || 0,
            absentCount: parseInt(row.absent_count, 10) || 0,
        }));
        res.json(mappedRows);
    } catch (error) {
        console.error(`Error fetching attendance records for ${facultyUsername}:`, error);
        res.status(500).json({ message: 'Server error while fetching attendance records.' });
    }
});

// New endpoint to fetch attendance records for a specific class and date
app.get('/api/attendance/class-date', async (req, res) => {
    const { className, date } = req.query;
    console.log(`Fetching attendance for class: ${className} and date: ${date}`);

    try {
        const query = `
            SELECT student_rollnumber, status FROM attendance 
            WHERE class_name = $1 AND attendance_date::date = $2;
        `;
        const { rows } = await pool.query(query, [className, date]);
        res.json(rows.map(row => mapDbToCamelCase(row)));
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Server error while fetching attendance.' });
    }
});

/**
 * =============================================================================
 * ADMIN-FACING ENDPOINTS
 * =============================================================================
 */

// New endpoint to get history of admin notices
// This now reads from the dedicated notice_history table for a more accurate log.
app.get('/api/admin/notices', async (req, res) => {
    console.log('Fetching history of admin notices.');
    try {
        const query = `SELECT * FROM notice_history ORDER BY createdat DESC;`;
        const { rows } = await pool.query(query);
        res.json(rows.map(historyItem => mapDbToCamelCase(historyItem)));
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

// New endpoint to get details for the logged-in faculty member
app.get('/api/faculty/me', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'Username is required.' });

    try {
        const query = 'SELECT id, name, username, email, mobilenumber, teacherchoice, subject, profilepicture, isprofilecomplete, assigned_classes FROM faculty WHERE LOWER(username) = LOWER($1)';
        const { rows } = await pool.query(query, [username]);
        if (rows.length === 0) return res.status(404).json({ message: 'Faculty not found.' });
        res.status(200).json(mapDbToCamelCase(rows[0]));
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({ message: 'Server error while fetching faculty details.' });
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

// New, unified endpoint for sending notices
app.post('/api/admin/send-notice', jsonParser, async (req, res) => {
    const { message, audience, recipients, adminUsername } = req.body;
    console.log(`Received notice request for audience: ${audience}`);

    if (!message || !audience || !adminUsername) {
        return res.status(400).json({ message: 'Message, audience, and admin username are required.' });
    }
    if (audience.startsWith('SELECTED') && (!recipients || recipients.length === 0)) {
        return res.status(400).json({ message: 'Recipients are required for selected audience.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let notificationResult;
        let recipientCount = 0;

        if (audience === 'ALL_STUDENTS') {
            const query = `INSERT INTO notifications (studentrollnumber, type, message, link) SELECT rollnumber, 'admin_notice', $1, '#' FROM students;`;
            notificationResult = await client.query(query, [message]);
            recipientCount = notificationResult.rowCount;
        } else if (audience === 'ALL_FACULTY') {
            const query = `INSERT INTO notifications (faculty_username, type, message, link) SELECT username, 'admin_notice', $1, '#' FROM faculty;`;
            notificationResult = await client.query(query, [message]);
            recipientCount = notificationResult.rowCount;
        } else if (audience === 'SELECTED_STUDENTS') {
            const query = `INSERT INTO notifications (studentrollnumber, type, message, link) SELECT unnest($1::text[]), 'admin_notice', $2, '#';`;
            notificationResult = await client.query(query, [recipients, message]);
            recipientCount = notificationResult.rowCount;
        } else if (audience === 'SELECTED_FACULTY') {
            const query = `INSERT INTO notifications (faculty_username, type, message, link) SELECT unnest($1::text[]), 'admin_notice', $2, '#';`;
            notificationResult = await client.query(query, [recipients, message]);
            recipientCount = notificationResult.rowCount;
        } else {
            throw new Error('Invalid audience specified.');
        }

        if (recipientCount === 0) {
            // Don't throw an error, just inform the admin. No need to rollback or log history.
            await client.query('COMMIT'); // Commit the empty transaction
            return res.status(200).json({ message: 'Notice sent, but no matching recipients were found.' });
        }

        // Log the action in the new history table
        const historyQuery = `
            INSERT INTO notice_history (sent_by_admin, message, target_audience, recipient_count)
            VALUES ($1, $2, $3, $4);
        `;
        await client.query(historyQuery, [adminUsername, message, audience, recipientCount]);

        await client.query('COMMIT');

        console.log(`Successfully sent notice to ${recipientCount} recipients for audience ${audience}.`);
        res.status(200).json({ message: `Notice successfully sent to ${recipientCount} recipients.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error sending notice for audience ${audience}:`, error);
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
app.post('/api/admin/update-settings', adminPicUpload.single('profilePicture'), async (req, res) => {
    const { username, name, email, mobileNumber, currentPassword, newPassword } = req.body; // Multer makes body available
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
        if (req.file) {
            // Rename the temporary file to a permanent one
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const newFileName = `${sanitizedUsername}-${Date.now()}${path.extname(req.file.originalname)}`;
            const newPath = path.join(path.dirname(req.file.path), newFileName);

            try {
                fs.renameSync(req.file.path, newPath);
                const profilePictureUrl = newPath.replace(/\\/g, "/");
                updateFields.push(`profilepicture = $${paramIndex++}`);
                values.push(profilePictureUrl);
                console.log(`Admin profile picture for ${username} saved to: ${profilePictureUrl}`);
            } catch (renameError) {
                console.error('Error renaming admin profile picture:', renameError);
                // Clean up the temp file if renaming fails
                fs.unlinkSync(req.file.path);
            }
        }
        if (newPassword) {
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
            updateFields.push(`passwordhash = $${paramIndex++}`);
            values.push(newPasswordHash);
        }

        if (updateFields.length === 0) {
            delete admin.passwordhash;
            // Even if no fields changed, if a file was uploaded, it was an error.
            return res.status(200).json({ message: 'No changes were made.', adminData: mapDbToCamelCase(admin) });
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
    const { name, username, email, password, teacherChoice, subject, assignedClasses } = req.body;
    console.log(`Admin request to add new faculty user: ${username}`);

    if (!name || !username || !email || !password || !teacherChoice || !subject || !assignedClasses) {
        return res.status(400).json({ message: 'Name, username, email, password, teacher type, subject, and assigned classes are required.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        // We set isprofilecomplete to false, so the faculty member is forced to update details on first login.
        const query = `
            INSERT INTO faculty (name, username, email, passwordhash, isprofilecomplete, teacherchoice, subject, assigned_classes)
            VALUES ($1, $2, $3, $4, FALSE, $5, $6, $7)
            RETURNING id, name, username, email;
        `;
        const values = [name, username.toLowerCase(), email.toLowerCase(), passwordHash, teacherChoice, subject, assignedClasses];
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
app.post('/api/faculty/complete-profile', facultyPicUpload.single('photo'), async (req, res) => {
    const { 
        username, currentPassword, newPassword, 
        mobileNumber, dob 
    } = req.body;
    console.log(`Profile completion attempt for faculty: ${username}`);

    if (!username || !currentPassword || !newPassword || !mobileNumber || !dob) {
        return res.status(400).json({ message: 'All fields are required to complete your profile.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const facultyRes = await client.query('SELECT * FROM faculty WHERE username = $1', [username]);
        if (facultyRes.rows.length === 0) throw new Error('Faculty member not found.');
        
        const faculty = facultyRes.rows[0];

        const isPasswordMatch = await bcrypt.compare(currentPassword, faculty.passwordhash);
        if (!isPasswordMatch) throw new Error('Incorrect current password.');

        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        const updateFields = [
            'mobilenumber = $1', 'dob = $2', 'passwordhash = $3', 
            'isprofilecomplete = TRUE', 'updatedat = CURRENT_TIMESTAMP'
        ];
        const values = [mobileNumber, dob, newPasswordHash];
        let paramIndex = 4;

        if (req.file) {
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const newFileName = `${sanitizedUsername}-${Date.now()}${path.extname(req.file.originalname)}`;
            const newPath = path.join(path.dirname(req.file.path), newFileName);

            try {
                fs.renameSync(req.file.path, newPath);
                const profilePictureUrl = newPath.replace(/\\/g, "/");
                updateFields.push(`profilepicture = $${paramIndex++}`);
                values.push(profilePictureUrl);
            } catch (renameError) {
                console.error('Error renaming faculty profile picture on completion:', renameError);
                fs.unlinkSync(req.file.path); // Clean up temp file
            }
        }

        values.push(username);
        const updateQuery = `
            UPDATE faculty 
            SET ${updateFields.join(', ')}
            WHERE username = $${paramIndex}
            RETURNING *;
        `;
        const updatedResult = await client.query(updateQuery, values);

        await client.query('COMMIT');

        const updatedFaculty = updatedResult.rows[0];
        delete updatedFaculty.passwordhash;
        res.status(200).json({ message: 'Profile updated successfully!', facultyData: mapDbToCamelCase(updatedFaculty) });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error completing faculty profile:', error.message);
        res.status(500).json({ message: error.message || 'Server error during profile update.' });
    } finally {
        client.release();
    }
});

// New endpoint to update faculty settings
app.post('/api/faculty/update-settings', facultyPicUpload.single('profilePicture'), async (req, res) => {
    const { 
        username, name, email, mobileNumber, 
        currentPassword, newPassword 
    } = req.body;
    console.log(`Updating settings for faculty: ${username}`);

    // Any change requires the current password for verification.
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

        if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); values.push(name); }
        if (email !== undefined) { updateFields.push(`email = $${paramIndex++}`); values.push(email.toLowerCase()); }
        if (mobileNumber !== undefined) { updateFields.push(`mobilenumber = $${paramIndex++}`); values.push(mobileNumber); }
        if (req.file) {
            // Rename the temporary file to a permanent one
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const newFileName = `${sanitizedUsername}-${Date.now()}${path.extname(req.file.originalname)}`;
            const newPath = path.join(path.dirname(req.file.path), newFileName);

            try {
                fs.renameSync(req.file.path, newPath);
                const profilePictureUrl = newPath.replace(/\\/g, "/");
                updateFields.push(`profilepicture = $${paramIndex++}`);
                values.push(profilePictureUrl);
                console.log(`Faculty profile picture for ${username} saved to: ${profilePictureUrl}`);
            } catch (renameError) {
                // If renaming fails, log it but don't fail the whole transaction.
                // The other profile details might still be important to save.
                // Clean up the temp file.
                console.error('Error renaming faculty profile picture:', renameError);
                fs.unlinkSync(req.file.path);
            }
        }
        if (newPassword) {
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
            updateFields.push(`passwordhash = $${paramIndex++}`);
            values.push(newPasswordHash);
        }

        if (updateFields.length === 0) {
            delete faculty.passwordhash;
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
        // Explicitly select columns to ensure all necessary data is fetched and to avoid sending sensitive data.
        const query = `
            SELECT id, name, username, email, mobilenumber, dob, teacherchoice, subject, profilepicture, isprofilecomplete, assigned_classes, passwordhash 
            FROM faculty WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
        `;
        const { rows } = await pool.query(query, [loginIdentifier.toLowerCase()]);

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
    const { username, mobileNumber, newPassword } = req.body;
    console.log(`Faculty password reset attempt for username: ${username}`);

    if (!username || !mobileNumber || !newPassword) {
        return res.status(400).json({ message: 'Username, mobile number, and new password are required.' });
    }

    try {
        // Find user by username. Username should be unique.
        const query = 'SELECT * FROM faculty WHERE LOWER(username) = LOWER($1)';
        const { rows } = await pool.query(query, [username]);

        if (rows.length === 0) {
            // Generic error to prevent leaking info on which field was wrong
            return res.status(401).json({ message: 'Invalid username or mobile number.' });
        }

        const faculty = rows[0];
        // Check if the provided mobile number matches the one in the database.
        if (faculty.mobilenumber !== mobileNumber) {
            return res.status(401).json({ message: 'Invalid username or mobile number.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE faculty SET passwordhash = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, faculty.id]);

        console.log(`Password successfully reset for faculty: ${faculty.username}`);
        res.status(200).json({ message: 'Password reset successful! Please log in with your new password.' });
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
            board10: 'board10', // DB column name: JS object key
            marks10: 'marks10',
            marksheet10: 'migrationCertificate', // DB: marksheet10 -> JS: migrationCertificate
            totalmarks10: 'totalMarks10',
            percentage10: 'percentage10',
            year10: 'year10',
            board12: 'board12',
            marks12: 'marks12',
            marksheet12: 'tcCertificate', // DB: marksheet12 -> JS: tcCertificate
            totalmarks12: 'totalMarks12',
            percentage12: 'percentage12',
            year12: 'year12',
            selectedcourse: 'selectedCourse',
            hobbycourses: 'hobbyCourses',
            isprofilecomplete: 'isProfileComplete',
            teacherchoice: 'teacherChoice', // This was correct, but adding a check below for safety
            assigned_classes: 'assignedClasses',
            gender: 'gender',
            subject: 'subject',
            isread: 'isRead',
            createdat: 'createdAt',
            updatedat: 'updatedAt',
            // Keys for faculty attendance view
            class_name: 'className',
            attendance_date: 'attendanceDate',
            total_students: 'totalStudents',
            present_count: 'presentCount',
            absent_count: 'absentCount'
        };
        camelCaseObject[keyMap[key] || key] = dbObject[key];
    }
    return camelCaseObject;
}

/**
 * =============================================================================
 * GLOBAL ERROR HANDLER
 * =============================================================================
 * This middleware must be the LAST `app.use()` call. It catches errors from
 * any route, including async errors and errors from middleware like Multer.
 * This ensures that the client always receives a JSON error response instead
 * of a default HTML error page.
 */
app.use((err, req, res, next) => {
    console.error("An unhandled error occurred:", err);

    // Handle Multer-specific errors (e.g., file size limits, etc.)
    if (err instanceof multer.MulterError) {
        return res.status(422).json({ message: `File Upload Error: ${err.message}` });
    }

    // If headers have already been sent, delegate to the default Express handler.
    if (res.headersSent) {
        return next(err);
    }

    // For all other errors, send a generic 500 server error response.
    res.status(500).json({ message: err.message || 'An unexpected server error occurred.' });
});

app.listen(port, () => {
    console.log("\n✅ Backend server is running!");
    console.log(`   Please open your web browser and go to:`);
    console.log(`   => http://localhost:${port}\n`);
});