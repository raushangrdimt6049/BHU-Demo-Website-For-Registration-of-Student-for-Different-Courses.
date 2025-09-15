// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// security script in the <head> always runs.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const facultyDataString = sessionStorage.getItem('currentFaculty');
    if (!facultyDataString) {
        // This should be caught by the inline script, but it's a good fallback.
        window.location.replace('faculty-login.html');
        return;
    }
    const facultyData = JSON.parse(facultyDataString);

    // --- Side Navigation Elements ---
    const sideNavBtn = document.getElementById('sideNavBtn');
    const sideNav = document.getElementById('sideNav');
    const sideNavOverlay = document.getElementById('sideNavOverlay');
    const closeSideNavBtn = document.getElementById('closeSideNavBtn');
    const sideNavAvatar = document.getElementById('sideNavAvatar');
    const sideNavName = document.getElementById('sideNavName');
    const facultyLogoutBtn = document.getElementById('facultyLogoutBtn');

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

    // --- Initialize Navigation ---
    if (sideNavBtn && closeSideNavBtn && sideNavOverlay) {
        sideNavBtn.addEventListener('click', openNav);
        closeSideNavBtn.addEventListener('click', closeNav);
        sideNavOverlay.addEventListener('click', closeNav);
    }

    // Populate side navigation with faculty info from sessionStorage
    if (sideNavName) {
        sideNavName.textContent = facultyData.name || 'Faculty';
    }
    if (sideNavAvatar) {
        sideNavAvatar.src = facultyData.avatar || 'default-avatar.png';
        sideNavAvatar.onerror = () => { sideNavAvatar.src = 'default-avatar.png'; };
    }

    // Handle logout from side navigation
    if (facultyLogoutBtn) {
        facultyLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            window.location.replace('index.html'); // Go to main portal on logout
        });
    }

    // --- Navigation Helper ---
    // Sets a flag before any internal link is followed to allow the next page to load.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && link.hostname === window.location.hostname) {
            if (link.id !== 'facultyLogoutBtn') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });
});