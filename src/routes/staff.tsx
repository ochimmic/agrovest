import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { signInWithEmail, authErrorMessage, signOutEverywhere } from "@/lib/auth";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff portal — AgroVest" },
      { name: "description", content: "Sign-in for AgroVest staff and administrators." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Staff portal — AgroVest" },
      { property: "og:description", content: "Sign-in for AgroVest staff and administrators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Staff,
});

async function isStaff() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  return !!ok;
}

function Staff() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void isStaff().then((ok) => {
      if (ok) nav({ to: "/admin", replace: true });
      else setChecking(false);
    });
  }, [nav]);

  async function submit() {
    if (!email || !pw) return toast.error("Enter your staff email and password.");
    setBusy(true);
    try {
      await signInWithEmail(email, pw);
      if (await isStaff()) {
        nav({ to: "/admin", replace: true });
      } else {
        await signOutEverywhere();
        toast.error("This account does not have staff access.");
      }
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto px-6 pt-10">
        <Logo size={30} />
        <div className="mt-10 inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 text-[11px] font-medium text-violet">
          <ShieldCheck size={12} /> Staff & operations
        </div>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-navy">Staff sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only approved AgroVest staff can enter the admin dashboard.</p>
        {checking ? (
          <p className="mt-8 text-sm text-muted-foreground">Checking access…</p>
        ) : (
          <div className="mt-8 space-y-3">
            <input placeholder="Staff email" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet" />
            <input placeholder="Password" type="password" autoComplete="current-password" value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet" />
            <AgroButton size="lg" className="w-full" onClick={submit} disabled={busy}>
              {busy ? "Signing in…" : "Enter admin dashboard"}
            </AgroButton>
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
