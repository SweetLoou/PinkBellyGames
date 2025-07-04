document.addEventListener('DOMContentLoaded', function () {
    const visitorsCountElement = document.getElementById('visitors-count');
    const subscribersCountElement = document.getElementById('subscribers-count');

    // Function to fetch and display stats
    async function fetchStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            if (visitorsCountElement) {
                visitorsCountElement.textContent = stats.visitors;
            }
            if (subscribersCountElement) {
                subscribersCountElement.textContent = stats.subscribers;
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    fetchStats(); // Fetch stats on page load
});
