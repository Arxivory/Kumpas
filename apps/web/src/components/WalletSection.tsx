import { useState, useEffect } from "react";
import { Wallet, Plus, X, Loader2, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
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
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false); // New deletion modal toggle
  
  const [activeWallet, setActiveWallet] = useState<WalletItem | null>(null);
  
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [reconcileBalance, setReconcileBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWallet || reconcileBalance === "") return;
    setActionLoading(true);
    setErrorMsg(null);

    try {
      await authenticatedFetch(`/transactions/wallets/${activeWallet.id}/reconcile`, {
        method: "PATCH",
        body: JSON.stringify({ newBalance: parseFloat(reconcileBalance) }),
      });
      setReconcileOpen(false);
      setActiveWallet(null);
      await fetchWallets();
      onWalletCreated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reconcile balance.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveWallet = async () => {
    if (!activeWallet) return;
    setActionLoading(true);
    setErrorMsg(null);

    try {
      await authenticatedFetch(`/transactions/wallets/${activeWallet.id}`, {
        method: "DELETE",
      });
      setDeleteOpen(false);
      setActiveWallet(null);
      await fetchWallets();
      onWalletCreated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to archive account pipeline.");
    } finally {
      setActionLoading(false);
    }
  };

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

      {/* Wallets Display Grid */}
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
              
              {/* Context Actions wrapper */}
              {!w.isMain && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <button
                    onClick={() => { setActiveWallet(w); setReconcileBalance(parseFloat(w.balance).toFixed(2)); setReconcileOpen(true); }}
                    className="p-1.5 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors"
                    title="Sync Balance"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { setActiveWallet(w); setDeleteOpen(true); }}
                    className="p-1.5 rounded-lg border border-border bg-surface text-muted-foreground hover:text-destructive transition-colors"
                    title="Archive Account"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-4 font-display text-xl text-foreground">
              ₱{parseFloat(w.balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: ADD WALLET */}
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

      {/* MODAL 2: BALANCE RECONCILIATION */}
      {reconcileOpen && activeWallet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-8 shadow-xl sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Balance Calibration Sync</h2>
              <button onClick={() => { setReconcileOpen(false); setActiveWallet(null); }} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleReconcileSubmit} className="mt-6 space-y-6">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actual Current Balance</label>
                <div className="mt-3 flex items-baseline gap-1.5 border-b border-border pb-2">
                  <span className="font-display text-3xl text-muted-foreground">₱</span>
                  <input
                    type="text" inputMode="decimal" required autoFocus value={reconcileBalance}
                    onChange={(e) => setReconcileBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-transparent font-display text-4xl outline-none"
                  />
                </div>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground">
                {actionLoading ? "Synchronizing ledger..." : "Confirm Sync Calibration"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SOFT-DELETE CONFIRMATION DIALOGUE */}
      {deleteOpen && activeWallet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-8 shadow-xl sm:rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Archive Account Vault?</h2>
              <button onClick={() => { setDeleteOpen(false); setActiveWallet(null); }} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{errorMsg}</div>
            )}

            <div className="mt-6 flex gap-3 items-start rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive leading-relaxed">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">Preserve Transaction Timeline Integrity</span>
                Archiving <strong>{activeWallet.name}</strong> removes it from your layout views and input options. However, its historical transaction movements remain stored in your ledger so your analytical runway figures stay valid.
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setDeleteOpen(false); setActiveWallet(null); }}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveWallet}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-semibold text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                Archive Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}