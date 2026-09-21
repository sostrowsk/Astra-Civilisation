# MVP-Prüfprotokoll

Datum: 17. September 2026. Umgebung: macOS, Node.js 26.3.0, npm 11.16.0, eingebetteter Codex-Browser mit WebGL2. Visuelle Hauptprüfung bei 1280 × 720 Pixeln.

## Automatisierte Prüfung

`npm test`: **13 Tests erfolgreich**.

1. Deterministischer Anfangszustand, zehn Bewohner und gesperrter Fluss.
2. Ungültige Bauplätze: Wasser, Gebäude, Rohstoffe, unerreichbares Ostufer und Kartengrenzen.
3. Physische Baumateriallieferungen, exakte Baukosten und Bevölkerung durch Wohnhäuser.
4. Gleichzeitige Baustellen können begrenzte Brettervorräte nicht doppelt ausgeben.
5. Abbruch bei laufenden Transporten führt Güter ohne Duplikation zurück.
6. Abbruch erstattet bereits angeliefertes Material.
7. Speichern/Laden während laufender Aufgaben führt bei identischer Fortsetzung zum identischen Zustand.
8. Beschädigte Daten, negative Bestände und ungültige Referenzen werden abgelehnt.
9. Vollständige Mission ohne Ressourcen-Cheats: Holzfäller, Sägewerk, Steinbruch, Brücke, Außenposten. Abschluss nach **138,4 Simulationssekunden** bei sofortiger idealer Planung.
10. Ein pausierter Betrieb gibt seinen Arbeiter nach Abschluss der Aufgabe frei.
11. Kostenlose Wege werden gespeichert und können nicht doppelt platziert werden.
12. Sägewerk vor Holzfäller verbraucht die geschützte Gründungsreserve nicht; eine wirtschaftliche Erholung bleibt möglich.
13. Null, negative und ungültige Zeitschritte verändern die Simulation nicht.

Die Ressourcenerhaltung wird einschließlich Vorkommen, Gebäudebeständen, angelieferten Baustoffen und getragenen Gütern geprüft. Zwei Bretter entsprechen dabei einem verarbeiteten Holz.

`npm run build`: **TypeScript-Prüfung und Vite-Produktionsbuild erfolgreich**. Ein erwarteter Größenhinweis betrifft das ca. 603 kB große unkomprimierte JavaScript-Bundle inklusive Three.js (ca. 155 kB gzip). Keine fehlenden Imports oder Buildfehler.

## Interaktive Browserprüfung

- Startansicht und vollständig gerenderte Voxelwelt überprüft.
- Holzfäller mit einem echten Klick in die 3D-Welt platziert; gültige Hover-Vorschau und anschließender Bauinspektor bestätigt.
- Sägewerk und Steinbruch über die sichtbare, per Tastatur bedienbare Koordinatenwahl gebaut.
- Ein Außenposten vor Brückenfertigstellung wird mit verständlicher Meldung abgelehnt.
- Brücke regulär gebaut; nach ihrer Fertigstellung Außenposten am Ostufer platziert.
- Lieferungen, Produktionsbestände und Missionsfortschritt sichtbar fortgeschritten.
- Abschlussdialog mit 10 Bewohnern und 6 Bauwerken erschienen; freies Weiterspielen funktioniert.
- Hilfedialog geöffnet und geschlossen; Kamera über Drehen/Zoom/Heimatansicht bedient.
- Pause hält Bestände und Simulation an; eine während Pause geplante Baustelle wartet auf Material.
- Manuell gespeichert, bestätigt geladen und Seite neu geladen: abgeschlossene Mission und Bestände bleiben erhalten.
- Baustellenabbruch über die Oberfläche bestätigt.
- Neustartbestätigung: Abbrechen erhält die Mission; Bestätigen setzt Welt und Missionsanzeige zurück. Ein dabei gefundener Cachefehler in der Missionsanzeige wurde korrigiert und durch einen erneuten Aufbau-/Neustart-Durchlauf im Browser überprüft.
- Überlappungen von Seitenkarten, Minimalkarte und Kamerasteuerung bei 720 Pixel Höhe korrigiert und visuell nachkontrolliert.
- Eine Warnung zur entfernten Three.js-Schattenoption korrigiert. Nach Neuladen keine neuen Warnungen oder JavaScriptfehler beobachtet.

## Noch nicht abgenommen

Breite GPU-/Browsermatrix, Langzeitpartien, Performance-Benchmarks auf schwacher Hardware, Screenreader-Bedienung der 3D-Welt, Touch-Geräte und Cloud-Hosting. Mobile Spielerfahrung gehört nicht zum MVP. Endliche Vorkommen und fehlender Abriss fertiger Gebäude sind dokumentierte Grenzen, keine versteckten Vollspiel-Funktionen.


# Erweiterung 0.2 — Prüfung vom 18. September 2026

## Automatisiert

**27 Tests erfolgreich; TypeScript und Produktionsbuild erfolgreich.** Die bisherigen 13 Tests bleiben erhalten. Hinzu kommen 14 Tests für:

- Version-1-Migration mit identischen ursprünglichen Feldern, Gebäuden, Waren und laufenden Bewohneraufgaben.
- Unveränderte Legacy-Sicherung und getrennte Sandbox-Speicherung.
- Schreibschutz bei beschädigten oder unlesbaren Spielständen; Ablehnung fehlender alter Warenbestände.
- Biomabhängige Vorkommen und unterschiedliche Produktionsdauer von Bauernhöfen.
- Expeditionsvoraussetzungen, Nachbarschaft, exakte einmalige Kosten und entdeckte Felder.
- Schutz für bereits reservierte Transportwaren vor Expeditionsausgaben.
- Stufen- und Regionssperren; Außenpostenpflicht in neuen Gebieten.
- Langsames Nachwachsen, Schutz von Gebäuden/Straßen und offenbleibende Engstellen.
- Deterministische Fortsetzung der Ökologie nach Speichern/Laden und begrenzte Walddichte.
- Wirkung einer aktiven gegenüber einer pausierten Försterei.
- Maximal 64 Bewohner mit gültigen eindeutigen Namen und speicherbarem Zustand.
- Vollständige reguläre Kampagne: vier Stufen, 30 Bewohner, alle neuen Gebäude und sechs Regionen nach etwa **48,6 Simulationsminuten**. Kein Auffüllen von Ressourcen im Kampagnendurchlauf.

## Browser

Geprüft im eingebetteten Browser bei 1280 × 720, ausschließlich mit getrenntem Testspielstand. Fortgeschrittene Zustände stammen aus demselben regulären Kampagnendurchlauf.

- Neue Expeditions-/Entwicklungsübersicht einschließlich deaktivierter Aktionen und konkreter Freischaltgründe.
- Aufstieg vom Pionierlager zum Dorf über die echte Oberfläche; 14/32 Bewohner und neue Baukategorie sichtbar.
- Bauernhof platziert; Werkstatt platziert, fertiggestellt und erster erzeugter Werkzeugbestand sichtbar.
- Expedition in den Fernenwald bezahlt; Karte wechselt von „Stufe 3“ auf „Entdeckt“, Kamerafokus auf neues Gebiet funktioniert.
- Vier Biome und vollständige Karte mit sechs Regionen visuell geprüft; vergrößerte Minimalkarte funktioniert.
- Sechs Waren passen in die Ressourcenleiste; fortlaufende Ziele und 64er-Bevölkerungsgrenze werden angezeigt.
- Keine JavaScript-/WebGL-Fehler oder Warnungen im geprüften Stand.

Die eigene laufende Partie des Nutzers wurde nicht für Bau-, Aufstiegs- oder Neustarttests benutzt. Bestehende Version-1-Daten werden vom neuen Speicherweg nicht beschrieben. Keine Aussage über alle Hardware-/GPU-Kombinationen; dafür steht ein breiter Leistungstest noch aus.

## Version 0.3 — Seed-Welten und Untertage (19.09.2026)

- **35 automatisierte Tests erfolgreich**; TypeScript-Prüfung und Vite-Produktionsbuild erfolgreich.
- Generator: reproduzierbare Seeds; unterschiedliche Landschaften; identische globale Geländefelder unabhängig von Chunkreihenfolge; Wasser und Berge setzen sich über Grenzen fort; signierte Regionenkoordinaten und Expansion über die bisherigen sechs Regionen hinaus.
- Einstieg: 100 Seeds mit erreichbaren Startbauplätzen und garantierten Vorkommen. Grundwirtschaft, Baustellen, Abbruch, Materialerhaltung, Reservierungen und Sägewerk-Startreserve bleiben geprüft.
- Bergbau: Höhlen und alle fünf Vorkommen; tiefenabhängige Verteilung; Sichtbarkeit; zusammenhängende Aufträge; keine Teleportation durch Gestein; mehrere Minen ohne doppelte Reservierungen; Pause, Abbruchmarkierung und Speichern während eines Auftrags.
- Verarbeitung: Erz + Kohle → Barren; Eisen → Werkzeuge; Kupfer/Gold → Wissen; Diamanten als alternative Expeditionskosten. Fehlende Kohle verhindert Schmelzen.
- Fortschritt: Vier Stufen und Bevölkerung bis 64 weiterhin geprüft. Reales Produktionsspiel vom Start bis zu geschmiedeten Eisenwerkzeugen mit Seed 42 ohne zusätzliche Vorräte: **34,3 Simulationsminuten**. Höhere Stufen werden mit gezielten Zustandsfixtures geprüft, nicht als vollständiger neuer End-to-End-Kampagnenlauf ausgegeben.
- Waldschutz: Reproduzierbare Regeneration; Wege und Häuser frei; ein Setzling kann den einzigen Zugang zu einem Gebäude nicht versperren.
- Browser bei 1280 × 720: Untertage öffnen, −32 m wählen, automatische Erkundung deaktivieren, vier Stollenfelder über die Koordinateneingabe markieren. Vier Felder wurden sichtbar ausgegraben; anschließende Goldader ausgewählt und über Weltklick zum Abbau markiert. Golderz erschien nach Transport in der Warenübersicht.
- Browser: Metallauswahl der Schmelzhütte, Rückkehr zur Oberfläche, drei Tiefenoptionen, neue Baukategorie, Text-Seed und Zahlen-Seed. Text „Bergtal 2026“ ergab Seed 422572082. Zahlen-Seed 2026 wurde über die Oberfläche gespeichert und nach vollständigem Neuladen aus IndexedDB wiederhergestellt. Sandbox bleibt vom normalen Speicher getrennt.
- Landschaftsvorschau mit 25 ausdrücklich finanzierten Regionen: Flüsse, Seen, Gebirge und verschiedene Biome sichtbar; weiter Zoom und korrigierte Kamera verhindern das Abschneiden des Vordergrunds. Vorschauen: `worldgen-preview.png`, `mining-preview.png`.
- Keine Warnungen oder Fehler in den abgefragten Browserlogs. `git diff --check` sauber. Vite meldet weiterhin die unverpackte Three.js-Bundlegröße; etwa **170 kB gzip** JavaScript.
- Speicherung jetzt lokal in IndexedDB statt der kleinen localStorage-Quota. Version-1-/2-Teststände werden nicht übernommen. Browser-RAM, Datenbankquota und Performance bei sehr großen Welten bleiben praktische Grenzen; keine Auslagerung entfernter Regionen und keine breite GPU-Messreihe.

## Korrektur: unsichtbarer / stillstehender Bergbau (19.09.2026)

- In der laufenden Partie mit 68 Regionen: Mine 9 / −40 hatte Leo zugeteilt, aber 40 Kupfererz im Ausgang. Die alte Anzeige meldete fälschlich eine fehlende Abbaufront. Träger prüften Betriebe immer in Bau-Reihenfolge, sodass dauerhaft volle frühe Holzfäller spätere Minen vom Abtransport ausschließen konnten.
- Transporte wählen nun den am längsten nicht bedienten Betrieb und rotieren auch dessen Rohstoffe. Bestehende Baustellenpriorität und Reservierungen bleiben erhalten. Die Verteilungsposition wird mitgespeichert; alte v3-Spielstände benötigen keine Migration.
- Die Untertage-Ansicht zeigt den zugeteilten Bergmann, tatsächliche Tiefe, laufende Tätigkeit, volle Lager, fehlende Aufträge und die Anzahl der Bergleute auf der Ebene. „Bergmann zeigen“ zentriert die Kamera am realen Aufenthaltsort, gegebenenfalls an der Oberfläche. Die Arbeitsauftrags-Tiefe bleibt beim Kamerasprung unverändert.
- Bergleute tragen einen sichtbaren Helm und eine animierte Spitzhacke. Vergrößerte Untertage-Figuren und Namensmarkierungen machen sie im Gelände auffindbar.
- Laufende Partie: Milo 3 in Mine 10 / −40 transportierte nach der Korrektur wieder Eisenerz auf −12 m. Separate Browserprüfung: Jonas sichtbar beim Graben mit Helm, Spitzhacke und Namensmarkierung; Kamerasprung und Zoom erfolgreich. Screenshot: `mining-workers-preview.png`. Keine Browserwarnungen/-fehler im Testfenster.
- **38 Tests erfolgreich**, darunter dauerhaft volle frühe Holzfäller gegen eine volle Mine, faire Ausfuhr von Kohle neben Stein, Erhalt der Rohstoffe, deterministisches Laden der Transportverteilung und zutreffende Statusmeldungen.

## Bergmann-Siedlungen · 20.09.2026

- 46 Verhaltenstests erfolgreich, darunter acht neue Prüfungen: Hausbau mit echten Lieferungen und Kosten, vier Einwohner, Priorität naher Minen, Wechsel aus anderem Betrieb nach Abschluss einer Aufgabe, parallele exklusive Abbaufronten, Rohstoffbilanz, Reduzierung/Pause mit Ladungsrückgabe, Lagerplatzreservierung, Wachstum bis 96 und kompatible v3-Spielstände.
- `npm run build` und `git diff --check` erfolgreich. Bestehender Hinweis auf Bundle über 500 kB unverändert.
- Browser: separate Testpartie mit finanziertem Welt-Fixture (Seed 42), Haus bei 7/10 und Mine bei 10/10 über die Bauoberfläche errichtet. Tatsächliche Lieferungen, Anstieg von 10 auf 14 Bewohner, Umschalten von 1 auf 4 Arbeitsplätze, vier sichtbare Bergleute (Alva, Ada, Ella, Finn) unter Tage, paralleler Abbau und Rücktransport beobachtet.
- Testpartie gespeichert und ohne Fixture-Parameter neu geladen: Haus, 14 Bewohner, Sollbesetzung 4 und laufende Mannschaft erhalten. Kamerasprung zu Finn erhält dessen Auswahl. Wechsel zur Auftragstiefe −32 m und Kamerasprung zum noch auf −12 m arbeitenden Finn verändern den zukünftigen Arbeitsauftrag nicht.
- Hausmodell mit Schieferdach, Lampe und Bergbauwerkzeug visuell geprüft; Mannschaftsbedienung bei 1280 × 720 geprüft. Keine Browserfehler oder Warnungen.
- Bestehende Nutzerpartie mit Seed 3530829716 und 68 Regionen wird weiterhin geladen und zeigt die neue Grenze 64/96; keine Rücksetzung. Screenshots: `mining-settlement-preview.png`.

## Wirtschaft und Viehzucht · 20.09.2026

- **59 Verhaltenstests erfolgreich**, einschließlich 13 neuer Wirtschaftstests. Geprüft: Kapazitäten und konkurrierende Lieferungen, volle Ausgänge, lokale Werkstattzutaten, Nahrung→Wolle→Stoff→Kleidung, Scherenverschleiß, Bohrerbeschleunigung, Draht/Zahnräder/Maschinenteile, Personalpriorität nach Aufgabenabschluss, Baustellenrückgaben, reale Warenflussmessung, einmalige Migration und überschüssige Transportreservierungen.
- Fünf Stufen exakt in gewünschter Reihenfolge: Pionierlager, Dorf, Viehzucht, Kleinstadt, Manufaktur. Schafzucht, Weberei und Schneiderei gemeinsam ab Stufe 3; Freischaltung und Aufstiegskosten separat getestet. Bestehende große Partie bleibt erhalten und wird als Kleinstadt mit 96 Bewohnern angezeigt.
- Reale Startkampagne ohne zusätzliche Vorräte erzeugt jetzt einfache Werkzeuge und daraus mit selbst gefördertem Eisen Scheren in **36,4 Simulationsminuten**. Die neue Textilkette und Manufaktur werden mit gezielten Zustandsfixtures getestet, nicht als vollständige Start-bis-Manufaktur-Kampagne ausgegeben.
- `npm run fixtures`: separate, ausdrücklich finanzierte Wirtschaftswelt mit real angelieferten Baustoffen und laufenden Produktionsketten. Browser zeigte u. a. 43 Kleidung und 10 Maschinenteile, elf besetzte Betriebe und sieben Träger. Das ist eine Funktionsvorschau, kein Nachweis einer ungeförderten Kampagne.
- Dashboard bei 1280×720 visuell geprüft; alle Spalten sichtbar, Tabelle und Dialog scrollbar. Produktion/Verbrauch/Saldo, Betriebsbedarf, Aufstieg und optionale Ausrüstung getrennt. Wissen, Kupfererz, Golderz und weitere Nullzeilen zeigen exakt `-`; zusätzlich als Regression getestet.
- Voxelmodelle visuell geprüft: gemauerte hohe Schmelzhütte und offene Schmiede mit Amboss; neue Schafzucht, Weberei, Schneiderei und Manufakturen. Schmiede-Inspektor zeigt 10er-Eingänge, 20er-Ausgänge sowie Produkt- und Prioritätsauswahl.
- `npm run build`, `npm test` und `git diff --check` erfolgreich. Vorhandener Hinweis auf Bundle über 500 kB bleibt bestehen. Dashboard-Screenshot: `economy-dashboard-preview.png`.

## Mehrere Spielstände und Neustart (20.09.2026)

- `npm test`: **66/66 erfolgreich**, darunter sieben neue Prüfungen für getrennte Partien, Übernahme des bisherigen Spielstands, Neustart mit gleichem Seed, zuletzt aktive Welt, Umbenennen/Löschen, fehlerhafte Schreibvorgänge und beschädigte Daten.
- `npm run build` und `git diff --check`: erfolgreich; bestehender Hinweis zur Bundlegröße bleibt.
- Browserprüfung in separater Sandbox bei 1280 × 720: vorhandene Manufaktur-Partie (Seed 42, 18 Bewohner) übernommen; neue Partie „QA Bergtal“ mit Seed 98765 angelegt; Neustart als dritte Partie mit identischem Seed und Pionierlager erstellt; umbenannt; zur ursprünglichen Partie gewechselt und Seite neu geöffnet. Die zuletzt gewählte Partie und alle drei Einträge blieben erhalten.
- Löschdialog abgebrochen (Partie bleibt vorhanden), danach ausschließlich die eigens angelegten QA-Partien bestätigt gelöscht. Originalpartie erhalten. Dialogdarstellung visuell geprüft.
- Speicherdaten und Metadaten einer Partie werden gemeinsam in einer IndexedDB-Transaktion geschrieben. Die Übernahme lässt den bisherigen einzelnen v3-Spielstand als unveränderte Rückfallkopie liegen. Spielstände bleiben lokal, ohne Cloud-Synchronisation.

## Bäume bevorzugt fällen (20.09.2026)

- 71 Tests erfolgreich, einschließlich fünf neuer Verhaltenstests: Vorrang vor näheren Bäumen bis zur vollständigen Rodung und bebaubare Fläche, bestehende Arbeit erhalten und Priorität aufheben, unerreichbare/entfernte Ziele überspringen, pausierte Betriebe und Lagergrenzen respektieren, Speichern/Laden und Validierung.
- TypeScript-Prüfung und Produktionsbuild erfolgreich; bestehender Bundlegrößenhinweis unverändert.
- Browserprüfung in separater Sandbox: Baum bei 4 / 10 ausgewählt, „Bevorzugt fällen“ aktiviert, goldenen Rahmen und Hinweis auf fehlenden Holzfäller gesehen, Priorität wieder aufgehoben. Die reguläre Partie blieb unberührt.

## Baumwachstum und Tagebau (21.09.2026)

- **79 Tests erfolgreich**, darunter acht neue Verhaltenstests für fünf bebaubare Jungbaumstufen, Reifung und Försterei, bevorzugten Steinabbau, endliche Schichten, 3×3-/5×5-Terrassen, Braunkohleverteilung, getrennte Lagergrenzen, Pausieren, deterministisches Fortsetzen, geschützte Felder und zwei gleichzeitig arbeitende Steinbrüche.
- TypeScript und Produktionsbuild erfolgreich, bestehender Bundlegrößenhinweis unverändert.
- Browserprüfung bei 1280×720 in `?sandbox&scenario=surface`: fünf unterschiedlich große Jungbäume neben einem ausgewachsenen Baum sichtbar; Jungbaum bei 7/8 zeigt Stufe 3/6 und „noch bebaubar“. Stein bei 12/9 bevorzugt markiert und Priorität aufgehoben. Vorbereiteter terrassierter Tagebau bei 18/12 zeigt zwei abgegrabene Ebenen; dritte Ebene beauftragt und pausiert, korrekter Hinweis auf den pausierten Steinbruch.
- Visuelle Szene reproduzierbar mit `node --experimental-strip-types scripts/create-surface-fixture.ts`. Die vorbereitete Szene prüft Darstellung und Bedienung; die Simulationstests prüfen tatsächlichen Abbau und Rohstofferhaltung.

## Gebäudeabriss (21.09.2026)

- 85 Tests erfolgreich: sechs neue Verhaltenstests prüfen Hausabriss und Neubau, Erhalt von Bewohnern, exakte Rückgabe von Waren und Transportladungen bei vollen Lagern, Freigabe von Arbeitern, Entfernung von Wohnzuordnungen, Minenräumung mit Erhalt der Höhlen, Brückenschutz und Schutz des Gründungslagers. Speichern/Laden bleibt nach Abriss gültig.
- Browserprüfung in separater Economy-Sandbox: Wohnhaus 6/14 ausgewählt, Abriss mit „Behalten“ abgebrochen, erneut geöffnet und bestätigt. Danach Lagerhaus auf 6/14 als Baustelle angelegt. Kein Eingriff in die reguläre Partie.
- TypeScript, Produktionsbuild und `git diff --check` erfolgreich. Bestehender Hinweis zur Bundlegröße unverändert.


## Vollständiger Rückbau aller Gebäudetypen (21.09.2026)

- 89 Tests erfolgreich. Jeder fertige Gebäudetyp ist abreißbar; freies Feld, gültiger Spielstand und Neubau werden geprüft.
- Zusätzliche Fälle: letztes Gebäude abreißen und nach Speichern/Laden ein Gründungslager neu errichten, Baustellen ohne Lager abbrechen, Bergleute samt Waren sofort zurückholen, einzige belegte Brücke entfernen, Transporte über eine zweite Brücke umleiten und abgeschnittene Minenanreisen aufheben.
- Browserprüfung in der separaten Economy-Sandbox: Gründungslager 8/12 abgerissen und dort Lagerhaus geplant; neues Gründungslager auf 8/11 geplant. Abrissschaltfläche steht vor dem Warenbestand.


## Arbeitsanimationen an der Oberfläche (21.09.2026)

- Reproduzierbare, ausdrücklich vorbereitete Szene: `node --experimental-strip-types scripts/create-workers-fixture.ts`, danach `/?sandbox&scenario=workers`. Lange Arbeitsphasen erleichtern die visuelle Prüfung; diese Szene ist kein Produktionsdurchlauf.
- Browserprüfung bei 1280×720 mit vergrößerter Kamera: Holzfäller mit Axt in unterschiedlichen Schlagphasen, Steinbrucharbeiter am Felsen, Tagebauarbeiter mit nach unten schlagender Spitzhacke. Arbeiter richten sich zum Ziel aus; Spielpause hält die Pose an.
- Arbeitswerkzeug und Splitter sind an Arbeitsphase, leeren Transportweg und fehlende Ladung gebunden. Die Positionskorrektur am Vorkommen betrifft ausschließlich die Darstellung.
- 89 bestehende Tests erfolgreich; TypeScript und Produktionsbuild erfolgreich. Bestehender Hinweis zur Bundlegröße unverändert.


## Lokale Siedlungen, Händler und Fuhrpark (21.09.2026)

- 100 Tests erfolgreich, elf davon für die neue Logistik: vier Händler je Lagerhaus, keine Produktionszuweisung, lokale Weggrenzen auch bei Umwegen, entfernte Baustellen nur mit Händlern, Import für entfernte Betriebe, Ladungen von 2/8/16, Reservierungen ohne Überfüllung, getrennte Transporte bei überlappenden Ortsbereichen, Migration und deterministisches Laden, Abriss mit voller Kutsche sowie Wiederverwendung heimatloser Händler.
- Pro Lagerhaus höchstens ein Karren und eine Kutsche; Reservierung bleibt bis zum Ende der Rückfahrt erhalten. Doppelte Fahrzeugreservierungen werden beim Laden abgelehnt.
- Reproduzierbare Browser-Testwelt: `node --experimental-strip-types scripts/create-trade-fixture.ts`, danach `/?sandbox&scenario=trade`. Die finanzierte Szene nutzt echte Transportaufträge statt eingefrorener Fahrzeugposen.
- Browserprüfung bei 1280×720: ein Pferdekarren und eine gedeckte Kutsche sichtbar; Lagerhaus 10/12 zeigt vier Händler, davon zwei zu Fuß, und je ein belegtes Fahrzeug. Wirtschaftsübersicht trennt zehn örtliche Träger von vier Händlern. Die reguläre Partie wurde nicht verwendet.
- Produktionsbuild und `git diff --check` erfolgreich; bestehender Hinweis zur Bundlegröße unverändert.
