// This script is included in contact-details.html

// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache) after a logout, ensuring the user is redirected.
window.addEventListener('pageshow', (event) => {
    if (!sessionStorage.getItem('currentStudent')) {
        window.location.replace('login.html');
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
                window.location.replace('login.html');
            }
        } catch (error) {
            console.warn('Could not check server status:', error);
        }
    };

    // This function contains the main logic for setting up the page.
    const initializePage = () => {
        const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
        if (!studentData) {
            // This should ideally not be reached due to the pageshow listener, but it's a safeguard.
            window.location.replace('login.html');
            return;
        }

        const contactForm = document.getElementById('contactDetailsForm');

        if (!contactForm) {
            console.error('The contact details form with ID "contactDetailsForm" was not found.');
            return;
        }

        // --- Pre-fill form with existing data ---
        // This is the key part that ensures data is shown on "Edit"
        Object.keys(studentData).forEach(key => {
            const input = contactForm.querySelector(`[name="${key}"]`);
            if (input && studentData[key]) { // Check if studentData[key] is not null/undefined
                input.value = studentData[key];
            }
        });

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
    };

    // Run the server status check first, then initialize the page logic.
    checkServerStatus().then(initializePage);
});