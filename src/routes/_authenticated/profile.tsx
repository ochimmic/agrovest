import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck, FileText, Settings, Lock, LogOut, ChevronRight, Award,
  HelpCircle, Scale, Wallet, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useAppState } from "@/lib/store";
import { useAuth, isAdmin, signOutEverywhere } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { RoleBadge, KycBadge, NonCustodialBadge, BscBadge } from "@/components/ui/agro-badge";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const user = useAppState((s) => s.user);
  const role = useAppState((s) => s.role);
  const kyc = useAppState((s) => s.kyc);
  const auth = useAuth();
  const admin = isAdmin(auth);
  const queryClient = useQueryClient();
  const nav = useNavigate();

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <section className="rounded-3xl gradient-navy p-5 text-white shadow-pop">
          <div className="flex items-center gap-4">
            <span className="h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center text-xl font-semibold">
              {(user?.name ?? "G")[0]}
            </span>
            <div className="flex-1">
              <p className="text-lg font-semibold">{user?.name ?? "Guest"}</p>
              <p className="text-xs text-white/70">{user?.email ?? "not signed in"}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <RoleBadge role={role ?? "investor"} />
                <KycBadge status={kyc} />
                <NonCustodialBadge />
                <BscBadge />
              </div>
            </div>
          </div>
        </section>

        <Section title="Verification & Status">
          <Row to="/kyc" icon={ShieldCheck} label="KYC status" sub={`Current: ${kyc}`} />
          <Row to="/documents" icon={FileText} label="Documents" sub="Receipts & contracts" />
          <Row to="/partner" icon={Award} label="Partner status" sub="Locked — progress 18%" />
        </Section>

        <Section title="Wallet">
          <Row to="/vault" icon={Wallet} label="AssetVault" sub="Non-custodial · BSC" />
          <Row to="/vault/settings" icon={Lock} label="Wallet settings" sub="Network, lock & recovery" />
          <Row to="/assetpay" icon={CalendarClock} label="Buy By Bit" sub="Installment plans" />
          <Row to="/prichat" icon={FileText} label="Deposit history" sub="Bank transfers to AgroVest" />
        </Section>

        <Section title="Account">
          <Row to="/settings" icon={Settings} label="Settings" />
          <Row to="/security" icon={Lock} label="Security" />
          <Row to="/support" icon={HelpCircle} label="Support" />
          <Row to="/legal" icon={Scale} label="Legal" />
        </Section>

        {role === "broker" && <RoleQuick to="/broker" label="Broker dashboard" />}
        {role === "vendor" && <RoleQuick to="/vendor" label="Vendor dashboard" />}
        {admin && <RoleQuick to="/admin" label="Admin dashboard" />}

        <button
          onClick={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            await signOutEverywhere();
            nav({ to: "/welcome", replace: true });
          }}
          className="w-full rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive py-3 text-sm font-medium flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Log out
        </button>
        <p className="text-center text-[10px] text-muted-foreground pb-4">AgroVest v0.1 · Investment-grade</p>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="px-1 pb-1.5 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">{title}</p>
      <div className="rounded-3xl bg-card border border-border overflow-hidden divide-y divide-border">{children}</div>
    </section>
  );
}
function Row({ to, icon: Icon, label, sub }: { to: any; icon: any; label: string; sub?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition">
      <span className="h-9 w-9 rounded-xl bg-violet-soft text-violet flex items-center justify-center"><Icon size={16} /></span>
      <div className="flex-1">
        <p className="text-sm font-medium text-navy">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      <ChevronRight size={16} className="text-muted-foreground" />
    </Link>
  );
}
function RoleQuick({ to, label }: { to: any; label: string }) {
  return (
    <Link to={to} className="block rounded-2xl bg-violet-soft/40 px-4 py-3 text-sm font-medium text-navy">
      {label} →
    </Link>
  );
}
