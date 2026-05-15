import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Set up your cycle — Project Kumpas" },
      { name: "description", content: "Initialize your allowance cycle." },
    ],
  }),
});

const CADENCES = ["Weekly", "Bi-Weekly", "Monthly"] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]>("Weekly");
  const [date, setDate] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="h-4 w-4" />
          </div>
          <span className="font-display text-2xl">Kumpas</span>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-8 sm:p-10">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Step 1 of 1</div>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Set your allowance cycle.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We'll calculate your runway from these three numbers.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-8">
            {/* Amount */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Base allowance
              </label>
              <div className="mt-3 flex items-baseline gap-2 border-b border-border pb-3">
                <span className="font-display text-3xl text-muted-foreground">₱</span>
                <input
                  inputMode="decimal"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="2,500"
                  className="w-full bg-transparent font-display text-5xl outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Cadence */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cadence
              </label>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-background p-1">
                {CADENCES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCadence(c)}
                    className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
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

            {/* Date */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Next allowance drop
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-4 text-sm font-medium text-primary-foreground"
            >
              Start Navigating →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
