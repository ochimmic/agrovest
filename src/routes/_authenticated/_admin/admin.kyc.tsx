import { createFileRoute } from "@tanstack/react-router";
import { KycWorkbench } from "@/components/admin/workbench/KycWorkbench";

export const Route = createFileRoute("/_authenticated/_admin/admin/kyc")({
  head: () => ({
    meta: [
      { title: "KYC queue — Admin | AgroVest" },
      { name: "description", content: "Review identity documents and approve AgroVest investors." },
      { property: "og:title", content: "KYC queue — Admin | AgroVest" },
      { property: "og:description", content: "Identity verification workbench for AgroVest admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <KycWorkbench />,
});
