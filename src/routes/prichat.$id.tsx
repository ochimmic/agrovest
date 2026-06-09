import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Lock, Flag, Video } from "lucide-react";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/prichat/$id")({ component: Room });

function Room() {
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState([
    { id: 1, who: "them", t: "Welcome to PriChat. End-to-end encrypted." },
    { id: 2, who: "me", t: "Thanks. Looking at the Cocoa belt asset." },
    { id: 3, who: "them", t: "Sending the contract preview now." },
  ]);
  function send() {
    if (!msg.trim()) return;
    setMsgs([...msgs, { id: Date.now(), who: "me", t: msg }]);
    setMsg("");
  }
  return (
    <MobileFrame>
      <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-border">
        <Link to="/prichat" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <span className="h-10 w-10 rounded-full gradient-violet text-white flex items-center justify-center font-semibold">A</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy truncate">AgroVest Support</p>
          <p className="text-[11px] text-violet flex items-center gap-1"><Lock size={10} /> Auto-deletes in 23h</p>
        </div>
        <button className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-violet"><Video size={16} /></button>
        <button className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-warn"><Flag size={16} /></button>
      </header>
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
            m.who === "me" ? "ml-auto gradient-violet text-white rounded-br-md" : "bg-card border border-border text-navy rounded-bl-md"
          }`}>{m.t}</div>
        ))}
      </main>
      <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2">
        <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message" className="flex-1 h-11 rounded-full border border-input bg-card px-4 text-sm outline-none focus:border-violet" />
        <button onClick={send} className="h-11 w-11 rounded-full gradient-violet text-white flex items-center justify-center shadow-glow"><Send size={16} /></button>
      </div>
    </MobileFrame>
  );
}
