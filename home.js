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

        // --- View Containers ---
        const proceedSection = document.querySelector('.proceed-section');

        // --- Side Navigation References ---
        const sideNavBtn = document.getElementById('sideNavBtn');
        const sideNav = document.getElementById('sideNav');
        const sideNavOverlay = document.getElementById('sideNavOverlay');
        const closeSideNavBtn = document.getElementById('closeSideNavBtn');
        const sideNavDashboardLink = document.querySelector('a[href="home.html"]');
        const sideNavSettingsBtn = document.getElementById('sideNavSettingsBtn');
        const sideNavFeeHistoryBtn = document.getElementById('sideNavFeeHistoryBtn');
        const sideNavLogoutBtn = document.getElementById('sideNavLogoutBtn');
        const sideNavAvatar = document.getElementById('sideNavAvatar');
        const sideNavName = document.getElementById('sideNavName');

        // --- Notification Panel References ---
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationPanel = document.getElementById('notificationPanel');
        const notificationBadge = document.getElementById('notificationBadge');

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
        const closeProfileModal = () => { if (profileModalOverlay) profileModalOverlay.classList.remove('active'); };
        if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeProfileModal);
        if (profileModalOverlay) profileModalOverlay.addEventListener('click', (event) => { if (event.target === profileModalOverlay) closeProfileModal(); });

        // --- Settings Modal Logic ---
        const openSettingsModal = () => {
            populateSettingsForm(studentData);
            if (settingsModalOverlay) settingsModalOverlay.classList.add('active');
            closeNav();
        };
        const closeSettingsModal = () => {
            if (settingsModalOverlay) settingsModalOverlay.classList.remove('active');
        };
        if (sideNavSettingsBtn) {
            sideNavSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openSettingsModal();
            });
        }
        if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
        if (settingsModalOverlay) settingsModalOverlay.addEventListener('click', (event) => { if (event.target === settingsModalOverlay) closeSettingsModal(); });

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
                const response = await fetch(`/payment-history?rollNumber=${studentData.rollNumber}`);
                if (!response.ok) throw new Error('Failed to fetch history');
                
                const history = await response.json();

                historyTableBody.innerHTML = ''; // Clear previous entries

                if (history.length > 0) {
                    noHistoryMessage.style.display = 'none';
                    history.forEach(record => {
                        const row = document.createElement('tr');
                        const paymentDate = new Date(record.paymentDate).toLocaleDateString('en-IN');
                        row.innerHTML = `
                            <td>${record.orderId}</td>
                            <td>${record.paymentId}</td>
                            <td>${record.courseName}</td>
                            <td>₹${record.amount.toFixed(2)}</td>
                            <td>${paymentDate}</td>
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
            if (historyModalOverlay) historyModalOverlay.classList.add('active');
            closeNav();
        };
        const closeHistoryModal = () => { if (historyModalOverlay) historyModalOverlay.classList.remove('active'); };
        if (sideNavFeeHistoryBtn) { sideNavFeeHistoryBtn.addEventListener('click', (e) => { e.preventDefault(); openHistoryModal(); }); }
        if (closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
        if (historyModalOverlay) historyModalOverlay.addEventListener('click', (event) => { if (event.target === historyModalOverlay) closeHistoryModal(); });

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
            const courseName = parsedCourse.branch || 'Your Enrolled Course';
            proceedSection.innerHTML = `
                <div class="dashboard-view">
                    <h4>My Dashboard</h4>
                    <div class="summary-cards">
                        <div class="card">
                            <h4>Enrolled Course</h4>
                            <p style="font-size: 1.2rem; font-weight: 500; min-height: 58px; display: flex; align-items: center; justify-content: center;">${courseName}</p>
                            <a href="payment-summary.html">View Admission Summary</a>
                        </div>
                        <div class="card">
                            <h4>Attendance</h4>
                            <p>N/A</p>
                            <a href="#">View Details</a>
                        </div>
                        <div class="card">
                            <h4>Upcoming Deadlines</h4>
                            <p>None</p>
                            <a href="#">View Calendar</a>
                        </div>
                        <div class="card">
                            <h4>Fee Balance</h4>
                            <p>₹ 0.00</p>
                            <a href="dashboard.html">Payment History</a>
                        </div>
                    </div>
                    <div class="quick-links-panel">
                         <h4>Quick Links</h4>
                         <ul>
                            <li><a href="#">View Timetable</a></li>
                            <li><a href="#">Check Results</a></li>
                            <li><a href="#">Library Portal</a></li>
                            <li><a href="#">Submit Help Ticket</a></li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            // --- PRE-PAYMENT VIEW (UNLOCKED) ---
            const contactDone = studentData.addressLine1 && studentData.addressLine1.trim() !== '';
            const academicDone = studentData.board10 && studentData.board10.trim() !== '';
            // Check for the new document fields to mark this step as done
            const documentsDone = studentData.profilePicture && studentData.signature && studentData.marksheet10 && studentData.marksheet12;
            // A course is considered "selected" if a valid course object (with an amount) was parsed from the student data.
            const courseSelected = !!parsedCourse.amount;

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
            if (data.dob) {
                const dobDate = new Date(data.dob);
                settingsFields.dobDay.value = String(dobDate.getUTCDate()).padStart(2, '0');
                settingsFields.dobMonth.value = String(dobDate.getUTCMonth() + 1).padStart(2, '0');
                settingsFields.dobYear.value = dobDate.getUTCFullYear();
            } else {
                settingsFields.dobDay.value = '';
                settingsFields.dobMonth.value = '';
                settingsFields.dobYear.value = '';
            }
            settingsFields.gender.value = data.gender || '';

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
                    } else if (day || month || year) {
                        // If some but not all are selected
                        alert('Please select your full date of birth or leave it blank.');
                        return;
                    } else {
                        // If all are blank, check if DOB was previously set.
                        // This logic prevents accidentally clearing a required field.
                        if (studentData.dob) {
                            alert('Date of Birth cannot be cleared once set. Please select a valid date.');
                            return;
                        }
                    }

                    const formData = new FormData();
                    formData.append('rollNumber', studentData.rollNumber);
                    formData.append('dob', formattedDobForSave);
                    formData.append('gender', settingsFields.gender.value);
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
                            populateSettingsForm(studentData); // Re-populate form
                            if (sideNavAvatar) sideNavAvatar.src = studentData.profilePicture || 'default-avatar.png'; // Update side nav avatar
                            if (typeof closeSettingsModal === 'function') closeSettingsModal(); // Close modal on success
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