import React from "react";

export function AppShell(props: {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex max-w-[1400px] gap-6 p-6">
        {/* Sidebar */}
        <aside className="w-72 shrink-0">{props.sidebar}</aside>

        {/* Main */}
        <div className="flex-1">
          {/* Topbar (fixed relative to viewport, aligned with content width) */}
          <div className="sticky top-6 z-10">{props.topbar}</div>

          {/* Page content */}
          <div className="mt-4">{props.children}</div>
        </div>
      </div>
    </div>
  );
}