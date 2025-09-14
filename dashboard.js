document.addEventListener('DOMContentLoaded', () => {
    const studentDataString = sessionStorage.getItem('currentStudent');
    const loginTimeString = sessionStorage.getItem('loginTime');

    // --- Server Status Check ---
    const checkServerStatus = async () => {
        if (!loginTimeString) return; // Can't check if we don't know when we logged in

        try {
            const response = await fetch('/api/status');
            if (!response.ok) return; // Don't logout if status check fails

            const data = await response.json();
            const serverStartTime = new Date(data.serverStartTime);
            const loginTime = new Date(loginTimeString);

            if (serverStartTime > loginTime) {
                alert('The server has been updated. Please log in again for security.');
                sessionStorage.clear();
                window.location.replace('login.html');
            }
        } catch (error) {
            console.warn('Could not check server status:', error);
        }
    };

    // --- Main Logic ---
    const initializePage = () => {
        if (!studentDataString) {
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
            return;
        }

        const studentData = JSON.parse(studentDataString);
        const tableBody = document.getElementById('history-table-body');
        const noHistoryMessage = document.getElementById('no-history-message');

        fetch(`/payment-history/${studentData.rollNumber}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch payment history.');
                return res.json();
            })
            .then(history => {
                if (history.length === 0) {
                    noHistoryMessage.style.display = 'block';
                    return;
                }

                tableBody.innerHTML = ''; // Clear any existing content
                history.forEach(payment => {
                    const row = document.createElement('tr');
                    const paymentDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    });
                    const amount = `₹ ${Number(payment.amount).toLocaleString('en-IN')}`;

                    row.innerHTML = `
                        <td>${payment.orderId || 'N/A'}</td>
                        <td>${payment.paymentId || 'N/A'}</td>
                        <td>${payment.course || 'N/A'}</td>
                        <td>${amount}</td>
                        <td>${paymentDate}</td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error fetching payment history:', error);
                noHistoryMessage.textContent = 'Could not load payment history. Please try again later.';
                noHistoryMessage.style.display = 'block';
            });
    };

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

    checkServerStatus().then(initializePage);
});