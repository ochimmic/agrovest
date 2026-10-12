import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy bank top-up flow retired. Funding AssetVault = receive crypto on BSC.
export const Route = createFileRoute("/_authenticated/prichat/")({
  beforeLoad: () => { throw redirect({ to: "/vault/receive", replace: true }); },
});
