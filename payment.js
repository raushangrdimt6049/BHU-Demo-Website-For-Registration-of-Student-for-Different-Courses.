// --- Security Checks ---
// The inline script in the HTML provides the first line of defense.
// These checks add a second layer of security and provide clearer error messages.
if (!sessionStorage.getItem('currentStudent')) {
    console.error("Security Error: No student data in session. Redirecting to login.");
    window.location.replace('login.html');
}
if (!sessionStorage.getItem('selectedCourse')) {
    console.error("Security Error: No course selected in session. Redirecting to home.");
    alert('Course selection not found. Redirecting to home page.');
    window.location.replace('home.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
    const selectedCourse = JSON.parse(sessionStorage.getItem('selectedCourse'));

    // Final validation to ensure data is usable before trying to display it
    if (!studentData || !selectedCourse || !selectedCourse.amount) {
        alert("There was a problem loading your application details. Please try again from the home page.");
        window.location.replace('home.html');
        return;
    }

    // --- Populate Preview Details ---
    // This assumes your payment.html has elements with these IDs to show a final summary.
    document.getElementById('studentName').textContent = studentData.name || 'N/A';
    document.getElementById('rollNumber').textContent = studentData.rollNumber || 'N/A';
    document.getElementById('courseName').textContent = `${selectedCourse.level} - ${selectedCourse.branch}` || 'N/A';
    document.getElementById('paymentAmount').textContent = `₹ ${(selectedCourse.amount / 100).toLocaleString('en-IN')}`;

    // --- Payment Button Logic ---
    const payNowBtn = document.getElementById('payNowBtn'); // Assumes a button with this ID exists on payment.html
    payNowBtn.addEventListener('click', async () => {
        payNowBtn.disabled = true;
        payNowBtn.textContent = 'Processing...';

        try {
            // 1. Create a Razorpay Order on the server
            const orderResponse = await fetch('/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: selectedCourse.amount, // Amount in paise
                    currency: 'INR',
                }),
            });

            const orderData = await orderResponse.json();
            if (!orderResponse.ok) {
                throw new Error(orderData.message || 'Failed to create payment order.');
            }

            // 2. Configure and open Razorpay Checkout
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'DAV PG College',
                description: `Admission Fee for ${selectedCourse.branch}`,
                image: 'https://media.collegedekho.com/media/img/institute/logo/1436976975.jpg',
                order_id: orderData.id,
                handler: async function (response) {
                    // 3. Verify the payment on your server
                    const verificationResponse = await fetch('/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            rollNumber: studentData.rollNumber,
                            course: selectedCourse
                        }),
                    });

                    const verificationData = await verificationResponse.json();
                    if (verificationData.status === 'success' && verificationData.studentData) {
                        alert('Payment Successful! Redirecting to summary.');
                        sessionStorage.setItem('currentStudent', JSON.stringify(verificationData.studentData));
                        sessionStorage.removeItem('selectedCourse');
                        window.location.href = 'payment-summary.html';
                    } else {
                        alert('Payment verification failed. Please contact support.');
                        payNowBtn.disabled = false;
                        payNowBtn.textContent = 'Pay Now';
                    }
                },
                prefill: { name: studentData.name, email: studentData.email, contact: studentData.mobileNumber },
                notes: { roll_number: studentData.rollNumber },
                theme: { color: '#0056b3' },
                modal: { ondismiss: function () { alert('Payment was not completed.'); payNowBtn.disabled = false; payNowBtn.textContent = 'Pay Now'; } }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment process error:', error);
            alert(`An error occurred: ${error.message}`);
            payNowBtn.disabled = false;
            payNowBtn.textContent = 'Pay Now';
        }
    });
});