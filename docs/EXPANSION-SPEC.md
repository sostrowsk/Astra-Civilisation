# Neue Horizonte — Regeln für Version 0.2

## Welt und Expeditionen

Die ursprünglichen 26 × 24 Felder bleiben unverändert. Fünf Expeditionen erweitern sie auf insgesamt 78 × 48 Felder. Die Welt ist endlich. Eine Expedition wird im Fenster **Entwicklung & Expeditionen** bezahlt und erschließt ihr Gebiet sofort. Nur unreservierte Waren in fertiggestellten Gebäuden sind verfügbar; Güter für laufende Lieferungen werden nicht angetastet.

| Region | Biome | Früheste Stufe | Kosten |
|---|---|---|---|
| Grünwassertal | Wiesen | Pionierlager | Startgebiet |
| Waldmark, Osten | Nadelwald | Erster Außenposten | 24 Bretter, 16 Stein |
| Grausteinhöhen, Süden | Hochland | Dorf | 40 Bretter, 30 Stein, 10 Nahrung |
| Sonnensteppe, Südosten | Steppe | Kleinstadt | 60 Bretter, 40 Stein, 30 Nahrung, 8 Werkzeuge |
| Fernenwald, ferner Osten | Nadelwald | Kleinstadt | 70 Bretter, 50 Stein, 40 Nahrung, 12 Werkzeuge |
| Bernsteinweite, ferner Südosten | Steppe | Handelsstadt | 100 Bretter, 80 Stein, 60 Nahrung, 20 Werkzeuge |

Jede Region muss an ein bereits entdecktes Gebiet angrenzen. Außerhalb des ursprünglichen Tals brauchen normale Gebäude einen fertiggestellten Außenposten in höchstens 9 Feldern Manhattan-Distanz. Außenposten und Wege dürfen auf jedem erreichbaren freien Feld einer erschlossenen Region geplant werden. Regionenkarten haben einen Knopf zum Zentrieren der Kamera; die Minimalkarte wächst mit.

## Vier Zivilisationsstufen

Aufstiege werden aktiv ausgelöst, sobald alle Ziele und Kosten erfüllt sind. Bestehende Partien erhalten also keinen ungefragten Abzug ihrer Waren.

| Zielstufe | Voraussetzungen | Kosten | Freischaltung |
|---|---|---|---|
| Dorf | Alle 7 Pioniergebäudetypen fertig: Holzfäller, Sägewerk, Steinbruch, Haus, Lagerhaus, Brücke, Außenposten; 14 Bewohner | 20 Bretter, 10 Stein | 32 Bewohner; Bauernhof und Försterei; Hochland |
| Kleinstadt | 2 Bauernhöfe, 1 Försterei, 2 Lagerhäuser, 1 Außenposten außerhalb des Tals, Hochland entdeckt, 22 Bewohner | 50 Bretter, 40 Stein, 30 Nahrung | 48 Bewohner; Werkstatt, Akademie, Rathaus; Steppe und Fernenwald |
| Handelsstadt | Rathaus, Werkstatt und Akademie; Außenposten in 3 verschiedenen Regionen; Sonnensteppe entdeckt; 30 Bewohner | 60 Nahrung, 24 Werkzeuge, 40 Wissen | 64 Bewohner; Bernsteinweite |

Je Stufe über dem Pionierlager läuft tatsächliche Arbeit 10 Prozent schneller (Timerfortschritt × 1,1/1,2/1,3). Laufgeschwindigkeit bleibt unverändert. Wohnhäuser schaffen jeweils zwei Plätze. Ein Aufstieg füllt bereits vorhandenen Wohnraum bis zur neuen Grenze auf. Danach bringen zusätzliche Häuser neue Bewohner. Die Figurennamen funktionieren auch oberhalb der alten Grenze von 20.

## Neue Gebäude und Waren

| Gebäude | Baukosten | Betrieb |
|---|---|---|
| Bauernhof | 6 Holz, 8 Bretter, 4 Stein | Ein Arbeiter produziert 2 Nahrung pro Arbeitszyklus; kein Eingangsmaterial. 9 Sekunden auf Wiesen, 14 in Wald/Hochland, 22 in Steppe, vor Stufenbonus. |
| Försterei | 6 Holz, 10 Bretter, 4 Stein | Passiver Aufforstungsbereich mit Radius 7; erhöht Dichteziel und halbiert Wachstumszeit. Pausierbar. |
| Werkstatt | 8 Holz, 16 Bretter, 20 Stein, 10 Nahrung | Ein Arbeiter holt 1 Stein und verarbeitet ihn in 9 Sekunden zu 1 Werkzeug, vor Stufenbonus. |
| Akademie | 8 Holz, 24 Bretter, 24 Stein, 12 Nahrung | Ein Arbeiter holt 1 Brett und erzeugt in 12 Sekunden 2 Wissen, vor Stufenbonus. |
| Rathaus | 12 Holz, 30 Bretter, 40 Stein, 20 Nahrung, 8 Werkzeuge | Lagerstandort und Voraussetzung für die Handelsstadt. |

Nahrung, Werkzeuge und Wissen werden wie Holz, Bretter und Stein getragen. Nahrung wird für Gebäude, Expeditionen und Aufstiege verbraucht; es gibt bewusst noch keinen laufenden Hungerbedarf und keine Todesfälle. Förstereien haben keine eigene Arbeitskraft. Stein bleibt endlich, Bäume können nachwachsen.

## Waldregeneration

Alle 20 Simulationssekunden werden pro erkundeter Region höchstens zwei Setzlinge gepflanzt, wenn die lokale Baum-/Setzlingszahl in Radius 3 unter dem Biomziel liegt. Ziele: Wiese 5, Wald 10, Hochland 3, Steppe 1; aktive Förstereien erhöhen das Ziel um 3.

Ein Setzling wird abhängig vom Biom nach etwa 60–200 Sekunden zum Baum (Wiese 120, Wald 60, Hochland 140, Steppe 200), in einem Fördergebiet schneller. Die Prüfung erfolgt im 20-Sekunden-Takt; tatsächliches Wachstum kann später erfolgen, wenn eine Figur oder Route das Feld benutzt. Ertrag neuer Bäume: Wiese 14, Wald 24, Hochland 12, Steppe 8 Holz.

Keine neuen Bäume auf Straßen, Wasser, Gebäuden, direkt neben Gebäuden, auf Figuren oder geplanten Routen. Vor dem Auswachsen wird geprüft, dass alle Gebäudezugänge und Bewohner weiterhin vom Lager erreichbar sind. Setzlinge sind begehbar. Bauen auf einem Setzling entfernt ihn. Kostenlose Wege können zukünftige Bauplätze dauerhaft frei halten.

Die Auswahl ist deterministisch und der Wachstumstakt Bestandteil des Spielstands. Das Wachstum läuft nur bei aktiver Simulation, nicht im Hintergrund-Tab oder während Pause.

## Spielstandübernahme

Version 2 verwendet `astra-civilisation:save:v2`. Existiert sie noch nicht, wird die bisherige Version 1 gelesen und um neue Weltfelder ergänzt. Alle alten Geländefelder, abgebaute Vorkommen, Gebäude, Vorräte, Bewohner und laufenden Aufgaben bleiben erhalten. Der alte Schlüssel wird **nicht überschrieben**.

Kann ein vorhandener Spielstand nicht gelesen werden, wird automatisches Schreiben gesperrt. Erst ein explizit bestätigtes neues Spiel hebt diesen Schutz auf. `?sandbox=1` benutzt getrennte Schlüssel für Tests; Testpartien verändern die normale Partie nicht.

## Abnahme

Der automatisierte Kampagnendurchlauf erreicht mit echten Produktionsketten alle vier Stufen, 30 Bewohner und sechs Regionen nach ca. **48,6 Simulationsminuten**. Dies ist eine reproduzierbare Spielbarkeitsprüfung, keine gemessene Erstspielerzeit und kein optimaler Speedrun. Zusätzliche Betriebe und kürzere Wege können die Versorgung beschleunigen; 4×-Tempo ist verfügbar.
