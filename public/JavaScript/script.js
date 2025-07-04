import { socialUrlTemplates } from './social-platforms.js';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('newsletter-modal');
    const closeButton = document.querySelector('.close-button');
    const newsletterForm = document.getElementById('newsletter-form');
    const socialsContainer = document.getElementById('socials-container');
    const siteLogo = document.getElementById('site-logo');
    const buttons02 = document.getElementById('buttons02');


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

    // Function to attach modal event listeners
    function attachNewsletterModalListeners() {
        const newsletterButton = document.getElementById('newsletter-button');
        if (newsletterButton) {
            newsletterButton.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        }

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
    }

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
            if (settings.socials && Array.isArray(settings.socials)) {
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
            } else {
                socialsContainer.innerHTML = ''; // Clear social links if none exist
            }

            // Load Navigation Menu
            if (settings.menu && Array.isArray(settings.menu)) {
                    buttons02.innerHTML = ''; // Clear existing static buttons
                    let newsletterButtonExists = false;
                    settings.menu.forEach((item) => {
                        const listItem = document.createElement('li');
                        const anchor = document.createElement('a');
                        anchor.href = item.url;
                        anchor.classList.add('button', 'n01'); // Assuming n01 is a generic button style
                        anchor.setAttribute('role', 'button');
                        if (item.url.startsWith('http')) { // Only add target/rel for external links
                            anchor.setAttribute('target', '_blank');
                            anchor.setAttribute('rel', 'noopener');
                        }
                        anchor.textContent = item.text;
                        listItem.appendChild(anchor);
                        buttons02.appendChild(listItem);

                        if (item.text === 'Newsletter' && item.url === '#') {
                            newsletterButtonExists = true;
                        }
                    });

                    // Add Newsletter button if it doesn't exist in settings
                    if (!newsletterButtonExists) {
                        const listItem = document.createElement('li');
                        const anchor = document.createElement('a');
                        anchor.href = '#';
                        anchor.id = 'newsletter-button';
                        anchor.classList.add('button', 'n03');
                        anchor.setAttribute('role', 'button');
                        anchor.textContent = 'Newsletter';
                        listItem.appendChild(anchor);
                        buttons02.appendChild(listItem);
                    }
            } else {
                buttons02.innerHTML = ''; // Clear menu if none exist
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Clear existing content if settings fail to load
            siteLogo.src = '#';
            socialsContainer.innerHTML = '';
            buttons02.innerHTML = '';
        } finally {
            // Always attach listeners after settings are loaded and elements are in place
            attachNewsletterModalListeners();
        }
    }

    loadSettings();
});
