document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('newsletter-modal');
    const newsletterButton = document.getElementById('newsletter-button');
    const closeButton = document.querySelector('.close-button');
    const newsletterForm = document.getElementById('newsletter-form');

    newsletterButton.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        alert(`Thank you for subscribing with ${emailInput.value}`);
        emailInput.value = '';
        modal.style.display = 'none';
    });
});
