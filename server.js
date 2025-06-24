const fs = require('fs');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');

const app = express();
const DEFAULT_PORT = process.env.PORT || 3003;

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

const port = DEFAULT_PORT;

server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});

// Fehlerbehandlung für Portkonflikte entfernen

// Umfrage hinzufügen und synchronisieren
app.post('/polls.json', (req, res) => {
    const newPoll = req.body;
    // votes und votedIps initialisieren, falls nicht vorhanden
    if (!newPoll.votes) newPoll.votes = {};
    if (!newPoll.votedIps) newPoll.votedIps = [];
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

// Umfragen aktualisieren und synchronisieren (Abstimmung)
app.put('/polls.json', (req, res) => {
    const updatedPolls = req.body;
    // Hole die IP-Adresse des Clients
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let alreadyVoted = false;
    updatedPolls.forEach(poll => {
        poll.votes = poll.votes || {};
        poll.votedIps = poll.votedIps || [];
        // Prüfe, ob die IP schon für diese Umfrage abgestimmt hat
        if (poll.votedIps.includes(clientIp)) {
            alreadyVoted = true;
        }
    });
    if (alreadyVoted) {
        return res.status(403).send('Sie haben bereits abgestimmt.');
    }
    // Wenn nicht abgestimmt, IP speichern
    updatedPolls.forEach(poll => {
        poll.votedIps = poll.votedIps || [];
        if (!poll.votedIps.includes(clientIp)) {
            poll.votedIps.push(clientIp);
        }
    });
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

// Umfrage gezielt beenden
app.put('/polls.json/end/:index', (req, res) => {
    const pollIndex = parseInt(req.params.index);
    fs.readFile(getFilePath('polls.json'), 'utf8', (err, data) => {
        if (err) return res.status(500).send('Fehler beim Lesen der Umfragen.');
        let polls = [];
        try { polls = JSON.parse(data); } catch (e) {}
        if (pollIndex < 0 || pollIndex >= polls.length) return res.status(400).send('Ungültiger Index.');
        polls[pollIndex].ended = true;
        fs.writeFile(getFilePath('polls.json'), JSON.stringify(polls, null, 2), (err) => {
            if (err) return res.status(500).send('Fehler beim Speichern.');
            io.emit('pollsUpdated', polls);
            res.status(200).send('Umfrage beendet.');
        });
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

// Endpunkt für "Über Uns" abrufen
app.get('/about.json', (req, res) => {
    fs.readFile(getFilePath('about.json'), 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.json({ aboutText: '' });
            } else {
                console.error('Fehler beim Lesen von about.json:', err);
                res.status(500).send('Fehler beim Abrufen von about.json.');
            }
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Endpunkt für "Über Uns" speichern
app.post('/about.json', (req, res) => {
    const aboutData = req.body;
    fs.writeFile(getFilePath('about.json'), JSON.stringify(aboutData, null, 2), (err) => {
        if (err) {
            console.error('Fehler beim Speichern von about.json:', err);
            res.status(500).send('Fehler beim Speichern von about.json.');
        } else {
            res.status(201).send('about.json erfolgreich gespeichert.');
        }
    });
});

// Endpunkt für Admin-E-Mail abrufen
app.get('/admin_email.json', (req, res) => {
    fs.readFile(getFilePath('admin_email.json'), 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.json({ email: '' });
            } else {
                console.error('Fehler beim Lesen von admin_email.json:', err);
                res.status(500).send('Fehler beim Abrufen von admin_email.json.');
            }
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Endpunkt für Admin-E-Mail speichern
app.post('/admin_email.json', (req, res) => {
    const emailData = req.body;
    fs.writeFile(getFilePath('admin_email.json'), JSON.stringify(emailData, null, 2), (err) => {
        if (err) {
            console.error('Fehler beim Speichern von admin_email.json:', err);
            res.status(500).send('Fehler beim Speichern von admin_email.json.');
        } else {
            res.status(201).send('admin_email.json erfolgreich gespeichert.');
        }
    });
});

// Fehlerbericht speichern
app.post('/error_reports', (req, res) => {
    const report = req.body;
    report.timestamp = new Date().toISOString();
    fs.readFile(getFilePath('error_reports.json'), 'utf8', (err, data) => {
        let reports = [];
        if (!err && data) {
            try { reports = JSON.parse(data); } catch (e) { reports = []; }
        }
        reports.push(report);
        fs.writeFile(getFilePath('error_reports.json'), JSON.stringify(reports, null, 2), (err) => {
            if (err) {
                console.error('Fehler beim Speichern des Fehlerberichts:', err);
                res.status(500).send('Fehler beim Speichern des Fehlerberichts.');
            } else {
                res.status(201).send('Fehlerbericht gespeichert.');
            }
        });
    });
});
// Fehlerberichte abrufen
app.get('/error_reports', (req, res) => {
    fs.readFile(getFilePath('error_reports.json'), 'utf8', (err, data) => {
        if (err) {
            res.json([]);
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Allgemeine Funktion zum Abrufen von JSON-Dateien (nur für .json, nach allen spezifischen Routen!)
app.get('/:file', (req, res) => {
    if (!req.params.file.endsWith('.json')) {
        return res.status(404).send('Datei nicht gefunden.');
    }
    const filePath = getFilePath(req.params.file);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.status(404).send('Datei nicht gefunden.');
            } else {
                console.error(`Fehler beim Lesen der Datei ${req.params.file}:`, err);
                res.status(500).send(`Fehler beim Abrufen der Datei ${req.params.file}.`);
            }
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Allgemeine Funktion zum Aktualisieren von JSON-Dateien (nur für .json, nach allen spezifischen Routen!)
app.post('/:file', (req, res) => {
    if (!req.params.file.endsWith('.json')) {
        return res.status(404).send('Datei nicht gefunden.');
    }
    const filePath = getFilePath(req.params.file);
    const newData = req.body;
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Datei existiert nicht, lege sie als Array mit dem neuen Eintrag an
                fs.writeFile(filePath, JSON.stringify([newData], null, 2), (err) => {
                    if (err) {
                        console.error(`Fehler beim Anlegen der Datei ${req.params.file}:`, err);
                        res.status(500).send(`Fehler beim Anlegen der Datei ${req.params.file}.`);
                    } else {
                        res.status(201).send(`Eintrag in ${req.params.file} hinzugefügt.`);
                    }
                });
            } else {
                console.error(`Fehler beim Lesen der Datei ${req.params.file}:`, err);
                res.status(500).send(`Fehler beim Aktualisieren der Datei ${req.params.file}.`);
            }
        } else {
            let jsonData = [];
            try {
                jsonData = JSON.parse(data);
            } catch (e) {
                jsonData = [];
            }
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

// Allgemeine Funktion zum Löschen von Einträgen in JSON-Dateien (nur für .json, nach allen spezifischen Routen!)
app.delete('/:file', (req, res) => {
    if (!req.params.file.endsWith('.json')) {
        return res.status(404).send('Datei nicht gefunden.');
    }
    const filePath = getFilePath(req.params.file);
    const id = req.query.id;
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.status(404).send('Datei nicht gefunden.');
            } else {
                console.error(`Fehler beim Lesen der Datei ${req.params.file}:`, err);
                res.status(500).send(`Fehler beim Löschen aus der Datei ${req.params.file}.`);
            }
        } else {
            let jsonData = [];
            try {
                jsonData = JSON.parse(data);
            } catch (e) {
                jsonData = [];
            }
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