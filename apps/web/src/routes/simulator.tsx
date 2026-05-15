import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/simulator")({
  component: Simulator,
  head: () => ({
    meta: [
      { title: "Simulator — Stress-test your allowance | Kumpas" },
      { name: "description", content: "Drag the slider to simulate a shock expense and see your runway compress in real time." },
    ],
  }),
});

const BASE_RUNWAY = 18;
const DAILY_SPEND = 1430;

function Simulator() {
  const [shock, setShock] = useState(0);

  const { runway, status } = useMemo(() => {
    const days = Math.max(0, BASE_RUNWAY - shock / DAILY_SPEND);
    const r = Math.round(days);
    let s: { label: string; tone: "safe" | "caution" | "risk"; emoji: string; sub: string };
    if (r >= 14) s = { label: "Clear skies", tone: "safe", emoji: "☀️", sub: "Plenty of runway. Safe to proceed." };
    else if (r >= 7) s = { label: "Overcast", tone: "caution", emoji: "⛅", sub: "You'll feel the pinch by week's end." };
    else if (r >= 3) s = { label: "Storm warning", tone: "caution", emoji: "🌩️", sub: "Cut discretionary spend now." };
    else s = { label: "Flash flood warning", tone: "risk", emoji: "🌊", sub: "Critical. You will not make the next allowance." };
    return { runway: r, status: s };
  }, [shock]);

  const toneClasses: Record<string, string> = {
    safe: "border-safe/40 bg-safe/10 text-foreground",
    caution: "border-caution/50 bg-caution/15 text-caution-foreground",
    risk: "border-risk/40 bg-risk/10 text-risk",
  };

  const pct = (shock / 5000) * 100;

  return (
    <div className="space-y-10">
      <ViewHeader
        eyebrow="What-If Simulator"
        title="Simulate a shock expense."
        subtitle="Drag to add an unplanned outlay. Watch your runway respond."
      />

      {/* Slider */}
      <section className="rounded-3xl border border-border bg-surface p-8">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Shock amount</div>
          <div className="font-display text-4xl">₱{shock.toLocaleString()}</div>
        </div>

        <div className="mt-8">
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={shock}
            onChange={(e) => setShock(Number(e.target.value))}
            className="w-full accent-primary"
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--border) ${pct}%, var(--border) 100%)`,
              height: 6,
              borderRadius: 999,
              appearance: "none",
              outline: "none",
            }}
          />
          <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
            <span>₱0</span>
            <span>₱2,500</span>
            <span>₱5,000</span>
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Runway after shock</div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-7xl leading-none">{runway}</span>
            <span className="font-display text-xl text-muted-foreground">days</span>
          </div>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(runway / BASE_RUNWAY) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            From <span className="line-through">{BASE_RUNWAY} days</span> baseline.
          </p>
        </div>

        <div className={`rounded-3xl border p-8 transition-colors ${toneClasses[status.tone]}`}>
          <div className="text-[10px] uppercase tracking-[0.22em] opacity-70">Forecast</div>
          <div className="mt-4 text-5xl">{status.emoji}</div>
          <h3 className="mt-3 font-display text-3xl leading-tight">{status.label}</h3>
          <p className="mt-3 text-sm opacity-80">{status.sub}</p>
        </div>
      </section>
    </div>
  );
}
