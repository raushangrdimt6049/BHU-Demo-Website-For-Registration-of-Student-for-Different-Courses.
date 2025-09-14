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
        const printBtn = document.getElementById('printBtn');
        const searchInput = document.getElementById('searchInput');
        const editModal = document.getElementById('edit-student-modal');
        const editForm = document.getElementById('editStudentForm');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const editRollNumberHidden = document.getElementById('editRollNumberHidden');


        let allStudents = []; // This will hold the master list of students

        /**
         * Renders a list of students into the table.
         * @param {Array} studentList The array of student objects to display.
         */
        const displayStudents = (studentList) => {
            tableBody.innerHTML = ''; // Clear existing rows

            if (studentList.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No matching records found.</td></tr>';
                return;
            }

            studentList.forEach(student => {
                const row = document.createElement('tr');
                // The order must match the <thead> in students.html
                row.innerHTML = `
                    <td>${student.enrollmentNumber || 'N/A'}</td>
                    <td>${student.name || 'N/A'}</td>
                    <td>${student.rollNumber || 'N/A'}</td>
                    <td>${student.email || 'N/A'}</td>
                    <td>${student.gender || 'N/A'}</td>
                    <td>${student.mobileNumber || 'N/A'}</td>
                    <td>${student.city || 'N/A'}</td>
                    <td>
                        <button class="edit-btn" data-roll-number="${student.rollNumber}">Edit</button>
                        <button class="delete-btn" data-roll-number="${student.rollNumber}">Delete</button>
                    </td>
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
            printBtn.style.visibility = 'visible';

            if (allStudents.length === 0) {
                exportCsvBtn.disabled = true;
                printBtn.disabled = true;
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

            // --- Delete Student Functionality (Event Delegation) ---
            tableBody.addEventListener('click', async (event) => {
                if (event.target.classList.contains('delete-btn')) {
                    const button = event.target;
                    const rollNumber = button.dataset.rollNumber;
                    const studentName = button.closest('tr').querySelector('td:nth-child(2)').textContent;

                    if (confirm(`Are you sure you want to delete the record for ${studentName} (${rollNumber})? This action cannot be undone.`)) {
                        try {
                            const response = await fetch(`/api/student/${rollNumber}`, {
                                method: 'DELETE',
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                throw new Error(data.message || 'Failed to delete student.');
                            }

                            // --- On success, update UI and local data ---
                            alert(data.message);

                            // Remove from the `allStudents` array
                            allStudents = allStudents.filter(s => s.rollNumber !== rollNumber);

                            // Remove the row from the table
                            button.closest('tr').remove();

                        } catch (error) {
                            console.error('Error deleting student:', error);
                            alert(`Error: ${error.message}`);
                        }
                    }
                } else if (event.target.classList.contains('edit-btn')) {
                    const button = event.target;
                    const rollNumber = button.dataset.rollNumber;

                    // Find the student in our local array
                    const studentToEdit = allStudents.find(s => s.rollNumber === rollNumber);
                    if (studentToEdit) {
                        // Populate the modal form
                        editRollNumberHidden.value = studentToEdit.rollNumber;
                        document.getElementById('editStudentName').value = studentToEdit.name || '';
                        document.getElementById('editStudentEmail').value = studentToEdit.email || '';
                        document.getElementById('editStudentMobile').value = studentToEdit.mobileNumber || '';
                        document.getElementById('editStudentCity').value = studentToEdit.city || '';

                        // Show the modal
                        editModal.style.display = 'flex';
                    }
                }
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

        // --- Edit Modal Functionality ---
        cancelEditBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rollNumber = editRollNumberHidden.value;
            const updatedData = {
                name: document.getElementById('editStudentName').value,
                email: document.getElementById('editStudentEmail').value,
                mobileNumber: document.getElementById('editStudentMobile').value,
                city: document.getElementById('editStudentCity').value,
            };

            try {
                const response = await fetch(`/api/student/${rollNumber}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to update student.');
                }

                alert(result.message);

                // Update local `allStudents` array with the fresh data from the server
                const studentIndex = allStudents.findIndex(s => s.rollNumber === rollNumber);
                if (studentIndex > -1) {
                    allStudents[studentIndex] = { ...allStudents[studentIndex], ...result.studentData };
                }

                // Re-render the currently filtered view
                const searchTerm = searchInput.value.toLowerCase().trim();
                const currentViewStudents = allStudents.filter(student =>
                    (student.name || '').toLowerCase().includes(searchTerm) ||
                    (student.email || '').toLowerCase().includes(searchTerm) ||
                    (student.rollNumber || '').toLowerCase().includes(searchTerm)
                );
                displayStudents(currentViewStudents);

                editModal.style.display = 'none'; // Hide modal on success
            } catch (error) {
                console.error('Error updating student:', error);
                alert(`Error: ${error.message}`);
            }
        });

        // --- Print Functionality ---
        printBtn.addEventListener('click', () => {
            // The @media print styles in students.html will handle the formatting.
            window.print();
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