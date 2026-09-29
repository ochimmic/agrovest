import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/partners")({
  component: () => (
    <AdminPage
      title="Partner approvals"
      subtitle="Promote investors & brokers to partner tier"
      icon={Award}
      filters={["All", "Pending review", "Director approval"]}
      items={[
        { name: "Adaeze O.", meta: "Investor · $42k volume · 1y", state: "Pending review" },
        { name: "Tunde A.", meta: "Broker · 38 verified · 2y", state: "Director approval" },
      ]}
    />
  ),
});
