// Buyer ownership documents. A receipt is issued automatically when a holding
// is created; signed originals are uploaded by AgroVest admins.
import { supabase } from "@/integrations/supabase/client";
import { fmtNgn, fmtUsd } from "@/lib/fx";

export type DocType = "receipt" | "contract_of_sale" | "deed_of_assignment" | "survey_plan" | "rofo";
export type DocRow = {
  id: string; user_id: string; holding_id: string; doc_type: DocType;
  status: "pending" | "under_review" | "issued"; due_note: string | null;
  file_path: string | null; issued_at: string | null; created_at: string;
};

export const DOC_TITLE: Record<DocType, string> = {
  receipt: "Purchase receipt",
  contract_of_sale: "Contract of Sale",
  deed_of_assignment: "Deed of Assignment",
  survey_plan: "Survey Plan",
  rofo: "Right of Occupancy (RofO)",
};
export const DOC_ORDER: DocType[] = ["receipt", "contract_of_sale", "deed_of_assignment", "survey_plan", "rofo"];
export const STATUS_LABEL = { pending: "Being prepared", under_review: "Government review", issued: "Issued" } as const;

export async function openSignedDoc(path: string) {
  const w = window.open("", "_blank");
  const { data, error } = await supabase.storage.from("investor-documents").createSignedUrl(path, 300);
  if (error) { w?.close(); throw error; }
  if (w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
}

type ReceiptHolding = { id: string; name: string; units: number; unit: string; invested: number; purchased_at?: string; purchasedAt?: string };

export function printReceipt(h: ReceiptHolding, buyer: string) {
  const date = new Date(h.purchased_at ?? h.purchasedAt ?? Date.now()).toLocaleDateString();
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const w = window.open("", "_blank");
  if (!w) throw new Error("Allow pop-ups to view the receipt");
  w.document.write(`<!doctype html><html><head><title>AgroVest receipt ${esc(h.id.slice(0, 8))}</title>
<style>body{font-family:Georgia,serif;max-width:640px;margin:40px auto;padding:0 24px;color:#14213d}
h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}
td{padding:10px 0;border-bottom:1px solid #ddd}td:last-child{text-align:right;font-weight:600}
.m{color:#666;font-size:13px}.n{margin-top:32px;font-size:12px;color:#666}</style></head><body>
<h1>AgroVest — Purchase receipt</h1><p class="m">Doxapearl Global Ltd · Receipt no. ${esc(h.id.slice(0, 8).toUpperCase())}</p>
<table><tr><td>Buyer</td><td>${esc(buyer)}</td></tr><tr><td>Asset</td><td>${esc(h.name)}</td></tr>
<tr><td>Quantity</td><td>${h.units} ${esc(h.unit)}</td></tr><tr><td>Amount paid</td><td>${fmtUsd(h.invested, { decimals: true })} (${fmtNgn(h.invested)})</td></tr>
<tr><td>Date confirmed</td><td>${date}</td></tr></table>
<p class="n">This receipt confirms AgroVest received and verified your payment. It is not a title document. Your signed Contract of Sale and Deed of Assignment follow within 48 hours; the Survey Plan and RofO follow after government review (3–12 months).</p>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
