# Astra Civilisation

Voxel-Aufbauspiel mit selbstständig arbeitenden Bewohnern und physischem Warentransport. **Version 0.3 – Lebendige Welten & Untertage** ergänzt Seed-Welten, zusammenhängende Landschaften und Bergbau auf drei Tiefenebenen.

[Öffentliches Repository](https://github.com/sostrowsk/Astra-Civilisation) · [Regeln und Umsetzungsplan](docs/WORLD-MINING-PLAN.md)

## Starten

Node.js 22.18+ oder Node 24/26, npm und ein Desktop-Browser mit WebGL2.

```sh
npm install
npm run dev -- --port 5173
npm test
npm run build
```

Adresse: http://127.0.0.1:5173. GitHub Actions führt bei Push und Pull Request Tests und Build aus.

![Seed-Welt mit zusammenhängenden Bergen, Tälern und Gewässern](docs/worldgen-preview.png)

## Welt und Einstieg

Neue Partien erhalten einen zufälligen Seed. Über **Seed …** oder **Neues Spiel** lässt sich eine Zahl oder ein Text eingeben. Gleicher Seed erzeugt dieselbe Landschaft, andere Seeds neue Höhen, Wälder und Gewässer. Eine kleine Startlichtung und einige Vorkommen sichern den Einstieg.

1. Holzfäller **7 / 10**, Sägewerk **9 / 10** und Steinbruch **9 / 8** bauen.
2. Einen Außenposten mindestens fünf Felder vom Gründungslager entfernt errichten, beispielsweise **11 / 9**.
3. Lagerhaus und zwei Wohnhäuser ergänzen. Alle sechs Pioniergebäudetypen und 14 Bewohner ermöglichen den Aufstieg zum **Dorf**.
4. Über **Expeditionen** angrenzende Regionen erkunden. Jede Expedition ergänzt 26 × 24 Felder. In neuen Regionen ermöglichen Außenposten normales Bauen in neun Feldern Umkreis.

Die Welt wächst nach Norden, Osten, Süden und Westen ohne feste Anzahl an Regionen. Globale Höhen-, Klima- und Feuchtigkeitsfelder erzeugen Wiesen, Nadelwald, Hochland und Steppe. Mäandernde Flüsse mit verbreiterten Seen und quer verlaufenden Nebenflüssen werden vor den Biomen bestimmt. Gelände und Erzadern werden an einer Erkundungs- oder Biomgrenze nicht neu gestartet.

Brücken entstehen **feldweise** für jeweils vier Bretter und zwei Stein. Vom erreichbaren Ufer oder einer fertigen Brücke aus weiterbauen. Eine Brücke ist kein Pflichtziel mehr, weil nicht jede Startregion einen Fluss enthält.

## Bergbau

Ab dem **Dorf** stehen im Reiter **Bergbau** Mineneingang, Schmelzhütte und Schmiede bereit.

- Einen fertigen **Mineneingang** auswählen und **Unter Tage ansehen** anklicken. Alternativ oben **Unter Tage** öffnen.
- Zwischen **−12, −32 und −64 Metern** wechseln. Die gewählte Ebene bestimmt den nächsten Auftrag dieser Mine. Laufende Aufträge werden auf ihrer bisherigen Ebene beendet.
- **Stollen graben:** einzelne Felder markieren. **Gebiet markieren:** zwei gegenüberliegende Ecken anklicken, maximal 256 Felder. Eine Koordinateneingabe steht im Inspektor zur Verfügung.
- Markierungen müssen über offene Höhlen oder zusammenhängende Stollen erreichbar werden. Ferne Markierungen allein lassen Arbeiter nicht durch Fels springen.
- **Automatisch erkunden** sucht bekannte Erzadern und gräbt weitere erreichbare Fronten in 18 Feldern Umkreis des Schachts. Abschaltbar, kombinierbar mit eigenen Aufträgen.
- Dunkles Gestein bleibt unbekannt; Höhlen und angrenzende Erzadern werden beim Freilegen sichtbar. Bekannte Höhlen sind begehbar.

Bis zu vier Bergleute pro Mine laufen zum Schacht, graben an unterschiedlichen erreichbaren Fronten und bringen jeweils höchstens zwei Rohstoffe pro Fahrt ins Minenlager. Die Sollbesetzung lässt sich am Mineneingang und unter Tage einstellen (Standard: einer). Normale Träger verteilen sie von dort. Alle Schächte verbinden die drei diskreten Ebenen. Kohle, Kupfer und Eisen treten bereits oben auf; Gold ab −32 m, seltene Diamanten ab −64 m. Vorkommen sind endlich.

| Betrieb / Aktion | Verbrauch | Ergebnis |
|---|---|---|
| Schmelzhütte | 1 Kohle + 1 Eisen-/Kupfer-/Golderz | 1 entsprechender Barren |
| Schmiede | 1 Eisenbarren | 3 Werkzeuge |
| Akademie | 1 Brett / 1 Kupfer / 1 Gold | 2 / 6 / 20 Wissen |
| Diamanten-Expedition | 2 Diamanten statt sonstiger Vorräte | Eine benachbarte Region; Stufenvoraussetzungen gelten weiter |

Metall und Forschungsrohstoff werden im jeweiligen Gebäude eingestellt, sobald dessen Arbeiter seinen aktuellen Auftrag beendet hat. **Waren** zeigt alle Rohstoffe einschließlich Erz, Barren und Diamanten.

![Erkundeter Stollen mit Erzadern](docs/mining-preview.png)

## Zivilisation und Bedienung

Vier Stufen: Pionierlager, Dorf, Kleinstadt, Handelsstadt. Bevölkerungsgrenzen 20 / 32 / 48 / 96, jeweils zwei zusätzliche Plätze pro Wohnhaus oder vier pro Bergmannshaus. Ziele und Kosten stehen im Entwicklungsfenster. Landwirtschaft, Försterei, Werkstatt, Akademie und Rathaus bleiben erhalten; Minen und Metallverarbeitung sind in die Aufstiegsziele integriert.

Bewohner liefern Baustoffe und Waren selbstständig; mindestens zwei Personen bleiben Träger. Unfertige Bauwerke können abgebrochen werden, geliefertem Material geht nichts verloren. Bäume wachsen langsam bei geringer Walddichte nach; Förstereien beschleunigen dies. Wege und Gebäude bleiben frei. Nahrung wird für Bau und Entwicklung genutzt, nicht laufend durch Hunger verbraucht.

| Aktion | Steuerung |
|---|---|
| Wählen, bauen, markieren | Linksklick |
| Kamera drehen | Rechtsziehen, Q / E |
| Kamera bewegen | WASD, Pfeiltasten, Shift + Rechtsziehen |
| Zoom | Mausrad, + / − |
| Heimatansicht | H, Kompass |
| Bauauswahl | 1–8 im aktuellen Reiter |
| Pause / Tempo | Leertaste oder 1× / 2× / 4× |
| Bauplan schließen | Escape |

## Spielstände

Lokale Speicherung alle 20 Sekunden, beim Verlassen und über den Speicherknopf. Die lokale IndexedDB-Datenbank `astra-civilisation` verwendet den Schlüssel **`astra-civilisation:save:v3`**. Vorhandene v3-Teststände aus localStorage werden einmalig eingelesen. Alle entdeckten Landschaften, Schächte, Markierungen, Waren und laufenden Transporte werden gespeichert. Alte Testpartien von Version 1 und 2 sind deaktiviert und werden nicht migriert oder eingelesen.

Die Datenbank **IndexedDB** liegt ausschließlich im Browser; kein Server und kein Cloud-Sync. Browserprofil, Hostname und Port bestimmen den Speicherbereich. Beschädigte aktuelle Spielstände werden vor automatischem Überschreiben geschützt. Ein ausdrücklich bestätigtes neues Spiel ersetzt den aktuellen Spielstand.

## Entwicklung und Prüfung

- `src/generator.ts`: globaler Seed-Generator und Regionenkoordinaten.
- `src/sim.ts`: Wirtschaft, Wegsuche, Expeditionen, Wachstum und Fortschritt.
- `src/mining.ts`: Höhlen, Erzadern, Aufträge, Erkundung und Transporte.
- `src/world.ts`: Three.js, instanziertes Gelände, Tiefenansicht und Voxelmodelle.
- `src/main.ts`: Oberfläche und Eingaben; `src/persistence.ts`: lokales Speichern.
- `src/*.test.ts`: Verhaltenstests für Generator, Wirtschaft, Bergbau und Speicherstände.

`npm run fixtures` erzeugt isolierte Testwelten: `?sandbox=1&scenario=village` und `mining` stammen aus einem echten Produktionsdurchlauf. `?sandbox=1&scenario=world` ist eine ausdrücklich mit Vorräten ausgestattete Landschaftsvorschau mit 25 Regionen. Die Fixtures sind nur im Entwicklungsserver verfügbar, werden nicht im Produktionsbuild ausgeliefert und schreiben ausschließlich in einen separaten Testspielstand.

Der automatisierte Start-bis-Eisenwerkzeuge-Durchlauf benötigt mit Seed 42 etwa **34,3 Simulationsminuten**. Das ist eine Spielbarkeitsprüfung und keine gemessene menschliche Spielzeit. Weitere Prüfungen: [QA-Protokoll](docs/QA.md). Frühere Spezifikationen für Version 0.1 und 0.2 bleiben als historische Dokumente erhalten.

## Grenzen

Erkundete Regionen werden aktuell gemeinsam im Speicher gehalten und lokal gespeichert. Sehr große Welten können Browser-Speicherquota, RAM und Leistung erreichen; es gibt noch kein Auslagern ferner Regionen. Untertage umfasst drei taktische Tiefenebenen, keine First-Person-Steuerung und kein frei verformbares 3D-Blockvolumen. Gewässer werden zusammenhängend erzeugt, aber nicht als Flüssigkeit zur Laufzeit simuliert. Keine Monster, Einstürze, Multiplayer oder vollständige Touch-Steuerung. Fertige Gebäude sind noch nicht abreißbar.

Geometrie, Icons und Schriftdateien werden lokal ausgeliefert. Three.js und Vite mit TypeScript; DM Sans und Manrope über Fontsource. Keine externen Assets während des Spiels. Schriftlizenzen liegen in den jeweiligen npm-Paketen.

### Bergmann-Siedlung aufbauen

Ab Stufe Dorf im Reiter **Bergbau → Bergmannshaus** bauen (6 Holz, 10 Bretter, 8 Stein). Bis zu vier neue Bewohner ziehen am Haus ein, sofern die Bevölkerungsgrenze Platz bietet. Sie bevorzugen freie Stellen in erreichbaren Minen innerhalb von zwölf Feldern; ansonsten helfen sie bei anderen Betrieben und Transporten. Bestehende Belegschaften werden nicht verdrängt.

An der Mine **Bergleute einstellen → 4 Bergleute** wählen. Der Zähler zeigt Ist- und Sollbesetzung. Mindestens zwei allgemeine Träger bleiben frei. Mehrere erreichbare Fronten sind nötig, damit mehrere Arbeiter gleichzeitig graben können. Ein Lagerhaus nahe dem Schacht verkürzt den Abtransport. Beim Reduzieren oder Pausieren liefert die Mannschaft laufende Ladungen noch ab.

Bestehende v3-Partien bleiben kompatibel, bestehende Minen behalten zunächst einen Arbeitsplatz. Nahrung und Werkzeuge gewähren in diesem ersten Ausbau noch keinen zusätzlichen Förderbonus. [Umsetzungsplan](docs/MINING-SETTLEMENT-PLAN.md).

### Bergleute finden

Unter Tage zeigt der Kasten **Bergbau-Betrieb**, wie viele Bergleute der Mine zugeteilt sind, wo die einzelnen Personen gerade arbeiten und warum sie gegebenenfalls wartet. Mit **Bergmann auswählen** lässt sich jedes Mannschaftsmitglied auswählen. **Bergmann zeigen** führt die Kamera zum tatsächlichen Aufenthaltsort. Helm, Spitzhacke und Namensmarkierung kennzeichnen die Figuren. Bei vollem Minenlager holen Träger die Waren ab; die Abholung wechselt fair zwischen Betrieben und Rohstoffen.
