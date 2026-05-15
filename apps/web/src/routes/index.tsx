import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { CloudRain, TrendingUp, Settings2, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Kumpas — Your financial runway" },
      { name: "description", content: "See your remaining days of runway, financial weather, and 7-day spend velocity." },
    ],
  }),
});

const VELOCITY = [120, 85, 240, 160, 95, 310, 420];
const MAX = Math.max(...VELOCITY);
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const CADENCES = ["Weekly", "Bi-Weekly", "Monthly"] as const;

function Dashboard() {
  const [editOpen, setEditOpen] = useState(false);
  const [baseline, setBaseline] = useState("500");
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]>("Weekly");
  const [dropDate, setDropDate] = useState("");

  return (
    <div className="space-y-10">
      <ViewHeader eyebrow="Today · Dashboard" title="Your Kumpas, at a glance." />

      {/* Runway card */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-8 py-14 text-center sm:py-20">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Adjust allowance cycle"
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Financial Runway</div>
        <div className="mt-4 flex items-baseline justify-center gap-3">
          <span className="font-display text-[7rem] leading-none tracking-tight sm:text-[10rem]">18</span>
          <span className="font-display text-2xl text-muted-foreground sm:text-3xl">days</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Based on ₱{baseline} {cadence.toLowerCase()} baseline.
        </p>
      </section>

      {/* Weather */}
      <section className="rounded-3xl border border-caution/40 bg-caution/10 p-8">
        <div className="flex items-start gap-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-caution/30 text-caution-foreground">
            <CloudRain className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-caution-foreground/70">Financial Weather</div>
            <h2 className="mt-1 font-display text-3xl leading-tight text-caution-foreground sm:text-4xl">
              Approaching storm.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-caution-foreground/80">
              Spend velocity is accelerating. You're projected to run out{" "}
              <span className="font-medium text-caution-foreground">5 days before</span> your next allowance drop.
            </p>
          </div>
        </div>
      </section>

      {/* Velocity chart */}
      <section className="rounded-3xl border border-border bg-surface p-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">7-Day Spend Velocity</div>
            <h3 className="mt-1 font-display text-2xl">₱1,430 avg / day</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-risk">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+34% vs last week</span>
          </div>
        </div>

        <div className="flex h-44 items-end gap-3">
          {VELOCITY.map((v, i) => {
            const h = (v / MAX) * 100;
            const isPeak = v === MAX;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-md transition-all ${isPeak ? "bg-risk" : "bg-primary/80"}`}
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{DAYS[i]}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Edit cycle modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Adjust</div>
                <h3 className="mt-1 font-display text-2xl">Current allowance cycle</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-7 space-y-6">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Baseline budget
                </label>
                <div className="mt-2 flex items-baseline gap-2 border-b border-border pb-2">
                  <span className="font-display text-2xl text-muted-foreground">₱</span>
                  <input
                    inputMode="decimal"
                    value={baseline}
                    onChange={(e) => setBaseline(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-full bg-transparent font-display text-3xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cadence
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-border bg-background p-1">
                  {CADENCES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCadence(c)}
                      className={`rounded-lg px-2 py-2.5 text-xs font-medium transition-colors ${
                        cadence === c
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
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
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground"
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
