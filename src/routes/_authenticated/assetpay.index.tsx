import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy /assetpay URLs redirect to /buybybit so old bookmarks keep working.
export const Route = createFileRoute("/_authenticated/assetpay/")({
  beforeLoad: () => {
    throw redirect({ to: "/buybybit", replace: true });
  },
});
