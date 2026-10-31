"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Users, History, LogOut } from "lucide-react";
import { PortalHeader, Footer } from "../../components/Chrome";
import { supabase } from "../../lib/supabase";
import { useGuard } from "../../lib/useGuard";
import { LESSONS, pct, fdate, topicTotals } from "../../lib/lessons";
import { fmtUK, timeUK, dayUK } from "../../lib/time";

const TABS = [["today", "Today", ClipboardCheck], ["students", "My students", Users], ["history", "History", History]];
const nm = (p) => (p ? p.full_name || p.email : "Student");

export default function TeacherPortal() {
  const router = useRouter();
  const t = useGuard("teacher");
  const [tab, setTab] = useState("today");
  const [d, setD] = useState(null);
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    const q = (n) => supabase.from(n).select("*");
    const [classes, enr, sessions, att, profiles, results, logs, prog] = await Promise.all([q("classes"), q("enrolments"), q("sessions"), q("attendance"), q("profiles"), q("results"), q("class_logs"), q("lesson_progress")]);
    setD({ classes: classes.data || [], enr: enr.data || [], sessions: sessions.data || [], att: att.data || [], profiles: profiles.data || [], results: results.data || [], logs: logs.data || [], prog: prog.data || [] });
  }, []);
  useEffect(() => { if (t) load(); }, [t, load]);

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };
  if (t === null || (t && !d)) return (<><PortalHeader kind="teacher" /><section className="sec"><div className="wrap"><p>Loading your portal...</p></div></section></>);
  if (t === false) return (<><PortalHeader kind="teacher" /><section className="sec"><div className="wrap"><h1 className="h2">Teachers only</h1><Link className="btn" href="/">Back to the site</Link></div></section><Footer /></>);

  const cls = (id) => d.classes.find((c) => c.id === id);
  const prof = (id) => d.profiles.find((p) => p.id === id);
  const todayStr = dayUK(new Date());
  const todays = d.sessions.filter((s) => dayUK(s.starts_at) === todayStr || (s.checked_in_at && !s.checked_out_at)).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));

  const suggest = (s) => {
    if (s.lesson_key) return s.lesson_key;
    const last = d.sessions.filter((x) => x.class_id === s.class_id && x.checked_in_at && x.lesson_key).sort((a, b) => (a.starts_at < b.starts_at ? 1 : -1))[0];
    const i = last ? LESSONS.findIndex((l) => l.key === last.lesson_key) : -1;
    return LESSONS[(i + 1) % LESSONS.length].key;
  };
  const upd = async (id, patch) => { await supabase.from("sessions").update(patch).eq("id", id); load(); };
  const checkIn = (s) => {
    const key = (draft[s.id] && draft[s.id].lesson) || suggest(s), l = LESSONS.find((x) => x.key === key);
    upd(s.id, { checked_in_at: new Date().toISOString(), lesson_key: l.key, lesson_title: l.title });
  };
  const checkOut = (s) => upd(s.id, { checked_out_at: new Date().toISOString(), note: (draft[s.id] && draft[s.id].note) ?? s.note ?? null });
  const tick = async (s, sid, on) => {
    if (on) await supabase.from("attendance").delete().eq("session_id", s.id).eq("student_id", sid);
    else await supabase.from("attendance").insert({ session_id: s.id, student_id: sid });
    load();
  };

  const studentIds = [...new Set(d.enr.map((e) => e.student_id))];
  const history = d.sessions.filter((s) => s.checked_in_at).sort((a, b) => (a.starts_at < b.starts_at ? 1 : -1));

  return (
    <>
      <PortalHeader kind="teacher" />
      <section className="sec"><div className="wrap">
        <div className="portalbar">
          <p className="portal-title">Teacher portal</p>
          <nav className="tabs" aria-label="Teacher portal">
            {TABS.map(([k, l, Icon]) => <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Icon size={18} aria-hidden="true" />{l}</button>)}
            <button className="tab" onClick={logout}><LogOut size={18} aria-hidden="true" />Log out</button>
          </nav>
          <p className="why">Signed in as {t.name}</p>
        </div>

        {tab === "today" && (<>
          {todays.length === 0 && <p>No classes today. Your next sessions will appear here on the day.</p>}
          {todays.map((s) => {
            const c = cls(s.class_id), members = d.enr.filter((e) => e.class_id === s.class_id);
            const dr = draft[s.id] || {};
            const open = s.checked_in_at && !s.checked_out_at;
            return (
              <div key={s.id} className="card" style={{ marginBottom: 16 }}>
                <h3>{c ? c.name : "Class"}, {timeUK(s.starts_at)} UK time</h3>
                {!s.checked_in_at && (<>
                  <label>Lesson you are teaching
                    <select value={dr.lesson || suggest(s)} onChange={(e) => setDraft({ ...draft, [s.id]: { ...dr, lesson: e.target.value } })}>
                      {LESSONS.map((l, i) => <option key={l.key} value={l.key}>{i + 1}. {l.title}</option>)}
                    </select>
                  </label>
                  <button className="btn" onClick={() => checkIn(s)}>Check in</button>
                </>)}
                {s.checked_in_at && (<>
                  <p className="verdict">Checked in {timeUK(s.checked_in_at)}. Lesson: {s.lesson_title}</p>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Who attended?</p>
                  {members.length === 0 && <p>No students are enrolled in this class yet.</p>}
                  {members.map((m) => {
                    const on = d.att.some((a) => a.session_id === s.id && a.student_id === m.student_id);
                    return <label key={m.student_id} className="tick"><input type="checkbox" checked={on} onChange={() => tick(s, m.student_id, on)} />{nm(prof(m.student_id))}</label>;
                  })}
                  {open ? (<>
                    <label style={{ marginTop: 14 }}>Note for the students (optional)<textarea value={dr.note ?? s.note ?? ""} onChange={(e) => setDraft({ ...draft, [s.id]: { ...dr, note: e.target.value } })} /></label>
                    <button className="btn" onClick={() => checkOut(s)}>Check out</button>
                  </>) : <p className="why" style={{ marginTop: 10 }}>Checked out {timeUK(s.checked_out_at)}.</p>}
                </>)}
              </div>
            );
          })}
        </>)}

        {tab === "students" && (<>
          {studentIds.length === 0 && <p>No students are in your classes yet.</p>}
          {studentIds.map((id) => {
            const rs = d.results.filter((r) => r.user_id === id), done = d.prog.filter((p) => p.student_id === id).length;
            const weak = topicTotals(rs).slice(0, 3).map((x) => `${x.name} ${x.pct}%`).join(", ");
            const last = d.logs.filter((l) => l.student_id === id).sort((a, b) => (a.taken_on < b.taken_on ? 1 : -1))[0];
            return (
              <div key={id} className="rev ok">
                <p style={{ fontWeight: 600 }}>{nm(prof(id))}</p>
                <p>{rs.length} mock tests, best {rs.length ? Math.max(...rs.map(pct)) : 0}%, {done} of {LESSONS.length} lessons done{last ? `, last class ${fdate(last.taken_on)}` : ""}</p>
                <p className="why">{weak ? "Weakest topics: " + weak : "No topic scores yet"}</p>
              </div>
            );
          })}
        </>)}

        {tab === "history" && (<>
          {history.length === 0 && <p>No sessions taught yet.</p>}
          {history.map((s) => (
            <div key={s.id} className="rev ok">
              <p style={{ fontWeight: 600 }}>{fmtUK(s.starts_at)}, {cls(s.class_id) ? cls(s.class_id).name : "Class"}</p>
              <p>{s.lesson_title}, {d.att.filter((a) => a.session_id === s.id).length} present</p>
              <p className="why">In {timeUK(s.checked_in_at)}{s.checked_out_at ? ", out " + timeUK(s.checked_out_at) : ", not checked out"}{s.note ? ". Note: " + s.note : ""}</p>
            </div>
          ))}
        </>)}
      </div></section>
      <Footer />
    </>
  );
}
