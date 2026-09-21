# Baumwachstum, Steinpriorität und Tagebau

Umgesetzt am 21. September 2026.

## Regeln

- Fünf sichtbare Jungbaumstufen und eine ausgewachsene Stufe. Nur ausgewachsene Bäume sind Hindernisse. Bauen und Wege entfernen Jungbäume auf dem gewählten Feld.
- Reifezeit: Nadelwald 8, Wiesenland 10, Hochland 12, Steppe 15 Spielminuten. Förstereien verdoppeln das Wachstum. Bestehende Reifeschutzregeln für Wege, Gebäude und Bewohner bleiben erhalten.
- Endliche oberirdische Steinvorkommen können bevorzugt abgebaut werden; die Priorität bleibt bis zur Erschöpfung oder zum Aufheben erhalten.
- Tagebau wird auf einem entdeckten, freien Landfeld per Klick beauftragt. Er benötigt einen aktiven Steinbruch mit Personal innerhalb der bestehenden Reichweite von neun Feldern. Gebäude, Wege, Wasser und ausgewachsene Bäume sind geschützt.
- Ein Auftrag trägt eine Schicht ab: 20 Einheiten je Feld, maximal drei Schichten. Bei mehreren Arbeitern werden noch verfügbare Mengen reserviert. Produktion und Transport verwenden das bestehende Wirtschaftssystem und die Lagergrenzen.
- Vor dem Vertiefen müssen alle acht Nachbarn mindestens dieselbe bisherige Abtragstiefe haben. Für ein Feld auf Ebene 3 ist damit ein terrassierter Bereich von mindestens 5×5 Feldern nötig. Tiefe ist der Abtrag relativ zur ursprünglichen Oberfläche, nicht die natürliche absolute Geländehöhe.
- Rohstoff je Feld/Schicht reproduzierbar aus dem Welt-Seed: Ebene 1 Stein; Ebene 2 mit 5 %, Ebene 3 mit 10 % Braunkohle. Eine Braunkohleschicht enthält 20 Kohle statt Stein. Braunkohle zählt zum vorhandenen Kohlerohstoff und kann als Brennstoff verwendet werden.
- Der Abbau lässt sich pausieren. Begonnene Arbeitsgänge werden samt Lieferung beendet. Angefangene Schichten bleiben bis zur Fertigstellung für Bauten gesperrt; fertig abgegrabene Felder sind wieder bebaubar. Im Tagebau wachsen keine neuen Bäume.

## Umsetzung

1. Optionale Felder für Steinpriorität und Tagebauschichten ergänzen; vorhandene v3-Spielstände bleiben lesbar.
2. Wachstumsstufen und reproduzierbare Oberflächengeologie in `src/surface.ts` bereitstellen.
3. Steinbrucharbeiter um reservierte Tagebauaufträge und Kohleausgabe erweitern.
4. Auswahlfenster, Markierungen, Wachstum, Gelände, Gebäudehöhen, Bewohnerhöhen und Minikarte aktualisieren.
5. Regeln, Rohstofferhaltung, Speicherung und Bedienung prüfen; Release Notes ergänzen.

## Prüfung

Acht neue Verhaltenstests ergänzen die bestehende Suite. `scripts/create-surface-fixture.ts` erzeugt eine ausdrücklich vorbereitete Szene für die visuelle Prüfung unter `?sandbox&scenario=surface`; sie ist kein Nachweis einer erspielten Entwicklung.
