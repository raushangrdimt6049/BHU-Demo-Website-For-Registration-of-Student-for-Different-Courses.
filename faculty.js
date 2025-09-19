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
    const sideNavSettingsLink = document.getElementById('sideNavSettingsLink');
    const facultyDashboard = document.querySelector('.faculty-dashboard');

    // Profile Completion Modal
    const profileCompletionModalOverlay = document.getElementById('profileCompletionModalOverlay');
    const profileCompletionForm = document.getElementById('profileCompletionForm');
    const completionPasswordError = document.getElementById('completion-password-error');
    const completionFormError = document.getElementById('completion-form-error');

    // --- NEW: Profile Modal Elements ---
    const facultyProfileModalOverlay = document.getElementById('facultyProfileModalOverlay');
    const closeFacultyProfileModalBtn = document.getElementById('closeFacultyProfileModalBtn');

    // --- NEW: Settings Modal Elements ---
    const facultySettingsModalOverlay = document.getElementById('facultySettingsModalOverlay');
    const closeFacultySettingsModalBtn = document.getElementById('closeFacultySettingsModalBtn');
    const editFacultySettingsBtn = document.getElementById('editFacultySettingsBtn');
    const saveFacultySettingsForm = document.getElementById('saveFacultySettingsForm');
    const facultySettingsError = document.getElementById('faculty-settings-error');

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
    if (sideNavAvatar) {
        sideNavAvatar.src = facultyData.profilePicture || 'default-avatar.png';
        sideNavAvatar.style.cursor = 'pointer';
    }

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
    } else {
        // Profile is complete, so build the dashboard header
        if (facultyDashboard) {
            const headerHTML = `
                <div class="welcome-banner">
                    <h2>Welcome, ${facultyData.name || 'Faculty'}</h2>
                </div>
                <div class="faculty-profile-intro">
                    <img src="${facultyData.profilePicture || 'default-avatar.png'}" alt="Profile Picture" class="profile-intro-pic" onerror="this.onerror=null;this.src='default-avatar.png';">
                    <h3>${facultyData.name || 'Faculty'}</h3>
                    <p>Username: ${facultyData.username || 'N/A'}</p>
                </div>
            `;
            facultyDashboard.insertAdjacentHTML('afterbegin', headerHTML);
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

    // --- NEW: Profile Modal Logic ---
    const openFacultyProfileModal = () => {
        if (!facultyProfileModalOverlay) return;

        // Populate modal with data from the facultyData object
        document.getElementById('modalFacultyAvatar').src = facultyData.profilePicture || 'default-avatar.png';
        document.getElementById('modalFacultyName').textContent = facultyData.name || 'N/A';
        document.getElementById('modalFacultyUsername').textContent = facultyData.username || 'N/A';
        document.getElementById('modalFacultyEmail').textContent = facultyData.email || 'N/A';
        document.getElementById('modalFacultyMobile').textContent = facultyData.mobileNumber || 'N/A';

        facultyProfileModalOverlay.classList.add('active');
        closeNav(); // Close the side nav if it's open
    };

    if (sideNavAvatar) {
        sideNavAvatar.addEventListener('click', openFacultyProfileModal);
    }

    if (closeFacultyProfileModalBtn) {
        closeFacultyProfileModalBtn.addEventListener('click', () => {
            if (facultyProfileModalOverlay) facultyProfileModalOverlay.classList.remove('active');
        });
    }
    if (facultyProfileModalOverlay) {
        facultyProfileModalOverlay.addEventListener('click', (e) => {
            if (e.target === facultyProfileModalOverlay) facultyProfileModalOverlay.classList.remove('active');
        });
    }

    // --- NEW: Settings Modal Logic ---
    const openFacultySettingsModal = async () => {
        if (!facultySettingsModalOverlay) return;

        try {
            const response = await fetch(`/api/faculty/me?username=${facultyData.username}`);
            if (!response.ok) throw new Error('Could not fetch your details.');
            
            const currentFacultyData = await response.json();
            facultyData = currentFacultyData; // Update local data
            
            // Populate view mode
            document.getElementById('settingFacultyName').textContent = currentFacultyData.name || 'N/A';
            document.getElementById('settingFacultyUsername').textContent = currentFacultyData.username || 'N/A';
            document.getElementById('settingFacultyEmail').textContent = currentFacultyData.email || 'N/A';
            document.getElementById('settingFacultyMobile').textContent = currentFacultyData.mobileNumber || 'N/A';
            document.getElementById('settingFacultyType').textContent = currentFacultyData.teacherChoice || 'N/A';

            // Show view mode, hide edit mode
            document.getElementById('faculty-settings-view').style.display = 'block';
            document.getElementById('faculty-settings-edit').style.display = 'none';
            facultySettingsModalOverlay.classList.add('active');

        } catch (error) {
            console.error("Error opening settings:", error);
            alert(error.message);
        }
    };

    if (sideNavSettingsLink) {
        sideNavSettingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openFacultySettingsModal();
            closeNav();
        });
    }

    if (closeFacultySettingsModalBtn) {
        closeFacultySettingsModalBtn.addEventListener('click', () => {
            if (facultySettingsModalOverlay) facultySettingsModalOverlay.classList.remove('active');
        });
    }

    if (editFacultySettingsBtn) {
        editFacultySettingsBtn.addEventListener('click', () => {
            // Populate edit form
            document.getElementById('editFacultyName').value = facultyData.name || '';
            document.getElementById('editFacultyUsername').value = facultyData.username || '';
            document.getElementById('editFacultyEmail').value = facultyData.email || '';
            document.getElementById('editFacultyMobile').value = facultyData.mobileNumber || '';
            document.getElementById('editFacultyTeacherChoice').value = facultyData.teacherChoice || '';
            
            // Clear password fields
            document.getElementById('editFacultyCurrentPassword').value = '';
            document.getElementById('editFacultyNewPassword').value = '';
            document.getElementById('editFacultyConfirmPassword').value = '';
            if (facultySettingsError) facultySettingsError.style.display = 'none';

            // Switch views
            document.getElementById('faculty-settings-view').style.display = 'none';
            document.getElementById('faculty-settings-edit').style.display = 'block';
        });
    }

    if (saveFacultySettingsForm) {
        saveFacultySettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (facultySettingsError) facultySettingsError.style.display = 'none';

            const newPassword = document.getElementById('editFacultyNewPassword').value;
            const confirmPassword = document.getElementById('editFacultyConfirmPassword').value;

            if (newPassword && newPassword !== confirmPassword) {
                facultySettingsError.textContent = 'New passwords do not match.';
                facultySettingsError.style.display = 'block';
                return;
            }

            const formData = new FormData(saveFacultySettingsForm);
            const dataToSubmit = Object.fromEntries(formData.entries());
            dataToSubmit.username = facultyData.username; // Ensure username is sent
            
            const submitBtn = saveFacultySettingsForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            try {
                const response = await fetch('/api/faculty/update-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSubmit)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert('Settings updated successfully!');
                facultyData = result.facultyData; // Update local data
                sessionStorage.setItem('currentFaculty', JSON.stringify(facultyData)); // Update session storage

                // Re-populate view mode with new data and switch back
                openFacultySettingsModal();

            } catch (error) {
                facultySettingsError.textContent = error.message;
                facultySettingsError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Changes';
            }
        });
    }

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