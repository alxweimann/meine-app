import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

type Customer = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  status: "Aktiv" | "Inaktiv";
};

const demoCustomers: Customer[] = [
  {
    id: "C-001",
    name: "Muster GmbH",
    contact: "Max Mustermann",
    email: "info@muster.de",
    phone: "030 1234567",
    street: "Musterstraße 12",
    postalCode: "10115",
    city: "Berlin",
    status: "Aktiv",
  },
  {
    id: "C-002",
    name: "Print & Co",
    contact: "Sarah Klein",
    email: "kontakt@printco.de",
    phone: "089 9876543",
    street: "Druckweg 5",
    postalCode: "80331",
    city: "München",
    status: "Aktiv",
  },
  {
    id: "C-003",
    name: "Eventagentur Berlin",
    contact: "Tim Berger",
    email: "hello@eventberlin.de",
    phone: "040 555555",
    street: "Eventallee 3",
    postalCode: "20095",
    city: "Hamburg",
    status: "Inaktiv",
  },
];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    street: "",
    postalCode: "",
    city: "",
    status: "Aktiv" as Customer["status"],
  });

  function createCustomer() {
    if (!form.name.trim()) return;

    const nextId = "C-" + String(customers.length + 1).padStart(3, "0");

    const newCustomer: Customer = {
      id: nextId,
      name: form.name.trim(),
      contact: form.contact.trim() || "-",
      email: form.email.trim() || "-",
      phone: form.phone.trim() || "-",
      street: form.street.trim() || "-",
      postalCode: form.postalCode.trim() || "-",
      city: form.city.trim() || "-",
      status: form.status,
    };

    setCustomers([newCustomer, ...customers]);
    setSelectedCustomer(newCustomer);

    setForm({
      name: "",
      contact: "",
      email: "",
      phone: "",
      street: "",
      postalCode: "",
      city: "",
      status: "Aktiv",
    });

    setIsModalOpen(false);
  }

  return (
    <div className="grid gap-4">
      {/* Header */}
      <Card className="flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500">Kunden</div>
          <div className="text-lg font-semibold">Kundenübersicht</div>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>Neuer Kunde</Button>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr className="border-b border-zinc-200">
                <th className="px-4 py-3 text-left font-medium">Kundennr.</th>
                <th className="px-4 py-3 text-left font-medium">Firma</th>
                <th className="px-4 py-3 text-left font-medium">Ansprechpartner</th>
                <th className="px-4 py-3 text-left font-medium">E-Mail</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c) => {
                const isActive = selectedCustomer?.id === c.id;

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={[
                      "cursor-pointer border-b border-zinc-100 transition",
                      isActive ? "bg-indigo-50" : "hover:bg-indigo-50",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{c.id}</td>
                    <td className="px-4 py-3 text-zinc-900">{c.name}</td>
                    <td className="px-4 py-3 text-zinc-700">{c.contact}</td>
                    <td className="px-4 py-3 text-zinc-700">{c.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " +
                          (c.status === "Aktiv"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-700")
                        }
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details */}
      {selectedCustomer && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-zinc-500">Kundendetails</div>
              <div className="text-lg font-semibold">{selectedCustomer.name}</div>
            </div>

            <Button variant="secondary" onClick={() => setSelectedCustomer(null)}>
              Schließen
            </Button>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-zinc-700">
            <div>
              <span className="text-zinc-500">Kundennummer:</span>{" "}
              <span className="font-medium text-zinc-900">{selectedCustomer.id}</span>
            </div>
            <div>
              <span className="text-zinc-500">Ansprechpartner:</span>{" "}
              <span className="font-medium text-zinc-900">{selectedCustomer.contact}</span>
            </div>
            <div>
              <span className="text-zinc-500">E-Mail:</span>{" "}
              <span className="font-medium text-zinc-900">{selectedCustomer.email}</span>
            </div>
            <div>
              <span className="text-zinc-500">Telefon:</span>{" "}
              <span className="font-medium text-zinc-900">{selectedCustomer.phone}</span>
            </div>
            <div>
              <span className="text-zinc-500">Adresse:</span>{" "}
              <span className="font-medium text-zinc-900">
                {selectedCustomer.street}, {selectedCustomer.postalCode} {selectedCustomer.city}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Status:</span>{" "}
              <span className="font-medium text-zinc-900">{selectedCustomer.status}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Kunden</div>
                  <div className="text-lg font-semibold">Neuer Kunde</div>
                </div>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Schließen
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">Firma</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="z.B. Muster GmbH"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">
                      Ansprechpartner
                    </span>
                    <input
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                      placeholder="z.B. Max Mustermann"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">Status</span>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value as Customer["status"],
                        })
                      }
                      className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    >
                      <option value="Aktiv">Aktiv</option>
                      <option value="Inaktiv">Inaktiv</option>
                    </select>
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">Telefon</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="z.B. 030 1234567"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">Straße</span>
                    <input
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                      placeholder="z.B. Musterstraße 12"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-zinc-600">PLZ</span>
                    <input
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                      placeholder="z.B. 10115"
                    />
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">Ort</span>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="z.B. Berlin"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600">E-Mail</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-10 rounded-2xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-4 ring-indigo-500/15"
                    placeholder="z.B. info@firma.de"
                  />
                </label>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Abbrechen
                  </Button>

                  <Button onClick={createCustomer}>Speichern</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}