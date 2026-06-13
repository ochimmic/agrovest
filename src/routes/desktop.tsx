import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/desktop")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/desktop" });
  },
});
