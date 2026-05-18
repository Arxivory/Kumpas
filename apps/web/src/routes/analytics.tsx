import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { useState, useEffect } from "react";
import { authenticatedFetch } from "../lib/api";
import { Loader2, ShieldCheck, AlertTriangle, CloudSun, Zap, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsDashboard,
  head: () => ({
    meta: [
      { title: "Financial Radar — Kumpas" },
      { name: "description", content: "Simplified spending trajectory and health diagnostics." },
    ],
  }),
});

interface AnalyticsData {
  survivalProbability: number;
  expectedDepletionDay: number | null;
  riskStatus: "CLEAR_SKIES" | "OVERCAST_TURBULENCE" | "STORM_WARNING" | "FLASH_FLOOD";
  driftMu: number;
  volatilitySigma: number;
}

function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuantData() {
      try {
        const result = await authenticatedFetch("/transactions/quant-analytics");
        setMetrics(result);
      } catch (err) {
        console.error("Failed to connect to analytics gateway:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuantData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reading financial horizons...</p>
      </div>
    );
  }

  const survivalPct = Math.round(metrics.survivalProbability * 100);

  const statusConfig = {
    CLEAR_SKIES: { 
      label: "Clear Skies", 
      classes: "border-safe/30 bg-safe/5 text-safe", 
      desc: "Your spending pace is perfectly matching your timeline. No dangerous sudden spending spikes detected.", 
      icon: ShieldCheck,
      colorClass: "bg-safe"
    },
    OVERCAST_TURBULENCE: { 
      label: "Light Rain", 
      classes: "border-caution/30 bg-caution/5 text-caution", 
      desc: "A few unpredictable purchases popped up recently. Minor lifestyle tweaks are recommended to stay safe.", 
      icon: CloudSun,
      colorClass: "bg-caution"
    },
    STORM_WARNING: { 
      label: "Storm Warning", 
      classes: "border-caution/50 bg-caution/10 text-caution-foreground", 
      desc: "Your spending behavior is highly erratic right now. There is a strong chance you will run out of cash early.", 
      icon: Zap,
      colorClass: "bg-amber-500"
    },
    FLASH_FLOOD: { 
      label: "Flash Flood Alert", 
      classes: "border-risk/30 bg-risk/5 text-risk", 
      desc: "Critical risk state. At your current irregular spending velocity, your wallet is on track to hit empty ahead of schedule.", 
      icon: AlertTriangle,
      colorClass: "bg-risk"
    },
  }[metrics.riskStatus];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-10">
      <ViewHeader 
        eyebrow="Financial Health" 
        title="Wallet Weather Radar" 
        subtitle="We ran your current spending patterns through 1,000 possible future scenarios to check your safety." 
      />

      {/* THREE MAIN SIMPLIFIED STAT CARDS */}
      <div className="grid gap-6 sm:grid-cols-3">
        <article className="rounded-3xl border border-border bg-surface p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Runway Success Rate</span>
            <div className="font-display text-5xl tracking-tight text-foreground">
              {survivalPct}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            The mathematical likelihood that your money will successfully stretch all the way to your next allowance drop.
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Normal Daily Pace</span>
            <div className="font-display text-4xl tracking-tight text-foreground">
              ₱{Math.round(metrics.driftMu).toLocaleString()}<span className="text-sm font-sans text-muted-foreground">/day</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Your average day-to-day spending anchor. This is how much cash routinely leaves your pocket on a standard day.
          </p>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Unpredictability Factor</span>
            <div className="font-display text-4xl tracking-tight text-foreground">
              ₱{Math.round(metrics.volatilitySigma).toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            The variation in your spending habits. A higher number means you make large, sudden spontaneous purchases.
          </p>
        </article>
      </div>

      {/* CORE SIMPLIFIED HEALTH INTERACTION MATRIX */}
      <section className="grid gap-6 md:grid-cols-3">
        
        {/* REPLACED COMPUTATION GRAPH WITH A CLEAN GAUGE METER */}
        <div className="md:col-span-2 rounded-3xl border border-border bg-surface p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg tracking-tight">Runway Survival Confidence</h3>
            <p className="text-xs text-muted-foreground">How securely your current balance is projected to hold up against future shocks.</p>
          </div>

          <div className="my-auto py-6 space-y-4">
            <div className="flex items-end justify-between text-sm">
              <span className="font-medium">Calculated Security Level</span>
              <span className="font-display text-2xl font-bold">{survivalPct}%</span>
            </div>
            
            {/* Simple Premium Track Line Meter */}
            <div className="h-4 w-full overflow-hidden rounded-full bg-background border border-border p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${statusConfig.colorClass}`}
                style={{ width: `${survivalPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-medium pt-1">
              <span>0% (High Risk)</span>
              <span>50% (Balanced)</span>
              <span>100% (Bulletproof)</span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 flex items-start gap-2.5 text-xs text-muted-foreground">
            <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground/80 mt-0.5" />
            <p>
              Instead of static calendars, this gauge continuously cross-examines your real historical deviations to map potential future spending risks.
            </p>
          </div>
        </div>

        {/* COMPACT DIAGNOSTICS & ACTION BANNER */}
        <div className={`rounded-3xl border p-8 flex flex-col justify-between ${statusConfig.classes}`}>
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] opacity-80">
              <StatusIcon className="h-4 w-4" />
              <span>Diagnostic System</span>
            </div>
            
            <h3 className="mt-8 font-display text-3xl leading-tight tracking-tight">
              {statusConfig.label}
            </h3>
            <p className="mt-4 text-xs opacity-85 leading-relaxed">
              {statusConfig.desc}
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-background/40 border border-white/5 p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wide block opacity-70">Actionable Advice</span>
            <p className="text-xs leading-relaxed">
              {survivalPct >= 85 
                ? "Excellent control! Keep up your current daily rhythm. You have plenty of buffer to cover surprises."
                : `Your recent erratic spend patterns are leaking cash. Try trimming back your non-essential spending by around ₱${Math.round(metrics.volatilitySigma * 0.5)} over the next 3 days to stabilize your safety buffer.`}
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}