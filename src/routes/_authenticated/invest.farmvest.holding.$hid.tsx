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
import { HoldingDocuments } from "@/components/documents/HoldingDocuments";

export const Route = createFileRoute("/_authenticated/invest/farmvest/holding/$hid")({ component: HoldingDetail });

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
  const platformFee = 0;
  const netPrincipal = holding.invested - platformFee;
  // Steady-state projected annual yield (Y5+ = 50% of principal)
  const projectedYr = Math.round(holding.invested * 0.5);
  const txHash = `0x${holding.id.replace(/[^a-f0-9]/gi, "").padEnd(8, "a").slice(0, 8)}…${holding.id.slice(-4)}`;

  const schedule = [
    { y: "Y1–2", pct: "0%", note: "Maturation", tone: "muted" as "muted" | "warn" | "agro" },
    { y: "Y3", pct: "30%", note: "Maturity begins", tone: "agro" as const },
    { y: "Y4", pct: "40%", note: "Annual ROI", tone: "agro" as const },
    { y: "Y5+", pct: "50% / yr", note: "Every year after", tone: "agro" as const },
  ];

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
      <div className={`relative h-44 bg-gradient-to-br ${asset.cover} bg-cover bg-center`} style={asset.image ? { backgroundImage: `url(${asset.image})` } : undefined}>
        {asset.image && <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />}
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
          <Action label="Send" icon={<RefreshCw size={16} />} onClick={() => nav({ to: "/vault/send" })} />
          <Action label="Txns" icon={<Receipt size={16} />} onClick={() => nav({ to: "/vault" })} />
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
            
            <Row k="Total invested" v={`$${holding.invested.toLocaleString()}`} strong />
            <div className="my-2 h-px bg-border" />
            <Row k="Expected yield" v={asset.expectedYield} />
            <Row k="Projected /yr (Y5+)" v={`$${projectedYr.toLocaleString()}`} accent />
            <Row k="Appreciation" v={asset.appreciation} />
          </div>
        </section>

        {/* Yield schedule */}
        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Yield schedule</h2>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            Maturity begins between the 3rd and 4th year: 30% in Year 3, 40% in Year 4, then 50% every year from Year 5.
          </p>
          <ul className="mt-3 space-y-1.5">
            {schedule.map((s) => {
              const toneCls =
                s.tone === "agro"
                  ? "bg-agro-soft text-agro"
                  : s.tone === "warn"
                    ? "bg-warn/15 text-warn"
                    : "bg-secondary text-muted-foreground";
              return (
                <li
                  key={s.y}
                  className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex min-w-[44px] justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneCls}`}>
                      {s.y}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{s.note}</span>
                  </div>
                  <span className="text-sm font-semibold text-navy tabular">{s.pct}</span>
                </li>
              );
            })}
          </ul>
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
          <h2 className="text-sm font-semibold text-navy">Documents</h2>
          <div className="mt-3"><HoldingDocuments holdingId={holding.id} /></div>
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
      ? "bg-primary text-primary-foreground hover:opacity-90"
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
