import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy /assetpay/$planId URLs redirect to /buybybit/$planId so old bookmarks keep working.
export const Route = createFileRoute("/_authenticated/assetpay/$planId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/buybybit/$planId", params, search: true, replace: true });
  },
});
