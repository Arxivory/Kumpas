import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { UploadCloud, FileSpreadsheet, Wallet } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/ingest")({
  component: Ingest,
  head: () => ({
    meta: [
      { title: "Ingest — Smart expense capture | Kumpas" },
      { name: "description", content: "Three-tap entry, GCash/Maya screenshot OCR, and spreadsheet imports." },
    ],
  }),
});

const CATS = [
  { e: "🍔", label: "Food" },
  { e: "🚙", label: "Commute" },
  { e: "🏠", label: "Dorm" },
  { e: "📚", label: "School" },
];

function Ingest() {
  const [amount, setAmount] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [direction, setDirection] = useState<"out" | "in">("out");
  const [walletBalance, setWalletBalance] = useState("");

  return (
    <div className="space-y-10">
      <ViewHeader eyebrow="Smart Ingestion" title="Log it. Three taps." subtitle="Pick a method. We handle the math." />

      {/* Three-tap manual entry */}
      <section className="rounded-3xl border border-border bg-surface p-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Manual entry</div>
        <div className="mt-6 flex items-baseline justify-center gap-3 border-b border-border pb-8">
          <span className="font-display text-4xl text-muted-foreground">
            {direction === "out" ? "−₱" : "+₱"}
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full max-w-xs bg-transparent text-center font-display text-7xl outline-none placeholder:text-muted-foreground/40 sm:text-8xl"
          />
        </div>

        {/* Direction toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setDirection("out")}
            className={`rounded-full py-2.5 text-xs font-medium transition-colors ${
              direction === "out"
                ? "bg-risk text-risk-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Expense (−)
          </button>
          <button
            type="button"
            onClick={() => setDirection("in")}
            className={`rounded-full py-2.5 text-xs font-medium transition-colors ${
              direction === "in"
                ? "bg-safe text-safe-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inflow (+)
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATS.map((c) => (
            <button
              key={c.label}
              onClick={() => setActive(c.label)}
              className={`group flex flex-col items-center gap-3 rounded-2xl border px-4 py-6 transition-all ${
                active === c.label
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <span className="text-3xl">{c.e}</span>
              <span className="text-sm font-medium">{c.label}</span>
            </button>
          ))}
        </div>

        <button
          disabled={!amount || !active}
          className="mt-8 w-full rounded-xl bg-primary py-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-30"
        >
          Log {direction === "out" ? "expense" : "inflow"}
        </button>
      </section>

      {/* OCR */}
      <section className="rounded-3xl border-2 border-dashed border-border bg-surface/60 p-10 text-center transition-colors hover:border-primary/40">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent">
          <UploadCloud className="h-6 w-6 text-accent-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 font-display text-2xl">Drop your screenshot.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          GCash or Maya transaction screenshots auto-parse on drop.
        </p>
      </section>

      {/* CSV/XLSX */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent">
            <FileSpreadsheet className="h-5 w-5 text-accent-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-display text-xl">Migrate from spreadsheet</h3>
            <p className="text-xs text-muted-foreground">Upload tracking spreadsheet (.csv / .xlsx)</p>
          </div>
        </div>
        <a className="text-xs font-medium text-primary underline-offset-4 hover:underline" href="#">
          Download standard template →
        </a>
      </section>

      {/* Wallet Reconciliation */}
      <section className="rounded-3xl border border-border bg-surface p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-safe/15">
            <Wallet className="h-5 w-5 text-safe" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Reconciliation</div>
            <h3 className="font-display text-xl">Wallet balance check</h3>
          </div>
        </div>

        <p className="mt-6 text-sm text-foreground">
          What is your actual GCash or cash balance right now?
        </p>
        <div className="mt-3 flex items-baseline gap-2 border-b border-border pb-3">
          <span className="font-display text-3xl text-muted-foreground">₱</span>
          <input
            inputMode="decimal"
            value={walletBalance}
            onChange={(e) => setWalletBalance(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full bg-transparent font-display text-4xl outline-none placeholder:text-muted-foreground/30"
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {walletBalance
            ? `This will log an adjustment transaction to match your physical wallet at ₱${walletBalance}.`
            : "This will log an adjustment transaction to match your physical wallet."}
        </p>
        <button
          disabled={!walletBalance}
          className="mt-6 w-full rounded-xl bg-foreground py-3.5 text-sm font-medium text-background transition-opacity disabled:opacity-30"
        >
          Reconcile balance
        </button>
      </section>
    </div>
  );
}
