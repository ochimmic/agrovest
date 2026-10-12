import { createFileRoute } from "@tanstack/react-router";
import { PaymentsWorkbench } from "@/components/admin/workbench/PaymentsWorkbench";

export const Route = createFileRoute("/_authenticated/_admin/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments queue — Admin | AgroVest" },
      { name: "description", content: "Confirm, reject or query every pending AgroVest payment across wallet purchases and bank deposits." },
      { property: "og:title", content: "Payments queue — Admin | AgroVest" },
      { property: "og:description", content: "One manual confirmation queue for every AgroVest payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PaymentsWorkbench />,
});
