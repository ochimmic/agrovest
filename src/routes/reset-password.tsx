import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — AgroVest" },
      { name: "description", content: "Set a new password for your AgroVest account." },
      { property: "og:title", content: "Choose a new password — AgroVest" },
      { property: "og:description", content: "Set a new password for your AgroVest account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit() {
    if (pw.length < 6) return toast.error("Use at least 6 characters.");
    if (pw !== pw2) return toast.error("The two passwords don't match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated");
      nav({ to: "/home" });
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <div className="flex-1 px-6 pt-10">
        <h1 className="text-2xl font-semibold text-navy">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick something you haven't used before.</p>
        <input
          placeholder="New password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="mt-6 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
        />
        <input
          placeholder="Repeat new password"
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="mt-3 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
        />
        <AgroButton size="xl" className="mt-4" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </AgroButton>
      </div>
    </MobileFrame>
  );
}
