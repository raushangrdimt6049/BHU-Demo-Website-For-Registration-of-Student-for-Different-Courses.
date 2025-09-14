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
        const [year, month, day] = studentData.dob.split('-');
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

    // --- Populate Academic Details ---
    populateField('previewBoard10', studentData.board10);
    populateField('previewPercentage10', studentData.percentage10 ? `${studentData.percentage10}%` : 'N/A');
    populateField('previewYear10', studentData.year10);
    populateField('previewBoard12', studentData.board12);
    populateField('previewPercentage12', studentData.percentage12 ? `${studentData.percentage12}%` : 'N/A');
    populateField('previewYear12', studentData.year12);

    // --- Populate Course Selection ---
    populateField('previewHonsSubject', courseData.branch);
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