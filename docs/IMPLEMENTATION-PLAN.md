# MVP-Umsetzungsplan

Die Umsetzung folgte dieser Reihenfolge. Alle sechs Schritte sind abgeschlossen; Prüfstand vom 17. September 2026.

1. [x] **Projekt und Regeln:** Vite/TypeScript, Spezifikation, Kosten, deterministische Welt und Datenmodell.
2. [x] **Simulation:** Wegsuche, Bauvalidierung, Arbeitsaufgaben, Reservierung, Lieferungen, Produktion, Fertigstellung, Gründungsreserve und Mission.
3. [x] **Voxelwelt:** Gelände, Wasser, Bäume, Steine, individuelle Gebäude, Bewohner, Waren, wachsende Baustellen, Kamera und Feldselektion.
4. [x] **Spieloberfläche:** Ressourcenleiste, Baupalette, Zielkarte, Inspektor, Minimalkarte, Einführung, Hilfe, Spieltempo und Tastatursteuerung.
5. [x] **Persistenz:** Versionierte Spielstände, Validierung, Autosave, manuelles Speichern und bestätigter Neustart.
6. [x] **Prüfung und Übergabe:** 13 Verhaltenstests, vollständige Mission auch im Browser, Typecheck/Build, visuelle Kontrolle, Startanleitung und bekannte Grenzen.

## Prüfstrategie

Die reine Simulation erhält Verhaltenstests, insbesondere für Ressourcenerhaltung, unerreichbare Baustellen und das vollständige Brücken-/Außenposten-Ziel. Die Browserprüfung kontrolliert reale Platzierung, Kamera, Pausieren, Hilfedialog, Inspektor und Fehlerausgaben. Keine Tests für rein dekorative CSS-Details.

## Ergebnis

Siehe [Prüfprotokoll](QA.md). Der MVP ist lokal spielbar. Veröffentlichung/Hosting, weitere Kapitel und die in der Spezifikation ausgeschlossenen Mechaniken sind nicht Teil dieses Abschlusses.
