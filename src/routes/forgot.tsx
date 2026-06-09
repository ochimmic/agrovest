import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";

export const Route = createFileRoute("/forgot")({ component: Forgot });

function Forgot() {
  return (
    <MobileFrame>
      <div className="flex-1 px-6 pt-10">
        <h1 className="text-2xl font-semibold text-navy">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground">We'll send a secure link to your email.</p>
        <input
          placeholder="Email"
          className="mt-6 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
        />
        <AgroButton size="xl" className="mt-4" asChild>
          <Link to="/login">Send reset link</Link>
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
