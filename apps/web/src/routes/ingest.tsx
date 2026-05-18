import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { UploadCloud, Wallet as WalletIcon, Loader2, Utensils, Car, Home, BookOpen, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { authenticatedFetch } from "../lib/api";

export const Route = createFileRoute("/ingest")({
  component: Ingest,
  head: () => ({
    meta: [
      { title: "Ingest — Smart expense capture | Kumpas" },
      { name: "description", content: "Three-tap entry with localized multi-wallet ledger targeting." },
    ],
  }),
});

interface WalletItem {
  id: string;
  name: string;
  balance: string;
  isMain: boolean;
}

const CATS = [
  { e: Utensils, label: "Food", key: "FOOD" },
  { e: Car, label: "Commute", key: "COMMUTE" },
  { e: Home, label: "Dorm", key: "DORM" },
  { e: BookOpen, label: "School", key: "SCHOOL" },
];

function Ingest() {
  const [amount, setAmount] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [direction, setDirection] = useState<"out" | "in">("out");
  
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [walletsLoading, setWalletsLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserWallets() {
      try {
        const data = await authenticatedFetch("/transactions/wallets");
        setWallets(data);
        
        const main = data.find((w: WalletItem) => w.isMain);
        if (main) {
          setSelectedWalletId(main.id);
        } else if (data.length > 0) {
          setSelectedWalletId(data[0].id);
        }
      } catch (err) {
        console.error("Wallet discovery failures:", err);
        setErrorMsg("Failed to sync your payment platforms.");
      } finally {
        setWalletsLoading(false);
      }
    }
    fetchUserWallets();
  }, []);

  const handleDirectionChange = (mode: "out" | "in") => {
    setDirection(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (mode === "in") {
      setActiveCategory("ALLOWANCE"); 
    } else {
      setActiveCategory(null);
    }
  };

  const handleLogTransaction = async () => {
    if (!amount || !selectedWalletId || !activeCategory) return;
    
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
          walletId: selectedWalletId,
          merchant: merchant.trim() || (direction === "out" ? "General Spend" : "Wallet Topup"),
        }),
      });

      setSuccessMsg("⚡ Transaction written securely to ledger!");
      setAmount("");
      setMerchant("");
      
      if (direction === "out") {
        setActiveCategory(null);
      }

      setWallets((prev) =>
        prev.map((w) =>
          w.id === selectedWalletId
            ? { ...w, balance: (parseFloat(w.balance) + finalAmount).toString() }
            : w
        )
      );
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

      <section className="rounded-3xl border border-border bg-surface p-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Manual input</div>
        
        {/* Toggle directions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => handleDirectionChange("out")}
            className={`rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              direction === "out" ? "bg-caution/20 text-caution" : "bg-background text-muted-foreground"
            }`}
          >
            Expense (-)
          </button>
          <button
            onClick={() => handleDirectionChange("in")}
            className={`rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              direction === "in" ? "bg-safe/20 text-safe" : "bg-background text-muted-foreground"
            }`}
          >
            Inflow (+)
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-xl bg-safe/10 p-3 text-xs text-safe">{successMsg}</div>
        )}

        {/* TARGET WALLET PICKER PLATFORM */}
        <div className="mt-8 space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {direction === "out" ? "What wallet are you using to spend?" : "What wallet are you adding an amount to?"}
          </label>
          
          {walletsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching active payment methods...
            </div>
          ) : wallets.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-caution bg-caution/10 rounded-xl p-3">
              <AlertCircle className="h-4 w-4" /> Go back to the dashboard to configure a ledger wallet asset first.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {wallets.map((w) => (
                <button
                  type="button"
                  key={w.id}
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                    selectedWalletId === w.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-[10px] font-medium tracking-wide opacity-60">
                    {w.isMain ? "🔒 Core Account" : "Vault Channel"}
                  </span>
                  <span className="text-xs font-semibold mt-0.5 truncate w-full text-foreground">{w.name}</span>
                  <span className="text-[11px] font-display text-muted-foreground mt-2">
                    ₱{parseFloat(w.balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency input form element */}
        <div className="mt-8 flex items-baseline gap-2 border-b border-border pb-4 focus-within:border-primary">
          <span className="font-display text-4xl text-muted-foreground">₱</span>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full bg-transparent font-display text-6xl outline-none placeholder:text-muted-foreground/10"
          />
        </div>

        {/* CONDITIONAL RENDERING: Hide notes and category grids completely if mode is set to Inflow */}
        {direction === "out" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-8">
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
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CATS.map((c) => {
                  const IconComponent = c.e;
                  return (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => setActiveCategory(c.key)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all ${
                        activeCategory === c.key
                          ? "border-primary bg-primary/5 scale-[0.98]"
                          : "border-border bg-background hover:border-muted"
                      }`}
                    >
                      <IconComponent className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium text-foreground">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogTransaction}
          disabled={loading || !amount || !selectedWalletId || !activeCategory}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-30"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Writing to database ledger...
            </>
          ) : (
            direction === "out" ? "Log transaction" : "Confirm Wallet Topup"
          )}
        </button>
      </section>

      {/* Discarded automated tool components list, opacity muted */}
      <div className="grid gap-6 sm:grid-cols-1 opacity-40 pointer-events-none">
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
      </div>
    </div>
  );
}