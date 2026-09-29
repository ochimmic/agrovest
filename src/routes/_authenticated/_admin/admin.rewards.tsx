import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { AdminPage, ActionBtn } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/_admin/admin/rewards")({
  component: () => (
    <AdminPage
      title="Broker rewards"
      subtitle="Approve milestone & tier payouts"
      icon={Gift}
      filters={["All", "Pending director", "Issued"]}
      items={[
        { name: "Broker BR-7421", meta: "Land milestone · $1,200", state: "Pending director" },
        { name: "Broker BR-9012", meta: "Silver tier · $400", state: "Issued" },
      ]}
      actions={(it) => (
        <>
          <ActionBtn variant="primary">{it.state === "Issued" ? "Receipt" : "Issue"}</ActionBtn>
          <ActionBtn variant="ghost">Details</ActionBtn>
        </>
      )}
    />
  ),
});
