document.addEventListener('DOMContentLoaded', async () => {
    const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));

    if (!studentData) {
        alert('Your session is invalid. Please log in again.');
        window.location.replace('index.html');
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
            // Use UTC methods to correctly parse date from ISO string without timezone shifts
            const dobDate = new Date(studentData.dob);
            const day = String(dobDate.getUTCDate()).padStart(2, '0');
            const month = String(dobDate.getUTCMonth() + 1).padStart(2, '0');
            const year = dobDate.getUTCFullYear();
            populateField('summaryDob', `${day}-${month}-${year}`);
        } else {
            populateField('summaryDob', 'N/A');
        }
        populateField('summaryAge', calculateAge(studentData.dob));
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

        // --- Populate Payment & Course Details ---
        populateField('summaryCourseName', `${selectedCourse.level} - ${selectedCourse.branch}`);
        populateField('summaryPaymentAmount', `₹ ${(selectedCourse.amount / 100).toLocaleString('en-IN')}`);
        populateField('summaryTransactionDate', new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }));
        
        // --- Get and Populate Order ID and Payment ID ---
        let orderId = null;
        let paymentId = null;
        const paymentDetailsFromSession = JSON.parse(sessionStorage.getItem('lastPaymentDetails'));
        
        if (paymentDetailsFromSession && paymentDetailsFromSession.orderId) {
            // Strategy 1: Use the fresh data from session if available (covers immediate post-payment view).
            orderId = paymentDetailsFromSession.orderId;
            paymentId = paymentDetailsFromSession.paymentId; // This will be undefined for now, but good for future.
        }

        // Strategy 2: If IDs are missing, fetch from payment history as a fallback.
        if (!orderId || !paymentId) {
            try {
                const response = await fetch(`/payment-history/${studentData.rollNumber}`);
                if (response.ok) {
                    const history = await response.json();
                    if (history.length > 0) {
                        orderId = orderId || history[0].orderId; // Get the latest order ID from the history.
                        paymentId = paymentId || history[0].paymentId; // Get the latest payment ID from the history.
                    }
                }
            } catch (fetchError) {
                console.error('Could not fetch payment history for IDs:', fetchError);
            }
        }
        populateField('summaryOrderId', orderId || 'N/A');
        populateField('summaryPaymentId', paymentId || 'N/A');

        // --- Print Button Logic ---
        const printBtn = document.getElementById('printSummaryBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

    } catch (error) {
        console.error("Error parsing or displaying summary data:", error);
        alert("Could not display admission summary due to a data error.");
    }

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