import { useState, useEffect } from "react";
import { Wallet, Plus, X, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { authenticatedFetch } from "../lib/api";

interface WalletItem {
  id: string;
  name: string;
  balance: string;
  isMain: boolean;
}

interface WalletSectionProps {
  onWalletCreated: () => void;
}

export function WalletSection({ onWalletCreated }: WalletSectionProps) {
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createOpen, setCreateOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [activeWallet, setActiveWallet] = useState<WalletItem | null>(null);
  const [reconcileBalance, setReconcileBalance] = useState("");
  const [reconcileLoading, setReconcileLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchWallets = async () => {
    try {
      const data = await authenticatedFetch("/transactions/wallets");
      setWallets(data);
    } catch (err) {
      console.error("Failed to load user wallets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await authenticatedFetch("/transactions/wallets", {
        method: "POST",
        body: JSON.stringify({
          name: walletName.trim(),
          initialBalance: initialBalance !== "" ? parseFloat(initialBalance) : 0,
        }),
      });
      setWalletName("");
      setInitialBalance("");
      setCreateOpen(false);
      await fetchWallets();
      onWalletCreated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit wallet asset.");
    } finaly: {
      setSubmitting(false);
    }
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWallet || reconcileBalance === "") return;
    setReconcileLoading(true);
    setErrorMsg(null);

    try {
      await authenticatedFetch(`/transactions/wallets/${activeWallet.id}/reconcile`, {
        method: "PATCH",
        body: JSON.stringify({
          newBalance: parseFloat(reconcileBalance),
        }),
      });

      setReconcileOpen(false);
      setActiveWallet(null);
      setReconcileBalance("");
      await fetchWallets();
      onWalletCreated();
    } catch (err: any) {
      console.error("Reconciliation patch failure:", err);
      setErrorMsg(err.message || "Failed to reconcile asset ledger.");
    } finally {
      setReconcileLoading(false);
    }
  };

  const openReconcileModal = (wallet: WalletItem) => {
    setActiveWallet(wallet);
    setReconcileBalance(parseFloat(wallet.balance).toFixed(2));
    setReconcileOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Wallet className="h-3 w-3" />
          <span>Liquidity Vaults</span>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex h-7 items-center gap-1 rounded-lg bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Wallet</span>
        </button>
      </div>

      {/* Wallets Card Layout Display */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-background p-5 transition-all hover:border-muted-foreground/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {w.isMain ? "🔒 Protected Core" : "Account Account"}
                </span>
                <h4 className="mt-1 font-sans text-sm font-semibold tracking-tight text-foreground">
                  {w.name}
                </h4>
              </div>
              
              <button
                onClick={() => openReconcileModal(w)}
                title="Reconcile platform balance"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground transition-all duration-150"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className="mt-4 font-display text-xl text-foreground">
              ₱{parseFloat(w.balance).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: ADD NEW WALLET PLATFORM */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-8 shadow-xl sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">New Wallet Asset</h2>
              <button onClick={() => setCreateOpen(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateWallet} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Platform Name</label>
                <input
                  type="text" required placeholder="e.g. GCash, Maya, Cash on Hand" value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Starting Balance</label>
                <div className="flex items-baseline gap-1.5 border-b border-border pb-1">
                  <span className="font-display text-xl text-muted-foreground">₱</span>
                  <input
                    type="text" inputMode="decimal" placeholder="0.00" value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-transparent font-display text-2xl outline-none"
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting || !walletName.trim()} className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
                {submitting ? "Deploying..." : "Create wallet asset"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LEDGER RECONCILIATION ADJUSTMENT SHEET */}
      {reconcileOpen && activeWallet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-8 shadow-xl sm:rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Wallet Check Balance Sync</h2>
              <button
                onClick={() => { setReconcileOpen(false); setActiveWallet(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{errorMsg}</div>
            )}

            {/* Strict Warning Confirmation Box */}
            <div className="mt-5 flex gap-3 items-start rounded-xl bg-caution/10 border border-caution/20 p-4 text-xs text-caution leading-relaxed">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">Financial Integrity Warning</span>
                Adjusting the real-world state of <strong className="underline">{activeWallet.name}</strong> forces an implicit system delta adjustment entry to preserve time-series tracking calculations.
              </div>
            </div>

            <form onSubmit={handleReconcileSubmit} className="mt-6 space-y-6">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actual Current Balance Right Now
                </label>
                <div className="mt-3 flex items-baseline gap-1.5 border-b border-border pb-2 focus-within:border-primary">
                  <span className="font-display text-3xl text-muted-foreground">₱</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    autoFocus
                    value={reconcileBalance}
                    onChange={(e) => setReconcileBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-transparent font-display text-4xl outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={reconcileLoading || reconcileBalance === ""}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {reconcileLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Synchronizing ledger...
                  </>
                ) : (
                  "Confirm Sync Calibration"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}