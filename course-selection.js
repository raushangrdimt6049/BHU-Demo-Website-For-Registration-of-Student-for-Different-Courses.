// This script should be included in course-selection.html

// --- Immediate Security Check ---
if (!sessionStorage.getItem('currentStudent')) {
    window.location.replace('login.html');
}

// Also check if previous steps have been filled first
const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
if (!studentData || !studentData.board10) {
    alert('Please complete your Academic Details first.');
    window.location.href = 'home.html';
}

// --- Course Data with Fees ---
// In a real application, this would likely come from a server API call.
const COURSES = {
    "Physics": { name: "Physics", fee: 150000 }, // ₹1,500.00
    "Chemistry": { name: "Chemistry", fee: 165000 }, // ₹1,650.00
    "Mathematics": { name: "Mathematics", fee: 145000 }, // ₹1,450.00
    "Botany": { name: "Botany", fee: 155000 }, // ₹1,550.00
    "Zoology": { name: "Zoology", fee: 155000 }, // ₹1,550.00
    "Computer Science": { name: "Computer Science", fee: 250000 }, // ₹2,500.00
    "Commerce": { name: "Commerce", fee: 120000 }, // ₹1,200.00
    "History": { name: "History", fee: 110000 }, // ₹1,100.00
    "Political Science": { name: "Political Science", fee: 110000 }, // ₹1,100.00
    "Economics": { name: "Economics", fee: 135000 }, // ₹1,350.00
    "English": { name: "English", fee: 115000 }, // ₹1,150.00
    "Hindi": { name: "Hindi", fee: 105000 }  // ₹1,050.00
};

document.addEventListener('DOMContentLoaded', () => {
    const courseForm = document.getElementById('courseSelectionForm');
    const honsSubjectContainer = document.getElementById('honsSubjectContainer');

    if (!courseForm || !honsSubjectContainer) {
        console.error('The required form or container element was not found.');
        return;
    }

    // --- Dynamically populate the course list with radio buttons ---
    Object.keys(COURSES).forEach(key => {
        const course = COURSES[key];
        const radioId = `course-${key.replace(/\s+/g, '-')}`;

        const radioWrapper = document.createElement('label');
        radioWrapper.className = 'radio-option';
        radioWrapper.htmlFor = radioId;

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = 'honsSubject';
        radioInput.value = key;
        radioInput.id = radioId;
        radioInput.required = true;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'course-name';
        nameSpan.textContent = course.name;

        const feeSpan = document.createElement('span');
        feeSpan.className = 'course-fee';
        feeSpan.textContent = `₹${(course.fee / 100).toLocaleString('en-IN')}`;

        radioWrapper.appendChild(radioInput);
        radioWrapper.appendChild(nameSpan);
        radioWrapper.appendChild(feeSpan);

        honsSubjectContainer.appendChild(radioWrapper);
    });

    // --- Highlight selected option ---
    honsSubjectContainer.addEventListener('change', (event) => {
        if (event.target.name === 'honsSubject') {
            honsSubjectContainer.querySelectorAll('.radio-option').forEach(label => {
                label.classList.remove('selected');
            });
            event.target.closest('.radio-option').classList.add('selected');
        }
    });

    courseForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedRadio = courseForm.querySelector('input[name="honsSubject"]:checked');
        if (!selectedRadio) {
            alert('Please select an Honours Subject.');
            return;
        }
        const selectedKey = selectedRadio.value;
        const selectedCourseData = COURSES[selectedKey];
        const selectedCourse = { level: "Undergraduate", branch: selectedCourseData.name, honsSubject: selectedKey, amount: selectedCourseData.fee };
        sessionStorage.setItem('selectedCourse', JSON.stringify(selectedCourse));
        alert('Course selection saved. You will now be returned to the home page to proceed.');
        window.location.href = 'home.html';
    });
});