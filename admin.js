window.addEventListener('pageshow', (event) => {
    // This listener handles scenarios where a page is restored from the browser's
    // back-forward cache (bfcache). It forces a full reload to ensure the
    // JavaScript runs from a clean state, which is important for single-page-app-like behavior.
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- View Containers and Navigation ---
    const mainDashboardView = document.getElementById('main-dashboard-view');
    const allNotificationsView = document.getElementById('all-notifications-view');
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    // --- Side Navigation Elements ---
    const sideNavBtn = document.getElementById('sideNavBtn');
    const sideNav = document.getElementById('adminSideNav');
    const sideNavOverlay = document.getElementById('sideNavOverlay');
    const closeSideNavBtn = document.getElementById('closeSideNavBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const sideNavNotificationsLink = document.getElementById('sideNavNotificationsLink');
    // --- Notification Panel References ---
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationBadge = document.getElementById('notificationBadge');
    const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');

    // --- Search Overlay Elements ---
    const searchOverlay = document.getElementById('searchOverlay');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    // --- Side Navigation Logic ---
    const openNav = () => {
        if (sideNav && sideNavOverlay) {
            sideNav.classList.add('active');
            sideNavOverlay.classList.add('active');
        }
    };

    const closeNav = () => {
        if (sideNav && sideNavOverlay) {
            sideNav.classList.remove('active');
            sideNavOverlay.classList.remove('active');
        }
    };

    // --- View Switching Logic ---
    const showView = (viewToShow) => {
        mainDashboardView.style.display = 'none';
        allNotificationsView.style.display = 'none';

        if (viewToShow === 'dashboard') {
            mainDashboardView.style.display = 'block';
        } else if (viewToShow === 'notifications') {
            allNotificationsView.style.display = 'block';
        }
    };

    // --- Initialize Navigation ---
    if (sideNavBtn && closeSideNavBtn && sideNavOverlay) {
        sideNavBtn.addEventListener('click', openNav);
        closeSideNavBtn.addEventListener('click', closeNav);
        sideNavOverlay.addEventListener('click', closeNav);
    }

    // Handle logout
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // For consistency with other portals, logout should return to the main index page.
            window.location.href = 'index.html';
        });
    }

    // --- Notification Panel Logic ---
    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            notificationPanel.classList.toggle('active');
            // Optional: Hide badge when panel is opened
            if (notificationBadge) notificationBadge.style.display = 'none';
        });

        // Close panel if clicking outside of it
        document.addEventListener('click', (event) => {
            if (!notificationBtn.contains(event.target) && !notificationPanel.contains(event.target)) {
                notificationPanel.classList.remove('active');
            }
        });
    }

    // --- Search Overlay Logic ---
    // This logic is now simplified as there is no visible search button, but we keep it for the input field.
    const searchBtn = document.querySelector('.header-actions-right .icon-btn[title="Search"]');
    if (searchBtn && searchOverlay && closeSearchBtn) {
        searchBtn.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            document.getElementById('globalSearchInput').focus(); // Auto-focus the input
        });

        closeSearchBtn.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
        });

        // Also close when clicking on the overlay background
        searchOverlay.addEventListener('click', (event) => {
            if (event.target === searchOverlay) {
                searchOverlay.classList.remove('active');
            }
        });
    }

    // --- Initial Page Setup ---
    // The main content wrapper is now visible by default in the HTML.
    showView('dashboard'); // Ensure the main dashboard is shown on load.

    // --- Navigation Helper ---
    // This is good practice to have, even if session security isn't strict on this page.
    // It allows other pages with security to be navigated to from here.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && link.hostname === window.location.hostname) {
            if (link.id !== 'adminLogoutBtn') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });
});