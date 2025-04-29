// Funktion zum Senden von Logs an den Server
function logAction(action) {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            const logEntry = {
                ip: data.ip,
                action,
                timestamp: new Date().toISOString()
            };
            fetch('http://localhost:3000/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            }).catch(err => console.error('Fehler beim Senden des Logs:', err));
        });
}

// Logge Seitenaufrufe und Aktualisierungen
document.addEventListener('DOMContentLoaded', () => {
    logAction('Seite aufgerufen: ' + window.location.pathname);
});

// Logge Seitenwechsel
window.addEventListener('beforeunload', () => {
    logAction('Seite verlassen: ' + window.location.pathname);
});

// Logge Formularübermittlungen
const kontaktFormular = document.getElementById('kontakt-formular');
if (kontaktFormular) {
    kontaktFormular.addEventListener('submit', () => {
        logAction('Kontaktformular abgeschickt');
    });
}
