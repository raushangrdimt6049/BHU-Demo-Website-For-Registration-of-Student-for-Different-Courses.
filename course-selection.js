// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// security script in the <head> always runs.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // This function checks if the server has restarted since the user logged in.
    // If so, it logs the user out for security.
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

    // This function contains the main logic for setting up the page.
    const initializePage = async () => {
        // Also check if previous steps have been filled first
        const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
        if (!studentData || !studentData.profilePicture || !studentData.signature || !studentData.migrationCertificate || !studentData.tcCertificate) {
            alert('Please complete the Document Upload step first.');
            sessionStorage.setItem('navigationAllowed', 'true');
            window.location.href = 'home.html';
            return; // Stop execution if prerequisites are not met
        }

        const courseForm = document.getElementById('courseSelectionForm');
        const classSelectionContainer = document.getElementById('classSelectionContainer');
        const submitBtn = document.getElementById('submitBtn');
        const buttonText = submitBtn.querySelector('.button-text');
        const spinner = submitBtn.querySelector('.spinner');

        if (!courseForm || !classSelectionContainer) {
            console.error('The required form or container element was not found.');
            return;
        }

        // --- Fetch and populate the class list dynamically ---
        try {
            classSelectionContainer.innerHTML = '<p>Loading available classes...</p>';
            const response = await fetch('/api/courses');
            if (!response.ok) {
                throw new Error('Failed to load courses from the server.');
            }
            const courses = await response.json();
            classSelectionContainer.innerHTML = ''; // Clear loading message

            if (courses.length === 0) {
                classSelectionContainer.innerHTML = '<p>No classes are available for registration at this time. Please check back later.</p>';
                return;
            }

            courses.forEach(course => {
                const radioId = `class-${course.id}`;

                const checkWrapper = document.createElement('label');
                checkWrapper.className = 'radio-option';
                checkWrapper.htmlFor = radioId;

                const checkInput = document.createElement('input');
                checkInput.type = 'radio';
                checkInput.name = 'selectedClass';
                checkInput.value = JSON.stringify({ name: course.name, fee: course.fee }); // Store full object
                checkInput.id = radioId;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'course-name';
                nameSpan.textContent = course.name;

                const feeSpan = document.createElement('span');
                feeSpan.className = 'course-fee';
                // The fee from the DB is a whole number, so we divide by 100 for display
                feeSpan.textContent = `₹${(course.fee / 100).toLocaleString('en-IN')}`;

                checkWrapper.appendChild(checkInput);
                checkWrapper.appendChild(nameSpan);
                checkWrapper.appendChild(feeSpan);

                classSelectionContainer.appendChild(checkWrapper);
            });
        } catch (error) {
            console.error('Error loading courses:', error);
            classSelectionContainer.innerHTML = `<p style="color: red;">Could not load courses. Please try refreshing the page.</p>`;
        }

        // --- Handle selection limit and highlighting ---
        classSelectionContainer.addEventListener('change', (event) => {
            if (event.target.type === 'radio') {
                classSelectionContainer.querySelectorAll('.radio-option').forEach(label => {
                    label.classList.remove('selected');
                });
                // Toggle 'selected' class for highlighting
                const parentLabel = event.target.closest('.radio-option');
                parentLabel.classList.add('selected');
            }
        });

        courseForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const selectedRadio = courseForm.querySelector('input[name="selectedClass"]:checked');
            if (!selectedRadio) {
                alert('Please select a class for admission.');
                return;
            }

            // --- UI change for loading state ---
            submitBtn.disabled = true;
            spinner.style.display = 'inline-block';
            buttonText.textContent = 'Saving...';            
            // The value is now a JSON string of the course object
            const selectedClassData = JSON.parse(selectedRadio.value);

            const selectionData = {
                level: "School Admission",
                branch: selectedClassData.name,
                amount: selectedClassData.fee
            };

            // --- Save selection to the backend to persist it across sessions ---
            try {
                const response = await fetch('/add-course-selection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rollNumber: studentData.rollNumber,
                        selectionData: selectionData
                    }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to save course selection.');

                // Update the main student object in session storage with the new data from the server
                sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
                alert('Course selection saved. You will now be returned to the home page to proceed.');
                sessionStorage.setItem('navigationAllowed', 'true'); // Allow navigation to the home page
                window.location.href = 'home.html';
            } catch (error) {
                console.error('Error saving course selection:', error);
                alert(`Error: ${error.message}`);
            } finally {
                // --- Reset UI from loading state ---
                submitBtn.disabled = false;
                spinner.style.display = 'none';
                buttonText.textContent = 'Save & Continue';
            }
        });
    };

    // --- Navigation Helper ---
    // Sets a flag before any internal link is followed to allow the next page to load.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && link.hostname === window.location.hostname) {
            // Exclude the logout button from this logic.
            if (link.id !== 'logoutBtnMenu') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });

    // Run the server status check first, then initialize the page logic.
    checkServerStatus().then(initializePage);
});