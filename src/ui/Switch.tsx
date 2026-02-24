import React from "react";

type SwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
};

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className = "",
}: SwitchProps) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border bg-white px-4 py-3",
        disabled ? "border-zinc-200 opacity-60" : "border-zinc-200",
        className,
      ].join(" ")}
    >
      {(label || description) && (
        <div className="grid">
          {label && <span className="text-xs font-medium text-zinc-700">{label}</span>}
          {description && <span className="text-[11px] text-zinc-500">{description}</span>}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          checked ? "bg-indigo-600" : "bg-zinc-300",
        ].join(" ")}
        aria-pressed={checked}
        aria-label={label ?? "Switch"}
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white transition",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}