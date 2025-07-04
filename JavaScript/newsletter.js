document.addEventListener('DOMContentLoaded', function () {
    const refreshButton = document.getElementById('refresh-button');
    const csvButton = document.getElementById('csv-button');
    const subscribersList = document.getElementById('subscribers-list');

    async function fetchSubscribers() {
        try {
            const response = await fetch('/api/stats'); // Assuming /api/stats returns subscriber data
            const stats = await response.json();
            const subscribers = stats.subscribersData || []; // Assuming subscribersData is an array of subscriber objects

            subscribersList.innerHTML = ''; // Clear existing rows
            subscribers.forEach(subscriber => {
                const row = document.createElement('tr');
                const date = new Date(subscriber.subscribedAt).toLocaleString();
                row.innerHTML = `
                    <td>${subscriber.email}</td>
                    <td>${date}</td>
                `;
                subscribersList.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching subscribers:', error);
        }
    }

    refreshButton.addEventListener('click', fetchSubscribers);

    csvButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/subscribers-csv'); // New endpoint for CSV download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'subscribers.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading CSV:', error);
            alert('Failed to download CSV.');
        }
    });

    fetchSubscribers(); // Initial load
});
