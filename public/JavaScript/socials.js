import { socialPlatforms } from './social-platforms.js';

document.addEventListener('DOMContentLoaded', function () {
    const socialsForm = document.getElementById('socials-form');
    const socialLinksContainer = document.getElementById('social-links-container');
    const addSocialLinkButton = document.getElementById('add-social-link');

    async function loadSocialSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            if (settings.socials && Array.isArray(settings.socials)) {
                socialLinksContainer.innerHTML = ''; // Clear existing
                settings.socials.forEach(addSocialLinkInput);
            }
        } catch (error) {
            console.error('Error loading social settings:', error);
            socialLinksContainer.innerHTML = ''; // Initialize with default empty values
        }
    }

    function addSocialLinkInput(link = { platform: '', username: '' }) {
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

    addSocialLinkButton.addEventListener('click', () => addSocialLinkInput());

    socialsForm.addEventListener('submit', async function (e) {
        e.preventDefault();

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
            alert('Social links saved successfully!');
        } catch (error) {
            alert(`Social Links Save Error: ${error.message}`);
            console.error('Social Links Save Error:', error);
        }
    });

    loadSocialSettings();
});
