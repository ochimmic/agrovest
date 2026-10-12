import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { HouseManager } from "@/components/admin/HouseManager";
export const Route = createFileRoute("/_authenticated/_admin/admin/properties")({
  head: () => ({
    meta: [
      { title: "Houses — Admin | AgroVest" },
      { name: "description", content: "Add and edit AgroVest houses, prices, photos and disclaimers." },
      { property: "og:title", content: "Houses — Admin | AgroVest" },
      { property: "og:description", content: "Manage Buy Assets house listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminProperties,
});

function AdminProperties() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.innerWidth >= 1024) navigate({ to: "/admin/desktop", search: { section: "houses" } as any, replace: true });
  }, [navigate]);
  return (
    <AdminShell title="Houses" subtitle="Buy Assets listings sold by AgroVest Direct">
      <HouseManager />
    </AdminShell>
  );
}
