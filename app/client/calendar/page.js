"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PortalHeader, Footer } from "../../../components/Chrome";
import { PortalNav } from "../../../components/PortalNav";
import { supabase } from "../../../lib/supabase";
import { useGuard } from "../../../lib/useGuard";
import { fmtUK, timeUK, dayUK } from "../../../lib/time";
import { waTo } from "../../../lib/wa";

const addDays = (s, n) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const mondayOf = (s) => addDays(s, -((new Date(s + "T12:00:00Z").getUTCDay() + 6) % 7));
const label = (s) => new Date(s + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function Calendar() {
  const ok = useGuard("client");
  const [d, setD] = useState({ sessions: [], classes: [], enr: [], profiles: [], teachers: [] });
  const [start, setStart] = useState(mondayOf(dayUK(new Date())));
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    const q = (t) => supabase.from(t).select("*");
    const [sessions, classes, enr, profiles, teachers] = await Promise.all([q("sessions"), q("classes"), q("enrolments"), q("profiles"), q("teachers")]);
    setD({ sessions: sessions.data || [], classes: classes.data || [], enr: enr.data || [], profiles: profiles.data || [], teachers: teachers.data || [] });
  }, []);
  useEffect(() => { if (ok) load(); }, [ok, load]);

  if (ok === null) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);
  if (ok === false) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><h1 className="h2">Client access only</h1><Link className="btn" href="/">Back to the site</Link></div></section><Footer /></>);

  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));
  const now = Date.now();
  return (
    <>
      <PortalHeader kind="client" />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <div className="row" style={{ marginTop: 0, alignItems: "center" }}>
          <button className="btn ghost" onClick={() => setStart(addDays(start, -7))}>Previous week</button>
          <button className="btn ghost" onClick={() => setStart(mondayOf(dayUK(new Date())))}>This week</button>
          <button className="btn ghost" onClick={() => setStart(addDays(start, 7))}>Next week</button>
        </div>
        <p className="verdict">Week of {label(start)} (UK time)</p>
        <div className="week">
          {days.map((day) => {
            const ss = d.sessions.filter((s) => dayUK(s.starts_at) === day).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
            return (
              <div key={day} className="day">
                <h4>{label(day)}</h4>
                {ss.length === 0 && <p className="why" style={{ margin: 0 }}>No classes</p>}
                {ss.map((s) => {
                  const c = d.classes.find((x) => x.id === s.class_id), t = c && d.teachers.find((x) => x.email === c.teacher_email);
                  const missed = !s.checked_in_at && new Date(s.starts_at) < now;
                  const members = d.enr.filter((e) => e.class_id === s.class_id);
                  return (
                    <div key={s.id} className={`slot ${s.checked_in_at ? "ok" : missed ? "bad" : ""}`}>
                      <b>{timeUK(s.starts_at)}</b> {c ? c.name : "Class"}<br />
                      <span className="why">{t ? t.name : ""}{s.lesson_title ? ", " + s.lesson_title : ""}</span><br />
                      <span className="why">{s.checked_in_at ? "Checked in" : missed ? "Missed" : "Scheduled"}</span>
                      <div style={{ marginTop: 6 }}>
                        <button className="tab" style={{ minHeight: 32, padding: "2px 10px" }} onClick={() => setOpen(open === s.id ? null : s.id)}>Reminders</button>
                      </div>
                      {open === s.id && (
                        <div style={{ marginTop: 6 }}>
                          {members.length === 0 && <span className="why">No students enrolled</span>}
                          {members.map((m) => {
                            const p = d.profiles.find((x) => x.id === m.student_id);
                            if (!p) return null;
                            const first = (p.full_name || "there").split(" ")[0];
                            return p.phone
                              ? <a key={p.id} className="tab" style={{ minHeight: 32, padding: "2px 10px", margin: "2px 4px 2px 0" }} target="_blank" rel="noopener noreferrer" href={waTo(p.phone, `Hi ${first}, a reminder that ${c ? c.name : "your class"} is on ${fmtUK(s.starts_at)} (UK time)${s.lesson_title ? ", lesson: " + s.lesson_title : ""}. See you there! Raza Theory & Driving Academy`)}>Remind {first}</a>
                              : <span key={p.id} className="why" style={{ display: "block" }}>{first}: no phone number</span>;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div></section>
      <Footer />
    </>
  );
}
