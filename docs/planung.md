\# Digitaldruck App – Projektplanung v1



\## 1. Projektziel



Entwicklung einer modernen, lokalen Software für eine Digitaldruckerei  

mit späterer Option auf Server-/Mehrbenutzerbetrieb.



Fokus:

\- Kalkulation \& Nutzenberechnung

\- Angebots- \& Auftragsverwaltung

\- Material- \& Lagerverwaltung

\- Maschinenverwaltung

\- Weiterverarbeitung

\- Modular \& erweiterbar



---



\# 2. Maschinenpark



\## Digitaldruck Farbe (Bogen)



\### Xerox Iridesse #1

\- CMYK

\- SRA3

\- Standard-Digitaldruck



\### Xerox Iridesse #2

\- CMYK + Sonderfarben

\- SRA3

\- 5./6. Druckstation (z. B. Gold, Silver, White, Clear)



---



\## Digitaldruck Schwarz



\### Xerox Nuvera

\- 1/1 Schwarz



\### Canon VP140

\- 1/1 Schwarz



---



\## Großformat



\### Roland TrueVis VG3-540

\- Druck \& Schnitt

\- Kalkulation auf m²-Basis

\- Material- \& Tintenverbrauch



---



\# 3. Kernmodule (Roadmap)



\## Phase 1 – UI \& Struktur

\- Modernes App-Shell Layout

\- Navigation

\- Platzhalter-Seiten

\- Design-System (Buttons, Cards, Inputs)



---



\## Phase 2 – Angebotsmodul (MVP)



\### Funktionen:

\- Kunde auswählen/anlegen

\- Produkt definieren

\- Nutzenrechner

\- Preisberechnung

\- Angebot speichern



\### Nutzenrechner:

\- Bogenformat (SRA3 + Custom)

\- Endformat

\- Beschnitt

\- Steg

\- Greifer

\- Rotation 0° / 90°

\- Beste Variante automatisch

\- Grafische SVG-Darstellung

\- Ausnutzung %

\- Restfläche



\### Laufrichtung (später aktiviert):

\- Papierlaufrichtung (long / short)

\- Produktlaufrichtung

\- Falzregel: Faser parallel zur Falz



---



\## Phase 3 – Maschinenverwaltung



Maschinen mit Parametern:



\- Klickkosten 4/0, 4/4

\- Aufpreis Sonderfarben

\- Klickkosten 1/0, 1/1

\- m² Kosten (Großformat)

\- Rüstkosten

\- Mindestpreis

\- Makulatur-Default



---



\## Phase 4 – Material \& Lager



\### Materialarten:

\- Papier (Bogen)

\- Rollenmaterial

\- Spezialmaterial



\### Funktionen:

\- Artikel anlegen

\- Einkaufspreise

\- Bestand (Bogen/Rolle)

\- Verbrauch aus Auftrag

\- Lagerbewegungen



---



\## Phase 5 – Auftragsverwaltung



Workflow:

Anfrage → Angebot → Auftrag → Produktion → Fertig → Rechnung



\- Status-Board

\- Produktionsnotizen

\- Dateien

\- Terminverwaltung



---



\## Phase 6 – Weiterverarbeitung



Module:

\- Schneiden

\- Falzen

\- Rillen

\- Laminieren

\- Konfektion



Später:

\- Zeitkalkulation

\- Maschinenauslastung



---



\# 4. Datenmodell (Grundstruktur)



\## Customer

\- id

\- name

\- firma

\- adresse

\- email

\- telefon



\## Quote

\- id

\- customerId

\- positionen

\- kalkulation

\- status

\- createdAt



\## Order

\- id

\- quoteId

\- status

\- produktionsdaten



\## Machine

\- id

\- typ

\- kostenparameter

\- formate

\- sonderfarbenfähig



\## Material

\- id

\- name

\- format

\- preis

\- bestand



---



\# 5. Technische Architektur



Frontend:

\- React + TypeScript

\- TailwindCSS

\- SVG für Nutzenrechner



Backend (später):

\- Node.js

\- SQLite (lokal)

\- später PostgreSQL (Server)



Struktur:

\- Modular

\- Serverfähig vorbereitet

\- Lokale Datenbank zuerst



---



\# 6. Nächster Entwicklungsschritt



1\. UI finalisieren

2\. Angebotsmodul als erstes echtes Feature

3\. Nutzenrechner + Grafik optimieren

4\. Maschinenparameter einpflegen



---



\# 7. Designprinzip



\- Modern \& minimalistisch

\- Viel Weißraum

\- Klare Hierarchie

\- Schnell \& übersichtlich

\- Für Produktionsalltag optimiert



---



Projektstatus: Planung abgeschlossen – Umsetzung startet mit Angebotsmodul.

