"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PortalHeader, Footer } from "../../../components/Chrome";
import { PortalNav } from "../../../components/PortalNav";
import { supabase } from "../../../lib/supabase";
import { useGuard } from "../../../lib/useGuard";
import { LESSONS, fdate } from "../../../lib/lessons";
import { ukToUtc, fmtUK, timeUK } from "../../../lib/time";

const today = () => new Date().toISOString().slice(0, 10);
const nm = (p) => (p ? p.full_name || p.email : "Student");

export default function Classes() {
  const ok = useGuard("client");
  const [d, setD] = useState({ teachers: [], classes: [], enr: [], sessions: [], att: [], profiles: [] });
  const [sel, setSel] = useState(null);
  const [nc, setNc] = useState({ name: "", kind: "group", teacher: "" });
  const [stu, setStu] = useState("");
  const [sf, setSf] = useState({ date: today(), time: "18:00", lesson: "", repeat: true });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const q = (t) => supabase.from(t).select("*");
    const [teachers, classes, enr, sessions, att, profiles] = await Promise.all([q("teachers"), q("classes"), q("enrolments"), q("sessions"), q("attendance"), q("profiles")]);
    setD({ teachers: teachers.data || [], classes: classes.data || [], enr: enr.data || [], sessions: sessions.data || [], att: att.data || [], profiles: profiles.data || [] });
  }, []);
  useEffect(() => { if (ok) load(); }, [ok, load]);

  const run = async (p, done) => { const { error } = await p; setMsg(error ? error.message : done || ""); load(); };
  const prof = (id) => d.profiles.find((x) => x.id === id);

  const schedule = (e) => {
    e.preventDefault();
    const rows = [], start = sf.lesson ? LESSONS.findIndex((l) => l.key === sf.lesson) : -1;
    for (let i = 0; i < (sf.repeat ? 28 : 1); i++) {
      const dt = new Date(sf.date + "T12:00:00Z"); dt.setUTCDate(dt.getUTCDate() + i);
      const wd = dt.getUTCDay();
      if (sf.repeat && (wd === 0 || wd === 6)) continue;
      const l = start >= 0 ? LESSONS[(start + rows.length) % LESSONS.length] : null;
      rows.push({ class_id: sel, starts_at: ukToUtc(dt.toISOString().slice(0, 10), sf.time), lesson_key: l ? l.key : null, lesson_title: l ? l.title : null });
    }
    run(supabase.from("sessions").insert(rows), `${rows.length} session${rows.length > 1 ? "s" : ""} scheduled.`);
  };

  if (ok === null) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);
  if (ok === false) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><h1 className="h2">Client access only</h1><Link className="btn" href="/">Back to the site</Link></div></section><Footer /></>);

  const c = sel && d.classes.find((x) => x.id === sel);
  const now = Date.now();

  if (c) {
    const members = d.enr.filter((e) => e.class_id === sel);
    const sess = d.sessions.filter((s) => s.class_id === sel).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
    const free = d.profiles.filter((p) => !members.some((m) => m.student_id === p.id));
    return (
      <>
        <PortalHeader kind="client" />
        <section className="sec"><div className="wrap">
          <PortalNav />
          <button className="btn ghost" onClick={() => { setSel(null); setMsg(""); }}>All classes</button>
          <h1 className="h2" style={{ marginTop: 18 }}>{c.name}</h1>
          <p className="verdict">{c.kind === "group" ? "Group" : "1-to-1"} class, taught by {c.teacher_email}</p>
          {msg && <p className="verdict" role="status">{msg}</p>}

          <h3 className="sub">Students ({members.length})</h3>
          {members.map((m) => (
            <div key={m.student_id} className="rev ok">
              <p style={{ fontWeight: 600 }}>{nm(prof(m.student_id))}</p>
              <p className="why">Joined {fdate(m.joined_on)}</p>
              <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => run(supabase.from("enrolments").delete().eq("class_id", sel).eq("student_id", m.student_id), "Student removed from class.")}>Remove</button>
            </div>
          ))}
          <div className="card">
            <label>Add a student
              <select value={stu} onChange={(e) => setStu(e.target.value)}>
                <option value="">Choose a student</option>
                {free.map((p) => <option key={p.id} value={p.id}>{nm(p)}</option>)}
              </select>
            </label>
            <button className="btn" disabled={!stu} onClick={() => { run(supabase.from("enrolments").insert({ class_id: sel, student_id: stu }), "Student added."); setStu(""); }}>Add to class</button>
          </div>

          <h3 className="sub">Schedule sessions</h3>
          <form className="card" onSubmit={schedule}>
            <label>Date<input type="date" required value={sf.date} onChange={(e) => setSf({ ...sf, date: e.target.value })} /></label>
            <label>Start time (UK time)<input type="time" required value={sf.time} onChange={(e) => setSf({ ...sf, time: e.target.value })} /></label>
            <label>Starting lesson (optional)
              <select value={sf.lesson} onChange={(e) => setSf({ ...sf, lesson: e.target.value })}>
                <option value="">Teacher chooses</option>
                {LESSONS.map((l, i) => <option key={l.key} value={l.key}>{i + 1}. {l.title}</option>)}
              </select>
            </label>
            <label className="tick"><input type="checkbox" checked={sf.repeat} onChange={(e) => setSf({ ...sf, repeat: e.target.checked })} />Repeat every weekday for 4 weeks (lessons rotate in order)</label>
            <button className="btn" style={{ marginTop: 12 }}>Schedule</button>
          </form>

          <h3 className="sub">Sessions</h3>
          {sess.length === 0 && <p>No sessions scheduled yet.</p>}
          {sess.map((s) => {
            const here = d.att.filter((a) => a.session_id === s.id);
            const missed = !s.checked_in_at && new Date(s.starts_at) < now;
            return (
              <div key={s.id} className={`rev ${s.checked_in_at ? "ok" : missed ? "bad" : ""}`}>
                <p style={{ fontWeight: 600 }}>{fmtUK(s.starts_at)}{s.lesson_title ? ", " + s.lesson_title : ""}</p>
                <p className="why">{s.checked_in_at ? `Checked in ${timeUK(s.checked_in_at)}${s.checked_out_at ? ", out " + timeUK(s.checked_out_at) : ""}` : missed ? "Missed: no check-in" : "Scheduled"}</p>
                {here.map((a) => (
                  <p key={a.student_id} style={{ margin: "2px 0" }}>Present: {nm(prof(a.student_id))}{" "}
                    <button className="tab" style={{ minHeight: 30, padding: "2px 10px" }} onClick={() => run(supabase.from("attendance").delete().eq("session_id", s.id).eq("student_id", a.student_id), "Attendance removed.")}>Remove</button>
                  </p>
                ))}
                {s.note && <p className="why">Note: {s.note}</p>}
                <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => window.confirm("Delete this session?") && run(supabase.from("sessions").delete().eq("id", s.id), "Session deleted.")}>Delete session</button>
              </div>
            );
          })}
          <button className="btn ghost" style={{ marginTop: 24 }} onClick={() => window.confirm("Delete this whole class?") && (run(supabase.from("classes").delete().eq("id", sel), "Class deleted."), setSel(null))}>Delete this class</button>
        </div></section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <PortalHeader kind="client" />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(supabase.from("classes").insert({ name: nc.name, kind: nc.kind, teacher_email: nc.teacher }), "Class created."); setNc({ ...nc, name: "" }); }}>
          <h3>Create a class</h3>
          <label>Name (for example Evening group)<input required value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} /></label>
          <label>Type
            <select value={nc.kind} onChange={(e) => setNc({ ...nc, kind: e.target.value })}><option value="group">Group</option><option value="one_to_one">1-to-1</option></select>
          </label>
          <label>Teacher
            <select required value={nc.teacher} onChange={(e) => setNc({ ...nc, teacher: e.target.value })}>
              <option value="">Choose a teacher</option>
              {d.teachers.map((t) => <option key={t.email} value={t.email}>{t.name}</option>)}
            </select>
          </label>
          {msg && <p className="verdict" role="status">{msg}</p>}
          <button className="btn">Create class</button>
        </form>
        <h3 className="sub">Classes</h3>
        {d.classes.length === 0 && <p>No classes yet. Add a teacher first, then create a class.</p>}
        {d.classes.map((x) => (
          <div key={x.id} className="rev ok">
            <p style={{ fontWeight: 600 }}>{x.name} ({x.kind === "group" ? "Group" : "1-to-1"})</p>
            <p className="why">{x.teacher_email}, {d.enr.filter((e) => e.class_id === x.id).length} students, {d.sessions.filter((s) => s.class_id === x.id && new Date(s.starts_at) >= now).length} upcoming sessions</p>
            <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => { setSel(x.id); setMsg(""); window.scrollTo({ top: 0 }); }}>Open class</button>
          </div>
        ))}
      </div></section>
      <Footer />
    </>
  );
}
