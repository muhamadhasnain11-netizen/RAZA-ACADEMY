"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PortalHeader, Footer } from "../../../components/Chrome";
import { PortalNav } from "../../../components/PortalNav";
import { supabase } from "../../../lib/supabase";
import { useGuard } from "../../../lib/useGuard";
import { fdate } from "../../../lib/lessons";

const GBP = (n) => "£" + Number(n).toFixed(2);
const PRESETS = { group: ["Group course", 75], one: ["1-to-1 course", 300], other: ["Other", ""] };
const today = () => new Date().toISOString().slice(0, 10);

export default function Income() {
  const ok = useGuard("client");
  const [d, setD] = useState({ payments: [], profiles: [] });
  const [f, setF] = useState({ student: "", course: "group", amount: 75, status: "paid", label: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [p, pr] = await Promise.all([supabase.from("payments").select("*").order("created_at", { ascending: false }), supabase.from("profiles").select("id, full_name, email")]);
    setD({ payments: p.data || [], profiles: pr.data || [] });
  }, []);
  useEffect(() => { if (ok) load(); }, [ok, load]);

  const run = async (p, done) => { const { error } = await p; setMsg(error ? error.message : done || ""); load(); };
  const add = (e) => {
    e.preventDefault();
    run(supabase.from("payments").insert({ student_id: f.student || null, label: f.label || PRESETS[f.course][0], amount: Number(f.amount), status: f.status, paid_on: f.status === "paid" ? today() : null }), "Payment recorded.");
    setF({ ...f, label: "" });
  };

  if (ok === null) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);
  if (ok === false) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><h1 className="h2">Client access only</h1><Link className="btn" href="/">Back to the site</Link></div></section><Footer /></>);

  const month = today().slice(0, 7);
  const sum = (arr) => arr.reduce((t, p) => t + Number(p.amount), 0);
  const paid = d.payments.filter((p) => p.status === "paid");
  const stats = [[GBP(sum(paid.filter((p) => (p.paid_on || "").startsWith(month)))), "Paid this month"], [GBP(sum(d.payments.filter((p) => p.status === "owed"))), "Still owed"], [GBP(sum(paid)), "Paid in total"]];
  const nm = (id) => { const p = d.profiles.find((x) => x.id === id); return p ? p.full_name || p.email : ""; };

  return (
    <>
      <PortalHeader kind="client" />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <div className="stats">{stats.map(([n, l]) => <div key={l} className="stat"><b>{n}</b>{l}</div>)}</div>
        <p className="why" style={{ marginTop: 10 }}>This records payments for your own tracking. It does not take payments.</p>
        <form className="card" onSubmit={add} style={{ marginTop: 14 }}>
          <h3>Record a payment</h3>
          <label>Student (optional)
            <select value={f.student} onChange={(e) => setF({ ...f, student: e.target.value })}>
              <option value="">Not linked to an account</option>
              {d.profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
            </select>
          </label>
          <label>Course
            <select value={f.course} onChange={(e) => setF({ ...f, course: e.target.value, amount: PRESETS[e.target.value][1] })}>
              {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
            </select>
          </label>
          <label>Amount in pounds<input type="number" min="0" step="0.01" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
          <label>Note or name (optional)<input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></label>
          <label>Status
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="paid">Paid</option><option value="owed">Owes</option></select>
          </label>
          {msg && <p className="verdict" role="status">{msg}</p>}
          <button className="btn">Save</button>
        </form>
        <h3 className="sub">Payments</h3>
        {d.payments.length === 0 && <p>No payments recorded yet.</p>}
        {d.payments.map((p) => (
          <div key={p.id} className={`rev ${p.status === "paid" ? "ok" : "bad"}`}>
            <p style={{ fontWeight: 600 }}>{GBP(p.amount)}, {p.label}{p.student_id ? " (" + nm(p.student_id) + ")" : ""}</p>
            <p className="why">{p.status === "paid" ? "Paid " + (p.paid_on ? fdate(p.paid_on) : "") : "Owes"}</p>
            <div className="row" style={{ marginTop: 6 }}>
              {p.status !== "paid" && <button className="btn ghost" onClick={() => run(supabase.from("payments").update({ status: "paid", paid_on: today() }).eq("id", p.id), "Marked as paid.")}>Mark paid</button>}
              <button className="btn ghost" onClick={() => window.confirm("Delete this record?") && run(supabase.from("payments").delete().eq("id", p.id), "Deleted.")}>Delete</button>
            </div>
          </div>
        ))}
      </div></section>
      <Footer />
    </>
  );
}
