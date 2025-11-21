// IMPORTANT: Replace with your actual Firebase project configuration.
// This configuration is for the client-side and is safe to be public.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/**
 * Fetches the main timetable data from Firestore and populates the table.
 */
async function loadMainTimetable() {
    const timetableContainer = document.querySelector('.timetable-container');
    if (!timetableContainer) {
        console.error('Timetable container not found on this page.');
        return;
    }

    try {
        // For the landing page, we'll fetch the timetable for a default class, e.g., 'Class 9'.
        // This can be changed to any other default class.
        const defaultClass = 'Class 9';
        const docRef = db.collection('timetables').doc(defaultClass);
        const docSnap = await docRef.get();

        if (docSnap.exists()) {
            const timetableData = docSnap.data();
            
            // Define standard days and time slots based on your requirements.
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const timeSlots = [
                "09:00-09:40", "09:40-10:20", "10:20-11:00", "11:00-11:40", 
                "12:00-12:40", "12:40-13:20"
            ];

            // Build table HTML
            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Day/Time</th>
                            ${timeSlots.slice(0, 4).map(slot => `<th>${slot}</th>`).join('')}
                            <th class="break-cell" style="background-color: var(--readonly-bg);">Break<br><small>(11:40-12:00)</small></th>
                            ${timeSlots.slice(4).map(slot => `<th>${slot}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
            `;

            days.forEach(day => {
                tableHTML += `<tr><th>${day}</th>`; // Day header
                const daySchedule = timetableData.schedule?.[day] || {};
                // Periods before break
                timeSlots.slice(0, 4).forEach(slot => tableHTML += `<td>${daySchedule[slot] || '---'}</td>`);
                // Break cell
                tableHTML += `<td class="break-cell" style="background-color: var(--readonly-bg);">---</td>`;
                // Periods after break
                timeSlots.slice(4).forEach(slot => tableHTML += `<td>${daySchedule[slot] || '---'}</td>`);
                tableHTML += `</tr>`;
            });

            tableHTML += `</tbody></table>`;
            timetableContainer.innerHTML = tableHTML;
        } else {
            console.log(`No timetable data found in Firestore for document: ${defaultClass}. Displaying placeholder.`);
            // The placeholder from index.html will be shown.
        }
    } catch (error) {
        console.error("Error fetching timetable: ", error);
        timetableContainer.innerHTML = '<p style="text-align: center; color: red;">Could not load timetable. Please try again later.</p>';
    }
}

// Load the timetable when the document is ready.
document.addEventListener('DOMContentLoaded', loadMainTimetable);