# Neue Horizonte — Erweiterung 0.2

## Ziel

Nach der ersten Brücke geht die Partie weiter: neue Regionen erschließen, Außenposten versorgen, Wald nachhaltig bewirtschaften und die nächste Zivilisationsstufe erreichen. Der bestehende MVP wurde vorher als Commit `4c1dfb2` öffentlich auf GitHub gesichert.

## Geplanter Umfang

1. **Spielstände übernehmen.** Version 2 enthält zusätzliche Felder und Waren. Version-1-Gebäude, Vorräte, Bewohner, Wege, Aufgaben und abgebaute Felder bleiben erhalten. Der ursprüngliche Browser-Spielstand bleibt unter seinem bisherigen Schlüssel als Sicherung bestehen. Defekte Spielstände werden nicht automatisch überschrieben.
2. **Sechs zusammenhängende Regionen.** Das ursprüngliche 26 × 24 große Tal bleibt unverändert. Expeditionen erschließen fünf weitere Gebiete bis insgesamt 78 × 48 Felder. Die Übersicht zeigt Kosten, Freischaltung und Nutzen. In neuen Regionen erschließen Außenposten einen Baubereich von neun Feldern; Straßen sind frei planbar.
3. **Vier Biome.** Wiesen, Nadelwald, Hochland und trockene Steppe unterscheiden sich in Boden, Vegetation, Höhen und Vorkommen. Wälder liefern reichlich Holz, Hochland liefert mehr Stein, Wiesen eignen sich am besten für Bauernhöfe. Wüste/Steppe hat nur spärlichen Baumwuchs und langsame Landwirtschaft.
4. **Langsame Wiederbewaldung.** In ausgedünnten Bereichen entstehen gelegentlich Setzlinge, später Bäume. Biome und Förster bestimmen Dichte und Wachstum. Gebäude, Wege, laufende Transporte und die Erreichbarkeit der Siedlung werden geschützt. Die Simulation bleibt nach Speichern/Laden deterministisch.
5. **Vier Zivilisationsstufen.** Pionierlager → Dorf → Kleinstadt → Handelsstadt. Die erste Stufe bewahrt das Brücken-Kapitel. Weitere Ziele verbinden Gebäudemischung, Bevölkerung, erschlossene Regionen und Waren. Aufstieg wird aktiv ausgelöst und verbraucht die angezeigten Vorräte. Höhere Stufen erhöhen die Bevölkerungsgrenze und schalten Gebäude frei.
6. **Neue Wirtschaft.** Bauernhof produziert Nahrung, Werkstatt verarbeitet Stein zu Werkzeugen, Akademie verarbeitet Bretter zu Wissen. Förster unterstützt Waldregeneration, Rathaus ist ein Meilenstein der Stadtentwicklung. Neue Waren werden wie vorhandene Güter transportiert. Keine Hunger-/Todesspirale; Nahrung ist ein Entwicklungs- und Siedlungsbedarf.
7. **Oberfläche.** Fortlaufende Kapitel statt Sackgasse „abgeschlossen“, Zivilisationsanzeige, Entwicklungs-/Expeditionsansicht, Baukategorien und Biominformation. Karte und Kamera erschließen die größere Welt.

## Umsetzung und Prüfung

- [x] Datenmodell, Kartenregionen und Migration.
- [x] Erkundung, Biome, Waldregeneration und geschützte Wege.
- [x] Zivilisationsregeln, neue Gebäude und Produktionsketten.
- [x] Renderer und Oberfläche einschließlich bestehender Partie.
- [x] Verhaltenstests für Migration, Regeneration, Expansion und alle Stufen; Build und Browserprüfung.
- [x] Dokumentation aktualisieren; Erweiterung separat committen und auf GitHub pushen.

Nicht enthalten: unendliche Welt, Kampf, Terraforming, Multiplayer. Die sechs Regionen sind eine bewusste, sichtbare Grenze dieser Erweiterung.

## Ergebnis

Umgesetzt mit 27 erfolgreichen Verhaltenstests, einem regulären vollständigen Kampagnendurchlauf und Browserprüfungen für Aufstieg, neue Produktion, Expeditionen und Biome. Details: [Regeln](EXPANSION-SPEC.md) und [Prüfprotokoll](QA.md).
