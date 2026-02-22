export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Digitaldruck Dashboard 🚀
        </h1>
        <p className="mt-3 text-zinc-600">
          React + TypeScript + Tailwind läuft erfolgreich.
        </p>

        <button className="mt-6 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Neues Angebot
        </button>
      </div>
    </div>
  );
}