// This listener handles scenarios where a page is restored from the browser's
// back-forward cache (bfcache). It forces a full reload to ensure the
// security script in the <head> always runs.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Security check: Ensure user has completed the previous step
    const studentData = JSON.parse(sessionStorage.getItem('currentStudent'));
    if (!studentData || !studentData.addressLine1) {
        alert('Please complete your Address & Parents Detail first.');
        sessionStorage.setItem('navigationAllowed', 'true');
        window.location.href = 'home.html';
        return;
    }

    const form = document.getElementById('documentUploadForm');
    const inputs = {
        profilePicture: form.querySelector('#profilePicture'),
        signature: form.querySelector('#signature'),
        migrationCertificate: form.querySelector('#migrationCertificate'),
        tcCertificate: form.querySelector('#tcCertificate'),
    };

    // --- Pre-fill form with existing documents ---
    const populateExistingDocuments = () => {
        Object.keys(inputs).forEach(fieldName => {
            if (studentData[fieldName]) {
                const input = inputs[fieldName];
                const preview = document.getElementById(`${fieldName}Preview`);
                const infoEl = input.parentElement.querySelector('.file-info');

                // This field is already filled, so it's not required to upload again
                input.required = false;

                const filePath = studentData[fieldName];
                const fileName = filePath.split('/').pop();
                
                infoEl.textContent = `Uploaded: ${fileName}`;

                if (filePath.match(/\.(jpeg|jpg|png|gif)$/i)) {
                    preview.src = filePath;
                    preview.style.display = 'block';
                }
            }
        });
    };

    const minSize = 30 * 1024; // 30 KB
    const maxSize = 200 * 1024; // 200 KB

    const handleFileChange = (event) => {
        const input = event.target;
        const file = input.files[0];
        const fieldName = input.name;
        const preview = document.getElementById(`${fieldName}Preview`);
        const errorEl = input.parentElement.querySelector('.error-message');
        const infoEl = input.parentElement.querySelector('.file-info');

        // Clear previous state
        errorEl.textContent = '';
        errorEl.style.display = 'none';
        infoEl.textContent = '';
        preview.style.display = 'none';
        preview.src = '#';

        if (!file) return;

        // Validate file size
        if (file.size < minSize || file.size > maxSize) {
            errorEl.textContent = `File size must be between 30KB and 200KB. Your file is ~${(file.size / 1024).toFixed(1)}KB.`;
            errorEl.style.display = 'block';
            input.value = ''; // Clear the invalid file selection
            return;
        }

        // Show file info
        infoEl.textContent = `Selected: ${file.name} (~${(file.size / 1024).toFixed(1)}KB)`;

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            preview.style.display = 'none';
            infoEl.textContent += ' (PDF)';
        }
    };

    Object.values(inputs).forEach(input => {
        input.addEventListener('change', handleFileChange);
    });

    populateExistingDocuments(); // Call the pre-fill function on page load

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        const formData = new FormData(form);
        formData.append('rollNumber', studentData.rollNumber);

        try {
            const response = await fetch('/upload-documents', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // Try to parse the error response as JSON, which is what our server should send.
                const errorData = await response.json().catch(() => {
                    // If it's not JSON, it's an unexpected server error (like an HTML page).
                    // This is the scenario that causes the "Unexpected token <" error.
                    throw new Error(`Server returned a non-JSON error (Status: ${response.status}). Check the server logs.`);
                });
                // If it was JSON, throw the message from the server.
                throw new Error(errorData.message || 'An unknown error occurred during upload.');
            }

            // If the response is OK, we can safely parse the success response.
            const data = await response.json();

            alert('Documents uploaded successfully!');
            sessionStorage.setItem('currentStudent', JSON.stringify(data.studentData));
            sessionStorage.setItem('navigationAllowed', 'true');
            window.location.href = 'home.html';

        } catch (error) {
            console.error('Error uploading documents:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save & Continue';
        }
    });

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