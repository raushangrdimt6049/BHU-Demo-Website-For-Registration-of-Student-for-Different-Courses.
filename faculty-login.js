// Security check: if already logged in, redirect to dashboard
if (sessionStorage.getItem('currentFaculty')) {
    window.location.replace('faculty.html');
}

// Clear form on page show
window.addEventListener('pageshow', (event) => {
    if (!sessionStorage.getItem('currentFaculty')) {
        const loginIdentifierInput = document.getElementById('loginIdentifier');
        const passwordInput = document.getElementById('password');
        if (loginIdentifierInput) loginIdentifierInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginError = document.getElementById('login-error');

    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';

        const loginIdentifier = document.getElementById('loginIdentifier').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.parentElement.querySelector('.sign-in-btn');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...';

        try {
            const response = await fetch('/api/faculty/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginIdentifier, password })
            });

            if (!response.ok) {
                let errorMessage;
                const contentType = response.headers.get("content-type");

                if (contentType && contentType.indexOf("application/json") !== -1) {
                    // If the server sent a JSON error, parse it
                    const errorData = await response.json();
                    errorMessage = errorData.message || `Login failed with status: ${response.status}`;
                } else {
                    // If the server sent HTML or something else, which is the likely cause of the error.
                    if (response.status === 404) {
                        errorMessage = "Login service not found. The server may need to be restarted.";
                    } else {
                        errorMessage = `An unexpected server error occurred (Status: ${response.status}). Please try again.`;
                    }
                    console.error("Server sent a non-JSON response. This is the response text:", await response.text());
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // --- Login Successful ---
            const facultyData = data.facultyData;
            sessionStorage.setItem('currentFaculty', JSON.stringify(facultyData));

            alert('Login successful!');
            window.location.replace('faculty.html'); // Use replace to prevent back button issues

        } catch (error) {
            console.error('Login failed:', error);
            loginError.textContent = error.message;
            loginError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
});