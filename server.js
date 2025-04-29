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
        console.error('Serverfehler:', err);
    }
});