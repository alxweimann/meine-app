# Digitaldruck App – Entwicklungsstand

## Aktueller stabiler Commit
76e4681  
Improve nesting preview: landscape, centered, thin cut lines and marks

Tag (falls gesetzt):
v0.1-preview-stable

---

## Was aktuell funktioniert

### UI
- AppShell Layout
- Sidebar Navigation
- Topbar
- Design-System (Card, Button)

### Kundenmodul
- Kundenliste
- Suche
- Kunde anlegen
- Kunde löschen
- Detailansicht

### Angebotsmodul
- Angebotsliste
- Suche
- Status-Badges
- Detailansicht
- Angebot löschen
- Positionen hinzufügen
- Positionen bearbeiten
- Positionen löschen

### Nutzenrechner
- Format Presets (SRA3, A3, A4, A5, A6, Custom)
- SB / BB Papierlaufrichtung
- Produkt Hoch / Quer
- Beschnitt
- Nicht druckbarer Bereich
- Zwischenschnitt
- Automatische beste Nutzenvariante
- Zentrierte SVG-Vorschau
- Querformat-Bogen
- Rosa nicht druckbarer Bereich
- Babyblaue Nutzen
- Rote Zwischenschnittlinien
- Dünne Schnittmarken

---

## Bekannte Einschränkungen
- Keine Persistenz (kein LocalStorage / DB)
- Laufrichtung noch nicht logisch in Rotation integriert
- Maschinenparameter noch nicht aktiv in Kalkulation

---

## Nächster Schritt

Feature-Branch:
feature/nesting-grain-rules

Ziel:
Papierlaufrichtung und Produktlaufrichtung sollen
Rotation erlauben oder verbieten.

- Rotation nur wenn technisch zulässig
- UI-Hinweis anzeigen wenn Rotation gesperrt ist
- computeNesting erweitern