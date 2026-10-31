"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PortalHeader, Footer } from "../../../components/Chrome";
import { PortalNav } from "../../../components/PortalNav";
import { supabase } from "../../../lib/supabase";
import { useGuard } from "../../../lib/useGuard";
import { fmtUK } from "../../../lib/time";

export default function Teachers() {
  const ok = useGuard("client");
  const [d, setD] = useState({ teachers: [], classes: [], sessions: [] });
  const [f, setF] = useState({ name: "", email: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [t, c, s] = await Promise.all([supabase.from("teachers").select("*").order("name"), supabase.from("classes").select("*"), supabase.from("sessions").select("*")]);
    setD({ teachers: t.data || [], classes: c.data || [], sessions: s.data || [] });
  }, []);
  useEffect(() => { if (ok) load(); }, [ok, load]);

  const add = async (e) => {
    e.preventDefault(); setMsg("");
    const { error } = await supabase.from("teachers").insert({ name: f.name, email: f.email.trim().toLowerCase() });
    if (error) setMsg(error.message); else { setMsg("Teacher added. They can now create an account at the Teacher login."); setF({ name: "", email: "" }); load(); }
  };
  const del = async (t) => {
    if (!window.confirm(`Remove ${t.name}?`)) return;
    const { error } = await supabase.from("teachers").delete().eq("email", t.email);
    setMsg(error ? "This teacher still has classes. Reassign or delete those classes first." : "Teacher removed."); load();
  };

  if (ok === null) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);
  if (ok === false) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><h1 className="h2">Client access only</h1><Link className="btn" href="/">Back to the site</Link></div></section><Footer /></>);

  const now = Date.now();
  return (
    <>
      <PortalHeader kind="client" />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <form className="card" onSubmit={add}>
          <h3>Add a teacher</h3>
          <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Email they will sign in with<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          {msg && <p className="verdict" role="status">{msg}</p>}
          <button className="btn">Add teacher</button>
        </form>
        <h3 className="sub">Teachers</h3>
        {d.teachers.length === 0 && <p>No teachers yet.</p>}
        {d.teachers.map((t) => {
          const cl = d.classes.filter((c) => c.teacher_email === t.email).map((c) => c.id);
          const ss = d.sessions.filter((s) => cl.includes(s.class_id));
          const done = ss.filter((s) => s.checked_in_at), missed = ss.filter((s) => !s.checked_in_at && new Date(s.starts_at) < now);
          const last = done.map((s) => s.checked_in_at).sort().pop();
          return (
            <div key={t.email} className={`rev ${missed.length ? "bad" : "ok"}`}>
              <p style={{ fontWeight: 600 }}>{t.name} ({t.email})</p>
              <p>{cl.length} classes, {done.length} sessions taught, last check-in {last ? fmtUK(last) : "none yet"}</p>
              {missed.length > 0 && <p className="why">{missed.length} past session{missed.length > 1 ? "s" : ""} with no check-in</p>}
              <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => del(t)}>Remove</button>
            </div>
          );
        })}
      </div></section>
      <Footer />
    </>
  );
}
