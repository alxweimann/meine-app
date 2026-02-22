import { useState } from "react";
import { AppShell } from "./layout/AppShell";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

type Page = "dashboard" | "customers" | "quotes" | "orders";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return (
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-zinc-600">Übersicht über Angebote und Aufträge.</p>
            <div className="mt-5">
              <Button>Neu</Button>
            </div>
          </Card>
        );

      case "customers":
        return (
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight">Kunden</h1>
            <p className="mt-2 text-zinc-600">Hier verwalten wir Kunden.</p>
          </Card>
        );

      case "quotes":
        return (
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight">Angebote</h1>
            <p className="mt-2 text-zinc-600">Hier entsteht später der Nutzenrechner.</p>
          </Card>
        );

      case "orders":
        return (
          <Card>
            <h1 className="text-2xl font-semibold tracking-tight">Aufträge</h1>
            <p className="mt-2 text-zinc-600">Produktions- und Statusverwaltung.</p>
          </Card>
        );
    }
  }

  const pageTitle =
    activePage === "dashboard"
      ? "Dashboard"
      : activePage === "customers"
      ? "Kunden"
      : activePage === "quotes"
      ? "Angebote"
      : "Aufträge";

  return (
    <AppShell
      sidebar={
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600" />
            <div>
              <div className="text-sm font-semibold leading-4">Digitaldruck</div>
              <div className="text-xs text-zinc-500">Local Workspace</div>
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            <NavButton
              label="Dashboard"
              active={activePage === "dashboard"}
              onClick={() => setActivePage("dashboard")}
            />
            <NavButton
              label="Kunden"
              active={activePage === "customers"}
              onClick={() => setActivePage("customers")}
            />
            <NavButton
              label="Angebote"
              active={activePage === "quotes"}
              onClick={() => setActivePage("quotes")}
            />
            <NavButton
              label="Aufträge"
              active={activePage === "orders"}
              onClick={() => setActivePage("orders")}
            />
          </div>
        </Card>
      }
    topbar={
  <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs text-zinc-500">Seite</div>
        <div className="text-lg font-semibold">{pageTitle}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            🔎
          </span>
          <input
            placeholder="Suche…"
            className="h-10 w-56 rounded-2xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
          />
        </div>
        <Button>Neu</Button>
      </div>
    </div>
  </div>
}
    >
      {renderPage()}
    </AppShell>
  );
}

function NavButton(props: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={`text-left rounded-xl px-3 py-2 text-sm transition ${
        props.active ? "bg-indigo-600 text-white" : "hover:bg-zinc-100 text-zinc-700"
      }`}
    >
      {props.label}
    </button>
  );
}