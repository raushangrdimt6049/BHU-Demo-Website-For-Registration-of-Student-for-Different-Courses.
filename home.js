// The primary, immediate security check is now an inline script in the <head> of the HTML file.
// This listener remains crucial for handling scenarios where a page is restored
// from the browser's back-forward cache (bfcache) after a logout.
// after logging out. The page might be served from the browser's fast
// back-forward cache (bfcache), and this ensures it's not shown.
window.addEventListener('pageshow', (event) => {
    if (!sessionStorage.getItem('currentStudent')) {
        window.location.replace('login.html');
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
                window.location.replace('login.html');
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
            window.location.replace('login.html');
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
            window.location.href = 'login.html';
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

        // --- Profile Picture References ---
        const profilePictureContainer = document.querySelector('.profile-picture-container');
        const profilePictureImg = document.getElementById('profilePicture');
        const editProfilePictureInput = document.getElementById('editProfilePicture');

        // --- Menu and Button References ---
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenuDropdown = document.getElementById('userMenuDropdown');
        const viewProfileBtn = document.getElementById('viewProfileBtn');
        const editDetailsBtn = document.getElementById('editDetailsBtn');
        const logoutBtnMenu = document.getElementById('logoutBtnMenu');
        const saveBtn = document.getElementById('saveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const fullProfileFields = document.querySelectorAll('.full-profile-only');
        const proceedSection = document.querySelector('.proceed-section');

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

        // Clear the proceed section before populating
        proceedSection.innerHTML = '';

        // Check if course details are filled (i.e., payment is done) and lock editing.
        if (studentData.selectedCourse && studentData.selectedCourse.trim().startsWith('{')) {
            // --- POST-PAYMENT VIEW (LOCKED) ---
            proceedSection.innerHTML = `
                <p>Your admission process is complete.</p>
                <a href="payment-summary.html" class="submit-btn proceed-btn">View Admission Summary</a>
            `;
            // Lock the "Edit Details" button in the menu, as requested.
            if (editDetailsBtn) {
                editDetailsBtn.parentElement.style.display = 'none';
            }
        } else {
            // --- PRE-PAYMENT VIEW (UNLOCKED) ---
            // Display all steps and allow editing completed ones.
            if (editDetailsBtn) {
                editDetailsBtn.parentElement.style.display = 'list-item';
            }

            const contactDone = studentData.addressLine1 && studentData.addressLine1.trim() !== '';
            const academicDone = studentData.board10 && studentData.board10.trim() !== '';
            const courseSelected = sessionStorage.getItem('selectedCourse') !== null;

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

            // Step 3: Course Selection
            stepsContainer.innerHTML += createStepHTML(
                '3. Course Selection', 'Select your desired course.',
                'course-selection.html', courseSelected, academicDone
            );

            proceedSection.appendChild(stepsContainer);

            // Add the "Proceed to Preview" button only when all steps are complete
            if (contactDone && academicDone && courseSelected) {
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
                const [year, month, day] = data.dob.split('-');
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
                profilePictureImg.src = 'default-avatar.png'; // A default image
            }
            profilePictureImg.onerror = () => {
                profilePictureImg.src = 'default-avatar.png'; // Fallback if the image fails to load
            };

            // Also set initial values for edit fields
            fields.name.edit.value = data.name;
            fields.email.edit.value = data.email || '';
            fields.rollNumber.edit.value = data.rollNumber;
            fields.enrollmentNumber.edit.value = data.enrollmentNumber || '';
            if (data.dob) {
                const [year, month, day] = data.dob.split('-');
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

        viewProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setProfileView('compact');
            userMenuDropdown.classList.remove('active');
        });

        editDetailsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setProfileView('full'); // This shows all fields and enables edit mode
            userMenuDropdown.classList.remove('active');
        });
        cancelBtn.addEventListener('click', () => setProfileView('compact'));

        saveBtn.addEventListener('click', () => {
            // Ask for confirmation before saving
            if (window.confirm('Are you sure you want to save these changes?')) {
                // DOB validation
                const dobValue = fields.dob.edit.value;
                let formattedDobForSave = '';
                if (!dobValue) {
                    alert('Date of Birth cannot be empty.');
                    fields.dob.edit.focus();
                    return;
                }
                if (!/^\d{2}-\d{2}-\d{4}$/.test(dobValue)) {
                    alert('Please enter a valid date in DD-MM-YYYY format.');
                    fields.dob.edit.focus();
                    return;
                }
                const parts = dobValue.split('-');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);
                const date = new Date(year, month - 1, day);
                if (!(date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day)) {
                    alert('The date you entered is not a valid calendar date.');
                    fields.dob.edit.focus();
                    return;
                }
                formattedDobForSave = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                // Mobile number validation
                if (!fields.mobileNumber.edit.value.match(/^[0-9]{10}$/)) {
                    alert('Please enter a valid 10-digit mobile number.');
                    fields.mobileNumber.edit.focus();
                    return; // Stop the save process
                }

                // Use FormData to send both text and file data
                const formData = new FormData();

                formData.append('name', fields.name.edit.value);
                formData.append('email', fields.email.edit.value);
                formData.append('rollNumber', fields.rollNumber.edit.value);
                formData.append('dob', formattedDobForSave);
                formData.append('gender', fields.gender.edit.value);
                formData.append('mobileNumber', fields.mobileNumber.edit.value);

                // Append the new profile picture file if one was selected
                if (editProfilePictureInput.files[0]) {
                    formData.append('profilePicture', editProfilePictureInput.files[0]);
                }

                fetch('/update', {
                    method: 'POST',
                    body: formData, // The browser will set the correct 'Content-Type' for FormData
                })
                .then(response => {
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        return response.text().then(text => {
                            throw new Error(`Expected JSON response, but received: ${text.substring(0, 100)}... (Status: ${response.status})`);
                        });
                    }
                    if (!response.ok) { return response.json().then(err => { throw new Error(err.message || 'Update failed'); }); }
                    return response.json();
                })
                .then(data => {
                    alert('Details updated successfully!');
                    // The server now returns the fully updated student object, including the new image path
                    const newStudentData = data.studentData;
                    sessionStorage.setItem('currentStudent', JSON.stringify(newStudentData));
                    studentData = newStudentData;
                    populateFields(newStudentData);
                    setProfileView('compact');
                })
                .catch(error => {
                    console.error('Error during update fetch:', error);
                    if (error.message.includes("Failed to fetch")) {
                        alert("Update failed: Cannot connect to the server.\n\nPlease make sure the 'node server.js' command is running in your terminal and you are accessing the site via http://localhost:3000.");
                    } else {
                        alert(`Failed to update details: ${error.message}`);
                    }
                });
            }
        });

        logoutBtnMenu.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            // Use replace to prevent going back to the home page via browser back button
            window.location.replace('login.html');
        });

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

        // --- Menu Logic ---
        userMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            userMenuDropdown.classList.toggle('active');
        });

        // Close dropdown if clicking outside of it
        document.addEventListener('click', (event) => {
            if (!userMenuBtn.contains(event.target) && !userMenuDropdown.contains(event.target)) {
                userMenuDropdown.classList.remove('active');
            }
        });

        // --- Initial Population ---
        resetInactivityTimer(); // Start the timer on page load
        populateFields(studentData);
        setProfileView('compact'); // Set the initial view to compact profile
    };

    // Run status check first, then initialize the page.
    checkServerStatus().then(initializePage);
});