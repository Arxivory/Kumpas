import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { CloudRain, TrendingUp, Settings2, X, Loader2, ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { authenticatedFetch } from "../lib/api";
import { WalletSection } from "@/components/WalletSection";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Kumpas — Your financial runway" },
      { name: "description", content: "See your remaining days of runway, financial weather, and daily burn velocity." },
    ],
  }),
});

interface DashboardData {
  hasActiveCycle: boolean;
  baselineAmount: number;
  cadence: string;
  dropDate: string;
  remainingDays: number;
  currentBalance: number;
  burnVelocity: number;
  recentTransactions?: Array<{
    id: string;
    amount: number;
    category: string;
    merchant: string;
    createdAt: string;
  }>;
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [baseline, setBaseline] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerDataRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const result = await authenticatedFetch("/transactions/dashboard-summary");
        if (result.hasActiveCycle === false) {
          navigate({ to: "/onboarding" });
          return;
        }

        setData(result);
        setBaseline(result.baselineAmount.toString());
        setDropDate(new Date(result.dropDate).toISOString().split("T")[0]);
      } catch (err) {
        console.error("Dashboard Aggregator Error:", err);
      } finally {
        setLoading(false);
      }
    }

    let subscription: any | null = null;
    (async () => {
      const { data: { session } } = await (await import("../lib/api")).supabase.auth.getSession();
      if (session) {
        await fetchSummary();
        return;
      }

      const { data } = (await import("../lib/api")).supabase.auth.onAuthStateChange((_event, sess) => {
        if (sess) {
          fetchSummary();
          data.subscription?.unsubscribe();
        }
      });
      subscription = data?.subscription ?? null;
    })();

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [navigate, refreshTrigger]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Syncing Financial Ledger...</p>
      </div>
    );
  }

  const isStormy = data.remainingDays < 4;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4">
        <ViewHeader eyebrow="Today · Dashboard" title="Your Kumpas, at a glance." />
        <button
          onClick={() => setEditOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Runway card */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-8 py-14 text-center">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Financial runway</div>
        <div className="mt-6 flex items-baseline justify-center gap-3">
          <span className="font-display text-8xl leading-none tracking-tight sm:text-9xl">{data.remainingDays}</span>
          <span className="font-display text-2xl text-muted-foreground">days</span>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Safe duration remaining until your next scheduled allowance drop.
        </p>
      </section>

      {/* Dual metric grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Dynamic Safe Balance */}
        <article className="rounded-3xl border border-border bg-surface p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-primary">
            <CloudRain className="h-4 w-4" />
          </div>
          <div className="mt-8 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Safe Balance</div>
          <div className="mt-2 font-display text-4xl">₱{data.currentBalance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {isStormy 
              ? "⚠️ Low balance alert! Consider delaying non-essential expenditures." 
              : "☀️ Weather clear. Liquid pool balances match active budget parameters safely."}
          </p>
        </article>

        {/* Dynamic Daily Burn Velocity */}
        <article className="rounded-3xl border border-border bg-surface p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="mt-8 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Burn Velocity</div>
          <div className="mt-2 font-display text-4xl">₱{data.burnVelocity.toLocaleString("en-PH", { maximumFractionDigits: 2 })}<span className="text-sm font-sans text-muted-foreground">/day</span></div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Calculated dynamic spending momentum averaged from your localized entries.
          </p>
        </article>
      </div>

      {/* ABSOLUTE PLACEMENT: New Liquidity Asset Vault Grid Component Section */}
      <WalletSection onWalletCreated={triggerDataRefresh} />

      {/* Live Activity Ledger list */}
      <section className="rounded-3xl border border-border bg-surface p-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
          <ArrowRightLeft className="h-3 w-3" />
          <span>Recent Entries</span>
        </div>
        
        {data.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-border/60">
            {data.recentTransactions.map((tx) => {
              
              const parseTransactionDate = (txObject: any): Date => {
                const dynamicRawDate = txObject.timestamp || txObject.createdAt;
                
                if (!dynamicRawDate) {
                  return new Date();
                }

                const parsed = Date.parse(dynamicRawDate);
                if (!isNaN(parsed)) {
                  return new Date(parsed);
                }
                
                if (typeof dynamicRawDate === 'string') {
                  const normalizedStr = dynamicRawDate.replace(" ", "T");
                  const fallbackParsed = Date.parse(normalizedStr);
                  if (!isNaN(fallbackParsed)) return new Date(fallbackParsed);
                }

                return new Date();
              };

              const txDate = parseTransactionDate(tx);

              return (
                <div key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.merchant || "General Spend"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {tx.category} • {txDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`font-display text-lg ${tx.amount < 0 ? "text-caution" : "text-safe"}`}>
                    {tx.amount < 0 ? "-" : "+"} ₱{Math.abs(tx.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            No recent tracking movements logged. Head to Ingest to record your first spend!
          </p>
        )}
      </section>

      {/* Edit Drawer Modal configuration */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-8 shadow-xl sm:rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Cycle Settings</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Baseline Allowance
                </label>
                <div className="mt-2 flex items-baseline gap-1.5 border-b border-border pb-2">
                  <span className="font-display text-xl text-muted-foreground">₱</span>
                  <input
                    type="text"
                    value={baseline}
                    onChange={(e) => setBaseline(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-transparent font-display text-2xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Next drop date
                </label>
                <input
                  type="date"
                  value={dropDate}
                  onChange={(e) => setDropDate(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}