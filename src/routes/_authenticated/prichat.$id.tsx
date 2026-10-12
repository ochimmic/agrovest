import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy bank top-up order room retired; payment chats live on each order page.
export const Route = createFileRoute("/_authenticated/prichat/$id")({
  beforeLoad: () => { throw redirect({ to: "/support", replace: true }); },
});
