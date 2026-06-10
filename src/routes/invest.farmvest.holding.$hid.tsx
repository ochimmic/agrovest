import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { useAppState } from "@/lib/store";
import { farmAssets } from "@/lib/mock-data";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Receipt,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Link2,
  ShieldCheck,
  Sprout,
  BadgeCheck,
  Loader2,
  AlertTriangle,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invest/farmvest/holding/$hid")({ component: HoldingDetail });

function HoldingDetail() {
  const { hid } = Route.useParams();
  const nav = useNavigate();
  const holding = useAppState((s) => s.holdings.find((h) => h.id === hid));

  if (!holding) {
    return (
      <MobileFrame>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Holding not found.</p>
          <Link to="/invest/farmvest" className="mt-3 inline-block text-sm text-agro font-medium">
            Back to FarmVest
          </Link>
        </div>
      </MobileFrame>
    );
  }

  const asset = farmAssets.find((a) => a.id === holding.assetId) ?? farmAssets[0];
  const platformFee = Math.round(holding.invested * 0.02);
  const netPrincipal = holding.invested - platformFee;
  const projectedYr = Math.round(holding.invested * 0.105);
  const txHash = `0x${holding.id.replace(/[^a-f0-9]/gi, "").padEnd(8, "a").slice(0, 8)}…${holding.id.slice(-4)}`;

  const timeline = [
    { label: "Investment confirmed", date: holding.purchasedAt, done: true, icon: <CheckCircle2 size={14} /> },
    { label: "Custody receipt issued", date: holding.purchasedAt, done: true, icon: <ShieldCheck size={14} /> },
    { label: "On-chain anchor", date: holding.purchasedAt, done: true, icon: <Link2 size={14} /> },
    { label: "First yield distribution", date: "Scheduled · Q+1", done: false, icon: <Clock size={14} /> },
    { label: "Harvest cycle close", date: "Scheduled · Q+4", done: false, icon: <Sprout size={14} /> },
  ];

  type DocStatus = "Issued" | "Signed" | "Pending" | "Failed";
  type DocAction = "download" | "issue" | "verify" | null;
  type Doc = {
    id: string;
    title: string;
    status: DocStatus;
    date: string;
    verification: "unverified" | "pending" | "verified" | "failed";
    pending: DocAction;
  };

  const [docs, setDocs] = useState<Doc[]>([
    { id: "rcpt", title: "Custody Receipt", status: "Issued", date: holding.purchasedAt, verification: "verified", pending: null },
    { id: "ctr", title: "Asset Contract", status: "Signed", date: holding.purchasedAt, verification: "unverified", pending: null },
    { id: "ins", title: "Insurance Cover Note", status: "Pending", date: "—", verification: "unverified", pending: null },
  ]);

  function patch(id: string, p: Partial<Doc>) {
    setDocs((cur) => cur.map((d) => (d.id === id ? { ...d, ...p } : d)));
  }

  function runAction(
    d: Doc,
    action: Exclude<DocAction, null>,
    fn: () => Promise<{ ok: boolean; msg: string; patch?: Partial<Doc> }>,
  ) {
    patch(d.id, { pending: action });
    fn().then((res) => {
      patch(d.id, { pending: null, ...(res.patch ?? {}) });
      if (res.ok) toast.success(res.msg);
      else toast.error(res.msg);
    });
  }

  function fakeAsync(ms = 900, failRate = 0): Promise<void> {
    return new Promise((resolve, reject) =>
      setTimeout(() => (Math.random() < failRate ? reject(new Error("fail")) : resolve()), ms),
    );
  }

  function onDownload(d: Doc) {
    if (d.status === "Pending") {
      toast.error("Document not yet available");
      return;
    }
    runAction(d, "download", async () => {
      try {
        await fakeAsync(700, 0.08);
        return { ok: true, msg: `${d.title} downloaded` };
      } catch {
        return { ok: false, msg: `${d.title} download failed` };
      }
    });
  }

  function onIssue(d: Doc) {
    runAction(d, "issue", async () => {
      try {
        await fakeAsync(1100, 0.1);
        return {
          ok: true,
          msg: `${d.title} issued`,
          patch: {
            status: "Issued" as DocStatus,
            date: new Date().toISOString(),
            verification: "unverified" as const,
          },
        };
      } catch {
        return {
          ok: false,
          msg: `Issuance failed for ${d.title}`,
          patch: { status: "Failed" as DocStatus },
        };
      }
    });
  }

  function onVerify(d: Doc) {
    patch(d.id, { verification: "pending" });
    runAction(d, "verify", async () => {
      try {
        await fakeAsync(1400, 0.2);
        return { ok: true, msg: `${d.title} verified`, patch: { verification: "verified" as const } };
      } catch {
        return {
          ok: false,
          msg: `Verification failed for ${d.title}`,
          patch: { verification: "failed" as const },
        };
      }
    });
  }

  return (
    <MobileFrame>
      <div className={`relative h-44 bg-gradient-to-br ${asset.cover}`}>
        <Link
          to="/invest/farmvest"
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full glass text-navy"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-[11px] opacity-80">{asset.location}</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">{holding.name}</h1>
          <p className="text-[11px] opacity-80">
            {holding.units} {holding.unit}{holding.units > 1 ? "s" : ""} · purchased{" "}
            {new Date(holding.purchasedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          <Action
            label="Invest"
            icon={<Plus size={16} />}
            onClick={() => nav({ to: "/invest/farmvest/$id", params: { id: asset.id } })}
          />
          <Action label="Swap" icon={<RefreshCw size={16} />} onClick={() => nav({ to: "/wallet/swap" })} />
          <Action label="Txns" icon={<Receipt size={16} />} onClick={() => nav({ to: "/wallet/history" })} />
          <Action
            label="Docs"
            icon={<FileText size={16} />}
            onClick={() => {
              const el = document.getElementById("docs-section");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>

        {/* Breakdown */}
        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Investment breakdown</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Principal" v={`$${netPrincipal.toLocaleString()}`} />
            <Row k="Platform fee (2%)" v={`$${platformFee.toLocaleString()}`} />
            <Row k="Total invested" v={`$${holding.invested.toLocaleString()}`} strong />
            <div className="my-2 h-px bg-border" />
            <Row k="Expected yield" v={asset.expectedYield} />
            <Row k="Projected /yr" v={`$${projectedYr.toLocaleString()}`} accent />
            <Row k="Appreciation" v={asset.appreciation} />
          </div>
        </section>

        {/* On-chain / Off-chain status */}
        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Status</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatusCard
              title="On-chain"
              status="Anchored"
              detail={txHash}
              tone="agro"
              icon={<Link2 size={14} />}
            />
            <StatusCard
              title="Off-chain"
              status="Custody active"
              detail="Vault: Lagos Custodian"
              tone="navy"
              icon={<ShieldCheck size={14} />}
            />
          </div>
        </section>

        {/* Timeline */}
        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Timeline</h2>
          <ol className="mt-3 space-y-3">
            {timeline.map((t, i) => (
              <li key={i} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`h-7 w-7 rounded-full grid place-items-center ${
                      t.done ? "bg-agro text-white" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t.icon}
                  </div>
                  {i < timeline.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                </div>
                <div className="pb-2">
                  <p className={`text-sm ${t.done ? "text-navy font-medium" : "text-muted-foreground"}`}>
                    {t.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.done ? new Date(t.date).toLocaleString() : t.date}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Documents */}



        <section id="docs-section" className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Documents</h2>
            <button
              onClick={() => {
                const pending = docs.find((d) => d.status === "Pending" || d.status === "Failed");
                if (pending) onIssue(pending);
                else toast.info("All documents already issued");
              }}
              className="text-[11px] text-agro font-medium"
            >
              Issue new
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {docs.map((d) => {
              const downloadable = d.status === "Issued" || d.status === "Signed";
              const canIssue = d.status === "Pending" || d.status === "Failed";
              const verifyDisabled =
                !downloadable || d.verification === "pending" || d.verification === "verified";
              return (
                <li key={d.id} className="rounded-2xl bg-secondary p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-card grid place-items-center text-navy">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{d.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <StatusChip status={d.status} />
                        <VerifyChip v={d.verification} />
                        <span className="text-[11px] text-muted-foreground">
                          · {d.date === "—" ? "—" : new Date(d.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <DocBtn
                      label="Download"
                      icon={<Download size={13} />}
                      onClick={() => onDownload(d)}
                      disabled={!downloadable || d.pending !== null}
                      loading={d.pending === "download"}
                    />
                    <DocBtn
                      label={canIssue ? "Issue" : "Re-issue"}
                      icon={<Send size={13} />}
                      onClick={() => onIssue(d)}
                      disabled={d.pending !== null}
                      loading={d.pending === "issue"}
                      tone={canIssue ? "primary" : "ghost"}
                    />
                    <DocBtn
                      label={d.verification === "verified" ? "Verified" : "Verify"}
                      icon={
                        d.verification === "verified" ? <BadgeCheck size={13} /> : <Sparkles size={13} />
                      }
                      onClick={() => onVerify(d)}
                      disabled={verifyDisabled || d.pending !== null}
                      loading={d.pending === "verify"}
                      tone={d.verification === "verified" ? "success" : "ghost"}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </MobileFrame>
  );
}

function Row({ k, v, strong, accent }: { k: string; v: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={`${strong ? "font-semibold" : ""} ${accent ? "text-agro" : "text-navy"}`}>{v}</span>
    </div>
  );
}

function Action({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card py-3 text-[11px] font-medium text-navy hover:bg-secondary transition"
    >
      <span className="h-8 w-8 grid place-items-center rounded-full bg-secondary">{icon}</span>
      {label}
    </button>
  );
}

function StatusCard({
  title,
  status,
  detail,
  tone,
  icon,
}: {
  title: string;
  status: string;
  detail: string;
  tone: "agro" | "navy";
  icon: React.ReactNode;
}) {
  const toneCls = tone === "agro" ? "bg-agro-soft text-agro" : "bg-navy/10 text-navy";
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${toneCls}`}>
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm font-semibold text-navy">{status}</p>
      <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
    </div>
  );
}

function StatusChip({ status }: { status: "Issued" | "Signed" | "Pending" | "Failed" }) {
  const map: Record<string, string> = {
    Issued: "bg-agro-soft text-agro",
    Signed: "bg-violet-soft text-violet",
    Pending: "bg-secondary text-muted-foreground",
    Failed: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status]}`}>
      {status === "Failed" && <AlertTriangle size={10} />}
      {status}
    </span>
  );
}

function VerifyChip({ v }: { v: "unverified" | "pending" | "verified" | "failed" }) {
  if (v === "unverified") return null;
  const cfg = {
    pending: { cls: "bg-secondary text-muted-foreground", icon: <Loader2 size={10} className="animate-spin" />, label: "Verifying" },
    verified: { cls: "bg-agro-soft text-agro", icon: <BadgeCheck size={10} />, label: "Verified" },
    failed: { cls: "bg-destructive/10 text-destructive", icon: <AlertTriangle size={10} />, label: "Verify failed" },
  }[v];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function DocBtn({
  label,
  icon,
  onClick,
  disabled,
  loading,
  tone = "ghost",
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "ghost" | "primary" | "success";
}) {
  const toneCls =
    tone === "primary"
      ? "bg-navy text-white hover:bg-navy/90"
      : tone === "success"
      ? "bg-agro-soft text-agro"
      : "bg-card text-navy hover:bg-background border border-border";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition disabled:opacity-40 disabled:pointer-events-none ${toneCls}`}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : icon}
      {loading ? "…" : label}
    </button>
  );
}
