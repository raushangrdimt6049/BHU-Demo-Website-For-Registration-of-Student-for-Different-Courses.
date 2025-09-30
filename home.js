// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// security script in the <head> always runs.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const studentDataString = sessionStorage.getItem('currentStudent');

    // --- Server Status Check ---
    // This function checks if the server has restarted since the user logged in.
    const checkServerStatus = async () => {
        const loginTimeString = sessionStorage.getItem('loginTime');
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
                window.location.replace('index.html');
            }
        } catch (error) {
            console.warn('Could not check server status:', error);
        }
    };

    // --- Inactivity Logout Timer ---
    let inactivityTimer;
    const logoutTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            // Logout the user
            alert('You have been logged out due to inactivity.');
            sessionStorage.clear();
            window.location.replace('index.html');
        }, logoutTime);
    };

    // Events that reset the timer
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);

    // This function contains the main logic for setting up the home page.
    // It will only run after the server status check is complete.
    const initializePage = () => {
        if (!studentDataString) {
            // If no student data, redirect to registration page
            window.location.href = 'index.html';
            return;
        }

        // Helper function to format class names with ordinal suffixes
        const formatClassName = (className) => {
            if (!className) return 'N/A';
            if (className.toLowerCase().includes('nursery')) return 'Nursery';
            if (className.toLowerCase().includes('lkg')) return 'LKG';
            if (className.toLowerCase().includes('ukg')) return 'UKG';

            const numberMatch = className.match(/\d+/);
            if (!numberMatch) return className; // Return as is if no number found

            const number = parseInt(numberMatch[0], 10);
            if (isNaN(number)) return className;

            // Special case for 11, 12, 13
            if (number >= 11 && number <= 13) {
                return `${number}th`;
            }

            const lastDigit = number % 10;
            switch (lastDigit) {
                case 1: return `${number}st`;
                case 2: return `${number}nd`;
                case 3: return `${number}rd`;
                default: return `${number}th`;
            }
        };

        // --- Hobby Course Data ---
        const HOBBY_COURSES = {
            "Dancing": { name: "Dancing", fee: 50000 }, // ₹500.00
            "Music": { name: "Music (Vocal)", fee: 60000 }, // ₹600.00
            "Guitar": { name: "Guitar Lessons", fee: 75000 }, // ₹750.00
            "Painting": { name: "Painting & Sketching", fee: 45000 }, // ₹450.00
            "Yoga": { name: "Yoga & Wellness", fee: 30000 } // ₹300.00
        };

        // --- Course Data (from course-selection.js) ---
        const CLASSES = {
            "Nursery": { name: "Nursery", fee: 500000 },
            "LKG": { name: "LKG", fee: 550000 },
            "UKG": { name: "UKG", fee: 600000 },
            "Class 1": { name: "Class 1", fee: 700000 },
            "Class 2": { name: "Class 2", fee: 750000 },
            "Class 3": { name: "Class 3", fee: 800000 },
            "Class 4": { name: "Class 4", fee: 850000 },
            "Class 5": { name: "Class 5", fee: 900000 },
            "Class 6": { name: "Class 6", fee: 1000000 },
            "Class 7": { name: "Class 7", fee: 1050000 },
            "Class 8": { name: "Class 8", fee: 1100000 },
            "Class 9": { name: "Class 9", fee: 1250000 },
            "Class 10": { name: "Class 10", fee: 1300000 },
            "Class 11": { name: "Class 11", fee: 1500000 },
            "Class 12": { name: "Class 12", fee: 1550000 }
        };

        let studentData = JSON.parse(studentDataString);
        let studentNotifications = []; // To store fetched notifications
        let searchableItems = []; // Define the array to hold all searchable items
        let schoolTimetable = null; // Cache for the full school timetable

        // --- View Containers ---
        const proceedSection = document.querySelector('.proceed-section');

        // --- Side Navigation References ---
        const sideNavBtn = document.getElementById('sideNavBtn');
        const sideNav = document.getElementById('sideNav');
        const sideNavOverlay = document.getElementById('sideNavOverlay');
        const closeSideNavBtn = document.getElementById('closeSideNavBtn');
        const sideNavDashboardLink = document.querySelector('a[href="home.html"]');
        const sideNavMyCoursesBtn = document.getElementById('sideNavMyCoursesBtn');
        const sideNavFeeStructureBtn = document.getElementById('sideNavFeeStructureBtn');
        const sideNavSettingsBtn = document.getElementById('sideNavSettingsBtn');
        const sideNavTimetableLink = document.getElementById('sideNavTimetableLink');
        const sideNavAttendanceLink = document.getElementById('sideNavAttendanceLink');
        const sideNavLogoutBtn = document.getElementById('sideNavLogoutBtn');
        const sideNavAvatar = document.getElementById('sideNavAvatar');
        const sideNavName = document.getElementById('sideNavName');

        // --- Notification Panel References ---
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationPanel = document.getElementById('notificationPanel');
        const notificationBadge = document.getElementById('notificationBadge');
        const notificationList = document.getElementById('notificationList');
        const allNotificationsList = document.getElementById('allNotificationsList');
        const viewAllNotificationsLink = document.getElementById('viewAllNotificationsLink');

        // --- Settings View References ---
        const settingsFields = {
            name: document.getElementById('settingName'),
            email: document.getElementById('settingEmail'),
            dobDay: document.getElementById('settingDobDay'),
            dobMonth: document.getElementById('settingDobMonth'),
            dobYear: document.getElementById('settingDobYear'),
            gender: document.getElementById('settingGender')
        };
        const profilePictureImg = document.getElementById('profilePicture');
        const editProfilePictureInput = document.getElementById('editProfilePicture');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');

        // --- Profile Modal References ---
        const profileModalOverlay = document.getElementById('profileModalOverlay');
        const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
        const modalProfilePic = document.getElementById('modalProfilePic');
        const modalStudentName = document.getElementById('modalStudentName');
        const modalEmail = document.getElementById('modalEmail');
        const modalMobile = document.getElementById('modalMobile');
        const modalRollNo = document.getElementById('modalRollNo');
        const modalEnrollmentNo = document.getElementById('modalEnrollmentNo');

        // --- NEW Settings Modal References ---
        const settingsModalOverlay = document.getElementById('settingsModalOverlay');
        const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');

        // --- Payment History Modal References ---
        const historyModalOverlay = document.getElementById('historyModalOverlay');
        const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
        const historyTableBody = document.getElementById('history-table-body');
        const noHistoryMessage = document.getElementById('no-history-message');
        const printHistoryPdfBtn = document.getElementById('printHistoryPdfBtn');

        // --- My Courses Modal References ---
        const myCoursesModalOverlay = document.getElementById('myCoursesModalOverlay');
        const closeMyCoursesModalBtn = document.getElementById('closeMyCoursesModalBtn');
        const enrolledCoursesContainer = document.getElementById('enrolledCoursesContainer');
        const showHobbyCoursesBtn = document.getElementById('showHobbyCoursesBtn');

        // --- Add Hobby Course Modal References ---
        const addHobbyCourseModalOverlay = document.getElementById('addHobbyCourseModalOverlay');
        const closeAddHobbyCourseModalBtn = document.getElementById('closeAddHobbyCourseModalBtn');
        const hobbyCoursesList = document.getElementById('hobby-courses-list');
        const proceedToHobbyPaymentBtn = document.getElementById('proceedToHobbyPaymentBtn');

        // --- Fee Structure Modal References ---
        const feeStructureModalOverlay = document.getElementById('feeStructureModalOverlay');
        const closeFeeStructureModalBtn = document.getElementById('closeFeeStructureModalBtn');
        const feeStructureContainer = document.getElementById('fee-structure-container');
        const feeModalHistoryTableBody = document.getElementById('fee-modal-history-table-body');
        const feeModalNoHistoryMessage = document.getElementById('fee-modal-no-history-message');

        // --- All Notifications Modal ---
        const allNotificationsModalOverlay = document.getElementById('allNotificationsModalOverlay');
        const closeAllNotificationsModalBtn = document.getElementById('closeAllNotificationsModalBtn');

        // --- Notification Detail Modal ---
        const notificationDetailModalOverlay = document.getElementById('notificationDetailModalOverlay');
        const closeNotificationDetailModalBtn = document.getElementById('closeNotificationDetailModalBtn');
        const notificationDetailTitle = document.getElementById('notificationDetailTitle');
        const notificationDetailMessage = document.getElementById('notificationDetailMessage');
        const notificationDetailDate = document.getElementById('notificationDetailDate');

        // --- Student Timetable Modal ---
        const studentTimetableModalOverlay = document.getElementById('studentTimetableModalOverlay');
        const closeStudentTimetableModalBtn = document.getElementById('closeStudentTimetableModalBtn');
        const studentTimetableTitle = document.getElementById('studentTimetableTitle');
        const studentTimetableBody = document.getElementById('studentTimetableBody');

        // --- Attendance Modal ---
        const attendanceModalOverlay = document.getElementById('attendanceModalOverlay');
        const closeAttendanceModalBtn = document.getElementById('closeAttendanceModalBtn');
        const attendanceSummaryContainer = document.getElementById('attendance-summary-container');
        const attendanceCorrectionForm = document.getElementById('attendanceCorrectionForm');
        const correctionCourseSelect = document.getElementById('correctionCourseSelect');
        const attendanceSubjectFilter = document.getElementById('attendanceSubjectFilter');


        // Helper function to generate HTML for each application step
        function createStepHTML(title, description, link, isDone, isEnabled) {
            const statusText = isDone ? '✓ Completed' : 'Pending';
            const statusClass = isDone ? 'done' : 'pending';
            const buttonText = isDone ? 'Edit' : 'Start';
            const disabledClass = isEnabled ? '' : 'disabled';
        
            return `
                <div class="step-item ${disabledClass}">
                    <div class="step-info">
                        <h5>${title}</h5>
                        <p>${description}</p>
                    </div>
                    <div class="step-action">
                        <span class="status ${statusClass}">${statusText}</span>
                        <a href="${isEnabled ? link : '#'}" class="submit-btn step-btn ${disabledClass}">${buttonText}</a>
                    </div>
                </div>
            `;
        }

        // --- Side Navigation Logic ---
        const openNav = () => {
            if (sideNav && sideNavOverlay) {
                sideNav.classList.add('active');
                sideNavOverlay.classList.add('active');
            }
        };
        const closeNav = () => {
            if (sideNav && sideNavOverlay) {
                sideNav.classList.remove('active');
                sideNavOverlay.classList.remove('active');
            }
        };

        if (sideNavBtn && closeSideNavBtn && sideNavOverlay) {
            sideNavBtn.addEventListener('click', openNav);
            closeSideNavBtn.addEventListener('click', closeNav);
            sideNavOverlay.addEventListener('click', closeNav);
        }

        // --- Populate Side Navigation Header ---
        if (sideNavName) {
            sideNavName.textContent = studentData.name || 'Student';
        }
        if (sideNavAvatar) {
            sideNavAvatar.src = studentData.profilePicture || 'default-avatar.png';
            sideNavAvatar.onerror = () => { sideNavAvatar.src = 'default-avatar.png'; };
        }

        // --- Profile Modal Listeners ---
        if (sideNavAvatar) {
            sideNavAvatar.addEventListener('click', () => {
                // Populate modal with data
                modalProfilePic.src = studentData.profilePicture || 'default-avatar.png';
                modalStudentName.textContent = studentData.name || 'N/A';
                modalEmail.textContent = studentData.email || 'N/A';
                modalMobile.textContent = studentData.mobileNumber || 'N/A';
                modalRollNo.textContent = studentData.rollNumber || 'N/A';
                modalEnrollmentNo.textContent = studentData.enrollmentNumber || 'N/A';

                // Show the modal
                if (profileModalOverlay) profileModalOverlay.classList.add('active');
                closeNav(); // Close the side nav if it's open
            });
        }

        // --- Generic Modal Logic ---
        const openModal = (modalOverlay) => {
            if (modalOverlay) modalOverlay.classList.add('active');
        };
        const closeModal = (modalOverlay) => {
            if (modalOverlay) modalOverlay.classList.remove('active');
        };

        if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', () => closeModal(profileModalOverlay));
        if (profileModalOverlay) profileModalOverlay.addEventListener('click', (event) => { if (event.target === profileModalOverlay) closeModal(profileModalOverlay); });

        // --- Attendance Modal Logic ---
        let fullAttendanceData = []; // Cache for the fetched attendance data
        let attendanceChartInstance = null; // To hold the Chart.js instance

        const displayAttendanceDetails = async (subject) => {
            let dataToShow;
            let title;

            if (attendanceChartInstance) {
                attendanceChartInstance.destroy();
            }
            attendanceSummaryContainer.innerHTML = ''; // Clear previous content

            if (fullAttendanceData.length === 0) {
                attendanceSummaryContainer.innerHTML = '<p>No attendance data available.</p>';
                return;
            }

            const displayDetailsHTML = (attendanceDetails) => {
                let detailsHTML = '<ul>';
                if (Array.isArray(attendanceDetails)) {
                    attendanceDetails.forEach(detail => {
                        const formattedDate = new Date(detail.attendanceDate).toLocaleDateString('en-IN');
                        detailsHTML += `
                            <li>
                                ${detail.subject} - ${formattedDate} - ${detail.status}
                            </li>
                        `;
                    });
                } else {
                    detailsHTML += `<li>${attendanceDetails}</li>`;
                }
                detailsHTML += '</ul>';
                return detailsHTML;
            }
            //--- Display Detailed attendance Record---
            let attendanceDetails = await fetch(`/api/student/attendance-details/${studentData.rollNumber}`);
            attendanceDetails = await attendanceDetails.json();
            if(attendanceDetails.length == 0){
                attendanceDetails = "No Attendance Found.";
            }
            if (subject === 'Overall') {
                const totalClasses = fullAttendanceData.reduce((sum, s) => sum + s.total, 0);
                const totalPresent = fullAttendanceData.reduce((sum, s) => sum + s.present, 0);
                const totalAbsent = totalClasses - totalPresent; // More reliable calculation
                dataToShow = { total: totalClasses, present: totalPresent, absent: totalAbsent };
                title = 'Overall Attendance';
            } else {
                dataToShow = fullAttendanceData.find(s => s.course === subject);
                title = `${subject} Attendance`;
            }
            
            if (!dataToShow) {
                attendanceSummaryContainer.innerHTML = '<p>No data available for this selection.</p>';
                return;
            }

            
            const percentage = dataToShow.total > 0 ? ((dataToShow.present / dataToShow.total) * 100) : 0;
            const formattedPercentage = percentage.toFixed(1);

            // Render the container for the chart and stats
            attendanceSummaryContainer.innerHTML = `
                <div class="attendance-display">
                    <div class="chart-container">
                        <canvas id="attendanceChart"></canvas>
                        <div class="percentage-text">${formattedPercentage}%</div>
                    </div>
                    <div class="attendance-box">
                        <h5>${title}</h5>
                        <p><span>Total Classes:</span> <span>${dataToShow.total}</span></p>
                        <p><span>Present:</span> <span>${dataToShow.present}</span></p>
                        <p><span>Absent:</span> <span>${dataToShow.absent}</span></p>
                    </div>
                </div>
                <div class="detailed-attendance-log">
                    <h4>Detailed Log</h4>
                    <div class="log-list">
                        ${displayDetailsHTML(attendanceDetails)}
                    </div>
                </div>
            `;

            // Create the new donut chart
            const chartData = {
                labels: ['Present', 'Absent'],
                datasets: [{
                    data: [dataToShow.present, dataToShow.absent],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderColor: 'var(--bg-main)',
                    borderWidth: 4,
                    hoverOffset: 4
                }]
            };
            const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            };
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            attendanceChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: chartOptions
            });
        };

        const openAttendanceModal = async () => {
            if (!attendanceModalOverlay) return;

            attendanceSummaryContainer.innerHTML = '<p>Loading attendance...</p>';
            correctionCourseSelect.innerHTML = '<option value="" disabled selected>Select a course</option>';
            attendanceSubjectFilter.innerHTML = '<option>Loading...</option>';
            openModal(attendanceModalOverlay);
            closeNav();

            try {
                const response = await fetch(`/api/student/attendance/${studentData.rollNumber}`);
                if (!response.ok) throw new Error('Could not fetch attendance data.');
                fullAttendanceData = await response.json();

                if (fullAttendanceData.length === 0) {
                    attendanceSummaryContainer.innerHTML = '<p>No attendance records found.</p>';
                    attendanceSubjectFilter.innerHTML = '<option>No Subjects</option>';
                    return;
                }

                // Populate dropdowns
                attendanceSubjectFilter.innerHTML = '<option value="Overall">Overall</option>';
                fullAttendanceData.forEach(subject => {
                    attendanceSubjectFilter.innerHTML += `<option value="${subject.course}">${subject.course}</option>`;
                    correctionCourseSelect.innerHTML += `<option value="${subject.course}">${subject.course}</option>`;
                });

                // Display initial "Overall" view
                displayAttendanceDetails('Overall');

            } catch (error) {
                console.error('Error fetching attendance:', error);
                attendanceSummaryContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
            }
        };

        if (attendanceSubjectFilter) {
            attendanceSubjectFilter.addEventListener('change', (e) => {
                const selectedSubject = e.target.value;
                displayAttendanceDetails(selectedSubject);
            });
        }

        if (attendanceCorrectionForm) {
            attendanceCorrectionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(attendanceCorrectionForm);
                formData.append('rollNumber', studentData.rollNumber);
                
                const response = await fetch('/api/student/request-attendance-correction', { method: 'POST', body: formData });
                const result = await response.json();
                alert(result.message);
                if (response.ok) attendanceCorrectionForm.reset();
            });
        }

        // --- Timetable Logic ---
        const fetchFullSchoolTimetable = async () => {
            if (schoolTimetable) return; // Already fetched

            try {
                console.log("Student Portal: Fetching timetable from server...");
                const response = await fetch('/api/timetable/all');
                const result = await response.json();

                if (!response.ok) throw new Error(result.message || 'Failed to fetch timetable.');

                if (result.exists) {
                    schoolTimetable = result.data;
                } else {
                    schoolTimetable = {}; // Set to empty to prevent re-fetching
                    alert('The school timetable has not been generated by the admin yet.');
                }
            } catch (error) {
                console.error("Student Portal: Error fetching timetable:", error);
                schoolTimetable = {};
            }
        };

        const openStudentTimetableModal = async () => {
            if (!studentTimetableModalOverlay) return;

            const studentClass = parsedCourse.branch;
            if (!studentClass) {
                alert("Your class information is not available. Cannot display timetable.");
                return;
            }

            await fetchFullSchoolTimetable();

            if (!schoolTimetable || Object.keys(schoolTimetable).length === 0) {
                // Alert was already shown in fetch function if it doesn't exist
                return;
            }

            const classTimetable = schoolTimetable[studentClass];
            studentTimetableTitle.textContent = `Timetable for ${studentClass}`;
            studentTimetableBody.innerHTML = ''; // Clear previous content

            if (!classTimetable) {
                studentTimetableBody.innerHTML = '<tr><td colspan="8">Timetable data is not available for your class.</td></tr>';
            } else {
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const today = new Date().toLocaleString('en-us', { weekday: 'long' });

                days.forEach(day => {
                    const row = document.createElement('tr');
                    if (day === today) row.classList.add('current-day-row');
                    let rowHTML = `<td>${day}</td>`;
                    for (let i = 1; i <= 6; i++) { rowHTML += `<td>${classTimetable[day]?.[i] || '---'}</td>`; }
                    row.innerHTML = rowHTML;
                    const breakCell = document.createElement('td');
                    breakCell.classList.add('break-cell'); breakCell.textContent = 'Break';
                    row.insertBefore(breakCell, row.children[5]);
                    studentTimetableBody.appendChild(row);
                });
            }
            openModal(studentTimetableModalOverlay);
            closeNav();
        };

        // --- My Courses Modal Logic ---
        const populateEnrolledCourses = () => {
            if (!enrolledCoursesContainer) return;

            let tableHTML = '<table><thead><tr><th>Course Name</th><th>Amount Paid</th></tr></thead><tbody>';
            let hasCourses = false;

            // 1. Main admission course
            if (studentData.selectedCourse && studentData.selectedCourse.trim().startsWith('{')) {
                try {
                    const mainCourse = JSON.parse(studentData.selectedCourse);
                    if (mainCourse.paymentStatus === 'paid') {
                        tableHTML += `<tr><td>${mainCourse.branch} (Admission)</td><td>₹${(mainCourse.amount / 100).toLocaleString('en-IN')}</td></tr>`;
                        hasCourses = true;
                    }
                } catch (e) { console.error("Error parsing main course", e); }
            }

            // 2. Hobby courses (from the new 'hobbyCourses' array)
            if (studentData.hobbyCourses && Array.isArray(studentData.hobbyCourses)) {
                studentData.hobbyCourses.forEach(course => {
                    tableHTML += `<tr><td>${course.name} (Hobby)</td><td>₹${(course.fee / 100).toLocaleString('en-IN')}</td></tr>`;
                    hasCourses = true;
                });
            }

            if (!hasCourses) {
                enrolledCoursesContainer.innerHTML = '<p class="no-history-message">You have not enrolled in any courses yet.</p>';
            } else {
                tableHTML += '</tbody></table>';
                enrolledCoursesContainer.innerHTML = tableHTML;
            }
        };

        const populateHobbyCourses = () => {
            if (!hobbyCoursesList) return;
            hobbyCoursesList.innerHTML = ''; // Clear list

            Object.keys(HOBBY_COURSES).forEach(key => {
                const course = HOBBY_COURSES[key];
                const radioId = `hobby-${key.replace(/\s+/g, '-')}`;

                const radioWrapper = document.createElement('label');
                radioWrapper.className = 'radio-option';
                radioWrapper.htmlFor = radioId;

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'hobby-subject';
                radioInput.value = key;
                radioInput.id = radioId;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'course-name';
                nameSpan.textContent = course.name;

                const feeSpan = document.createElement('span');
                feeSpan.className = 'course-fee';
                feeSpan.textContent = `₹${(course.fee / 100).toLocaleString('en-IN')}`;

                radioWrapper.appendChild(radioInput);
                radioWrapper.appendChild(nameSpan);
                radioWrapper.appendChild(feeSpan);

                hobbyCoursesList.appendChild(radioWrapper);
            });

            // Add click handler for highlighting
            hobbyCoursesList.addEventListener('click', (event) => {
                const targetLabel = event.target.closest('.radio-option');
                if (targetLabel) {
                    hobbyCoursesList.querySelectorAll('.radio-option').forEach(label => label.classList.remove('selected'));
                    targetLabel.classList.add('selected');
                }
            });
        };

        const openMyCoursesModal = () => {
            populateEnrolledCourses();
            // Hobby course population is now handled in its own modal
            openModal(myCoursesModalOverlay);
            closeNav();
        };

        if (sideNavMyCoursesBtn) sideNavMyCoursesBtn.addEventListener('click', (e) => { e.preventDefault(); openMyCoursesModal(); });
        if (closeMyCoursesModalBtn) closeMyCoursesModalBtn.addEventListener('click', () => closeModal(myCoursesModalOverlay));
        if (myCoursesModalOverlay) myCoursesModalOverlay.addEventListener('click', (event) => { if (event.target === myCoursesModalOverlay) closeModal(myCoursesModalOverlay); });

        // This function will now open the new modal for adding courses
        const openAddHobbyCourseModal = () => {
            populateHobbyCourses(); // Populate the list when the modal is opened
            closeModal(myCoursesModalOverlay); // Close the 'My Courses' modal
            openModal(addHobbyCourseModalOverlay); // Open the 'Add Hobby Course' modal
        };

        // --- Fee Structure Modal Logic ---
        const populateFeeStructureTable = () => {
            if (!feeStructureContainer) return;

            let tableHTML = '<table><thead><tr><th>Class</th><th>Annual Fee</th></tr></thead><tbody>';
            for (const key in CLASSES) {
                const course = CLASSES[key];
                tableHTML += `<tr><td>${course.name}</td><td>₹${(course.fee / 100).toLocaleString('en-IN')}</td></tr>`;
            }
            tableHTML += '</tbody></table>';
            feeStructureContainer.innerHTML = tableHTML;
        };

        const fetchAndDisplayModalPaymentHistory = async () => {
            if (!feeModalHistoryTableBody || !feeModalNoHistoryMessage) return;

            try {
                const response = await fetch(`/payment-history/${studentData.rollNumber}`);
                if (!response.ok) throw new Error('Failed to fetch history');
                
                const history = await response.json();
                feeModalHistoryTableBody.innerHTML = ''; // Clear previous

                if (history.length > 0) {
                    feeModalNoHistoryMessage.style.display = 'none';
                    history.forEach(record => {
                        const row = document.createElement('tr');
                        const statusClass = record.status === 'success' ? 'status-success' : 'status-failure';
                        const statusText = record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A';
                        const amountValue = parseFloat(record.amount);
                        const formattedAmount = !isNaN(amountValue) ? amountValue.toFixed(2) : '0.00';
                        const paymentDate = new Date(record.paymentDate).toLocaleDateString('en-IN');

                        row.innerHTML = `
                            <td>${record.paymentId || 'N/A'}</td>
                            <td>${record.orderId || 'N/A'}</td>
                            <td>${record.course || 'N/A'}</td>
                            <td>₹${formattedAmount}</td>
                            <td>${paymentDate}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        `;
                        feeModalHistoryTableBody.appendChild(row);
                    });
                } else {
                    feeModalNoHistoryMessage.textContent = 'No payment history found.';
                    feeModalNoHistoryMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Error fetching payment history for modal:', error);
                feeModalHistoryTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Could not load payment history.</td></tr>`;
                feeModalNoHistoryMessage.style.display = 'none';
            }
        };

        const openFeeStructureModal = () => {
            populateFeeStructureTable();
            fetchAndDisplayModalPaymentHistory();
            openModal(feeStructureModalOverlay);
            closeNav();
        };

        if (showHobbyCoursesBtn) {
            showHobbyCoursesBtn.addEventListener('click', openAddHobbyCourseModal);
        }

        if (proceedToHobbyPaymentBtn) {
            proceedToHobbyPaymentBtn.addEventListener('click', () => {
                const selectedHobbyInput = hobbyCoursesList.querySelector('input[name="hobby-subject"]:checked');
                if (!selectedHobbyInput) {
                    alert('Please select a hobby course to proceed.');
                    return;
                }
                const selectedCourseKey = selectedHobbyInput.value;
                sessionStorage.setItem('newHobbyCourse', JSON.stringify(HOBBY_COURSES[selectedCourseKey]));
                sessionStorage.setItem('navigationAllowed', 'true');
                window.location.href = 'hobby-payment.html';
            });
        }

        // --- Settings Modal Logic ---
        const openSettingsModal = () => {
            populateSettingsForm(studentData);
            openModal(settingsModalOverlay);
            closeNav();
        };
        if (sideNavSettingsBtn) {
            sideNavSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openSettingsModal();
            });
        }
        if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', () => closeModal(settingsModalOverlay));
        if (settingsModalOverlay) settingsModalOverlay.addEventListener('click', (event) => { if (event.target === settingsModalOverlay) closeModal(settingsModalOverlay); });

        // --- Payment History Modal Logic ---
        const fetchAndDisplayPaymentHistory = async () => {
            if (!historyTableBody || !noHistoryMessage) return;
            if (!studentData || !studentData.rollNumber) {
                console.error("Cannot fetch payment history: student roll number is missing from session data.");
                historyTableBody.innerHTML = '';
                noHistoryMessage.textContent = 'Could not load history (student data missing).';
                noHistoryMessage.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`/payment-history/${studentData.rollNumber}`);
                if (!response.ok) throw new Error('Failed to fetch history');
                
                const history = await response.json();

                historyTableBody.innerHTML = ''; // Clear previous entries

                if (history.length > 0) {
                    noHistoryMessage.style.display = 'none';
                    history.forEach(record => {
                        const row = document.createElement('tr');
                        // Add a class for styling based on status
                        const statusClass = record.status === 'success' ? 'status-success' : 'status-failure';
                        const statusText = record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A';

                        // Safely parse the amount to a number before formatting.
                        // The DB driver might return it as a string.
                        const amountValue = parseFloat(record.amount);
                        const formattedAmount = !isNaN(amountValue) ? amountValue.toFixed(2) : '0.00';

                        const paymentDate = new Date(record.paymentDate).toLocaleDateString('en-IN');

                        row.innerHTML = `
                            <td>${record.paymentId || 'N/A'}</td>
                            <td>${record.orderId || 'N/A'}</td>
                            <td>${record.course || 'N/A'}</td>
                            <td>₹${formattedAmount}</td>
                            <td>${paymentDate}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        `;
                        historyTableBody.appendChild(row);
                    });
                } else {
                    noHistoryMessage.textContent = 'No payment history found.';
                    noHistoryMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Error fetching payment history:', error);
                historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Could not load payment history. Please check your connection and try again.</td></tr>`;
                noHistoryMessage.style.display = 'none';
            }
        };

        const openHistoryModal = () => {
            fetchAndDisplayPaymentHistory();
            openModal(historyModalOverlay);
            closeNav();
        };

        // Listeners for opening the history modal
        if (sideNavFeeStructureBtn) {
            sideNavFeeStructureBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openFeeStructureModal();
            });
        }
        // The dashboard link listener is added after the dashboard is rendered.

        // Listeners for closing the history modal
        if (closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', () => closeModal(historyModalOverlay));
        if (historyModalOverlay) historyModalOverlay.addEventListener('click', (event) => { if (event.target === historyModalOverlay) closeModal(historyModalOverlay); });

        // --- Listener for printing payment history ---
        if (printHistoryPdfBtn) {
            printHistoryPdfBtn.addEventListener('click', () => {
                // Add a class to the body to control print styles via CSS
                document.body.classList.add('printing-modal');
                
                window.print();

                // The 'afterprint' event is more reliable than a timeout for cleanup.
                window.addEventListener('afterprint', () => {
                    document.body.classList.remove('printing-modal');
                }, { once: true }); // Ensure the listener only fires once.
            });
        }

        // Listeners for closing the My Courses modal
        if (closeMyCoursesModalBtn) closeMyCoursesModalBtn.addEventListener('click', () => closeModal(myCoursesModalOverlay));
        if (myCoursesModalOverlay) myCoursesModalOverlay.addEventListener('click', (event) => { if (event.target === myCoursesModalOverlay) closeModal(myCoursesModalOverlay); });

        // Listeners for closing the new Add Hobby Course modal
        if (closeAddHobbyCourseModalBtn) closeAddHobbyCourseModalBtn.addEventListener('click', () => closeModal(addHobbyCourseModalOverlay));
        if (addHobbyCourseModalOverlay) addHobbyCourseModalOverlay.addEventListener('click', (event) => { if (event.target === addHobbyCourseModalOverlay) closeModal(addHobbyCourseModalOverlay); });

        // Listeners for closing the new fee structure modal
        if (closeFeeStructureModalBtn) closeFeeStructureModalBtn.addEventListener('click', () => closeModal(feeStructureModalOverlay));
        if (feeStructureModalOverlay) feeStructureModalOverlay.addEventListener('click', (event) => { if (event.target === feeStructureModalOverlay) closeModal(feeStructureModalOverlay); });

        // --- Notification Detail Modal Logic ---
        const openNotificationDetailModal = (notification) => {
            if (!notificationDetailModalOverlay) return;

            let title = 'Notification Details';
            if (notification.type === 'admin_notice') {
                title = 'Notice from Admin';
            } else if (notification.type === 'new_course') {
                title = 'Course Enrollment Confirmation';
            }

            notificationDetailTitle.textContent = title;
            notificationDetailMessage.textContent = notification.message;
            notificationDetailDate.textContent = `Received: ${formatTimeAgo(notification.createdAt)}`;

            if (notificationPanel) notificationPanel.classList.remove('active'); // Close dropdown
            openModal(notificationDetailModalOverlay);
        };

        if (closeNotificationDetailModalBtn) closeNotificationDetailModalBtn.addEventListener('click', () => closeModal(notificationDetailModalOverlay));
        if (notificationDetailModalOverlay) notificationDetailModalOverlay.addEventListener('click', (event) => { if (event.target === notificationDetailModalOverlay) closeModal(notificationDetailModalOverlay); });

        // --- Attendance Modal Listeners ---
        if (closeAttendanceModalBtn) closeAttendanceModalBtn.addEventListener('click', () => closeModal(attendanceModalOverlay));
        if (attendanceModalOverlay) attendanceModalOverlay.addEventListener('click', (e) => {
            if (e.target === attendanceModalOverlay) closeModal(attendanceModalOverlay);
        });

        // --- Student Timetable Modal Listeners ---
        if (closeStudentTimetableModalBtn) {
            closeStudentTimetableModalBtn.addEventListener('click', () => closeModal(studentTimetableModalOverlay));
        }
        if (studentTimetableModalOverlay) {
            studentTimetableModalOverlay.addEventListener('click', (e) => { if (e.target === studentTimetableModalOverlay) closeModal(studentTimetableModalOverlay); });
        }

        // --- Side Navigation Action Listeners ---
        if (sideNavLogoutBtn) {
            sideNavLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.clear();
                window.location.replace('index.html');
            });
        }

        if (sideNavDashboardLink) {
            sideNavDashboardLink.addEventListener('click', (e) => {
                e.preventDefault();
                // If we are on a different view, this would bring us back.
                // For now, it just closes the nav.
                closeNav();
            });
        }

        // --- Notification Panel Logic ---
        if (notificationBtn && notificationPanel) {
            notificationBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                notificationPanel.classList.toggle('active');
                // Optional: Hide badge when panel is opened
                if (notificationBadge) notificationBadge.style.display = 'none';
            });

            // Close panel if clicking outside of it
            document.addEventListener('click', (event) => {
                if (!notificationBtn.contains(event.target) && !notificationPanel.contains(event.target)) {
                    notificationPanel.classList.remove('active');
                }
            });
        }

        // --- Notification Logic ---
        const fetchAndDisplayNotifications = async () => {
            if (!studentData || !studentData.rollNumber) return;

            try {
                const response = await fetch(`/api/notifications/${studentData.rollNumber}`);
                if (!response.ok) throw new Error('Failed to fetch notifications');
                
                let notifications = await response.json();
                studentNotifications = notifications; // Store for other functions

                // Clear existing lists
                if (notificationList) notificationList.innerHTML = '';
                if (allNotificationsList) allNotificationsList.innerHTML = '';

                const unreadCount = notifications.filter(n => !n.isRead).length;

                // Update badge
                if (notificationBadge) {
                    if (unreadCount > 0) {
                        notificationBadge.textContent = unreadCount;
                        notificationBadge.style.display = 'flex';
                    } else {
                        notificationBadge.style.display = 'none';
                    }
                }

                if (notifications.length === 0) {
                    const noNotificationHTML = '<li class="notification-item" style="justify-content: center; color: var(--text-color-light);">No notifications yet.</li>';
                    if (notificationList) notificationList.innerHTML = noNotificationHTML;
                    if (allNotificationsList) allNotificationsList.innerHTML = noNotificationHTML;
                    return;
                }

                notifications.forEach(notification => {
                    const notificationHTML = createNotificationHTML(notification);
                    if (notificationList) notificationList.insertAdjacentHTML('beforeend', notificationHTML);
                    if (allNotificationsList) allNotificationsList.insertAdjacentHTML('beforeend', notificationHTML);
                });

                // Add event listeners after populating
                document.querySelectorAll('.notification-item[data-id]').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const notificationId = item.dataset.id;
                        const notification = notifications.find(n => n.id == notificationId);
                        if (notification) {
                            handleNotificationClick(notification);
                        }
                    });
                });

            } catch (error) {
                console.error('Error fetching notifications:', error);
                if (notificationList) notificationList.innerHTML = '<li class="notification-item" style="justify-content: center; color: var(--btn-danger-bg);">Could not load.</li>';
            }
        };

        const createNotificationHTML = (notification) => {
            const isReadClass = notification.isRead ? 'read' : '';
            const timeAgo = formatTimeAgo(notification.createdAt);
            let iconClass = '';
            let icon = '🔔'; // Default icon

            switch (notification.type) {
                case 'new_course': iconClass = 'result'; icon = '🎓'; break;
                case 'fee_reminder': iconClass = 'fee'; icon = '💰'; break;
                case 'admin_notice': iconClass = 'notice'; icon = '📢'; break;
            }

            return `
                <li>
                    <a href="#" class="notification-item ${isReadClass}" data-id="${notification.id}" data-type="${notification.type}">
                        <div class="notification-icon ${iconClass}">${icon}</div>
                        <div class="notification-content">
                            <p>${notification.message}</p>
                            <small>${timeAgo}</small>
                        </div>
                    </a>
                </li>
            `;
        };

        const handleNotificationClick = async (notification) => {
            // Mark as read on the server if it's unread
            if (!notification.isRead) {
                try {
                    await fetch('/api/notifications/mark-as-read', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notificationIds: [notification.id] })
                    });

                    // Update UI immediately
                    document.querySelectorAll(`.notification-item[data-id="${notification.id}"]`).forEach(el => el.classList.add('read'));
                    notification.isRead = true; // Update local state

                    const currentCount = parseInt(notificationBadge.textContent, 10);
                    if (!isNaN(currentCount) && currentCount > 1) {
                        notificationBadge.textContent = currentCount - 1;
                    } else {
                        notificationBadge.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Failed to mark notification as read:', error);
                }
            }

            // Perform action based on type
            switch (notification.type) {
                // The user wants all notifications to open the detail view for consistency.
                case 'new_course': // This will now fall through to the default case.
                case 'admin_notice':
                default:
                    // For general notices and other types, open the detail view
                    openNotificationDetailModal(notification);
                    break;
            }
        };

        // Helper to format time
        const formatTimeAgo = (dateString) => {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);

            let interval = Math.floor(seconds / 31536000); if (interval > 1) return interval + " years ago";
            interval = Math.floor(seconds / 2592000); if (interval > 1) return interval + " months ago";
            interval = Math.floor(seconds / 86400); if (interval > 1) return interval + " days ago";
            interval = Math.floor(seconds / 3600); if (interval > 1) return interval + " hours ago";
            interval = Math.floor(seconds / 60); if (interval > 1) return interval + " minutes ago";
            return Math.floor(seconds) + " seconds ago";
        };

        // --- All Notifications Modal Logic ---
        if (viewAllNotificationsLink) {
            viewAllNotificationsLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (notificationPanel) notificationPanel.classList.remove('active'); // Close dropdown
                openModal(allNotificationsModalOverlay);
            });
        }
        if (closeAllNotificationsModalBtn) {
            closeAllNotificationsModalBtn.addEventListener('click', () => closeModal(allNotificationsModalOverlay));
        }
        if (allNotificationsModalOverlay) {
            allNotificationsModalOverlay.addEventListener('click', (event) => {
                if (event.target === allNotificationsModalOverlay) closeModal(allNotificationsModalOverlay);
            });
        }

        // Clear the proceed section before populating
        proceedSection.innerHTML = '';

        // --- Determine Application State (Selected vs. Paid) ---
        let parsedCourse = {};
        let isPaid = false;
        if (studentData.selectedCourse && studentData.selectedCourse.trim().startsWith('{')) {
            try {
                parsedCourse = JSON.parse(studentData.selectedCourse);
                if (parsedCourse.paymentStatus === 'paid') {
                    isPaid = true;
                } else {
                    // Course is selected but not paid. Set it in sessionStorage for the preview/payment pages.
                    sessionStorage.setItem('selectedCourse', studentData.selectedCourse);
                }
            } catch (e) {
                console.error("Could not parse selectedCourse from studentData", e);
            }
        }

        // --- Render Page Based on Payment Status ---
        if (isPaid) {
            // --- POST-PAYMENT VIEW (LOCKED) ---
            // --- Define Searchable Items for POST-PAYMENT view ---
            searchableItems = [
                // Re-parse the course data from the latest student object to ensure it's up-to-date.
                // This is crucial for the dashboard to render correctly after payment.
                (function() {
                    try {
                        if (studentData.selectedCourse && studentData.selectedCourse.trim().startsWith('{')) {
                            parsedCourse = JSON.parse(studentData.selectedCourse);
                        }
                    } catch (e) { console.error("Could not re-parse course data for dashboard rendering.", e); }
                })(),
                { title: 'Dashboard', keywords: 'home main', action: { type: 'function', func: () => { closeModal(searchModalOverlay); } } },
                { title: 'My Courses', keywords: 'my courses subjects enrolled', action: { type: 'function', func: openMyCoursesModal } },
                { title: 'Admission Summary', keywords: 'form details receipt', action: { type: 'link', href: 'payment-summary.html' } },
                { title: 'Attendance Details', keywords: 'present absent', action: { type: 'function', func: openAttendanceModal } },
                { title: 'Time Table', keywords: 'schedule class routine', action: { type: 'function', func: openStudentTimetableModal } },
                { title: 'Check Results', keywords: 'grades marks', action: { type: 'link', href: '#' } },
                { title: 'Library Portal', keywords: 'books issue', action: { type: 'link', href: '#' } },
                { title: 'Notices', keywords: 'announcements updates', action: { type: 'link', href: '#' } },
                { title: 'Support / Helpdesk', keywords: 'help ticket', action: { type: 'link', href: '#' } },
                { title: 'Fee Payment History', keywords: 'fee payment transaction receipt details', action: { type: 'function', func: openHistoryModal } },
                { title: 'Fee Structure', keywords: 'course fees price', action: { type: 'function', func: openFeeStructureModal } },
                { title: 'Settings', keywords: 'profile edit change password', action: { type: 'function', func: openSettingsModal } },
                { title: 'Logout', keywords: 'sign out exit', action: { type: 'function', func: () => { if(sideNavLogoutBtn) sideNavLogoutBtn.click(); } } }
            ];

            proceedSection.innerHTML = `
                <div class="dashboard-view">
                    <div class="welcome-banner">
                        <h2>Welcome, ${studentData.name || 'Student'}</h2>
                    </div>
                    <div class="student-profile-intro">
                        <img src="${studentData.profilePicture || 'default-avatar.png'}" alt="Profile Picture" class="profile-intro-pic" onerror="this.onerror=null;this.src='default-avatar.png';">
                        <h3>${studentData.name || 'Student'}</h3>
                        <p>Class: <strong>${formatClassName(parsedCourse.branch) || 'N/A'}</strong></p>
                    </div>
                    <div class="quick-links-panel">
                         <div class="quick-links-header">
                            <h4>Quick Links</h4>
                         </div>
                         <div class="quick-links-grid">
                            <a href="#" id="quickLinkMyCourses" class="quick-link-item">My Courses</a>
                            <a href="payment-summary.html" class="quick-link-item">Admission Summary</a>
                            <a href="#" id="quickLinkAttendance" class="quick-link-item">Attendance</a>
                            <a href="#" id="quickLinkTimetable" class="quick-link-item">Time Table</a>
                            <a href="#" id="quickLinkPaymentHistory" class="quick-link-item">Payment Details</a>
                            <a href="#" class="quick-link-item">Check Results</a>
                            <a href="/api/student/id-card/${studentData.rollNumber}" class="quick-link-item" download>Download ID Card</a>
                            <a href="#" class="quick-link-item">Library</a>
                        </div>
                    </div>
                </div>
            `;

            // --- New logic for Quick Links ---
            const quickLinks = document.querySelectorAll('.quick-link-item');

            quickLinks.forEach((link, index) => {
                // Determine row index (0-based, since there are 2 items per row)
                const rowIndex = Math.floor(index / 2);

                // Apply color based on whether the row is even or odd
                if (rowIndex % 2 === 0) {
                    link.classList.add('ql-dark-blue'); // For rows 1 and 3
                } else {
                    link.classList.add('ql-light-blue'); // For rows 2 and 4
                }
            });

            // --- Attach event listeners for this view ---
            const quickLinkMyCourses = document.getElementById('quickLinkMyCourses');
            if (quickLinkMyCourses) {
                quickLinkMyCourses.addEventListener('click', (e) => {
                    e.preventDefault();
                    openMyCoursesModal();
                });
            }

            const quickLinkAttendance = document.getElementById('quickLinkAttendance');
            if (quickLinkAttendance) {
                quickLinkAttendance.addEventListener('click', (e) => {
                    e.preventDefault();
                    openAttendanceModal();
                });
            }

            const quickLinkPaymentHistory = document.getElementById('quickLinkPaymentHistory');
            if (quickLinkPaymentHistory) {
                quickLinkPaymentHistory.addEventListener('click', (e) => {
                    e.preventDefault();
                    openHistoryModal();
                });
            }

            // Attach listener for the timetable quick link
            const quickLinkTimetable = document.getElementById('quickLinkTimetable');
            if (quickLinkTimetable) {
                quickLinkTimetable.addEventListener('click', (e) => {
                    e.preventDefault();
                    openStudentTimetableModal();
                });
            }
        } else {
            // --- PRE-PAYMENT VIEW (UNLOCKED) ---

            // Add the welcome banner and profile intro at the top
            proceedSection.innerHTML = `
                <div class="welcome-banner">
                    <h2>Welcome, ${studentData.name || 'Student'}</h2>
                </div>
                <div class="student-profile-intro">
                    <img src="${studentData.profilePicture || 'default-avatar.png'}" alt="Profile Picture" class="profile-intro-pic" onerror="this.onerror=null;this.src='default-avatar.png';">
                    <h3>${studentData.name || 'Student'}</h3>
                    <p>Roll No: <strong>${studentData.rollNumber || 'N/A'}</strong> | Enrollment No: <strong>${studentData.enrollmentNumber || 'N/A'}</strong></p>
                    <p>Email: ${studentData.email || 'N/A'}</p>
                    <p>Mobile: ${studentData.mobileNumber || 'N/A'}</p>
                </div>
            `;

            // --- PRE-PAYMENT VIEW (UNLOCKED) ---
            const contactDone = studentData.addressLine1 && studentData.addressLine1.trim() !== '';
            // Check for the new document fields to mark this step as done
            const documentsDone = studentData.profilePicture && studentData.signature && studentData.migrationCertificate && studentData.tcCertificate;
            // A course is considered "selected" if a valid course object (with an amount) was parsed from the student data.
            const courseSelected = !!parsedCourse.amount;

            // --- Define Searchable Items for PRE-PAYMENT view ---
            searchableItems = [
                { title: 'Dashboard', keywords: 'home main progress', action: { type: 'function', func: () => { closeModal(searchModalOverlay); } } },
                { title: 'My Courses', keywords: 'my courses subjects enrolled', action: { type: 'function', func: openMyCoursesModal } },
                { title: 'Address & Parents Detail', keywords: 'contact parent', action: { type: 'link', href: 'contact-details.html' }, enabled: true },
                { title: 'Upload Documents', keywords: 'photo signature marksheet', action: { type: 'link', href: 'document-upload.html' }, enabled: contactDone },
                { title: 'Class Selection', keywords: 'class choose admission', action: { type: 'link', href: 'course-selection.html' }, enabled: documentsDone },
                { title: 'Preview Application', keywords: 'review form', action: { type: 'link', href: 'preview.html' }, enabled: (contactDone && documentsDone && courseSelected) },
                { title: 'Fee Structure', keywords: 'course fees price', action: { type: 'function', func: openFeeStructureModal } },
                { title: 'Fee Payment History', keywords: 'fee payment transaction receipt details', action: { type: 'function', func: openHistoryModal } },
                { title: 'Settings', keywords: 'profile edit change password', action: { type: 'function', func: openSettingsModal } },
                { title: 'Logout', keywords: 'sign out exit', action: { type: 'function', func: () => { if(sideNavLogoutBtn) sideNavLogoutBtn.click(); } } }
            ];

            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'application-steps';
            stepsContainer.innerHTML = '<h4>Application Progress</h4>';

            // Step 1: Address & Parents Detail
            stepsContainer.innerHTML += createStepHTML(
                '1. Address & Parents Detail', 'Provide your address and parent information.',
                'contact-details.html', contactDone, true
            );

            // Step 2: Upload Documents (New Order)
            stepsContainer.innerHTML += createStepHTML(
                '2. Upload Documents', 'Upload your photo, signature, and marksheets.',
                'document-upload.html', documentsDone, contactDone
            );

            // Step 3: Class Selection (New Order)
            stepsContainer.innerHTML += createStepHTML(
                '3. Class Selection', 'Select the class for admission.',
                'course-selection.html', courseSelected, documentsDone
            );

            proceedSection.appendChild(stepsContainer);

            // Add the "Proceed to Preview" button only when all steps are complete
            if (contactDone && documentsDone && courseSelected) {
                const previewSection = document.createElement('div');
                previewSection.className = 'final-proceed-section';
                previewSection.innerHTML = `
                    <p>Your application form is complete. Please preview your details before payment.</p>
                    <a href="preview.html" class="submit-btn proceed-btn">Preview the Application</a>
                `;
                proceedSection.appendChild(previewSection);
            }
        }

        // --- Settings View Logic ---
        const populateDobDropdowns = () => {
            if (!settingsFields.dobDay || !settingsFields.dobMonth || !settingsFields.dobYear) return;

            // Add default options
            settingsFields.dobDay.innerHTML = '<option value="" disabled selected>Day</option>';
            settingsFields.dobMonth.innerHTML = '<option value="" disabled selected>Month</option>';
            settingsFields.dobYear.innerHTML = '<option value="" disabled selected>Year</option>';

            // Populate Days
            for (let i = 1; i <= 31; i++) {
                const option = document.createElement('option');
                option.value = String(i).padStart(2, '0');
                option.textContent = i;
                settingsFields.dobDay.appendChild(option);
            }

            // Populate Months
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = String(index + 1).padStart(2, '0');
                option.textContent = month;
                settingsFields.dobMonth.appendChild(option);
            });

            // Populate Years
            const currentYear = new Date().getFullYear();
            const startYear = 1950;
            const endYear = currentYear - 5;
            for (let i = endYear; i >= startYear; i--) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                settingsFields.dobYear.appendChild(option);
            }
        };

        function populateSettingsForm(data) {
            settingsFields.name.value = data.name || '';
            settingsFields.email.value = data.email || '';

            // --- Handle Date of Birth ---
            if (data.dob) {
                const dobDate = new Date(data.dob);
                settingsFields.dobDay.value = String(dobDate.getUTCDate()).padStart(2, '0');
                settingsFields.dobMonth.value = String(dobDate.getUTCMonth() + 1).padStart(2, '0');
                settingsFields.dobYear.value = dobDate.getUTCFullYear();
                // Make DOB fields read-only if already set
                [settingsFields.dobDay, settingsFields.dobMonth, settingsFields.dobYear].forEach(el => {
                    el.disabled = true;
                    el.setAttribute('title', 'Date of Birth cannot be changed once set.');
                });
            } else {
                settingsFields.dobDay.value = '';
                settingsFields.dobMonth.value = '';
                settingsFields.dobYear.value = '';
                // Make sure they are enabled if not set
                [settingsFields.dobDay, settingsFields.dobMonth, settingsFields.dobYear].forEach(el => {
                    el.disabled = false;
                    el.removeAttribute('title');
                });
            }

            // --- Handle Gender ---
            settingsFields.gender.value = data.gender || '';
            if (data.gender) {
                // Make Gender field read-only if already set
                settingsFields.gender.disabled = true;
                settingsFields.gender.setAttribute('title', 'Gender cannot be changed once set.');
            } else {
                settingsFields.gender.disabled = false;
                settingsFields.gender.removeAttribute('title');
            }

            if (profilePictureImg) {
                profilePictureImg.src = data.profilePicture || 'default-avatar.png';
                profilePictureImg.onerror = () => { profilePictureImg.src = 'default-avatar.png'; };
            }
        }

        if (editProfilePictureInput) {
            editProfilePictureInput.addEventListener('change', () => {
                const file = editProfilePictureInput.files[0];
                if (file) {
                    profilePictureImg.src = URL.createObjectURL(file);
                }
            });
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                if (window.confirm('Are you sure you want to save these changes?')) {
                    const formData = new FormData();
                    formData.append('rollNumber', studentData.rollNumber);

                    // --- Handle DOB ---
                    // Only process DOB if the fields are not disabled (i.e., it's being set for the first time)
                    if (!settingsFields.dobDay.disabled) {
                        let formattedDobForSave = '';
                        const day = settingsFields.dobDay.value;
                        const month = settingsFields.dobMonth.value;
                        const year = settingsFields.dobYear.value;

                        if (day && month && year) {
                            // Basic validation for date validity
                            const date = new Date(year, month - 1, day);
                            if (date.getFullYear() !== parseInt(year, 10) || date.getMonth() !== parseInt(month, 10) - 1 || date.getDate() !== parseInt(day, 10)) {
                                alert('The selected date is not a valid calendar date (e.g., Feb 30).');
                                return;
                            }
                            formattedDobForSave = `${year}-${month}-${day}`;
                            formData.append('dob', formattedDobForSave);
                        } else if (day || month || year) {
                            // If some but not all are selected
                            alert('Please select your full date of birth or leave it blank.');
                            return;
                        }
                        // If all are blank, we just don't append 'dob' to formData.
                    }

                    // --- Handle Gender ---
                    // Only process Gender if the field is not disabled
                    if (!settingsFields.gender.disabled) {
                        if (settingsFields.gender.value) {
                             formData.append('gender', settingsFields.gender.value);
                        }
                    }

                    // Handle profile picture upload
                    if (editProfilePictureInput.files[0]) {
                        formData.append('profilePicture', editProfilePictureInput.files[0]);
                    }

                    fetch('/update', {
                        method: 'POST',
                        body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.studentData) {
                            alert('Settings updated successfully!');
                            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
                            studentData = data.studentData; // Update local variable
                            populateSettingsForm(studentData); // Re-populate form to apply disabled states
                            if (sideNavAvatar) sideNavAvatar.src = studentData.profilePicture || 'default-avatar.png'; // Update side nav avatar
                            closeModal(settingsModalOverlay); // Close modal on success
                        } else {
                            throw new Error(data.message || 'Update failed.');
                        }
                    })
                    .catch(error => {
                        console.error('Error updating settings:', error);
                        alert(`Failed to update settings: ${error.message}`);
                    });
                }
            });
        }

        // Attach listener for timetable link in side nav (only works if student is paid)
        if (isPaid && sideNavTimetableLink) {
            sideNavTimetableLink.addEventListener('click', (e) => {
                e.preventDefault();
                openStudentTimetableModal();
            });
        }

        // Attach listener for attendance link in side nav (only works if student is paid)
        if (isPaid && sideNavAttendanceLink) {
            sideNavAttendanceLink.addEventListener('click', (e) => {
                e.preventDefault();
                openAttendanceModal();
            });
        }

        // --- Initial Population ---
        resetInactivityTimer(); // Start the timer on page load
        populateDobDropdowns(); // Populate the DOB dropdowns on page load
        fetchAndDisplayNotifications(); // Fetch and display notifications
    };

    // --- Navigation Helper ---
    // Sets a flag before any internal link is followed to allow the next page to load.
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Ensure it's a valid, internal link before setting the flag.
        if (link && link.href && (link.hostname === window.location.hostname || !link.hostname)) {
            // Exclude the new logout button from this logic.
            if (link.id !== 'sideNavLogoutBtn') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });

    // Run status check first, then initialize the page.
    checkServerStatus().then(initializePage);
});