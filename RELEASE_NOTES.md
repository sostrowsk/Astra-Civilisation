# Release Notes

## 21. September 2026 · Expeditionen nach Entfernung

- Bekannte und noch unentdeckte Regionen erscheinen gemeinsam nach Abstand zum Heimattal: zuerst das Heimattal, dann alle Regionen im Ring ±1, anschließend ±2 und so weiter. Diagonale Nachbarn gehören zum selben Ring.
- Bei gleichem Abstand bleibt die Reihenfolge nach Koordinaten stabil, unabhängig von der bisherigen Erkundungsreihenfolge.

## 21. September 2026 · Baumwachstum und Tagebau

- Fünf sichtbare Jungbaumstufen; erst ausgewachsene Bäume blockieren das Bauen. Reifezeit 8–15 Spielminuten, mit Försterei halbiert.
- Endliche Steinvorkommen lassen sich bevorzugt abbauen. Erschöpfte Steinbrüche weisen auf neue Tagebauaufträge hin.
- Freie Landfelder können als Tagebau beauftragt werden. Steinbrucharbeiter tragen je Schicht 20 Rohstoffe ab; maximal drei Ebenen. Vor jeder Vertiefung müssen alle acht Nachbarn auf der bisherigen Ebene liegen.
- Sichtbar abgesenkte Terrassen mit passenden Gebäude- und Bewohnerhöhen. Markierungen und Minikarte zeigen Tagebaufelder.
- Braunkohle statt Stein in 5 % der Feldschichten auf Ebene 2 und 10 % auf Ebene 3. Seedabhängig, endlich und als vorhandener Kohlerohstoff nutzbar.
- Pausieren/Fortsetzen, Lagergrenzen, reservierte Abbaumengen und Speichern/Laden werden unterstützt. Bestehende v3-Spielstände bleiben lesbar.
- **79 Tests**, TypeScript und Produktionsbuild erfolgreich. Browserprüfung mit Wachstumsstufen, Steinpriorität und terrassiertem Tagebau; Details im [QA-Protokoll](docs/QA.md).

## 20. September 2026 · Bäume gezielt fällen

- Beim Anklicken eines Baums lässt sich **Bevorzugt fällen** auswählen, um die Fläche für ein Gebäude freizumachen.
- Markierte Bäume erhalten einen goldenen Rahmen und Vorrang vor der normalen Zielsuche. Reichweite, begehbare Wege, Personal und Lagerkapazität gelten weiterhin; laufende Aufträge werden zuerst beendet.
- Das Holz wird regulär gewonnen und abtransportiert. Sobald der Baum vollständig gefällt ist, wird die Markierung entfernt und eine Meldung zur freien Fläche angezeigt.
- Die Priorität lässt sich aufheben, bleibt beim Speichern und Laden erhalten und zeigt im Auswahlfenster den aktuellen Arbeits- oder Wartegrund.
- Geprüft mit **71 erfolgreichen Tests**, TypeScript und Produktionsbuild sowie einer Browserprüfung für Auswahl, Markierung, Wartehinweis und Aufheben.

## 20. September 2026 · Wirtschaft, Handwerk und mehrere Spielstände

### Mehrere Welten und Neustart

- Über **Spielstände** mehrere benannte Partien anlegen, laden, umbenennen und nach Bestätigung löschen.
- **Neue Welt** erzeugt eine zufällige Landschaft oder verwendet einen eingegebenen Seed.
- **Neu starten** beginnt mit demselben Seed im Pionierlager als zusätzliche Partie. Die bisherige Partie bleibt erhalten.
- Automatisches Speichern alle 20 Sekunden und vor einem Wechsel; beim nächsten Öffnen wird die zuletzt gewählte Welt fortgesetzt.
- Die Übersicht zeigt Tag, Entwicklungsstufe, Bewohner, Regionen, Seed und Speicherzeit. Fehlgeschlagenes Speichern bricht einen Wechsel ab. Die aktive Partie lässt sich nicht löschen.

### Wirtschaft und Personal

- Neues **Wirtschaftsdashboard** mit Beständen, Kapazitäten, Waren unterwegs, Produktion, Verbrauch und Saldo pro Spielminute. Betriebsbedarf, Aufstiegskosten und optionale Ausrüstung erscheinen getrennt.
- Bei **Produktion = 0 und Verbrauch = 0** zeigt die Spalte **Einordnung „-“**. „Ausgeglichen“ bezeichnet ausgeglichene tatsächliche Warenflüsse.
- Lagergrenzen gelten pro Rohstoff: Lagerstandorte 100, Produktionsbetriebe meist 10 je Eingang und 20 je Ausgang, Minen 40 je Fördergut. Reservierungen berücksichtigen bereits laufende Transporte.
- Volle Ausgänge stoppen neue Produktionsaufträge. Rückgaben von Baustellen bleiben bei vollen Lagern erhalten und werden später eingelagert.
- Einstellbare Betriebspriorität und nachvollziehbare Wartegründe. Bei gleicher Priorität wird zuerst eine Stelle pro Betrieb besetzt, danach weitere Minenstellen; mindestens zwei Bewohner bleiben Träger.

### Entwicklung und Warenketten

- Fünf Zivilisationsstufen: **Pionierlager → Dorf → Viehzucht → Kleinstadt → Manufaktur**, mit Bevölkerungsgrenzen von 20, 32, 48, 96 und 128.
- Schafzucht, Weberei und Schneiderei bilden ab Viehzucht die Kette **Nahrung → Wolle → Stoff → Kleidung**.
- Die Werkstatt produziert einfache Werkzeuge aus Stein und Brettern. Die Schmiede verarbeitet Eisen und einfache Werkzeuge zu Scheren oder Bohrern. Schmelzhütte und Schmiede haben unterschiedliche Gebäudemodelle.
- Scheren ermöglichen die Schneiderei; Bohrer beschleunigen den Bergbau. Beide haben eine begrenzte Zahl von Nutzungen.
- Die Manufaktur verarbeitet Kupfer und Eisen zu Draht, Zahnrädern und Maschinenteilen. Maschinenteile beschleunigen Werkstatt, Bauernhof, Schafzucht und Weberei für eine begrenzte Zahl von Produktionszyklen.

### Vorhandene Spielstände

- Ein vorhandener v3-Spielstand wird einmalig als **Mein bisheriges Tal** übernommen. Seine ursprünglichen Speicherdaten bleiben als Rückfallkopie erhalten; Sandbox-Partien sind getrennt.
- Beim Wirtschaftsupdate werden Vorräte oberhalb der neuen Lagergrenzen einmalig entfernt. Gebäude und Bewohner bleiben erhalten; alte Kleinstadt- und Handelsstadt-Partien werden der neuen Kleinstadt zugeordnet.
- Wirtschaftsmessungen beginnen mit dem Update. Historische Warenflüsse werden nicht nachträglich geschätzt.
- Speicherung bleibt lokal im jeweiligen Browser auf dem jeweiligen Gerät, ohne Cloud-Synchronisation. Alte Testpartien der Weltversionen 1 und 2 bleiben deaktiviert.

### Geprüft

- **66 automatisierte Tests**, TypeScript-Prüfung, Produktionsbuild und GitHub Actions erfolgreich für den Funktionsstand `011dc6c`.
- Browserprüfung: neue Welt, Neustart mit gleichem Seed, Umbenennen, Wechseln, Wiederöffnen sowie Abbrechen und Bestätigen einer Löschung. Vorhandene Partie blieb erhalten.
- Weitere Nachweise und Grenzen: [QA-Protokoll](docs/QA.md).
