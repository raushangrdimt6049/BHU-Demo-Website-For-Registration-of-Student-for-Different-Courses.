document.addEventListener('DOMContentLoaded', () => {
    // --- Password Protection Elements ---
    const passwordOverlay = document.getElementById('password-overlay');
    const adminPasswordForm = document.getElementById('adminPasswordForm');
    const adminUsernameInput = document.getElementById('adminUsernameInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const passwordError = document.getElementById('password-error');
    // The hardcoded credentials are now removed. Login will be handled by the server.
    // const correctUsername = 'raushan_143';
    // const correctPassword = '4gh4m01r';

    // --- View Containers and Navigation ---
    const adminContentWrapper = document.getElementById('admin-content-wrapper');
    const mainDashboardView = document.getElementById('main-dashboard-view');
    const allStudentsView = document.getElementById('all-students-view');
    const allFacultyView = document.getElementById('all-faculty-view');
    const allAdminsView = document.getElementById('all-admins-view');
    const usersManagementView = document.getElementById('users-management-view');
    const allTimetablesView = document.getElementById('all-timetables-view');
    const departmentsView = document.getElementById('departments-view'); // New view
    const backToUsersFromStudentsBtn = document.getElementById('backToUsersFromStudentsBtn');
    const backToUsersFromFacultyBtn = document.getElementById('backToUsersFromFacultyBtn'); // This ID is now in the HTML
    const backToUsersFromAdminsBtn = document.getElementById('backToUsersFromAdminsBtn');
    const backToDashboardFromUsersBtn = document.getElementById('backToDashboardFromUsersBtn');
    const backToDashboardFromTimetablesBtn = document.getElementById('backToDashboardFromTimetablesBtn');
    // --- Side Navigation Elements ---
    const sideNavBtn = document.getElementById('sideNavBtn');
    const sideNav = document.getElementById('adminSideNav');
    const sideNavDashboardLink = document.getElementById('sideNavDashboardLink');
    const sideNavOverlay = document.getElementById('sideNavOverlay');
    const closeSideNavBtn = document.getElementById('closeSideNavBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const sideNavTimetableLink = document.getElementById('sideNavTimetableLink');
    const sideNavUsersLink = document.getElementById('sideNavUsersLink');
    const sideNavDepartmentsLink = document.getElementById('sideNavDepartmentsLink'); // New link
    const sideNavAvatar = document.getElementById('sideNavAvatar');
    const sideNavSettingsLink = document.getElementById('sideNavSettingsLink');
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
    const postNoticeBtn = document.getElementById('postNoticeBtn'); // Button on dashboard
    // New Notice Modals
    const selectNoticeAudienceModalOverlay = document.getElementById('selectNoticeAudienceModalOverlay');
    const selectRecipientsModalOverlay = document.getElementById('selectRecipientsModalOverlay');
    const composeNoticeModalOverlay = document.getElementById('composeNoticeModalOverlay');
    // Buttons and Forms
    const closeSelectAudienceBtn = document.getElementById('closeSelectAudienceBtn');
    const closeSelectRecipientsBtn = document.getElementById('closeSelectRecipientsBtn');
    const closeComposeNoticeBtn = document.getElementById('closeComposeNoticeBtn');
    const composeNoticeForm = document.getElementById('composeNoticeForm');
    const continueToComposeBtn = document.getElementById('continueToComposeBtn');
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
    const closeAddFacultyModalBtn = document.getElementById('closeAddFacultyModalBtn');
    const addFacultyError = document.getElementById('add-faculty-error');

    // --- Add Admin User Modal Elements ---
    const openAddAdminModalBtn = document.getElementById('openAddAdminModalBtn'); // Now on the users page
    const addAdminModalOverlay = document.getElementById('addAdminModalOverlay');
    const closeAddAdminModalBtn = document.getElementById('closeAddAdminModalBtn');
    const addAdminForm = document.getElementById('addAdminForm');
    const addAdminError = document.getElementById('add-admin-error');

    // --- User Management View Buttons ---
    const manageAdminsBtn = document.getElementById('manageAdminsBtn');
    const manageFacultyBtn = document.getElementById('manageFacultyBtn');
    const manageStudentsBtn = document.getElementById('manageStudentsBtn');

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

    // --- Add Class Modal Elements ---
    const openAddClassModalBtn = document.getElementById('openAddClassModalBtn');
    const addClassModalOverlay = document.getElementById('addClassModalOverlay');
    // New button from the departments view
    const openAddClassModalBtnFromDept = document.getElementById('openAddClassModalBtnFromDept');
    const backToDashboardFromDeptsBtn = document.getElementById('backToDashboardFromDeptsBtn');
    const closeAddClassModalBtn = document.getElementById('closeAddClassModalBtn');
    const addClassForm = document.getElementById('addClassForm');

    // --- Remove Class Modal Elements ---
    const removeClassModalOverlay = document.getElementById('removeClassModalOverlay');
    const closeRemoveClassModalBtn = document.getElementById('closeRemoveClassModalBtn');
    const confirmRemoveClassBtn = document.getElementById('confirmRemoveClassBtn');
    const classNameToRemoveSpan = document.getElementById('classNameToRemove');

    // --- User Detail Modal Elements ---
    const userDetailModalOverlay = document.getElementById('userDetailModalOverlay');
    const userDetailName = document.getElementById('userDetailName');
    const studentDetailSection = document.getElementById('studentDetailSection');
    const facultyDetailSection = document.getElementById('facultyDetailSection');
    const closeUserDetailBtn = document.getElementById('closeUserDetailBtn');

    // --- Admin Settings Modal Elements ---
    const adminSettingsModalOverlay = document.getElementById('adminSettingsModalOverlay');
    const closeAdminSettingsModalBtn = document.getElementById('closeAdminSettingsModalBtn');
    const editAdminSettingsBtn = document.getElementById('editAdminSettingsBtn');
    const saveAdminSettingsForm = document.getElementById('saveAdminSettingsForm');
    const editAdminProfilePicture = document.getElementById('editAdminProfilePicture');
    const adminProfilePictureInput = document.getElementById('adminProfilePictureInput');
    // --- Admin Profile Modal Elements ---
    const adminProfileModalOverlay = document.getElementById('adminProfileModalOverlay');
    const closeAdminProfileModalBtn = document.getElementById('closeAdminProfileModalBtn');

    let currentAdminData = null; // To store admin data locally
    let schoolTimetable = null; // To store the generated full school timetable
    let schoolClasses = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']; // Default classes

    const populateSideNavHeader = (adminData) => {
        const sideNavName = document.getElementById('sideNavName');
        const sideNavAvatar = document.getElementById('sideNavAvatar');
        if (sideNavName) sideNavName.textContent = adminData.name || 'Admin';
        if (sideNavAvatar) sideNavAvatar.src = adminData.profilePicture || 'default-avatar.png';
    };

    // --- Password Protection Logic ---
    if (passwordOverlay && adminPasswordForm) {
        passwordOverlay.style.display = 'flex'; // Make sure it's visible
        adminPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredUsername = adminUsernameInput.value;
            const enteredPassword = adminPasswordInput.value;
            const submitBtn = adminPasswordForm.querySelector('.submit-btn');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';
            passwordError.style.display = 'none';

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: enteredUsername, password: enteredPassword })
                });

                if (!response.ok) {
                    let errorMessage;
                    const contentType = response.headers.get("content-type");

                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || `Login failed with status: ${response.status}`;
                    } else {
                        if (response.status === 404) {
                            errorMessage = "Login service not found on the server. Please check if the server is running correctly.";
                        } else {
                            errorMessage = `An unexpected server error occurred (Status: ${response.status}). Please try again.`;
                        }
                        console.error("Server sent a non-JSON response. This is the response text:", await response.text());
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();
                currentAdminData = result.adminData; // Cache the data immediately
                sessionStorage.setItem('currentAdminUsername', result.adminData.username); // Store username for later
                populateSideNavHeader(currentAdminData); // Populate side nav with admin info

                passwordOverlay.style.opacity = '0';
                setTimeout(() => {
                    passwordOverlay.style.display = 'none';
                }, 300); // Match the transition duration
                adminContentWrapper.style.display = 'block';
                showView('dashboard', currentAdminData); // Pass data directly to show the dashboard view

                // --- New logic for Quick Action Button colors ---
                const quickActionBtns = document.querySelectorAll('.quick-action-btn');
                const colors = ['#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#c0392b']; // Dark Blue, Green, Orange, Purple, Red

                quickActionBtns.forEach((btn, index) => {
                    btn.style.backgroundColor = colors[index % colors.length];
                    btn.style.color = '#fff';
                    btn.style.borderColor = 'transparent';
                    btn.classList.remove('add', 'post', 'report');
                });

            } catch (error) {
                passwordError.textContent = error.message;
                passwordError.style.display = 'block';
                adminPasswordInput.value = '';
                adminUsernameInput.focus();
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    }

    const populateDashboardHeader = (adminData) => {
        const headerContainer = document.getElementById('dashboardHeader');
        if (!headerContainer || !adminData) return;

        const headerHTML = `
            <div class="welcome-banner">
                <h2>Welcome, ${adminData.name || 'Admin'}</h2>
            </div>
            <div class="faculty-profile-intro">
                <img src="${adminData.profilePicture || 'default-avatar.png'}" alt="Profile Picture" class="profile-intro-pic" onerror="this.onerror=null;this.src='default-avatar.png';">
                <h3>${adminData.name || 'Admin'}</h3>
                <p>Username: ${adminData.username || 'N/A'}</p>
            </div>
        `;
        headerContainer.innerHTML = headerHTML;
    };

    const fetchDashboardStats = async () => {
        const kpiTotalStudents = document.getElementById('kpiTotalStudents');
        const kpiTotalFaculty = document.getElementById('kpiTotalFaculty');
        const kpiActiveCourses = document.getElementById('kpiActiveCourses');

        if (!kpiTotalStudents || !kpiTotalFaculty || !kpiActiveCourses) return;

        try {
            // Fetch student and faculty stats
            const response = await fetch('/api/admin/stats');
            const stats = await response.json();

            if (!response.ok) {
                throw new Error(stats.message || 'Failed to fetch stats.');
            }

            kpiTotalStudents.textContent = stats.totalStudents;
            kpiTotalFaculty.textContent = stats.totalFaculty;

            // Fetch class count
            const classResponse = await fetch('/api/admin/classes');
            const classes = await classResponse.json();
            if (!classResponse.ok) {
                throw new Error(classes.message || 'Failed to fetch classes.');
            }
            kpiActiveCourses.textContent = classes.length;

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            kpiTotalStudents.textContent = 'Error';
            kpiTotalFaculty.textContent = 'Error';
            kpiActiveCourses.textContent = 'Error';
        }
    };

    // --- Data Fetching Functions for User Management ---
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

        } catch (error) {
            console.error('Error fetching all students:', error);
            tableBody.innerHTML = `<tr><td colspan="7" style="color: red;">Error: ${error.message}</td></tr>`;
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

        } catch (error) {
            console.error('Error fetching all faculty:', error);
            tableBody.innerHTML = `<tr><td colspan="5" style="color: red;">Error: ${error.message}</td></tr>`;
        }
    };

    const fetchAndDisplayAdmins = async () => {
        const gridContainer = document.getElementById('adminUsersGrid');
        if (!gridContainer) return;
        gridContainer.innerHTML = '<p>Loading administrators...</p>';

        try {
            const response = await fetch('/api/admins');
            if (!response.ok) throw new Error('Failed to fetch admin users.');
            const admins = await response.json();

            gridContainer.innerHTML = ''; // Clear loading message
            if (admins.length === 0) {
                gridContainer.innerHTML = '<p>No admin users found.</p>';
                return;
            }

            admins.forEach(admin => {
                const card = document.createElement('div');
                card.className = 'admin-user-card';
                card.innerHTML = `
                    <img src="${admin.profilePicture || 'default-avatar.png'}" alt="Admin User Photo" onerror="this.onerror=null;this.src='default-avatar.png';">
                    <p class="admin-name">${admin.name}</p>
                    <div style="margin-top: 1rem;">
                        <button class="action-btn-delete delete-user-btn" data-identifier="${admin.username}" data-type="Admin">Delete</button>
                    </div>
                `;
                gridContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching admin users:', error);
            gridContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    };

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
    const showView = (viewToShow, data = null) => {
        mainDashboardView.style.display = 'none';
        allStudentsView.style.display = 'none';
        allFacultyView.style.display = 'none';
        allAdminsView.style.display = 'none';
        usersManagementView.style.display = 'none';
        allTimetablesView.style.display = 'none';
        departmentsView.style.display = 'none';

        if (viewToShow === 'dashboard') {
            mainDashboardView.style.display = 'block';
            setActiveNavLink('sideNavDashboardLink');
            fetchDashboardStats(); // Fetch stats when dashboard is shown

            // Use provided data if available, otherwise fetch it
            if (data) {
                populateDashboardHeader(data);
            } else {
                // Use the cached currentAdminData or fetch it
                getCurrentAdminData().then(adminData => {
                    if (adminData) {
                        populateDashboardHeader(adminData);
                    }
                });
            }
        } else if (viewToShow === 'timetables') {
            allTimetablesView.style.display = 'block';
            setActiveNavLink('sideNavTimetableLink');
            loadClassesIntoTimetablesView(); // New function call
        } else if (viewToShow === 'users-management') {
            usersManagementView.style.display = 'block';
            setActiveNavLink('sideNavUsersLink');
        } else if (viewToShow === 'admins') {
            allAdminsView.style.display = 'block';
            fetchAndDisplayAdmins();
            setActiveNavLink('sideNavUsersLink');
        } else if (viewToShow === 'students') {
            allStudentsView.style.display = 'block';
            fetchAllStudents();
            setActiveNavLink('sideNavUsersLink');
        } else if (viewToShow === 'faculty') {
            allFacultyView.style.display = 'block';
            fetchAllFaculty();
            setActiveNavLink('sideNavUsersLink');
        } else if (viewToShow === 'departments') {
            departmentsView.style.display = 'block';
            loadAndDisplayClasses();
            setActiveNavLink('sideNavDepartmentsLink');
        }
    };
    const revertActiveLinkToView = () => {
        if (mainDashboardView.style.display === 'block') {
            setActiveNavLink('sideNavDashboardLink');
        } else if (usersManagementView.style.display === 'block' || allAdminsView.style.display === 'block' || allStudentsView.style.display === 'block' || allFacultyView.style.display === 'block') {
            setActiveNavLink('sideNavUsersLink');
        } else if (allTimetablesView.style.display === 'block') {
            setActiveNavLink('sideNavTimetableLink');
        } else if (departmentsView.style.display === 'block') {
            setActiveNavLink('sideNavDepartmentsLink');
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
            openPostNoticeModal();
        });
    }

    // Open Users Management view from side nav
    if (sideNavUsersLink) {
        sideNavUsersLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('users-management');
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

    // Open Departments view from side nav
    if (sideNavDepartmentsLink) {
        sideNavDepartmentsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('departments');
            closeNav(); // Close the side nav
        });
    }

    // --- New Notice Sending Logic (Multi-step) ---
    const openNoticeAudienceModal = () => {
        if (selectNoticeAudienceModalOverlay) {
            setActiveNavLink('sideNavPostNoticeBtn');
            selectNoticeAudienceModalOverlay.style.display = 'flex';
        }
        closeNav(); // Close the side nav if it's open
    };

    // Open Post Notice modal from side nav (Corrected)
    if (sideNavPostNoticeBtn) {
        sideNavPostNoticeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openNoticeAudienceModal();
        });
    }

    // --- Helper to get current admin data, fetching if necessary ---
    const getCurrentAdminData = async () => {
        if (currentAdminData) {
            return currentAdminData;
        }
        try {
            const username = sessionStorage.getItem('currentAdminUsername');
            if (!username) throw new Error('Admin session not found.');

            const response = await fetch(`/api/admin/me?username=${username}`);
            if (!response.ok) throw new Error('Could not fetch admin details.');
            
            const data = await response.json();
            currentAdminData = data; // Cache it
            return currentAdminData;
        } catch (error) {
            console.error("Error fetching admin data:", error);
            alert(error.message);
            return null;
        }
    };

    // --- Admin Settings Modal Logic ---
    const openAdminSettingsModal = async () => {
        if (!adminSettingsModalOverlay) return;

        setActiveNavLink('sideNavSettingsLink');
        const data = await getCurrentAdminData();
        if (!data) {
            revertActiveLinkToView();
            return;
        }
        
        adminSettingsModalOverlay.style.display = 'flex';
        document.getElementById('admin-settings-view').style.display = 'block';
        document.getElementById('admin-settings-edit').style.display = 'none';
        
        // Populate view mode
        document.getElementById('settingsAdminAvatar').src = data.profilePicture || 'default-avatar.png';
        document.getElementById('settingAdminName').textContent = data.name;
        document.getElementById('settingAdminUsername').textContent = data.username;
        document.getElementById('settingAdminEmail').textContent = data.email || 'N/A';
        document.getElementById('settingAdminMobile').textContent = data.mobileNumber || 'N/A';
    };

    // --- Admin Profile Modal Logic ---
    const openAdminProfileModal = async () => {
        if (!adminProfileModalOverlay) return;
        const data = await getCurrentAdminData();
        if (!data) return;
        document.getElementById('modalAdminAvatar').src = data.profilePicture || 'default-avatar.png';
        document.getElementById('modalAdminName').textContent = data.name || 'N/A';
        document.getElementById('modalAdminUsername').textContent = data.username || 'N/A';
        document.getElementById('modalAdminEmail').textContent = data.email || 'N/A';
        document.getElementById('modalAdminMobile').textContent = data.mobileNumber || 'N/A';
        adminProfileModalOverlay.style.display = 'flex';
        closeNav();
    };

    if (sideNavSettingsLink) {
        sideNavSettingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openAdminSettingsModal();
            closeNav();
        });
    }

    if (sideNavAvatar) {
        sideNavAvatar.addEventListener('click', openAdminProfileModal);
    }

    if (closeAdminProfileModalBtn) {
        closeAdminProfileModalBtn.addEventListener('click', () => {
            if (adminProfileModalOverlay) adminProfileModalOverlay.style.display = 'none';
        });
    }

    if (closeAdminSettingsModalBtn) {
        closeAdminSettingsModalBtn.addEventListener('click', () => {
            adminSettingsModalOverlay.style.display = 'none';
            revertActiveLinkToView();
        });
    }

    if (editAdminSettingsBtn) {
        editAdminSettingsBtn.addEventListener('click', async () => {
            const data = await getCurrentAdminData();
            if (!data) {
                alert("Could not load admin data to edit. Please try closing and reopening settings.");
                return;
            }
            // Populate edit form
            document.getElementById('editAdminName').value = data.name;
            document.getElementById('editAdminUsername').value = data.username;
            document.getElementById('editAdminEmail').value = data.email || '';
            document.getElementById('editAdminMobile').value = data.mobileNumber || '';
            // Clear password fields
            document.getElementById('editAdminProfilePicture').src = data.profilePicture || 'default-avatar.png';
            document.getElementById('adminProfilePictureInput').value = ''; // Clear file input
            document.getElementById('editAdminCurrentPassword').value = '';
            document.getElementById('editAdminNewPassword').value = '';
            document.getElementById('editAdminConfirmPassword').value = '';
            document.getElementById('admin-settings-error').style.display = 'none';

            // Switch views
            document.getElementById('admin-settings-view').style.display = 'none';
            document.getElementById('admin-settings-edit').style.display = 'block';
        });
    }

    if (saveAdminSettingsForm) {
        saveAdminSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('admin-settings-error');
            errorEl.style.display = 'none';

            const newPassword = document.getElementById('editAdminNewPassword').value;
            const confirmPassword = document.getElementById('editAdminConfirmPassword').value;
            const currentPassword = document.getElementById('editAdminCurrentPassword').value;

            if (newPassword && newPassword !== confirmPassword) {
                errorEl.textContent = 'New passwords do not match.';
                errorEl.style.display = 'block';
                return;
            }

            // Add client-side validation for current password, similar to the faculty portal
            if (!currentPassword) {
                errorEl.textContent = 'Current password is required to save any changes.';
                errorEl.style.display = 'block';
                document.getElementById('editAdminCurrentPassword').focus();
                return;
            }

            const formData = new FormData(saveAdminSettingsForm);
            formData.delete('confirmPassword'); // Not needed by server

            // --- FIX ---
            // Since the username input is readonly, its value is not included in FormData by default.
            // We must manually append it to ensure the server knows which admin to update.
            const username = document.getElementById('editAdminUsername').value;
            formData.append('username', username);

            const submitBtn = saveAdminSettingsForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            try {
                const response = await fetch('/api/admin/update-settings', {
                    method: 'POST',
                    // Do not set Content-Type header; the browser will set it correctly for multipart/form-data
                    body: formData
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert('Settings updated successfully!');
                currentAdminData = result.adminData; // Update local data
                
                populateSideNavHeader(currentAdminData); // Update side nav avatar and name
                // Re-populate view mode with new data
                document.getElementById('settingsAdminAvatar').src = currentAdminData.profilePicture || 'default-avatar.png';
                document.getElementById('settingAdminName').textContent = currentAdminData.name;
                document.getElementById('settingAdminEmail').textContent = currentAdminData.email || 'N/A';
                document.getElementById('settingAdminMobile').textContent = currentAdminData.mobileNumber || 'N/A';

                // Switch back to view mode
                document.getElementById('admin-settings-view').style.display = 'block';
                document.getElementById('admin-settings-edit').style.display = 'none';
            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Changes';
            }
        });
    }

    // --- Settings Modal: Profile Picture Preview ---
    if (adminProfilePictureInput && editAdminProfilePicture) {
        adminProfilePictureInput.addEventListener('change', () => {
            const file = adminProfilePictureInput.files[0];
            if (file) {
                // Create a temporary URL for the selected file and show it in the <img> tag
                editAdminProfilePicture.src = URL.createObjectURL(file);
            }
        });
    }

    if (backToUsersFromStudentsBtn) {
        backToUsersFromStudentsBtn.addEventListener('click', () => showView('users-management'));
    }
    if (backToUsersFromFacultyBtn) { // This will now find the button
        backToUsersFromFacultyBtn.addEventListener('click', () => showView('users-management'));
    }
    if (backToUsersFromAdminsBtn) {
        backToUsersFromAdminsBtn.addEventListener('click', () => showView('users-management'));
    }
    if (backToDashboardFromUsersBtn) {
        backToDashboardFromUsersBtn.addEventListener('click', () => showView('dashboard'));
    }

    // --- User Management Circle Buttons ---
    if (manageAdminsBtn) {
        manageAdminsBtn.addEventListener('click', (e) => { e.preventDefault(); showView('admins'); });
    }
    if (manageFacultyBtn) {
        manageFacultyBtn.addEventListener('click', (e) => { e.preventDefault(); showView('faculty'); });
    }
    if (manageStudentsBtn) {
        manageStudentsBtn.addEventListener('click', (e) => { e.preventDefault(); showView('students'); });
    }
    if (backToDashboardFromTimetablesBtn) {
        backToDashboardFromTimetablesBtn.addEventListener('click', () => showView('dashboard'));
    }

    if (backToDashboardFromDeptsBtn) {
        backToDashboardFromDeptsBtn.addEventListener('click', () => showView('dashboard'));
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
            openNoticeAudienceModal();
        });
    }

    if (selectNoticeAudienceModalOverlay) {
        selectNoticeAudienceModalOverlay.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('.audience-option-btn');
            if (!target) return;

            const audience = target.dataset.audience;
            selectNoticeAudienceModalOverlay.style.display = 'none';

            if (audience === 'ALL_STUDENTS' || audience === 'ALL_FACULTY') {
                openComposeNoticeModal(audience);
            } else if (audience === 'SELECTED_STUDENTS') {
                openSelectRecipientsModal('student');
            } else if (audience === 'SELECTED_FACULTY') {
                openSelectRecipientsModal('faculty');
            }
        });
    }

    const openSelectRecipientsModal = async (userType) => {
        if (!selectRecipientsModalOverlay) return;

        const titleEl = document.getElementById('selectRecipientsTitle');
        const listEl = document.getElementById('recipientList');
        const searchInput = document.getElementById('recipientSearchInput');
        
        titleEl.textContent = `Select ${userType === 'student' ? 'Students' : 'Faculty'}`;
        listEl.innerHTML = '<li>Loading...</li>';
        searchInput.value = '';
        selectRecipientsModalOverlay.style.display = 'flex';

        try {
            const response = await fetch(userType === 'student' ? '/api/all-students' : '/api/all-faculty');
            const users = await response.json();
            if (!response.ok) throw new Error(users.message || 'Failed to fetch users.');

            listEl.innerHTML = '';
            if (users.length === 0) {
                listEl.innerHTML = `<li>No ${userType}s found.</li>`;
                return;
            }

            users.forEach(user => {
                const id = user.rollNumber || user.username;
                const name = user.name;
                const li = document.createElement('li');
                li.innerHTML = `
                    <input type="checkbox" id="user-${id}" value="${id}">
                    <label for="user-${id}">
                        <div>${name}</div>
                        <div class="recipient-id">${id}</div>
                    </label>
                `;
                listEl.appendChild(li);
            });

            // Store userType for the continue button
            continueToComposeBtn.dataset.userType = userType;

        } catch (error) {
            listEl.innerHTML = `<li style="color: red;">Error: ${error.message}</li>`;
        }
    };

    const openComposeNoticeModal = (audience, recipients = []) => {
        if (!composeNoticeModalOverlay) return;

        const titleEl = document.getElementById('composeNoticeTitle');
        const infoEl = document.getElementById('composeNoticeAudienceInfo');
        const form = document.getElementById('composeNoticeForm');
        const messageInput = document.getElementById('noticeMessageInput');
        const errorEl = document.getElementById('compose-notice-error');

        let audienceText = '';
        switch (audience) {
            case 'ALL_STUDENTS': audienceText = 'This notice will be sent to all students.'; break;
            case 'ALL_FACULTY': audienceText = 'This notice will be sent to all faculty.'; break;
            case 'SELECTED_STUDENTS': audienceText = `This notice will be sent to ${recipients.length} selected student(s).`; break;
            case 'SELECTED_FACULTY': audienceText = `This notice will be sent to ${recipients.length} selected faculty.`; break;
        }

        titleEl.textContent = 'Compose Notice';
        infoEl.textContent = audienceText;
        messageInput.value = '';
        errorEl.style.display = 'none';

        // Store data on the form for submission
        form.dataset.audience = audience;
        form.dataset.recipients = JSON.stringify(recipients);

        composeNoticeModalOverlay.style.display = 'flex';
    };

    if (continueToComposeBtn) {
        continueToComposeBtn.addEventListener('click', () => {
            const selectedCheckboxes = document.querySelectorAll('#recipientList input[type="checkbox"]:checked');
            if (selectedCheckboxes.length === 0) {
                alert('Please select at least one recipient.');
                return;
            }
            const recipients = Array.from(selectedCheckboxes).map(cb => cb.value);
            const userType = continueToComposeBtn.dataset.userType;
            const audience = userType === 'student' ? 'SELECTED_STUDENTS' : 'SELECTED_FACULTY';

            selectRecipientsModalOverlay.style.display = 'none';
            openComposeNoticeModal(audience, recipients);
        });
    }

    if (composeNoticeForm) {
        composeNoticeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = document.getElementById('noticeMessageInput').value.trim();
            const errorEl = document.getElementById('compose-notice-error');
            const submitBtn = composeNoticeForm.querySelector('.submit-btn');

            if (!message) {
                errorEl.textContent = 'Notice message cannot be empty.';
                errorEl.style.display = 'block';
                return;
            }

            const { audience, recipients } = composeNoticeForm.dataset;
            const adminUsername = sessionStorage.getItem('currentAdminUsername');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            errorEl.style.display = 'none';

            try {
                const response = await fetch('/api/admin/send-notice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        audience,
                        recipients: JSON.parse(recipients),
                        adminUsername
                    })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert(result.message);
                composeNoticeModalOverlay.style.display = 'none';
                revertActiveLinkToView();
            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Notice';
            }
        });
    }

    // Close buttons for new modals
    if (closeSelectAudienceBtn) closeSelectAudienceBtn.addEventListener('click', () => { selectNoticeAudienceModalOverlay.style.display = 'none'; revertActiveLinkToView(); });
    if (closeSelectRecipientsBtn) closeSelectRecipientsBtn.addEventListener('click', () => { selectRecipientsModalOverlay.style.display = 'none'; revertActiveLinkToView(); });
    if (closeComposeNoticeBtn) closeComposeNoticeBtn.addEventListener('click', () => { composeNoticeModalOverlay.style.display = 'none'; revertActiveLinkToView(); });

    // --- Notice History Modal Logic ---
    if (viewNoticeHistoryBtn) {
        viewNoticeHistoryBtn.addEventListener('click', async () => {
            // Hide post notice modal
            if (selectNoticeAudienceModalOverlay) {
                selectNoticeAudienceModalOverlay.style.display = 'none';
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
                            const audienceMap = {
                                'ALL_STUDENTS': 'All Students',
                                'ALL_FACULTY': 'All Faculty',
                                'SELECTED_STUDENTS': 'Selected Students',
                                'SELECTED_FACULTY': 'Selected Faculty'
                            };
                            const listItem = document.createElement('li');
                            const date = new Date(notice.createdAt).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            });
                            listItem.innerHTML = `
                                <p>${notice.message}</p>
                                <small>To: <strong>${audienceMap[notice.target_audience] || notice.target_audience}</strong> (${notice.recipient_count} recipients) on ${date}</small>
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

    const getAllUniqueSubjects = (timetable) => {
        const allSubjects = new Set();
        if (!timetable) {
            // If timetable data isn't loaded, we can't get subjects from it.
            return [];
        }
        // Iterate over the actual timetable data from the database
        for (const className in timetable) {
            for (const day in timetable[className]) {
                for (const period in timetable[className][day]) {
                    const subject = timetable[className][day][period];
                    if (subject && subject !== '---') {
                        allSubjects.add(subject);
                    }
                }
            }
        }
        return Array.from(allSubjects).sort();
    };

    // --- Add Faculty Modal Logic ---
    if (addFacultyBtn) {
        addFacultyBtn.addEventListener('click', async (e) => { // Make it async
            e.preventDefault();
            if (addFacultyModalOverlay) {
                addFacultyModalOverlay.style.display = 'flex';
                addFacultyForm.reset();
                addFacultyError.style.display = 'none';

                // Ensure timetable data is loaded before populating subjects
                // await generateFullSchoolTimetable(); // This is now handled by fetching classes

                const classContainer = document.getElementById('addFacultyAssignedClasses');
                classContainer.innerHTML = '<p>Loading classes...</p>'; // Show loading message

                try {
                    // Fetch the up-to-date list of all classes from the server
                    const response = await fetch('/api/admin/classes');
                    if (!response.ok) throw new Error('Failed to fetch classes.');
                    const fetchedClasses = await response.json();

                    // Populate classes
                    classContainer.innerHTML = ''; // Clear loading message
                    fetchedClasses.forEach(c => {
                        const classDiv = document.createElement('div');
                        classDiv.className = 'class-selection-option';
                        classDiv.dataset.value = c;
                        classDiv.textContent = c;
                        classContainer.appendChild(classDiv);
                    });
                } catch (error) {
                    console.error('Error fetching classes for faculty modal:', error);
                    classContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                }
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

    if (closeAddFacultyModalBtn) {
        closeAddFacultyModalBtn.addEventListener('click', () => {
            if (addFacultyModalOverlay) addFacultyModalOverlay.style.display = 'none';
        });
    }

    if (addFacultyForm) {
        addFacultyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('addFacultyName').value.trim();
            const password = document.getElementById('addFacultyPassword').value.trim();
            const username = document.getElementById('addFacultyUsername').value.trim();
            const email = document.getElementById('addFacultyEmail').value.trim();
            const teacherChoice = document.getElementById('addFacultyTeacherChoice').value;
            const subject = document.getElementById('addFacultySubject').value;
            const selectedClassDivs = document.querySelectorAll('#addFacultyAssignedClasses .class-selection-option.selected');
            const assignedClasses = Array.from(selectedClassDivs).map(div => div.dataset.value);

            const submitBtn = addFacultyForm.querySelector('.submit-btn');

            if (!name || !username || !email || !password || !teacherChoice || !subject || assignedClasses.length !== 2) {
                addFacultyError.textContent = 'All fields are required, and exactly two classes must be assigned.';
                addFacultyError.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            addFacultyError.style.display = 'none';

            try {
                const response = await fetch('/api/admin/add-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, email, password, teacherChoice, subject, assignedClasses })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to create faculty.');
                alert(result.message);
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

    // --- Add Faculty Modal: Class Selection Highlighting ---
    const addFacultyClassesContainer = document.getElementById('addFacultyAssignedClasses');
    if (addFacultyClassesContainer) {
        addFacultyClassesContainer.addEventListener('click', (e) => {
            const targetDiv = e.target.closest('.class-selection-option');
            if (!targetDiv) return;

            const isSelected = targetDiv.classList.contains('selected');
            const selectedCount = addFacultyClassesContainer.querySelectorAll('.class-selection-option.selected').length;

            if (!isSelected && selectedCount >= 2) {
                alert('You can assign a maximum of two classes.');
                return;
            }

            targetDiv.classList.toggle('selected');
        });
    }

    // --- Add Admin User Modal Logic ---
    const openAddAdminModal = () => {
        if (addAdminModalOverlay) {
            addAdminModalOverlay.style.display = 'flex';
            addAdminForm.reset();
            addAdminError.style.display = 'none';
        }
    };

    if (openAddAdminModalBtn) openAddAdminModalBtn.addEventListener('click', openAddAdminModal);

    if (closeAddAdminModalBtn) {
        closeAddAdminModalBtn.addEventListener('click', () => {
            if (addAdminModalOverlay) addAdminModalOverlay.style.display = 'none';
        });
    }

    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('addAdminName').value.trim();
            const username = document.getElementById('addAdminUsername').value.trim();
            const password = document.getElementById('addAdminPassword').value;
            const confirmPassword = document.getElementById('addAdminConfirmPassword').value;
            const submitBtn = addAdminForm.querySelector('.submit-btn');
            addAdminError.style.display = 'none';

            if (password !== confirmPassword) {
                addAdminError.textContent = 'Passwords do not match.';
                addAdminError.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            try {
                const response = await fetch('/api/admin/add-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, password })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to create user.');
                alert(result.message);
                addAdminModalOverlay.style.display = 'none';
                fetchAndDisplayAdmins(); // Refresh the admin list view
            } catch (error) {
                addAdminError.textContent = error.message;
                addAdminError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Admin';
            }
        });
    }

    // --- Table Filtering Logic ---
    const filterTable = (inputElement, tableElement) => {
        const searchTerm = inputElement.value.toLowerCase();
        const rows = tableElement.querySelectorAll('tbody tr');

        rows.forEach(row => {
            // Check if the row is a data row (and not a "loading" or "no data" message)
            if (row.cells.length > 1) {
                const rowText = row.textContent.toLowerCase();
                if (rowText.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    };

    if (studentSearchInput) {
        studentSearchInput.addEventListener('input', () => filterTable(studentSearchInput, document.getElementById('allStudentsTable')));
    }

    if (facultySearchInput) {
        facultySearchInput.addEventListener('input', () => filterTable(facultySearchInput, document.getElementById('allFacultyTable')));
    }

    const recipientSearchInput = document.getElementById('recipientSearchInput');
    if (recipientSearchInput) {
        recipientSearchInput.addEventListener('input', () => {
            const searchTerm = recipientSearchInput.value.toLowerCase();
            const items = document.querySelectorAll('#recipientList li');
            items.forEach(item => {
                const itemText = item.textContent.toLowerCase();
                if (itemText.includes(searchTerm)) item.style.display = 'flex';
                else item.style.display = 'none';
            });
        });
    }

    // --- Add Class Modal Logic ---
    if (openAddClassModalBtn) {
        openAddClassModalBtn.addEventListener('click', () => {
            if (addClassModalOverlay) {
                addClassModalOverlay.style.display = 'flex';
                addClassForm.reset();
                document.getElementById('add-class-error').style.display = 'none';
            }
        });
    }

    // Open Add Class Modal from Departments view
    if (openAddClassModalBtnFromDept) {
        openAddClassModalBtnFromDept.addEventListener('click', () => {
            if (addClassModalOverlay) addClassModalOverlay.style.display = 'flex';
        });
    }

    if (closeAddClassModalBtn) {
        closeAddClassModalBtn.addEventListener('click', () => {
            if (addClassModalOverlay) addClassModalOverlay.style.display = 'none';
        });
    }

    if (addClassForm) {
        addClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const className = document.getElementById('newClassName').value.trim();
            const classFee = document.getElementById('newClassFee').value;
            const errorEl = document.getElementById('add-class-error');
            const submitBtn = addClassForm.querySelector('.submit-btn');

            if (!className || !classFee) {
                errorEl.textContent = 'Class Name and Fee are required.';
                errorEl.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            errorEl.style.display = 'none';

            try {
                const response = await fetch('/api/admin/add-class', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ className, fee: parseInt(classFee, 10) })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert(result.message);
                addClassModalOverlay.style.display = 'none';

                // Clear the timetable cache so it gets re-fetched with the new class
                schoolTimetable = null;

                // Refresh the class lists in both the Timetable and Departments views
                // to show the newly added class immediately.
                loadClassesIntoTimetablesView();
                loadAndDisplayClasses();

            } catch (error) {
                errorEl.textContent = error.message;
                errorEl.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Class';
            }
        });
    }

    // --- Remove Class Modal Logic ---
    const openRemoveClassModal = (className) => {
        if (!removeClassModalOverlay) return;
        classNameToRemoveSpan.textContent = className;
        confirmRemoveClassBtn.dataset.className = className; // Store class name on the button
        document.getElementById('remove-class-error').style.display = 'none';
        removeClassModalOverlay.style.display = 'flex';
    };

    if (closeRemoveClassModalBtn) {
        closeRemoveClassModalBtn.addEventListener('click', () => {
            removeClassModalOverlay.style.display = 'none';
        });
    }

    if (confirmRemoveClassBtn) {
        confirmRemoveClassBtn.addEventListener('click', async (e) => {
            const className = e.target.dataset.className;
            const errorEl = document.getElementById('remove-class-error');
            const submitBtn = e.target;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Removing...';
            errorEl.style.display = 'none';

            try {
                const response = await fetch(`/api/admin/class/${encodeURIComponent(className)}`, { method: 'DELETE' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                alert(result.message);
                removeClassModalOverlay.style.display = 'none';
                // Clear the timetable cache so it gets re-fetched without the deleted class
                schoolTimetable = null;

                loadAndDisplayClasses(); // Refresh departments view
                loadClassesIntoTimetablesView(); // Refresh timetable view
            } catch (error) {
                errorEl.textContent = `Error: ${error.message}`;
                errorEl.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Yes, Remove Class';
            }
        });
    }

    // --- New: Logic to load classes into the main Timetable view ---
    const loadClassesIntoTimetablesView = async () => {
        const container = document.getElementById('timetableGrid');
        if (!container) return;

        container.innerHTML = '<p>Loading classes...</p>';

        try {
            const response = await fetch('/api/admin/classes');
            if (!response.ok) throw new Error('Failed to fetch classes.');
            
            const classes = await response.json();

            if (classes.length === 0) {
                container.innerHTML = '<p>No classes found.</p>';
                return;
            }

            let gridHTML = '';
            classes.forEach(className => {
                gridHTML += `<a href="#" class="timetable-link" data-class="${className}">${className}</a>`;
            });
            container.innerHTML = gridHTML;

            // Re-attach event listeners to the newly created links
            container.querySelectorAll('.timetable-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openTimetableModal(e.target.dataset.class);
                });
            });
        } catch (error) {
            console.error('Error loading classes into timetable view:', error);
            container.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    };

    // --- New: Logic for Departments/Classes View ---
    const loadAndDisplayClasses = async () => {
        const container = document.getElementById('classListContainer');
        if (!container) return;

        container.innerHTML = '<p>Loading classes...</p>';

        try {
            const response = await fetch('/api/admin/classes');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch classes.');
            }
            const classes = await response.json();

            if (classes.length === 0) {
                container.innerHTML = '<p>No classes have been added yet.</p>';
                return;
            }

            // Use the grid style from the Timetable view for consistency
            let gridHTML = `<div class="timetable-grid">`;

            classes.forEach(className => {
                // We will make these links functional by adding the 'timetable-link' class
                gridHTML += `<a href="#" class="timetable-link" data-class="${className}">${className}</a>`;
            });

            gridHTML += `</div>`;
            container.innerHTML = gridHTML;

            // --- Re-attach event listeners to the newly created links ---
            // This is important because the links are created dynamically.
            container.querySelectorAll('.timetable-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openRemoveClassModal(e.target.dataset.class);
                });
            });

        } catch (error) {
            console.error('Error loading classes:', error);
            container.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    };

    // --- Timetable Modal Logic ---
    const generateFullSchoolTimetable = async () => {
        if (schoolTimetable) return; // Already fetched/generated

        try {
            console.log("Attempting to fetch timetable from server...");
            let response = await fetch('/api/timetable/all');
            let result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to fetch timetable.');

            if (result.exists) {
                console.log("Timetable found in database.");
                schoolTimetable = result.data;
            } else {
                console.log("Timetable not found in DB, requesting generation...");
                // If it doesn't exist, ask the server to generate it
                const genResponse = await fetch('/api/timetable/generate', { method: 'POST' });
                const genResult = await genResponse.json();
                if (!genResponse.ok) throw new Error(genResult.message || 'Failed to generate timetable.');

                console.log("Generation successful, fetching again...");
                // Fetch it again now that it's generated
                response = await fetch('/api/timetable/all');
                result = await response.json();
                if (!response.ok || !result.exists) throw new Error('Failed to fetch newly generated timetable.');
                
                schoolTimetable = result.data;
            }
            console.log("Full school timetable is ready.");
        } catch (error) {
            console.error("Error managing timetable:", error);
            alert(`Could not load or generate timetable: ${error.message}`);
            // Set to an empty object to prevent repeated failed attempts
            schoolTimetable = {}; 
        }
    };

    const openTimetableModal = async (className) => {
        if (!timetableModalOverlay) return;

        // Generate the full school timetable once if it hasn't been done yet
        await generateFullSchoolTimetable();
        
        timetableModalTitle.textContent = `Timetable for ${className}`;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        timetableModalBody.innerHTML = ''; // Clear previous content

        // Use the same sanitization logic as the backend to find the correct timetable key
        const sanitizedClassName = className.replace(/[.#$[\]]/g, '_');
        const classTimetable = schoolTimetable[sanitizedClassName];

        if (!classTimetable) {
            timetableModalBody.innerHTML = `<tr><td colspan="8">Timetable data is not available for "${className}". Please check if the class was created correctly.</td></tr>`;
            return;
        }

        days.forEach(day => {
            const row = document.createElement('tr');
            let rowHTML = `<td>${day}</td>`; // Day cell
            for (let i = 1; i <= 6; i++) { // 6 periods
                const subject = classTimetable[day][i] || '---';
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
            const className = timetableModalTitle.textContent.replace('Timetable for ', '');
            const rows = timetableModalBody.querySelectorAll('tr');
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let hasError = false;
            const sanitizedClassName = className.replace(/[.#$[\]]/g, '_');
            const updatePromises = [];

            rows.forEach((row, dayIndex) => {
                const day = days[dayIndex];
                const cells = row.querySelectorAll('td'); // All <td> elements in the row

                // cells[0] is Day name, cells[1-4] are P1-4, cells[5] is Break, cells[6-7] are P5-6
                for (let i = 1; i <= 7; i++) {
                    if (i === 5) continue; // Skip the break cell

                    const period = (i < 5) ? i : (i - 1); // Map cell index to period number
                    const subject = cells[i].textContent.trim();

                    // Update local cache
                    if (schoolTimetable[sanitizedClassName] && schoolTimetable[sanitizedClassName][day]) {
                        schoolTimetable[sanitizedClassName][day][period] = subject;
                    }

                    // Create a promise for the update request
                    const promise = fetch('/api/timetable/update', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ className: sanitizedClassName, day, period, subject })
                    }).then(async response => {
                        if (!response.ok) { hasError = true; const err = await response.json(); console.error(`Failed to update ${className}, ${day}, Period ${period}: ${err.message}`); }
                    });
                    updatePromises.push(promise);
                }
            });

            await Promise.all(updatePromises);

            if (hasError) {
                alert('Some timetable changes could not be saved. Please check the console for details.');
            } else {
                alert('Timetable changes saved successfully!');
            }

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

    // --- Unified User Deletion Logic ---
    const handleDeleteUser = async (event) => {
        const button = event.target;
        const identifier = button.dataset.identifier || button.dataset.rollnumber || button.dataset.username;
        let type = button.dataset.type;

        if (!type) {
            if (button.dataset.rollnumber) type = 'Student';
            if (button.dataset.username) type = 'Faculty';
        }

        if (!identifier || !type) {
            alert('Could not identify user to delete.');
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete this ${type.toLowerCase()}: "${identifier}"? This action cannot be undone.`)) {
            return;
        }

        let deleteUrl = '';
        if (type === 'Student') {
            deleteUrl = `/api/student/${identifier}`;
        } else if (type === 'Admin') {
            deleteUrl = `/api/admin/delete/${identifier}`;
        } else if (type === 'Faculty') {
            deleteUrl = `/api/faculty/${identifier}`;
        } else {
            alert('Unknown user type. Cannot delete.');
            return;
        }

        try {
            const response = await fetch(deleteUrl, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Failed to delete ${type}.`);

            alert(result.message);
            // Refresh the currently active view
            if (type === 'Admin') {
                fetchAndDisplayAdmins();
            } else if (type === 'Student') {
                fetchAllStudents();
            } else if (type === 'Faculty') {
                fetchAllFaculty();
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            alert(`Error: ${error.message}`);
        }
    };

    // Add event listeners to the delete buttons in all tables
    // Using event delegation on the wrapper for dynamically added rows
    adminContentWrapper.addEventListener('click', (event) => {
        if (event.target.matches('.delete-student-btn, .delete-faculty-btn, .delete-user-btn')) {
            handleDeleteUser(event);
        }
    });

});