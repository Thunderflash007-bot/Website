// Funktion zum Abrufen und Speichern der öffentlichen IP-Adresse
async function fetchAndStoreIp() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();
        localStorage.setItem('userIp', ip);
    } catch (error) {
        console.error('Fehler beim Abrufen der IP-Adresse:', error);
    }
}

// IP-Adresse beim Laden der Seite abrufen und speichern
document.addEventListener('DOMContentLoaded', fetchAndStoreIp);
