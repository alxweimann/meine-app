import { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

type QuoteStatus = "Entwurf" | "Gesendet" | "Angenommen" | "Abgelehnt";

type Quote = {
  id: string;
  title: string;
  customerName: string;
  createdAt: string; // ISO date
  totalNet: number;
  status: QuoteStatus;
};

const demoCustomers = ["Muster GmbH", "Print & Co", "Eventagentur Berlin"];

const demoQuotes: Quote[] = [
  {
    id: "A-001",
    title: "Flyer A5, 10.000 Stk",
    customerName: "Muster GmbH",
    createdAt: "2026-02-22",
    totalNet: 349.0,
    status: "Entwurf",
  },
  {
    id: "A-002",
    title: "Broschüre 24S, 500 Stk",
    customerName: "Print & Co",
    createdAt: "2026-02-18",
    totalNet: 1290.0,
    status: "Gesendet",
  },
  {
    id: "A-003",
    title: "Plakate A1, 50 Stk",
    customerName: "Eventagentur Berlin",
    createdAt: "2026-02-12",
    totalNet: 780.0,
    status: "Angenommen",
  },
];

function formatEUR(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function StatusBadge(props: { status: QuoteStatus }) {
  const cls =
    props.status === "Angenommen"
      ? "bg-emerald-50 text-emerald-700"
      : props.status === "Gesendet"
      ? "bg-blue-50 text-blue-700"
      : props.status === "Abgelehnt"
      ? "bg-rose-50 text-rose-700"
      : "bg-zinc-100 text-zinc-700";

  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " + cls}>
      {props.status}
    </span>
  );
}

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>(demoQuotes);
  const [selected, setSelected] = useState<Quote | null>(null);

  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    customerName: demoCustomers[0],
    status: "Entwurf" as QuoteStatus,
    totalNet: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter((x) => {
      const hay = [x.id, x.title, x.customerName, x.status, x.createdAt, String(x.totalNet)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [quotes, query]);

  function openCreate() {
    setForm({
      title: "",
      customerName: demoCustomers[0],
      status: "Entwurf",
      totalNet: "",
    });
    setIsModalOpen(true);
  }

  function saveQuote() {
    if (!form.title.trim()) return;

    const nextId = "A-" + String(quotes.length + 1).padStart(3, "0");
    const totalNet = Number(String(form.totalNet).replace(",", "."));

    const newQuote: Quote = {
      id: nextId,
      title: form.title.trim(),
      customerName: form.customerName,
      createdAt: new Date().toISOString().slice(0, 10),
      totalNet: Number.isFinite(totalNet) ? totalNet : 0,
      status: form.status,
    };

    setQuotes([newQuote, ...quotes]);
    setSelected(newQuote);
    setIsModalOpen(false);
  }

  function deleteSelected() {
    if (!selected) return;
    const ok = window.confirm(`Angebot wirklich löschen?\n\n${selected.id} – ${selected.title}`);
    if (!ok) return;
    setQuotes(quotes.filter((q) => q.id !== selected.id));
    setSelected(null);
  }

  return (
    <div className="grid gap-4">
      {/* Header */}
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
          <Button onClick={openCreate}>Neues Angebot</Button>
        </div>
      </Card>

      {/* Table */}
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
              {filtered.map((q) => {
                const active = selected?.id === q.id;
                return (
                  <tr
                    key={q.id}
                    onClick={() => setSelected(q)}
                    className={[
                      "cursor-pointer border-b border-zinc-100 transition",
                      active ? "bg-indigo-50" : "hover:bg-indigo-50",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{q.id}</td>
                    <td className="px-4 py-3 text-zinc-900">{q.title}</td>
                    <td className="px-4 py-3 text-zinc-700">{q.customerName}</td>
                    <td className="px-4 py-3 text-zinc-700">{q.createdAt}</td>
                    <td className="px-4 py-3 text-zinc-700">{formatEUR(q.totalNet)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                  </tr>
                );
              })}

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

      {/* Details */}
      {selected && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-zinc-500">Angebot</div>
              <div className="text-lg font-semibold">
                {selected.id} – {selected.title}
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                {selected.customerName} · {selected.createdAt} · {formatEUR(selected.totalNet)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Schließen
              </Button>
              <Button variant="secondary" onClick={deleteSelected}>
                Löschen
              </Button>
              <Button>Öffnen</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Angebote</div>
                  <div className="text-lg font-semibold">Neues Angebot</div>
                </div>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Schließen
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">Titel</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="z.B. Flyer A5, 10.000 Stk"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">Kunde</span>
                    <select
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
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
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as QuoteStatus })}
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
                    value={form.totalNet}
                    onChange={(e) => setForm({ ...form, totalNet: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="z.B. 349,00"
                  />
                </label>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
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