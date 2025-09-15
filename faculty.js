// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// password prompt is always shown.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const passwordOverlay = document.getElementById('password-overlay');
    const facultyPasswordForm = document.getElementById('facultyPasswordForm');
    const facultyUsernameInput = document.getElementById('facultyUsernameInput');
    const facultyPasswordInput = document.getElementById('facultyPasswordInput');
    const passwordError = document.getElementById('password-error');
    const facultyContent = document.getElementById('faculty-content');

    // --- Hardcoded Credentials ---
    const correctUsername = 'Nisha_143';
    const correctPassword = '4gh4m01r';

    const initializeFacultyPortal = () => {
        // This function is called on successful login to reveal the main content.
        facultyContent.style.display = 'block';

        // --- Sliding Side Menu Logic ---
        const sideMenuBtn = document.getElementById('sideMenuBtn');
        const sideMenu = document.getElementById('sideMenu');
        const sideMenuOverlay = document.getElementById('sideMenuOverlay');

        if (sideMenuBtn && sideMenu && sideMenuOverlay) {
            sideMenuBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                sideMenu.classList.add('active');
                sideMenuOverlay.classList.add('active');
            });

            sideMenuOverlay.addEventListener('click', () => {
                sideMenu.classList.remove('active');
                sideMenuOverlay.classList.remove('active');
            });
        }
    };

    // --- Password Protection Logic ---
    // Always show the modal on page load and handle authentication.
    passwordOverlay.style.display = 'flex'; // Make sure it's visible
    facultyPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredUsername = facultyUsernameInput.value;
        const enteredPassword = facultyPasswordInput.value;

        if (enteredUsername === correctUsername && enteredPassword === correctPassword) {
            // On correct credentials, hide the overlay and load the content.
            passwordOverlay.style.opacity = '0';
            setTimeout(() => {
                passwordOverlay.style.display = 'none';
            }, 300); // Match the transition duration
            initializeFacultyPortal();
        } else {
            passwordError.textContent = 'Incorrect username or password. Please try again.';
            passwordError.style.display = 'block';
            facultyPasswordInput.value = '';
            facultyUsernameInput.focus();
        }
    });
});