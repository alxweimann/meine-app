# Digitaldruck App – Architektur & Entscheidungslog

Stand: 2026-02-23

Dieses Dokument hält wichtige technische und konzeptionelle Entscheidungen fest,
damit das Projekt langfristig nachvollziehbar bleibt.

---

## 1. Frontend-Stack

### Entscheidung:
React + TypeScript + Vite + TailwindCSS

### Warum:
- Schnell entwickelbar
- Modular
- Typensicherheit durch TypeScript
- Gute SVG-Unterstützung für Nutzenrechner
- Später serverfähig erweiterbar

---

## 2. Struktur

### Entscheidung:
Modulare Struktur mit Seiten (pages) und UI-Komponenten (ui)

### Warum:
- Skalierbar
- Später leicht in echte Module trennbar
- Gute Trennung zwischen Logik und Layout

---

## 3. Nutzenrechner als reine Rechenfunktion

### Entscheidung:
computeNesting() ist reine Logikfunktion ohne UI-Abhängigkeit

### Warum:
- Testbar
- Später in Backend übertragbar
- Unabhängig von Darstellung

---

## 4. Beste Variante automatisch bestimmen

### Entscheidung:
- Variante mit meisten Nutzen gewinnt
- Bei Gleichstand: weniger Restfläche gewinnt

### Warum:
- Praxisnah
- Produktionslogik
- Automatisierbar

---

## 5. Grafik-Preview (Option B)

### Entscheidung:
- Bogen im Querformat darstellen
- Nutzen zentriert
- Rosa = nicht druckbarer Bereich
- Babyblau = Nutzen
- Rot = Zwischenschnitt
- Dünne Schnittmarken
- Minimaler Radius

### Warum:
- Übersichtlicher
- Produktionsnah
- Schnell interpretierbar für Druckerei

---

## 6. Papierlaufrichtung SB/BB

### Entscheidung:
- SB (Schmalbahn)
- BB (Breitbahn)

### Warum:
Entspricht realer Druckereisprache.

---

## 7. Keine Persistenz am Anfang

### Entscheidung:
Zunächst kein LocalStorage oder Backend.

### Warum:
- Fokus auf Struktur & Logik
- Erst MVP sauber bauen
- Persistenz später integrieren

---

## 8. Git-Workflow

### Entscheidung:
- main bleibt stabil
- Features in feature-Branches
- Tags für stabile Meilensteine

### Warum:
- Crash-Sicherheit
- Saubere Historie
- Rücksprung jederzeit möglich

---

## 9. Dokumentationsstrategie

### Entscheidung:
- planung.md = Vision & Architektur
- stand.md = aktueller Entwicklungsstand
- todo.md = Backlog
- entscheidungen.md = Warum-Log

### Warum:
Maximale Wiederaufnahmefähigkeit bei Projektunterbrechung.