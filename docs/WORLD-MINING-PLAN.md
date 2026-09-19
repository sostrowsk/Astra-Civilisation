# Lebendige Welten & Untertage — Version 0.3

## Ziel und Regeln

- Neue Welt mit zufälligem oder eingegebenem Seed. Identische Seeds erzeugen identisches Gelände und identische Erzadern.
- Die Welt wächst in alle vier Himmelsrichtungen mit Expeditionen um jeweils 26 × 24 Felder. Es gibt keine feste Zahl von Regionen. Nur entdeckte Gebiete werden gespeichert und simuliert.
- Globale Koordinaten bestimmen Höhen, Feuchtigkeit, Klima und Wasserläufe. Biom- und Erkundungsgrenzen verändern diese Felder nicht. Mäandernde Flüsse, verbundene Seen und Täler werden vor der Biomverteilung erzeugt.
- Der Startbereich erhält eine kleine sichere Lichtung mit erreichbaren Holz- und Steinreserven. Brücken werden feldweise von einem erreichbaren Ufer aus gebaut.
- Mineneingänge erschließen drei Tiefen: 12, 32 und 64 Meter. Jede Tiefe hat Höhlen, verdecktes Gestein und zusammenhängende Kohle-, Kupfer-, Eisen-, Gold- und Diamantadern.
- Spieler markieren Stollen oder rechteckige Abbaugebiete. Ein Arbeiter pro Mine gräbt nur erreichbare Fronten. Automatische Erkundung ergänzt diese Aufträge und ist abschaltbar. Unbekannte Erzadern bleiben verborgen, bis Arbeiter sie freilegen.
- Bergleute laufen zum Schacht, unter Tage zum Abbauort und mit höchstens zwei Waren zurück. Träger verteilen Rohstoffe ab dem Minenlager. Pausierte Minen beenden laufende Transporte.
- Schmelzhütten verbrauchen Erz und Kohle, Schmieden Eisenbarren für Werkzeuge. Kupfer und Gold können in der Akademie zu Wissen verarbeitet werden; Diamanten ermöglichen zusätzliche Expeditionen.
- Neue Spielstände verwenden Version 3 in lokaler IndexedDB. Alte Testpartien sind deaktiviert; keine aufwendige Migration. Ungültige neue Spielstände werden weiterhin vor Überschreiben geschützt.

## Umsetzung

- [x] Kontinuierlicher Seed-Generator und dynamische Regionen
- [x] Brücken, Wegsuche, Wachstum und Fortschritt an variable Landschaft anpassen
- [x] Untertage-Simulation, Sichtbarkeit, Aufträge und echte Transporte
- [x] Erzverarbeitung und neue Bauwerke
- [x] Welt-/Seed-Dialog, Tiefenwechsel, Markierungen, Karten und Modelle
- [x] Determinismus, Grenzen, Spielbarkeit, Transport und Speichern testen
- [x] Browserprüfung, Dokumentation, Commit und Push

## Technische Grenzen

Die Welt wächst ohne feste Kartenkante; Speicherbedarf und Simulation steigen mit der erkundeten Fläche. Untertage ist eine taktische Ansicht in drei diskreten Ebenen, kein frei begehbares First-Person-Spiel. Wasser fließt geometrisch durch zusammenhängende Fluss- und Seenetze; es gibt keine Laufzeit-Flüssigkeitssimulation. Keine Monster, Einstürze oder Hungermechanik in diesem Schritt.
