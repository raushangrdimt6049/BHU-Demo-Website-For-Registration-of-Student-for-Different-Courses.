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
    const allStudentsView = document.getElementById('all-students-view');
    const allFacultyView = document.getElementById('all-faculty-view');
    const allTimetablesView = document.getElementById('all-timetables-view');
    const backToDashboardFromStudentsBtn = document.getElementById('backToDashboardFromStudentsBtn');
    const backToDashboardFromFacultyBtn = document.getElementById('backToDashboardFromFacultyBtn');
    const backToDashboardFromTimetablesBtn = document.getElementById('backToDashboardFromTimetablesBtn');
    // --- Side Navigation Elements ---
    const sideNavBtn = document.getElementById('sideNavBtn');
    const sideNav = document.getElementById('adminSideNav');
    const sideNavDashboardLink = document.getElementById('sideNavDashboardLink');
    const sideNavOverlay = document.getElementById('sideNavOverlay');
    const closeSideNavBtn = document.getElementById('closeSideNavBtn');
    const sideNavUsersLink = document.getElementById('sideNavUsersLink');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const sideNavTimetableLink = document.getElementById('sideNavTimetableLink');
    const sideNavPostNoticeBtn = document.getElementById('sideNavPostNoticeBtn');
    // --- Notification Panel References ---
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationDropdownList = document.querySelector('#notificationPanel ul');
    const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');
    const allNotificationsModalOverlay = document.getElementById('allNotificationsModalOverlay');
    const allNotificationsList = document.getElementById('allNotificationsList');
    const closeAllNotificationsModalBtn = document.getElementById('closeAllNotificationsModalBtn');
    const markAllAsReadBtn = document.getElementById('markAllAsReadBtn');

    // --- Post Notice Modal Elements ---
    const viewAllStudentsBtn = document.getElementById('viewAllStudentsBtn');
    const viewAllFacultyBtn = document.getElementById('viewAllFacultyBtn');
    const postNoticeBtn = document.getElementById('postNoticeBtn');
    const postNoticeModalOverlay = document.getElementById('postNoticeModalOverlay');
    const postNoticeForm = document.getElementById('postNoticeForm');
    const noticeMessageInput = document.getElementById('noticeMessageInput');
    const cancelNoticeBtn = document.getElementById('cancelNoticeBtn');
    const noticeError = document.getElementById('notice-error');
    const viewNoticeHistoryBtn = document.getElementById('viewNoticeHistoryBtn');

    // --- Notice History Modal Elements ---
    const noticeHistoryModalOverlay = document.getElementById('noticeHistoryModalOverlay');
    const noticeHistoryList = document.getElementById('noticeHistoryList');
    const closeNoticeHistoryBtn = document.getElementById('closeNoticeHistoryBtn');

    // --- Add Faculty Modal Elements ---
    const addFacultyBtn = document.getElementById('addFacultyBtn');
    const addFacultyModalOverlay = document.getElementById('addFacultyModalOverlay');
    const addFacultyForm = document.getElementById('addFacultyForm');
    const cancelAddFacultyBtn = document.getElementById('cancelAddFacultyBtn');
    const addFacultyError = document.getElementById('add-faculty-error');

    // --- Timetable Modal Elements ---
    const timetableModalOverlay = document.getElementById('timetableModalOverlay');
    const timetableModalTitle = document.getElementById('timetableModalTitle');
    const timetableModalTable = document.getElementById('timetableModalTable');
    const timetableModalBody = document.getElementById('timetableModalBody');
    const editTimetableBtn = document.getElementById('editTimetableBtn');
    const saveTimetableBtn = document.getElementById('saveTimetableBtn');
    const closeTimetableModalBtn = document.getElementById('closeTimetableModalBtn');
    const printTimetableBtn = document.getElementById('printTimetableBtn');
    const timetableDefaultActions = document.getElementById('timetableDefaultActions');
    const timetableEditActions = document.getElementById('timetableEditActions');

    // --- Search Modal Elements ---
    const searchUsersBtn = document.getElementById('searchUsersBtn');
    const searchModalOverlay = document.getElementById('searchModalOverlay');
    const adminSearchInput = document.getElementById('adminSearchInput');
    const adminSearchResultsList = document.getElementById('adminSearchResultsList');
    const adminNoSearchResults = document.getElementById('admin-no-search-results');
    const closeSearchModalBtn = document.getElementById('closeSearchModalBtn');

    // --- User Detail Modal Elements ---
    const userDetailModalOverlay = document.getElementById('userDetailModalOverlay');
    const userDetailName = document.getElementById('userDetailName');
    const studentDetailSection = document.getElementById('studentDetailSection');
    const facultyDetailSection = document.getElementById('facultyDetailSection');
    const closeUserDetailBtn = document.getElementById('closeUserDetailBtn');

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

                // --- New logic for Quick Action Button colors ---
                const quickActionBtns = document.querySelectorAll('.quick-action-btn');
                const colors = ['#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#c0392b']; // Dark Blue, Green, Orange, Purple, Red

                quickActionBtns.forEach((btn, index) => {
                    // Apply colors in a repeating cycle
                    btn.style.backgroundColor = colors[index % colors.length];
                    btn.style.color = '#fff'; // Set text color to white for better contrast
                    btn.style.borderColor = 'transparent'; // Remove border for a cleaner look
                    // Remove old hover effects if they were class-based
                    btn.classList.remove('add', 'post', 'report');
                });

            } else {
                passwordError.textContent = 'Incorrect username or password. Please try again.';
                passwordError.style.display = 'block';
                // For security, only clear the password field.
                adminPasswordInput.value = '';
                adminUsernameInput.focus();
            }
        });
    }

    // --- Active Link Management ---
    const setActiveNavLink = (activeLinkId) => {
        // Remove active class from all nav links
        document.querySelectorAll('#adminSideNav ul li a').forEach(link => {
            link.classList.remove('active-nav-link');
        });

        // Add active class to the specified link
        const activeLink = document.getElementById(activeLinkId);
        if (activeLink) {
            activeLink.classList.add('active-nav-link');
        }
    };
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
        allStudentsView.style.display = 'none';
        allFacultyView.style.display = 'none';
        allTimetablesView.style.display = 'none';

        if (viewToShow === 'dashboard') {
            mainDashboardView.style.display = 'block';
            setActiveNavLink('sideNavDashboardLink');
        } else if (viewToShow === 'timetables') {
            allTimetablesView.style.display = 'block';
            setActiveNavLink('sideNavTimetableLink');
        } else if (viewToShow === 'students') {
            allStudentsView.style.display = 'block';
            fetchAllStudents();
            setActiveNavLink('sideNavUsersLink');
        } else if (viewToShow === 'faculty') {
            allFacultyView.style.display = 'block';
            fetchAllFaculty();
            setActiveNavLink('sideNavUsersLink');
        }
    };
    const revertActiveLinkToView = () => {
        if (mainDashboardView.style.display === 'block') {
            setActiveNavLink('sideNavDashboardLink');
        } else if (allTimetablesView.style.display === 'block') {
            setActiveNavLink('sideNavTimetableLink');
        } else if (allStudentsView.style.display === 'block' || allFacultyView.style.display === 'block') {
            setActiveNavLink('sideNavUsersLink');
        } else {
            setActiveNavLink('sideNavDashboardLink'); // Fallback
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

    // Open Dashboard view from side nav
    if (sideNavDashboardLink) {
        sideNavDashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('dashboard');
            closeNav(); // Close the side nav
        });
    }

    // Open Post Notice modal from side nav
    if (sideNavPostNoticeBtn) {
        sideNavPostNoticeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (postNoticeModalOverlay) {
                setActiveNavLink('sideNavPostNoticeBtn');
                postNoticeModalOverlay.style.display = 'flex';
                noticeMessageInput.value = '';
                noticeError.style.display = 'none';
            }
            closeNav(); // Close the side nav
        });
    }

    // Open Users view from side nav
    if (sideNavUsersLink) {
        sideNavUsersLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('students'); // Default to showing students view
            closeNav();
        });
    }

    // Open Timetable view from side nav
    if (sideNavTimetableLink) {
        sideNavTimetableLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('timetables');
            closeNav(); // Close the side nav
        });
    }

    // --- Event Listeners for new buttons ---
    if (viewAllStudentsBtn) {
        viewAllStudentsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showView('students');
        });
    }
    if (viewAllFacultyBtn) {
        viewAllFacultyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showView('faculty');
        });
    }
    if (backToDashboardFromStudentsBtn) {
        backToDashboardFromStudentsBtn.addEventListener('click', () => showView('dashboard'));
    }
    if (backToDashboardFromFacultyBtn) {
        backToDashboardFromFacultyBtn.addEventListener('click', () => showView('dashboard'));
    }
    if (backToDashboardFromTimetablesBtn) {
        backToDashboardFromTimetablesBtn.addEventListener('click', () => showView('dashboard'));
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

    // --- New Notification Logic ---
    const mockAdminNotifications = [
        { id: 1, type: 'admission', text: '12 new student admissions are pending approval.', time: 'Just now', read: false },
        { id: 2, type: 'fee-defaulter', text: '8 students have outstanding fee balances for this semester.', time: '1 hour ago', read: false },
        { id: 3, type: 'leave-request', text: 'Dr. Sharma has requested leave from 24th to 26th.', time: '3 hours ago', read: false },
        { id: 4, type: 'admission', text: 'Admission for John Doe (Roll: R202412345) approved.', time: 'Yesterday', read: true },
        { id: 5, 'type': 'system', text: 'Database backup completed successfully.', time: '2 days ago', read: true },
    ];

    const createAdminNotificationHTML = (notification) => {
        const icons = { admission: '⏳', 'fee-defaulter': '💳', 'leave-request': '✈️', system: '⚙️' };
        const icon = icons[notification.type] || '🔔';
        const isReadClass = notification.read ? 'read' : '';
        return `<li><a href="#" class="notification-item ${isReadClass}" data-id="${notification.id}"><div class="notification-icon ${notification.type}">${icon}</div><div class="notification-content"><p>${notification.text}</p><small>${notification.time}</small></div></a></li>`;
    };

    const fetchAndDisplayAdminNotifications = () => {
        if (!notificationDropdownList || !allNotificationsList || !notificationBadge) return;

        // In a real app, you would fetch this from an API: const notifications = await fetch('/api/admin/notifications');
        const notifications = mockAdminNotifications;

        notificationDropdownList.innerHTML = '';
        allNotificationsList.innerHTML = '';

        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }

        // Populate dropdown (e.g., first 3-5)
        notifications.slice(0, 3).forEach(n => {
            notificationDropdownList.insertAdjacentHTML('beforeend', createAdminNotificationHTML(n));
        });

        // Populate "All Notifications" modal list
        notifications.forEach(n => {
            allNotificationsList.insertAdjacentHTML('beforeend', createAdminNotificationHTML(n));
        });
    };

    const openAllNotificationsModal = () => {
        if (allNotificationsModalOverlay) {
            fetchAndDisplayAdminNotifications(); // Refresh list when opening
            allNotificationsModalOverlay.style.display = 'flex';
        }
    };

    if (viewAllNotificationsLink) {
        viewAllNotificationsLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (notificationPanel) notificationPanel.classList.remove('active');
            openAllNotificationsModal();
        });
    }
    if (closeAllNotificationsModalBtn) {
        closeAllNotificationsModalBtn.addEventListener('click', () => {
            allNotificationsModalOverlay.style.display = 'none';
            revertActiveLinkToView();
        });
    }

    if (markAllAsReadBtn) {
        markAllAsReadBtn.addEventListener('click', () => {
            // In a real app, you would send a request to the server to mark all as read.
            // For this demo, we just update the mock data.
            mockAdminNotifications.forEach(n => n.read = true);

            // Re-render the UI to reflect the changes
            fetchAndDisplayAdminNotifications();
            // Optionally, close the modal after the action
            // if (allNotificationsModalOverlay) allNotificationsModalOverlay.style.display = 'none';
        });
    }

    const handleAdminNotificationClick = (e) => {
        e.preventDefault();
        const notificationItem = e.target.closest('.notification-item');
        if (!notificationItem) return;

        const notificationId = parseInt(notificationItem.dataset.id, 10);
        const notification = mockAdminNotifications.find(n => n.id === notificationId);

        // Only update if the notification exists and is unread
        if (notification && !notification.read) {
            notification.read = true;
            // In a real app, you would send a request to the server here to persist the change.
            // For this demo, we just re-render the lists with the updated mock data.
            fetchAndDisplayAdminNotifications();
        }
    };

    // Use event delegation to handle clicks on dynamically added notification items
    if (notificationDropdownList) {
        notificationDropdownList.addEventListener('click', handleAdminNotificationClick);
    }
    if (allNotificationsList) {
        allNotificationsList.addEventListener('click', handleAdminNotificationClick);
    }

    // --- Post Notice Modal Logic ---
    if (postNoticeBtn) {
        postNoticeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (postNoticeModalOverlay) {
                setActiveNavLink('sideNavPostNoticeBtn');
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
                revertActiveLinkToView();
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
                revertActiveLinkToView();
            } catch (error) {
                noticeError.textContent = error.message;
                noticeError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Notice';
            }
        });
    }

    // --- Notice History Modal Logic ---
    if (viewNoticeHistoryBtn) {
        viewNoticeHistoryBtn.addEventListener('click', async () => {
            // Hide post notice modal
            if (postNoticeModalOverlay) {
                postNoticeModalOverlay.style.display = 'none';
            }

            // Show history modal and fetch data
            if (noticeHistoryModalOverlay) {
                noticeHistoryModalOverlay.style.display = 'flex';
                noticeHistoryList.innerHTML = '<li><p>Loading history...</p></li>';

                try {
                    const response = await fetch('/api/admin/notices');
                    const notices = await response.json();

                    if (!response.ok) throw new Error(notices.message || 'Failed to fetch history.');

                    noticeHistoryList.innerHTML = ''; // Clear loading message

                    if (notices.length === 0) {
                        noticeHistoryList.innerHTML = '<li><p>No notices have been posted yet.</p></li>';
                    } else {
                        notices.forEach(notice => {
                            const listItem = document.createElement('li');
                            const date = new Date(notice.createdAt).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            });
                            listItem.innerHTML = `
                                <p>${notice.message}</p>
                                <small>Posted on: ${date}</small>
                            `;
                            noticeHistoryList.appendChild(listItem);
                        });
                    }
                } catch (error) {
                    noticeHistoryList.innerHTML = `<li><p style="color: red;">Error: ${error.message}</p></li>`;
                }
            }
        });
    }

    if (closeNoticeHistoryBtn) {
        closeNoticeHistoryBtn.addEventListener('click', () => {
            if (noticeHistoryModalOverlay) {
                noticeHistoryModalOverlay.style.display = 'none';
                revertActiveLinkToView();
            }
        });
    }

    // --- Add Faculty Modal Logic ---
    if (addFacultyBtn) {
        addFacultyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (addFacultyModalOverlay) {
                addFacultyModalOverlay.style.display = 'flex';
                addFacultyForm.reset();
                addFacultyError.style.display = 'none';
            }
        });
    }

    if (cancelAddFacultyBtn) {
        cancelAddFacultyBtn.addEventListener('click', () => {
            if (addFacultyModalOverlay) {
                addFacultyModalOverlay.style.display = 'none';
            }
        });
    }

    if (addFacultyForm) {
        addFacultyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('addFacultyName').value.trim();
            const password = document.getElementById('addFacultyPassword').value.trim();
            const submitBtn = addFacultyForm.querySelector('.submit-btn');

            if (!name || !password) {
                addFacultyError.textContent = 'Name and password are required.';
                addFacultyError.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            addFacultyError.style.display = 'none';

            try {
                const response = await fetch('/api/admin/add-faculty', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, password })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to create faculty.');
                alert(result.message); // Shows success message with new username
                addFacultyModalOverlay.style.display = 'none';
                fetchAllFaculty(); // Refresh the faculty list
            } catch (error) {
                addFacultyError.textContent = error.message;
                addFacultyError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Faculty';
            }
        });
    }

    // --- Collapsible Side Nav Logic ---
    document.querySelectorAll('.nav-collapsible-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const content = toggle.nextElementSibling;
            const arrow = toggle.querySelector('.nav-arrow');
            // Close other open menus
            document.querySelectorAll('.nav-collapsible-content').forEach(otherContent => {
                if (otherContent !== content) {
                    otherContent.style.maxHeight = null;
                    const otherArrow = otherContent.previousElementSibling.querySelector('.nav-arrow');
                    if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
                }
            });
            // Toggle current menu
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                if (arrow) arrow.style.transform = 'rotate(90deg)';
            }
        });
    });

    // --- Timetable Modal Logic ---
    const getSubjectsForClass = (className) => {
        const prePrimary = ['Nursery', 'LKG', 'UKG'];
        const primary = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
        const middle = ['Class 6', 'Class 7', 'Class 8'];
        const secondary = ['Class 9', 'Class 10'];
        const seniorSecondary = ['Class 11', 'Class 12'];

        if (prePrimary.includes(className)) {
            return ['English (Alphabet)', 'Hindi (Basics)', 'Numbers (Maths)', 'General Knowledge', 'Drawing & Coloring', 'Rhymes / Stories', 'Games / P.E.'];
        }
        if (primary.includes(className)) {
            return ['English', 'Hindi', 'Mathematics', 'E.V.S.', 'Computer Basics', 'Moral Science', 'Art & Craft', 'P.E. / Music'];
        }
        if (middle.includes(className)) {
            return ['English', 'Hindi', 'Sanskrit', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Moral Science', 'Art/Craft', 'P.E./Music'];
        }
        if (secondary.includes(className)) {
            return ['English', 'Hindi', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Computer Apps', 'P.E.'];
        }
        if (seniorSecondary.includes(className)) {
            // A mix of streams for demo purposes
            return ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Pol. Science', 'Computer Sci.', 'P.E.'];
        }
        // Default
        return ['English', 'Maths', 'Science', 'History', 'Geography', 'Hindi', 'Art', 'Music', 'P.E.'];
    };

    const openTimetableModal = (className) => {
        if (!timetableModalOverlay) return;

        timetableModalTitle.textContent = `Timetable for ${className}`;

        // --- Placeholder Data Generation ---
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const subjects = getSubjectsForClass(className);
        timetableModalBody.innerHTML = ''; // Clear previous content

        days.forEach(day => {
            const row = document.createElement('tr');
            let rowHTML = `<td>${day}</td>`; // Day cell
            for (let i = 1; i <= 6; i++) { // 6 periods up to 1:30 PM
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                rowHTML += `<td>${subject}</td>`;
            }
            row.innerHTML = rowHTML;

            const breakCell = document.createElement('td');
            breakCell.classList.add('break-cell');
            breakCell.textContent = 'Break';
            row.insertBefore(breakCell, row.children[5]); // Insert before Period 5 (index 5)

            timetableModalBody.appendChild(row);
        });

        // --- Highlight Current Day ---
        const today = new Date().toLocaleString('en-us', { weekday: 'long' }); // Gets "Monday", "Tuesday", etc.
        timetableModalBody.querySelectorAll('tr').forEach(row => {
            const dayCell = row.querySelector('td');
            if (dayCell && dayCell.textContent === today) {
                row.classList.add('current-day-row');
            }
        });

        timetableModalTable.classList.remove('editable');
        timetableModalBody.querySelectorAll('td').forEach(td => td.contentEditable = 'false');
        if (timetableDefaultActions) timetableDefaultActions.style.display = 'flex';
        if (timetableEditActions) timetableEditActions.style.display = 'none';

        timetableModalOverlay.style.display = 'flex';
        closeNav(); // Close side nav if open
    };

    // Add listeners to all timetable class links (on dashboard or in timetable view)
    document.querySelectorAll('.timetable-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const className = e.target.dataset.class;
            openTimetableModal(className);
        });
    });

    // Close button
    if (closeTimetableModalBtn) {
        closeTimetableModalBtn.addEventListener('click', () => {
            if (timetableModalOverlay) timetableModalOverlay.style.display = 'none';
        });
    }

    // Edit/Cancel button
    if (editTimetableBtn) {
        editTimetableBtn.addEventListener('click', () => {
            timetableModalTable.classList.add('editable');
            if (timetableDefaultActions) timetableDefaultActions.style.display = 'none';
            if (timetableEditActions) timetableEditActions.style.display = 'flex';
            // Make cells editable, but not the day name cell or break cell
            timetableModalBody.querySelectorAll('td').forEach((td, index) => {
                const colIndex = index % 8; // 8 columns total now (Day + 6 Periods + Break)
                if (colIndex !== 0 && colIndex !== 5) { // Don't edit Day (col 0) or Break (col 5)
                    td.contentEditable = 'true';
                }
            });
            timetableModalBody.querySelector('td[contenteditable="true"]')?.focus();
        });
    }

    // Save button
    if (saveTimetableBtn) {
        saveTimetableBtn.addEventListener('click', async () => {
            // In a real app, you would collect the data and send it to the server
            // const timetableData = [];
            // timetableModalBody.querySelectorAll('tr').forEach(row => { ... });
            // await fetch('/api/timetable/update', { method: 'POST', body: JSON.stringify(timetableData) });

            alert('Timetable changes saved! (This is a demo, data is not persisted.)');

            // Revert to non-editable state
            timetableModalTable.classList.remove('editable');
            if (timetableDefaultActions) timetableDefaultActions.style.display = 'flex';
            if (timetableEditActions) timetableEditActions.style.display = 'none';
            timetableModalBody.querySelectorAll('td').forEach(td => td.contentEditable = 'false');
        });
    }

    // Print button for timetable
    if (printTimetableBtn) {
        printTimetableBtn.addEventListener('click', () => {
            document.body.classList.add('printing-timetable');
            window.print();
        });
    }

    // After printing (or canceling), remove the printing class.
    // 'afterprint' is the most reliable event for this.
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing-timetable');
    });

    // --- New functions to fetch and display data ---
    const fetchAllStudents = async () => {
        const tableBody = document.querySelector('#allStudentsTable tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="7">Loading student data...</td></tr>';

        try {
            const response = await fetch('/api/all-students');
            const students = await response.json();
            if (!response.ok) throw new Error(students.message || 'Failed to fetch students.');

            tableBody.innerHTML = ''; // Clear loading message
            if (students.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7">No students found.</td></tr>';
                return;
            }

            students.forEach(student => {
                const row = tableBody.insertRow();
                const registeredDate = new Date(student.createdAt).toLocaleDateString('en-IN');
                row.innerHTML = `
                    <td>${student.rollNumber || 'N/A'}</td>
                    <td>${student.name || 'N/A'}</td>
                    <td>${student.email || 'N/A'}</td>
                    <td>${student.mobileNumber || 'N/A'}</td>
                    <td>${student.city || 'N/A'}</td>
                    <td>${registeredDate}</td>
                    <td><button class="action-btn-delete delete-student-btn" data-rollnumber="${student.rollNumber}">Delete</button></td>
                `;
            });

            // Add event listeners to the new delete buttons
            document.querySelectorAll('.delete-student-btn').forEach(button => {
                button.addEventListener('click', handleDeleteStudent);
            });

        } catch (error) {
            console.error('Error fetching all students:', error);
            tableBody.innerHTML = `<tr><td colspan="7" style="color: red;">Error: ${error.message}</td></tr>`;
        }
    };

    const handleDeleteStudent = async (event) => {
        const rollNumber = event.target.dataset.rollnumber;
        if (!confirm(`Are you sure you want to permanently delete the student with roll number "${rollNumber}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/student/${rollNumber}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to delete student.');

            alert(result.message);
            fetchAllStudents(); // Refresh the list
        } catch (error) {
            console.error('Error deleting student:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const fetchAllFaculty = async () => {
        const tableBody = document.querySelector('#allFacultyTable tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5">Loading faculty data...</td></tr>';

        try {
            const response = await fetch('/api/all-faculty');
            const faculty = await response.json();
            if (!response.ok) throw new Error(faculty.message || 'Failed to fetch faculty.');

            tableBody.innerHTML = ''; // Clear loading message
            if (faculty.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5">No faculty found.</td></tr>';
                return;
            }

            faculty.forEach(member => {
                const row = tableBody.insertRow();
                const registeredDate = new Date(member.createdAt).toLocaleDateString('en-IN');
                row.innerHTML = `
                    <td>${member.username || 'N/A'}</td>
                    <td>${member.name || 'N/A'}</td>
                    <td>${member.email || 'N/A'}</td>
                    <td>${registeredDate}</td>
                    <td><button class="action-btn-delete delete-faculty-btn" data-username="${member.username}">Delete</button></td>
                `;
            });

            // Add event listeners to the new delete buttons
            document.querySelectorAll('.delete-faculty-btn').forEach(button => {
                button.addEventListener('click', handleDeleteFaculty);
            });

        } catch (error) {
            console.error('Error fetching all faculty:', error);
            tableBody.innerHTML = `<tr><td colspan="5" style="color: red;">Error: ${error.message}</td></tr>`;
        }
    };

    const handleDeleteFaculty = async (event) => {
        const username = event.target.dataset.username;
        if (!confirm(`Are you sure you want to permanently delete the faculty member "${username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/faculty/${username}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete faculty member.');
            }

            alert(result.message);
            fetchAllFaculty(); // Refresh the list
        } catch (error) {
            console.error('Error deleting faculty:', error);
            alert(`Error: ${error.message}`);
        }
    };

    // --- Debounce function for search ---
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // --- Search Modal Logic ---
    if (searchUsersBtn) {
        searchUsersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchModalOverlay) {
                searchModalOverlay.style.display = 'flex';
                adminSearchInput.value = '';
                adminSearchResultsList.innerHTML = '';
                adminNoSearchResults.style.display = 'none';
                adminSearchInput.focus();
            }
        });
    }

    if (closeSearchModalBtn) {
        closeSearchModalBtn.addEventListener('click', () => {
            if (searchModalOverlay) searchModalOverlay.style.display = 'none';
        });
    }

    // --- User Detail Modal Logic ---
    if (closeUserDetailBtn) {
        closeUserDetailBtn.addEventListener('click', () => {
            if (userDetailModalOverlay) userDetailModalOverlay.style.display = 'none';
        });
    }

    // --- Search Input Handler ---
    const handleSearch = async () => {
        const query = adminSearchInput.value.trim();
        adminSearchResultsList.innerHTML = '';
        adminNoSearchResults.style.display = 'none';

        if (query.length < 2) return;

        try {
            const response = await fetch(`/api/admin/search-users?query=${encodeURIComponent(query)}`);
            const results = await response.json();

            if (results.length === 0) {
                adminNoSearchResults.style.display = 'block';
                return;
            }

            results.forEach(user => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.dataset.identifier = user.identifier;
                link.dataset.type = user.type;
                link.innerHTML = `${user.name} <span class="user-type">${user.type}</span>`;
                link.addEventListener('click', handleResultClick);
                listItem.appendChild(link);
                adminSearchResultsList.appendChild(listItem);
            });
        } catch (error) {
            console.error('Search failed:', error);
            adminSearchResultsList.innerHTML = '<li><p style="color: red;">Search failed. Please try again.</p></li>';
        }
    };

    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // --- Result Click Handler ---
    const handleResultClick = async (e) => {
        e.preventDefault();
        const identifier = e.currentTarget.dataset.identifier;
        const type = e.currentTarget.dataset.type;

        if (searchModalOverlay) searchModalOverlay.style.display = 'none';
        if (userDetailModalOverlay) userDetailModalOverlay.style.display = 'flex';

        studentDetailSection.style.display = 'none';
        facultyDetailSection.style.display = 'none';
        userDetailName.textContent = 'Loading...';

        try {
            if (type === 'Student') {
                const response = await fetch(`/student-data/${identifier}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch student details.');
                displayStudentDetails(data.studentData);
            } else if (type === 'Faculty') {
                const response = await fetch(`/api/faculty/${identifier}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch faculty details.');
                displayFacultyDetails(data);
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            userDetailName.textContent = 'Error';
            alert(`Could not load details: ${error.message}`);
        }
    };

    // --- Display Functions ---
    const displayStudentDetails = (data) => {
        studentDetailSection.style.display = 'block';
        facultyDetailSection.style.display = 'none';
        userDetailName.textContent = data.name || 'Student Details';
        const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        document.getElementById('detailStudentRoll').textContent = data.rollNumber || 'N/A';
        document.getElementById('detailStudentEnroll').textContent = data.enrollmentNumber || 'N/A';
        document.getElementById('detailStudentEmail').textContent = data.email || 'N/A';
        document.getElementById('detailStudentMobile').textContent = data.mobileNumber || 'N/A';
        document.getElementById('detailStudentGender').textContent = data.gender || 'N/A';
        document.getElementById('detailStudentDob').textContent = formatDate(data.dob);
        document.getElementById('detailStudentAddress').textContent = [data.addressLine1, data.addressLine2, data.city, data.state, data.pincode].filter(Boolean).join(', ') || 'N/A';
        document.getElementById('detailStudentCity').textContent = data.city || 'N/A';
        document.getElementById('detailStudentFather').textContent = data.fatherName || 'N/A';
        document.getElementById('detailStudentMother').textContent = data.motherName || 'N/A';
        document.getElementById('detailStudentBoard10').textContent = data.board10 || 'N/A';
        document.getElementById('detailStudentPercent10').textContent = data.percentage10 ? `${data.percentage10}%` : 'N/A';
        document.getElementById('detailStudentBoard12').textContent = data.board12 || 'N/A';
        document.getElementById('detailStudentPercent12').textContent = data.percentage12 ? `${data.percentage12}%` : 'N/A';
        let mainCourse = 'Not enrolled';
        if (data.selectedCourse && data.selectedCourse.trim().startsWith('{')) { try { const c = JSON.parse(data.selectedCourse); if (c.paymentStatus === 'paid') mainCourse = c.branch; } catch(e) {} }
        document.getElementById('detailStudentCourse').textContent = mainCourse;
        let hobbyCourses = 'None';
        if (data.hobbyCourses && Array.isArray(data.hobbyCourses) && data.hobbyCourses.length > 0) { hobbyCourses = data.hobbyCourses.map(c => c.name).join(', '); }
        document.getElementById('detailStudentHobby').textContent = hobbyCourses;
    };

    const displayFacultyDetails = (data) => {
        facultyDetailSection.style.display = 'block';
        studentDetailSection.style.display = 'none';
        userDetailName.textContent = data.name || 'Faculty Details';
        const formatDate = (ds) => ds ? new Date(ds).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        document.getElementById('detailFacultyUsername').textContent = data.username || 'N/A';
        document.getElementById('detailFacultyEmail').textContent = data.email || 'N/A';
        document.getElementById('detailFacultyCreated').textContent = formatDate(data.createdAt);
    };

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

    // --- Initial Data Fetch on Page Load ---
    fetchAndDisplayAdminNotifications();
});