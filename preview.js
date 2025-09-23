// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// security script in the <head> always runs.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
    const courseData = JSON.parse(sessionStorage.getItem('selectedCourse'));

    if (!studentData || !courseData) {
        // This should have been caught by the initial checks, but as a final safeguard.
        alert('Required application data is missing. Returning to home page.');
        window.location.href = 'home.html';
        return;
    }

    // Helper function to populate a field or show 'N/A'
    const populateField = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || 'N/A';
        }
    };

    // Helper function to calculate age
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

    // --- Populate Personal Details ---
    populateField('previewName', studentData.name);
    populateField('previewEmail', studentData.email);
    populateField('previewRollNumber', studentData.rollNumber);
    populateField('previewEnrollmentNumber', studentData.enrollmentNumber);
    populateField('previewMobileNumber', studentData.mobileNumber);
    if (studentData.dob) {
        // Use UTC methods to correctly parse date from ISO string without timezone shifts
        const dobDate = new Date(studentData.dob);
        const day = String(dobDate.getUTCDate()).padStart(2, '0');
        const month = String(dobDate.getUTCMonth() + 1).padStart(2, '0');
        const year = dobDate.getUTCFullYear();
        populateField('previewDob', `${day}-${month}-${year}`);
    } else {
        populateField('previewDob', 'N/A');
    }
    populateField('previewAge', calculateAge(studentData.dob));
    populateField('previewGender', studentData.gender);

    // --- Populate Address & Parents Detail ---
    const fullAddress = [studentData.addressLine1, studentData.addressLine2].filter(Boolean).join(', ');
    populateField('previewAddress', fullAddress);
    populateField('previewCity', studentData.city);
    populateField('previewState', studentData.state);
    populateField('previewPincode', studentData.pincode);
    populateField('previewFatherName', studentData.fatherName);
    populateField('previewFatherOccupation', studentData.fatherOccupation);
    populateField('previewMotherName', studentData.motherName);
    populateField('previewMotherOccupation', studentData.motherOccupation);
    populateField('previewParentMobile', studentData.parentMobile);

    // --- Populate Uploaded Documents ---
    const populateDocumentLink = (id, path) => {
        const link = document.getElementById(id);
        if (link) {
            if (path) {
                link.href = path;
            } else {
                link.textContent = 'Not Uploaded';
                link.classList.add('disabled-link');
                link.removeAttribute('href');
                link.removeAttribute('target');
            }
        }
    };

    populateDocumentLink('previewProfilePicture', studentData.profilePicture);
    populateDocumentLink('previewSignature', studentData.signature);
    populateDocumentLink('previewMigrationCertificate', studentData.migrationCertificate);
    populateDocumentLink('previewTcCertificate', studentData.tcCertificate);

    // --- Populate Course Selection ---
    populateField('previewClass', courseData.branch);
    populateField('previewFee', `₹${(courseData.amount / 100).toLocaleString('en-IN')}`);

    // --- Terms and Conditions Logic ---
    const termsCheckbox = document.getElementById('termsCheckbox');
    const proceedToPaymentBtn = document.getElementById('proceedToPaymentBtn');

    // Initially disable the button
    proceedToPaymentBtn.classList.add('disabled');

    termsCheckbox.addEventListener('change', () => {
        if (termsCheckbox.checked) {
            proceedToPaymentBtn.classList.remove('disabled');
        } else {
            proceedToPaymentBtn.classList.add('disabled');
        }
    });

    // Also, to prevent navigation on a disabled button
    proceedToPaymentBtn.addEventListener('click', (event) => {
        if (proceedToPaymentBtn.classList.contains('disabled')) {
            event.preventDefault();
            alert('Please agree to the terms and conditions to proceed.');
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