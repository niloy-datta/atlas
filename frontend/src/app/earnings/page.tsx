"use client";

import { useState } from "react";
import Link from "next/link";

interface Transaction {
  id: string;
  date: string;
  role: string;
  client: string;
  amount: number;
  status: "Completed" | "Pending";
}

export default function EarningsPage() {
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(2500);
  const [payoutMethod, setPayoutMethod] = useState("bKash / Nagad");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isBdt = currency === "BDT";
  const currencySymbol = isBdt ? "৳" : "$";

  const totalEarnings = isBdt ? "15,450.00" : "1,280.50";
  const avgShift = isBdt ? "551.78" : "45.73";
  const pendingPayment = isBdt ? "2,650.00" : "220.00";
  const availableBalance = isBdt ? "3,850.00" : "320.50";
  const goalCurrent = isBdt ? "15,450" : "1,280";
  const goalTarget = isBdt ? "24,000" : "2,000";

  const monthlyBars = [
    { month: "Jan", height: "35%", val: isBdt ? "৳1,200" : "$100" },
    { month: "Feb", height: "55%", val: isBdt ? "৳1,950" : "$160" },
    { month: "Mar", height: "45%", val: isBdt ? "৳1,580" : "$130" },
    { month: "Apr", height: "65%", val: isBdt ? "৳2,300" : "$190" },
    { month: "May", height: "80%", val: isBdt ? "৳2,900" : "$240" },
    { month: "Jun", height: "70%", val: isBdt ? "৳2,400" : "$200" },
    { month: "Jul", height: "78%", val: isBdt ? "৳2,950" : "$245" },
    { month: "Aug", height: "88%", val: isBdt ? "৳3,450" : "$285" },
    { month: "Sep", height: "100%", val: isBdt ? "৳3,850" : "$320.50" },
  ];

  const transactions: Transaction[] = [
    {
      id: "tx-1",
      date: "14 Sep 2026",
      role: "Warehouse Assistant",
      client: "Dhanmondi Hub",
      amount: isBdt ? 1450 : 120,
      status: "Completed",
    },
    {
      id: "tx-2",
      date: "12 Sep 2026",
      role: "Event Cleaning",
      client: "Gulshan Convention",
      amount: isBdt ? 960 : 80,
      status: "Completed",
    },
    {
      id: "tx-3",
      date: "10 Sep 2026",
      role: "Restaurant Crew",
      client: "The Food Lounge",
      amount: isBdt ? 1150 : 95.5,
      status: "Completed",
    },
    {
      id: "tx-4",
      date: "08 Sep 2026",
      role: "Retail Support",
      client: "Bashundhara City",
      amount: isBdt ? 840 : 70,
      status: "Completed",
    },
    {
      id: "tx-5",
      date: "05 Sep 2026",
      role: "Warehouse Assistant",
      client: "Savar EPZ",
      amount: isBdt ? 1320 : 110,
      status: "Pending",
    },
  ];

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(false);
    showToast(`Withdrawal of ${currencySymbol}${withdrawAmount} via ${payoutMethod} initiated! Transfer arrives within 1 business day.`);
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
            <Link href="/messages" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5">
              <span>Messages</span>
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">3</span>
            </Link>
            <Link href="/earnings" className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 shadow-md shadow-blue-500/20 transition">
              Earnings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Toggle */}
          <div className="flex items-center bg-[#0E1626] border border-slate-800 rounded-full p-0.5 text-xs font-bold">
            <button
              onClick={() => setCurrency("BDT")}
              className={`px-2.5 py-1 rounded-full transition ${currency === "BDT" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              BDT (৳)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2.5 py-1 rounded-full transition ${currency === "USD" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              USD ($)
            </button>
          </div>

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

      {/* Main Workspace Layout: Sidebar + Dashboard */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        {/* Left Sidebar from 52c6fd7b-bcd3-4a7c-9e0d-e5531c07a23e.png */}
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
            <Link href="/messages" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span className="flex items-center gap-3">
                <span>💬</span> Messages
              </span>
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
            </Link>
            <Link href="/earnings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-blue-600/20 border border-blue-500/30 font-bold transition">
              <span>💰</span> Earnings
            </Link>
            <Link href="/workpass" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>📈</span> Career Growth
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition">
              <span>⚙️</span> Settings
            </Link>
          </nav>

          {/* Upgrade to Pro Card */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-b from-[#131E35] to-[#0A101D] border border-blue-500/20 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
              👑
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Upgrade to Pro</h4>
              <p className="text-[10px] text-slate-400 mt-1">Get priority access to high-paying shifts & instant payouts.</p>
            </div>
            <div className="space-y-1 text-[10px] text-slate-300 text-left">
              <div className="flex items-center gap-1.5">✓ Higher earning potential</div>
              <div className="flex items-center gap-1.5">✓ Priority shift access</div>
              <div className="flex items-center gap-1.5">✓ Instant bKash withdrawals</div>
            </div>
            <button
              onClick={() => showToast("WORVO Pro membership trial activated!")}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Upgrade Now →
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-7 space-y-6 overflow-x-hidden">
          {/* Hero Banner from 52c6fd7b-bcd3-4a7c-9e0d-e5531c07a23e.png */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0E172B] via-[#111C35] to-[#16122E] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Earn<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">ings</span>
              </h1>
              <p className="text-sm text-slate-300 font-medium mt-1">
                Your work. Your earnings. A brighter tomorrow.
              </p>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#090F1C]/80 border border-slate-800">
              <div className="text-2xl">✨</div>
              <div className="text-right">
                <div className="text-xs font-bold text-blue-300 italic">
                  &quot;Small steps every shift. Big dreams ahead.&quot;
                </div>
                <div className="text-[10px] text-slate-400">— WORVO Escrow Protected</div>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards from Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Earnings</span>
                <span className="p-2 rounded-xl bg-blue-900/30 text-blue-400 text-base">💰</span>
              </div>
              <div className="text-2xl font-black text-white">{currencySymbol}{totalEarnings}</div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>↗</span> +12% from last month
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Completed Shifts</span>
                <span className="p-2 rounded-xl bg-emerald-900/30 text-emerald-400 text-base">📅</span>
              </div>
              <div className="text-2xl font-black text-white">28</div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>↗</span> +4 this month
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Average per Shift</span>
                <span className="p-2 rounded-xl bg-amber-900/30 text-amber-400 text-base">📊</span>
              </div>
              <div className="text-2xl font-black text-white">{currencySymbol}{avgShift}</div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>↗</span> +8% from last month
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Pending Payment</span>
                <span className="p-2 rounded-xl bg-purple-900/30 text-purple-400 text-base">⏳</span>
              </div>
              <div className="text-2xl font-black text-purple-300">{currencySymbol}{pendingPayment}</div>
              <div className="text-[11px] text-slate-400">2 upcoming payouts in review</div>
            </div>
          </div>

          {/* Charts & Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Earnings Bar Chart (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Earnings Overview</h3>
                  <p className="text-[11px] text-slate-400">Track your income and growth over time.</p>
                </div>
                <select className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-2.5 py-1">
                  <option>Last 6 Months</option>
                  <option>This Year (2026)</option>
                  <option>All Time</option>
                </select>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-56 pt-6 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-800">
                {monthlyBars.map((b) => (
                  <div key={b.month} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {b.val}
                    </span>
                    <div className="w-full max-w-[32px] bg-gradient-to-t from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 rounded-t-lg transition-all shadow-md group-hover:shadow-blue-500/30" style={{ height: b.height }} />
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white transition-colors">
                      {b.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings by Job Type Donut (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4 shadow-lg">
              <div>
                <h3 className="text-sm font-bold text-white">Earnings by Job Type</h3>
                <p className="text-[11px] text-slate-400">Distribution across your verified roles.</p>
              </div>

              {/* Donut Simulation */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-36 h-36 rounded-full border-8 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-400">Top Role</div>
                    <div className="text-sm font-extrabold text-white">Warehouse</div>
                    <div className="text-[10px] text-blue-400 font-bold">32%</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { name: "Warehouse", pct: "32%", color: "bg-blue-500" },
                  { name: "Cleaning", pct: "24%", color: "bg-cyan-500" },
                  { name: "Hospitality", pct: "18%", color: "bg-emerald-500" },
                  { name: "Retail", pct: "14%", color: "bg-amber-500" },
                  { name: "Others", pct: "12%", color: "bg-slate-500" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span>{item.name}</span>
                    </span>
                    <span className="font-bold text-white">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Available Balance, Transactions & Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Available Balance & Withdraw (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121B32] via-[#0E1626] to-[#15112B] border border-blue-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Available Balance</span>
                  <span className="text-[11px] text-blue-400 hover:underline cursor-pointer">Payout Settings</span>
                </div>

                <div className="text-3xl font-black text-white">
                  {currencySymbol}{availableBalance}
                  <span className="text-xs font-normal text-slate-400 ml-1.5">{currency}</span>
                </div>

                <button
                  onClick={() => setIsWithdrawing(!isWithdrawing)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition"
                >
                  Withdraw Now →
                </button>

                {isWithdrawing && (
                  <form onSubmit={handleWithdrawSubmit} className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Amount</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Payment Method</label>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      >
                        <option>bKash / Nagad (Instant)</option>
                        <option>Bank Transfer (1-2 days)</option>
                        <option>PayPal</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                    >
                      Confirm Payout
                    </button>
                  </form>
                )}

                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <span>🏦</span>
                      <div>
                        <div className="font-semibold text-slate-200">Bank Transfer</div>
                        <div className="text-[10px] text-slate-500">1–2 business days</div>
                      </div>
                    </div>
                    <span className="text-slate-500">›</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <span>📱</span>
                      <div>
                        <div className="font-semibold text-slate-200">Mobile Wallet (bKash / Nagad)</div>
                        <div className="text-[10px] text-slate-500">Instant (no fees)</div>
                      </div>
                    </div>
                    <span className="text-slate-500">›</span>
                  </div>
                </div>
              </div>

              {/* Monthly Goal Card */}
              <div className="p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Earning Goals</span>
                  <span className="text-[11px] text-blue-400 hover:underline cursor-pointer">Edit Goal</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-500 flex items-center justify-center font-bold text-xs text-white">
                    64%
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {currencySymbol}{goalCurrent} / {currencySymbol}{goalTarget}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold">You&apos;re on track! 🚀</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Table (8 cols) */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-[#0E1626] border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                  <p className="text-[11px] text-slate-400">Automated escrow settlements for completed shifts.</p>
                </div>
                <span className="text-[11px] text-blue-400 font-bold hover:underline cursor-pointer">View All →</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="pb-2.5 font-semibold">Date</th>
                      <th className="pb-2.5 font-semibold">Job / Shift</th>
                      <th className="pb-2.5 font-semibold">Client Hub</th>
                      <th className="pb-2.5 font-semibold">Earnings</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 text-slate-400">{tx.date}</td>
                        <td className="py-3 font-semibold text-white">{tx.role}</td>
                        <td className="py-3 text-slate-400">{tx.client}</td>
                        <td className="py-3 font-bold text-white">{currencySymbol}{tx.amount}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === "Completed"
                              ? "bg-emerald-950 border border-emerald-500/30 text-emerald-300"
                              : "bg-amber-950 border border-amber-500/30 text-amber-300"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
