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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            // --- Login Successful ---
            const facultyData = data.facultyData;
            sessionStorage.setItem('currentFaculty', JSON.stringify(facultyData));
            sessionStorage.setItem('navigationAllowed', 'true'); // Set navigation flag for the next page

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