import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck, ScanFace, IdCard, MapPin, CheckCircle2, Clock, FileCheck2, AlertTriangle } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { supabase } from "@/integrations/supabase/client";
import { refreshProfile, useAuth } from "@/lib/auth";
import { ACCEPT, uploadPrivate } from "@/lib/uploads";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({
    meta: [
      { title: "Verify your identity | AgroVest" },
      { name: "description", content: "Upload your ID, selfie and address to verify your AgroVest account." },
      { property: "og:title", content: "Verify your identity | AgroVest" },
      { property: "og:description", content: "Secure identity verification for AgroVest investors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Kyc,
});

const steps = [
  { key: "identity", label: "Identity", icon: IdCard },
  { key: "face", label: "Selfie", icon: ScanFace },
  { key: "address", label: "Address", icon: MapPin },
  { key: "review", label: "Review", icon: ShieldCheck },
];
const ID_TYPES = ["NIN slip / card", "International passport", "Driver's licence", "Voter's card"];
const input = "h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20";

function Kyc() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const kyc = profile?.kyc ?? "none";
  const [note, setNote] = useState<string | null>(null);
  const [redo, setRedo] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ idType: ID_TYPES[0], idNumber: "", address: "", city: "", postcode: "" });
  const [files, setFiles] = useState<{ id?: File; selfie?: File; addr?: File }>({});

  useEffect(() => {
    if (kyc !== "rejected" && kyc !== "more_info") return;
    void supabase.from("kyc_submissions").select("admin_note").order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => setNote(data?.[0]?.admin_note ?? null));
  }, [kyc]);

  if (kyc === "approved") {
    return <StatusScreen icon={<CheckCircle2 size={36} />} title="You're verified" body="Full access to FarmVest, AssetVault and Buy Assets." to="/home" />;
  }
  if ((kyc === "review" || kyc === "pending") && !redo) {
    return <StatusScreen icon={<Clock size={36} />} title="Under review" body="We've received your documents. An AgroVest officer will review them, usually within 24 hours." to="/home" />;
  }
  if ((kyc === "rejected" || kyc === "more_info") && !redo) {
    return (
      <StatusScreen
        icon={<AlertTriangle size={36} />}
        title={kyc === "rejected" ? "Verification not approved" : "We need a bit more"}
        body={note ?? "Please resubmit clearer documents."}
        action={<AgroButton size="xl" className="mt-6" onClick={() => setRedo(true)}>Resubmit documents</AgroButton>}
      />
    );
  }

  function canContinue() {
    if (step === 0) return f.idNumber.trim().length >= 4 && !!files.id;
    if (step === 1) return !!files.selfie;
    if (step === 2) return f.address.trim().length >= 5 && f.city.trim().length >= 2;
    return true;
  }

  async function next() {
    if (!canContinue()) { toast.error("Please complete this step first"); return; }
    if (step < steps.length - 1) { setStep(step + 1); return; }
    setBusy(true);
    try {
      const [idPath, selfiePath, addrPath] = await Promise.all([
        uploadPrivate("kyc-documents", files.id!, "id"),
        uploadPrivate("kyc-documents", files.selfie!, "selfie"),
        files.addr ? uploadPrivate("kyc-documents", files.addr, "address") : Promise.resolve(null),
      ]);
      const { error } = await supabase.from("kyc_submissions").insert({
        id_type: f.idType, id_number: f.idNumber.trim(), address: f.address.trim(), city: f.city.trim(),
        postcode: f.postcode.trim() || null, id_doc_path: idPath, selfie_path: selfiePath, address_doc_path: addrPath,
      });
      if (error) throw error;
      await refreshProfile();
      setRedo(false);
      toast.success("Documents submitted for review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const S = steps[step];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={() => (step > 0 ? setStep(step - 1) : nav({ to: "/home" }))} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-violet font-semibold">Verification</p>
          <p className="text-sm font-semibold text-navy">Step {step + 1} of {steps.length}</p>
        </div>
      </header>

      <div className="px-4 mt-2 flex items-center gap-1.5">
        {steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-violet" : "bg-secondary"}`} />)}
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-6 pb-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-violet text-white shadow-glow">
          <S.icon size={32} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-navy">{S.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 0 && "Upload a clear photo of a government-issued ID. Files are stored privately."}
          {step === 1 && "Take a selfie holding your ID so we can confirm it's you."}
          {step === 2 && "Confirm your residential address. A utility bill or bank statement helps."}
          {step === 3 && "Check your details and submit. Review usually takes up to 24 hours."}
        </p>

        {step === 0 && (
          <div className="mt-5 space-y-2">
            <select value={f.idType} onChange={(e) => setF({ ...f, idType: e.target.value })} className={input}>
              {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input value={f.idNumber} onChange={(e) => setF({ ...f, idNumber: e.target.value })} placeholder="ID number" className={input} />
            <FilePick label="Upload ID photo" file={files.id} onPick={(x) => setFiles({ ...files, id: x })} />
          </div>
        )}
        {step === 1 && (
          <div className="mt-5"><FilePick label="Take or upload selfie" capture file={files.selfie} onPick={(x) => setFiles({ ...files, selfie: x })} /></div>
        )}
        {step === 2 && (
          <div className="mt-5 space-y-2">
            <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Street address" className={input} />
            <div className="grid grid-cols-2 gap-2">
              <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="City" className={input} />
              <input value={f.postcode} onChange={(e) => setF({ ...f, postcode: e.target.value })} placeholder="Postcode (optional)" className={input} />
            </div>
            <FilePick label="Proof of address (optional)" file={files.addr} onPick={(x) => setFiles({ ...files, addr: x })} />
          </div>
        )}
        {step === 3 && (
          <div className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
            <Review k="ID" v={`${f.idType} · ${f.idNumber}`} />
            <Review k="ID photo" v={files.id?.name ?? "—"} />
            <Review k="Selfie" v={files.selfie?.name ?? "—"} />
            <Review k="Address" v={`${f.address}, ${f.city} ${f.postcode}`} />
            <Review k="Proof of address" v={files.addr?.name ?? "Not provided"} />
          </div>
        )}
      </main>

      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton size="xl" onClick={next} disabled={busy || !canContinue()}>
          {busy ? "Uploading…" : step === steps.length - 1 ? "Submit for review" : "Continue"}
        </AgroButton>
      </div>
    </MobileFrame>
  );
}

function FilePick({ label, file, onPick, capture }: { label: string; file?: File; onPick: (f: File) => void; capture?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button type="button" onClick={() => ref.current?.click()} className="w-full rounded-3xl border-2 border-dashed border-violet/30 bg-violet-soft/30 p-6 text-center">
      <input ref={ref} type="file" accept={ACCEPT} {...(capture ? { capture: "user" as const } : {})} className="hidden"
        onChange={(e) => { const x = e.target.files?.[0]; if (x) onPick(x); e.target.value = ""; }} />
      {file ? <FileCheck2 size={32} className="mx-auto text-agro" /> : <IdCard size={32} className="mx-auto text-violet" />}
      <p className="mt-3 text-sm font-medium text-navy line-clamp-1">{file ? file.name : label}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{file ? "Tap to replace" : "PNG, JPG, WEBP or PDF · 10MB max"}</p>
    </button>
  );
}

function Review({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground text-xs">{k}</span><span className="text-right text-xs font-medium text-navy line-clamp-1">{v}</span></div>;
}

function StatusScreen({ icon, title, body, to, action }: { icon: React.ReactNode; title: string; body: string; to?: "/home"; action?: React.ReactNode }) {
  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-in-up">
        <span className="flex h-20 w-20 items-center justify-center rounded-full gradient-agro text-white shadow-glow">{icon}</span>
        <h1 className="mt-4 text-2xl font-semibold text-navy">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        {action}
        {to && <AgroButton size="xl" variant={action ? "ghost" : undefined} className="mt-4" asChild><Link to={to}>Back to home</Link></AgroButton>}
      </div>
    </MobileFrame>
  );
}
