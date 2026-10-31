"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "../../../components/Chrome";
import { PortalNav } from "../../../components/PortalNav";
import { supabase } from "../../../lib/supabase";
import { LESSONS, pct, currentLesson, fdate, topicTotals } from "../../../lib/lessons";

const today = () => new Date().toISOString().slice(0, 10);

export default function Students() {
  const router = useRouter();
  const [ok, setOk] = useState(null);
  const [d, setD] = useState({ profiles: [], results: [], logs: [], prog: [] });
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ date: today(), lesson: "", note: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [p, r, c, l] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("results").select("*"),
      supabase.from("class_logs").select("*").order("taken_on", { ascending: false }),
      supabase.from("lesson_progress").select("*"),
    ]);
    setD({ profiles: p.data || [], results: r.data || [], logs: c.data || [], prog: l.data || [] });
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      const a = await supabase.from("admins").select("email").maybeSingle();
      if (a.data) { setOk(true); load(); } else setOk(false);
    })();
  }, [router, load]);

  const nm = (p) => p.full_name || p.email;
  const stat = (id) => {
    const rs = d.results.filter((r) => r.user_id === id);
    return { rs, lg: d.logs.filter((x) => x.student_id === id), done: new Set(d.prog.filter((x) => x.student_id === id).map((x) => x.lesson)), best: rs.length ? Math.max(...rs.map(pct)) : 0 };
  };

  const toggle = async (id, key, on) => {
    if (on) await supabase.from("lesson_progress").delete().eq("student_id", id).eq("lesson", key);
    else await supabase.from("lesson_progress").insert({ student_id: id, lesson: key });
    load();
  };
  const addClass = async (e) => {
    e.preventDefault(); setMsg("");
    const { error } = await supabase.from("class_logs").insert({ student_id: sel, taken_on: form.date, lesson: form.lesson || null, note: form.note || null });
    if (error) setMsg(error.message); else { setMsg("Class logged."); setForm({ ...form, note: "" }); load(); }
  };
  const delClass = async (c) => {
    if (!window.confirm("Delete this class entry?")) return;
    await supabase.from("class_logs").delete().eq("id", c.id); load();
  };

  if (ok === null) return (<><Header /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);
  if (!ok) return (<><Header /><section className="sec"><div className="wrap"><h1 className="h2">Admins only</h1><Link className="btn" href="/">Back to the site</Link></div></section><Footer /></>);

  const p = sel && d.profiles.find((x) => x.id === sel);

  if (p) {
    const s = stat(sel), cur = currentLesson(s.done), topics = topicTotals(s.rs);
    return (
      <>
        <Header />
        <section className="sec"><div className="wrap">
          <PortalNav />
          <button className="btn ghost" onClick={() => { setSel(null); setMsg(""); }}>All students</button>
          <h1 className="h2" style={{ marginTop: 18 }}>{nm(p)}</h1>
          <div className="card">
            <p style={{ marginTop: 0 }}>{p.email}, joined {fdate(p.created_at)}</p>
            <p className="verdict">{s.rs.length} tests taken, best {s.best}%, {s.rs.filter((r) => r.passed).length} passed. {s.lg.length} classes taken, {s.done.size} of {LESSONS.length} lessons done.</p>
            <div className="meter"><i style={{ width: Math.round((s.done.size / LESSONS.length) * 100) + "%" }} /></div>
            <p style={{ marginBottom: 0 }}>{cur < 0 ? "All lessons complete." : `Current lesson ${cur + 1}: ${LESSONS[cur].title}`}</p>
          </div>

          <h3 className="sub">Lessons (tick when done)</h3>
          {LESSONS.map((l, i) => (
            <label key={l.key} className="tick">
              <input type="checkbox" checked={s.done.has(l.key)} onChange={() => toggle(sel, l.key, s.done.has(l.key))} />
              {i + 1}. {l.title}
            </label>
          ))}

          <h3 className="sub">Log a class</h3>
          <form className="card" onSubmit={addClass}>
            <label>Date<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label>Lesson
              <select value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })}>
                <option value="">Other / general</option>
                {LESSONS.map((l) => <option key={l.key} value={l.title}>{l.title}</option>)}
              </select>
            </label>
            <label>Instructor note (optional)<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            {msg && <p className="verdict" role="status">{msg}</p>}
            <button className="btn">Log class</button>
          </form>

          <h3 className="sub">Classes taken</h3>
          {s.lg.length === 0 && <p>No classes logged yet.</p>}
          {s.lg.map((c) => (
            <div key={c.id} className="rev ok">
              <p style={{ fontWeight: 600 }}>{fdate(c.taken_on)}, {c.lesson || "Class"}</p>
              {c.note && <p className="why">{c.note}</p>}
              <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => delClass(c)}>Delete</button>
            </div>
          ))}

          <h3 className="sub">Strengths by topic</h3>
          {topics.length === 0 && <p>No topic scores yet.</p>}
          {topics.map((t) => (
            <div key={t.name}>
              <p style={{ margin: "10px 0 4px" }}>{t.name}: {t.pct}% ({t.right} of {t.total})</p>
              <div className="meter"><i style={{ width: t.pct + "%" }} /></div>
            </div>
          ))}

          <h3 className="sub">Test history</h3>
          {s.rs.length === 0 && <p>No tests yet.</p>}
          {[...s.rs].sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1)).map((r) => (
            <div key={r.id} className={`rev ${r.passed ? "ok" : "bad"}`}>
              <p style={{ fontWeight: 600 }}>{r.score} out of {r.total}, {r.passed ? "Pass" : "Not yet"}</p>
              <p className="why">{fdate(r.taken_at)}</p>
            </div>
          ))}
        </div></section>
        <Footer />
      </>
    );
  }

  const list = d.profiles.filter((x) => nm(x).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <h1 className="h2" style={{ marginTop: 18 }}>Students</h1>
        <label>Search by name or email<input value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <p className="verdict">{d.profiles.length} students</p>
        {list.map((x) => {
          const s = stat(x.id);
          return (
            <div key={x.id} className="rev ok">
              <p style={{ fontWeight: 600 }}>{nm(x)}</p>
              <p className="why">{s.rs.length} tests, best {s.best}%, {s.lg.length} classes, {s.done.size} of {LESSONS.length} lessons done</p>
              <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => { setSel(x.id); window.scrollTo({ top: 0 }); }}>Open file</button>
            </div>
          );
        })}
      </div></section>
      <Footer />
    </>
  );
}
