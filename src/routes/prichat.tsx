import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Search, Plus, Timer } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/prichat")({ component: PriChat });

const chats = [
  { id: "c1", name: "AgroVest Support", last: "Welcome to PriChat. Messages auto-delete in 24h.", time: "now", unread: 1, ttl: "23h" },
  { id: "c2", name: "Tunde A. (Broker)", last: "Sending the lead profile now.", time: "12m", unread: 0, ttl: "11h" },
  { id: "c3", name: "Adaobi N. (Consultant)", last: "Meeting room is open.", time: "1h", unread: 2, ttl: "5h" },
];

function PriChat() {
  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">PriChat</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock size={11} className="text-violet" /> Privacy-first · auto-deletes in 24h
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card h-11 px-3">
          <Search size={16} className="text-muted-foreground" />
          <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Search" />
        </div>

        <div className="rounded-2xl border border-violet/20 bg-violet-soft/40 p-3 text-[11px] text-navy">
          Messages auto-delete after 24h. Backups, abuse reports, legal records, compliance, and on-chain records are excluded from deletion.
        </div>

        <ul className="space-y-2">
          {chats.map((c) => (
            <Link
              key={c.id}
              to="/prichat/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3"
            >
              <span className="h-11 w-11 rounded-full gradient-violet text-white flex items-center justify-center font-semibold">
                {c.name[0]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-semibold text-navy truncate">{c.name}</p>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.last}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-violet flex items-center gap-0.5"><Timer size={10} />{c.ttl}</p>
                {c.unread > 0 && <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet text-white text-[10px] px-1">{c.unread}</span>}
              </div>
            </Link>
          ))}
        </ul>

        <button className="fixed bottom-24 right-6 h-14 w-14 rounded-full gradient-violet text-white shadow-glow flex items-center justify-center md:absolute md:right-6">
          <Plus size={22} />
        </button>
      </div>
    </AppShell>
  );
}
