import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { UploadCloud, FileSpreadsheet, Wallet, Loader2, Hamburger, Car, House, Book } from "lucide-react";
import { useState } from "react";
import { authenticatedFetch } from "../lib/api";

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
  { e: Hamburger, label: "Food", key: "FOOD" },
  { e: Car, label: "Commute", key: "COMMUTE" },
  { e: House, label: "Dorm", key: "DORM" },
  { e: Book, label: "School", key: "SCHOOL" },
];

function Ingest() {
  const [amount, setAmount] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [direction, setDirection] = useState<"out" | "in">("out");
  const [walletBalance, setWalletBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogTransaction = async () => {
    if (!amount || !activeCategory) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const numericAmount = parseFloat(amount);
    const finalAmount = direction === "out" ? -Math.abs(numericAmount) : Math.abs(numericAmount);

    try {
      await authenticatedFetch("/transactions/manual", {
        method: "POST",
        body: JSON.stringify({
          amount: finalAmount,
          category: activeCategory,
          merchant: merchant.trim() || (direction === "out" ? "General Spend" : "Allowance Topup"),
        }),
      });

      setSuccessMsg("⚡ Transaction written securely to ledger!");
      setAmount("");
      setActiveCategory(null);
      setMerchant("");
    } catch (err: any) {
      console.error("Transaction Ingestion Failure:", err);
      setErrorMsg(err.message || "Failed to commit record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <ViewHeader eyebrow="Smart Ingestion" title="Log it. Three taps." subtitle="Pick a method. We handle the math." />

      {/* Three-tap manual entry */}
      <section className="rounded-3xl border border-border bg-surface p-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Manual input</div>
        
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setDirection("out")}
            className={`rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              direction === "out" ? "bg-caution/20 text-caution" : "bg-background text-muted-foreground"
            }`}
          >
            Expense (-)
          </button>
          <button
            onClick={() => setDirection("in")}
            className={`rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              direction === "in" ? "bg-safe/20 text-safe" : "bg-background text-muted-foreground"
            }`}
          >
            Income (+)
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-xl bg-safe/10 p-3 text-xs text-safe">{successMsg}</div>
        )}

        <div className="mt-8 flex items-baseline gap-2 border-b border-border pb-4">
          <span className="font-display text-4xl text-muted-foreground">₱</span>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full bg-transparent font-display text-6xl outline-none placeholder:text-muted-foreground/10"
          />
        </div>

        {/* Merchant/Note */}
        <div className="mt-6 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Merchant / Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Starbucks, 7-Eleven, Angkas"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {/* Category Pick Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all ${
                activeCategory === c.key
                  ? "border-primary bg-primary/5 scale-[0.98]"
                  : "border-border bg-background hover:border-muted"
              }`}
            >
              <span className="text-2xl"><>{c.e}</></span>
              <span className="text-xs font-medium">{c.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleLogTransaction}
          disabled={loading || !amount || !activeCategory}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-medium text-primary-foreground disabled:opacity-30"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Writing to database ledger...
            </>
          ) : (
            "Log transaction"
          )}
        </button>
      </section>

      {/* Disregard lower tools section for context mapping scope */}
      <div className="grid gap-6 sm:grid-cols-2 opacity-40 pointer-events-none">
        <section className="rounded-3xl border border-border bg-surface p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background border border-border">
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Automation</div>
              <h3 className="font-display text-xl">Screenshot scan</h3>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">GCash/Maya parsing pipeline placeholder.</p>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background border border-border">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Reconciliation</div>
              <h3 className="font-display text-xl">Wallet balance check</h3>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Reconciliation pipeline placeholder.</p>
        </section>
      </div>
    </div>
  );
}