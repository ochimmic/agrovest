import { useState } from "react";
import { Plus, Pencil, Trash2, Home as HomeIcon, X } from "lucide-react";
import { toast } from "sonner";
import { AgroBadge } from "@/components/ui/agro-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useHouses, housePrice, ngnToUsd, type House } from "@/lib/properties";
import { fmtNgn } from "@/lib/fx";

type Form = {
  id?: string; title: string; location: string; market_price_ngn: string; title_doc: string; verified: boolean;
  inspection_date: string; survey_ok: boolean; structural_ok: boolean; title_search_ok: boolean;
  description: string; disclaimer: string; status: string; image_path: string | null;
};
const blank: Form = { title: "", location: "", market_price_ngn: "", title_doc: "Under review", verified: false, inspection_date: "Pending", survey_ok: false, structural_ok: false, title_search_ok: false, description: "", disclaimer: "", status: "draft", image_path: null };

export function HouseManager({ onChange, wide = false }: { onChange?: () => void; wide?: boolean }) {
  const { houses, reload } = useHouses({ all: true });
  const [form, setForm] = useState<Form | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function edit(h: House) {
    setFile(null);
    setForm({ ...h, market_price_ngn: String(h.market_price_ngn) });
  }

  async function save() {
    if (!form) return;
    const ngn = Number(form.market_price_ngn.replace(/,/g, ""));
    if (!form.title.trim() || !ngn || ngn <= 0) return toast.error("Enter a title and a market price in naira");
    setBusy(true);
    try {
      let image_path = form.image_path;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        image_path = `houses/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("property-images").upload(image_path, file, { contentType: file.type });
        if (upErr) throw upErr;
      }
      const row = {
        title: form.title.trim(), location: form.location.trim(), market_price_ngn: ngn, title_doc: form.title_doc,
        verified: form.verified, inspection_date: form.inspection_date, survey_ok: form.survey_ok, structural_ok: form.structural_ok,
        title_search_ok: form.title_search_ok, description: form.description, disclaimer: form.disclaimer, status: form.status, image_path,
      };
      const { error } = form.id
        ? await supabase.from("properties").update(row).eq("id", form.id)
        : await supabase.from("properties").insert(row);
      if (error) throw error;
      toast.success(form.id ? "House updated" : "House added");
      setForm(null); reload(); onChange?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally { setBusy(false); }
  }

  async function remove(h: House) {
    if (!confirm(`Delete "${h.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("properties").delete().eq("id", h.id);
    if (error) return toast.error(error.message);
    toast.success("House deleted"); reload(); onChange?.();
  }

  const input = "w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground";
  const ngnVal = form ? Number(form.market_price_ngn.replace(/,/g, "")) || 0 : 0;
  const preview = housePrice({ market_price_ngn: ngnVal });
  return (
    <div>
      <button onClick={() => { setFile(null); setForm({ ...blank }); }} className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-agro px-4 py-2 text-sm font-medium text-[oklch(0.18_0.01_250)]"><Plus size={15} />Add house</button>

      {houses === null ? <Skeleton className="h-40 w-full rounded-2xl" /> : houses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No houses yet.</p>
      ) : (
        <div className={wide ? "grid grid-cols-2 gap-3 xl:grid-cols-3" : "space-y-2"}>
          {houses.map((h) => (
            <div key={h.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary flex items-center justify-center">
                {h.image ? <img src={h.image} alt="" className="h-full w-full object-cover" /> : <HomeIcon size={18} className="text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{h.title}</p>
                  <AgroBadge size="xs" tone={h.status === "active" ? "agro" : h.status === "sold" ? "danger" : "warn"}>{h.status}</AgroBadge>
                </div>
                <p className="text-[11px] text-muted-foreground">{h.location} · {h.title_doc} · {h.verified ? "Verified" : "Not verified"}</p>
                <p className="text-xs font-medium">Market ₦{h.market_price_ngn.toLocaleString()} · ${h.price.toLocaleString()}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button aria-label="Edit" onClick={() => edit(h)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><Pencil size={13} /></button>
                <button aria-label="Delete" onClick={() => void remove(h)} className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={() => setForm(null)}>
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-4 text-foreground sm:rounded-3xl space-y-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{form.id ? "Edit house" : "Add house"}</h2>
              <button aria-label="Close" onClick={() => setForm(null)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><X size={14} /></button>
            </div>
            <input className={input} placeholder="Title (e.g. Lekki 3-Bed Detached House)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className={input} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <div>
              <input className={input} placeholder="Actual market price (₦)" inputMode="numeric" value={form.market_price_ngn} onChange={(e) => setForm({ ...form, market_price_ngn: e.target.value })} />
              {ngnVal > 0 && (
                <div className="mt-1.5 rounded-xl bg-secondary p-2.5 text-[11px] space-y-0.5">
                  <p>Market: ₦{ngnVal.toLocaleString()} · <b>${ngnToUsd(ngnVal).toLocaleString()}</b></p>
                  <p>AgroVest price (1% less): {fmtNgn(preview.agrovest)} · ${preview.agrovest.toLocaleString()}</p>
                  <p>Escrow (3%): {fmtNgn(preview.escrow)} · ${preview.escrow.toLocaleString()}</p>
                  <p className="font-semibold">Buyer pays: {fmtNgn(preview.total)} · ${preview.total.toLocaleString()}</p>
                </div>
              )}
            </div>
            <label className="block text-xs text-muted-foreground">Photo
              <input type="file" accept="image/*" className="mt-1 block w-full text-xs" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select className={input} value={form.title_doc} onChange={(e) => setForm({ ...form, title_doc: e.target.value })}>
                {["C of O", "Governor's Consent", "Registered Deed", "Gazette", "Excision", "Under review"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input className={input} placeholder="Inspection date (e.g. Sep 2026)" value={form.inspection_date} onChange={(e) => setForm({ ...form, inspection_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {([["verified", "Verified by AgroVest"], ["survey_ok", "Survey plan checked"], ["structural_ok", "Structural inspection"], ["title_search_ok", "Title search passed"]] as const).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2.5 py-2 text-foreground cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 accent-agro" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />{l}
                </label>
              ))}
            </div>
            <textarea className={input} rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <textarea className={input} rows={3} placeholder="Disclaimer shown to buyers" value={form.disclaimer} onChange={(e) => setForm({ ...form, disclaimer: e.target.value })} />
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft (hidden)</option><option value="active">Listed</option><option value="sold">Sold</option>
            </select>
            <button disabled={busy} onClick={() => void save()} className="w-full rounded-full bg-agro py-2.5 text-sm font-medium text-[oklch(0.18_0.01_250)] disabled:opacity-50">{busy ? "Saving…" : "Save house"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
