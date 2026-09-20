# Wirtschaft, Textilien und fünf Entwicklungsstufen

Bestätigte Entscheidungen: Kapazitäten je Rohstoff; bestehende Überschüsse beim Update entfernen; Schafzucht zwischen Dorf und Kleinstadt; deutlich verschiedene Schmelzhütte/Schmiede; Manufaktur als fünfte Stufe.

1. Arbeiter: verständliche Personaldiagnose, einstellbare Betriebspriorität. Höhere Priorität übernimmt einen Arbeiter erst nach Abschluss dessen Auftrags; zwei Träger bleiben frei. Ein Arbeitsplatz pro Betrieb wird vor zusätzlichen Minenstellen bevorzugt.
2. Lager: Lagerstandorte 100 je Ware, Betriebe 10 je Eingang und 20 je Ausgang, Mine 40 je Fördergut und 2 Bohrer. Wohnhäuser besitzen kein Warenlager. Reservierte Lieferungen und Produktion zählen gegen die Kapazität. Volle Lager stoppen neue Aufträge. Rückgaben aus abgebrochenen Baustellen warten bei vollem Lager als separat ausgewiesene Rückgabe auf freien Platz.
3. Dashboard: reale Zu-/Abgänge über die letzten fünf Spielminuten, Bestand, Waren unterwegs, freier Platz, Produktions- und Verbrauchsraten, Saldo, aktuelle Auftragsbedarfe, Personal und Blockaden. Transporte zählen nicht als Produktion oder Verbrauch. Keine rückwirkend erfundenen Daten.
4. Werkstatt: Stein + Brett → einfaches Werkzeug (ab Dorf). Schmiede: Eisen + einfaches Werkzeug → Schere oder Bohrer. Schere hält 20 Kleidungsstücke; ein Bohrer beschleunigt 40 Abbauzyklen um 50 %. Bergbau bleibt ohne Bohrer möglich.
5. Stufen: Pionierlager (20), Dorf (32), Viehzucht (48), Kleinstadt (96), Manufaktur (128). Schafzucht ab 3: Nahrung → Wolle. Weberei ab 3: Wolle → Stoff. Schneiderei ab 3: Stoff + Scherennutzung → Kleidung. Kleidung und Produktionsstätten ermöglichen die Kleinstadt und die Manufaktur.
6. Kompatibilität: bestehende v3-Spielstände erhalten eine Wirtschaftsrevision; alte Kleinstadt/Handelsstadt bleiben ihrer erreichten Stufe entsprechend auf neuer Position. Überschüsse werden einmalig abgeschnitten; laufende Aufträge werden sicher normalisiert. Validierung vor Speicherung. Alte Testfixtures werden angepasst.
7. Prüfung: Reservierungen, Rohstoffbilanz, Rückgaben, Migration, Prioritäten, echte Textilkette und Ausrüstung, alle fünf Stufen, Dashboard; anschließend Browser, Build, Commit und Push.

Manufaktur auf Stufe 5 verarbeitet Kupfer zu Draht und Eisen zu Zahnrädern. Draht + Zahnrad → Maschinenteil. Ein Teil beschleunigt 20 Arbeitszyklen in Werkstatt, Bauernhof, Schafzucht oder Weberei um 25 %.
