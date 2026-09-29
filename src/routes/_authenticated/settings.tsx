import { createFileRoute, Link } from "@tanstack/react-router";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { useTheme, type Theme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({ component: Settings });

const themeOptions: { id: Theme; label: string; sub: string; Icon: any }[] = [
  { id: "light", label: "Light", sub: "Always light", Icon: Sun },
  { id: "dark", label: "Dark", sub: "Always dark", Icon: Moon },
  { id: "system", label: "System default", sub: "Match device setting", Icon: Monitor },
];

function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-foreground">Settings</h1>
      </header>
      <div className="p-4 space-y-4">
        <section>
          <p className="px-1 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Preferences</p>
          <div className="mt-1.5 rounded-3xl bg-card border border-border divide-y divide-border">
            <Row label="Language" value="English" />
            <Row label="Currency" value="USD" />
            <Row label="Notifications" value="On" />
          </div>
        </section>

        <section>
          <p className="px-1 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Theme</p>
          <div className="mt-1.5 rounded-3xl bg-card border border-border divide-y divide-border overflow-hidden">
            {themeOptions.map(({ id, label, sub, Icon }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/60 transition"
                >
                  <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${active ? "bg-violet text-white" : "bg-secondary text-foreground"}`}>
                    <Icon size={16} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                  </div>
                  {active && <Check size={16} className="text-violet" />}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="px-1 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Privacy</p>
          <div className="mt-1.5 rounded-3xl bg-card border border-border divide-y divide-border">
            <Row label="PriChat auto-delete" value="24h" />
            <Row label="Activity status" value="Hidden" />
            <Row label="Two-factor authentication" value="Off" />
          </div>
        </section>
      </div>
    </MobileFrame>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-foreground">
      <span>{label}</span>
      <span className="text-muted-foreground">{value ?? "›"}</span>
    </div>
  );
}
