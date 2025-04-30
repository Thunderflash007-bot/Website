# Website

## Voraussetzungen

1. **Node.js**: Stelle sicher, dass Node.js und npm auf dem Server installiert sind.
   ```bash
   sudo apt update
   sudo apt install nodejs npm -y
   ```

2. **SSH-Zugang**: Stelle sicher, dass du SSH-Zugang zum Server hast.

## Schritte zum Starten der Website

1. **Per SSH verbinden**:
   Verbinde dich per SSH mit deinem Server:
   ```bash
   ssh benutzername@server-ip
   ```

2. **Projekt auf den Server kopieren**:
   Kopiere die Projektdateien auf den Server (falls noch nicht vorhanden):
   ```bash
   scp -r /lokaler/pfad/zum/projekt benutzername@server-ip:/ziel/pfad
   ```

3. **In das Projektverzeichnis wechseln**:
   ```bash
   cd /ziel/pfad
   ```

4. **Abhängigkeiten installieren**:
   Installiere die benötigten Node.js-Abhängigkeiten:
   ```bash
   npm install
   ```

5. **SSL-Zertifikat generieren**:
   Falls noch kein SSL-Zertifikat vorhanden ist, generiere ein selbstsigniertes Zertifikat:
   ```bash
   npm run generate-ssl
   ```

6. **Server starten**:
   Starte den Server:
   ```bash
   npm start
   ```

7. **Website aufrufen**:
   Öffne einen Browser und rufe die Website auf:
   ```
   http://server-ip:8081
   ```

## Hinweise

- Stelle sicher, dass die Ports `8081` und `3001` in der Firewall des Servers geöffnet sind.
- Um den Server dauerhaft laufen zu lassen, kannst du `screen` oder `tmux` verwenden:
  ```bash
  screen -S website
  npm start
  ```
  Drücke `Ctrl+A` gefolgt von `D`, um die Sitzung zu trennen.

## Nutzung der Website

1. **Startseite**:
   - Zeigt eine Übersicht der Projekte und Neuigkeiten.
   - Zugriff auf den Admin-Bereich (falls verifiziert).

2. **Admin-Bereich**:
   - Verwalte Projekte, Umfragen und Neuigkeiten.
   - Bearbeite die Datenschutzerklärung und andere Einstellungen.

3. **Umfragen**:
   - Nimm an Umfragen teil und sieh dir die Ergebnisse an.

4. **Datenschutzerklärung**:
   - Zeigt die Datenschutzerklärung der Website an.

5. **Kontaktformular**:
   - Sende Nachrichten über das Kontaktformular.

6. **Ränge kaufen**:
   - Zeigt verfügbare Ränge und ermöglicht den Kauf.

## SSL-Zertifikat

Das SSL-Zertifikat wird mit folgendem Befehl generiert:
```bash
npm run generate-ssl
```
Die Dateien `key.pem` und `cert.pem` werden im Projektverzeichnis erstellt.