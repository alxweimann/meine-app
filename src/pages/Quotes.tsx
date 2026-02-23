import { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

/* ================================
   TYPES
================================ */

type QuoteStatus = "Entwurf" | "Gesendet" | "Angenommen" | "Abgelehnt";

type PaperGrain = "SB" | "BB"; // Schmalbahn / Breitbahn
type ProductOrientation = "Hochformat" | "Querformat";
type FormatPreset = "SRA3" | "A3" | "A4" | "A5" | "A6" | "Individuell";

const FORMAT_PRESETS: Array<{
  key: FormatPreset;
  label: string;
  w: number;
  h: number;
}> = [
  { key: "SRA3", label: "SRA3 (320×450 mm)", w: 320, h: 450 },
  { key: "A3", label: "A3 (297×420 mm)", w: 297, h: 420 },
  { key: "A4", label: "A4 (210×297 mm)", w: 210, h: 297 },
  { key: "A5", label: "A5 (148×210 mm)", w: 148, h: 210 },
  { key: "A6", label: "A6 (105×148 mm)", w: 105, h: 148 },
  { key: "Individuell", label: "Individuell …", w: 0, h: 0 },
];

const COLOR_OPTIONS = [
  "1/0 (S/W)",
  "1/1 (S/W beidseitig)",
  "4/0 (CMYK)",
  "4/4 (CMYK beidseitig)",
  "5/0 (CMYK + Sonderfarbe)",
  "5/5 (CMYK + Sonderfarbe beidseitig)",
  "6/0 (CMYK + 2 Sonderfarben)",
  "6/6 (CMYK + 2 Sonderfarben beidseitig)",
] as const;

type ColorOption = (typeof COLOR_OPTIONS)[number];

type QuotePosition = {
  id: string;
  productName: string;

  formatPreset: FormatPreset;
  customWidthMm?: number;
  customHeightMm?: number;

  paperGrain: PaperGrain;
  productOrientation: ProductOrientation;

  quantity: number;
  paper: string;
  colors: ColorOption;
  unitPrice: number;
};

type Quote = {
  id: string;
  title: string;
  customerName: string;
  createdAt: string; // YYYY-MM-DD
  totalNet: number; // Fallback (wenn keine Positionen)
  status: QuoteStatus;
  positions: QuotePosition[];
};

/* ================================
   DEMO DATA
================================ */

const demoCustomers = ["Muster GmbH", "Print & Co", "Eventagentur Berlin"];

const demoQuotes: Quote[] = [
  {
    id: "A-001",
    title: "Flyer A5, 10.000 Stk",
    customerName: "Muster GmbH",
    createdAt: "2026-02-22",
    totalNet: 349.0,
    status: "Entwurf",
    positions: [],
  },
  {
    id: "A-002",
    title: "Broschüre 24S, 500 Stk",
    customerName: "Print & Co",
    createdAt: "2026-02-18",
    totalNet: 1290.0,
    status: "Gesendet",
    positions: [],
  },
  {
    id: "A-003",
    title: "Plakate A1, 50 Stk",
    customerName: "Eventagentur Berlin",
    createdAt: "2026-02-12",
    totalNet: 780.0,
    status: "Angenommen",
    positions: [],
  },
];

/* ================================
   HELPERS
================================ */

function formatEUR(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function newId() {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(16).slice(2);
}

function positionsTotal(positions: QuotePosition[]) {
  return positions.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
}

function quoteNet(q: Quote) {
  return q.positions.length > 0 ? positionsTotal(q.positions) : q.totalNet;
}

function formatDims(p: QuotePosition) {
  const preset = FORMAT_PRESETS.find((x) => x.key === p.formatPreset);
  if (p.formatPreset !== "Individuell" && preset) return `${preset.w}×${preset.h} mm`;
  const w = p.customWidthMm ?? 0;
  const h = p.customHeightMm ?? 0;
  return w && h ? `${w}×${h} mm` : "—";
}

function parseNumberDe(value: string) {
  // akzeptiert "1.234,56" oder "1234,56" oder "1234.56"
  const v = String(value).trim();
  if (!v) return 0;
  const normalized = v.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function parseIntDe(value: string) {
  const v = String(value).trim().replace(/\./g, "");
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const cls =
    status === "Angenommen"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Gesendet"
      ? "bg-blue-50 text-blue-700"
      : status === "Abgelehnt"
      ? "bg-rose-50 text-rose-700"
      : "bg-zinc-100 text-zinc-700";

  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " + cls}>
      {status}
    </span>
  );
}

/* ================================
   COMPONENT
================================ */

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>(demoQuotes);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");

  const [query, setQuery] = useState("");

  // Quote Create Modal
  const [isQuoteCreateModalOpen, setIsQuoteCreateModalOpen] = useState(false);
  const [quoteCreateForm, setQuoteCreateForm] = useState({
    title: "",
    customerName: demoCustomers[0],
    status: "Entwurf" as QuoteStatus,
    totalNet: "",
  });
  const [quoteCreateTouched, setQuoteCreateTouched] = useState(false);

  // Quote Edit Modal
  const [isQuoteEditModalOpen, setIsQuoteEditModalOpen] = useState(false);
  const [quoteEditForm, setQuoteEditForm] = useState({
    title: "",
    customerName: demoCustomers[0],
    status: "Entwurf" as QuoteStatus,
  });
  const [quoteEditTouched, setQuoteEditTouched] = useState(false);

  // Position Modal (Add/Edit)
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posTouched, setPosTouched] = useState(false);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [posForm, setPosForm] = useState({
    productName: "",
    formatPreset: "SRA3" as FormatPreset,
    customWidthMm: "",
    customHeightMm: "",
    paperGrain: "SB" as PaperGrain,
    productOrientation: "Hochformat" as ProductOrientation,
    quantity: "1000",
    paper: "135g Bilderdruck matt",
    colors: "4/4 (CMYK beidseitig)" as ColorOption,
    unitPrice: "0,00",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;

    return quotes.filter((x) => {
      const hay = [
        x.id,
        x.title,
        x.customerName,
        x.status,
        x.createdAt,
        String(quoteNet(x)),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [quotes, query]);

  /* =======================
     QUOTE: CREATE
  ======================= */

  function openCreateQuote() {
    setQuoteCreateForm({
      title: "",
      customerName: demoCustomers[0],
      status: "Entwurf",
      totalNet: "",
    });
    setQuoteCreateTouched(false);
    setIsQuoteCreateModalOpen(true);
  }

  function canSaveNewQuote() {
    return quoteCreateForm.title.trim().length > 0;
  }

  function saveNewQuote() {
    setQuoteCreateTouched(true);
    if (!canSaveNewQuote()) return;

    const nextId = "A-" + String(quotes.length + 1).padStart(3, "0");
    const totalNet = parseNumberDe(quoteCreateForm.totalNet);

    const newQuote: Quote = {
      id: nextId,
      title: quoteCreateForm.title.trim(),
      customerName: quoteCreateForm.customerName,
      createdAt: new Date().toISOString().slice(0, 10),
      totalNet: totalNet,
      status: quoteCreateForm.status,
      positions: [],
    };

    setQuotes([newQuote, ...quotes]);
    setIsQuoteCreateModalOpen(false);
  }

  /* =======================
     QUOTE: EDIT
  ======================= */

  function openEditQuote() {
    if (!selected) return;
    setQuoteEditForm({
      title: selected.title,
      customerName: selected.customerName,
      status: selected.status,
    });
    setQuoteEditTouched(false);
    setIsQuoteEditModalOpen(true);
  }

  function canSaveQuoteEdit() {
    return quoteEditForm.title.trim().length > 0;
  }

  function saveQuoteEdit() {
    setQuoteEditTouched(true);
    if (!selected) return;
    if (!canSaveQuoteEdit()) return;

    const updated: Quote = {
      ...selected,
      title: quoteEditForm.title.trim(),
      customerName: quoteEditForm.customerName,
      status: quoteEditForm.status,
    };

    setSelected(updated);
    setQuotes((prev) => prev.map((q) => (q.id === selected.id ? updated : q)));
    setIsQuoteEditModalOpen(false);
  }

  function deleteSelectedQuote() {
    if (!selected) return;
    const ok = window.confirm(`Angebot wirklich löschen?\n\n${selected.id} – ${selected.title}`);
    if (!ok) return;

    setQuotes((prev) => prev.filter((q) => q.id !== selected.id));
    setSelected(null);
    setView("list");
  }

  /* =======================
     POSITION: CREATE / EDIT
  ======================= */

  function resetPosFormDefaults() {
    setPosForm({
      productName: "",
      formatPreset: "SRA3",
      customWidthMm: "",
      customHeightMm: "",
      paperGrain: "SB",
      productOrientation: "Hochformat",
      quantity: "1000",
      paper: "135g Bilderdruck matt",
      colors: "4/4 (CMYK beidseitig)",
      unitPrice: "0,00",
    });
  }

  function openAddPosition() {
    if (!selected) return;
    setEditingPosId(null);
    resetPosFormDefaults();
    setPosTouched(false);
    setIsPosModalOpen(true);
  }

  function openEditPosition(p: QuotePosition) {
    if (!selected) return;
    setEditingPosId(p.id);

    setPosForm({
      productName: p.productName,
      formatPreset: p.formatPreset,
      customWidthMm: String(p.customWidthMm ?? ""),
      customHeightMm: String(p.customHeightMm ?? ""),
      paperGrain: p.paperGrain,
      productOrientation: p.productOrientation,
      quantity: String(p.quantity),
      paper: p.paper,
      colors: p.colors,
      unitPrice: String(p.unitPrice).replace(".", ","),
    });

    setPosTouched(false);
    setIsPosModalOpen(true);
  }

  function canSavePosition() {
    if (posForm.productName.trim().length === 0) return false;
    if (posForm.formatPreset === "Individuell") {
      const w = parseNumberDe(posForm.customWidthMm);
      const h = parseNumberDe(posForm.customHeightMm);
      if (!(w > 0 && h > 0)) return false;
    }
    return true;
  }

  function upsertPosition() {
    setPosTouched(true);
    if (!selected) return;
    if (!canSavePosition()) return;

    const qty = parseIntDe(posForm.quantity);
    const unit = parseNumberDe(posForm.unitPrice);

    let customWidth: number | undefined = undefined;
    let customHeight: number | undefined = undefined;

    if (posForm.formatPreset === "Individuell") {
      customWidth = parseNumberDe(posForm.customWidthMm);
      customHeight = parseNumberDe(posForm.customHeightMm);
    }

    const normalized: Omit<QuotePosition, "id"> = {
      productName: posForm.productName.trim(),
      formatPreset: posForm.formatPreset,
      customWidthMm: customWidth,
      customHeightMm: customHeight,
      paperGrain: posForm.paperGrain,
      productOrientation: posForm.productOrientation,
      quantity: qty,
      paper: posForm.paper.trim() || "-",
      colors: posForm.colors,
      unitPrice: unit,
    };

    let updatedPositions: QuotePosition[];

    if (editingPosId) {
      updatedPositions = selected.positions.map((p) =>
        p.id === editingPosId ? { ...p, ...normalized } : p
      );
    } else {
      const newPos: QuotePosition = { id: newId(), ...normalized };
      updatedPositions = [newPos, ...selected.positions];
    }

    const updated: Quote = { ...selected, positions: updatedPositions };
    setSelected(updated);
    setQuotes((prev) => prev.map((q) => (q.id === selected.id ? updated : q)));

    setIsPosModalOpen(false);
    setEditingPosId(null);
  }

  function deletePosition(posId: string) {
    if (!selected) return;

    const pos = selected.positions.find((p) => p.id === posId);
    const ok = window.confirm(`Position wirklich löschen?\n\n${pos?.productName ?? posId}`);
    if (!ok) return;

    const updated: Quote = {
      ...selected,
      positions: selected.positions.filter((p) => p.id !== posId),
    };

    setSelected(updated);
    setQuotes((prev) => prev.map((q) => (q.id === selected.id ? updated : q)));
  }

  /* =======================
     UI STATE / VALIDATION
  ======================= */

  const posSum = selected ? positionsTotal(selected.positions) : 0;

  const quoteCreateTitleError = quoteCreateTouched && quoteCreateForm.title.trim().length === 0;
  const quoteEditTitleError = quoteEditTouched && quoteEditForm.title.trim().length === 0;

  const posProductError = posTouched && posForm.productName.trim().length === 0;

  const posCustomSizeError =
    posTouched &&
    posForm.formatPreset === "Individuell" &&
    !(parseNumberDe(posForm.customWidthMm) > 0 && parseNumberDe(posForm.customHeightMm) > 0);

  return (
    <div className="grid gap-4">
      {/* ================= LIST VIEW ================= */}
      {view === "list" && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500">Angebote</div>
              <div className="text-lg font-semibold">Angebotsübersicht</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  🔎
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Angebote suchen…"
                  className="h-10 w-64 rounded-2xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                />
              </div>
              <Button onClick={openCreateQuote}>Neues Angebot</Button>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr className="border-b border-zinc-200">
                    <th className="px-4 py-3 text-left font-medium">Nr.</th>
                    <th className="px-4 py-3 text-left font-medium">Titel</th>
                    <th className="px-4 py-3 text-left font-medium">Kunde</th>
                    <th className="px-4 py-3 text-left font-medium">Datum</th>
                    <th className="px-4 py-3 text-left font-medium">Netto</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => setSelected(q)}
                      className={[
                        "cursor-pointer border-b border-zinc-100 transition",
                        selected?.id === q.id ? "bg-indigo-50" : "hover:bg-indigo-50",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">{q.id}</td>
                      <td className="px-4 py-3 text-zinc-900">{q.title}</td>
                      <td className="px-4 py-3 text-zinc-700">{q.customerName}</td>
                      <td className="px-4 py-3 text-zinc-700">{q.createdAt}</td>
                      <td className="px-4 py-3 text-zinc-700">{formatEUR(quoteNet(q))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={q.status} />
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-zinc-500" colSpan={6}>
                        Keine Angebote gefunden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {selected && (
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Angebot</div>
                  <div className="text-lg font-semibold">
                    {selected.id} – {selected.title}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {selected.customerName} · {selected.createdAt} · {formatEUR(quoteNet(selected))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setSelected(null)}>
                    Schließen
                  </Button>
                  <Button variant="secondary" onClick={deleteSelectedQuote}>
                    Löschen
                  </Button>
                  <Button onClick={() => setView("detail")}>Öffnen</Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ================= DETAIL VIEW ================= */}
      {view === "detail" && selected && (
        <>
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-zinc-500">Angebot</div>
                <div className="text-lg font-semibold">
                  {selected.id} – {selected.title}
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  {selected.customerName} · {selected.createdAt} · <StatusBadge status={selected.status} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setView("list")}>
                  Zurück
                </Button>
                <Button variant="secondary" onClick={openEditQuote}>
                  Bearbeiten
                </Button>
                <Button onClick={openAddPosition}>Position hinzufügen</Button>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <div>
                <div className="text-xs text-zinc-500">Positionen</div>
                <div className="text-sm font-semibold">{selected.positions.length} Position(en)</div>
              </div>

              <div className="text-sm text-zinc-600">
                Summe: <span className="font-semibold text-zinc-900">{formatEUR(posSum)}</span>
              </div>
            </div>

            {selected.positions.length === 0 ? (
              <div className="px-4 py-6 text-sm text-zinc-500">Noch keine Positionen vorhanden.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr className="border-b border-zinc-200">
                      <th className="px-4 py-3 text-left font-medium">Pos</th>
                      <th className="px-4 py-3 text-left font-medium">Produkt</th>
                      <th className="px-4 py-3 text-left font-medium">Format</th>
                      <th className="px-4 py-3 text-left font-medium">Laufrichtung</th>
                      <th className="px-4 py-3 text-left font-medium">Papier</th>
                      <th className="px-4 py-3 text-left font-medium">Farben</th>
                      <th className="px-4 py-3 text-right font-medium">Auflage</th>
                      <th className="px-4 py-3 text-right font-medium">EP</th>
                      <th className="px-4 py-3 text-right font-medium">Gesamt</th>
                      <th className="px-4 py-3 text-right font-medium"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {selected.positions.map((p, idx) => (
                      <tr key={p.id} className="border-b border-zinc-100">
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3 text-zinc-900">{p.productName}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          {p.formatPreset}
                          <span className="text-zinc-400"> · </span>
                          {formatDims(p)}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {p.paperGrain} / {p.productOrientation}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{p.paper}</td>
                        <td className="px-4 py-3 text-zinc-700">{p.colors}</td>
                        <td className="px-4 py-3 text-right text-zinc-900">
                          {p.quantity.toLocaleString("de-DE")}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-900">{formatEUR(p.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-900">
                          {formatEUR(p.unitPrice * p.quantity)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditPosition(p);
                              }}
                              className="rounded-xl px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                              title="Bearbeiten"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePosition(p.id);
                              }}
                              className="rounded-xl px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                              title="Löschen"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ===== Position Modal ===== */}
          {isPosModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/30" onClick={() => setIsPosModalOpen(false)} />

              <div className="relative w-full max-w-xl">
                <Card className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">Angebot</div>
                      <div className="text-lg font-semibold">
                        {editingPosId ? "Position bearbeiten" : "Position hinzufügen"}
                      </div>
                    </div>
                    <Button variant="secondary" onClick={() => setIsPosModalOpen(false)}>
                      Schließen
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-zinc-600">Produkt *</span>
                      <input
                        value={posForm.productName}
                        onChange={(e) => setPosForm({ ...posForm, productName: e.target.value })}
                        onBlur={() => setPosTouched(true)}
                        className={[
                          "h-10 rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15",
                          posProductError ? "border-rose-400" : "border-zinc-200",
                        ].join(" ")}
                        placeholder="z.B. Flyer A5"
                      />
                      {posProductError && (
                        <span className="text-xs text-rose-600">Bitte Produktname eingeben.</span>
                      )}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Format</span>
                        <select
                          value={posForm.formatPreset}
                          onChange={(e) =>
                            setPosForm({ ...posForm, formatPreset: e.target.value as FormatPreset })
                          }
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        >
                          {FORMAT_PRESETS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Auflage</span>
                        <input
                          value={posForm.quantity}
                          onChange={(e) => setPosForm({ ...posForm, quantity: e.target.value })}
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                          placeholder="z.B. 1000"
                        />
                      </label>
                    </div>

                    {posForm.formatPreset === "Individuell" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1">
                          <span className="text-xs font-medium text-zinc-600">Breite (mm) *</span>
                          <input
                            value={posForm.customWidthMm}
                            onChange={(e) => setPosForm({ ...posForm, customWidthMm: e.target.value })}
                            onBlur={() => setPosTouched(true)}
                            className={[
                              "h-10 rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15",
                              posCustomSizeError ? "border-rose-400" : "border-zinc-200",
                            ].join(" ")}
                            placeholder="z.B. 210"
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-xs font-medium text-zinc-600">Höhe (mm) *</span>
                          <input
                            value={posForm.customHeightMm}
                            onChange={(e) => setPosForm({ ...posForm, customHeightMm: e.target.value })}
                            onBlur={() => setPosTouched(true)}
                            className={[
                              "h-10 rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15",
                              posCustomSizeError ? "border-rose-400" : "border-zinc-200",
                            ].join(" ")}
                            placeholder="z.B. 297"
                          />
                        </label>

                        {posCustomSizeError && (
                          <div className="sm:col-span-2 text-xs text-rose-600">
                            Bitte Breite und Höhe größer 0 eingeben.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Papierlaufrichtung</span>
                        <select
                          value={posForm.paperGrain}
                          onChange={(e) =>
                            setPosForm({ ...posForm, paperGrain: e.target.value as PaperGrain })
                          }
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        >
                          <option value="SB">Schmalbahn (SB)</option>
                          <option value="BB">Breitbahn (BB)</option>
                        </select>
                      </label>

                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Produktlaufrichtung</span>
                        <select
                          value={posForm.productOrientation}
                          onChange={(e) =>
                            setPosForm({
                              ...posForm,
                              productOrientation: e.target.value as ProductOrientation,
                            })
                          }
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        >
                          <option value="Hochformat">Hochformat</option>
                          <option value="Querformat">Querformat</option>
                        </select>
                      </label>
                    </div>

                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-zinc-600">Papier</span>
                      <input
                        value={posForm.paper}
                        onChange={(e) => setPosForm({ ...posForm, paper: e.target.value })}
                        className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        placeholder="z.B. 135g Bilderdruck matt"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Farben</span>
                        <select
                          value={posForm.colors}
                          onChange={(e) =>
                            setPosForm({ ...posForm, colors: e.target.value as ColorOption })
                          }
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        >
                          {COLOR_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Einzelpreis (€)</span>
                        <input
                          value={posForm.unitPrice}
                          onChange={(e) => setPosForm({ ...posForm, unitPrice: e.target.value })}
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                          placeholder="z.B. 0,12"
                        />
                      </label>
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Button variant="secondary" onClick={() => setIsPosModalOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={upsertPosition} disabled={!canSavePosition()}>
                        Speichern
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ===== Quote Edit Modal ===== */}
          {isQuoteEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/30" onClick={() => setIsQuoteEditModalOpen(false)} />
              <div className="relative w-full max-w-lg">
                <Card className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">Angebot</div>
                      <div className="text-lg font-semibold">Angebot bearbeiten</div>
                    </div>
                    <Button variant="secondary" onClick={() => setIsQuoteEditModalOpen(false)}>
                      Schließen
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-zinc-600">Titel *</span>
                      <input
                        value={quoteEditForm.title}
                        onChange={(e) => setQuoteEditForm({ ...quoteEditForm, title: e.target.value })}
                        onBlur={() => setQuoteEditTouched(true)}
                        className={[
                          "h-10 rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15",
                          quoteEditTitleError ? "border-rose-400" : "border-zinc-200",
                        ].join(" ")}
                        placeholder="z.B. Flyer A5, 10.000 Stk"
                      />
                      {quoteEditTitleError && (
                        <span className="text-xs text-rose-600">Bitte Titel eingeben.</span>
                      )}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Kunde</span>
                        <select
                          value={quoteEditForm.customerName}
                          onChange={(e) =>
                            setQuoteEditForm({ ...quoteEditForm, customerName: e.target.value })
                          }
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        >
                          {demoCustomers.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Status</span>
                        <select
                          value={quoteEditForm.status}
                          onChange={(e) =>
                            setQuoteEditForm({ ...quoteEditForm, status: e.target.value as QuoteStatus })
                          }
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        >
                          <option value="Entwurf">Entwurf</option>
                          <option value="Gesendet">Gesendet</option>
                          <option value="Angenommen">Angenommen</option>
                          <option value="Abgelehnt">Abgelehnt</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Button variant="secondary" onClick={() => setIsQuoteEditModalOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={saveQuoteEdit} disabled={!canSaveQuoteEdit()}>
                        Speichern
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= Quote Create Modal ================= */}
      {isQuoteCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsQuoteCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Angebote</div>
                  <div className="text-lg font-semibold">Neues Angebot</div>
                </div>
                <Button variant="secondary" onClick={() => setIsQuoteCreateModalOpen(false)}>
                  Schließen
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">Titel *</span>
                  <input
                    value={quoteCreateForm.title}
                    onChange={(e) => setQuoteCreateForm({ ...quoteCreateForm, title: e.target.value })}
                    onBlur={() => setQuoteCreateTouched(true)}
                    className={[
                      "h-10 rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15",
                      quoteCreateTitleError ? "border-rose-400" : "border-zinc-200",
                    ].join(" ")}
                    placeholder="z.B. Flyer A5, 10.000 Stk"
                  />
                  {quoteCreateTitleError && (
                    <span className="text-xs text-rose-600">Bitte Titel eingeben.</span>
                  )}
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">Kunde</span>
                    <select
                      value={quoteCreateForm.customerName}
                      onChange={(e) =>
                        setQuoteCreateForm({ ...quoteCreateForm, customerName: e.target.value })
                      }
                      className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    >
                      {demoCustomers.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">Status</span>
                    <select
                      value={quoteCreateForm.status}
                      onChange={(e) =>
                        setQuoteCreateForm({ ...quoteCreateForm, status: e.target.value as QuoteStatus })
                      }
                      className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    >
                      <option value="Entwurf">Entwurf</option>
                      <option value="Gesendet">Gesendet</option>
                      <option value="Angenommen">Angenommen</option>
                      <option value="Abgelehnt">Abgelehnt</option>
                    </select>
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">Netto Gesamt (€)</span>
                  <input
                    value={quoteCreateForm.totalNet}
                    onChange={(e) => setQuoteCreateForm({ ...quoteCreateForm, totalNet: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="optional (wird später automatisch)"
                  />
                </label>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsQuoteCreateModalOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={saveNewQuote} disabled={!canSaveNewQuote()}>
                    Speichern
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}