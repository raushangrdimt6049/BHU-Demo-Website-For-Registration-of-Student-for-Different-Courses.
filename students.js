document.addEventListener('DOMContentLoaded', async () => {
    // --- Password Protection Elements ---
    const passwordOverlay = document.getElementById('password-overlay');
    const adminPasswordForm = document.getElementById('adminPasswordForm');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const passwordError = document.getElementById('password-error');
    const correctPassword = '7983257106';

    // This function contains all the logic for fetching, displaying, searching, and exporting records.
    const initializeStudentRecords = async () => {
        const tableBody = document.querySelector('#students-table tbody');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const exportCsvBtn = document.getElementById('exportCsvBtn');
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

            if (allStudents.length === 0) {
                exportCsvBtn.disabled = true;
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
        const enteredPassword = adminPasswordInput.value;

        if (enteredPassword === correctPassword) {
            // On correct password, hide the overlay and load the records.
            passwordOverlay.style.opacity = '0';
            setTimeout(() => {
                passwordOverlay.style.display = 'none';
            }, 300); // Match the transition duration
            initializeStudentRecords();
        } else {
            passwordError.textContent = 'Incorrect password. Please try again.';
            passwordError.style.display = 'block';
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
    });
});