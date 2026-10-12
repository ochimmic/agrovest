import { createFileRoute } from "@tanstack/react-router";
import { DocumentsWorkbench } from "@/components/admin/workbench/DocumentsWorkbench";

export const Route = createFileRoute("/_authenticated/_admin/admin/documents")({
  head: () => ({
    meta: [
      { title: "Document issuing — Admin | AgroVest" },
      { name: "description", content: "Upload signed ownership documents for AgroVest buyers." },
      { property: "og:title", content: "Document issuing — Admin | AgroVest" },
      { property: "og:description", content: "Issue Contracts of Sale, Deeds of Assignment, Survey Plans and RofO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <DocumentsWorkbench />,
});
