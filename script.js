// --- Security: If user is already logged in, redirect to home page ---
// This prevents a logged-in user from seeing the registration page,
// ensuring they are always directed to the main dashboard if they have an active session.
if (sessionStorage.getItem('currentStudent')) {
    window.location.replace('home.html');
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const registrationForm = document.getElementById('registrationForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordError = document.getElementById('password-error');
    const dobError = document.getElementById('dob-error');
    const mobileNumberInput = document.getElementById('mobileNumber');
    const captchaTextElement = document.getElementById('captcha-text');
    const captchaInputElement = document.getElementById('captchaInput');
    const reloadCaptchaButton = document.getElementById('reload-captcha');
    const captchaError = document.getElementById('captcha-error');
    const submitButton = document.getElementById('submitBtn');
    const buttonText = submitButton.querySelector('.button-text');
    const spinner = submitButton.querySelector('.spinner');

    let currentCaptcha = '';

    // --- Function to auto-format DOB input ---
    const autoformatDob = (event) => {
        const input = event.target;
        // 1. Remove all non-digit characters
        let value = input.value.replace(/\D/g, '');
        let formattedValue = '';

        // 2. Add hyphens at the correct positions
        if (value.length > 0) {
            formattedValue = value.substring(0, 2);
        }
        if (value.length > 2) {
            formattedValue += '-' + value.substring(2, 4);
        }
        if (value.length > 4) {
            formattedValue += '-' + value.substring(4, 8);
        }
        // 3. Update the input field value
        input.value = formattedValue;
    };

    // --- Function to calculate age from DOB ---
    const calculateAge = (dobString) => {
        if (!dobString) return '';
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age; // Returns calculated age, validation for 18+ happens in submit handler
    };

    /**
     * Parses a date string in YYYYMMDD format and validates it.
     * @param {string} dateString The date string to parse.
     * @returns {string|null} The date in YYYY-MM-DD format, or null if invalid.
     */
    const parseAndValidateDate = (dateString) => {
        if (!/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return null;
        const parts = dateString.split('-');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // Basic sanity check for year
        if (year < 1900 || year > new Date().getFullYear()) return null;

        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return null;
    };

    // --- Function to generate and display captcha ---
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        currentCaptcha = captcha;
        captchaTextElement.textContent = captcha;
        captchaInputElement.value = ''; // Clear previous input
    };

    // --- Event Listeners ---

    generateCaptcha(); // Generate initial captcha

    // --- Real-time validation ---
    const validateEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            emailError.textContent = 'Please enter a valid email address.';
            emailError.style.display = 'block';
            return false;
        }
        emailError.style.display = 'none';
        return true;
    };

    // Update age when DOB changes
    dobInput.addEventListener('change', () => {
        const formattedDate = parseAndValidateDate(dobInput.value);
        const age = calculateAge(formattedDate);
        ageInput.value = age >= 0 ? age : ''; // Only show age if date is valid
    });

    // Auto-format DOB as user types
    dobInput.addEventListener('input', autoformatDob);

    // Reload captcha on button click
    reloadCaptchaButton.addEventListener('click', generateCaptcha);

    // Validate email on blur (when user leaves the input field)
    emailInput.addEventListener('blur', validateEmail);

    // --- Password Visibility Toggle ---
    const setupPasswordToggle = (input, toggle) => {
        if (toggle) {
            toggle.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                toggle.textContent = type === 'password' ? '👁️' : '🙈';
            });
        }
    };

    setupPasswordToggle(passwordInput, togglePassword);
    setupPasswordToggle(confirmPasswordInput, toggleConfirmPassword);


    // Form submission handler
    registrationForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        dobError.style.display = 'none'; // Clear previous DOB error
        emailError.style.display = 'none'; // Clear previous email error

        // --- Validation ---
        let isValid = true;
        captchaError.style.display = 'none';
        captchaError.textContent = '';

        // Email validation
        if (!validateEmail()) {
            emailInput.focus();
            isValid = false;
        }

        // Captcha validation (case-insensitive)
        if (captchaInputElement.value.toLowerCase() !== currentCaptcha.toLowerCase()) {
            captchaError.textContent = 'Captcha does not match. Please try again.';
            captchaError.style.display = 'block';
            captchaInputElement.focus();
            generateCaptcha(); // Generate a new captcha
            isValid = false;
        }

        // DOB validation
        const formattedDob = parseAndValidateDate(dobInput.value);
        if (!formattedDob) {
            dobError.textContent = 'Please enter a valid date in DD-MM-YYYY format.';
            dobError.style.display = 'block';
            dobInput.focus();
            isValid = false;
        }

        // Age validation (must be 18+)
        const calculatedAge = calculateAge(formattedDob);
        if (formattedDob && calculatedAge < 18) {
            dobError.textContent = 'You must be at least 18 years old to register.';
            dobError.style.display = 'block';
            dobInput.focus();
            isValid = false;
        }

        // Mobile number validation (10 digits)
        if (!mobileNumberInput.value.match(/^[0-9]{10}$/)) {
            // HTML pattern handles basic validation, but this adds a fallback/clarity
            alert('Please enter a valid 10-digit mobile number.');
            mobileNumberInput.focus();
            isValid = false;
        }

        passwordError.style.display = 'none';
        passwordError.textContent = '';

        // Password validation
        const password = passwordInput.value;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            passwordError.innerHTML = 'Password must be at least 8 characters and include:<br>- one uppercase letter<br>- one lowercase letter<br>- one number<br>- and one special character (@$!%*?&).';
            passwordError.style.display = 'block';
            passwordInput.focus();
            isValid = false;
        } else if (password !== confirmPasswordInput.value) {
            passwordError.textContent = 'Passwords do not match.';
            passwordError.style.display = 'block';
            confirmPasswordInput.focus();
            isValid = false;
        }

        if (!isValid) return; // Stop if initial checks fail

        // Regenerate captcha after every submit attempt to prevent re-use
        generateCaptcha();

        // --- UI change for loading state ---
        submitButton.disabled = true;
        spinner.style.display = 'inline-block';
        buttonText.textContent = 'Submitting...';

        // --- Data Collection ---
        const formData = new FormData(registrationForm);
        const studentData = Object.fromEntries(formData.entries());
        studentData.dob = formattedDob; // Overwrite with the validated, standard format
        studentData.mobileNumber = mobileNumberInput.value; // Ensure mobile number is included
        studentData.age = ageInput.value; // Add calculated age

        // For security, don't send the confirmation password to the backend
        delete studentData.confirmPassword;

        // --- Process Data: Send to backend server ---
        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData),
        })
        .then(response => {
            // Always try to parse the JSON, as error responses from our server also contain JSON.
            return response.json().then(data => {
                if (!response.ok) {
                    // If the response is not OK, we create an error object with the message from the server.
                    // This allows us to catch specific error messages like "Roll Number already exists".
                    throw new Error(data.message || `Server error: ${response.statusText}`);
                }
                return data; // On success, pass the data along.
            });
        })
        .then(data => {
            // --- On success, save to session and redirect to home page ---
            alert('Registration successful! You will now be redirected to the home page.');
            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
            sessionStorage.setItem('loginTime', new Date().toISOString());
            window.location.href = 'home.html';
        })
        .catch(error => {
            console.error('Error during registration fetch:', error);
            if (error.message.includes("Failed to fetch")) {
                alert("Registration failed: Cannot connect to the server.\n\nPlease make sure the 'node server.js' command is running in your terminal and you are accessing the site via http://localhost:3000.");
            } else {
                alert(`Registration failed: ${error.message}`);
            }
        })
        .finally(() => {
            // --- Reset UI from loading state ---
            submitButton.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = 'Submit';
        });
    });
});