import type { ReactNode } from "react";
import { MobileFrame } from "./MobileFrame";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function AppShell({
  children,
  header = true,
  nav = true,
  subtitle,
}: {
  children: ReactNode;
  header?: boolean;
  nav?: boolean;
  subtitle?: string;
}) {
  return (
    <MobileFrame>
      {header && <AppHeader subtitle={subtitle} />}
      <main className="flex-1 overflow-y-auto hide-scrollbar pb-4">{children}</main>
      {nav && <BottomNav />}
    </MobileFrame>
  );
}
