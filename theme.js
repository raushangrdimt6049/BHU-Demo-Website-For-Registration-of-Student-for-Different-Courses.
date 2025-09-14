document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    // Create a media query to check for the user's system preference.
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    /**
     * Applies the specified theme to the page.
     * @param {string} theme - The theme to apply ('dark' or 'light').
     */
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            htmlElement.classList.add('dark-mode');
        } else {
            htmlElement.classList.remove('dark-mode');
        }
    };

    /**
     * Checks the system's color scheme and applies the corresponding theme.
     * @param {MediaQueryList} mediaQuery - The media query list object.
     */
    const updateThemeFromSystem = (mediaQuery) => {
        if (mediaQuery.matches) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    };

    // --- Initial Theme Setup ---
    // Set the initial theme based on the system preference when the page loads.
    updateThemeFromSystem(prefersDarkScheme);

    // --- Listen for System Theme Changes ---
    // Add a listener that will automatically update the theme when the user
    // changes their system-level appearance settings (e.g., switching to dark mode on their OS).
    prefersDarkScheme.addEventListener('change', updateThemeFromSystem);
});