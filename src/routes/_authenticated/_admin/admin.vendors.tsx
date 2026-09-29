import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/_admin/admin/vendors")({
  component: () => (
    <AdminPage
      title="Vendor approvals"
      subtitle="Marketplace storefront onboarding"
      icon={Store}
      filters={["All", "Under review", "More info", "Approved"]}
      items={[
        { name: "GoldHaven Realty", meta: "Real estate · 12 listings", state: "Under review" },
        { name: "PrimeAuto", meta: "Automobile · 4 listings", state: "Approved" },
        { name: "Aurum Living", meta: "Household · 7 listings", state: "More info" },
      ]}
    />
  ),
});
