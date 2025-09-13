document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const docElement = document.documentElement; // Target <html> for flicker-free loading

    /**
     * Applies the specified theme and updates the button icon.
     * @param {string} theme - The theme to apply ('dark' or 'light').
     */
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            docElement.classList.add('dark-mode');
            if (themeToggleBtn) themeToggleBtn.textContent = '☀️'; // Sun icon
        } else {
            docElement.classList.remove('dark-mode');
            if (themeToggleBtn) themeToggleBtn.textContent = '🌙'; // Moon icon
        }
    };

    /**
     * Toggles the theme between light and dark, and saves the preference.
     */
    const toggleTheme = () => {
        const newTheme = docElement.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    // Add a click listener to the theme toggle button if it exists.
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // --- Initial Icon Sync ---
    // The theme class is set by an inline script in the <head>.
    // This part just ensures the button icon is correct on page load.
    const isCurrentlyDark = docElement.classList.contains('dark-mode');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = isCurrentlyDark ? '☀️' : '🌙';
    }
});