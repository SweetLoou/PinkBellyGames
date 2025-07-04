document.addEventListener('DOMContentLoaded', function () {
    const navigationForm = document.getElementById('navigation-form');
    const menuLinksContainer = document.getElementById('menu-links-container');
    const addMenuLinkButton = document.getElementById('add-menu-link');

    async function loadNavigationSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            if (settings.menu && Array.isArray(settings.menu)) {
                menuLinksContainer.innerHTML = ''; // Clear existing
                settings.menu.forEach(addMenuLinkInput);
            }
        } catch (error) {
            console.error('Error loading navigation settings:', error);
            menuLinksContainer.innerHTML = ''; // Initialize with default empty values
        }
    }

    function addMenuLinkInput(link = { text: '', url: '' }) {
        const div = document.createElement('div');
        div.classList.add('menu-link-group');
        div.innerHTML = `
            <input type="text" placeholder="Button Text" value="${link.text}" class="menu-text">
            <input type="url" placeholder="Button URL" value="${link.url}" class="menu-url">
            <button type="button" class="remove-menu-link">Remove</button>
        `;
        menuLinksContainer.appendChild(div);
        div.querySelector('.remove-menu-link').addEventListener('click', () => div.remove());
    }

    addMenuLinkButton.addEventListener('click', () => addMenuLinkInput());

    navigationForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const menuLinks = Array.from(
            menuLinksContainer.querySelectorAll('.menu-link-group')
        )
            .map((group) => {
                const text = group.querySelector('.menu-text').value;
                const url = group.querySelector('.menu-url').value;
                return text && url ? { text, url } : null;
            })
            .filter(Boolean);

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ menu: menuLinks }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to save navigation settings');
            }
            alert('Navigation settings saved successfully!');
        } catch (error) {
            alert(`Navigation Save Error: ${error.message}`);
            console.error('Navigation Save Error:', error);
        }
    });

    loadNavigationSettings();
});
