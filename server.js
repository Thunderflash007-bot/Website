const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const DEFAULT_PORT = 80;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('Ein Client hat sich verbunden.');

    socket.on('disconnect', () => {
        console.log('Ein Client hat die Verbindung getrennt.');
    });
});

const port = process.env.PORT || DEFAULT_PORT;

server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});

// Fehlerbehandlung für Portkonflikte
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} ist bereits in Verwendung. Versuche einen anderen Port...`);
        const alternativePort = port + 1;
        server.listen(alternativePort, () => {
            console.log(`Server läuft jetzt auf http://localhost:${alternativePort}`);
        });
    } else {
        console.error('Ein Serverfehler ist aufgetreten.');
    }
});

// Umfrage hinzufügen und synchronisieren
app.post('/polls.json', (req, res) => {
    const newPoll = req.body;
    fs.readFile(getFilePath('polls.json'), 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Fehler beim Lesen der Umfragen:', err);
            res.status(500).send('Fehler beim Hinzufügen der Umfrage.');
        } else {
            const polls = data ? JSON.parse(data) : [];
            polls.push(newPoll);
            fs.writeFile(getFilePath('polls.json'), JSON.stringify(polls, null, 2), (err) => {
                if (err) {
                    console.error('Fehler beim Speichern der Umfrage:', err);
                    res.status(500).send('Fehler beim Speichern der Umfrage.');
                } else {
                    io.emit('pollsUpdated', polls); // Synchronisiere Umfragen mit allen Clients
                    res.status(201).send({ message: 'Umfrage hinzugefügt.', polls });
                }
            });
        }
    });
});

// Umfragen aktualisieren und synchronisieren
app.put('/polls.json', (req, res) => {
    const updatedPolls = req.body;
    if (!Array.isArray(updatedPolls)) {
        return res.status(400).send('Ungültiges Format: Erwartet ein Array von Umfragen.');
    }
    fs.writeFile(getFilePath('polls.json'), JSON.stringify(updatedPolls, null, 2), (err) => {
        if (err) {
            console.error('Fehler beim Speichern der Umfragen:', err);
            res.status(500).send('Fehler beim Speichern der Umfragen.');
        } else {
            io.emit('pollsUpdated', updatedPolls); // Synchronisiere Umfragen mit allen Clients
            res.status(200).send('Umfragen erfolgreich aktualisiert.');
        }
    });
});

// Datenschutzerklärung abrufen
app.get('/privacy.json', (req, res) => {
    fs.readFile(getFilePath('privacy.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Datenschutzerklärung:', err);
            res.status(500).send('Fehler beim Abrufen der Datenschutzerklärung.');
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Datenschutzerklärung speichern
app.post('/privacy.json', (req, res) => {
    const newPrivacyData = req.body;

    // Überprüfe, ob die erforderlichen Felder vorhanden sind
    const requiredFields = ['intro', 'data', 'storage', 'access', 'sharing', 'rights'];
    const isValid = requiredFields.every(field => field in newPrivacyData);

    if (!isValid) {
        return res.status(400).send('Ungültige Datenstruktur für die Datenschutzerklärung.');
    }

    fs.writeFile(getFilePath('privacy.json'), JSON.stringify(newPrivacyData, null, 2), (err) => {
        if (err) {
            console.error('Fehler beim Speichern der Datenschutzerklärung:', err);
            res.status(500).send('Fehler beim Speichern der Datenschutzerklärung.');
        } else {
            res.status(201).send('Datenschutzerklärung erfolgreich gespeichert.');
        }
    });
});

// Allgemeine Funktion zum Abrufen von JSON-Dateien
app.get('/:file', (req, res) => {
    const filePath = getFilePath(req.params.file);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Fehler beim Lesen der Datei ${req.params.file}:`, err);
            res.status(500).send(`Fehler beim Abrufen der Datei ${req.params.file}.`);
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Allgemeine Funktion zum Aktualisieren von JSON-Dateien
app.post('/:file', (req, res) => {
    const filePath = getFilePath(req.params.file);
    const newData = req.body;
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Fehler beim Lesen der Datei ${req.params.file}:`, err);
            res.status(500).send(`Fehler beim Aktualisieren der Datei ${req.params.file}.`);
        } else {
            const jsonData = JSON.parse(data);
            jsonData.push(newData);
            fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error(`Fehler beim Speichern der Datei ${req.params.file}:`, err);
                    res.status(500).send(`Fehler beim Speichern der Datei ${req.params.file}.`);
                } else {
                    res.status(201).send(`Eintrag in ${req.params.file} hinzugefügt.`);
                }
            });
        }
    });
});

// Allgemeine Funktion zum Löschen von Einträgen in JSON-Dateien
app.delete('/:file', (req, res) => {
    const filePath = getFilePath(req.params.file);
    const id = req.query.id;
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Fehler beim Lesen der Datei ${req.params.file}:`, err);
            res.status(500).send(`Fehler beim Löschen aus der Datei ${req.params.file}.`);
        } else {
            const jsonData = JSON.parse(data);
            const updatedData = jsonData.filter(item => item.id !== id);
            fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), (err) => {
                if (err) {
                    console.error(`Fehler beim Speichern der Datei ${req.params.file}:`, err);
                    res.status(500).send(`Fehler beim Löschen aus der Datei ${req.params.file}.`);
                } else {
                    res.status(200).send(`Eintrag aus ${req.params.file} gelöscht.`);
                }
            });
        }
    });
});

// Synchronisierungs-Endpunkt für alle Seiten
app.post('/sync', (req, res) => {
    try {
        const data = req.body; // Daten, die synchronisiert werden sollen
        io.emit('syncData', data); // Sende die Daten an alle verbundenen Clients
        console.log('Synchronisierung ausgelöst:', data);
        res.status(200).send('Synchronisierung erfolgreich.');
    } catch (error) {
        console.error('Fehler bei der Synchronisierung:', error);
        res.status(500).send('Fehler bei der Synchronisierung.');
    }
});

// Aktualisieren der allowed_ips.json
app.post('/allowed_ips.json', (req, res) => {
    const newIps = req.body;
    fs.writeFile(getFilePath('allowed_ips.json'), JSON.stringify(newIps, null, 2), (err) => {
        if (err) {
            console.error('Fehler beim Speichern der allowed_ips.json:', err);
            res.status(500).send('Fehler beim Speichern der allowed_ips.json.');
        } else {
            res.status(201).send('allowed_ips.json erfolgreich aktualisiert.');
        }
    });
});

// Neuigkeit hinzufügen
app.post('/news.json', (req, res) => {
    const newNewsItem = req.body;
    fs.readFile(getFilePath('news.json'), 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Fehler beim Lesen der Neuigkeiten:', err);
            res.status(500).send('Fehler beim Hinzufügen der Neuigkeit.');
        } else {
            const news = data ? JSON.parse(data) : [];
            news.push(newNewsItem);
            fs.writeFile(getFilePath('news.json'), JSON.stringify(news, null, 2), (err) => {
                if (err) {
                    console.error('Fehler beim Speichern der Neuigkeit:', err);
                    res.status(500).send('Fehler beim Speichern der Neuigkeit.');
                } else {
                    res.status(201).send('Neuigkeit hinzugefügt.');
                }
            });
        }
    });
});

// Funktion zum Ermitteln des Dateipfads
function getFilePath(fileName) {
    return path.join(__dirname, fileName);
}