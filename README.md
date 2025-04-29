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

5. **Server starten**:
   Starte den Server:
   ```bash
   npm start
   ```

6. **Website aufrufen**:
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