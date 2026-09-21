# Release Notes

## 21. September 2026 · Ruhiger Nebelübergang am Kartenrand

- Der zusätzliche Rand von drei Feldern geht gleichmäßig in die Hintergrundfarbe über. Die 30 vollständig sichtbaren Felder bleiben erhalten.
- Blickdichte Blockflächen ersetzen die Einzeltransparenz: verdeckte Seiten scheinen nicht mehr durch, dunkle Überlagerungen und Gittermuster entfallen. Der separate leuchtende Ring wurde entfernt.
- Passende Hintergrundfarben an der Oberfläche und unter Tage. 110 Tests und Produktionsbuild erfolgreich; visuelle Prüfung bei mehreren Zoomstufen.

## 21. September 2026 · Drei zusätzliche Felder statt Bildschirmpixel

- Korrektur des Lichtsaums: 30 Felder bleiben vollständig sichtbar, weitere drei Felder bilden den weich abgedunkelten Übergang bis Radius 33. Bei kleinen Welten wird der zusätzliche Saum ebenfalls zum vorhandenen Kern addiert.
- Die Breite wird in Spielfeldern berechnet und skaliert mit dem Zoom. Die Fokusgrenze bleibt am bisherigen Kern; vorhandene zusätzliche Randfelder sind auswählbar und bebaubar.
- 110 Tests und Produktionsbuild erfolgreich. Regressionstest bestätigt den Erhalt aller bisherigen Felder und den zusätzlichen Radius. Sichtprüfung im Browser ohne Shaderfehler.

## 21. September 2026 · Weicher Lichtsaum am Sichtkreis

- Der Sichtkreis erhält einen zusätzlichen, drei Bildschirmpixel breiten Rand: Gelände, Wasser, Gebäude und Bewohner werden nach außen dunkler und blenden weich aus, wie am Rand eines Taschenlampenkegels.
- Die Breite bleibt beim Zoomen und auf Retina-Displays gleich. Ein dezenter Lichtsaum darf über die erkundete Kartengrenze hinauslaufen; die Fokusbegrenzung richtet sich weiterhin nach dem vollständig sichtbaren Kern.
- Gilt an der Oberfläche und unter Tage. Keine schwebenden Schatten oder Bewohnerlabels außerhalb des Sichtbereichs. 109 Tests, Produktionsbuild und visuelle Browserprüfung erfolgreich.

## 21. September 2026 · Fokus innerhalb der erkundeten Welt

- Der Kamerafokus hält ausreichend Abstand zu Kartenrändern, fehlenden Regionen und Ecken, damit der Sichtkreis vollständig auf erkundetem Gelände liegt. Die Begrenzung gilt für Maus, Tastatur, Übersichtskarte und Regionssprünge, auch unter Tage.
- Wo ein Kreis mit 30 Feldern Radius nicht hineinpasst, wird der größte vollständig passende Kreis verwendet. Neue Expeditionen aktualisieren die Grenzen automatisch. Zoom und Kamerawinkel bleiben beim Begrenzen erhalten.
- 109 Tests und Produktionsbuild erfolgreich. Kartenränder, konkave Grenzen, Löcher, kleine Welten und Erweiterungen geprüft; Browserprüfung beim wiederholten Ziehen über den Kartenrand.

## 21. September 2026 · Sichtbereich von 30 Feldern

- Die 3D-Ansicht ist auf 30 Felder Radius um das aktuelle Fokusfeld der Kamera begrenzt. Gelände, Wasser, Gebäude und Bewohner außerhalb dieses Bereichs werden ausgeblendet; verborgene Bewohner werden nicht animiert.
- Der Bereich folgt der Kamera beim Ziehen, bei Tastaturbewegung und beim Zentrieren auf Regionen. Gilt auch unter Tage, einschließlich Schächten und Abbaumarkierungen. Nur dargestellte Felder lassen sich in der 3D-Ansicht anklicken.
- Die Übersichtskarte zeigt weiterhin alle entdeckten Regionen. Produktion, Transporte und gespeicherte Weltdaten bleiben unabhängig vom Sichtbereich aktiv.
- 106 Tests erfolgreich; Kreisgrenze, negative Koordinaten, Regionsübergänge und Erhalt der Weltdaten geprüft. Browserprüfung mit 25 Regionen und Produktionsbuild erfolgreich.

## 21. September 2026 · Rezeptauswahl während laufender Arbeit

- Kupfer, Eisen und Gold lassen sich in der Schmelzhütte jederzeit auswählen. Das Dropdown wird während Produktion und Transport nicht mehr gesperrt. Die gleiche Korrektur gilt für Schmiede, Akademie und Manufaktur.
- Ein Rezeptwechsel während eines laufenden Auftrags wird vorgemerkt und vor dem nächsten Auftrag übernommen. Bereits verbrauchte Zutaten erzeugen weiterhin das ursprünglich bestellte Produkt in der richtigen Menge. Erneute Auswahl ersetzt oder widerruft den vorgemerkten Wechsel.
- Der Inspektor zeigt das eingestellte beziehungsweise vorgemerkte Rezept. Änderungen werden unmittelbar gespeichert; vorgemerkte Wechsel bleiben beim Laden erhalten.
- 104 Tests und Produktionsbuild erfolgreich. Regressionstests für laufende Produktion, Zutatenlieferung, Speichern/Laden und alle vier Rezeptbetriebe. Kupferauswahl und sichtbare Übernahme im Browser geprüft.

## 21. September 2026 · Kartenfokus mit linker Maustaste verschieben

- Mit gedrückter linker Maustaste lässt sich die Kartenansicht über die Geländeebene verschieben, an der Oberfläche und unter Tage. Rechtsziehen dreht weiterhin die Kamera.
- Kurze Linksklicks wählen oder bauen weiterhin. Eine Ziehbewegung löst beim Loslassen keinen Bau- oder Auswahlklick aus, auch nach Rückkehr zum Ausgangspunkt. Abgebrochene Mausgesten werden zurückgesetzt.
- Greifcursor beim Ziehen; Steuerungshinweise und Hilfe aktualisiert. Browserprüfung von Kamerabewegung, Gebäudeauswahl und Ziehen im Baumodus erfolgreich, ohne Konsolenfehler. Produktionsbuild erfolgreich.

## 21. September 2026 · Außenposten nach der ersten Expedition

- Außenposten sind zu Spielbeginn gesperrt und werden erst mit der ersten erfolgreich gestarteten Expedition freigeschaltet. Bauleiste, Tastenkürzel und Platzierungsprüfung beachten dieselbe Regel.
- Für die erste Expedition ist kein Außenposten nötig. Auch der Aufstieg zum Dorf benötigt nur noch die fünf übrigen Pioniergebäudetypen sowie Bewohner und Vorräte.
- Aufgabenliste, Bauhinweise und Spielhilfe führen zuerst zur Expedition und anschließend zum Außenposten. Bestehende Erkundungen werden automatisch erkannt; kein Zurücksetzen von Spielständen nötig.
- 101 Tests und Produktionsbuild erfolgreich. Regulärer Einstieg ohne Ressourcen-Cheats, Speichern/Laden und Freischaltung über den Expeditionsdialog im Browser geprüft.

## 21. September 2026 · Lokale Siedlungen, Händler und Fuhrpark

- Normale Bewohner bleiben im Bereich von neun Feldern je Richtung um ihren Heimatort. Arbeitswege und Umwege beachten die Grenze; Transporte zwischen Orten übernehmen ausschließlich Händler.
- Jedes Lagerhaus erhält vier eigene Händler und vier zusätzliche Wohnplätze. Händler werden nicht für Produktion oder Bergbau eingesetzt. Entfernte Baustellen, Betriebe und Lager werden automatisch versorgt.
- Zu Fuß: zwei Waren. Ab Viehzucht: ein Pferdekarren mit acht Waren je Lagerhaus. Ab Kleinstadt: zusätzlich eine Kutsche mit 16 Waren. Höchstens ein Fahrzeug jeder Art pro Lagerhaus; bis zur Rückkehr am Heimatlager belegt.
- Eigene Voxelmodelle für Pferdekarren und Kutsche mit bewegten Rädern und Pferdebeinen. Lagerfenster zeigen Händler, Ladungen und Fahrzeugbelegung; das Wirtschafts-Dashboard weist Händler getrennt aus.
- Bestehende Spielstände werden um Wohnorte und Händler ergänzt. Abriss und Baustellenabbruch erhalten Ladungen; Händler aus abgerissenen Lagern werden bei Neubauten wieder eingesetzt.
- 100 Tests erfolgreich, einschließlich lokaler Wege, getrennter Siedlungen, Ladungsgrößen, Fuhrparkreservierungen, Rückfahrten, Migration und Abriss. Browserprüfung von Fahrzeugen, vier Lagerhändlern und Wirtschaftsübersicht; TypeScript und Produktionsbuild erfolgreich.

## 21. September 2026 · Holzfäller und Steinbrucharbeiter animiert

- Holzfäller holen sichtbar mit einer Axt aus und schlagen zum Baum hin; Steinbrucharbeiter verwenden eine Spitzhacke. Auch im Tagebau wird nach unten geschlagen.
- Bewegte Arme, leichtes Vorbeugen sowie Holz- und Steinsplitter zeigen die laufende Arbeit. Beim Anmarsch, Rücktransport und Warten endet die Arbeitsanimation.
- Animationen folgen der Spielzeit: Pause hält sie an, höhere Geschwindigkeit beschleunigt sie. Abbauraten und Transportwege bleiben unverändert.
- Browserprüfung in isolierter Arbeiterszene, 89 bestehende Tests und Produktionsbuild erfolgreich.

## 21. September 2026 · Alle Gebäudetypen abreißen

- Abriss jetzt auch für Gründungslager, aktive Minen und benutzte oder einzige Brücken. Die Abrissschaltfläche steht direkt über dem Warenbestand, ohne langes Scrollen.
- Bergleute werden samt Ladung an die Oberfläche geholt. Bewohner auf abgerissenen Brücken werden auf ein sicheres Feld versetzt; Transporte werden umgeleitet oder mit Warenrückgabe aufgehoben.
- Das Gründungslager lässt sich unter „Dorf & Stadt“ kostenlos neu errichten. Kein neuer Startvorrat; vorhandene Waren bleiben auch ohne Lager in der Rückgabewarteschlange erhalten.
- Speichern, Laden und Weiterbauen funktionieren auch nach dem Abriss des letzten Gebäudes. Wohnraum wird aus den tatsächlich vorhandenen Gebäuden berechnet, Bewohner bleiben erhalten.
- 89 Tests erfolgreich, darunter Abriss und Neubau für jeden Gebäudetyp, aktive Minen, Brücken mit und ohne Umleitung sowie vollständiger Rückbau. Browserprüfung: Gründungslager abgerissen, Lagerhaus auf dem alten Feld und neues Gründungslager an anderer Stelle geplant.

## 21. September 2026 · Gebäude abreißen

- Fertige Gebäude lassen sich im Auswahlfenster nach Bestätigung abreißen. Das Feld kann anschließend anders bebaut werden.
- Bewohner bleiben erhalten; Arbeits- und Wohnzuordnungen werden bereinigt. Lagerwaren und Transportladungen werden ohne Duplikate zurückgeführt, bei Platzmangel über die Rückgabewarteschlange.
- Baukosten, bereits eingesetzte Produktionszutaten und angebrochene Ausrüstung werden nicht erstattet.
- Gründungslager geschützt; Minen erst nach Rückkehr ihrer Bergleute abreißbar. Brücken dürfen weder gerade benutzt werden noch Bewohner oder Gebäude abschneiden.
- **85 Tests** erfolgreich. Browserprüfung: Abriss abbrechen, bestätigen und auf derselben Fläche ein Lagerhaus planen. TypeScript und Produktionsbuild erfolgreich.

## 21. September 2026 · Bewohnerlabels ein- und ausblenden

- Unter **Bewohnerlabels** lassen sich Namen und Tätigkeiten getrennt für **Oberfläche** und **Unter Tage** ein- oder ausblenden.
- Die Auswahl bleibt nach Neuladen und beim Wechsel zwischen Partien in diesem Browser erhalten. Sandbox-Einstellungen sind getrennt. Standard: Oberfläche und Untertage aus. Bereits gespeicherte Einstellungen bleiben erhalten.
- Oberflächenlabels zeigen passende Tätigkeiten wie Transport, Steinabbau oder Arbeit statt pauschal „unterwegs“.
- TypeScript und Produktionsbuild erfolgreich; Ein-/Ausblenden auf beiden Ebenen und dauerhaft gespeicherte Einstellungen im Browser geprüft.

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
