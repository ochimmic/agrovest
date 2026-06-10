import { Link2, ShieldCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type ChainStatus = "anchored" | "pending" | "failed";
export type CustodyStatus = "active" | "pending" | "failed";

export function relTime(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.max(1, Math.floor(d))}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

const onChainMeta: Record<ChainStatus, { label: string; cls: string; icon: any }> = {
  anchored: { label: "Anchored", cls: "bg-agro-soft text-agro", icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700", icon: Clock },
  failed: { label: "Failed", cls: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

const custodyMeta: Record<CustodyStatus, { label: string; cls: string; icon: any }> = {
  active: { label: "Custody active", cls: "bg-navy/10 text-navy", icon: CheckCircle2 },
  pending: { label: "Custody pending", cls: "bg-amber-100 text-amber-700", icon: Clock },
  failed: { label: "Custody issue", cls: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

export function StatusBadge({
  kind,
  status,
  compact = false,
}: {
  kind: "chain" | "custody";
  status: ChainStatus | CustodyStatus;
  compact?: boolean;
}) {
  const m = kind === "chain" ? onChainMeta[status as ChainStatus] : custodyMeta[status as CustodyStatus];
  const Icon = m.icon;
  const TitleIcon = kind === "chain" ? Link2 : ShieldCheck;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${m.cls}`}
    >
      {compact ? <Icon size={10} /> : <TitleIcon size={10} />}
      {compact ? m.label : `${kind === "chain" ? "On-chain" : "Off-chain"} · ${m.label}`}
    </span>
  );
}

export function StatusStrip({
  chain,
  custody,
  updatedAt,
  detail,
  variant = "card",
}: {
  chain: ChainStatus;
  custody: CustodyStatus;
  updatedAt: string;
  detail?: { chain?: string; custody?: string };
  variant?: "card" | "dark";
}) {
  const isPending = chain === "pending" || custody === "pending";
  const isFailed = chain === "failed" || custody === "failed";
  const wrap =
    variant === "dark"
      ? "rounded-2xl bg-white/10 p-3 text-white"
      : "rounded-2xl bg-secondary p-3";
  const subtle = variant === "dark" ? "text-white/60" : "text-muted-foreground";

  return (
    <div className={wrap}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[11px] ${subtle}`}>Status</p>
        <p className={`text-[10px] ${subtle}`}>Updated {relTime(updatedAt)}</p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <StatusTile kind="chain" status={chain} detail={detail?.chain} variant={variant} />
        <StatusTile kind="custody" status={custody} detail={detail?.custody} variant={variant} />
      </div>
      {(isPending || isFailed) && (
        <div
          className={`mt-2 flex items-start gap-2 rounded-xl px-2.5 py-2 text-[11px] ${
            isFailed
              ? "bg-destructive/10 text-destructive"
              : variant === "dark"
              ? "bg-amber-400/15 text-amber-100"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">
              {isFailed ? "Action needed" : "Confirmation in progress"}
            </p>
            <p className="opacity-80">
              {isFailed
                ? "One of the steps failed. Re-issue the document or contact support."
                : "Anchor or custody confirmation can take a few minutes. Refresh shortly."}
            </p>
            <Link to="/support" className="mt-1 inline-block font-medium underline">
              Troubleshoot
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusTile({
  kind,
  status,
  detail,
  variant,
}: {
  kind: "chain" | "custody";
  status: ChainStatus | CustodyStatus;
  detail?: string;
  variant: "card" | "dark";
}) {
  const m = kind === "chain" ? onChainMeta[status as ChainStatus] : custodyMeta[status as CustodyStatus];
  const TitleIcon = kind === "chain" ? Link2 : ShieldCheck;
  const bg = variant === "dark" ? "bg-white/10" : "bg-card";
  const sub = variant === "dark" ? "text-white/60" : "text-muted-foreground";
  const title = variant === "dark" ? "text-white" : "text-navy";
  return (
    <div className={`rounded-xl ${bg} p-2.5`}>
      <div className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${m.cls}`}>
        <TitleIcon size={10} />
        {kind === "chain" ? "On-chain" : "Off-chain"}
      </div>
      <p className={`mt-1.5 text-sm font-semibold ${title}`}>{m.label}</p>
      {detail && <p className={`text-[10px] ${sub} truncate`}>{detail}</p>}
    </div>
  );
}

// Derive deterministic status from holding id so dashboard + detail stay in sync.
export function deriveStatus(holdingId: string, purchasedAt: string): {
  chain: ChainStatus;
  custody: CustodyStatus;
  updatedAt: string;
} {
  const ageMs = Date.now() - new Date(purchasedAt).getTime();
  const seed = [...holdingId].reduce((s, c) => s + c.charCodeAt(0), 0);
  const chain: ChainStatus = ageMs < 60_000 ? "pending" : seed % 17 === 0 ? "failed" : "anchored";
  const custody: CustodyStatus =
    ageMs < 30_000 ? "pending" : seed % 23 === 0 ? "failed" : "active";
  return { chain, custody, updatedAt: new Date(Date.now() - (seed % 600) * 1000).toISOString() };
}
