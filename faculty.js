window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const facultyDataString = sessionStorage.getItem('currentFaculty');
    if (!facultyDataString) {
        // This should have been caught by the head script, but as a fallback.
        window.location.replace('faculty-login.html');
        return;
    }

    let facultyData = JSON.parse(facultyDataString);

    // --- DOM Elements ---
    const sideNavBtn = document.getElementById('sideNavBtn');
    const sideNav = document.getElementById('sideNav');
    const sideNavOverlay = document.getElementById('sideNavOverlay');
    const closeSideNavBtn = document.getElementById('closeSideNavBtn');
    const facultyLogoutBtn = document.getElementById('facultyLogoutBtn');
    const sideNavName = document.getElementById('sideNavName');
    const sideNavAvatar = document.getElementById('sideNavAvatar');

    // --- Profile Completion Modal Elements ---
    const profileCompletionModal = document.getElementById('profileCompletionModalOverlay');
    const completionForm = document.getElementById('profileCompletionForm');
    const completionName = document.getElementById('completionName');

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

    if (sideNavBtn) sideNavBtn.addEventListener('click', openNav);
    if (closeSideNavBtn) closeSideNavBtn.addEventListener('click', closeNav);
    if (sideNavOverlay) sideNavOverlay.addEventListener('click', closeNav);

    // --- Logout Logic ---
    if (facultyLogoutBtn) {
        facultyLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            window.location.replace('index.html');
        });
    }

    // --- Populate User Info ---
    const populateUserInfo = (data) => {
        if (sideNavName) sideNavName.textContent = data.name || 'Faculty';
        if (sideNavAvatar) {
            sideNavAvatar.src = data.avatar || 'default-avatar.png'; // Assuming an avatar field will be added
            sideNavAvatar.onerror = () => { sideNavAvatar.src = 'default-avatar.png'; };
        }
    };

    // --- Profile Completion Logic ---
    const handleProfileCompletion = () => {
        if (profileCompletionModal) {
            profileCompletionModal.classList.add('active');
            if (completionName) completionName.value = facultyData.name;
            populateDobDropdowns();
        }

        if (completionForm) {
            completionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formError = document.getElementById('completion-form-error');
                const passwordError = document.getElementById('completion-password-error');
                formError.textContent = '';
                passwordError.textContent = '';

                const newPassword = document.getElementById('completionNewPassword').value;
                const confirmPassword = document.getElementById('completionConfirmPassword').value;

                if (newPassword !== confirmPassword) {
                    passwordError.textContent = 'New passwords do not match.';
                    return;
                }

                const formData = new FormData(completionForm);
                const dataToSubmit = Object.fromEntries(formData.entries());
                dataToSubmit.username = facultyData.username; // Add username for identification
                
                // Combine DOB fields
                dataToSubmit.dob = `${dataToSubmit['dob-year']}-${dataToSubmit['dob-month']}-${dataToSubmit['dob-day']}`;
                delete dataToSubmit['dob-day'];
                delete dataToSubmit['dob-month'];
                delete dataToSubmit['dob-year'];

                const submitBtn = completionForm.querySelector('.submit-btn');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                try {
                    const response = await fetch('/api/faculty/complete-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSubmit)
                    });

                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || 'Failed to update profile.');

                    alert('Profile updated successfully!');
                    // Update session storage with new complete data
                    sessionStorage.setItem('currentFaculty', JSON.stringify(result.facultyData));
                    facultyData = result.facultyData; // Update local variable

                    profileCompletionModal.classList.remove('active');
                    populateUserInfo(facultyData); // Re-populate user info with new data

                } catch (error) {
                    formError.textContent = error.message;
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit and Continue';
                }
            });
        }
    };

    const populateDobDropdowns = () => {
        const daySelect = document.getElementById('completionDobDay');
        const monthSelect = document.getElementById('completionDobMonth');
        const yearSelect = document.getElementById('completionDobYear');
        if (!daySelect || !monthSelect || !yearSelect) return;

        daySelect.innerHTML = '<option value="" disabled selected>Day</option>';
        for (let i = 1; i <= 31; i++) {
            daySelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${i}</option>`;
        }

        monthSelect.innerHTML = '<option value="" disabled selected>Month</option>';
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        months.forEach((month, index) => {
            monthSelect.innerHTML += `<option value="${String(index + 1).padStart(2, '0')}">${month}</option>`;
        });

        yearSelect.innerHTML = '<option value="" disabled selected>Year</option>';
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 22; i >= currentYear - 70; i--) {
            yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
        }
    };

    // --- Initial Page Load Logic ---
    populateUserInfo(facultyData);

    if (facultyData.isProfileComplete === false) {
        // If profile is not complete, show the completion modal
        handleProfileCompletion();
    } else {
        // Profile is complete, normal dashboard operation
        console.log('Faculty profile is complete. Welcome!');
    }

    // --- Navigation Helper ---
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && (link.hostname === window.location.hostname || !link.hostname)) {
            if (link.id !== 'facultyLogoutBtn') {
                sessionStorage.setItem('navigationAllowed', 'true');
            }
        }
    });
});