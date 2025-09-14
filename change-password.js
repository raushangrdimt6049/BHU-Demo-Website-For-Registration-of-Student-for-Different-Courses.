// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// security script in the <head> always runs.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const passwordError = document.getElementById('password-error');
    const studentDataString = sessionStorage.getItem('currentStudent');

    if (!studentDataString) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = 'login.html';
        return;
    }

    const studentData = JSON.parse(studentDataString);

    changePasswordForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // --- Validation ---
        let isValid = true;
        passwordError.style.display = 'none';
        passwordError.textContent = '';

        if (newPassword.length < 8) {
            passwordError.textContent = 'New password must be at least 8 characters long.';
            passwordError.style.display = 'block';
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            passwordError.textContent = 'New passwords do not match.';
            passwordError.style.display = 'block';
            isValid = false;
        }

        if (!isValid) return;

        // --- Send data to server ---
        fetch('/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rollNumber: studentData.rollNumber,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Failed to change password'); });
            }
            return response.json();
        })
        .then(data => {
            alert('Password changed successfully. Please log in again.');
            sessionStorage.removeItem('currentStudent');
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Error changing password:', error);
            passwordError.textContent = error.message;
            passwordError.style.display = 'block';
        });
    });

    // --- Navigation Helper ---
    // Sets a flag before any internal link is followed to allow the next page to load.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && link.hostname === window.location.hostname) {
            // Exclude the logout button from this logic.
            if (link.id !== 'logoutBtnMenu') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });
});