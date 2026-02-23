import { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

type QuoteStatus = "Entwurf" | "Gesendet" | "Angenommen" | "Abgelehnt";

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
  format: string;
  quantity: number;
  paper: string;
  colors: ColorOption;
  unitPrice: number;
};

type Quote = {
  id: string;
  title: string;
  customerName: string;
  createdAt: string;
  totalNet: number;
  status: QuoteStatus;
  positions: QuotePosition[];
};

const demoCustomers = ["Muster GmbH", "Print & Co", "Eventagentur Berlin"];

const demoQuotes: Quote[] = [
  {
    id: "A-001",
    title: "Flyer A5, 10.000 Stk",
    customerName: "Muster GmbH",
    createdAt: "2026-02-22",
    totalNet: 349,
    status: "Entwurf",
    positions: [],
  },
  {
    id: "A-002",
    title: "Broschüre 24S, 500 Stk",
    customerName: "Print & Co",
    createdAt: "2026-02-18",
    totalNet: 1290,
    status: "Gesendet",
    positions: [],
  },
  {
    id: "A-003",
    title: "Plakate A1, 50 Stk",
    customerName: "Eventagentur Berlin",
    createdAt: "2026-02-12",
    totalNet: 780,
    status: "Angenommen",
    positions: [],
  },
];

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

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>(demoQuotes);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [view, setView] = useState<"list" | "detail">("list");

  const [query, setQuery] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posTouched, setPosTouched] = useState(false);

  // Wenn null: wir erstellen neu. Wenn id: wir bearbeiten bestehende Position.
  const [editingPosId, setEditingPosId] = useState<string | null>(null);

  const [posForm, setPosForm] = useState({
    productName: "",
    format: "SRA3",
    quantity: "1000",
    paper: "135g Bilderdruck matt",
    colors: "4/4 (CMYK beidseitig)" as ColorOption,
    unitPrice: "0,00",
  });

  const [quoteForm, setQuoteForm] = useState({
    title: "",
    customerName: demoCustomers[0],
    status: "Entwurf" as QuoteStatus,
    totalNet: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;

    return quotes.filter((x) => {
      const hay = [x.id, x.title, x.customerName, x.status, x.createdAt, String(quoteNet(x))]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [quotes, query]);

  function openCreateQuote() {
    setQuoteForm({
      title: "",
      customerName: demoCustomers[0],
      status: "Entwurf",
      totalNet: "",
    });
    setIsQuoteModalOpen(true);
  }

  function saveQuote() {
    if (!quoteForm.title.trim()) return;

    const nextId = "A-" + String(quotes.length + 1).padStart(3, "0");
    const totalNet = Number(String(quoteForm.totalNet).replace(".", "").replace(",", "."));

    const newQuote: Quote = {
      id: nextId,
      title: quoteForm.title.trim(),
      customerName: quoteForm.customerName,
      createdAt: new Date().toISOString().slice(0, 10),
      totalNet: Number.isFinite(totalNet) ? totalNet : 0,
      status: quoteForm.status,
      positions: [],
    };

    setQuotes([newQuote, ...quotes]);
    setIsQuoteModalOpen(false);
  }

  function deleteSelectedQuote() {
    if (!selected) return;
    const ok = window.confirm(`Angebot wirklich löschen?\n\n${selected.id} – ${selected.title}`);
    if (!ok) return;

    setQuotes((prev) => prev.filter((q) => q.id !== selected.id));
    setSelected(null);
    setView("list");
  }

  function openAddPosition() {
    if (!selected) return;

    setEditingPosId(null);
    setPosForm({
      productName: "",
      format: "SRA3",
      quantity: "1000",
      paper: "135g Bilderdruck matt",
      colors: "4/4 (CMYK beidseitig)" as ColorOption,
      unitPrice: "0,00",
    });

    setPosTouched(false);
    setIsPosModalOpen(true);
  }

  function openEditPosition(p: QuotePosition) {
    if (!selected) return;

    setEditingPosId(p.id);
    setPosForm({
      productName: p.productName,
      format: p.format,
      quantity: String(p.quantity),
      paper: p.paper,
      colors: p.colors,
      unitPrice: String(p.unitPrice).replace(".", ","),
    });

    setPosTouched(false);
    setIsPosModalOpen(true);
  }

  function canSavePosition() {
    return posForm.productName.trim().length > 0;
  }

  function upsertPosition() {
    setPosTouched(true);
    if (!selected) return;
    if (!canSavePosition()) return;

    const qty = parseInt(String(posForm.quantity).replace(/\./g, ""), 10);
    const unit = Number(String(posForm.unitPrice).replace(".", "").replace(",", "."));

    const normalized: Omit<QuotePosition, "id"> = {
      productName: posForm.productName.trim(),
      format: posForm.format.trim() || "-",
      quantity: Number.isFinite(qty) ? qty : 0,
      paper: posForm.paper.trim() || "-",
      colors: posForm.colors,
      unitPrice: Number.isFinite(unit) ? unit : 0,
    };

    let updatedPositions: QuotePosition[];

    if (editingPosId) {
      // UPDATE
      updatedPositions = selected.positions.map((p) =>
        p.id === editingPosId ? { ...p, ...normalized } : p
      );
    } else {
      // CREATE
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

  const posSum = selected ? positionsTotal(selected.positions) : 0;
  const productError = posTouched && posForm.productName.trim().length === 0;

  return (
    <div className="grid gap-4">
      {/* LIST VIEW */}
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

      {/* DETAIL VIEW */}
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
                  {selected.customerName} · {selected.createdAt}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setView("list")}>
                  Zurück
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
              <div className="px-4 py-6 text-sm text-zinc-500">
                Noch keine Positionen vorhanden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr className="border-b border-zinc-200">
                      <th className="px-4 py-3 text-left font-medium">Pos</th>
                      <th className="px-4 py-3 text-left font-medium">Produkt</th>
                      <th className="px-4 py-3 text-left font-medium">Format</th>
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
                        <td className="px-4 py-3 text-zinc-700">{p.format}</td>
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

          {/* POSITION MODAL */}
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
                          productError ? "border-rose-400" : "border-zinc-200",
                        ].join(" ")}
                        placeholder="z.B. Flyer A5"
                      />
                      {productError && (
                        <span className="text-xs text-rose-600">Bitte Produktname eingeben.</span>
                      )}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Format</span>
                        <input
                          value={posForm.format}
                          onChange={(e) => setPosForm({ ...posForm, format: e.target.value })}
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        />
                      </label>

                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Auflage</span>
                        <input
                          value={posForm.quantity}
                          onChange={(e) => setPosForm({ ...posForm, quantity: e.target.value })}
                          className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                        />
                      </label>
                    </div>

                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-zinc-600">Papier</span>
                      <input
                        value={posForm.paper}
                        onChange={(e) => setPosForm({ ...posForm, paper: e.target.value })}
                        className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Farben</span>
                        <select
                          value={posForm.colors}
                          onChange={(e) => setPosForm({ ...posForm, colors: e.target.value as ColorOption })}
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
        </>
      )}

      {/* QUOTE MODAL */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsQuoteModalOpen(false)} />
          <div className="relative w-full max-w-lg">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Angebote</div>
                  <div className="text-lg font-semibold">Neues Angebot</div>
                </div>
                <Button variant="secondary" onClick={() => setIsQuoteModalOpen(false)}>
                  Schließen
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">Titel</span>
                  <input
                    value={quoteForm.title}
                    onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">Kunde</span>
                    <select
                      value={quoteForm.customerName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
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
                      value={quoteForm.status}
                      onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value as QuoteStatus })}
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
                    value={quoteForm.totalNet}
                    onChange={(e) => setQuoteForm({ ...quoteForm, totalNet: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="optional (wird später automatisch)"
                  />
                </label>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsQuoteModalOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={saveQuote}>Speichern</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}