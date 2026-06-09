import type { ReactNode } from "react";

/** Centered mobile canvas. On desktop shows a phone frame; on mobile fills the screen. */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[oklch(0.96_0.005_260)] flex items-stretch md:items-center justify-center md:py-8">
      <div className="relative w-full md:w-[420px] md:h-[860px] md:rounded-[44px] md:border md:border-black/10 md:shadow-pop bg-background overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
