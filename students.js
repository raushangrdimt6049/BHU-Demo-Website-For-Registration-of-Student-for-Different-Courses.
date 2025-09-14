// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// password prompt is always shown, aligning with the strict security policy.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // --- Password Protection Elements ---
    const passwordOverlay = document.getElementById('password-overlay');
    const adminPasswordForm = document.getElementById('adminPasswordForm');
    const adminUsernameInput = document.getElementById('adminUsernameInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const passwordError = document.getElementById('password-error');
    const correctUsername = 'Raushan_143';
    const correctPassword = '4gh4m01r';

    // This function contains all the logic for fetching, displaying, searching, and exporting records.
    const initializeStudentRecords = async () => {
        const tableBody = document.querySelector('#students-table tbody');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        const searchInput = document.getElementById('searchInput');

        let allStudents = []; // This will hold the master list of students

        /**
         * Renders a list of students into the table.
         * @param {Array} studentList The array of student objects to display.
         */
        const displayStudents = (studentList) => {
            tableBody.innerHTML = ''; // Clear existing rows

            if (studentList.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No matching records found.</td></tr>';
                return;
            }

            studentList.forEach(student => {
                const row = document.createElement('tr');
                // The order must match the <thead> in students.html
                row.innerHTML = `
                    <td>${student.enrollmentNumber || 'N/A'}</td>
                    <td>${student.name || 'N/A'}</td>
                    <td>${student.email || 'N/A'}</td>
                    <td>${student.rollNumber || 'N/A'}</td>
                    <td>${student.gender || 'N/A'}</td>
                    <td>${student.mobileNumber || 'N/A'}</td>
                    <td>${student.city || 'N/A'}</td>
                `;
                tableBody.appendChild(row);
            });
        };

        try {
            // Fetch data from our new API endpoint
            const response = await fetch('/api/all-students');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load student data.');
            }

            allStudents = await response.json();
            loadingDiv.style.display = 'none';
            exportCsvBtn.style.visibility = 'visible';
            exportPdfBtn.style.visibility = 'visible';

            if (allStudents.length === 0) {
                exportCsvBtn.disabled = true;
                exportPdfBtn.disabled = true;
            }

            displayStudents(allStudents); // Initial display of all students

            // --- Search Functionality ---
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                const filteredStudents = allStudents.filter(student =>
                    (student.name || '').toLowerCase().includes(searchTerm) ||
                    (student.email || '').toLowerCase().includes(searchTerm) ||
                    (student.rollNumber || '').toLowerCase().includes(searchTerm)
                );
                displayStudents(filteredStudents);
            });

            // --- CSV Export Functionality ---
            exportCsvBtn.addEventListener('click', () => {
                // Get the currently filtered list of students to export
                const searchTerm = searchInput.value.toLowerCase().trim();
                const studentsToExport = allStudents.filter(student =>
                    (student.name || '').toLowerCase().includes(searchTerm) ||
                    (student.email || '').toLowerCase().includes(searchTerm) ||
                    (student.rollNumber || '').toLowerCase().includes(searchTerm)
                );

                if (studentsToExport.length === 0) {
                    alert('No data to export.');
                    return;
                }

                const headers = ['Enrollment ID', 'Name', 'Email', 'Roll Number', 'Gender', 'Mobile Number', 'City'];
                
                const processRow = row => row.map(val => {
                    const finalVal = (val === null || val === undefined) ? '' : String(val);
                    // Escape double quotes by doubling them, and wrap in quotes if it contains commas, quotes, or newlines
                    if (finalVal.includes('"') || finalVal.includes(',') || finalVal.includes('\n')) {
                        return `"${finalVal.replace(/"/g, '""')}"`;
                    }
                    return finalVal;
                }).join(',');

                const studentRows = studentsToExport.map(s => [
                    s.enrollmentNumber,
                    s.name,
                    s.email,
                    s.rollNumber,
                    s.gender,
                    s.mobileNumber,
                    s.city
                ]);

                const csvContent = [
                    processRow(headers),
                    ...studentRows.map(row => processRow(row))
                ].join('\n');

                const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "student-records.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

        // --- PDF Export Functionality ---
        exportPdfBtn.addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            // Using a try-catch block in case the library fails to load from the CDN
            if (typeof jsPDF === 'undefined') {
                alert('Could not generate PDF. Please check your internet connection and try again.');
                return;
            }
            const doc = new jsPDF();

            const searchTerm = searchInput.value.toLowerCase().trim();
            const studentsToExport = allStudents.filter(student =>
                (student.name || '').toLowerCase().includes(searchTerm) ||
                (student.email || '').toLowerCase().includes(searchTerm) ||
                (student.rollNumber || '').toLowerCase().includes(searchTerm)
            );

            if (studentsToExport.length === 0) {
                alert('No data to export.');
                return;
            }

            const head = [['ID', 'Name', 'Email', 'Roll Number', 'Gender', 'Mobile', 'City']];
            const body = studentsToExport.map(s => [
                s.enrollmentNumber,
                s.name,
                s.email,
                s.rollNumber,
                s.gender,
                s.mobileNumber,
                s.city
            ]);

            doc.autoTable({
                head: head,
                body: body,
                didDrawPage: (data) => doc.text("Student Records", data.settings.margin.left, 15),
                margin: { top: 20 }
            });

            doc.save('student-records.pdf');
        });

        } catch (error) {
            loadingDiv.style.display = 'none';
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.display = 'block';
            console.error('Failed to fetch student data:', error);
        }
    };

    // --- Password Protection Logic ---
    // Always show the modal on page load and handle authentication.
    // The authentication state is not stored, so a refresh or revisit will always require the password.
    passwordOverlay.style.display = 'flex'; // Make sure it's visible
    adminPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredUsername = adminUsernameInput.value;
        const enteredPassword = adminPasswordInput.value;

        if (enteredUsername === correctUsername && enteredPassword === correctPassword) {
            // On correct credentials, hide the overlay and load the records.
            passwordOverlay.style.opacity = '0';
            setTimeout(() => {
                passwordOverlay.style.display = 'none';
            }, 300); // Match the transition duration
            initializeStudentRecords();
        } else {
            passwordError.textContent = 'Incorrect username or password. Please try again.';
            passwordError.style.display = 'block';
            // For security, only clear the password field.
            adminPasswordInput.value = '';
            adminUsernameInput.focus();
        }
    });
});