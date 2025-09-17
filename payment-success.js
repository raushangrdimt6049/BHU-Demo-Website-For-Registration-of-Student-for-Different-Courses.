document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    // Retrieve payment details from sessionStorage (saved by the payment page)
    const paymentDetailsString = sessionStorage.getItem('lastPaymentDetails');

    // Validate that the orderId from the URL matches the one in sessionStorage for security
    if (orderId && paymentDetailsString && JSON.parse(paymentDetailsString).orderId === orderId) {
        const paymentDetails = JSON.parse(paymentDetailsString);

        document.getElementById('orderId').textContent = paymentDetails.orderId;
        document.getElementById('paymentDate').textContent = new Date(paymentDetails.paymentDate).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('amountPaid').textContent = `₹ ${paymentDetails.amount / 100}`;
        document.getElementById('courseDetails').textContent = paymentDetails.course;

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

    // --- Print Button Logic ---
    const printBtn = document.getElementById('printReceiptBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
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