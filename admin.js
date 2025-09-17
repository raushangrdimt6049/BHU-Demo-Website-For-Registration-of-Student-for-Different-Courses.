window.addEventListener('pageshow', (event) => {
    // This listener handles scenarios where a page is restored from the browser's
    // back-forward cache (bfcache). It forces a full reload to ensure the
    // JavaScript runs from a clean state, which is important for single-page-app-like behavior.
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- Password Protection Elements ---
    const passwordOverlay = document.getElementById('password-overlay');
    const adminPasswordForm = document.getElementById('adminPasswordForm');
    const adminUsernameInput = document.getElementById('adminUsernameInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const passwordError = document.getElementById('password-error');
    const correctUsername = 'Raushan_143';
    const correctPassword = '4gh4m01r';

    // --- View Containers and Navigation ---
    const adminContentWrapper = document.getElementById('admin-content-wrapper');
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

    // --- Post Notice Modal Elements ---
    const postNoticeBtn = document.getElementById('postNoticeBtn');
    const postNoticeModalOverlay = document.getElementById('postNoticeModalOverlay');
    const postNoticeForm = document.getElementById('postNoticeForm');
    const noticeMessageInput = document.getElementById('noticeMessageInput');
    const cancelNoticeBtn = document.getElementById('cancelNoticeBtn');
    const noticeError = document.getElementById('notice-error');

    // --- Password Protection Logic ---
    if (passwordOverlay && adminPasswordForm) {
        passwordOverlay.style.display = 'flex'; // Make sure it's visible
        adminPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredUsername = adminUsernameInput.value;
            const enteredPassword = adminPasswordInput.value;

            if (enteredUsername.toLowerCase() === correctUsername.toLowerCase() && enteredPassword === correctPassword) {
                // On correct credentials, hide the overlay and show the admin content.
                passwordOverlay.style.opacity = '0';
                setTimeout(() => {
                    passwordOverlay.style.display = 'none';
                }, 300); // Match the transition duration
                adminContentWrapper.style.display = 'block';
                showView('dashboard'); // Show the dashboard view within the main content
            } else {
                passwordError.textContent = 'Incorrect username or password. Please try again.';
                passwordError.style.display = 'block';
                // For security, only clear the password field.
                adminPasswordInput.value = '';
                adminUsernameInput.focus();
            }
        });
    }

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

    // --- Post Notice Modal Logic ---
    if (postNoticeBtn) {
        postNoticeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (postNoticeModalOverlay) {
                postNoticeModalOverlay.style.display = 'flex';
                noticeMessageInput.value = '';
                noticeError.style.display = 'none';
            }
        });
    }

    if (cancelNoticeBtn) {
        cancelNoticeBtn.addEventListener('click', () => {
            if (postNoticeModalOverlay) {
                postNoticeModalOverlay.style.display = 'none';
            }
        });
    }

    if (postNoticeForm) {
        postNoticeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = noticeMessageInput.value.trim();
            if (!message) {
                noticeError.textContent = 'Notice message cannot be empty.';
                noticeError.style.display = 'block';
                return;
            }

            if (!confirm('Are you sure you want to send this notice to ALL students? This action cannot be undone.')) {
                return;
            }

            const submitBtn = postNoticeForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            noticeError.style.display = 'none';

            try {
                const response = await fetch('/api/admin/send-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to send notice.');
                alert(result.message);
                postNoticeModalOverlay.style.display = 'none';
            } catch (error) {
                noticeError.textContent = error.message;
                noticeError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Notice';
            }
        });
    }

    // --- Navigation Helper ---
    // This is good practice to have, even if session security isn't strict on this page.
    // It allows other pages with security to be navigated to from here.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && (link.hostname === window.location.hostname || !link.hostname)) {
            if (link.id !== 'adminLogoutBtn') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });
});