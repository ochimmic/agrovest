import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { getState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgroVest — Secure Real-World Asset Investing" },
      { name: "description", content: "AgroVest: privacy-first, investment-grade real-world asset ownership. Invest in farms, properties, and tokenized assets." },
      { property: "og:title", content: "AgroVest — Secure Real-World Asset Investing" },
      { property: "og:description", content: "Privacy-first, investment-grade real-world asset ownership." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => {
      const { user, role } = getState();
      nav({ to: user && role ? "/home" : "/welcome", replace: true });
    }, 2200);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="min-h-screen w-full gradient-hero flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 animate-in-up">
        <div className="scale-150">
          <Logo size={44} tone="light" />
        </div>
        <p className="text-white/70 text-xs tracking-[0.2em] uppercase">Privacy. Investment. Technology.</p>
        <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white/90 animate-[splash-load_2.2s_cubic-bezier(0.4,0,0.2,1)_forwards]" />
        </div>
      </div>
    </div>
  );
}
