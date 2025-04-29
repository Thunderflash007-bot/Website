const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const DEFAULT_PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const port = process.env.PORT || DEFAULT_PORT;

const server = app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});

// Fehlerbehandlung für Portkonflikte
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} ist bereits in Verwendung. Versuche einen anderen Port...`);
        const alternativePort = port + 1;
        app.listen(alternativePort, () => {
            console.log(`Server läuft jetzt auf http://localhost:${alternativePort}`);
        });
    } else {
        console.error('Ein Serverfehler ist aufgetreten.');
    }
});

// Projekte abrufen
app.get('/projects.json', (req, res) => {
    fs.readFile('./projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Projekte:', err);
            res.status(500).send('Fehler beim Abrufen der Projekte.');
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Projekt hinzufügen
app.post('/projects.json', (req, res) => {
    const newProject = req.body;
    fs.readFile('./projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Projekte:', err);
            res.status(500).send('Fehler beim Hinzufügen des Projekts.');
        } else {
            const projects = JSON.parse(data);
            projects.push(newProject);
            fs.writeFile('./projects.json', JSON.stringify(projects, null, 2), (err) => {
                if (err) {
                    console.error('Fehler beim Speichern des Projekts:', err);
                    res.status(500).send('Fehler beim Speichern des Projekts.');
                } else {
                    res.status(201).send('Projekt hinzugefügt.');
                }
            });
        }
    });
});

// Projekt löschen
app.delete('/projects.json', (req, res) => {
    const projectId = req.query.id;
    fs.readFile('./projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Projekte:', err);
            res.status(500).send('Fehler beim Löschen des Projekts.');
        } else {
            const projects = JSON.parse(data);
            const updatedProjects = projects.filter(project => project.id !== projectId);
            fs.writeFile('./projects.json', JSON.stringify(updatedProjects, null, 2), (err) => {
                if (err) {
                    console.error('Fehler beim Speichern der Projekte:', err);
                    res.status(500).send('Fehler beim Löschen des Projekts.');
                } else {
                    res.status(200).send('Projekt gelöscht.');
                }
            });
        }
    });
});

// Allgemeine Funktion zum Abrufen von JSON-Dateien
app.get('/:file', (req, res) => {
    const filePath = `./${req.params.file}`;
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
    const filePath = `./${req.params.file}`;
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
    const filePath = `./${req.params.file}`;
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