
// --- Immediate Security Check ---
// An inline script in the HTML handles the initial check.
// This is a fallback and handles bfcache navigations.
window.addEventListener('pageshow', (event) => {
    if (!sessionStorage.getItem('currentStudent')) {
        window.location.replace('login.html');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));

    if (!studentData) {
        alert('Your session is invalid. Please log in again.');
        window.location.replace('login.html');
        return;
    }

    // --- DOM Element References ---
    const contactForm = document.getElementById('contactDetailsForm');
    const parentMobileInput = document.getElementById('parentMobile');
    const parentMobileError = document.getElementById('parentMobile-error');
    const submitButton = contactForm.querySelector('button[type="submit"]');

    // --- Pre-fill form with existing data ---
    const fields = ['addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'fatherName', 'fatherOccupation', 'motherName', 'motherOccupation', 'parentMobile'];
    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input && studentData[field]) {
            input.value = studentData[field];
        }
    });

    // --- Validation Function ---
    const validateParentMobile = () => {
        const studentMobile = studentData.mobileNumber;
        const parentMobile = parentMobileInput.value;

        if (parentMobile && studentMobile === parentMobile) {
            parentMobileError.textContent = "Parent's mobile number cannot be the same as the student's mobile number.";
            parentMobileError.style.display = 'block';
            return false;
        } else {
            parentMobileError.style.display = 'none';
            return true;
        }
    };

    // --- Event Listeners ---
    // Validate immediately on input
    parentMobileInput.addEventListener('input', validateParentMobile);

    // Form submission handler
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Final validation check on submit
        if (!validateParentMobile()) {
            parentMobileInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const formData = new FormData(contactForm);
        const contactDetails = Object.fromEntries(formData.entries());

        // Add the student's roll number to the data being sent
        contactDetails.rollNumber = studentData.rollNumber;

        try {
            const response = await fetch('/add-contact-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactDetails),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save details.');
            }

            // --- On success, update sessionStorage and redirect ---
            alert('Contact details saved successfully!');
            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
            sessionStorage.setItem('navigationAllowed', 'true'); // Allow navigation to the home page
            window.location.href = 'home.html';

        } catch (error) {
            console.error('Error saving contact details:', error);
            alert(`Failed to save details: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save';
        }
    });

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
});