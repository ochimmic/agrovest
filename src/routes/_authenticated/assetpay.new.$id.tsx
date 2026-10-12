import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy /assetpay/new/$id URLs redirect to /buybybit/new/$id so old bookmarks keep working.
export const Route = createFileRoute("/_authenticated/assetpay/new/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/buybybit/new/$id", params, search: true, replace: true });
  },
});
