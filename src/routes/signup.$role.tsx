import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { setState, type Role } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/signup/$role")({ component: Signup });

const requirements: Record<Role, string[]> = {
  explorer: ["Name", "Email or phone", "Password", "Country", "Accept Terms & Privacy"],
  investor: [
    "Full legal name", "Email / phone", "Password", "Country & nationality",
    "Date of birth", "Government ID", "Face verification", "Address",
    "T&C, AML", "Wallet setup",
  ],
  vendor: [
    "Full legal name", "Business name (if any)", "Email / phone", "Password",
    "Country & category", "Seller type", "Government ID", "Face verification",
    "Business registration (if any)", "Proof of ownership", "Payout wallet",
    "Vendor terms acceptance",
  ],
  broker: [
    "Full legal name", "Email / phone", "Password", "Country & nationality",
    "Government ID", "Face verification", "Referral details",
    "Broker agreement", "Reward terms", "Payout wallet",
  ],
};

const labels: Record<Role, { title: string; sub: string }> = {
  explorer: { title: "Create an Explorer account", sub: "Browse and learn — upgrade anytime." },
  investor: { title: "Create an Investor account", sub: "Verified investors gain access to FarmVest." },
  vendor: { title: "Apply as a Vendor", sub: "Only verified vendors appear active on AgroVest." },
  broker: { title: "Join as a Broker", sub: "Refer leads and earn commission plus reward perks." },
};

function Signup() {
  const { role } = Route.useParams() as { role: Role };
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [pw, setPw] = useState("");
  const [accept, setAccept] = useState(false);

  const req = requirements[role] ?? requirements.explorer;
  const meta = labels[role] ?? labels.explorer;

  function submit() {
    if (!name || !email || !pw || !accept) {
      toast.error("Please complete all required fields and accept the terms.");
      return;
    }
    setState({ user: { name, email, country }, role, kyc: role === "explorer" ? "none" : "pending" });
    toast.success(`Welcome, ${name.split(" ")[0]}!`);
    if (role === "explorer") nav({ to: "/home" });
    else nav({ to: "/kyc" });
  }

  return (
    <MobileFrame>
      <div className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/role-select" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <p className="text-xs font-medium uppercase tracking-widest text-violet">{role}</p>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-navy">{meta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.sub}</p>

        <div className="mt-6 space-y-3">
          <Field label="Full name" value={name} onChange={setName} placeholder="Jane Doe" />
          <Field label="Email or phone" value={email} onChange={setEmail} placeholder="you@email.com" />
          <Field label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••" />
          <Field label="Country" value={country} onChange={setCountry} />
        </div>

        <details className="mt-5 rounded-2xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-navy">
            What this category requires
          </summary>
          <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
            {req.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-agro-soft text-agro">
                  <Check size={11} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </details>

        <label className="mt-5 flex items-start gap-3 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-violet"
          />
          I accept the AgroVest <span className="text-violet">Terms</span>,{" "}
          <span className="text-violet">Privacy Policy</span>, and the{" "}
          <span className="text-violet">Risk Notice</span>.
        </label>
      </div>

      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 border-t border-border bg-background">
        <AgroButton size="xl" onClick={submit}>
          {role === "explorer" ? "Create account" : "Continue to verification"}
        </AgroButton>
      </div>
    </MobileFrame>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (s: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none transition-all focus:border-violet focus:ring-2 focus:ring-violet/20"
      />
    </label>
  );
}
