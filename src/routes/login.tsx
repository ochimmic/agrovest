import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { Logo } from "@/components/brand/Logo";
import { getState, setState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const nav = useNavigate();

  function submit() {
    if (!email || !pw) return toast.error("Enter your email and password.");
    const s = getState();
    if (!s.user) {
      // Demo: create a stub user
      setState({
        user: { name: "Demo Investor", email, country: "Nigeria" },
        role: "investor",
        kyc: "approved",
      });
    }
    toast.success("Welcome back");
    nav({ to: "/home" });
  }

  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pt-10">
        <Logo size={30} />
        <h1 className="mt-10 text-[28px] font-semibold tracking-tight text-navy">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Secure access to your portfolio.</p>

        <div className="mt-8 space-y-3">
          <input
            placeholder="Email or phone"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
          />
          <input
            placeholder="Password"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
          />
        </div>

        <div className="mt-2 text-right">
          <Link to="/forgot" className="text-xs text-violet font-medium">Forgot password?</Link>
        </div>

        <AgroButton size="xl" className="mt-6" onClick={submit}>
          Sign in
        </AgroButton>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          New to AgroVest?{" "}
          <Link to="/role-select" className="text-violet font-medium">Create account</Link>
        </p>
      </div>
    </MobileFrame>
  );
}
