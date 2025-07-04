document.addEventListener('DOMContentLoaded', function () {
    const logoForm = document.getElementById('logo-form');
    const logoUpload = document.getElementById('logo-upload');
    const currentLogoPreview = document.getElementById('current-logo-preview');
    const removeCurrentLogoButton = document.getElementById('remove-current-logo');
    const uploadedLogosGallery = document.getElementById('uploaded-logos-gallery');

    async function fetchCurrentLogo() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            if (settings.logo) {
                currentLogoPreview.src = settings.logo;
                currentLogoPreview.style.display = 'block';
                removeCurrentLogoButton.style.display = 'inline-block';
            } else {
                currentLogoPreview.style.display = 'none';
                removeCurrentLogoButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching current logo:', error);
        }
    }

    async function fetchUploadedLogos() {
        try {
            const response = await fetch('/api/logos');
            const logos = await response.json();
            uploadedLogosGallery.innerHTML = ''; // Clear existing logos
            logos.forEach(logo => {
                const logoItem = document.createElement('div');
                logoItem.classList.add('logo-item');
                logoItem.innerHTML = `
                    <img src="${logo.url}" alt="Uploaded Logo" data-logo-id="${logo.id}">
                    <div class="logo-actions">
                        <button type="button" class="select-logo button-secondary">Select</button>
                        <button type="button" class="delete-logo button-secondary">Delete</button>
                    </div>
                `;
                uploadedLogosGallery.appendChild(logoItem);

                logoItem.querySelector('.select-logo').addEventListener('click', () => selectLogo(logo.url));
                logoItem.querySelector('.delete-logo').addEventListener('click', () => deleteLogo(logo.id, logo.url));
            });
        } catch (error) {
            console.error('Error fetching uploaded logos:', error);
        }
    }

    async function selectLogo(logoUrl) {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ logo: logoUrl }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to select logo');
            }
            alert('Logo selected successfully!');
            fetchCurrentLogo(); // Refresh current logo display
        } catch (error) {
            alert(`Error selecting logo: ${error.message}`);
            console.error('Error selecting logo:', error);
        }
    }

    async function deleteLogo(logoId, logoUrl) {
        if (!confirm('Are you sure you want to delete this logo?')) {
            return;
        }
        try {
            const response = await fetch('/api/delete-logo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: logoId, url: logoUrl }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete logo');
            }
            alert('Logo deleted successfully!');
            fetchUploadedLogos(); // Refresh gallery
            fetchCurrentLogo(); // Refresh current logo in case it was the deleted one
        } catch (error) {
            alert(`Error deleting logo: ${error.message}`);
            console.error('Error deleting logo:', error);
        }
    }

    logoForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const logoFile = logoUpload.files[0];
        if (!logoFile) {
            alert('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('logo', logoFile);

        try {
            const response = await fetch('/api/upload-logo', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Logo upload failed');
            }
            alert('Logo uploaded successfully!');
            logoUpload.value = ''; // Clear the input
            fetchUploadedLogos(); // Refresh gallery
        } catch (error) {
            alert(`Logo Upload Error: ${error.message}`);
            console.error('Logo Upload Error:', error);
        }
    });

    removeCurrentLogoButton.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to remove the current site logo?')) {
            return;
        }
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ logo: '' }), // Set logo to empty string to remove
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to remove current logo');
            }
            alert('Current logo removed successfully!');
            fetchCurrentLogo(); // Refresh current logo display
        } catch (error) {
            alert(`Error removing current logo: ${error.message}`);
            console.error('Error removing current logo:', error);
        }
    });

    fetchCurrentLogo();
    fetchUploadedLogos();
});
