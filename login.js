// --- Security: If user is already logged in, redirect to home page ---
// This prevents a logged-in user from seeing the login page again
// by navigating back.
if (sessionStorage.getItem('currentStudent')) {
    window.location.replace('home.html');
}

// --- Security: Clear form fields on page load ---
// The 'pageshow' event fires every time the page is displayed,
// including when navigating back from another page. This is the most
// reliable way to ensure sensitive form fields are cleared after logout
// and not restored by the browser's back-forward cache or autofill.
window.addEventListener('pageshow', (event) => {
    // We only clear fields if the user is NOT logged in.
    if (!sessionStorage.getItem('currentStudent')) {
        const rollNumberInput = document.getElementById('rollNumber');
        const passwordInput = document.getElementById('password');
        if (rollNumberInput) rollNumberInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            // Toggle the type attribute
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle the eye symbol
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const rollNumber = document.getElementById('rollNumber').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNumber, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            // --- Login Successful ---
            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
            sessionStorage.setItem('loginTime', new Date().toISOString());

            alert('Login successful!');
            window.location.replace('home.html');

        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
        }
    });
});