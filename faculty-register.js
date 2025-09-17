document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const captchaTextElement = document.getElementById('captcha-text');
    const captchaInputElement = document.getElementById('captchaInput');
    const reloadCaptchaButton = document.getElementById('reload-captcha');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('password-error');
    const formError = document.getElementById('form-error');

    let currentCaptcha = '';

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        currentCaptcha = captcha;
        captchaTextElement.textContent = captcha;
        captchaInputElement.value = '';
    };

    generateCaptcha();
    reloadCaptchaButton.addEventListener('click', generateCaptcha);

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        passwordError.style.display = 'none';
        formError.style.display = 'none';

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const captchaInput = captchaInputElement.value;

        // --- Validation ---
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            passwordError.innerHTML = 'Password must be at least 8 characters and include:<br>- one uppercase letter<br>- one lowercase letter<br>- one number<br>- and one special character (@$!%*?&).';
            passwordError.style.display = 'block';
            passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            confirmPasswordInput.focus();
            return;
        }

        if (captchaInput.toLowerCase() !== currentCaptcha.toLowerCase()) {
            alert('Captcha does not match. Please try again.');
            generateCaptcha();
            captchaInputElement.focus();
            return;
        }

        const submitBtn = registrationForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        const formData = new FormData(registrationForm);
        const facultyData = Object.fromEntries(formData.entries());
        delete facultyData.confirmPassword;
        delete facultyData.captchaInput;

        try {
            const response = await fetch('/api/faculty/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facultyData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Registration failed.');
            }

            alert('Faculty registration successful! You will now be redirected to the login page.');
            window.location.href = 'faculty-login.html';

        } catch (error) {
            console.error('Registration error:', error);
            formError.textContent = error.message;
            formError.style.display = 'block';
            generateCaptcha(); // Regenerate captcha on error
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    });
});