import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, ScanFace, IdCard, MapPin, CheckCircle2 } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { setState, useAppState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/kyc")({ component: Kyc });

const steps = [
  { key: "identity", label: "Identity", icon: IdCard },
  { key: "face", label: "Face verify", icon: ScanFace },
  { key: "address", label: "Address", icon: MapPin },
  { key: "review", label: "Review", icon: ShieldCheck },
];

function Kyc() {
  const nav = useNavigate();
  const kyc = useAppState((s) => s.kyc);
  const [step, setStep] = useState(0);

  if (kyc === "approved") {
    return (
      <MobileFrame>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-in-up">
          <span className="flex h-20 w-20 items-center justify-center rounded-full gradient-agro text-white shadow-glow">
            <CheckCircle2 size={36} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-navy">You're verified</h1>
          <p className="mt-1 text-sm text-muted-foreground">Full access to FarmVest, Vault & rewards.</p>
          <AgroButton size="xl" className="mt-6" asChild>
            <Link to="/home">Continue</Link>
          </AgroButton>
        </div>
      </MobileFrame>
    );
  }

  async function next() {
    if (step < steps.length - 1) { setStep(step + 1); return; }
    setState({ kyc: "approved" });
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").update({ kyc: "approved" }).eq("id", data.user.id);
      await refreshProfile();
    }
    toast.success("KYC submitted — auto-approved for demo");
    nav({ to: "/wallet/intro" });
  }

  const S = steps[step];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={() => (step > 0 ? setStep(step - 1) : nav({ to: "/home" }))} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-violet font-semibold">Verification</p>
          <p className="text-sm font-semibold text-navy">Step {step + 1} of {steps.length}</p>
        </div>
      </header>

      <div className="px-4 mt-2 flex items-center gap-1.5">
        {steps.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-violet" : "bg-secondary"}`} />
        ))}
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-violet text-white shadow-glow">
          <S.icon size={32} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-navy">{S.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 0 && "Upload a government-issued ID. We use bank-grade encryption."}
          {step === 1 && "Take a quick selfie so we can confirm it's you."}
          {step === 2 && "Confirm your residential address."}
          {step === 3 && "Review and submit. Approval typically within 24 hours."}
        </p>

        <div className="mt-6 rounded-3xl border-2 border-dashed border-violet/30 bg-violet-soft/30 p-6 text-center">
          <S.icon size={36} className="mx-auto text-violet" />
          <p className="mt-3 text-sm font-medium text-navy">Tap to {step === 1 ? "scan" : "upload"}</p>
          <p className="text-[11px] text-muted-foreground mt-1">PNG, JPG, or PDF · 10MB max</p>
        </div>

        {step === 2 && (
          <div className="mt-4 space-y-2">
            <input placeholder="Street address" className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="City" className="h-12 rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20" />
              <input placeholder="Postcode" className="h-12 rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20" />
            </div>
          </div>
        )}
      </main>

      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton size="xl" onClick={next}>
          {step === steps.length - 1 ? "Submit for review" : "Continue"}
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
