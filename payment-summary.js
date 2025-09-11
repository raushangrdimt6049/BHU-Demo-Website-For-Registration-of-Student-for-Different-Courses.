// --- Immediate Security Check ---
// An inline script in payment-summary.html handles the initial check.
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

    // The selectedCourse is now stored as a stringified JSON inside the studentData after payment.
    if (!studentData.selectedCourse || !studentData.selectedCourse.trim().startsWith('{')) {
        alert('Payment details not found in your profile. Please check your payment history or contact support.');
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

    try {
        const selectedCourse = JSON.parse(studentData.selectedCourse);

        // --- Populate Profile Picture ---
        const profilePictureImg = document.getElementById('profilePicture');
        if (profilePictureImg) {
            if (studentData.profilePicture && studentData.profilePicture.trim() !== '') {
                profilePictureImg.src = studentData.profilePicture;
            } else {
                profilePictureImg.src = 'default-avatar.png'; // A default image
            }
            profilePictureImg.onerror = () => {
                profilePictureImg.src = 'default-avatar.png'; // Fallback if the image fails to load
            };
        }

        // --- Populate Personal Details ---
        populateField('summaryName', studentData.name);
        populateField('summaryEmail', studentData.email);
        populateField('summaryRollNumber', studentData.rollNumber);
        populateField('summaryEnrollmentNumber', studentData.enrollmentNumber);
        populateField('summaryMobileNumber', studentData.mobileNumber);
        if (studentData.dob) {
            const [year, month, day] = studentData.dob.split('-');
            populateField('summaryDob', `${day}-${month}-${year}`);
        } else {
            populateField('summaryDob', 'N/A');
        }
        populateField('summaryAge', studentData.age);
        populateField('summaryGender', studentData.gender);

        // --- Populate Address & Parents Detail ---
        const fullAddress = [studentData.addressLine1, studentData.addressLine2].filter(Boolean).join(', ');
        populateField('summaryAddress', fullAddress);
        populateField('summaryCity', studentData.city);
        populateField('summaryState', studentData.state);
        populateField('summaryPincode', studentData.pincode);
        populateField('summaryFatherName', studentData.fatherName);
        populateField('summaryFatherOccupation', studentData.fatherOccupation);
        populateField('summaryMotherName', studentData.motherName);
        populateField('summaryMotherOccupation', studentData.motherOccupation);
        populateField('summaryParentMobile', studentData.parentMobile);

        // --- Populate Academic Details ---
        populateField('summaryBoard10', studentData.board10);
        populateField('summaryPercentage10', studentData.percentage10 ? `${studentData.percentage10}%` : 'N/A');
        populateField('summaryYear10', studentData.year10);
        populateField('summaryBoard12', studentData.board12);
        populateField('summaryPercentage12', studentData.percentage12 ? `${studentData.percentage12}%` : 'N/A');
        populateField('summaryYear12', studentData.year12);

        // --- Populate Payment & Course Details ---
        populateField('summaryCourseName', `${selectedCourse.level} - ${selectedCourse.branch}`);
        populateField('summaryPaymentAmount', `₹ ${(selectedCourse.amount / 100).toLocaleString('en-IN')}`);
        populateField('summaryTransactionDate', new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }));

        // --- Print Button Logic ---
        const printBtn = document.getElementById('printSummaryBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => { window.print(); });
        }

    } catch (error) {
        console.error("Error parsing or displaying summary data:", error);
        alert("Could not display admission summary due to a data error.");
    }
});