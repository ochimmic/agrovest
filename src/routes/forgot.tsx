import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { sendPasswordReset, authErrorMessage } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot")({
  head: () => ({
    meta: [
      { title: "Reset your password — AgroVest" },
      { name: "description", content: "Request a secure link to reset your AgroVest account password." },
      { property: "og:title", content: "Reset your password — AgroVest" },
      { property: "og:description", content: "Request a secure password reset link for AgroVest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email) return toast.error("Enter your email address.");
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <div className="flex-1 px-6 pt-10">
        <h1 className="text-2xl font-semibold text-navy">Reset password</h1>
        {sent ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              If an account exists for <span className="text-navy font-medium">{email}</span>, a reset link is on its way.
              Open it on this device to choose a new password.
            </p>
            <AgroButton size="xl" className="mt-6" asChild>
              <Link to="/login">Back to sign in</Link>
            </AgroButton>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">We'll send a secure link to your email.</p>
            <input
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-6 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
            />
            <AgroButton size="xl" className="mt-4" onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </AgroButton>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Remembered it? <Link to="/login" className="text-violet font-medium">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </MobileFrame>
  );
}
