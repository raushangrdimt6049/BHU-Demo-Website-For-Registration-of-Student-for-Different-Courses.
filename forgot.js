// --- Security: If user is already logged in, redirect to home page ---
// This prevents a logged-in user from seeing the password reset page.
// If they are logged in, they should use the "Change Password" feature instead.
if (sessionStorage.getItem('currentStudent')) {
    window.location.replace('home.html');
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

    forgotForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Clear previous errors
        passwordError.style.display = 'none';
        passwordError.textContent = '';
        if (formError) {
            formError.style.display = 'none';
            formError.textContent = '';
        }

        const identifier = document.getElementById('identifier').value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const securityQuestion = document.getElementById('securityQuestion').value;
        const securityAnswer = document.getElementById('securityAnswer').value;

         // --- Validation ---
         let isValid = true;

         const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

         if (!passwordRegex.test(newPassword)) {
             passwordError.innerHTML = 'Password must be at least 8 characters and include:<br>- one uppercase letter<br>- one lowercase letter<br>- one number<br>- and one special character (@$!%*?&).';
             passwordError.style.display = 'block';
             document.getElementById('newPassword').focus();
             isValid = false;
         } else if (newPassword !== confirmPassword) {
             passwordError.textContent = 'Passwords do not match.';
             passwordError.style.display = 'block';
             document.getElementById('confirmPassword').focus();
             isValid = false;
         }

         if (!isValid) return;

        // Send data to the server to reset password
        fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, securityQuestion, securityAnswer, newPassword }),
        })
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => { throw new Error(`Expected JSON response, but received: ${text.substring(0, 100)}... (Status: ${response.status})`); });
            }
            if (!response.ok) { return response.json().then(err => { throw new Error(err.message || 'Password reset failed'); }); }
            return response.json();
        })
        .then(data => {
            if (data.message === 'Password reset successful') {
                alert('Password reset successful! Please log in with your new password.');
                window.location.href = 'login.html';
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error during password reset fetch:', error);
            if (error.message.includes("Failed to fetch")) {
                alert("Password reset failed: Cannot connect to the server.\n\nPlease make sure the 'node server.js' command is running in your terminal and you are accessing the site via http://localhost:3000.");
            } else {
                // Display server-side validation errors (e.g., "Invalid roll number...") in the form
                if (formError) {
                    formError.textContent = error.message;
                    formError.style.display = 'block';
                } else {
                    alert(`An error occurred while resetting the password: ${error.message}`);
                }
            }
        });
    });
});