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

        // --- DOM Element References ---
        const fields = {
            name: { display: document.getElementById('displayName'), edit: document.getElementById('editName') },
            email: { display: document.getElementById('displayEmail'), edit: document.getElementById('editEmail') },
            rollNumber: { display: document.getElementById('displayRollNumber'), edit: document.getElementById('editRollNumber') },
            enrollmentNumber: { display: document.getElementById('displayEnrollmentNumber'), edit: document.getElementById('editEnrollmentNumber') },
            dob: { display: document.getElementById('displayDob'), edit: document.getElementById('editDob') }, // DOB input
            mobileNumber: { display: document.getElementById('displayMobileNumber'), edit: document.getElementById('editMobileNumber') }, // Mobile Number input
            age: { display: document.getElementById('displayAge'), edit: document.getElementById('editAge') },
            gender: { display: document.getElementById('displayGender'), edit: document.getElementById('editGender') }
        };

        const profilePictureContainer = document.querySelector('.profile-picture-container');
        const profilePictureImg = document.getElementById('profilePicture');
        const editProfilePictureInput = document.getElementById('editProfilePicture');

        const saveBtn = document.getElementById('saveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const fullProfileFields = document.querySelectorAll('.full-profile-only');
        const proceedSection = document.querySelector('.proceed-section');

        // --- Side Navigation References ---
        const sideNavBtn = document.getElementById('sideNavBtn');
        const sideNav = document.getElementById('sideNav');
        const sideNavOverlay = document.getElementById('sideNavOverlay');
        const closeSideNavBtn = document.getElementById('closeSideNavBtn');
        const sideNavEditProfileBtn = document.getElementById('sideNavEditProfileBtn');
        const sideNavLogoutBtn = document.getElementById('sideNavLogoutBtn');
        const sideNavAvatar = document.getElementById('sideNavAvatar');
        const sideNavName = document.getElementById('sideNavName');

        // --- Notification Panel References ---
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationPanel = document.getElementById('notificationPanel');
        const notificationBadge = document.getElementById('notificationBadge');

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

        // --- Side Navigation Action Listeners ---
        if (sideNavEditProfileBtn) {
            sideNavEditProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                setProfileView('full'); // This shows all fields and enables edit mode
                closeNav(); // Close the nav panel after clicking
            });
        }

        if (sideNavLogoutBtn) {
            sideNavLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.clear();
                window.location.replace('index.html');
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
            // Lock the "Edit Profile" button in the side nav for paid students.
            if (sideNavEditProfileBtn) {
                sideNavEditProfileBtn.parentElement.style.display = 'none';
            }
        } else {
            // --- PRE-PAYMENT VIEW (UNLOCKED) ---
            if (sideNavEditProfileBtn) {
                sideNavEditProfileBtn.parentElement.style.display = 'list-item';
            }

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

        // --- Functions ---

        const autoformatDob = (event) => {
            const input = event.target;
            // 1. Remove all non-digit characters
            let value = input.value.replace(/\D/g, '');
            let formattedValue = '';

            // 2. Add hyphens at the correct positions
            if (value.length > 0) {
                formattedValue = value.substring(0, 2);
            }
            if (value.length > 2) {
                formattedValue += '-' + value.substring(2, 4);
            }
            if (value.length > 4) {
                formattedValue += '-' + value.substring(4, 8);
            }
            // 3. Update the input field value
            input.value = formattedValue;
        };

        const calculateAge = (dobString) => {
            if (!dobString) return '';
            const dob = new Date(dobString);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDifference = today.getMonth() - dob.getMonth();
            if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            return age >= 0 ? age : '';
        };

        function populateFields(data) {
            fields.name.display.textContent = data.name;
            fields.email.display.textContent = data.email || 'N/A';
            fields.rollNumber.display.textContent = data.rollNumber;
            fields.enrollmentNumber.display.textContent = data.enrollmentNumber || 'N/A';
            if (data.dob) {
                // Create a Date object to handle different formats (e.g., YYYY-MM-DD or full ISO string)
                // Use UTC methods to avoid timezone-related date shifts.
                const dobDate = new Date(data.dob);
                const day = String(dobDate.getUTCDate()).padStart(2, '0');
                const month = String(dobDate.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                const year = dobDate.getUTCFullYear();
                fields.dob.display.textContent = `${day}-${month}-${year}`;
            } else {
                fields.dob.display.textContent = 'N/A';
            }
            fields.age.display.textContent = calculateAge(data.dob);
            fields.gender.display.textContent = data.gender || 'N/A';
            fields.mobileNumber.display.textContent = data.mobileNumber || 'N/A';

            // Set the profile picture, with a fallback
            if (data.profilePicture && data.profilePicture.trim() !== '') {
                profilePictureImg.src = data.profilePicture;
            } else {
                profilePictureImg.src = 'bhu-logo.png'; // A default image
            }
            profilePictureImg.onerror = () => {
                profilePictureImg.src = 'bhu-logo.png'; // Fallback if the image fails to load
            };

            // Also set initial values for edit fields
            fields.name.edit.value = data.name;
            fields.email.edit.value = data.email || '';
            fields.rollNumber.edit.value = data.rollNumber;
            fields.enrollmentNumber.edit.value = data.enrollmentNumber || '';
            if (data.dob) {
                // Use the same robust date parsing for the edit field
                // Use UTC methods to avoid timezone-related date shifts.
                const dobDate = new Date(data.dob);
                const day = String(dobDate.getUTCDate()).padStart(2, '0');
                const month = String(dobDate.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                const year = dobDate.getUTCFullYear();
                fields.dob.edit.value = `${day}-${month}-${year}`;
            } else {
                fields.dob.edit.value = '';
            }
            fields.age.edit.value = calculateAge(data.dob);
            fields.mobileNumber.edit.value = data.mobileNumber || '';
            fields.gender.edit.value = data.gender || '';
        }

        function toggleEditMode(isEditing) {
            for (const key in fields) {
                fields[key].display.style.display = isEditing ? 'none' : 'flex';
                fields[key].edit.style.display = isEditing ? 'block' : 'none';
            }
            if (isEditing) {
                profilePictureContainer.classList.add('editing');
                proceedSection.style.display = 'none';
            } else {
                profilePictureContainer.classList.remove('editing');
                proceedSection.style.display = 'block';
                // Reset image preview on cancel
                populateFields(studentData);
                editProfilePictureInput.value = ''; // Clear any selected file
            }
            saveBtn.style.display = isEditing ? 'inline-block' : 'none';
            cancelBtn.style.display = isEditing ? 'inline-block' : 'none';
        }

        // New function to control which profile fields are visible
        function setProfileView(view) { // view can be 'compact' or 'full'
            if (view === 'compact') {
                fullProfileFields.forEach(el => el.style.display = 'none');
                toggleEditMode(false); // Ensure we are in display mode
            } else if (view === 'full') {
                fullProfileFields.forEach(el => el.style.display = 'grid'); // 'grid' is the display type for .detail-group
                toggleEditMode(true); // Switch to edit mode
            }
        }

        // --- Event Listeners ---

        // Show image preview when a new file is selected
        editProfilePictureInput.addEventListener('change', () => {
            const file = editProfilePictureInput.files[0];
            if (file) {
                profilePictureImg.src = URL.createObjectURL(file);
            }
        });

        cancelBtn.addEventListener('click', () => setProfileView('compact'));

        // Auto-format DOB as user types in edit mode
        fields.dob.edit.addEventListener('input', autoformatDob);

        fields.dob.edit.addEventListener('change', () => {
            const dobValue = fields.dob.edit.value;
            if (/^\d{2}-\d{2}-\d{4}$/.test(dobValue)) {
                const parts = dobValue.split('-');
                const day = parts[0];
                const month = parts[1];
                const year = parts[2];
                fields.age.edit.value = calculateAge(`${year}-${month}-${day}`);
            } else {
                fields.age.edit.value = '';
            }
        });

        // --- Initial Population ---
        resetInactivityTimer(); // Start the timer on page load
        populateFields(studentData);
        setProfileView('compact'); // Set the initial view to compact profile
    };

    // --- Navigation Helper ---
    // Sets a flag before any internal link is followed to allow the next page to load.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && link.hostname === window.location.hostname) {
            // Exclude the new logout button from this logic.
            if (link.id !== 'sideNavLogoutBtn') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });

    // Run status check first, then initialize the page.
    checkServerStatus().then(initializePage);
});