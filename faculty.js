window.addEventListener('pageshow', (event) => {
    // This listener handles scenarios where a page is restored from the browser's
    // back-forward cache (bfcache). It forces a full reload to ensure the
    // security script in the <head> always runs.
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const facultyDataString = sessionStorage.getItem('currentFaculty');

    let facultyData = JSON.parse(facultyDataString);
    let facultyNotifications = []; // To store fetched notifications

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

    // --- Settings Modal Elements ---
    const facultySettingsModalOverlay = document.getElementById('facultySettingsModalOverlay');
    const closeFacultySettingsModalBtn = document.getElementById('closeFacultySettingsModalBtn');
    const saveFacultySettingsForm = document.getElementById('saveFacultySettingsForm');
    const facultySettingsError = document.getElementById('faculty-settings-error');
    const cancelEditFacultySettingsBtn = document.getElementById('cancelEditFacultySettingsBtn');
    const editFacultyProfilePicture = document.getElementById('editFacultyProfilePicture');
    const facultyProfilePictureInput = document.getElementById('facultyProfilePictureInput');

    // --- New Profile View Modal Elements ---
    const facultyProfileModalOverlay = document.getElementById('facultyProfileModalOverlay');
    const closeFacultyProfileModalBtn = document.getElementById('closeFacultyProfileModalBtn');

    // --- Notification Elements ---
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationDropdownList = document.querySelector('#notificationPanel ul');
    const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');
    const allNotificationsModalOverlay = document.getElementById('allNotificationsModalOverlay');
    const allNotificationsList = document.getElementById('allNotificationsList');
    const closeAllNotificationsModalBtn = document.getElementById('closeAllNotificationsModalBtn');
    const markAllAsReadBtn = document.getElementById('markAllAsReadBtn');
    // --- NEW Notification Detail Modal Elements ---
    const notificationDetailModalOverlay = document.getElementById('notificationDetailModalOverlay');
    const closeNotificationDetailModalBtn = document.getElementById('closeNotificationDetailModalBtn');
    const notificationDetailTitle = document.getElementById('notificationDetailTitle');
    const notificationDetailMessage = document.getElementById('notificationDetailMessage');
    const notificationDetailDate = document.getElementById('notificationDetailDate');

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

        // Only attach settings listener if profile is complete
        if (sideNavSettingsLink) {
            sideNavSettingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                openFacultySettingsModal();
                closeNav();
            });
        }

        // --- Apply colors to Quick Links (like student portal) ---
        const quickLinks = document.querySelectorAll('.quick-links-grid .quick-link-item');
        if (quickLinks.length > 0) {
            quickLinks.forEach((link, index) => {
                // Determine row index (0-based, since there are 2 items per row)
                const rowIndex = Math.floor(index / 2);
                // Apply color based on whether the row is even or odd
                if (rowIndex % 2 === 0) {
                    link.classList.add('ql-dark-blue');
                } else {
                    link.classList.add('ql-light-blue');
                }
            });
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

    // --- Notification Helper Functions ---
    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = Math.floor(seconds / 31536000); if (interval >= 1) return interval + ` year${interval > 1 ? 's' : ''} ago`;
        interval = Math.floor(seconds / 2592000); if (interval >= 1) return interval + ` month${interval > 1 ? 's' : ''} ago`;
        interval = Math.floor(seconds / 86400); if (interval >= 1) return interval + ` day${interval > 1 ? 's' : ''} ago`;
        interval = Math.floor(seconds / 3600); if (interval >= 1) return interval + ` hour${interval > 1 ? 's' : ''} ago`;
        interval = Math.floor(seconds / 60); if (interval >= 1) return interval + ` minute${interval > 1 ? 's' : ''} ago`;
        return Math.floor(seconds) + " seconds ago";
    };

    const createFacultyNotificationHTML = (notification) => {
        const icons = { admin_notice: '📢', assignment: '📝', leave: '✅', meeting: '👥' };
        const icon = icons[notification.type] || '🔔';
        const isReadClass = notification.isRead ? 'read' : '';
        const timeAgo = formatTimeAgo(notification.createdAt);
        return `<li><a href="#" class="notification-item ${isReadClass}" data-id="${notification.id}"><div class="notification-icon ${notification.type}">${icon}</div><div class="notification-content"><p>${notification.message}</p><small>${timeAgo}</small></div></a></li>`;
    };

    // --- Real Notification Logic ---
    const fetchAndDisplayFacultyNotifications = async () => {
        if (!notificationDropdownList || !allNotificationsList || !notificationBadge || !facultyData.username) return;

        try {
            const response = await fetch(`/api/faculty/notifications/${facultyData.username}`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            
            const notifications = await response.json();
            facultyNotifications = notifications; // Store for later use

            notificationDropdownList.innerHTML = '';
            allNotificationsList.innerHTML = '';

            const unreadCount = notifications.filter(n => !n.isRead).length;
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount;
                notificationBadge.style.display = 'flex';
            } else {
                notificationBadge.style.display = 'none';
            }

            if (notifications.length === 0) {
                const noNotifHTML = '<li class="notification-item" style="justify-content: center; color: var(--text-color-light);">No notifications yet.</li>';
                notificationDropdownList.innerHTML = noNotifHTML;
                allNotificationsList.innerHTML = noNotifHTML;
                return;
            }

            notifications.slice(0, 5).forEach(n => { // Show 5 in dropdown
                notificationDropdownList.insertAdjacentHTML('beforeend', createFacultyNotificationHTML(n));
            });

            notifications.forEach(n => {
                allNotificationsList.insertAdjacentHTML('beforeend', createFacultyNotificationHTML(n));
            });

        } catch (error) {
            console.error('Error fetching faculty notifications:', error);
            const errorHTML = '<li class="notification-item" style="justify-content: center; color: var(--btn-danger-bg);">Could not load.</li>';
            notificationDropdownList.innerHTML = errorHTML;
            allNotificationsList.innerHTML = errorHTML;
        }
    };

    const openNotificationDetailModal = (notification) => {
        if (!notificationDetailModalOverlay) return;

        let title = 'Notification';
        if (notification.type === 'admin_notice') {
            title = 'Notice from Admin';
        }
        // Add other types if needed

        notificationDetailTitle.textContent = title;
        notificationDetailMessage.textContent = notification.message;
        notificationDetailDate.textContent = `Received: ${formatTimeAgo(notification.createdAt)}`;

        if (notificationPanel) notificationPanel.classList.remove('active'); // Close dropdown
        notificationDetailModalOverlay.classList.add('active');
    };

    const openAllNotificationsModal = () => {
        if (allNotificationsModalOverlay) {
            fetchAndDisplayFacultyNotifications(); // Refresh list when opening
            allNotificationsModalOverlay.classList.add('active');
        }
    };

    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            notificationPanel.classList.toggle('active');
            // Don't hide the badge on open, only when notifications are read.
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
        markAllAsReadBtn.addEventListener('click', async () => {
            const unreadIds = facultyNotifications.filter(n => !n.isRead).map(n => n.id);
            if (unreadIds.length === 0) return;

            try {
                const response = await fetch('/api/notifications/mark-as-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationIds: unreadIds })
                });
                if (!response.ok) throw new Error('Failed to mark all as read.');
                
                // Update UI immediately
                facultyNotifications.forEach(n => n.isRead = true);
                fetchAndDisplayFacultyNotifications(); // This will re-render everything correctly
            } catch (error) {
                console.error('Error marking all notifications as read:', error);
                alert(error.message);
            }
        });
    }

    const handleFacultyNotificationClick = async (e) => {
        e.preventDefault();
        const notificationItem = e.target.closest('.notification-item');
        if (!notificationItem) return;

        const notificationId = parseInt(notificationItem.dataset.id, 10);
        const notification = facultyNotifications.find(n => n.id === notificationId);

        if (!notification) return;

        if (!notification.isRead) {
            try {
                const response = await fetch('/api/notifications/mark-as-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationIds: [notification.id] })
                });
                if (!response.ok) throw new Error('Failed to mark as read.');
                
                notification.isRead = true; // Update local state
                fetchAndDisplayFacultyNotifications(); // Re-render to update badge and styles
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Open the detail modal regardless of read status
        openNotificationDetailModal(notification);
    };

    if (notificationDropdownList) notificationDropdownList.addEventListener('click', handleFacultyNotificationClick);
    if (allNotificationsList) allNotificationsList.addEventListener('click', handleFacultyNotificationClick);

    // --- Settings Modal Logic ---
    const openFacultyProfileModal = async () => {
        if (!facultyProfileModalOverlay) return;

        try {
            // Fetch fresh data to ensure it's up-to-date
            const username = facultyData.username;
            const response = await fetch(`/api/faculty/me?username=${username}`);
            if (!response.ok) throw new Error('Could not fetch your profile details.');
            
            const currentFacultyData = await response.json();
            facultyData = currentFacultyData; // Update local data

            // Populate the view-only modal
            document.getElementById('viewFacultyProfilePic').src = currentFacultyData.profilePicture || 'default-avatar.png';
            document.getElementById('viewFacultyName').textContent = currentFacultyData.name || 'N/A';
            document.getElementById('viewFacultyUsername').textContent = currentFacultyData.username || 'N/A';
            document.getElementById('viewFacultyEmail').textContent = currentFacultyData.email || 'N/A';
            document.getElementById('viewFacultyMobile').textContent = currentFacultyData.mobileNumber || 'N/A';
            document.getElementById('viewFacultyType').textContent = currentFacultyData.teacherChoice || 'N/A';
            document.getElementById('viewFacultySubject').textContent = currentFacultyData.subject || 'N/A';

            facultyProfileModalOverlay.classList.add('active');

        } catch (error) {
            console.error("Error opening profile view:", error);
            alert(error.message);
        }
    };

    if (closeFacultyProfileModalBtn) {
        closeFacultyProfileModalBtn.addEventListener('click', () => {
            closeModal(facultyProfileModalOverlay);
        });
    }
    if (facultyProfileModalOverlay) {
        facultyProfileModalOverlay.addEventListener('click', (e) => {
            if (e.target === facultyProfileModalOverlay) {
                closeModal(facultyProfileModalOverlay);
            }
        });
    }
    const openFacultySettingsModal = async () => {
        if (!facultySettingsModalOverlay) return;

        try {
            const username = facultyData.username;
            const response = await fetch(`/api/faculty/me?username=${username}`);
            if (!response.ok) throw new Error('Could not fetch your details.');
            
            const currentFacultyData = await response.json();
            facultyData = currentFacultyData; // Update local data
            
            // Populate edit form
            document.getElementById('editFacultyName').value = currentFacultyData.name || '';
            document.getElementById('editFacultyUsername').value = currentFacultyData.username || '';
            if (editFacultyProfilePicture) editFacultyProfilePicture.src = currentFacultyData.profilePicture || 'default-avatar.png';
            document.getElementById('editFacultyEmail').value = currentFacultyData.email || '';
            document.getElementById('editFacultyMobile').value = currentFacultyData.mobileNumber || '';
            document.getElementById('editFacultyTeacherChoice').value = currentFacultyData.teacherChoice || '';
            document.getElementById('editFacultySubject').value = currentFacultyData.subject || '';

            // Clear password fields and error message
            document.getElementById('editFacultyCurrentPassword').value = '';
            document.getElementById('editFacultyNewPassword').value = '';
            document.getElementById('editFacultyConfirmPassword').value = '';
            if (facultySettingsError) facultySettingsError.style.display = 'none';
            if (facultyProfilePictureInput) facultyProfilePictureInput.value = ''; // Clear file input on open
            facultySettingsModalOverlay.classList.add('active');

        } catch (error) {
            console.error("Error opening settings:", error);
            alert(error.message);
        }
    };

    const closeModal = (modal) => {
        if (modal) modal.classList.remove('active');
    };

    if (closeNotificationDetailModalBtn) {
        closeNotificationDetailModalBtn.addEventListener('click', () => {
            closeModal(notificationDetailModalOverlay);
        });
    }
    if (notificationDetailModalOverlay) {
        notificationDetailModalOverlay.addEventListener('click', (e) => {
            if (e.target === notificationDetailModalOverlay) closeModal(notificationDetailModalOverlay);
        });
    }

    if (closeFacultySettingsModalBtn) {
        closeFacultySettingsModalBtn.addEventListener('click', () => {
            closeModal(facultySettingsModalOverlay);
        });
    }

    if (cancelEditFacultySettingsBtn) {
        cancelEditFacultySettingsBtn.addEventListener('click', () => {
            closeModal(facultySettingsModalOverlay);
        });
    }


    if (saveFacultySettingsForm) {
        saveFacultySettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (facultySettingsError) facultySettingsError.style.display = 'none';

            const newPassword = document.getElementById('editFacultyNewPassword').value;
            const confirmPassword = document.getElementById('editFacultyConfirmPassword').value;
            const currentPassword = document.getElementById('editFacultyCurrentPassword').value;

            if (newPassword && newPassword !== confirmPassword) {
                facultySettingsError.textContent = 'New passwords do not match.';
                facultySettingsError.style.display = 'block';
                return;
            }

            // The server requires the current password to save any changes. This check enforces that on the client-side.
            if (!currentPassword) {
                facultySettingsError.textContent = 'Current password is required to save changes.';
                facultySettingsError.style.display = 'block';
                document.getElementById('editFacultyCurrentPassword').focus();
                return;
            }

            // Use FormData to handle all fields, including the file input
            const formData = new FormData(saveFacultySettingsForm);
            // We already validated newPassword === confirmPassword, so we can remove one.
            // The server doesn't need it.
            formData.delete('confirmPassword'); 
            // The server will handle password logic based on whether newPassword is provided.

            const submitBtn = saveFacultySettingsForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            try {
                const response = await fetch('/api/faculty/update-settings', {
                    method: 'POST',
                    // Do not set Content-Type header; the browser will set it correctly for multipart/form-data
                    body: formData
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert('Settings updated successfully!');
                sessionStorage.setItem('currentFaculty', JSON.stringify(result.facultyData)); // Update session storage
                facultyData = result.facultyData; // Update local data
                // Update side nav avatar
                if (sideNavAvatar) sideNavAvatar.src = facultyData.profilePicture || 'default-avatar.png';
                closeModal(facultySettingsModalOverlay); // Close modal on success

            } catch (error) {
                facultySettingsError.textContent = error.message;
                facultySettingsError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Changes';
            }
        });
    }

    // --- Settings Modal: Profile Picture Preview ---
    if (facultyProfilePictureInput && editFacultyProfilePicture) {
        facultyProfilePictureInput.addEventListener('change', () => {
            const file = facultyProfilePictureInput.files[0];
            if (file) {
                // Create a temporary URL for the selected file and show it in the <img> tag
                editFacultyProfilePicture.src = URL.createObjectURL(file);
            }
        });
    }

    // Open profile modal by clicking the avatar
    if (sideNavAvatar) {
        sideNavAvatar.addEventListener('click', () => {
            openFacultyProfileModal();
            closeNav();
        });
    }

    // --- Initial Data Fetch on Page Load ---
    fetchAndDisplayFacultyNotifications();
});