import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, Activity, Users, Sparkles, LineChart } from "lucide-react";
import { AgentDrawer } from "@/routes/AgentDrawer";

const AUTH_ROUTES = ["/login", "/register", "/onboarding"];

const NAV = [
  { to: "/", label: "Kumpas", icon: LayoutDashboard },
  { to: "/ingest", label: "Ingest", icon: Inbox },
  { to: "/simulator", label: "Simulator", icon: Activity },
  { to: "/analytics", label: "Radar Analytics", icon: LineChart }
] as const;

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (AUTH_ROUTES.some((r) => path === r || path.startsWith(r + "/"))) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface px-6 py-8 lg:flex">
        <Link to="/" className="mb-12 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl">Kumpas</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Project</span>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="min-h-screen pb-28 lg:pb-12 lg:pl-64">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-12 lg:py-14">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile/tablet */}
      <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-surface/90 px-2 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md lg:hidden">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>

      <AgentDrawer />
    </div>
  );
}