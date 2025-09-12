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
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordError = document.getElementById('password-error');
    const mobileNumberInput = document.getElementById('mobileNumber');
    const captchaTextElement = document.getElementById('captcha-text');
    const captchaInputElement = document.getElementById('captchaInput');
    const reloadCaptchaButton = document.getElementById('reload-captcha');
    const captchaError = document.getElementById('captcha-error');
    const submitButton = document.getElementById('submitBtn');
    const buttonText = submitButton.querySelector('.button-text');
    const spinner = submitButton.querySelector('.spinner');
    const dobDay = document.getElementById('dob-day');
    const dobMonth = document.getElementById('dob-month');
    const dobYear = document.getElementById('dob-year');
    const dobHiddenInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');

    let currentCaptcha = '';

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

    // --- Function to calculate age from a date string (YYYY-MM-DD) ---
    const calculateAge = (dobString) => {
        if (!dobString) return '';
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age >= 0 ? age : '';
    };

    // --- Function to update the age field based on DOB selection ---
    const updateAge = () => {
        if (!dobDay.value || !dobMonth.value || !dobYear.value) {
            ageInput.value = '';
            return;
        }
        const dobString = `${dobYear.value}-${dobMonth.value}-${dobDay.value}`;
        ageInput.value = calculateAge(dobString);
    };

    // --- Function to populate date of birth dropdowns ---
    const populateDobDropdowns = () => {
        if (!dobDay || !dobMonth || !dobYear) return;

        // Populate Days
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.textContent = i;
            dobDay.appendChild(option);
        }

        // Populate Months
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = String(index + 1).padStart(2, '0');
            option.textContent = month;
            dobMonth.appendChild(option);
        });

        // Populate Years (assuming minimum age of 18 for registration)
        const currentYear = new Date().getFullYear();
        const startYear = 1950;
        const endYear = currentYear - 5;
        for (let i = endYear; i >= startYear; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            dobYear.appendChild(option);
        }
    };

    // --- Event Listeners ---

    generateCaptcha(); // Generate initial captcha
    populateDobDropdowns(); // Populate DOB dropdowns

    // Add listeners to DOB dropdowns to calculate age
    dobDay.addEventListener('change', updateAge);
    dobMonth.addEventListener('change', updateAge);
    dobYear.addEventListener('change', updateAge);

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

        emailError.style.display = 'none'; // Clear previous email error

        // --- Validation ---
        let isValid = true;
        captchaError.style.display = 'none';
        captchaError.textContent = '';

        // --- Combine DOB fields and validate ---
        const day = dobDay.value;
        const month = dobMonth.value;
        const year = dobYear.value;

        if (day && month && year) {
            dobHiddenInput.value = `${year}-${month}-${day}`;
        } else {
            // The `required` attribute on selects should prevent this, but it's a good fallback.
            alert('Please select your full date of birth.');
            isValid = false;
        }

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
        studentData.mobileNumber = mobileNumberInput.value; // Ensure mobile number is included

        // For security, ensure no roll number is sent from the client. The server generates it.
        delete studentData.rollNumber;
        // For security, don't send the confirmation password to the backend
        delete studentData.confirmPassword;
        // Clean up individual DOB fields, leaving only the combined 'dob' field
        delete studentData['dob-day'];
        delete studentData['dob-month'];
        delete studentData['dob-year'];
        // The age field is not needed for submission, it's for display only
        delete studentData.age;

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