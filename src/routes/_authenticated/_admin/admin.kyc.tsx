import { createFileRoute } from "@tanstack/react-router";
import { FileCheck } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/_admin/_authenticated/_admin/admin/kyc")({
  component: () => (
    <AdminPage
      title="KYC queue"
      subtitle="Verify identity, residence, and source of funds"
      icon={FileCheck}
      filters={["All", "Under review", "More info", "Submitted", "Approved"]}
      items={[
        { name: "Jane Doe", meta: "Investor · NG · Tier 2", state: "Under review" },
        { name: "Mark O.", meta: "Investor · GH · Tier 1", state: "More info" },
        { name: "Ada P.", meta: "Broker · NG · Tier 2", state: "Submitted" },
        { name: "Tobi K.", meta: "Investor · KE · Tier 3", state: "Approved" },
      ]}
    />
  ),
});
