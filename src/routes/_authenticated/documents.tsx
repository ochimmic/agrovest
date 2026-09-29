import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { documents } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/_authenticated/documents")({ component: Documents });

const tag: Record<string, string> = {
  Issued: "bg-agro-soft text-agro",
  Signed: "bg-violet-soft text-violet",
  Pending: "bg-warn/15 text-warn",
  Updated: "bg-secondary text-secondary-foreground",
};

function Documents() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-semibold text-navy">Documents</h1>
      </header>
      <div className="p-4 space-y-2">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4">
            <span className="h-10 w-10 rounded-xl bg-violet-soft text-violet flex items-center justify-center"><FileText size={16} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy line-clamp-1">{d.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-medium ${tag[d.status]}`}>{d.status}</span>
                <span className="text-muted-foreground">{d.date}</span>
              </div>
            </div>
            <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-navy"><Download size={14} /></button>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}
