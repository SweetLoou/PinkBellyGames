document.addEventListener('DOMContentLoaded', () => {
    const newsletterButton = document.getElementById('newsletter-button');
    const modal = document.getElementById('newsletter-modal');
    const closeButton = document.querySelector('.close-button');
    const newsletterForm = document.getElementById('newsletter-form');
    const socialsContainer = document.getElementById('socials-container');
    const siteLogo = document.getElementById('site-logo');

    const supabaseUrl = 'https://nabbbowykckcfsixxgws.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hYmJib3d5a2NrY2ZzaXh4Z3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMTA3MDgsImV4cCI6MjA2Njc4NjcwOH0.NRILPviKwcDE1b7cvJxjSCAJZXp_2ox80WiT35QrpNg';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
            const { data, error } = await supabase
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
                settings.socials.forEach(link => {
                    if (!link.url) return; // Skip if no URL
                    const platform = link.platform.toLowerCase();
                    const iconName = platform === 'x' ? 'xtwitter' : platform;
                    
                    const linkElement = document.createElement('a');
                    linkElement.href = link.url;
                    linkElement.classList.add('social-link');
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener';
                    linkElement.innerHTML = `
                        <img src="Pixel-Art/128x/${iconName}_icon.png" alt="${link.platform}" class="social-icon">
                        <img src="Pixel-Art/128x/${iconName}_icon_bg.png" alt="${link.platform}" class="social-icon social-icon-hover">
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
