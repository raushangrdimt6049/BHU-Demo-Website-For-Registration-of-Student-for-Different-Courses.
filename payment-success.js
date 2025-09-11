document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    // Retrieve payment details from sessionStorage (saved by the payment page)
    const paymentDetailsString = sessionStorage.getItem('lastPaymentDetails');

    if (orderId && paymentDetailsString) {
        const paymentDetails = JSON.parse(paymentDetailsString);

        document.getElementById('orderId').textContent = orderId;
        document.getElementById('paymentDate').textContent = new Date().toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('amountPaid').textContent = `₹ ${paymentDetails.amount / 100}`;
        document.getElementById('courseDetails').textContent = paymentDetails.course;

        // Clean up sessionStorage after displaying the details
        sessionStorage.removeItem('lastPaymentDetails');
    } else {
        // Handle case where user lands here directly or data is missing
        const receiptContainer = document.querySelector('.receipt-container');
        receiptContainer.innerHTML = `
            <h2>Invalid Access</h2>
            <p>No payment details found. Please complete a payment to view a receipt.</p>
            <div class="button-group">
                <a href="home.html" class="submit-btn">Back to Home</a>
            </div>
        `;
    }
});