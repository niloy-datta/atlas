"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

const QUICK_PROMPTS = [
  "Find work near me",
  "How does WorkPass work?",
  "Help me choose a shift",
];

function getChatbotAnswer(question: string) {
  const text = question.toLowerCase();

  if (/near|nearby|location|close|কাছে|লোকেশন/.test(text)) {
    return "কাছাকাছি কাজ দেখতে Find Work বা Shifts খুলে “Use my location” চাপুন। তারপর distance অনুযায়ী সুযোগগুলো দেখতে পারবেন।";
  }

  if (/workpass|verify|verified|verification|ভেরিফাই|ওয়ার্কপাস/.test(text)) {
    return "WorkPass আপনার verified identity, skills এবং ratings এক জায়গায় রাখে। Profile ও Skills & Certificates সম্পূর্ণ করলে employers আপনাকে দ্রুত বিশ্বাস করতে পারে।";
  }

  if (/shift|শিফট|hour|সময়|schedule/.test(text)) {
    return "একটি shift বাছার সময় distance, hourly pay, সময় এবং verified badge দেখুন। কাছের বেশি match পেতে আপনার location চালু রাখুন।";
  }

  if (/job|কাজ|work|চাকরি|earn|income|আয়/.test(text)) {
    return "আপনার জন্য শুরু করার ভালো জায়গা হলো Find Work। Search-এ skill লিখুন, location দিন, তারপর pay ও distance দেখে Apply করুন।";
  }

  if (/hire|worker|লোক|staff|employer|নিয়োগ/.test(text)) {
    return "কর্মী নিয়োগ করতে Hire People খুলুন, skill ও location দিয়ে search করুন, তারপর verified WorkPass এবং ratings দেখে shortlist করুন।";
  }

  if (/message|chat|মেসেজ/.test(text)) {
    return "Messages থেকে employer বা worker-এর সঙ্গে কথা বলতে পারবেন। কোনো sensitive information বা payment আগে শেয়ার করবেন না।";
  }

  return "আমি আপনাকে jobs, shifts, WorkPass, hiring এবং earnings নিয়ে সাহায্য করতে পারি। নিচের একটি quick option বেছে নিন বা প্রশ্ন লিখুন।";
}

export default function SupportChatbot() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi! আমি Worvo Chat। কাজ, shift বা WorkPass নিয়ে কী জানতে চান?",
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const ask = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: trimmed },
      { id: Date.now() + 1, role: "assistant", text: getChatbotAnswer(trimmed) },
    ]);
    setQuestion("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(question);
  };

  const navigateTo = (path: string) => {
    setOpen(false);
    if (pathname !== path) router.push(path);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {open && (
        <section
          aria-label="Worvo Chat"
          className="w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-blue-400/30 bg-[#0d1524] shadow-2xl shadow-blue-950/50"
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-blue-600/20 to-violet-600/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-xl shadow-lg shadow-blue-900/40">
                ✦
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-white">Worvo Chat</h2>
                <p className="text-[11px] font-semibold text-emerald-400">Free • instant replies</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg px-2 py-1 text-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-5 ${
                    message.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-slate-700 bg-slate-900 text-slate-200"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => ask(prompt)}
                  className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-blue-200 transition hover:border-blue-300 hover:bg-blue-500/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Type your question..."
                aria-label="Ask Worvo Chat"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
              <button
                type="submit"
                aria-label="Send question"
                className="rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!question.trim()}
              >
                ➜
              </button>
            </form>
          </div>
        </section>
      )}

      <div className="flex items-center gap-2">
        {open && (
          <button
            type="button"
            onClick={() => navigateTo("/jobs")}
            className="hidden rounded-full border border-slate-700 bg-[#0d1524] px-3 py-2 text-xs font-bold text-slate-200 shadow-lg sm:block"
          >
            Browse jobs
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close Worvo Chat" : "Open Worvo Chat"}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border border-blue-300/40 bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/50 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500"
        >
          <span className="text-lg">✦</span>
          <span>{open ? "Close" : "Worvo Chat"}</span>
        </button>
      </div>
    </div>
  );
}
