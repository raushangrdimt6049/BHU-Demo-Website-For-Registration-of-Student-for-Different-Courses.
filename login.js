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
            // Toggle the type attribute
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle the eye symbol
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const loginIdentifier = document.getElementById('loginIdentifier').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginIdentifier, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            // --- Login Successful ---
            const student = data.studentData;
            sessionStorage.setItem('currentStudent', JSON.stringify(student));
            sessionStorage.setItem('loginTime', new Date().toISOString());
            sessionStorage.setItem('navigationAllowed', 'true'); // Set navigation flag

            alert('Login successful!');

            // The home.html page is designed to act as a central hub. It will
            // automatically check the student's payment status and render either
            // the application progress steps or the main student dashboard.
            // This logic ensures that students who have completed their admission
            // are taken directly to their dashboard view upon logging in.
            let isPaid = false;
            // Check if selectedCourse is an object and has the paymentStatus property
            if (student.selectedCourse && typeof student.selectedCourse === 'object') {
                if (student.selectedCourse.paymentStatus === 'paid') {
                    isPaid = true;
                }
            }
            window.location.replace('home.html');

        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
        }
    });
});