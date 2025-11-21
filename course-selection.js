// --- Course Data with Fees ---
// In a real application, this would likely come from a server API call.
const CLASSES = {
    "Nursery": { name: "Nursery", fee: 500000 },
    "LKG": { name: "LKG", fee: 550000 },
    "UKG": { name: "UKG", fee: 600000 },
    "Class 1": { name: "Class 1", fee: 700000 },
    "Class 2": { name: "Class 2", fee: 750000 },
    "Class 3": { name: "Class 3", fee: 800000 },
    "Class 4": { name: "Class 4", fee: 850000 },
    "Class 5": { name: "Class 5", fee: 900000 },
    "Class 6": { name: "Class 6", fee: 1000000 },
    "Class 7": { name: "Class 7", fee: 1050000 },
    "Class 8": { name: "Class 8", fee: 1100000 },
    "Class 9": { name: "Class 9", fee: 1250000 },
    "Class 10": { name: "Class 10", fee: 1300000 },
    "Class 11": { name: "Class 11", fee: 1500000 },
    "Class 12": { name: "Class 12", fee: 1550000 }
};

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
    const initializePage = () => {
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

        // --- Dynamically populate the class list with radio buttons ---
        Object.keys(CLASSES).forEach(key => {
            const course = CLASSES[key];
            const radioId = `class-${key.replace(/\s+/g, '-')}`;

            const checkWrapper = document.createElement('label');
            checkWrapper.className = 'radio-option';
            checkWrapper.htmlFor = radioId;

            const checkInput = document.createElement('input');
            checkInput.type = 'radio';
            checkInput.name = 'selectedClass';
            checkInput.value = key;
            checkInput.id = radioId;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'course-name';
            nameSpan.textContent = course.name;

            const feeSpan = document.createElement('span');
            feeSpan.className = 'course-fee';
            feeSpan.textContent = `₹${(course.fee / 100).toLocaleString('en-IN')}`;

            checkWrapper.appendChild(checkInput);
            checkWrapper.appendChild(nameSpan);
            checkWrapper.appendChild(feeSpan);

            classSelectionContainer.appendChild(checkWrapper);
        });

        // --- Handle selection limit and highlighting ---
        classSelectionContainer.addEventListener('change', (event) => {
            if (event.target.type === 'radio') {
                // Remove 'selected' from all other options
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
            const selectedKey = selectedRadio.value;
            const selectedClassData = CLASSES[selectedKey];

            const selectionData = {
                level: "School Admission",
                branch: selectedClassData.name, // e.g., "Class 5"
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