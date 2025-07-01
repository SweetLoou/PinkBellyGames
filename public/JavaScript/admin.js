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


    let supabase;

    async function initializeSupabase() {
        try {
            if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
                throw new Error('Supabase credentials not found.');
            }
            supabase = window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_KEY
            );
            loadSettings(); // Initial settings load
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            alert(
                'Failed to initialize application. Please try again later.'
            );
        }
    }

    // Load existing settings
    async function loadSettings() {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value');

            if (error) throw error;

            const settings = data.reduce((acc, row) => {
                acc[row.key] = row.value;
                return acc;
            }, {});

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

        const platforms = [
            'youtube',
            'xtwitter',
            'twitter',
            'twitch',
            'tiktok',
            'threads',
            'telegram',
            'teamspeak',
            'spotify',
            'snapchat',
            'reddit',
            'patreon',
            'patreon2',
            'paypal',
            'kofi',
            'kick',
            'instagram',
            'github',
            'facebook',
            'discord',
            'bluesky',
            'artstation',
            'linkedin',
            'whatsapp',
            'vk',
            'tumblr',
            'trello',
            'truewallet',
            'stripe',
            'spotify',
            'sketchfab',
            'qrpayment',
            'qrcode',
            'promptpay',
            'notion',
            'modrinth',
            'minecraft',
            'microsoft',
            'google',
            'fandom',
            'domain',
            'deviantart',
            'cruseforge',
            'apple',
            'android',
            'wikipedia',
            'windows',
            'wise',
        ];

        const select = document.createElement('select');
        select.classList.add('social-platform');
        platforms.forEach((platform) => {
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
            const filePath = `logos/${Date.now()}_${logoFile.name}`;
            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from('public')
                    .upload(filePath, logoFile, { upsert: true });

            if (uploadError) {
                alert(`Logo Upload Error: ${uploadError.message}`);
                console.error('Logo Upload Error:', uploadError);
                anyErrors = true;
            } else {
                const { data: urlData } = supabase.storage
                    .from('public')
                    .getPublicUrl(uploadData.path);
                const { error: dbError } = await supabase
                    .from('settings')
                    .upsert(
                        { key: 'logo', value: urlData.publicUrl },
                        { onConflict: 'key' }
                    );

                if (dbError) {
                    alert(
                        `Database Error (Logo): ${dbError.message}`
                    );
                    console.error(
                        'Database Error (Logo):',
                        dbError
                    );
                    anyErrors = true;
                }
            }
        }

        // Handle social links
        const socialLinks = Array.from(
            socialLinksContainer.querySelectorAll(
                '.social-link-group'
            )
        )
            .map((group) => {
                const platform =
                    group.querySelector('.social-platform').value;
                const username =
                    group.querySelector('.social-username').value;
                return platform && username
                    ? { platform, username }
                    : null;
            })
            .filter(Boolean);

        const { error: socialsError } = await supabase
            .from('settings')
            .upsert(
                { key: 'socials', value: socialLinks },
                { onConflict: 'key' }
            );

        if (socialsError) {
            alert(`Social Links Error: ${socialsError.message}`);
            console.error('Social Links Error:', socialsError);
            anyErrors = true;
        }

        if (!anyErrors) {
            alert('All settings saved successfully!');
        }
    });

    initializeSupabase();

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
