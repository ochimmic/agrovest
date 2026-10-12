import { createFileRoute } from "@tanstack/react-router";
import { AuditWorkbench } from "@/components/admin/workbench/AuditWorkbench";

export const Route = createFileRoute("/_authenticated/_admin/admin/audit")({
  head: () => ({ meta: [{ title: "Audit trail — Admin | AgroVest" }, { name: "robots", content: "noindex" }] }),
  component: () => <AuditWorkbench />,
});
