# Digitaldruck App – TODO / Backlog

Stand: 2026-02-23  
Letzter stabiler Commit: 76e4681

---

## 🔥 Next (als nächstes)

### 1) Nutzenrechner: Laufrichtungs-Regeln (SB/BB + Produkt Hoch/Quer)
- [ ] Feature-Branch: feature/nesting-grain-rules
- [ ] Regel-Logik definieren:
  - [ ] Wann ist Rotation erlaubt?
  - [ ] Wann muss Rotation gesperrt werden?
  - [ ] Falzregel später: Faser parallel zur Falz
- [ ] computeNesting erweitern (Rotation-Entscheidung)
- [ ] UI: Hinweis anzeigen, wenn Rotation gesperrt ist
- [ ] Tests mit Beispielen (A4/A5 + SRA3, SB/BB)

### 2) Persistenz (später, aber wichtig)
- [ ] LocalStorage: Kunden + Angebote + Positionen speichern
- [ ] Laden beim Start
- [ ] Reset / Demo-Daten optional

---

## ✅ MVP – Angebotsmodul (Priorität hoch)
- [ ] Angebot: PDF Export (später)
- [ ] Angebot: Positions-Reihenfolge ändern
- [ ] Angebot: Position duplizieren
- [ ] Angebot: Netto/Brutto + MwSt
- [ ] Angebot: Rabatte

---

## 🧑‍💼 Kundenmodul
- [ ] Kunde bearbeiten
- [ ] Validierungen (E-Mail, PLZ, Pflichtfelder)
- [ ] Duplikate erkennen (gleiche Firma)

---

## 🧾 Aufträge (später)
- [ ] Angebot → Auftrag konvertieren
- [ ] Status-Workflow: Anfrage → Angebot → Auftrag → Produktion → Fertig → Rechnung

---

## 🧠 Kalkulation (später)
- [ ] Maschinenmodell & Klickkosten
- [ ] Rüstkosten / Mindestpreis
- [ ] Makulatur-Default
- [ ] Weiterverarbeitung (Schneiden, Falzen, Rillen …)

---

## 🏭 Maschinenverwaltung
- [ ] Maschinen anlegen (Iridesse, Nuvera, VP140, Plotter)
- [ ] Parameter pflegen (Klickkosten, Sonderfarben, m² Kosten)
- [ ] Format-Fähigkeiten (SRA3 etc.)

---

## 📦 Material & Lager
- [ ] Materialstamm (Papier/Rolle)
- [ ] Bestand & Lagerbewegungen
- [ ] Verbrauch aus Auftrag

---

## 🎨 UI / UX
- [ ] Responsive Feinschliff
- [ ] Tastaturbedienung (Enter=Save, Esc=Close)
- [ ] Toast Notifications (Saved/Deleted)
- [ ] Empty States verbessern

---

## 🧪 Qualität
- [ ] ESLint/Prettier Regeln finalisieren
- [ ] Einheitliche Namensgebung (Quotes vs Angebote)
- [ ] Komponenten auslagern (Modal, Input, Select)