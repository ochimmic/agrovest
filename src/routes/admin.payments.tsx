import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ExternalLink, Info, X } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AgroBadge } from "@/components/ui/agro-badge";
import { fmtNgn } from "@/lib/fx";
import { txUrl, type NetworkId } from "@/lib/wallet/chain";
import {
  confirmPayOrder, payStatusLabel, payStatusTone, rejectPayOrder,
  requestMoreInfo, usePayments,
} from "@/lib/payments";
import { advance, useFarmRemit } from "@/lib/farmremit";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments queue — Admin | AgroVest" },
      { name: "description", content: "Confirm, reject or query every pending AgroVest payment across wallet purchases and bank deposits." },
      { property: "og:title", content: "Payments queue — Admin | AgroVest" },
      { property: "og:description", content: "One manual confirmation queue for every AgroVest payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPayments,
});

type Filter = "pending" | "all" | "confirmed";

function AdminPayments() {
  const purchases = usePayments((s) => s.orders);
  const deposits = useFarmRemit((s) => s.orders);
  const [filter, setFilter] = useState<Filter>("pending");

  const rows = useMemo(() => {
    const a = purchases.map((o) => ({
      id: o.id,
      kind: "Purchase" as const,
      purpose: `${o.purpose.qty} × ${o.purpose.unit} · ${o.purpose.assetName}`,
      amountUsd: o.amountUsd,
      method: `AssetVault · ${o.token}`,
      reference: o.reference,
      at: o.createdAt,
      status: o.status as string,
      label: payStatusLabel[o.status],
      tone: payStatusTone[o.status],
      hash: o.txHash,
      network: o.network,
      settled: o.status === "confirmed" || o.status === "rejected",
    }));
    const b = deposits.map((o) => ({
      id: o.id,
      kind: "Deposit" as const,
      purpose: o.purpose ? `Funds ${o.purpose.assetName}` : "Wallet top-up",
      amountUsd: o.amountUsd,
      method: `Bank transfer · ${o.virtualAccount?.accountNumber ?? "—"}`,
      reference: o.reference ?? o.id,
      at: o.createdAt,
      status: o.status as string,
      label: o.status.replace(/_/g, " "),
      tone: (o.status === "confirmed" ? "agro" : o.status === "cancelled" ? "danger" : "warn") as "agro" | "danger" | "warn",
      hash: undefined as string | undefined,
      network: undefined as string | undefined,
      settled: o.status === "confirmed" || o.status === "cancelled",
    }));
    const all = [...a, ...b].sort((x, y) => +new Date(y.at) - +new Date(x.at));
    if (filter === "pending") return all.filter((r) => !r.settled);
    if (filter === "confirmed") return all.filter((r) => r.status === "confirmed");
    return all;
  }, [purchases, deposits, filter]);

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
    <AdminShell title="Payments" subtitle="Manual confirmation queue">
      <div className="space-y-4">
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
                    <p className="mt-1 truncate text-xs text-muted-foreground">{r.purpose}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {r.method} · {new Date(r.at).toLocaleString()}
                    </p>
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
    </AdminShell>
  );
}
