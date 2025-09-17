// Security check: if already logged in, redirect to dashboard
if (sessionStorage.getItem('currentFaculty')) {
    window.location.replace('faculty.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordError = document.getElementById('password-error');
    const formError = document.getElementById('form-error');

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

    setupPasswordToggle(newPasswordInput, toggleNewPassword);
    setupPasswordToggle(confirmPasswordInput, toggleConfirmPassword);

    forgotForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Clear previous errors
        passwordError.style.display = 'none';
        passwordError.textContent = '';
        formError.style.display = 'none';
        formError.textContent = '';

        const identifier = document.getElementById('identifier').value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const securityQuestion = document.getElementById('securityQuestion').value;
        const securityAnswer = document.getElementById('securityAnswer').value;
        const submitBtn = forgotForm.querySelector('.submit-btn');

        // --- Validation ---
        let isValid = true;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            passwordError.innerHTML = 'Password must be at least 8 characters and include:<br>- one uppercase letter<br>- one lowercase letter<br>- one number<br>- and one special character (@$!%*?&).';
            passwordError.style.display = 'block';
            newPasswordInput.focus();
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            passwordError.textContent = 'Passwords do not match.';
            passwordError.style.display = 'block';
            confirmPasswordInput.focus();
            isValid = false;
        }

        if (!isValid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting...';

        try {
            const response = await fetch('/api/faculty/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, securityQuestion, securityAnswer, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Password reset failed');
            
            alert('Password reset successful! Please log in with your new password.');
            window.location.href = 'faculty-login.html';

        } catch (error) {
            console.error('Error during password reset fetch:', error);
            formError.textContent = error.message;
            formError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    });
});