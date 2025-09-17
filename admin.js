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
    const sideNavPostNoticeBtn = document.getElementById('sideNavPostNoticeBtn');
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
    const viewNoticeHistoryBtn = document.getElementById('viewNoticeHistoryBtn');

    // --- Notice History Modal Elements ---
    const noticeHistoryModalOverlay = document.getElementById('noticeHistoryModalOverlay');
    const noticeHistoryList = document.getElementById('noticeHistoryList');
    const closeNoticeHistoryBtn = document.getElementById('closeNoticeHistoryBtn');

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

    // Open Post Notice modal from side nav
    if (sideNavPostNoticeBtn) {
        sideNavPostNoticeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (postNoticeModalOverlay) {
                postNoticeModalOverlay.style.display = 'flex';
                noticeMessageInput.value = '';
                noticeError.style.display = 'none';
            }
            closeNav(); // Close the side nav
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
            if (noticeHistoryModalOverlay) noticeHistoryModalOverlay.style.display = 'none';
        });
    }

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
});