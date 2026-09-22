# Astra Civilisation — MVP-Spezifikation

> Historischer Stand des ersten MVP. Die aktuellen Regeln stehen in der [Gesamtspezifikation vom 22. September 2026](GAME-SPEC.md).

Stand: 17. September 2026. Zielplattform: Desktop-Browser mit WebGL2, Maus und Tastatur. Einzelspieler, lokal, ohne Konto oder Backend.

## Produktidee

Eine ruhige Aufbausimulation mit autonomer Warenwirtschaft und einer plastischen, aus Würfeln gebauten Landschaft. Inspirationsquellen sind die Produktions- und Transportketten von Die Siedler sowie die Voxel-Ästhetik von Minecraft. Alle Modelle und Gestaltungselemente werden eigenständig erzeugt.

Die erste Partie führt vom Gründungslager über Holz- und Steinproduktion zu einer Brücke und einem Außenposten am anderen Flussufer. Der MVP ist bewusst kompakt: ungefähr 5–10 Minuten inklusive Erkunden und Bauentscheidungen als Zielkorridor; Zeitraffer verfügbar. Der automatisierte Test erreicht das Ziel mit sofortigen, günstigen Bauentscheidungen nach 138,4 Simulationssekunden. Die tatsächliche Spielzeit mit neuen Spielern ist noch nicht gemessen.

## Spielwelt und Ausgangslage

- Eine deterministische 26 × 24 Felder große Karte mit Wiesen, gestuften Hügeln, Wald, Stein und einem zwei Felder breiten Fluss.
- Westufer begehbar; Ostufer zunächst nur sichtbar und nach Brückenbau erreichbar.
- Gründungslager, zehn Bewohner und endliche Startvorräte: 18 Holz, 4 Bretter, 12 Stein.
- Bäume und Steinvorkommen enthalten endliche Ressourcen. Verbrauchte Vorkommen geben ihr Feld frei.
- Kein Hunger, Tod oder Kampf im MVP. Fehler dürfen durch Baustellenabbruch korrigiert werden.

## Wirtschaft und Bewohner

- Ressourcen: Holz, Bretter, Stein. Ressourcen existieren in Gebäudelagern, auf Baustellen oder in den Händen eines Bewohners.
- Holzfäller und Steinbruch beschäftigen je einen Arbeiter. Er läuft zum erreichbaren Vorkommen, arbeitet und trägt Rohstoffe zurück.
- Das Sägewerk beschäftigt einen Arbeiter. Er holt Holz aus einem erreichbaren Lager und verarbeitet 1 Holz zu 2 Brettern.
- Übrige Bewohner transportieren Waren automatisch. Eine Lieferung trägt maximal zwei Einheiten. Baustellen haben Vorrang; danach werden Produktionsausgänge in Lager gebracht.
- Beim Zuweisen eines Transports werden Vorräte reserviert. Die Ressource wird erst bei Abholung aus dem Lager entfernt. Keine Doppelverwendung oder negativen Bestände.
- Gründungsreserve: Solange noch kein Holzfäller fertig ist, bleiben 4 Holz und 2 Stein ausschließlich für dessen Bau verfügbar. Das verhindert einen Stillstand durch ein zu früh errichtetes Sägewerk oder andere Gebäude.
- Vierseitige Wegsuche über Land und fertige Brücken. Gebäude sind zugängliche Betriebsflächen. Wege sind optional und beschleunigen den Transport. Ressourcenfelder sind Hindernisse.
- Unterbrechung eines Betriebs gibt dessen Arbeiter nach Abschluss der aktuellen Aufgabe an die Logistik zurück.

## Gebäude und Kosten

| Bauwerk | Holz | Bretter | Stein | Funktion |
|---|---:|---:|---:|---|
| Holzfäller | 4 | 0 | 2 | Holz aus Bäumen |
| Sägewerk | 5 | 0 | 3 | 1 Holz → 2 Bretter |
| Steinbruch | 4 | 2 | 0 | Stein aus Vorkommen |
| Wohnhaus | 3 | 4 | 2 | Zwei zusätzliche Bewohner, maximal 20 |
| Lagerhaus | 4 | 4 | 3 | Zusätzlicher logistischer Standort |
| Brücke | 0 | 12 | 6 | Überspannt beide Flussfelder |
| Außenposten | 6 | 12 | 10 | Zielgebäude am Ostufer, ebenfalls Lager |
| Weg | 0 | 0 | 0 | Schnelleres Laufen, sofort angelegt |

Gebäude dürfen als Baustelle geplant werden, bevor alle Waren vorhanden sind. Die UI zeigt fehlende Waren. Träger liefern Material tatsächlich an; danach wächst das Gebäude stufenweise. Brückenbaustellen werden vom Westufer beliefert. Keine Platzierung auf belegten Feldern, Vorkommen oder unerreichbarem Boden. Ein Außenposten ist nur am Ostufer erlaubt.

Baustellen können abgebrochen werden. Gelieferte Ressourcen werden in das Gründungslager erstattet; bereits getragene Lieferungen werden zurückgebracht. Fertige Gebäude werden im MVP nicht abgerissen.

## Bedienung und Darstellung

- Orthografische 3D-Kamera: Schwenken, Drehen, Zoomen und Heimatansicht.
- Linksklick: Auswahl/Platzierung. Rechtsziehen: Kamera. Q/E: Drehen. WASD/Pfeile: Verschieben. Mausrad: Zoom. Escape: Baumodus verlassen. Leertaste: Pause.
- Bauleiste mit Gebäudetypen, Kosten und Tastenkürzeln 1–8. Farbige Vorschau und konkrete Gründe für ungültige Platzierung.
- Ressourcenleiste, Einwohnerzahl, Tag und 0×/1×/2×/4× Tempo.
- Zielkarte mit den Schritten Holzfäller → Sägewerk → Steinbruch → Brücke → Außenposten und dauerhaftem Fortschritt.
- Inspektor für Gebäude, Baufortschritt und Produktionszustand. Ressourcenvorkommen lassen sich untersuchen.
- Minimalkarte, kurzer Einstieg, Hilfe und sichtbare Ereignisse.
- Lokaler Spielstand mit manueller Speicherung und automatischer Speicherung. Laden validiert Version und Zustand. Neues Spiel benötigt Bestätigung. Speichern meldet Browserfehler sichtbar.
- Eigenständiger warmer Voxel-Stil: grüne Landschaft, sandfarbene Panels, dunkles Tannengrün, Holz und Terrakotta. Kein Asset-Download notwendig.

## Architektur

TypeScript + Vite + Three.js. Reine, vom Renderer unabhängige Simulation mit festem Zeitschritt. Serialisierbarer Zustand einschließlich laufender Aufgaben und Warenreservierungen. Rendering verwendet wiederverwendete Geometrien/Materialien und Instanzen für Gelände. HTML/CSS für zugängliche Bedienelemente. Keine Telemetrie oder externen Laufzeitdienste.

## Abnahme

1. `npm install`, `npm run dev` öffnen ein direkt spielbares Szenario.
2. Zehn Bewohner starten; Gebäude lassen sich gültig planen und erhalten sichtbare Warenlieferungen.
3. Holz und Stein werden an endlichen Vorkommen gewonnen; Holz wird zu Brettern verarbeitet.
4. Mehrere Lieferungen erzeugen weder negative Bestände noch Ressourcen aus dem Nichts.
5. Das Ostufer ist ohne Brücke unzugänglich; nach Fertigstellung kann dort ein Außenposten entstehen.
6. Ein regulär aufgebauter Außenposten löst das Ende des ersten Kapitels aus; freies Weiterspielen bleibt möglich.
7. Pause stoppt die Simulation. Laden setzt auch laufende Transporte konsistent fort.
8. Tests decken Wirtschaft, Platzierung, Wegsuche, Abbruch, Speichern und die vollständige Mission ab. Produktionsbuild und interaktive Browserprüfung bestehen.

## Ausdrücklich später

Freies Blockbauen und Terraforming, Nahrungsketten, Jahreszeiten, Forschung, Handel, Kampf, Multiplayer, prozedurale Endloswelten, First-Person-Steuerung, Mobile-/Touch-Optimierung und ein Produktions-Backend.
