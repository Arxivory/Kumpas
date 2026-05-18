// apps/web/src/routes/onboarding.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { authenticatedFetch } from "../lib/api";

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
  const [currentWalletBalance, setCurrentWalletBalance] = useState(""); // NEW LIQUIDITY STATE
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]>("Weekly");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let backendCadence: "WEEKLY" | "BI_WEEKLY" | "MONTHLY" = "WEEKLY";
    if (cadence === "Bi-Weekly") backendCadence = "BI_WEEKLY";
    if (cadence === "Monthly") backendCadence = "MONTHLY";

    try {
      await authenticatedFetch("/transactions/cycle", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          cadence: backendCadence,
          startDate: new Date(date).toISOString(),
          // Pass the input explicitly, if left blank, default it to the template amount field
          initialWalletBalance: currentWalletBalance !== "" ? parseFloat(currentWalletBalance) : parseFloat(amount),
        }),
      });

      navigate({ to: "/" });
    } catch (err: any) {
      console.error("Onboarding Cycle Failure:", err);
      setErrorMsg(err.message || "Failed to initialize your allowance cycle.");
    } finally {
      setLoading(false);
    }
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

        <div className="rounded-3xl border border-border bg-surface p-8 sm:p-12">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Setup</div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">Your navigation system.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Kumpas tracks your money in matching intervals. Tell us how much you receive, how often it lands, and when your next cycle begins.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={submit} className="mt-10 space-y-8">
            {/* Amount */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Allowance Baseline Amount (Your Recurring Budget)
              </label>
              <div className="mt-3 flex items-baseline gap-2 border-b border-border pb-4 focus-within:border-primary">
                <span className="font-display text-4xl text-muted-foreground">₱</span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full bg-transparent font-display text-5xl outline-none placeholder:text-muted-foreground/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                How much money is in your wallet right now? (Optional)
              </label>
              <p className="text-[11px] text-muted-foreground mt-1">
                Leave blank if it exactly matches your allowance amount.
              </p>
              <div className="mt-3 flex items-baseline gap-2 border-b border-border pb-3 focus-within:border-primary">
                <span className="font-display text-2xl text-muted-foreground">₱</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={amount || "0.00"}
                  value={currentWalletBalance}
                  onChange={(e) => setCurrentWalletBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-muted-foreground/20"
                />
              </div>
            </div>

            {/* Cadence */}
            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cadence Interval
              </label>
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-background p-1">
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
              disabled={loading || !amount || !date}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Initializing Radar Engine...
                </>
              ) : (
                "Start Navigating →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}