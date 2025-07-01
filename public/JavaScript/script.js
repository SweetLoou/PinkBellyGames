document.addEventListener('DOMContentLoaded', () => {
    const newsletterButton = document.getElementById('newsletter-button');
    const modal = document.getElementById('newsletter-modal');
    const closeButton = document.querySelector('.close-button');
    const newsletterForm = document.getElementById('newsletter-form');
    const socialsContainer = document.getElementById('socials-container');
    const siteLogo = document.getElementById('site-logo');

    let supabase;

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
            const { error } = await supabase
                .from('subscribers')
                .insert([{ email: email }]);

            if (error) {
                throw error;
            }

            alert('Subscription successful!');
            modal.style.display = 'none';
            newsletterForm.reset();
        } catch (error) {
            console.error('Subscription error:', error);
            if (error.code === '23505') {
                alert('Email already subscribed.');
            } else {
                alert('An error occurred. Please try again.');
            }
        }
    });

    // Load settings
    async function loadSettings() {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value');

            if (error) {
                throw error;
            }

            const settings = data.reduce((acc, row) => {
                acc[row.key] = row.value;
                return acc;
            }, {});

            // Set Logo
            if (settings.logo) {
                siteLogo.src = settings.logo;
            }

            // Load Social Links
            if (settings.socials && settings.socials.length > 0) {
                socialsContainer.innerHTML = '';
                const socialUrlTemplates = {
                    twitter: 'https://twitter.com/{username}',
                    xtwitter: 'https://x.com/{username}',
                    github: 'https://github.com/{username}',
                    linkedin: 'https://linkedin.com/in/{username}',
                    facebook: 'https://facebook.com/{username}',
                    instagram: 'https://instagram.com/{username}',
                    discord: 'https://discord.gg/{username}',
                    youtube: 'https://youtube.com/@{username}',
                    twitch: 'https://twitch.tv/{username}',
                    patreon: 'https://patreon.com/{username}',
                    kick: 'https://kick.com/{username}',
                    kofi: 'https://ko-fi.com/{username}',
                    artstation: 'https://www.artstation.com/{username}',
                    bluesky: 'https://bsky.app/profile/{username}',
                    cruseforge:
                        'https://www.curseforge.com/members/{username}/projects',
                    deviantart: 'https://www.deviantart.com/{username}',
                    fandom: 'https://www.fandom.com/u/{username}',
                    modrinth: 'https://modrinth.com/user/{username}',
                    sketchfab: 'https://sketchfab.com/{username}',
                    snapchat: 'https://www.snapchat.com/add/{username}',
                    spotify: 'https://open.spotify.com/user/{username}',
                    teamspeak: 'ts3server://{username}',
                    telegram: 'https://t.me/{username}',
                    threads: 'https://www.threads.net/@{username}',
                    tiktok: 'https://www.tiktok.com/@{username}',
                    trello: 'https://trello.com/u/{username}',
                    tumblr: 'https://{username}.tumblr.com',
                    vk: 'https://vk.com/{username}',
                    whatsapp: 'https://wa.me/{username}',
                    wikipedia: 'https://en.wikipedia.org/wiki/User:{username}',
                    reddit: 'https://www.reddit.com/user/{username}',
                };

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

    async function initializeSupabase() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            supabase = window.supabase.createClient(
                config.supabaseUrl,
                config.supabaseKey
            );
            loadSettings(); // Initial settings load
            // logSiteVisit(); // Log the site visit
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            alert('Failed to initialize application. Please try again later.');
        }
    }

    initializeSupabase();
});
