import { useState, useEffect } from "react";
import { Wallet, Plus, X, Loader2 } from "lucide-react";
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
  const [modalOpen, setModalOpen] = useState(false);

  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
      setModalOpen(false);
      await fetchWallets();
      onWalletCreated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit wallet to your secure ledger.");
    } finally {
      setSubmitting(false);
    }
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
          onClick={() => setModalOpen(true)}
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
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {w.isMain ? "🔒 Protected Core" : "Account Account"}
              </span>
              <h4 className="mt-1 font-sans text-sm font-semibold tracking-tight text-foreground">
                {w.name}
              </h4>
            </div>
            <div className="mt-4 font-display text-xl text-foreground">
              ₱{parseFloat(w.balance).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE WALLET MODAL VIEW */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-8 shadow-xl sm:rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">New Wallet Asset</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border text-muted-foreground transition-transform hover:scale-105"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateWallet} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Wallet Platform Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GCash, Maya, Cash on Hand, BPI"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Starting Current Balance</label>
                <div className="flex items-baseline gap-1.5 border-b border-border pb-1 focus-within:border-primary">
                  <span className="font-display text-xl text-muted-foreground">₱</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-transparent font-display text-2xl outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !walletName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying account...
                  </>
                ) : (
                  "Create wallet asset"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}