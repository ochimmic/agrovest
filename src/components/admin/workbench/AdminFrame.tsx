import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

/** Mobile admin pages use the phone shell; the desktop console embeds the same tools inline. */
export function AdminFrame({ embedded, title, subtitle, children }: { embedded?: boolean; title: string; subtitle?: string; children: ReactNode }) {
  if (!embedded) return <AdminShell title={title} subtitle={subtitle}>{children}</AdminShell>;
  return (
    <div className="space-y-4">
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}
