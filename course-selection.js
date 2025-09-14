// This script is included in course-selection.html

// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache) after a logout, ensuring the user is redirected.
window.addEventListener('pageshow', (event) => {
    if (!sessionStorage.getItem('currentStudent')) {
        window.location.replace('login.html');
    }
});

// --- Course Data with Fees ---
// In a real application, this would likely come from a server API call.
const COURSES = {
    "Physics": { name: "Physics", fee: 150000 }, // ₹1,500.00
    "Chemistry": { name: "Chemistry", fee: 165000 }, // ₹1,650.00
    "Mathematics": { name: "Mathematics", fee: 145000 }, // ₹1,450.00
    "Botany": { name: "Botany", fee: 155000 }, // ₹1,550.00
    "Zoology": { name: "Zoology", fee: 155000 }, // ₹1,550.00
    "Computer Science": { name: "Computer Science", fee: 250000 }, // ₹2,500.00
    "Commerce": { name: "Commerce", fee: 120000 }, // ₹1,200.00
    "History": { name: "History", fee: 110000 }, // ₹1,100.00
    "Political Science": { name: "Political Science", fee: 110000 }, // ₹1,100.00
    "Economics": { name: "Economics", fee: 135000 }, // ₹1,350.00
    "English": { name: "English", fee: 115000 }, // ₹1,150.00
    "Hindi": { name: "Hindi", fee: 105000 }  // ₹1,050.00
};

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
                window.location.replace('login.html');
            }
        } catch (error) {
            console.warn('Could not check server status:', error);
        }
    };

    // This function contains the main logic for setting up the page.
    const initializePage = () => {
        // Also check if previous steps have been filled first
        const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
        if (!studentData || !studentData.board10) {
            alert('Please complete your Academic Details first.');
            window.location.href = 'home.html';
            return; // Stop execution if prerequisites are not met
        }

        const courseForm = document.getElementById('courseSelectionForm');
        const honsSubjectContainer = document.getElementById('honsSubjectContainer');

        if (!courseForm || !honsSubjectContainer) {
            console.error('The required form or container element was not found.');
            return;
        }

        // --- Dynamically populate the course list with checkboxes ---
        Object.keys(COURSES).forEach(key => {
            const course = COURSES[key];
            const checkId = `course-${key.replace(/\s+/g, '-')}`;

            const checkWrapper = document.createElement('label');
            checkWrapper.className = 'radio-option';
            checkWrapper.htmlFor = checkId;

            const checkInput = document.createElement('input');
            checkInput.type = 'checkbox';
            checkInput.name = 'subjects';
            checkInput.value = key;
            checkInput.id = checkId;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'course-name';
            nameSpan.textContent = course.name;

            const feeSpan = document.createElement('span');
            feeSpan.className = 'course-fee';
            feeSpan.textContent = `₹${(course.fee / 100).toLocaleString('en-IN')}`;

            checkWrapper.appendChild(checkInput);
            checkWrapper.appendChild(nameSpan);
            checkWrapper.appendChild(feeSpan);

            honsSubjectContainer.appendChild(checkWrapper);
        });

        // --- Handle selection limit and highlighting ---
        honsSubjectContainer.addEventListener('change', (event) => {
            if (event.target.type === 'checkbox') {
                const selectedCheckboxes = honsSubjectContainer.querySelectorAll('input[type="checkbox"]:checked');

                // Enforce selection limit
                if (selectedCheckboxes.length > 3) {
                    alert('You can select a maximum of three subjects.');
                    event.target.checked = false; // Revert the last selection
                    return;
                }

                // Toggle 'selected' class for highlighting
                const parentLabel = event.target.closest('.radio-option');
                if (event.target.checked) {
                    parentLabel.classList.add('selected');
                } else {
                    parentLabel.classList.remove('selected');
                }
            }
        });

        courseForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const selectedCheckboxes = courseForm.querySelectorAll('input[name="subjects"]:checked');
            if (selectedCheckboxes.length === 0) {
                alert('Please select at least one subject.');
                return;
            }

            const selectedSubjects = [];
            let totalFee = 0;

            selectedCheckboxes.forEach(checkbox => {
                const key = checkbox.value;
                const courseData = COURSES[key];
                selectedSubjects.push(courseData.name);
                totalFee += courseData.fee;
            });

            const selectionData = {
                level: "Undergraduate",
                branch: selectedSubjects.join(', '), // For display on preview page
                honsSubject: selectedSubjects, // Array of subjects for potential future use
                amount: totalFee
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