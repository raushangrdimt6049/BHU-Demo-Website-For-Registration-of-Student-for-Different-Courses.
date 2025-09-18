window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
    const hobbyCourse = JSON.parse(sessionStorage.getItem('newHobbyCourse'));

    if (!studentData || !hobbyCourse) {
        alert("There was a problem loading your course details. Please try again from the home page.");
        window.location.replace('home.html');
        return;
    }

    // --- Populate Preview Details ---
    document.getElementById('studentName').textContent = studentData.name || 'N/A';
    document.getElementById('rollNumber').textContent = studentData.rollNumber || 'N/A';
    document.getElementById('courseName').textContent = hobbyCourse.name || 'N/A';
    document.getElementById('paymentAmount').textContent = `₹ ${(hobbyCourse.fee / 100).toLocaleString('en-IN')}`;

    // --- Payment Button Logic ---
    const payNowBtn = document.getElementById('payNowBtn');
    payNowBtn.addEventListener('click', async () => {
        payNowBtn.disabled = true;
        payNowBtn.textContent = 'Processing...';

        try {
            // 1. Create a Razorpay Order
            const orderResponse = await fetch('/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: hobbyCourse.fee,
                    currency: 'INR',
                }),
            });

            const orderData = await orderResponse.json();
            if (!orderResponse.ok) throw new Error(orderData.message || 'Failed to create payment order.');

            // 2. Configure and open Razorpay Checkout
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'DAV PG College',
                description: `Fee for ${hobbyCourse.name}`,
                image: 'https://media.collegedekho.com/media/img/institute/logo/1436976975.jpg',
                order_id: orderData.id,
                handler: async function (response) {
                    // 3. Verify the payment on the new server endpoint
                    const verificationResponse = await fetch('/verify-hobby-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            rollNumber: studentData.rollNumber,
                            course: hobbyCourse
                        }),
                    });

                    const verificationData = await verificationResponse.json();
                    if (verificationData.status === 'success' && verificationData.studentData) {
                        alert('Payment Successful! Redirecting to your receipt.');
                        sessionStorage.setItem('currentStudent', JSON.stringify(verificationData.studentData));
                        
                        const lastPaymentDetails = {
                            orderId: verificationData.orderId,
                            amount: hobbyCourse.fee,
                            course: hobbyCourse.name,
                            paymentDate: new Date().toISOString() // Capture the exact payment time
                        };
                        sessionStorage.setItem('lastPaymentDetails', JSON.stringify(lastPaymentDetails));
                        sessionStorage.removeItem('newHobbyCourse');
                        sessionStorage.setItem('navigationAllowed', 'true');
                        window.location.href = `payment-success.html?orderId=${verificationData.orderId}`;
                    } else {
                        alert('Payment verification failed. Please contact support.');
                        payNowBtn.disabled = false;
                        payNowBtn.textContent = 'Pay Now';
                    }
                },
                prefill: { name: studentData.name, email: studentData.email, contact: studentData.mobileNumber },
                notes: { roll_number: studentData.rollNumber, type: 'hobby_course' },
                theme: { color: '#0056b3' }
                ,
                modal: { ondismiss: function () {
                    alert('Payment was not completed. You are being returned to your course list.');
                    sessionStorage.setItem('openMyCoursesModal', 'true'); // Set a flag to open the modal on the home page
                    sessionStorage.setItem('navigationAllowed', 'true'); // Allow navigation back to home
                    window.location.href = 'home.html';
                } }
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
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && (link.hostname === window.location.hostname || !link.hostname)) {
            sessionStorage.setItem('navigationAllowed', 'true');
        }
    });
});