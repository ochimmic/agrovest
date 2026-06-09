import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

function settingsLike(title: string, sections: { h: string; items: string[] }[]) {
  return function Page() {
    return (
      <MobileFrame>
        <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link to="/profile" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
          <h1 className="font-semibold text-navy">{title}</h1>
        </header>
        <div className="p-4 space-y-4">
          {sections.map((s) => (
            <section key={s.h}>
              <p className="px-1 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{s.h}</p>
              <div className="mt-1.5 rounded-3xl bg-card border border-border divide-y divide-border">
                {s.items.map((it) => (
                  <div key={it} className="flex items-center justify-between px-4 py-3 text-sm text-navy">
                    {it}
                    <span className="text-muted-foreground">›</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </MobileFrame>
    );
  };
}

export const Route = createFileRoute("/settings")({
  component: settingsLike("Settings", [
    { h: "Preferences", items: ["Language", "Currency", "Theme", "Notifications"] },
    { h: "Privacy", items: ["PriChat auto-delete", "Activity status", "Two-factor authentication"] },
  ]),
});
