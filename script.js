// Funktion zum Abrufen der Geräte-ID
async function fetchDeviceId() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();
        return `device-${ip}`; // Beispiel: Geräte-ID basierend auf der IP-Adresse
    } catch (error) {
        console.error('Fehler beim Abrufen der Geräte-ID:', error);
        return null;
    }
}

// Funktion zum Generieren und Speichern der Geräte-ID
function generateAndStoreDeviceId() {
    if (!localStorage.getItem('deviceId')) {
        const deviceId = '12345-ABCDE'; // Beispiel-Geräte-ID
        localStorage.setItem('deviceId', deviceId);
    }
}

function isDeviceVerified() {
    const userDeviceId = localStorage.getItem('deviceId');
    const verifiedDeviceId = localStorage.getItem('verifiedDeviceId');
    return userDeviceId === verifiedDeviceId;
}

function showAdminLink() {
    const userDeviceId = localStorage.getItem('deviceId');
    const verifiedDeviceId = localStorage.getItem('verifiedDeviceId');
    if (userDeviceId === verifiedDeviceId) {
        document.getElementById('admin-link').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', showAdminLink);

const socket = io();

// Synchronisierungsdaten empfangen und anwenden
socket.on('syncData', (data) => {
    console.log('Synchronisierte Daten empfangen:', data);
    // Hier kannst du die empfangenen Daten anwenden, z. B. Seiteninhalte aktualisieren
    if (data.type === 'updateProjects') {
        fetchProjects(); // Aktualisiere die Projekte
    } else if (data.type === 'updateNews') {
        fetchNews(); // Aktualisiere die Neuigkeiten
    }
});
