// This script should be included in academic-details.html

// --- Immediate Security Check ---
if (!sessionStorage.getItem('currentStudent')) {
    window.location.replace('login.html');
}

// Also check if contact details have been filled first
const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
if (!studentData || !studentData.addressLine1) {
    alert('Please complete your Address & Parents Detail first.');
    window.location.href = 'home.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const academicForm = document.getElementById('academicDetailsForm');

    if (!academicForm) {
        console.error('The academic details form with ID "academicDetailsForm" was not found.');
        return;
    }

    // --- Pre-fill form with existing data ---
    // This is the key part that ensures data is shown on "Edit"
    if (studentData) {
        Object.keys(studentData).forEach(key => {
            const input = academicForm.querySelector(`[name="${key}"]`);
            if (input && studentData[key]) { // Check if studentData[key] is not null/undefined
                input.value = studentData[key];
            }
        });
    }

    academicForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(academicForm);
        const academicData = Object.fromEntries(formData.entries());
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
            window.location.href = 'home.html'; // Redirect back to the home page
        } catch (error) {
            console.error('Error saving academic details:', error);
            alert(`Error: ${error.message}`);
        }
    });
});