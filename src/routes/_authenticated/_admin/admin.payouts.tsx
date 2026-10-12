import { createFileRoute } from "@tanstack/react-router";
import { PayoutsWorkbench } from "@/components/admin/workbench/PayoutsWorkbench";

export const Route = createFileRoute("/_authenticated/_admin/admin/payouts")({
  head: () => ({
    meta: [
      { title: "Broker payouts — Admin | AgroVest" },
      { name: "description", content: "Review and settle broker payout requests." },
      { property: "og:title", content: "Broker payouts — Admin | AgroVest" },
      { property: "og:description", content: "Broker payout queue for AgroVest admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PayoutsWorkbench />,
});
