// This script should be included in contact-details.html

// --- Immediate Security Check ---
if (!sessionStorage.getItem('currentStudent')) {
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
    const contactForm = document.getElementById('contactDetailsForm');

    if (!contactForm) {
        console.error('The contact details form with ID "contactDetailsForm" was not found.');
        return;
    }

    // --- Pre-fill form with existing data ---
    // This is the key part that ensures data is shown on "Edit"
    if (studentData) {
        // This assumes your input fields have `name` attributes matching the studentData keys
        Object.keys(studentData).forEach(key => {
            const input = contactForm.querySelector(`[name="${key}"]`);
            if (input && studentData[key]) { // Check if studentData[key] is not null/undefined
                input.value = studentData[key];
            }
        });
    }

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const contactData = Object.fromEntries(formData.entries());
        contactData.rollNumber = studentData.rollNumber; // Ensure roll number is included

        try {
            const response = await fetch('/add-contact-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save contact details.');
            }

            // Update session storage with the latest data from the server
            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
            alert('Address & Parents Detail saved successfully. Returning to home page.');
            window.location.href = 'home.html'; // Redirect back to the home page
        } catch (error) {
            console.error('Error saving contact details:', error);
            alert(`Error: ${error.message}`);
        }
    });
});