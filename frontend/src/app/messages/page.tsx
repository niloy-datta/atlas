"use client";

import { useState } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "me" | "other";
  text: string;
  time: string;
}

interface Thread {
  id: string;
  name: string;
  company: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  online?: boolean;
  type: "all" | "employers" | "recruiters" | "system";
}

const THREADS: Thread[] = [
  {
    id: "t1",
    name: "Sarah Ahmed",
    company: "BrightClean Services",
    role: "Operations Manager",
    avatar: "👩‍💼",
    lastMessage: "Hi Niloy, are you available for the shift...",
    time: "10:24 AM",
    unreadCount: 2,
    online: true,
    type: "employers",
  },
  {
    id: "t2",
    name: "James Carter",
    company: "Maple Logistics",
    role: "Fleet Supervisor",
    avatar: "👨‍💼",
    lastMessage: "Thanks for your interest! We'd like to...",
    time: "Yesterday",
    unreadCount: 1,
    online: false,
    type: "employers",
  },
  {
    id: "t3",
    name: "HR Team",
    company: "WORVO",
    role: "Talent Operations",
    avatar: "🛡️",
    lastMessage: "Your application for Warehouse Assista...",
    time: "Yesterday",
    online: true,
    type: "system",
  },
  {
    id: "t4",
    name: "TalentMatch AI",
    company: "SkillHub",
    role: "Automated Assistant",
    avatar: "🤖",
    lastMessage: "3 new jobs match your skills!",
    time: "Sep 14",
    online: true,
    type: "system",
  },
  {
    id: "t5",
    name: "Daniel Kim",
    company: "QuickServe Restaurant",
    role: "Branch Lead",
    avatar: "👨‍🍳",
    lastMessage: "Can you confirm your availability for...",
    time: "Sep 14",
    type: "employers",
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    sender: "other",
    text: "Hi Niloy, I came across your profile and I'm impressed with your experience in cleaning and facility support. We have a shift available this weekend at Dhanmondi. Are you interested?",
    time: "09:12 AM",
  },
  {
    id: "m2",
    sender: "me",
    text: "Hi Sarah, Yes, I'm interested! Could you please share more details about the shift (time, pay, and location)?",
    time: "09:18 AM",
  },
  {
    id: "m3",
    sender: "other",
    text: "Sure!\n📍 Location: Dhanmondi, Dhaka\n📅 Date: Sat, 20 Sep 2026\n⏰ Time: 8:00 AM – 4:00 PM\n💵 Pay: ৳450/hr (৳3,600 total)\nLet me know if this works for you.",
    time: "09:22 AM",
  },
  {
    id: "m4",
    sender: "me",
    text: "That looks good. I'm available. Please confirm my booking.",
    time: "09:24 AM",
  },
  {
    id: "m5",
    sender: "other",
    text: "Great! You're confirmed ✓ You'll receive the full details in your email shortly. Looking forward to working with you!",
    time: "09:25 AM",
  },
];

export default function MessagesPage() {
  const [selectedThread, setSelectedThread] = useState<Thread>(THREADS[0]);
  const [filterType, setFilterType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: "me",
      text: inputText.trim(),
      time: "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate instant client response
    setTimeout(() => {
      const reply: Message = {
        id: `m-reply-${Date.now()}`,
        sender: "other",
        text: "Thank you for the update Niloy! Our team has recorded this in your shift schedule.",
        time: "Just now",
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-blue-500/20 border border-blue-400/30 text-sm font-medium flex items-center gap-3 animate-fade-in">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="10" cy="16" r="6" fill="#3B82F6" />
              <circle cx="22" cy="10" r="4" fill="#8B5CF6" />
              <circle cx="22" cy="22" r="4" fill="#10B981" />
              <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2" />
              <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2" />
            </svg>
            <div>
              <span className="text-xl font-black tracking-tight text-white">WORVO</span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 block -mt-1 font-semibold uppercase tracking-wider">Work Your Way</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Home
            </Link>
            <Link href="/jobs" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Find Work
            </Link>
            <Link href="/my-shifts" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              My Shifts
            </Link>
            <Link href="/messages" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition flex items-center gap-1.5">
              <span>Messages</span>
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">3</span>
            </Link>
            <Link href="/earnings" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
              Earnings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
              N
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-200">Niloy Chandra Datta</div>
              <div className="text-[10px] text-blue-400 font-semibold">Worker Account</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        {/* Left Sidebar from 8d4bfbe9-8f27-4f01-932e-c0e567508d29.png */}
        <aside className="hidden xl:flex flex-col w-64 border-r border-slate-800/80 bg-[#080D1A]/60 p-5 shrink-0 gap-6">
          <nav className="flex flex-col gap-1 text-xs font-semibold text-slate-400">
            <Link href="/dashboard/worker" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📊</span> Dashboard
            </Link>
            <Link href="/jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🔎</span> Find Work
            </Link>
            <Link href="/my-shifts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📅</span> My Shifts
            </Link>
            <a href="#saved" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>❤️</span> Saved Jobs
            </a>
            <Link href="/skills" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>⚙️</span> Skills & Certificates
            </Link>
            <Link href="/workpass" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>🛡️</span> Work Passport
            </Link>
            <Link href="/messages" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-white bg-blue-600/20 border border-blue-500/30 font-bold transition">
              <span className="flex items-center gap-3">
                <span>💬</span> Messages
              </span>
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
            </Link>
            <Link href="/earnings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>💰</span> Earnings
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </aside>

        {/* Main Messenger Area */}
        <main className="flex-1 p-4 sm:p-7 space-y-5 overflow-x-hidden flex flex-col">
          {/* Hero Banner */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0E172B] via-[#111C35] to-[#16122E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Messages</h1>
              <p className="text-sm text-slate-300 font-medium mt-1">Stay connected. Get opportunities. Build your future.</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-blue-300 italic">&quot;Conversations today, better opportunities tomorrow.&quot;</div>
              <div className="text-[10px] text-slate-400 mt-0.5">— WORVO Instant Connect</div>
            </div>
          </div>

          {/* 3-Column Chat Layout from 8d4bfbe9-8f27-4f01-932e-c0e567508d29.png */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
            {/* Column 1: Conversations List (3.5 cols) */}
            <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0E1626] border border-slate-800 flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#080D1A] border border-slate-700/70 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1.5 border-b border-slate-800 pb-2">
                {["All", "Employers", "Recruiters", "System"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      filterType === f ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Thread Items */}
              <div className="flex-1 space-y-1 overflow-y-auto">
                {THREADS.map((thread) => {
                  const isSelected = selectedThread.id === thread.id;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? "bg-blue-600/20 border border-blue-500/40"
                          : "hover:bg-slate-900/50 border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                          {thread.avatar}
                        </div>
                        {thread.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0E1626]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{thread.name}</h4>
                          <span className="text-[10px] text-slate-500">{thread.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{thread.company}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{thread.lastMessage}</p>
                      </div>

                      {thread.unreadCount && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Active Chat Conversation (5 cols) */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-[#0E1626] border border-slate-800 flex flex-col justify-between">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                    {selectedThread.avatar}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {selectedThread.name}
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </h3>
                    <p className="text-[10px] text-slate-400">{selectedThread.company} • Active now</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <button onClick={() => showToast("VoIP direct call initiated")} className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white">📞</button>
                  <button onClick={() => showToast("Video call room created")} className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white">📹</button>
                  <button className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white">⋮</button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[420px]">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-3 py-1 rounded-full">
                    Today, 15 Sep 2026
                  </span>
                </div>

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.sender === "me"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                          : "bg-slate-900 border border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.text}</div>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button type="button" onClick={() => showToast("File attachment selector opened")} className="p-2 text-slate-400 hover:text-white text-sm">📎</button>
                <button type="button" className="p-2 text-slate-400 hover:text-white text-sm">😊</button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-[#080D1A] border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Send ➔
                </button>
              </form>
            </div>

            {/* Column 3: Contact Profile & Related Job Card (3.5 cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Profile Card */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
                  {selectedThread.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedThread.name}</h3>
                  <p className="text-xs text-slate-400">{selectedThread.company}</p>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">● Active now</div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => showToast("Direct audio call dialed")} className="flex-1 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white">
                    📞 Call
                  </button>
                  <button onClick={() => showToast("Video meeting link sent")} className="flex-1 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white">
                    📹 Video
                  </button>
                </div>
              </div>

              {/* Related Job Card */}
              <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Related Job</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">Confirmed</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-white">Cleaning Staff (Weekend)</div>
                  <div className="text-slate-400">📍 Dhanmondi, Dhaka</div>
                  <div className="text-slate-400">📅 20 Sep 2026 • 8:00 AM - 4:00 PM</div>
                  <div className="font-bold text-emerald-400">৳450/hr (৳3,600 total)</div>
                </div>

                <Link
                  href="/my-shifts"
                  className="block w-full py-2 bg-slate-900 hover:bg-slate-800 text-center border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
                >
                  View Job Details →
                </Link>
              </div>

              {/* Shared Media */}
              <div className="p-4 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Shared Media</span>
                  <span className="text-[11px] text-blue-400 cursor-pointer">View All</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">📄</span>
                    <span className="text-slate-300 truncate">Shift_Details_Dhanmondi.pdf</span>
                  </div>
                  <span className="text-blue-400 cursor-pointer text-xs font-bold">↓</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
