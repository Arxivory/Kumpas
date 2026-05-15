import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/ViewHeader";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/bayanihan")({
  component: Bayanihan,
  head: () => ({
    meta: [
      { title: "Bayanihan — Group savings | Kumpas" },
      { name: "description", content: "Collective savings goals for dorm roommates and study groups. Privacy-first by design." },
    ],
  }),
});

const POOLS = [
  { name: "Dorm Food Pool", pct: 78, members: 4, target: "₱8,000" },
  { name: "Sem-End Outing", pct: 45, members: 6, target: "₱12,500" },
  { name: "Group Study Café", pct: 22, members: 3, target: "₱2,400" },
];

function Bayanihan() {
  return (
    <div className="space-y-10">
      <ViewHeader
        eyebrow="Bayanihan · Group goals"
        title="Saving, together."
        subtitle="Collective progress only. Individual contributions stay private."
      />

      <section className="space-y-4">
        {POOLS.map((p) => {
          const tone = p.pct >= 75 ? "bg-safe" : p.pct >= 40 ? "bg-primary" : "bg-caution";
          return (
            <article
              key={p.name}
              className="rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.members} members · target {p.target}
                  </p>
                </div>
                <div className="font-display text-3xl">{p.pct}%</div>
              </div>

              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full ${tone} transition-all`}
                  style={{ width: `${p.pct}%` }}
                />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Individual balances hidden</span>
              </div>
            </article>
          );
        })}
      </section>

      <button className="w-full rounded-2xl border border-dashed border-border bg-surface/40 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
        + Start a new pool
      </button>
    </div>
  );
}
