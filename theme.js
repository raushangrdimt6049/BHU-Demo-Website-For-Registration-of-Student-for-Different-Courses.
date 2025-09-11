document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const body = document.body;

    /**
     * Applies the specified theme to the page.
     * @param {string} theme - The theme to apply ('dark' or 'light').
     */
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if (themeToggleBtn) themeToggleBtn.textContent = '☀️'; // Sun icon
        } else {
            body.classList.remove('dark-mode');
            if (themeToggleBtn) themeToggleBtn.textContent = '🌙'; // Moon icon
        }
    };

    /**
     * Toggles the theme between light and dark, and saves the preference.
     */
    const toggleTheme = () => {
        const currentTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
    };

    // Add a click listener to the theme toggle button if it exists.
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // --- Initial Theme Setup ---
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    // Apply the initial theme when the page loads.
    applyTheme(initialTheme);
});