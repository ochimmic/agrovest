import type { ReactNode } from "react";

/** Centered mobile canvas. On desktop shows a phone frame; on mobile fills the screen. */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-[100dvh] w-full bg-muted flex items-stretch md:items-center justify-center md:py-8 overflow-hidden">
      <div className="relative w-full h-full md:w-[420px] md:h-[860px] md:rounded-[44px] md:border md:border-border md:shadow-pop bg-background overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
