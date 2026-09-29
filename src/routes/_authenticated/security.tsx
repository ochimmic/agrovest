import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/security")({ component: Sec });
function Sec() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Security</h1>
      </header>
      <div className="p-4 space-y-2">
        {["Change password","Biometric unlock","Trusted devices","Login activity","Wallet safety"].map((t) => (
          <div key={t} className="flex justify-between rounded-2xl bg-card border border-border p-4 text-sm text-navy">
            {t}<span className="text-muted-foreground">›</span>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}
