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
        const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
        if (!studentData || !studentData.addressLine1) {
            alert('Please complete your Address & Parents Detail first.');
            window.location.href = 'home.html';
            return;
        }

        const academicForm = document.getElementById('academicDetailsForm');
        if (!academicForm) {
            console.error('The academic details form with ID "academicDetailsForm" was not found.');
            return;
        }

    // --- Get references to board elements ---
    const board10Select = document.getElementById('board10');
    const otherBoard10Container = document.getElementById('otherBoard10Container');
    const otherBoard10Input = document.getElementById('otherBoard10');

    const board12Select = document.getElementById('board12');
    const otherBoard12Container = document.getElementById('otherBoard12Container');
    const otherBoard12Input = document.getElementById('otherBoard12');

    // --- Get references to marks and percentage elements ---
    const marks10Input = document.getElementById('marks10');
    const totalMarks10Input = document.getElementById('totalMarks10');
    const displayPercentage10 = document.getElementById('displayPercentage10');
    const hiddenPercentage10 = document.getElementById('percentage10');

    const marks12Input = document.getElementById('marks12');
    const totalMarks12Input = document.getElementById('totalMarks12');
    const displayPercentage12 = document.getElementById('displayPercentage12');
    const hiddenPercentage12 = document.getElementById('percentage12');

    // --- Helper function to toggle 'Other' input visibility ---
    const handleOtherBoard = (selectElement, otherContainer, otherInput) => {
        if (selectElement.value === 'Other') {
            otherContainer.style.display = 'block';
            otherInput.required = true;
        } else {
            otherContainer.style.display = 'none';
            otherInput.required = false;
            otherInput.value = '';
        }
    };

    // --- Helper function to allow only digits ---
    const allowOnlyDigits = (input) => {
        // This regex removes any character that is not a digit.
        input.value = input.value.replace(/\D/g, '');
    };

    // --- Helper function to prevent typing more than 3 digits in marks fields ---
    const limitInputLength = (input) => {
        if (input.value.length > 3) {
            input.value = input.value.slice(0, 3);
        }
    };

    // --- Helper function to calculate and display percentage ---
    const updatePercentage = (marksInput, totalMarksInput, displayElement, hiddenInput) => {
        const marks = parseFloat(marksInput.value);
        const totalMarks = parseFloat(totalMarksInput.value);

        // Reset any previous error state
        displayElement.style.color = '';
        marksInput.setCustomValidity(''); // Clear previous custom error
        totalMarksInput.setCustomValidity(''); // Clear previous custom error for total marks

        if (isNaN(marks) || isNaN(totalMarks) || totalMarks <= 0 || marks < 0) {
            displayElement.textContent = '--';
            hiddenInput.value = '';
            return; // Not enough valid info to calculate
        }

        if (marks > 600) {
            displayElement.textContent = 'Marks cannot exceed 600.';
            displayElement.style.color = 'red';
            hiddenInput.value = '';
            marksInput.setCustomValidity('Marks cannot exceed 600.');
            return;
        }

        if (totalMarks > 600) {
            displayElement.textContent = 'Total marks cannot exceed 600.';
            displayElement.style.color = 'red';
            hiddenInput.value = '';
            totalMarksInput.setCustomValidity('Total marks cannot exceed 600.');
            return;
        }

        if (marks > totalMarks) {
            displayElement.textContent = 'Marks obtained cannot exceed total marks.';
            displayElement.style.color = 'red';
            hiddenInput.value = '';
            marksInput.setCustomValidity('Marks obtained cannot exceed total marks.');
            return;
        }

        const percentage = (marks / totalMarks) * 100;
        const formattedPercentage = percentage.toFixed(2);
        displayElement.textContent = `${formattedPercentage} %`;
        hiddenInput.value = formattedPercentage;
    };

    // --- Add event listeners to board dropdowns ---
    board10Select.addEventListener('change', () => handleOtherBoard(board10Select, otherBoard10Container, otherBoard10Input));
    board12Select.addEventListener('change', () => handleOtherBoard(board12Select, otherBoard12Container, otherBoard12Input));

    // --- Add event listeners for automatic percentage calculation ---
    marks10Input.addEventListener('input', () => {
        allowOnlyDigits(marks10Input);
        limitInputLength(marks10Input);
        updatePercentage(marks10Input, totalMarks10Input, displayPercentage10, hiddenPercentage10);
    });
    totalMarks10Input.addEventListener('input', () => {
        allowOnlyDigits(totalMarks10Input);
        limitInputLength(totalMarks10Input);
        updatePercentage(marks10Input, totalMarks10Input, displayPercentage10, hiddenPercentage10);
    });
    marks12Input.addEventListener('input', () => {
        allowOnlyDigits(marks12Input);
        limitInputLength(marks12Input);
        updatePercentage(marks12Input, totalMarks12Input, displayPercentage12, hiddenPercentage12);
    });
    totalMarks12Input.addEventListener('input', () => {
        allowOnlyDigits(totalMarks12Input);
        limitInputLength(totalMarks12Input);
        updatePercentage(marks12Input, totalMarks12Input, displayPercentage12, hiddenPercentage12);
    });

    // --- Pre-fill form with existing data ---
    if (studentData) {
        // Explicitly populate academic fields to ensure reliability
        const fieldsToPopulate = ['marks10', 'totalMarks10', 'year10', 'marks12', 'totalMarks12', 'year12'];
        fieldsToPopulate.forEach(fieldName => {
            const input = document.getElementById(fieldName);
            // Check specifically for null/undefined, so that a value of 0 is still populated.
            if (input && studentData[fieldName] !== null && studentData[fieldName] !== undefined) {
                input.value = studentData[fieldName];
            }
        });

        // Special handling for board10
        if (studentData.board10) {
            const optionExists = Array.from(board10Select.options).some(opt => opt.value === studentData.board10);
            if (optionExists) {
                board10Select.value = studentData.board10;
            } else {
                board10Select.value = 'Other';
                otherBoard10Input.value = studentData.board10;
            }
            // Trigger the change handler to show/hide the 'other' field if necessary
            handleOtherBoard(board10Select, otherBoard10Container, otherBoard10Input);
        }

        // Special handling for board12
        if (studentData.board12) {
            const optionExists = Array.from(board12Select.options).some(opt => opt.value === studentData.board12);
            if (optionExists) {
                board12Select.value = studentData.board12;
            } else {
                board12Select.value = 'Other';
                otherBoard12Input.value = studentData.board12;
            }
            // Trigger the change handler to show/hide the 'other' field if necessary
            handleOtherBoard(board12Select, otherBoard12Container, otherBoard12Input);
        }

        // Trigger initial percentage calculation if data is pre-filled
        updatePercentage(marks10Input, totalMarks10Input, displayPercentage10, hiddenPercentage10);
        updatePercentage(marks12Input, totalMarks12Input, displayPercentage12, hiddenPercentage12);
    }

    academicForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Re-run validation to set custom validity messages
        updatePercentage(marks10Input, totalMarks10Input, displayPercentage10, hiddenPercentage10);
        updatePercentage(marks12Input, totalMarks12Input, displayPercentage12, hiddenPercentage12);

        // Check if the form is valid (including our custom validity)
        if (!academicForm.checkValidity()) {
            // Create a temporary submit button to trigger the browser's validation UI
            const tempSubmit = document.createElement('button');
            tempSubmit.type = 'submit';
            tempSubmit.style.display = 'none';
            academicForm.appendChild(tempSubmit);
            tempSubmit.click();
            academicForm.removeChild(tempSubmit);
            return; // Stop the async submission
        }

        const formData = new FormData(academicForm);
        const academicData = Object.fromEntries(formData.entries());

        // Consolidate 'Other' board values before sending to server
        if (academicData.board10 === 'Other') {
            academicData.board10 = academicData.otherBoard10;
        }
        delete academicData.otherBoard10;

        if (academicData.board12 === 'Other') {
            academicData.board12 = academicData.otherBoard12;
        }
        delete academicData.otherBoard12;

        academicData.rollNumber = studentData.rollNumber; // Ensure roll number is included

        try {
            const response = await fetch('/add-academic-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(academicData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save academic details.');
            }

            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
            alert('Academic Details saved successfully. Returning to home page.');
            sessionStorage.setItem('navigationAllowed', 'true'); // Allow navigation to the home page
            window.location.href = 'home.html'; // Redirect back to the home page
        } catch (error) {
            console.error('Error saving academic details:', error);
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