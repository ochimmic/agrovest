import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/_admin/admin/consultants")({
  component: () => (
    <AdminPage
      title="Consultant certification"
      subtitle="Certify investor-facing consultants"
      icon={Megaphone}
      filters={["All", "Pending", "Approved"]}
      items={[
        { name: "Marie Okafor", meta: "Investor Comms · 3 yrs", state: "Pending" },
      ]}
      emptyText="No certifications pending."
    />
  ),
});
