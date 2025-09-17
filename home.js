// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// security script in the <head> always runs.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const studentDataString = sessionStorage.getItem('currentStudent');

    // --- Server Status Check ---
    // This function checks if the server has restarted since the user logged in.
    const checkServerStatus = async () => {
        const loginTimeString = sessionStorage.getItem('loginTime');
        if (!loginTimeString) return; // Can't check if we don't know when we logged in

        try {
            const response = await fetch('/api/status');
            if (!response.ok) return; // Don't logout if status check fails

            const data = await response.json();
            const serverStartTime = new Date(data.serverStartTime);
            const loginTime = new Date(loginTimeString);

            if (serverStartTime > loginTime) {
                alert('The server has been updated. Please log in again for security.');
                sessionStorage.clear();
                window.location.replace('index.html');
            }
        } catch (error) {
            console.warn('Could not check server status:', error);
        }
    };

    // --- Inactivity Logout Timer ---
    let inactivityTimer;
    const logoutTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            // Logout the user
            alert('You have been logged out due to inactivity.');
            sessionStorage.clear();
            window.location.replace('index.html');
        }, logoutTime);
    };

    // Events that reset the timer
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);

    // This function contains the main logic for setting up the home page.
    // It will only run after the server status check is complete.
    const initializePage = () => {
        if (!studentDataString) {
            // If no student data, redirect to registration page
            window.location.href = 'index.html';
            return;
        }

        let studentData = JSON.parse(studentDataString);
        let searchableItems = []; // Define the array to hold all searchable items

        // --- View Containers ---
        const proceedSection = document.querySelector('.proceed-section');

        // --- Side Navigation References ---
        const sideNavBtn = document.getElementById('sideNavBtn');
        const sideNav = document.getElementById('sideNav');
        const sideNavOverlay = document.getElementById('sideNavOverlay');
        const closeSideNavBtn = document.getElementById('closeSideNavBtn');
        const sideNavDashboardLink = document.querySelector('a[href="home.html"]');
        const sideNavHistoryBtn = document.getElementById('sideNavHistoryBtn');
        const sideNavSettingsBtn = document.getElementById('sideNavSettingsBtn');
        const sideNavLogoutBtn = document.getElementById('sideNavLogoutBtn');
        const sideNavAvatar = document.getElementById('sideNavAvatar');
        const sideNavName = document.getElementById('sideNavName');

        // --- Notification Panel References ---
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationPanel = document.getElementById('notificationPanel');
        const notificationBadge = document.getElementById('notificationBadge');
        const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');

        // --- Settings View References ---
        const settingsFields = {
            name: document.getElementById('settingName'),
            email: document.getElementById('settingEmail'),
            dobDay: document.getElementById('settingDobDay'),
            dobMonth: document.getElementById('settingDobMonth'),
            dobYear: document.getElementById('settingDobYear'),
            gender: document.getElementById('settingGender')
        };
        const profilePictureImg = document.getElementById('profilePicture');
        const editProfilePictureInput = document.getElementById('editProfilePicture');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');

        // --- Profile Modal References ---
        const profileModalOverlay = document.getElementById('profileModalOverlay');
        const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
        const modalProfilePic = document.getElementById('modalProfilePic');
        const modalStudentName = document.getElementById('modalStudentName');
        const modalEmail = document.getElementById('modalEmail');
        const modalMobile = document.getElementById('modalMobile');
        const modalRollNo = document.getElementById('modalRollNo');
        const modalEnrollmentNo = document.getElementById('modalEnrollmentNo');

        // --- NEW Settings Modal References ---
        const settingsModalOverlay = document.getElementById('settingsModalOverlay');
        const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');

        // --- Payment History Modal References ---
        const historyModalOverlay = document.getElementById('historyModalOverlay');
        const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
        const historyTableBody = document.getElementById('history-table-body');
        const noHistoryMessage = document.getElementById('no-history-message');

        // --- Search Modal References ---
        const searchModalOverlay = document.getElementById('searchModalOverlay');
        const closeSearchModalBtn = document.getElementById('closeSearchModalBtn');
        const searchInput = document.getElementById('searchInput');
        const searchResultsList = document.getElementById('searchResultsList');
        const noSearchResultsMessage = document.getElementById('no-search-results');
        let openSearchModalBtn; // Will be defined after dashboard renders

        // --- All Notifications Modal ---
        const allNotificationsModalOverlay = document.getElementById('allNotificationsModalOverlay');
        const closeAllNotificationsModalBtn = document.getElementById('closeAllNotificationsModalBtn');


        // Helper function to generate HTML for each application step
        function createStepHTML(title, description, link, isDone, isEnabled) {
            const statusText = isDone ? '✓ Completed' : 'Pending';
            const statusClass = isDone ? 'done' : 'pending';
            const buttonText = isDone ? 'Edit' : 'Start';
            const disabledClass = isEnabled ? '' : 'disabled';
        
            return `
                <div class="step-item ${disabledClass}">
                    <div class="step-info">
                        <h5>${title}</h5>
                        <p>${description}</p>
                    </div>
                    <div class="step-action">
                        <span class="status ${statusClass}">${statusText}</span>
                        <a href="${isEnabled ? link : '#'}" class="submit-btn step-btn ${disabledClass}">${buttonText}</a>
                    </div>
                </div>
            `;
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

        if (sideNavBtn && closeSideNavBtn && sideNavOverlay) {
            sideNavBtn.addEventListener('click', openNav);
            closeSideNavBtn.addEventListener('click', closeNav);
            sideNavOverlay.addEventListener('click', closeNav);
        }

        // --- Populate Side Navigation Header ---
        if (sideNavName) {
            sideNavName.textContent = studentData.name || 'Student';
        }
        if (sideNavAvatar) {
            sideNavAvatar.src = studentData.profilePicture || 'default-avatar.png';
            sideNavAvatar.onerror = () => { sideNavAvatar.src = 'default-avatar.png'; };
        }

        // --- Profile Modal Listeners ---
        if (sideNavAvatar) {
            sideNavAvatar.addEventListener('click', () => {
                // Populate modal with data
                modalProfilePic.src = studentData.profilePicture || 'default-avatar.png';
                modalStudentName.textContent = studentData.name || 'N/A';
                modalEmail.textContent = studentData.email || 'N/A';
                modalMobile.textContent = studentData.mobileNumber || 'N/A';
                modalRollNo.textContent = studentData.rollNumber || 'N/A';
                modalEnrollmentNo.textContent = studentData.enrollmentNumber || 'N/A';

                // Show the modal
                if (profileModalOverlay) profileModalOverlay.classList.add('active');
                closeNav(); // Close the side nav if it's open
            });
        }

        // --- Generic Modal Logic ---
        const openModal = (modalOverlay) => {
            if (modalOverlay) modalOverlay.classList.add('active');
        };
        const closeModal = (modalOverlay) => {
            if (modalOverlay) modalOverlay.classList.remove('active');
        };

        if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', () => closeModal(profileModalOverlay));
        if (profileModalOverlay) profileModalOverlay.addEventListener('click', (event) => { if (event.target === profileModalOverlay) closeModal(profileModalOverlay); });

        // --- Settings Modal Logic ---
        const openSettingsModal = () => {
            populateSettingsForm(studentData);
            openModal(settingsModalOverlay);
            closeNav();
        };
        if (sideNavSettingsBtn) {
            sideNavSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openSettingsModal();
            });
        }
        if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', () => closeModal(settingsModalOverlay));
        if (settingsModalOverlay) settingsModalOverlay.addEventListener('click', (event) => { if (event.target === settingsModalOverlay) closeModal(settingsModalOverlay); });

        // --- Payment History Modal Logic ---
        const fetchAndDisplayPaymentHistory = async () => {
            if (!historyTableBody || !noHistoryMessage) return;
            if (!studentData || !studentData.rollNumber) {
                console.error("Cannot fetch payment history: student roll number is missing from session data.");
                historyTableBody.innerHTML = '';
                noHistoryMessage.textContent = 'Could not load history (student data missing).';
                noHistoryMessage.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`/payment-history/${studentData.rollNumber}`);
                if (!response.ok) throw new Error('Failed to fetch history');
                
                const history = await response.json();

                historyTableBody.innerHTML = ''; // Clear previous entries

                if (history.length > 0) {
                    noHistoryMessage.style.display = 'none';
                    history.forEach(record => {
                        const row = document.createElement('tr');
                        // Add a class for styling based on status
                        const statusClass = record.status === 'success' ? 'status-success' : 'status-failure';
                        const statusText = record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A';

                        // Safely parse the amount to a number before formatting.
                        // The DB driver might return it as a string.
                        const amountValue = parseFloat(record.amount);
                        const formattedAmount = !isNaN(amountValue) ? amountValue.toFixed(2) : '0.00';

                        row.innerHTML = `
                            <td>${record.studentName || 'N/A'}</td>
                            <td>${record.paymentId || 'N/A'}</td>
                            <td>${record.orderId || 'N/A'}</td>
                            <td>₹${formattedAmount}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        `;
                        historyTableBody.appendChild(row);
                    });
                } else {
                    noHistoryMessage.textContent = 'No payment history found.';
                    noHistoryMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Error fetching payment history:', error);
                historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Could not load payment history. Please check your connection and try again.</td></tr>`;
                noHistoryMessage.style.display = 'none';
            }
        };

        const openHistoryModal = () => {
            fetchAndDisplayPaymentHistory();
            openModal(historyModalOverlay);
            closeNav();
        };

        // Listeners for opening the history modal
        if (sideNavHistoryBtn) {
            sideNavHistoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openHistoryModal();
            });
        }
        // The dashboard link listener is added after the dashboard is rendered.

        // Listeners for closing the history modal
        if (closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', () => closeModal(historyModalOverlay));
        if (historyModalOverlay) historyModalOverlay.addEventListener('click', (event) => { if (event.target === historyModalOverlay) closeModal(historyModalOverlay); });

        // --- Side Navigation Action Listeners ---
        if (sideNavLogoutBtn) {
            sideNavLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.clear();
                window.location.replace('index.html');
            });
        }

        if (sideNavDashboardLink) {
            sideNavDashboardLink.addEventListener('click', (e) => {
                e.preventDefault();
                // If we are on a different view, this would bring us back.
                // For now, it just closes the nav.
                closeNav();
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

        // --- All Notifications Modal Logic ---
        if (viewAllNotificationsLink) {
            viewAllNotificationsLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (notificationPanel) notificationPanel.classList.remove('active'); // Close dropdown
                openModal(allNotificationsModalOverlay);
            });
        }
        if (closeAllNotificationsModalBtn) {
            closeAllNotificationsModalBtn.addEventListener('click', () => closeModal(allNotificationsModalOverlay));
        }
        if (allNotificationsModalOverlay) {
            allNotificationsModalOverlay.addEventListener('click', (event) => {
                if (event.target === allNotificationsModalOverlay) closeModal(allNotificationsModalOverlay);
            });
        }

        // Clear the proceed section before populating
        proceedSection.innerHTML = '';

        // --- Determine Application State (Selected vs. Paid) ---
        let parsedCourse = {};
        let isPaid = false;
        if (studentData.selectedCourse && studentData.selectedCourse.trim().startsWith('{')) {
            try {
                parsedCourse = JSON.parse(studentData.selectedCourse);
                if (parsedCourse.paymentStatus === 'paid') {
                    isPaid = true;
                } else {
                    // Course is selected but not paid. Set it in sessionStorage for the preview/payment pages.
                    sessionStorage.setItem('selectedCourse', studentData.selectedCourse);
                }
            } catch (e) {
                console.error("Could not parse selectedCourse from studentData", e);
            }
        }

        // --- Render Page Based on Payment Status ---
        if (isPaid) {
            // --- POST-PAYMENT VIEW (LOCKED) ---
            // --- Define Searchable Items for POST-PAYMENT view ---
            searchableItems = [
                { title: 'Dashboard', keywords: 'home main', action: { type: 'link', href: 'home.html' } },
                { title: 'Enrolled Courses', keywords: 'my courses subjects enrolled', action: { type: 'link', href: '#' } },
                { title: 'Admission Summary', keywords: 'form details', action: { type: 'link', href: 'payment-summary.html' } },
                { title: 'Attendance Details', keywords: 'present absent', action: { type: 'link', href: '#' } },
                { title: 'Upcoming Events', keywords: 'calendar', action: { type: 'link', href: '#' } },
                { title: 'Time Table', keywords: 'schedule class routine', action: { type: 'link', href: '#' } },
                { title: 'Check Results', keywords: 'grades marks', action: { type: 'link', href: '#' } },
                { title: 'Library Portal', keywords: 'books', action: { type: 'link', href: '#' } },
                { title: 'Notices', keywords: 'announcements updates', action: { type: 'link', href: '#' } },
                { title: 'Support / Helpdesk', keywords: 'help ticket', action: { type: 'link', href: '#' } },
                { title: 'Fee Payment History', keywords: 'fee payment transaction receipt details', action: { type: 'function', func: openHistoryModal } },
                { title: 'Settings', keywords: 'profile edit change password', action: { type: 'function', func: openSettingsModal } },
                { title: 'Logout', keywords: 'sign out exit', action: { type: 'function', func: () => { if(sideNavLogoutBtn) sideNavLogoutBtn.click(); } } }
            ];

            proceedSection.innerHTML = `
                <div class="dashboard-view">
                    <div class="welcome-banner">
                        <h2>Welcome, ${studentData.name || 'Student'}</h2>
                    </div>
                    <div class="quick-links-panel">
                         <div class="quick-links-header">
                            <h4>Quick Links</h4>
                            <button id="openSearchModalBtn" class="search-icon-btn" title="Search">🔍</button>
                         </div>
                         <div class="quick-links-grid">
                            <a href="#" class="quick-link-item">Enrolled Courses</a>
                            <a href="payment-summary.html" class="quick-link-item">Admission Summary</a>
                            <a href="#" class="quick-link-item">Attendance Details</a>
                            <a href="#" class="quick-link-item">Upcoming Events</a>
                            <a href="#" id="quickLinkPaymentHistory" class="quick-link-item">Payment Details</a>
                            <a href="#" class="quick-link-item">Time Table</a>
                            <a href="#" class="quick-link-item">Check Results</a>
                            <a href="#" class="quick-link-item">Library Portal</a>
                        </div>
                    </div>
                </div>
            `;

            // --- New logic for Quick Links ---
            const quickLinks = document.querySelectorAll('.quick-link-item');

            quickLinks.forEach((link, index) => {
                // Determine row index (0-based, since there are 2 items per row)
                const rowIndex = Math.floor(index / 2);

                // Apply color based on whether the row is even or odd
                if (rowIndex % 2 === 0) {
                    link.classList.add('ql-dark-blue'); // For rows 1 and 3
                } else {
                    link.classList.add('ql-light-blue'); // For rows 2 and 4
                }
            });

            // --- Attach event listeners for this view ---
            const quickLinkPaymentHistory = document.getElementById('quickLinkPaymentHistory');
            if (quickLinkPaymentHistory) {
                quickLinkPaymentHistory.addEventListener('click', (e) => {
                    e.preventDefault();
                    openHistoryModal();
                });
            }

            // Attach listener for the search button
            openSearchModalBtn = document.getElementById('openSearchModalBtn');
            if (openSearchModalBtn) {
                openSearchModalBtn.addEventListener('click', () => {
                    openModal(searchModalOverlay);
                    searchInput.value = ''; // Clear search input on open
                    searchResultsList.innerHTML = ''; // Clear results on open
                    noSearchResultsMessage.style.display = 'none';
                    searchInput.focus(); // Focus the input
                });
            }
        } else {
            // --- PRE-PAYMENT VIEW (UNLOCKED) ---
            const contactDone = studentData.addressLine1 && studentData.addressLine1.trim() !== '';
            const academicDone = studentData.board10 && studentData.board10.trim() !== '';
            // Check for the new document fields to mark this step as done
            const documentsDone = studentData.profilePicture && studentData.signature && studentData.marksheet10 && studentData.marksheet12;
            // A course is considered "selected" if a valid course object (with an amount) was parsed from the student data.
            const courseSelected = !!parsedCourse.amount;

            // --- Define Searchable Items for PRE-PAYMENT view ---
            searchableItems = [
                { title: 'Dashboard', keywords: 'home main progress', action: { type: 'link', href: 'home.html' } },
                { title: 'Address & Parents Detail', keywords: 'contact parent', action: { type: 'link', href: 'contact-details.html' }, enabled: true },
                { title: 'Academic Details', keywords: 'marks results 10th 12th', action: { type: 'link', href: 'academic-details.html' }, enabled: contactDone },
                { title: 'Upload Documents', keywords: 'photo signature marksheet', action: { type: 'link', href: 'document-upload.html' }, enabled: academicDone },
                { title: 'Course Selection', keywords: 'subject choose', action: { type: 'link', href: 'course-selection.html' }, enabled: documentsDone },
                { title: 'Preview Application', keywords: 'review form', action: { type: 'link', href: 'preview.html' }, enabled: (contactDone && academicDone && documentsDone && courseSelected) },
                { title: 'Fee Payment History', keywords: 'fee payment transaction receipt details', action: { type: 'function', func: openHistoryModal } },
                { title: 'Settings', keywords: 'profile edit change password', action: { type: 'function', func: openSettingsModal } },
                { title: 'Logout', keywords: 'sign out exit', action: { type: 'function', func: () => { if(sideNavLogoutBtn) sideNavLogoutBtn.click(); } } }
            ];

            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'application-steps';
            stepsContainer.innerHTML = '<h4>Application Progress</h4>';

            // Step 1: Address & Parents Detail
            stepsContainer.innerHTML += createStepHTML(
                '1. Address & Parents Detail', 'Provide your address and parent information.',
                'contact-details.html', contactDone, true
            );

            // Step 2: Academic Details
            stepsContainer.innerHTML += createStepHTML(
                '2. Academic Details', 'Provide your 10th and 12th board results.',
                'academic-details.html', academicDone, contactDone
            );

            // Step 3: Upload Documents
            stepsContainer.innerHTML += createStepHTML(
                '3. Upload Documents', 'Upload your photo, signature, and marksheets.',
                'document-upload.html', documentsDone, academicDone
            );

            // Step 4: Course Selection
            stepsContainer.innerHTML += createStepHTML(
                '4. Course Selection', 'Select your desired course.',
                'course-selection.html', courseSelected, documentsDone
            );

            proceedSection.appendChild(stepsContainer);

            // Add the "Proceed to Preview" button only when all steps are complete
            if (contactDone && academicDone && documentsDone && courseSelected) {
                const previewSection = document.createElement('div');
                previewSection.className = 'final-proceed-section';
                previewSection.innerHTML = `
                    <p>Your application form is complete. Please preview your details before payment.</p>
                    <a href="preview.html" class="submit-btn proceed-btn">Preview the Application</a>
                `;
                proceedSection.appendChild(previewSection);
            }
        }

        // --- Search Modal Logic ---
        if (closeSearchModalBtn) closeSearchModalBtn.addEventListener('click', () => closeModal(searchModalOverlay));
        if (searchModalOverlay) searchModalOverlay.addEventListener('click', (event) => { if (event.target === searchModalOverlay) closeModal(searchModalOverlay); });

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                
                searchResultsList.innerHTML = '';
                noSearchResultsMessage.style.display = 'none';

                if (searchTerm === '') {
                    return;
                }

                const matchingItems = searchableItems.filter(item => {
                    // For pre-payment view, only show enabled items. For post-payment, 'enabled' is undefined, so it passes.
                    if (item.enabled === false) return false;
                    
                    const searchString = `${item.title.toLowerCase()} ${item.keywords.toLowerCase()}`;
                    return searchString.includes(searchTerm);
                });

                if (matchingItems.length > 0) {
                    matchingItems.forEach(item => {
                        const listItem = document.createElement('li');
                        const newLink = document.createElement('a');
                        newLink.href = '#'; // Use a generic href
                        newLink.textContent = item.title;
                        
                        newLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            const action = item.action;
                            if (action.type === 'link') {
                                sessionStorage.setItem('navigationAllowed', 'true');
                                window.location.href = action.href;
                            } else if (action.type === 'function') {
                                action.func();
                            }
                            closeModal(searchModalOverlay);
                        });

                        listItem.appendChild(newLink);
                        searchResultsList.appendChild(listItem);
                    });
                } else {
                    noSearchResultsMessage.style.display = 'block';
                }
            });
        }

        // --- Settings View Logic ---
        const populateDobDropdowns = () => {
            if (!settingsFields.dobDay || !settingsFields.dobMonth || !settingsFields.dobYear) return;

            // Add default options
            settingsFields.dobDay.innerHTML = '<option value="" disabled selected>Day</option>';
            settingsFields.dobMonth.innerHTML = '<option value="" disabled selected>Month</option>';
            settingsFields.dobYear.innerHTML = '<option value="" disabled selected>Year</option>';

            // Populate Days
            for (let i = 1; i <= 31; i++) {
                const option = document.createElement('option');
                option.value = String(i).padStart(2, '0');
                option.textContent = i;
                settingsFields.dobDay.appendChild(option);
            }

            // Populate Months
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = String(index + 1).padStart(2, '0');
                option.textContent = month;
                settingsFields.dobMonth.appendChild(option);
            });

            // Populate Years
            const currentYear = new Date().getFullYear();
            const startYear = 1950;
            const endYear = currentYear - 5;
            for (let i = endYear; i >= startYear; i--) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                settingsFields.dobYear.appendChild(option);
            }
        };

        function populateSettingsForm(data) {
            settingsFields.name.value = data.name || '';
            settingsFields.email.value = data.email || '';

            // --- Handle Date of Birth ---
            if (data.dob) {
                const dobDate = new Date(data.dob);
                settingsFields.dobDay.value = String(dobDate.getUTCDate()).padStart(2, '0');
                settingsFields.dobMonth.value = String(dobDate.getUTCMonth() + 1).padStart(2, '0');
                settingsFields.dobYear.value = dobDate.getUTCFullYear();
                // Make DOB fields read-only if already set
                [settingsFields.dobDay, settingsFields.dobMonth, settingsFields.dobYear].forEach(el => {
                    el.disabled = true;
                    el.setAttribute('title', 'Date of Birth cannot be changed once set.');
                });
            } else {
                settingsFields.dobDay.value = '';
                settingsFields.dobMonth.value = '';
                settingsFields.dobYear.value = '';
                // Make sure they are enabled if not set
                [settingsFields.dobDay, settingsFields.dobMonth, settingsFields.dobYear].forEach(el => {
                    el.disabled = false;
                    el.removeAttribute('title');
                });
            }

            // --- Handle Gender ---
            settingsFields.gender.value = data.gender || '';
            if (data.gender) {
                // Make Gender field read-only if already set
                settingsFields.gender.disabled = true;
                settingsFields.gender.setAttribute('title', 'Gender cannot be changed once set.');
            } else {
                settingsFields.gender.disabled = false;
                settingsFields.gender.removeAttribute('title');
            }

            if (profilePictureImg) {
                profilePictureImg.src = data.profilePicture || 'default-avatar.png';
                profilePictureImg.onerror = () => { profilePictureImg.src = 'default-avatar.png'; };
            }
        }

        if (editProfilePictureInput) {
            editProfilePictureInput.addEventListener('change', () => {
                const file = editProfilePictureInput.files[0];
                if (file) {
                    profilePictureImg.src = URL.createObjectURL(file);
                }
            });
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                if (window.confirm('Are you sure you want to save these changes?')) {
                    const formData = new FormData();
                    formData.append('rollNumber', studentData.rollNumber);

                    // --- Handle DOB ---
                    // Only process DOB if the fields are not disabled (i.e., it's being set for the first time)
                    if (!settingsFields.dobDay.disabled) {
                        let formattedDobForSave = '';
                        const day = settingsFields.dobDay.value;
                        const month = settingsFields.dobMonth.value;
                        const year = settingsFields.dobYear.value;

                        if (day && month && year) {
                            // Basic validation for date validity
                            const date = new Date(year, month - 1, day);
                            if (date.getFullYear() !== parseInt(year, 10) || date.getMonth() !== parseInt(month, 10) - 1 || date.getDate() !== parseInt(day, 10)) {
                                alert('The selected date is not a valid calendar date (e.g., Feb 30).');
                                return;
                            }
                            formattedDobForSave = `${year}-${month}-${day}`;
                            formData.append('dob', formattedDobForSave);
                        } else if (day || month || year) {
                            // If some but not all are selected
                            alert('Please select your full date of birth or leave it blank.');
                            return;
                        }
                        // If all are blank, we just don't append 'dob' to formData.
                    }

                    // --- Handle Gender ---
                    // Only process Gender if the field is not disabled
                    if (!settingsFields.gender.disabled) {
                        if (settingsFields.gender.value) {
                             formData.append('gender', settingsFields.gender.value);
                        }
                    }

                    // Handle profile picture upload
                    if (editProfilePictureInput.files[0]) {
                        formData.append('profilePicture', editProfilePictureInput.files[0]);
                    }

                    fetch('/update', {
                        method: 'POST',
                        body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.studentData) {
                            alert('Settings updated successfully!');
                            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
                            studentData = data.studentData; // Update local variable
                            populateSettingsForm(studentData); // Re-populate form to apply disabled states
                            if (sideNavAvatar) sideNavAvatar.src = studentData.profilePicture || 'default-avatar.png'; // Update side nav avatar
                            closeModal(settingsModalOverlay); // Close modal on success
                        } else {
                            throw new Error(data.message || 'Update failed.');
                        }
                    })
                    .catch(error => {
                        console.error('Error updating settings:', error);
                        alert(`Failed to update settings: ${error.message}`);
                    });
                }
            });
        }

        // --- Initial Population ---
        resetInactivityTimer(); // Start the timer on page load
        populateDobDropdowns(); // Populate the DOB dropdowns on page load
    };

    // --- Navigation Helper ---
    // Sets a flag before any internal link is followed to allow the next page to load.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && (link.hostname === window.location.hostname || !link.hostname)) {
            // Exclude the new logout button from this logic.
            if (link.id !== 'sideNavLogoutBtn') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });

    // Run status check first, then initialize the page.
    checkServerStatus().then(initializePage);
});