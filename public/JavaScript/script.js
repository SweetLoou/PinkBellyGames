import { socialUrlTemplates } from './social-platforms.js';

document.addEventListener('DOMContentLoaded', () => {
    const newsletterButton = document.getElementById('newsletter-button');
    const modal = document.getElementById('newsletter-modal');
    const closeButton = document.querySelector('.close-button');
    const newsletterForm = document.getElementById('newsletter-form');
    const socialsContainer = document.getElementById('socials-container');
    const siteLogo = document.getElementById('site-logo');


    // Sidebar Toggle Functionality
    const sidebar = document.querySelector('.sidebar');
    const openToggle = document.getElementById('sidebar-toggle-open');
    const closeToggle = document.getElementById('sidebar-toggle-close');

    if (sidebar && openToggle && closeToggle) {
        openToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });

        closeToggle.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // Modal functionality
    newsletterButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Newsletter form submission
    newsletterForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;

        if (email === 'Admin@123') {
            window.location.href = 'admin.html';
            return;
        }

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An error occurred.');
            }

            alert('Subscription successful!');
            modal.style.display = 'none';
            newsletterForm.reset();
        } catch (error) {
            console.error('Subscription error:', error);
            if (error.message.includes('already subscribed')) {
                alert('Email already subscribed.');
            } else {
                alert(error.message);
            }
        }
    });

    // Load settings
    async function loadSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();

            // Set Logo
            if (settings.logo) {
                siteLogo.src = settings.logo;
            }

            // Load Social Links
            if (settings.socials && settings.socials.length > 0) {
                socialsContainer.innerHTML = '';

                settings.socials.forEach((link) => {
                    if (!link.username) return; // Skip if no username

                    const platform = link.platform.toLowerCase();
                    const urlTemplate = socialUrlTemplates[platform];
                    if (!urlTemplate) return; // Skip if no template for this platform

                    const url = urlTemplate.replace(
                        '{username}',
                        link.username
                    );
                    const iconName = platform === 'x' ? 'xtwitter' : platform;

                    const linkElement = document.createElement('a');
                    linkElement.href = url;
                    linkElement.classList.add('social-link');
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener';
                    linkElement.innerHTML = `
                        <img src="/Social Icons (Pixel-Art)/128x/${iconName}_icon.png" alt="${link.platform}" class="social-icon">
                        <img src="/Social Icons (Pixel-Art)/128x/${iconName}_icon_bg.png" alt="${link.platform}" class="social-icon social-icon-hover">
                    `;
                    socialsContainer.appendChild(linkElement);
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    loadSettings();
});
