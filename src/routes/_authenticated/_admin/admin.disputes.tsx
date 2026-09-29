import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { AdminPage, ActionBtn } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/disputes")({
  component: () => (
    <AdminPage
      title="Disputes"
      subtitle="Open escalations and refund requests"
      icon={AlertTriangle}
      filters={["All", "Open", "Resolved"]}
      items={[
        { name: "Order #o1 — Lekki Residence", meta: "Buyer escalated · 2d open", state: "Open" },
        { name: "Order #o5 — Camry 2022", meta: "Refund requested", state: "Resolved" },
      ]}
      actions={() => (
        <>
          <ActionBtn variant="primary">Resolve</ActionBtn>
          <ActionBtn variant="danger">Escalate</ActionBtn>
          <ActionBtn variant="ghost">Chat</ActionBtn>
        </>
      )}
    />
  ),
});
