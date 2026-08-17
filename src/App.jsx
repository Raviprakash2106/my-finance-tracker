import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const CATS = {
  expense: ["Food", "Transport", "Housing", "Utilities", "Entertainment", "Health", "Shopping", "Other"],
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
};

const CAT_COLORS = {
  Food: "#B3452F", Transport: "#8A6D3B", Housing: "#223A5E", Utilities: "#5B7C99",
  Entertainment: "#B8933D", Health: "#6E8B5A", Shopping: "#8B5A6E", Other: "#7A7568",
  Salary: "#1F7A5C", Freelance: "#3E8E7E", Investment: "#2E6B4F", Gift: "#4E9A79",
};

const STORAGE_KEY = "finance-tracker:transactions";

const uid = () => Math.random().toString(36).slice(2, 10);

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

const monthKey = (dateStr) => dateStr.slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const seed = () => {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const day = (offset) => { const d = new Date(today); d.setDate(d.getDate() - offset); return iso(d); };
  return [
    { id: uid(), date: day(2), description: "Monthly salary", category: "Salary", type: "income", amount: 65000 },
    { id: uid(), date: day(4), description: "Rent", category: "Housing", type: "expense", amount: 18000 },
    { id: uid(), date: day(6), description: "Groceries", category: "Food", type: "expense", amount: 3200 },
    { id: uid(), date: day(9), description: "Metro pass", category: "Transport", type: "expense", amount: 1200 },
    { id: uid(), date: day(11), description: "Freelance design", category: "Freelance", type: "income", amount: 12000 },
    { id: uid(), date: day(14), description: "Electric bill", category: "Utilities", type: "expense", amount: 1850 },
    { id: uid(), date: day(18), description: "Dinner out", category: "Entertainment", type: "expense", amount: 1400 },
    { id: uid(), date: day(22), description: "Dividend payout", category: "Investment", type: "income", amount: 2200 },
    { id: uid(), date: day(26), description: "Pharmacy", category: "Health", type: "expense", amount: 640 },
  ];
};

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATS.expense[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saveState, setSaveState] = useState("idle");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTransactions(JSON.parse(raw));
      } else {
        setTransactions(seed());
      }
    } catch {
      setTransactions(seed());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [transactions, loaded]);

  const addTransaction = useCallback(() => {
    const amt = parseFloat(amount);
    if (!description.trim()) {
      setFormError("Add a description for this entry.");
      return;
    }
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      setFormError("Enter an amount greater than 0.");
      return;
    }
    if (!date) {
      setFormError("Pick a date.");
      return;
    }
    setFormError("");
    setTransactions((prev) => [
      { id: uid(), date, description: description.trim(), category, type, amount: amt },
      ...prev,
    ]);
    setDescription("");
    setAmount("");
    setFormOpen(false);
  }, [amount, description, date, category, type]);

  const removeTransaction = useCallback((id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount; else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const filtered = useMemo(() => {
    const list = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, filter]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      const k = monthKey(t.date);
      if (!map[k]) map[k] = { key: k, income: 0, expense: 0 };
      map[k][t.type] += t.amount;
    }
    return Object.values(map).sort((a, b) => (a.key > b.key ? 1 : -1)).slice(-6);
  }, [transactions]);

  return (
    <div className="ft-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .ft-root {
          --paper: #F3F3EF;
          --paper-line: #DAD8CE;
          --ink: #1C2321;
          --ink-soft: #57584F;
          --navy: #223A5E;
          --emerald: #1F7A5C;
          --rust: #B3452F;
          --gold: #B8933D;
          font-family: 'Inter', sans-serif;
          background: var(--paper);
          background-image:
            linear-gradient(var(--paper-line) 1px, transparent 1px);
          background-size: 100% 2.6em;
          color: var(--ink);
          min-height: 100%;
          padding: 2.5rem 1.5rem 4rem;
        }
        .ft-serif { font-family: 'Fraunces', serif; }
        .ft-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .ft-container { max-width: 980px; margin: 0 auto; }

        .ft-stamp {
          border: 2px solid var(--navy);
          border-radius: 999px;
          transform: rotate(-4deg);
          padding: 0.7rem 1.3rem;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
        }

        .ft-card {
          background: #FBFAF7;
          border: 1px solid var(--paper-line);
          box-shadow: 0 1px 0 rgba(28,35,33,0.04);
        }

        .ft-row {
          border-bottom: 1px solid var(--paper-line);
        }
        .ft-row:last-child { border-bottom: none; }

        .ft-btn-primary {
          background: var(--ink);
          color: var(--paper);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .ft-btn-primary:hover { background: var(--navy); transform: translateY(-1px); }

        .ft-btn-ghost {
          border: 1px solid var(--paper-line);
          background: transparent;
          color: var(--ink);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .ft-btn-ghost:hover { border-color: var(--ink); background: #EDECE5; }

        .ft-tab {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          border: 1px solid transparent;
          color: var(--ink-soft);
          transition: all 0.15s ease;
        }
        .ft-tab[data-active="true"] {
          background: var(--ink);
          color: var(--paper);
        }
        .ft-tab[data-active="false"]:hover {
          border-color: var(--ink-soft);
        }

        .ft-input {
          background: #FFFFFF;
          border: 1px solid var(--paper-line);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
        }
        .ft-input:focus {
          outline: 2px solid var(--navy);
          outline-offset: 1px;
        }

        .ft-delete {
          opacity: 0;
          transition: opacity 0.15s ease, color 0.15s ease;
          color: var(--ink-soft);
        }
        .ft-row:hover .ft-delete { opacity: 1; }
        .ft-delete:hover { color: var(--rust); }
        .ft-delete:focus-visible { opacity: 1; outline: 2px solid var(--navy); }

        @media (prefers-reduced-motion: reduce) {
          .ft-btn-primary, .ft-btn-ghost, .ft-tab, .ft-delete { transition: none; }
        }

        .ft-focus:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }
      `}</style>

      <div className="ft-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <p className="ft-mono text-xs tracking-widest uppercase mb-2" style={{ color: "var(--ink-soft)" }}>
              Personal Ledger
            </p>
            <h1 className="ft-serif text-4xl sm:text-5xl font-semibold" style={{ color: "var(--ink)" }}>
              Where the money went
            </h1>
          </div>
          <div className="ft-stamp" style={{ color: totals.balance >= 0 ? "var(--emerald)" : "var(--rust)" }}>
            <span className="ft-mono text-[0.65rem] uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>
              Balance
            </span>
            <span className="ft-mono text-xl font-semibold">{fmt(totals.balance)}</span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="ft-card p-5">
            <p className="ft-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--ink-soft)" }}>Income</p>
            <p className="ft-mono text-2xl font-semibold" style={{ color: "var(--emerald)" }}>{fmt(totals.income)}</p>
          </div>
          <div className="ft-card p-5">
            <p className="ft-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--ink-soft)" }}>Expenses</p>
            <p className="ft-mono text-2xl font-semibold" style={{ color: "var(--rust)" }}>{fmt(totals.expense)}</p>
          </div>
          <div className="ft-card p-5">
            <p className="ft-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--ink-soft)" }}>Net balance</p>
            <p className="ft-mono text-2xl font-semibold" style={{ color: totals.balance >= 0 ? "var(--navy)" : "var(--rust)" }}>
              {fmt(totals.balance)}
            </p>
          </div>
        </div>

        {/* Charts */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-10">
            <div className="ft-card p-5 lg:col-span-2">
              <p className="ft-serif text-lg font-semibold mb-3">Spending by category</p>
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No expenses logged yet.</p>
              ) : (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {categoryBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#7A7568"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, borderRadius: 4 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {categoryBreakdown.slice(0, 6).map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: CAT_COLORS[c.name] || "#7A7568" }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="ft-card p-5 lg:col-span-3">
              <p className="ft-serif text-lg font-semibold mb-3">Income vs. expenses, last months</p>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyTrend.map((m) => ({ ...m, label: monthLabel(m.key) }))}>
                    <CartesianGrid stroke="#DAD8CE" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#57584F" }} axisLine={{ stroke: "#DAD8CE" }} tickLine={false} />
                    <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#57584F" }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, borderRadius: 4 }} />
                    <Bar dataKey="income" fill="#1F7A5C" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expense" fill="#B3452F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2">
            {["all", "income", "expense"].map((f) => (
              <button
                key={f}
                type="button"
                className="ft-tab ft-focus"
                data-active={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ft-btn-primary ft-focus rounded px-4 py-2 text-sm font-medium"
            onClick={() => { setFormOpen((v) => !v); setFormError(""); }}
          >
            {formOpen ? "Cancel" : "Add entry"}
          </button>
        </div>

        {/* Add form */}
        {formOpen && (
          <div className="ft-card p-5 mb-6 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="ft-mono text-xs uppercase" style={{ color: "var(--ink-soft)" }}>Description</label>
              <input
                className="ft-input ft-focus rounded px-3 py-2 text-sm"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setFormError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") addTransaction(); }}
                placeholder="Coffee with Sam"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="ft-mono text-xs uppercase" style={{ color: "var(--ink-soft)" }}>Type</label>
              <select
                className="ft-input ft-focus rounded px-3 py-2 text-sm"
                value={type}
                onChange={(e) => { setType(e.target.value); setCategory(CATS[e.target.value][0]); }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="ft-mono text-xs uppercase" style={{ color: "var(--ink-soft)" }}>Category</label>
              <select
                className="ft-input ft-focus rounded px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATS[type].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="ft-mono text-xs uppercase" style={{ color: "var(--ink-soft)" }}>Amount</label>
              <input
                type="number" min="0.01" step="0.01"
                className="ft-input ft-focus rounded px-3 py-2 text-sm ft-mono"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setFormError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") addTransaction(); }}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="ft-mono text-xs uppercase" style={{ color: "var(--ink-soft)" }}>Date</label>
              <input
                type="date"
                className="ft-input ft-focus rounded px-3 py-2 text-sm ft-mono"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-6 flex items-center justify-between gap-3">
              {formError ? (
                <p className="ft-mono text-xs" style={{ color: "var(--rust)" }}>{formError}</p>
              ) : <span />}
              <button type="button" onClick={addTransaction} className="ft-btn-primary ft-focus rounded px-4 py-2 text-sm font-medium">
                Save entry
              </button>
            </div>
          </div>
        )}

        {/* Ledger */}
        <div className="ft-card">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <p className="ft-serif text-lg font-semibold">Entries</p>
            <p className="ft-mono text-[0.65rem]" style={{ color: "var(--ink-soft)" }}>
              {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : saveState === "error" ? "save failed" : ""}
            </p>
          </div>
          {filtered.length === 0 ? (
            <p className="px-5 pb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
              Nothing here yet. Add an entry to start the ledger.
            </p>
          ) : (
            <div>
              {filtered.map((t) => (
                <div key={t.id} className="ft-row flex items-center gap-4 px-5 py-3">
                  <span className="ft-mono text-xs w-20 shrink-0" style={{ color: "var(--ink-soft)" }}>
                    {t.date.slice(5)}
                  </span>
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: CAT_COLORS[t.category] || "#7A7568" }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm truncate">{t.description}</span>
                    <span className="ft-mono text-[0.68rem]" style={{ color: "var(--ink-soft)" }}>{t.category}</span>
                  </span>
                  <span
                    className="ft-mono text-sm font-medium shrink-0"
                    style={{ color: t.type === "income" ? "var(--emerald)" : "var(--rust)" }}
                  >
                    {t.type === "income" ? "+" : "–"}{fmt(t.amount)}
                  </span>
                  <button
                    type="button"
                    className="ft-delete ft-focus text-xs shrink-0 px-1"
                    onClick={() => removeTransaction(t.id)}
                    aria-label={`Delete ${t.description}`}
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="ft-mono text-[0.65rem] text-center mt-8" style={{ color: "var(--ink-soft)" }}>
          Saved locally in your browser.
        </p>
      </div>
    </div>
  );
}
