import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase } from "../lib/api";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Login — Project Kumpas" },
      { name: "description", content: "Sign in to your Kumpas account." },
    ],
  }),
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate({ to: "/" });
    } catch (err: any) {
      console.error("Login Error:", err);
      setErrorMsg(err.message || "Invalid email or password combination.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-2xl">Kumpas</span>
        </Link>

        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Welcome back</div>
          <h1 className="mt-2 font-display text-4xl">Sign in.</h1>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="juan@up.edu.ph"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New to Kumpas?{" "}
            <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}