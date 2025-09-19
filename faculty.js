document.addEventListener('DOMContentLoaded', () => {
    const facultyDataString = sessionStorage.getItem('currentFaculty');
    if (!facultyDataString) {
        // This check is a fallback. The head script should have already redirected.
        window.location.replace('faculty-login.html');
        return;
    }

    let facultyData = JSON.parse(facultyDataString);

    // --- DOM Elements ---
    const sideNavBtn = document.getElementById('sideNavBtn');
    const sideNav = document.getElementById('sideNav');
    const sideNavOverlay = document.getElementById('sideNavOverlay');
    const closeSideNavBtn = document.getElementById('closeSideNavBtn');
    const sideNavName = document.getElementById('sideNavName');
    const sideNavAvatar = document.getElementById('sideNavAvatar');
    const facultyLogoutBtn = document.getElementById('facultyLogoutBtn');

    // Profile Completion Modal
    const profileCompletionModalOverlay = document.getElementById('profileCompletionModalOverlay');
    const profileCompletionForm = document.getElementById('profileCompletionForm');
    const completionPasswordError = document.getElementById('completion-password-error');
    const completionFormError = document.getElementById('completion-form-error');

    // --- NEW: Search Modal Elements ---
    const facultySearchBtn = document.getElementById('facultySearchBtn');
    const facultySearchModalOverlay = document.getElementById('facultySearchModalOverlay');
    const closeFacultySearchModalBtn = document.getElementById('closeFacultySearchModalBtn');
    const facultySearchInput = document.getElementById('facultySearchInput');

    // --- NEW: Notification Elements ---
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationDropdownList = document.querySelector('#notificationPanel ul');
    const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');
    const allNotificationsModalOverlay = document.getElementById('allNotificationsModalOverlay');
    const allNotificationsList = document.getElementById('allNotificationsList');
    const closeAllNotificationsModalBtn = document.getElementById('closeAllNotificationsModalBtn');
    const markAllAsReadBtn = document.getElementById('markAllAsReadBtn');

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

    if (sideNavBtn && closeSideNavBtn && sideNavOverlay) {
        sideNavBtn.addEventListener('click', openNav);
        closeSideNavBtn.addEventListener('click', closeNav);
        sideNavOverlay.addEventListener('click', closeNav);
    }

    // --- Populate Side Navigation Header ---
    if (sideNavName) sideNavName.textContent = facultyData.name || 'Faculty';
    if (sideNavAvatar) sideNavAvatar.src = facultyData.profilePicture || 'default-avatar.png';

    // --- Logout ---
    if (facultyLogoutBtn) {
        facultyLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            window.location.replace('faculty-login.html');
        });
    }

    // --- Profile Completion Check ---
    if (facultyData && !facultyData.isProfileComplete) {
        if (profileCompletionModalOverlay) {
            profileCompletionModalOverlay.classList.add('active');
            // Populate fields
            document.getElementById('completionName').value = facultyData.name || '';
            // Populate DOB dropdowns
            const daySelect = document.getElementById('completionDobDay');
            const monthSelect = document.getElementById('completionDobMonth');
            const yearSelect = document.getElementById('completionDobYear');
            for (let i = 1; i <= 31; i++) daySelect.innerHTML += `<option value="${i}">${i}</option>`;
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            months.forEach((month, index) => monthSelect.innerHTML += `<option value="${index + 1}">${month}</option>`);
            const currentYear = new Date().getFullYear();
            for (let i = currentYear - 22; i >= currentYear - 70; i--) yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
        }
    }

    // --- Profile Completion Form Submission ---
    if (profileCompletionForm) {
        profileCompletionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            completionPasswordError.textContent = '';
            completionFormError.textContent = '';

            const newPassword = document.getElementById('completionNewPassword').value;
            const confirmPassword = document.getElementById('completionConfirmPassword').value;

            if (newPassword !== confirmPassword) {
                completionPasswordError.textContent = 'New passwords do not match.';
                return;
            }

            const formData = new FormData(profileCompletionForm);
            const day = formData.get('dob-day');
            const month = formData.get('dob-month');
            const year = formData.get('dob-year');
            const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const data = {
                username: facultyData.username,
                currentPassword: formData.get('currentPassword'),
                newPassword: newPassword,
                email: formData.get('email'),
                mobileNumber: formData.get('mobileNumber'),
                dob: dob,
                teacherChoice: formData.get('teacherChoice'),
                subject: formData.get('subject'),
            };

            try {
                const response = await fetch('/api/faculty/complete-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert('Profile completed successfully!');
                sessionStorage.setItem('currentFaculty', JSON.stringify(result.facultyData));
                profileCompletionModalOverlay.classList.remove('active');
                window.location.reload(); // Reload to show dashboard
            } catch (error) {
                completionFormError.textContent = error.message;
            }
        });
    }

    // --- Notification Logic ---
    const mockFacultyNotifications = [
        { id: 1, type: 'assignment', text: '3 students submitted assignments for PHY101.', time: '15 mins ago', read: false },
        { id: 2, type: 'leave', text: 'Your leave request for tomorrow has been approved.', time: '1 hour ago', read: false },
        { id: 3, type: 'meeting', text: 'Department meeting scheduled for 4 PM today.', time: '2 hours ago', read: true },
    ];

    const createFacultyNotificationHTML = (notification) => {
        const icons = { assignment: '📝', leave: '✅', meeting: '👥' };
        const icon = icons[notification.type] || '🔔';
        const isReadClass = notification.read ? 'read' : '';
        return `<li><a href="#" class="notification-item ${isReadClass}" data-id="${notification.id}"><div class="notification-icon ${notification.type}">${icon}</div><div class="notification-content"><p>${notification.text}</p><small>${notification.time}</small></div></a></li>`;
    };

    const fetchAndDisplayFacultyNotifications = () => {
        if (!notificationDropdownList || !allNotificationsList || !notificationBadge) return;

        const notifications = mockFacultyNotifications;

        notificationDropdownList.innerHTML = '';
        allNotificationsList.innerHTML = '';

        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }

        notifications.slice(0, 3).forEach(n => {
            notificationDropdownList.insertAdjacentHTML('beforeend', createFacultyNotificationHTML(n));
        });

        notifications.forEach(n => {
            allNotificationsList.insertAdjacentHTML('beforeend', createFacultyNotificationHTML(n));
        });
    };

    const openAllNotificationsModal = () => {
        if (allNotificationsModalOverlay) {
            fetchAndDisplayFacultyNotifications();
            allNotificationsModalOverlay.classList.add('active');
        }
    };

    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            notificationPanel.classList.toggle('active');
            if (notificationBadge) notificationBadge.style.display = 'none';
        });
        document.addEventListener('click', (event) => {
            if (!notificationBtn.contains(event.target) && !notificationPanel.contains(event.target)) {
                notificationPanel.classList.remove('active');
            }
        });
    }

    if (viewAllNotificationsLink) {
        viewAllNotificationsLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (notificationPanel) notificationPanel.classList.remove('active');
            openAllNotificationsModal();
        });
    }
    if (closeAllNotificationsModalBtn) closeAllNotificationsModalBtn.addEventListener('click', () => allNotificationsModalOverlay.classList.remove('active'));
    if (allNotificationsModalOverlay) allNotificationsModalOverlay.addEventListener('click', (e) => { if (e.target === allNotificationsModalOverlay) allNotificationsModalOverlay.classList.remove('active'); });

    if (markAllAsReadBtn) {
        markAllAsReadBtn.addEventListener('click', () => {
            mockFacultyNotifications.forEach(n => n.read = true);
            fetchAndDisplayFacultyNotifications();
        });
    }

    const handleFacultyNotificationClick = (e) => {
        e.preventDefault();
        const notificationItem = e.target.closest('.notification-item');
        if (!notificationItem) return;

        const notificationId = parseInt(notificationItem.dataset.id, 10);
        const notification = mockFacultyNotifications.find(n => n.id === notificationId);

        if (notification && !notification.read) {
            notification.read = true;
            fetchAndDisplayFacultyNotifications();
        }
    };

    if (notificationDropdownList) notificationDropdownList.addEventListener('click', handleFacultyNotificationClick);
    if (allNotificationsList) allNotificationsList.addEventListener('click', handleFacultyNotificationClick);

    // --- NEW: Search Modal Logic ---
    if (facultySearchBtn) {
        facultySearchBtn.addEventListener('click', () => {
            if (facultySearchModalOverlay) {
                facultySearchModalOverlay.classList.add('active');
                if (facultySearchInput) facultySearchInput.focus();
            }
        });
    }
    if (closeFacultySearchModalBtn) {
        closeFacultySearchModalBtn.addEventListener('click', () => {
            if (facultySearchModalOverlay) facultySearchModalOverlay.classList.remove('active');
        });
    }
    if (facultySearchModalOverlay) {
        facultySearchModalOverlay.addEventListener('click', (e) => {
            if (e.target === facultySearchModalOverlay) facultySearchModalOverlay.classList.remove('active');
        });
    }

    // --- Initial Data Fetch on Page Load ---
    fetchAndDisplayFacultyNotifications();
});