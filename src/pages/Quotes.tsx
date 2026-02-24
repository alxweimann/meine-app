import { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";

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

type SheetPreset = "SRA3" | "Individuell";

const SHEET_PRESETS: Array<{
  key: SheetPreset;
  label: string;
  w: number;
  h: number;
}> = [
  { key: "SRA3", label: "SRA3 Bogen (320×450 mm)", w: 320, h: 450 },
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

type NestingLayout = {
  sheetW: number;
  sheetH: number;

  productW: number; // inkl. Beschnitt (final gerechnet)
  productH: number;

  margin: number;
  gap: number;

  gridX: number;
  gridY: number;
  nUp: number;

  rotated: boolean; // Produkt 90° gedreht im Nutzen
  usedW: number;
  usedH: number;

  wasteArea: number; // mm^2
};

type QuotePosition = {
  id: string;
  productName: string;

  // Produktformat
  formatPreset: FormatPreset;
  customWidthMm?: number;
  customHeightMm?: number;

  // Laufrichtung
  paperGrain: PaperGrain;
  productOrientation: ProductOrientation;

  // Nutzen-Setup
  sheetPreset: SheetPreset;
  sheetCustomWmm?: number;
  sheetCustomHmm?: number;
  bleedMm: number; // Beschnitt pro Seite
  marginMm: number; // Nicht druckbarer Bereich (ehem. Rand)
  gapMm: number; // Zwischenschnitt (ehem. Abstand)

  // Ergebnis (für spätere grafische Darstellung)
  nesting?: NestingLayout;

  // Rest
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

function parseNumberDe(value: string) {
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

function formatDimsFromPreset(preset: FormatPreset, customW?: number, customH?: number) {
  const hit = FORMAT_PRESETS.find((x) => x.key === preset);
  if (preset !== "Individuell" && hit) return { w: hit.w, h: hit.h, text: `${hit.w}×${hit.h} mm` };

  const w = customW ?? 0;
  const h = customH ?? 0;
  const text = w > 0 && h > 0 ? `${w}×${h} mm` : "—";
  return { w, h, text };
}

function sheetDimsFromPreset(preset: SheetPreset, customW?: number, customH?: number) {
  const hit = SHEET_PRESETS.find((x) => x.key === preset);
  if (preset !== "Individuell" && hit) return { w: hit.w, h: hit.h, text: `${hit.w}×${hit.h} mm` };

  const w = customW ?? 0;
  const h = customH ?? 0;
  const text = w > 0 && h > 0 ? `${w}×${h} mm` : "—";
  return { w, h, text };
}

function applyOrientation(
  dims: { w: number; h: number },
  orientation: ProductOrientation
) {
  const w = dims.w;
  const h = dims.h;

  if (orientation === "Hochformat") {
    // Hochformat = Höhe ist die lange Seite
    return h >= w ? { w, h } : { w: h, h: w };
  }

  // Querformat = Breite ist die lange Seite
  return w >= h ? { w, h } : { w: h, h: w };
}

function safeFloor(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function isRotationAllowed(params: { paperGrain: PaperGrain; productOrientation: ProductOrientation }) {
  // Aktuell: immer erlauben (Falz-/Faser-Regel folgt später).
  // Hier können wir später Regeln einbauen (z.B. Falz: Faser parallel zur Falz).
  void params;
  return true;
}

function computeNesting(params: {
  sheetW: number;
  sheetH: number;
  productTrimW: number;
  productTrimH: number;
  bleed: number;
  margin: number;
  gap: number;
  allowRotation?: boolean;
}): NestingLayout | null {
  const allowRotation = params.allowRotation ?? true;

  const sheetW = params.sheetW;
  const sheetH = params.sheetH;

  const bleed = Math.max(0, params.bleed);
  const margin = Math.max(0, params.margin);
  const gap = Math.max(0, params.gap);

  const productW = params.productTrimW + 2 * bleed;
  const productH = params.productTrimH + 2 * bleed;

  if (!(sheetW > 0 && sheetH > 0 && productW > 0 && productH > 0)) return null;

  const availW = sheetW - 2 * margin;
  const availH = sheetH - 2 * margin;
  if (availW <= 0 || availH <= 0) return null;

  function candidate(w: number, h: number, rotated: boolean): NestingLayout {
    const gridX = safeFloor((availW + gap) / (w + gap));
    const gridY = safeFloor((availH + gap) / (h + gap));
    const nUp = gridX * gridY;

    const usedW = gridX > 0 ? gridX * w + (gridX - 1) * gap : 0;
    const usedH = gridY > 0 ? gridY * h + (gridY - 1) * gap : 0;

    const wasteArea = Math.max(0, availW * availH - usedW * usedH);

    return {
      sheetW,
      sheetH,
      productW: w,
      productH: h,
      margin,
      gap,
      gridX,
      gridY,
      nUp,
      rotated,
      usedW,
      usedH,
      wasteArea,
    };
  }

  const c1 = candidate(productW, productH, false);
  const c2 = allowRotation ? candidate(productH, productW, true) : null;

  // Rotation bevorzugen bei Gleichstand (wie du es wolltest)
  const best =
    !c2
      ? c1
      : c2.nUp > c1.nUp
      ? c2
      : c2.nUp < c1.nUp
      ? c1
      : c2.wasteArea <= c1.wasteArea
      ? c2
      : c1;

  return best.nUp > 0 ? best : null;
}


/* ================================
   GRAPHIC PREVIEW (Option B)
================================ */
/* ================================
   GRAPHIC PREVIEW (Option B)
================================ */

function NestingPreview(props: { layout: NestingLayout; paperGrain?: PaperGrain }) {
  const { layout, paperGrain } = props;

  // RAW sheet dims (mm units from computeNesting)
  const rawW = layout.sheetW;
  const rawH = layout.sheetH;

  // Always display landscape: rotate only the drawing if portrait
  const isPortrait = rawH > rawW;
  const viewW = isPortrait ? rawH : rawW;
  const viewH = isPortrait ? rawW : rawH;

  const margin = layout.margin ?? 0;
  const gap = layout.gap ?? 0;

  const printableW = Math.max(0, rawW - 2 * margin);
  const printableH = Math.max(0, rawH - 2 * margin);

  // IMPORTANT: layout already represents the BEST variant.
  // If rotated was best, productW/productH + gridX/gridY already reflect that.
  const prodW = layout.productW;
  const prodH = layout.productH;

  const gridX = Math.max(0, layout.gridX);
  const gridY = Math.max(0, layout.gridY);

  // Used area (includes gaps)
  const usedW = gridX > 0 ? gridX * prodW + (gridX - 1) * gap : 0;
  const usedH = gridY > 0 ? gridY * prodH + (gridY - 1) * gap : 0;

  // Center grid in printable area
  const startX = margin + Math.max(0, (printableW - usedW) / 2);
  const startY = margin + Math.max(0, (printableH - usedH) / 2);

  // Build rects
  const rects: Array<{ x: number; y: number; w: number; h: number; key: string }> = [];
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      rects.push({
        x: startX + x * (prodW + gap),
        y: startY + y * (prodH + gap),
        w: prodW,
        h: prodH,
        key: `${x}-${y}`,
      });
    }
  }

  // Used bounds (for crop marks)
  const usedX0 = startX;
  const usedY0 = startY;
  const usedX1 = startX + usedW;
  const usedY1 = startY + usedH;

  // Zwischenschnitt lines (mid-gap)
  const cutLines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];

  if (gap > 0 && gridX > 1) {
    for (let i = 1; i < gridX; i++) {
      const x = startX + i * prodW + (i - 0.5) * gap;
      cutLines.push({ x1: x, y1: usedY0, x2: x, y2: usedY1, key: `v-${i}` });
    }
  }

  if (gap > 0 && gridY > 1) {
    for (let i = 1; i < gridY; i++) {
      const y = startY + i * prodH + (i - 0.5) * gap;
      cutLines.push({ x1: usedX0, y1: y, x2: usedX1, y2: y, key: `h-${i}` });
    }
  }

  const cropLen = Math.min(12, Math.max(6, Math.min(rawW, rawH) * 0.03));
  const cropStroke = 0.35;
  const cutStroke = 0.35;

  // Rotate entire content if portrait (RAW -> VIEW)
  const groupTransform = isPortrait ? `translate(${viewW} 0) rotate(90)` : undefined;

  // ===== Paper grain arrow (VIEW coords) =====
  // SB: left->right, BB: bottom->top
  const arrow = (() => {
    if (!paperGrain) return null;

    const arrowLen = Math.min(55, Math.max(35, viewW * 0.12));
    const ax = Math.max(8, viewW * 0.03);
    const ay = viewH - Math.max(10, viewH * 0.05);

    const stroke = 0.9;
    const color = "#334155";
    const head = 4.2;

    if (paperGrain === "SB") {
      const x1 = ax;
      const y1 = ay;
      const x2 = ax + arrowLen;
      const y2 = ay;

      const p1 = `${x2},${y2}`;
      const p2 = `${x2 - head},${y2 - head * 0.9}`;
      const p3 = `${x2 - head},${y2 + head * 0.9}`;

      return (
        <>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={stroke} />
          <polygon points={`${p1} ${p2} ${p3}`} fill={color} />
          <text x={x1} y={y1 - 4.5} fontSize={8.5} fill={color}>
            SB
          </text>
        </>
      );
    }

    // BB
    const x1 = ax;
    const y1 = ay;
    const x2 = ax;
    const y2 = ay - arrowLen;

    const p1 = `${x2},${y2}`;
    const p2 = `${x2 - head * 0.9},${y2 + head}`;
    const p3 = `${x2 + head * 0.9},${y2 + head}`;

    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={stroke} />
        <polygon points={`${p1} ${p2} ${p3}`} fill={color} />
        <text x={x1 + 6} y={y1 - 2} fontSize={8.5} fill={color}>
          BB
        </text>
      </>
    );
  })();

  return (
    <div className="relative">
      {/* Badges */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700">
          {layout.nUp} Nutzen/Bogen
        </span>
        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700">
          {layout.gridX}×{layout.gridY}
        </span>
        {layout.rotated && (
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
            gedreht
          </span>
        )}
      </div>

      {/* Preview container */}
      <div className="flex h-[440px] w-full items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white p-4">
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="block max-h-full max-w-full" preserveAspectRatio="xMidYMid meet">
          {/* Arrow ALWAYS bottom-left (VIEW coords) */}
          {arrow}

          {/* Content is RAW; rotate into VIEW if needed */}
          <g transform={groupTransform}>
            {/* Outer sheet */}
            <rect x={0} y={0} width={rawW} height={rawH} fill="#ffffff" stroke="#0f172a" strokeWidth={0.6} />

            {/* Non-printable area (pink) */}
            <rect x={0} y={0} width={rawW} height={rawH} fill="#ffd6e7" opacity={0.55} />
            {/* Printable area */}
            <rect x={margin} y={margin} width={printableW} height={printableH} fill="#ffffff" />
            <rect x={margin} y={margin} width={printableW} height={printableH} fill="none" stroke="#e4e4e7" strokeWidth={0.6} />

            {/* Zwischenschnitt (red thin) */}
            {cutLines.map((l) => (
              <line
                key={l.key}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="#ff2d2d"
                strokeWidth={cutStroke}
                opacity={0.9}
                shapeRendering="crispEdges"
              />
            ))}

            {/* Nutzen (baby blue) */}
            {rects.map((r) => (
              <rect
                key={r.key}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill="#cfe9ff"
                stroke="#0f172a"
                strokeWidth={0.4}
                shapeRendering="crispEdges"
              />
            ))}

            {/* Crop marks (thin) */}
            {layout.nUp > 0 && (
              <>
                {/* top-left */}
                <line x1={usedX0} y1={usedY0 - cropLen} x2={usedX0} y2={usedY0} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />
                <line x1={usedX0 - cropLen} y1={usedY0} x2={usedX0} y2={usedY0} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />

                {/* top-right */}
                <line x1={usedX1} y1={usedY0 - cropLen} x2={usedX1} y2={usedY0} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />
                <line x1={usedX1} y1={usedY0} x2={usedX1 + cropLen} y2={usedY0} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />

                {/* bottom-left */}
                <line x1={usedX0} y1={usedY1} x2={usedX0} y2={usedY1 + cropLen} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />
                <line x1={usedX0 - cropLen} y1={usedY1} x2={usedX0} y2={usedY1} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />

                {/* bottom-right */}
                <line x1={usedX1} y1={usedY1} x2={usedX1} y2={usedY1 + cropLen} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />
                <line x1={usedX1} y1={usedY1} x2={usedX1 + cropLen} y2={usedY1} stroke="#0f172a" strokeWidth={cropStroke} opacity={0.8} shapeRendering="crispEdges" />
              </>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}

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

  allowAutoRotate: true, // ✅ NEU

  sheetPreset: "SRA3" as SheetPreset,
  sheetCustomWmm: "",
  sheetCustomHmm: "",
  bleedMm: "3",
  marginMm: "5",
  gapMm: "3",

  quantity: "1000",
  paper: "135g Bilderdruck matt",
  colors: "4/4 (CMYK beidseitig)" as ColorOption,
  unitPrice: "0,00",
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
      totalNet,
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
    formatPreset: "SRA3" as FormatPreset,
    customWidthMm: "",
    customHeightMm: "",
    paperGrain: "SB" as PaperGrain,
    productOrientation: "Hochformat" as ProductOrientation,

    allowAutoRotate: true, // ✅ NEU

    sheetPreset: "SRA3" as SheetPreset,
    sheetCustomWmm: "",
    sheetCustomHmm: "",
    bleedMm: "3",
    marginMm: "5",
    gapMm: "3",

    quantity: "1000",
    paper: "135g Bilderdruck matt",
    colors: "4/4 (CMYK beidseitig)" as ColorOption,
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

    const dims = formatDimsFromPreset(p.formatPreset, p.customWidthMm, p.customHeightMm);
    const sheetDims = sheetDimsFromPreset(p.sheetPreset, p.sheetCustomWmm, p.sheetCustomHmm);

  setPosForm({
  productName: p.productName,
  formatPreset: p.formatPreset,
  customWidthMm: p.formatPreset === "Individuell" ? String(dims.w || "") : "",
  customHeightMm: p.formatPreset === "Individuell" ? String(dims.h || "") : "",
  paperGrain: p.paperGrain,
  productOrientation: p.productOrientation,

  allowAutoRotate: true, // ✅ oder später aus p speichern, falls du es persistieren willst

  sheetPreset: p.sheetPreset,
  sheetCustomWmm: p.sheetPreset === "Individuell" ? String(sheetDims.w || "") : "",
  sheetCustomHmm: p.sheetPreset === "Individuell" ? String(sheetDims.h || "") : "",
  bleedMm: String(p.bleedMm),
  marginMm: String(p.marginMm),
  gapMm: String(p.gapMm),

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

    const prod =
      posForm.formatPreset === "Individuell"
        ? { w: parseNumberDe(posForm.customWidthMm), h: parseNumberDe(posForm.customHeightMm) }
        : formatDimsFromPreset(posForm.formatPreset);

    if (!(prod.w > 0 && prod.h > 0)) return false;

    if (posForm.sheetPreset === "Individuell") {
      const sw = parseNumberDe(posForm.sheetCustomWmm);
      const sh = parseNumberDe(posForm.sheetCustomHmm);
      if (!(sw > 0 && sh > 0)) return false;
    }

    return true;
  }

  const liveNesting = useMemo(() => {
    const base =
      posForm.formatPreset === "Individuell"
        ? { w: parseNumberDe(posForm.customWidthMm), h: parseNumberDe(posForm.customHeightMm) }
        : formatDimsFromPreset(posForm.formatPreset);

    const prod =
      posForm.productOrientation === "Querformat"
        ? { w: base.h, h: base.w }
        : { w: base.w, h: base.h };

    const sheet =
      posForm.sheetPreset === "Individuell"
        ? { w: parseNumberDe(posForm.sheetCustomWmm), h: parseNumberDe(posForm.sheetCustomHmm) }
        : sheetDimsFromPreset(posForm.sheetPreset);

    const bleed = parseNumberDe(posForm.bleedMm);
    const margin = parseNumberDe(posForm.marginMm);
    const gap = parseNumberDe(posForm.gapMm);

    if (!(prod.w > 0 && prod.h > 0 && sheet.w > 0 && sheet.h > 0)) return null;

  return computeNesting({
  sheetW: sheet.w,
  sheetH: sheet.h,
  productTrimW: prod.w,
  productTrimH: prod.h,
  bleed,
  margin,
  gap,
  allowRotation:
    posForm.allowAutoRotate &&
    isRotationAllowed({
      paperGrain: posForm.paperGrain,
      productOrientation: posForm.productOrientation,
    }),
});
  }, [
    posForm.formatPreset,
    posForm.customWidthMm,
    posForm.customHeightMm,
    posForm.productOrientation,
    posForm.sheetPreset,
    posForm.sheetCustomWmm,
    posForm.sheetCustomHmm,
    posForm.bleedMm,
    posForm.marginMm,
    posForm.gapMm,
    posForm.paperGrain,
    posForm.allowAutoRotate,
  ]);

  function upsertPosition() {
    setPosTouched(true);
    if (!selected) return;
    if (!canSavePosition()) return;

    const qty = parseIntDe(posForm.quantity);
    const unit = parseNumberDe(posForm.unitPrice);

    const prodDims =
      posForm.formatPreset === "Individuell"
        ? { w: parseNumberDe(posForm.customWidthMm), h: parseNumberDe(posForm.customHeightMm), text: "" }
        : formatDimsFromPreset(posForm.formatPreset);

    const sheetDims =
      posForm.sheetPreset === "Individuell"
        ? { w: parseNumberDe(posForm.sheetCustomWmm), h: parseNumberDe(posForm.sheetCustomHmm), text: "" }
        : sheetDimsFromPreset(posForm.sheetPreset);

    const bleedMm = Math.max(0, parseNumberDe(posForm.bleedMm));
    const marginMm = Math.max(0, parseNumberDe(posForm.marginMm));
    const gapMm = Math.max(0, parseNumberDe(posForm.gapMm));

    const orientedProd =
      posForm.productOrientation === "Querformat"
        ? { w: prodDims.h, h: prodDims.w }
        : { w: prodDims.w, h: prodDims.h };

    const nesting = computeNesting({
  sheetW: sheetDims.w,
  sheetH: sheetDims.h,
  productTrimW: orientedProd.w,
  productTrimH: orientedProd.h,
  bleed: bleedMm,
  margin: marginMm,
  gap: gapMm,
  allowRotation:
    posForm.allowAutoRotate &&
    isRotationAllowed({
      paperGrain: posForm.paperGrain,
      productOrientation: posForm.productOrientation,
    }),
});

    const normalized: Omit<QuotePosition, "id"> = {
      productName: posForm.productName.trim(),

      formatPreset: posForm.formatPreset,
      customWidthMm: posForm.formatPreset === "Individuell" ? prodDims.w : undefined,
      customHeightMm: posForm.formatPreset === "Individuell" ? prodDims.h : undefined,

      paperGrain: posForm.paperGrain,
      productOrientation: posForm.productOrientation,

      sheetPreset: posForm.sheetPreset,
      sheetCustomWmm: posForm.sheetPreset === "Individuell" ? sheetDims.w : undefined,
      sheetCustomHmm: posForm.sheetPreset === "Individuell" ? sheetDims.h : undefined,
      bleedMm,
      marginMm,
      gapMm,

      nesting: nesting ?? undefined,

      quantity: qty,
      paper: posForm.paper.trim() || "-",
      colors: posForm.colors,
      unitPrice: unit,
    };

    let updatedPositions: QuotePosition[];

    if (editingPosId) {
      updatedPositions = selected.positions.map((p) => (p.id === editingPosId ? { ...p, ...normalized } : p));
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
     VALIDATION
  ======================= */

  const posSum = selected ? positionsTotal(selected.positions) : 0;

  const quoteCreateTitleError = quoteCreateTouched && quoteCreateForm.title.trim().length === 0;
  const quoteEditTitleError = quoteEditTouched && quoteEditForm.title.trim().length === 0;

  const posProductError = posTouched && posForm.productName.trim().length === 0;

  const posCustomSizeError =
    posTouched &&
    posForm.formatPreset === "Individuell" &&
    !(parseNumberDe(posForm.customWidthMm) > 0 && parseNumberDe(posForm.customHeightMm) > 0);

  const sheetCustomSizeError =
    posTouched &&
    posForm.sheetPreset === "Individuell" &&
    !(parseNumberDe(posForm.sheetCustomWmm) > 0 && parseNumberDe(posForm.sheetCustomHmm) > 0);

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
                      <th className="px-4 py-3 text-left font-medium">Nutzen</th>
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
                    {selected.positions.map((p, idx) => {
                      const dims = formatDimsFromPreset(p.formatPreset, p.customWidthMm, p.customHeightMm);
                      const n = p.nesting;
                      return (
                        <tr key={p.id} className="border-b border-zinc-100">
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-3 text-zinc-900">{p.productName}</td>
                          <td className="px-4 py-3 text-zinc-700">
                            {p.formatPreset}
                            <span className="text-zinc-400"> · </span>
                            {dims.text}
                          </td>
                          <td className="px-4 py-3 text-zinc-700">
                            {n ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="font-medium text-zinc-900">{n.nUp} Nutzen</span>
                                <span className="text-zinc-500">
                                  ({n.gridX}×{n.gridY}
                                  {n.rotated ? " · gedreht" : ""})
                                </span>
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ===== Position Modal (scrollbar, max-w-5xl) ===== */}
          {isPosModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="min-h-full p-6 flex items-start justify-center">
                <div className="absolute inset-0 bg-black/30" onClick={() => setIsPosModalOpen(false)} />
                <div className="relative w-full max-w-5xl">
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

                    <div className="mt-4 grid gap-4">
                      {/* Produkt */}
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

                      {/* Format + Auflage */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1">
                          <span className="text-xs font-medium text-zinc-600">Produktformat</span>
                          <select
                            value={posForm.formatPreset}
                            onChange={(e) => setPosForm({ ...posForm, formatPreset: e.target.value as FormatPreset })}
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

                      {/* Custom Produktgröße */}
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

                      {/* Laufrichtung */}
<div className="grid gap-3 sm:grid-cols-2">
  <label className="grid gap-1">
    <span className="text-xs font-medium text-zinc-600">Papierlaufrichtung</span>
    <select
      value={posForm.paperGrain}
      onChange={(e) => setPosForm({ ...posForm, paperGrain: e.target.value as PaperGrain })}
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

<Switch
  checked={posForm.allowAutoRotate}
  onChange={(next) => setPosForm({ ...posForm, allowAutoRotate: next })}
  label="Auto-Rotation erlauben"
  description="Produkt darf im Nutzen um 90° gedreht werden."
/>

{/* Nutzen Setup */}
<Card className="p-4 bg-zinc-50/60 border border-zinc-200">
  ...
</Card>

                      {/* Nutzen Setup */}
                      <Card className="p-4 bg-zinc-50/60 border border-zinc-200">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs text-zinc-500">Nutzenrechner</div>
                            <div className="text-sm font-semibold text-zinc-900">
                              Bogen / Beschnitt / Bereich / Zwischenschnitt
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500">Vorschau aktiv</div>
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          <label className="min-w-0 flex flex-col gap-1">
                            <span className="text-[11px] leading-4 font-medium text-zinc-600">Bogenformat</span>
                            <select
                              value={posForm.sheetPreset}
                              onChange={(e) => setPosForm({ ...posForm, sheetPreset: e.target.value as SheetPreset })}
                              className="h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                            >
                              {SHEET_PRESETS.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="min-w-0 grid gap-3 sm:grid-cols-3">
                            <label className="min-w-0 flex flex-col gap-1">
                              <span className="text-[11px] leading-4 font-medium text-zinc-600 whitespace-nowrap">
                                Beschnitt (mm)
                              </span>
                              <input
                                value={posForm.bleedMm}
                                onChange={(e) => setPosForm({ ...posForm, bleedMm: e.target.value })}
                                className="h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>

                            <label className="min-w-0 flex flex-col gap-1">
                              <span className="text-[11px] leading-4 font-medium text-zinc-600 whitespace-nowrap">
                                Nicht druckb. (mm)
                              </span>
                              <input
                                value={posForm.marginMm}
                                onChange={(e) => setPosForm({ ...posForm, marginMm: e.target.value })}
                                className="h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>

                            <label className="min-w-0 flex flex-col gap-1">
                              <span className="text-[11px] leading-4 font-medium text-zinc-600 whitespace-nowrap">
                                Zwischenschnitt (mm)
                              </span>
                              <input
                                value={posForm.gapMm}
                                onChange={(e) => setPosForm({ ...posForm, gapMm: e.target.value })}
                                className="h-10 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                              />
                            </label>
                          </div>
                        </div>

                        {posForm.sheetPreset === "Individuell" && (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="min-w-0 flex flex-col gap-1">
                              <span className="text-[11px] leading-4 font-medium text-zinc-600">Bogen Breite (mm) *</span>
                              <input
                                value={posForm.sheetCustomWmm}
                                onChange={(e) => setPosForm({ ...posForm, sheetCustomWmm: e.target.value })}
                                onBlur={() => setPosTouched(true)}
                                className={[
                                  "h-10 w-full rounded-2xl border bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10",
                                  sheetCustomSizeError ? "border-rose-400" : "border-zinc-200",
                                ].join(" ")}
                                placeholder="z.B. 320"
                              />
                            </label>

                            <label className="min-w-0 flex flex-col gap-1">
                              <span className="text-[11px] leading-4 font-medium text-zinc-600">Bogen Höhe (mm) *</span>
                              <input
                                value={posForm.sheetCustomHmm}
                                onChange={(e) => setPosForm({ ...posForm, sheetCustomHmm: e.target.value })}
                                onBlur={() => setPosTouched(true)}
                                className={[
                                  "h-10 w-full rounded-2xl border bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10",
                                  sheetCustomSizeError ? "border-rose-400" : "border-zinc-200",
                                ].join(" ")}
                                placeholder="z.B. 450"
                              />
                            </label>

                            {sheetCustomSizeError && (
                              <div className="sm:col-span-2 text-xs text-rose-600">
                                Bitte Bogen-Breite und -Höhe größer 0 eingeben.
                              </div>
                            )}
                          </div>
                        )}

                        {liveNesting && <NestingPreview layout={liveNesting} paperGrain={posForm.paperGrain} />}

                        <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4">
                          {liveNesting ? (
                            <div className="grid gap-1 text-sm">
                              <div className="flex items-center justify-between">
                                <div className="text-zinc-600">Nutzen pro Bogen</div>
                                <div className="font-semibold text-zinc-900">{liveNesting.nUp}</div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-zinc-600">Raster</div>
                                <div className="text-zinc-900">
                                  {liveNesting.gridX} × {liveNesting.gridY}
                                  {liveNesting.rotated ? " (gedreht)" : ""}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-zinc-600">Abfall (Fläche)</div>
                                <div className="text-zinc-900">{(liveNesting.wasteArea / 100).toFixed(0)} cm²</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-500">
                              Nutzen kann noch nicht berechnet werden (bitte Format/Bogen prüfen).
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Papier / Farben / Preis */}
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

                      <div className="mt-1 flex items-center justify-end gap-2">
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
                      />
                      {quoteEditTitleError && <span className="text-xs text-rose-600">Bitte Titel eingeben.</span>}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-medium text-zinc-600">Kunde</span>
                        <select
                          value={quoteEditForm.customerName}
                          onChange={(e) => setQuoteEditForm({ ...quoteEditForm, customerName: e.target.value })}
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
                          onChange={(e) => setQuoteEditForm({ ...quoteEditForm, status: e.target.value as QuoteStatus })}
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
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsQuoteCreateModalOpen(false)} />

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
                  />
                  {quoteCreateTitleError && <span className="text-xs text-rose-600">Bitte Titel eingeben.</span>}
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">Kunde</span>
                    <select
                      value={quoteCreateForm.customerName}
                      onChange={(e) => setQuoteCreateForm({ ...quoteCreateForm, customerName: e.target.value })}
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
                      onChange={(e) => setQuoteCreateForm({ ...quoteCreateForm, status: e.target.value as QuoteStatus })}
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
