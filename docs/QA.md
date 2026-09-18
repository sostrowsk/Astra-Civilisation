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
