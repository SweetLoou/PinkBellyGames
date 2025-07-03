import { socialPlatforms } from './social-platforms.js';

document.addEventListener('DOMContentLoaded', function () {
    const settingsForm = document.getElementById('settings-form');
    const logoUpload = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const socialLinksContainer = document.getElementById(
        'social-links-container'
    );
    const addSocialLinkButton =
        document.getElementById('add-social-link');
    const previewButton = document.getElementById('preview-button');
    const previewPopup = document.getElementById('preview-popup');
    const closePopupButton = document.getElementById('close-popup');

    // Load existing settings
    async function loadSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();

            if (settings.logo) {
                logoPreview.src = settings.logo;
                logoPreview.style.display = 'block';
            }

            if (settings.socials) {
                settings.socials.forEach(addSocialLinkInput);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    function addSocialLinkInput(
        link = { platform: '', username: '' }
    ) {
        const div = document.createElement('div');
        div.classList.add('social-link-group');

        const select = document.createElement('select');
        select.classList.add('social-platform');
        socialPlatforms.forEach((platform) => {
            const option = document.createElement('option');
            option.value = platform;
            option.textContent =
                platform.charAt(0).toUpperCase() +
                platform.slice(1);
            if (link.platform === platform) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        div.innerHTML = `
        <input type="text" placeholder="Username/ID" value="${link.username}" class="social-username">
        <button type="button" class="remove-social-link">Remove</button>
    `;
        div.insertBefore(select, div.firstChild);
        socialLinksContainer.appendChild(div);
        div.querySelector('.remove-social-link').addEventListener(
            'click',
            () => div.remove()
        );
    }

    addSocialLinkButton.addEventListener('click', () =>
        addSocialLinkInput()
    );

    logoUpload.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.src = e.target.result;
                logoPreview.style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    settingsForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        let anyErrors = false;

        // Handle logo upload
        const logoFile = logoUpload.files[0];
        if (logoFile) {
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
            } catch (error) {
                alert(`Logo Upload Error: ${error.message}`);
                console.error('Logo Upload Error:', error);
                anyErrors = true;
            }
        }

        // Handle social links
        const socialLinks = Array.from(
            socialLinksContainer.querySelectorAll('.social-link-group')
        )
            .map((group) => {
                const platform = group.querySelector('.social-platform').value;
                const username = group.querySelector('.social-username').value;
                return platform && username ? { platform, username } : null;
            })
            .filter(Boolean);

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ socials: socialLinks }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to save social links');
            }
        } catch (error) {
            alert(`Social Links Error: ${error.message}`);
            console.error('Social Links Error:', error);
            anyErrors = true;
        }


        if (!anyErrors) {
            alert('All settings saved successfully!');
        }
    });

    loadSettings();

    previewButton.addEventListener('click', () => {
        previewPopup.style.display = 'flex';
    });

    closePopupButton.addEventListener('click', () => {
        previewPopup.style.display = 'none';
    });

    // Close popup when clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === previewPopup) {
            previewPopup.style.display = 'none';
        }
    });
});
