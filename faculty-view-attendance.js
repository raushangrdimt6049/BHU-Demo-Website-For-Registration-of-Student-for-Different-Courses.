document.addEventListener('DOMContentLoaded', () => {
    const facultyDataString = sessionStorage.getItem('currentFaculty');
    if (!facultyDataString) {
        // This is a fallback. The head script should have already redirected.
        window.location.replace('faculty-login.html');
        return;
    }
    const facultyData = JSON.parse(facultyDataString);

    const recordsContainer = document.getElementById('attendance-records-container');

    const fetchAndDisplayAttendance = async (facultyUsername) => {
        if (!recordsContainer) {
            console.error('Attendance records container not found.');
            return;
        }

        recordsContainer.innerHTML = '<p class="no-records-message">Loading attendance records...</p>';

        try {
            const response = await fetch(`/api/faculty/view-attendance/${facultyUsername}`);
            const records = await response.json();

            if (!response.ok) {
                throw new Error(records.message || 'Failed to fetch attendance records.');
            }

            if (records.length === 0) {
                recordsContainer.innerHTML = '<p class="no-records-message">You have not submitted any attendance records yet.</p>';
                return;
            }

            // Build the table HTML
            let tableHTML = `
                <div class="attendance-table-container">
                    <table class="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Class</th>
                                <th>Subject</th>
                                <th>Total Students</th>
                                <th>Present</th>
                                <th>Absent</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            records.forEach(record => {
                let attendanceDate = 'N/A'; // Default value
                if (record.attendanceDate) {
                    attendanceDate = new Date(record.attendanceDate).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    });
                }

                tableHTML += `
                    <tr>
                        <td>${attendanceDate}</td>
                        <td>${record.className}</td>
                        <td>${record.subject}</td>
                        <td>${record.totalStudents}</td>
                        <td style="color: var(--btn-success-bg);">${record.presentCount}</td>
                        <td style="color: var(--btn-danger-bg);">${record.absentCount}</td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table></div>`;
            recordsContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error('Error fetching attendance records:', error);
            recordsContainer.innerHTML = `<p class="no-records-message" style="color: var(--btn-danger-bg);">${error.message}</p>`;
        }
    };

    // Initial fetch when the page loads
    fetchAndDisplayAttendance(facultyData.username);
});