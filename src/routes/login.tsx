import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { Logo } from "@/components/brand/Logo";
import { signInWithEmail, authErrorMessage } from "@/lib/auth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s['redirect'] === "string" ? (s['redirect'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — AgroVest" },
      { name: "description", content: "Sign in to your AgroVest account to manage your farm holdings, payments and AssetVault." },
      { property: "og:title", content: "Sign in — AgroVest" },
      { property: "og:description", content: "Secure access to your AgroVest portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function safePath(v: string | undefined) {
  if (!v) return "/home";
  try {
    const url = new URL(v, window.location.origin);
    if (url.origin !== window.location.origin) return "/home";
    return url.pathname + url.search;
  } catch {
    return "/home";
  }
}

function Login() {
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit() {
    if (!email || !pw) return toast.error("Enter your email and password.");
    setBusy(true);
    try {
      await signInWithEmail(email, pw);
      toast.success("Welcome back");
      nav({ to: safePath(redirect) as string });
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) return toast.error("Google sign-in failed. Please try again.");
      if (result.redirected) return;
      nav({ to: safePath(redirect) as string });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    }
  }

  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pt-10">
        <Logo size={30} />
        <h1 className="mt-10 text-[28px] font-semibold tracking-tight text-navy">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Secure access to your portfolio.</p>

        <div className="mt-8 space-y-3">
          <input
            placeholder="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
          />
          <input
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
          />
        </div>

        <div className="mt-2 text-right">
          <Link to="/forgot" className="text-xs text-violet font-medium">Forgot password?</Link>
        </div>

        <AgroButton size="xl" className="mt-6" onClick={submit} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </AgroButton>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={google}
          className="h-12 w-full rounded-2xl border border-input bg-card text-sm font-medium text-navy transition hover:bg-secondary/60"
        >
          Continue with Google
        </button>

        <p className="mt-6 pb-6 text-center text-xs text-muted-foreground">
          New to AgroVest?{" "}
          <Link to="/role-select" className="text-violet font-medium">Create account</Link>
        </p>
      </div>
    </MobileFrame>
  );
}
