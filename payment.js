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
                        alert('Payment Successful! Redirecting to your receipt.');
                        // Update student data in session storage
                        sessionStorage.setItem('currentStudent', JSON.stringify(verificationData.studentData));
                        
                        // Store details for the simple receipt page
                        const lastPaymentDetails = {
                            orderId: verificationData.orderId,
                            amount: selectedCourse.amount,
                            course: `${selectedCourse.level} - ${selectedCourse.branch}`
                        };
                        sessionStorage.setItem('lastPaymentDetails', JSON.stringify(lastPaymentDetails));
                        sessionStorage.removeItem('selectedCourse');
                        window.location.href = `payment-success.html?orderId=${verificationData.orderId}`;
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