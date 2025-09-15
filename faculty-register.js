document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const captchaTextElement = document.getElementById('captcha-text');
    const captchaInputElement = document.getElementById('captchaInput');
    const reloadCaptchaButton = document.getElementById('reload-captcha');

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

    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        if (captchaInputElement.value.toLowerCase() !== currentCaptcha.toLowerCase()) {
            alert('Captcha does not match. Please try again.');
            generateCaptcha();
            return;
        }

        // For now, as requested, we don't submit to a backend.
        // We just show an alert and redirect.
        alert('Faculty registration form submitted (demo). You will now be redirected to the login page.');
        window.location.href = 'faculty-login.html';
    });
});