import "@/lib/assetpay";
import { LocalTime } from "@/components/ui/local-time";
import { useMemo, useState } from "react";
import { Bell, Check, ExternalLink, FileText, Info, X } from "lucide-react";
import { openPrivate } from "@/lib/uploads";
import { OrderChat } from "@/components/payments/OrderChat";
import { toast } from "sonner";
import { AdminFrame } from "@/components/admin/workbench/AdminFrame";
import { AgroBadge } from "@/components/ui/agro-badge";
import { fmtNgn } from "@/lib/fx";
import { txUrl, type NetworkId } from "@/lib/wallet/chain";
import {
  confirmPayOrder, payStatusLabel, payStatusTone, rejectPayOrder,
  requestMoreInfo, usePayments,
} from "@/lib/payments";
import { advance, useFarmRemit } from "@/lib/farmremit";


type Filter = "pending" | "all" | "confirmed";

const RAIL_LABEL = {
  crypto: "Crypto · AssetVault",
  ngn: "Naira bank transfer",
  usd: "US dollar transfer",
} as const;

export function PaymentsWorkbench({ embedded = false }: { embedded?: boolean }) {
  const purchases = usePayments((s) => s.orders);
  const deposits = useFarmRemit((s) => s.orders);
  const [filter, setFilter] = useState<Filter>("pending");
  const [chat, setChat] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const a = purchases.map((o) => ({
      id: o.id,
      kind: "Purchase" as const,
      purpose: `${o.purpose.planId ? `BuyByBit ${o.purpose.installment === 0 ? "deposit" : `#${o.purpose.installment}`} · ` : ""}${o.purpose.qty} × ${o.purpose.unit} · ${o.purpose.assetName}`,
      amountUsd: o.amountUsd,
      method: o.rail === "crypto" ? `${RAIL_LABEL.crypto} · ${o.token}` : RAIL_LABEL[o.rail ?? "crypto"],
      payer: o.payerName ?? "AgroVest user",
      reference: o.reference,
      at: o.createdAt,
      status: o.status as string,
      label: payStatusLabel[o.status],
      tone: payStatusTone[o.status],
      hash: o.txHash,
      receipt: o.receiptPath,
      network: o.network,
      settled: o.status === "confirmed" || o.status === "rejected",
    }));
    const b = deposits.map((o) => ({
      id: o.id,
      kind: "Deposit" as const,
      purpose: o.purpose ? `Funds ${o.purpose.assetName}` : "Wallet top-up",
      amountUsd: o.amountUsd,
      method: `Bank transfer · ${o.virtualAccount?.accountNumber ?? "—"}`,
      payer: "AgroVest user",
      reference: o.reference ?? o.id,
      at: o.createdAt,
      status: o.status as string,
      label: o.status.replace(/_/g, " "),
      tone: (o.status === "confirmed" ? "agro" : o.status === "cancelled" ? "danger" : "warn") as "agro" | "danger" | "warn",
      hash: undefined as string | undefined,
      receipt: undefined as string | undefined,
      network: undefined as string | undefined,
      settled: o.status === "confirmed" || o.status === "cancelled",
    }));
    let all = [...a, ...b].sort((x, y) => +new Date(y.at) - +new Date(x.at));
    const term = q.trim().toLowerCase();
    if (term) {
      all = all.filter(
        (r) => r.reference.toLowerCase().includes(term) || r.payer.toLowerCase().includes(term),
      );
    }
    if (filter === "pending") return all.filter((r) => !r.settled);
    if (filter === "confirmed") return all.filter((r) => r.status === "confirmed");
    return all;
  }, [purchases, deposits, filter, q]);

  const alerts = purchases.filter(
    (o) => o.status === "payment_notified" || o.status === "paid_onchain",
  );

  function act(row: (typeof rows)[number], action: "confirm" | "reject" | "info") {
    if (action === "confirm") {
      if (row.kind === "Purchase") confirmPayOrder(row.id);
      else advance(row.id, "confirmed", "Receipt confirmed by AgroVest admin. cUSD credited.");
      toast.success(`${row.reference} confirmed`);
      return;
    }
    if (action === "reject") {
      const reason = prompt("Reason for rejection?");
      if (!reason) return;
      if (row.kind === "Purchase") rejectPayOrder(row.id, reason);
      else advance(row.id, "cancelled", `Rejected by AgroVest: ${reason}`);
      toast.success(`${row.reference} rejected`);
      return;
    }
    const note = prompt("What do you need from the user?");
    if (!note) return;
    if (row.kind === "Purchase") requestMoreInfo(row.id, note);
    else advance(row.id, "admin_review", `AgroVest requested more information: ${note}`);
    toast.success("Request sent");
  }

  const pendingCount = rows.filter((r) => !r.settled).length;

  return (
    <AdminFrame embedded={embedded} title="Payments" subtitle="Manual confirmation queue">
      <div className="space-y-4">
        {alerts.length > 0 && (
          <div className="rounded-2xl border border-violet/30 bg-violet-soft/40 p-4">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-violet" />
              <p className="text-sm font-semibold text-foreground">
                {alerts.length} new payment{alerts.length > 1 ? "s" : ""} pending review
              </p>
            </div>
            <ul className="mt-2 space-y-1">
              {alerts.slice(0, 4).map((o) => (
                <li key={o.id} className="text-[11px] text-foreground">
                  <span className="font-semibold">#{o.reference}</span> · {o.payerName ?? "AgroVest user"} ·{" "}
                  ${o.amountUsd.toLocaleString()} · {RAIL_LABEL[o.rail ?? "crypto"]} ·{" "}
                  <LocalTime at={o.updatedAt} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ticket ID or user name"
          className="w-full rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap items-center gap-2">
          {(["pending", "all", "confirmed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === f ? "bg-violet text-white" : "bg-secondary text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{pendingCount} awaiting action</span>
        </div>


        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing in this view.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={`${r.kind}-${r.id}`} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{r.reference}</p>
                      <AgroBadge size="xs" tone="neutral">{r.kind}</AgroBadge>
                      <AgroBadge size="xs" tone={r.tone}>{r.label}</AgroBadge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{r.payer} · {r.purpose}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {r.method} · <LocalTime at={r.at} />
                    </p>
                    {r.receipt && (
                      <button
                        onClick={() => openPrivate("payment-receipts", r.receipt!).catch((e) => toast.error(e instanceof Error ? e.message : "Could not open receipt"))}
                        className="mt-1 mr-3 inline-flex items-center gap-1 text-[11px] font-medium text-violet"
                      >
                        <FileText size={11} /> View receipt
                      </button>
                    )}
                    <button onClick={() => setChat(chat === r.id ? null : r.id)} className="mt-1 mr-3 inline-flex items-center gap-1 text-[11px] font-medium text-violet">
                      {chat === r.id ? "Hide chat" : "Chat with buyer"}
                    </button>
                    {r.hash && (
                      <a
                        href={txUrl((r.network ?? "bsc-testnet") as NetworkId, r.hash)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-violet"
                      >
                        {r.hash.slice(0, 14)}… <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground tabular">${r.amountUsd.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground tabular">{fmtNgn(r.amountUsd)}</p>
                  </div>
                </div>

                {chat === r.id && (r.kind === "Purchase"
                  ? <div className="mt-3"><OrderChat orderId={r.id} asAdmin /></div>
                  : <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">This is a sample deposit saved only on this device, so there is no buyer to chat with. Real purchases have live chat here and in Payment chat.</p>)}
                {!r.settled && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => act(r, "confirm")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-agro px-3 py-1.5 text-xs font-medium text-white"
                    >
                      <Check size={13} /> Confirm
                    </button>
                    <button
                      onClick={() => act(r, "reject")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
                    >
                      <X size={13} /> Reject
                    </button>
                    <button
                      onClick={() => act(r, "info")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      <Info size={13} /> Request info
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminFrame>
  );
}
