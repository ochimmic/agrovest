import {
  ShieldCheck, Lock, Link2, Sparkles, AlertTriangle, Timer, BadgeCheck,
  Wallet, Coins, Eye, FileCheck, Store, Award, Activity, Info,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export type AgroBadgeTone =
  | "agro" | "violet" | "navy" | "warn" | "danger" | "neutral" | "info";

const toneClass: Record<AgroBadgeTone, string> = {
  agro: "bg-agro-soft text-agro",
  violet: "bg-violet-soft text-violet",
  navy: "bg-navy/10 text-navy",
  warn: "bg-warn/15 text-warn",
  danger: "bg-destructive/15 text-destructive",
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-white/10 text-white",
};

export function AgroBadge({
  tone = "neutral",
  icon: Icon,
  children,
  size = "sm",
  className = "",
}: {
  tone?: AgroBadgeTone;
  icon?: LucideIcon;
  children: ReactNode;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sz =
    size === "xs"
      ? "text-[10px] px-2 py-0.5 gap-1"
      : size === "md"
        ? "text-[12px] px-2.5 py-1 gap-1.5"
        : "text-[11px] px-2 py-0.5 gap-1";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${toneClass[tone]} ${sz} ${className}`}
    >
      {Icon ? <Icon size={size === "md" ? 12 : 11} /> : null}
      {children}
    </span>
  );
}

/* ---------- Preset badges aligned with the AgroVest brief ---------- */

export const KycBadge = ({ status }: { status: "approved" | "pending" | "rejected" | string }) => {
  const tone: AgroBadgeTone =
    status === "approved" ? "agro" : status === "rejected" ? "danger" : "warn";
  return <AgroBadge tone={tone} icon={ShieldCheck}>KYC {status}</AgroBadge>;
};

export const BscBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="warn" icon={Coins} size={size}>BSC Network</AgroBadge>
);

export const NonCustodialBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="violet" icon={Wallet} size={size}>Non-custodial</AgroBadge>
);

export const CustodyBackedBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="agro" icon={ShieldCheck} size={size}>Custody-backed</AgroBadge>
);

export const OnChainBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="violet" icon={Link2} size={size}>On-chain</AgroBadge>
);

export const VendorVerifiedBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="agro" icon={Store} size={size}>Verified vendor</AgroBadge>
);

export const CertifiedBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="agro" icon={BadgeCheck} size={size}>Certified</AgroBadge>
);

export const PrivateBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="violet" icon={Lock} size={size}>Private</AgroBadge>
);

export const AutoDeleteBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="violet" icon={Timer} size={size}>Auto-deletes 24h</AgroBadge>
);

export const NotAdviceBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="warn" icon={Info} size={size}>Not financial advice</AgroBadge>
);

export const ProjectedBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="warn" icon={Sparkles} size={size}>Projected</AgroBadge>
);

export const ActualBadge = ({ size }: { size?: "xs" | "sm" | "md" }) => (
  <AgroBadge tone="agro" icon={Activity} size={size}>Actual</AgroBadge>
);

export const RiskBadge = ({ level }: { level: string }) => {
  const l = level.toLowerCase();
  const tone: AgroBadgeTone = l.includes("high")
    ? "danger"
    : l.includes("med")
      ? "warn"
      : "agro";
  return <AgroBadge tone={tone} icon={AlertTriangle}>{level} risk</AgroBadge>;
};

export const RoleBadge = ({ role }: { role: string }) => (
  <AgroBadge tone="navy" icon={Eye} className="capitalize">{role}</AgroBadge>
);

export const TierBadge = ({ tier }: { tier: string }) => (
  <AgroBadge tone="violet" icon={Award}>{tier}</AgroBadge>
);

export const DocIssuedBadge = () => (
  <AgroBadge tone="agro" icon={FileCheck}>Issued</AgroBadge>
);
