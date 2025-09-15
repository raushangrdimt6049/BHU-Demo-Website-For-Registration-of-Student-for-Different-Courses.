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

    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const loginIdentifier = document.getElementById('loginIdentifier').value;
        const password = document.getElementById('password').value;

        // Hardcoded credentials as requested by the user for now
        const correctUsername = 'Nisha_143';
        const correctPassword = '4gh4m01r';

        if (loginIdentifier === correctUsername && password === correctPassword) {
            // --- Login Successful ---
            const facultyData = {
                username: 'Nisha_143',
                name: 'Nisha Singh',
                avatar: 'default-avatar.png'
                // In a real scenario, this data would come from a server API call
            };
            sessionStorage.setItem('currentFaculty', JSON.stringify(facultyData));
            sessionStorage.setItem('navigationAllowed', 'true'); // Set navigation flag for the next page

            alert('Login successful!');
            window.location.replace('faculty.html'); // Use replace to prevent back button issues
        } else {
            alert('Login failed: Incorrect username or password.');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
});