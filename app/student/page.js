"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Flame, Award, ClipboardCheck, Target, Car, BookOpen, BarChart3, ClipboardList, LogOut, CalendarCheck } from "lucide-react";
import { PortalHeader, Footer } from "../../components/Chrome";
import { fmtUK } from "../../lib/time";
import { Ring } from "../../components/Ring";
import { BadgeGrid } from "../../components/Badges";
import { supabase } from "../../lib/supabase";
import { LESSONS, pct, currentLesson, fdate, topicTotals } from "../../lib/lessons";
import { BADGES, summary, readiness } from "../../lib/game";

const TABS = [["lessons", "Lessons", BookOpen], ["classes", "Classes", Car], ["topics", "Topics", BarChart3], ["tests", "Tests", ClipboardList], ["badges", "Badges", Award]];

export default function StudentPortal() {
  const router = useRouter();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState("lessons");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/student/login"); return; }
      const id = data.user.id;
      const [r, c, l, p, s] = await Promise.all([
        supabase.from("results").select("*").eq("user_id", id).order("taken_at", { ascending: false }),
        supabase.from("class_logs").select("*").eq("student_id", id).order("taken_on", { ascending: false }),
        supabase.from("lesson_progress").select("lesson").eq("student_id", id),
        supabase.from("profiles").select("full_name").eq("id", id).maybeSingle(),
        supabase.from("sessions").select("*, classes(name)").gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
      ]);
      setD({ upcoming: s.data || [], user: data.user, results: r.data || [], logs: c.data || [], done: new Set((l.data || []).map((x) => x.lesson)), name: p.data ? p.data.full_name : "" });
    })();
  }, [router]);

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };
  if (!d) return (<><PortalHeader kind="student" /><section className="sec"><div className="wrap"><p>Loading your portal...</p></div></section></>);

  const { user, results, logs, done, name, upcoming } = d;
  const cur = currentLesson(done);
  const best = results.length ? Math.max(...results.map(pct)) : 0;
  const topics = topicTotals(results);
  const g = summary({ results, logs, done });
  const ready = readiness(results);
  const tiles = [[ClipboardCheck, results.length, "Tests taken"], [Target, best + "%", "Best score"], [Car, logs.length, "Classes taken"], [BookOpen, `${done.size}/${LESSONS.length}`, "Lessons done"]];

  return (
    <>
      <PortalHeader kind="student" />
      <section className="sec"><div className="wrap">
        <div className="portalbar"><p className="portal-title">Student portal</p></div>

        <div className="hero-card">
          <Ring value={ready} sub="pass ready" />
          <div className="hc-main">
            <p className="hc-name">{name || user.email}</p>
            <p className="level"><Trophy size={20} aria-hidden="true" />Level {g.level.index + 1}: {g.level.name}</p>
            <div className="meter"><i style={{ width: g.level.pct + "%" }} /></div>
            <p className="why">{g.points} points{g.level.next ? `, ${g.level.toNext} more to reach ${g.level.next}` : ", top level reached"}</p>
            <div className="chips">
              <span className="chip"><Flame size={16} aria-hidden="true" />{g.streak.current} day streak</span>
              <span className="chip"><Award size={16} aria-hidden="true" />{g.earned.length} of {BADGES.length} badges</span>
            </div>
          </div>
        </div>
        <p className="verdict">{results.length === 0 ? "Take your first mock test to see how ready you are." : ready >= 86 ? "You are scoring above the pass mark. Time to book your real test!" : ready >= 70 ? "Nearly there. Keep practising your weak topics." : "Keep practising. Every test gets you closer."}</p>

        <div className="stats">
          {tiles.map(([Icon, n, l]) => <div key={l} className="stat"><span className="ico"><Icon size={20} aria-hidden="true" /></span><b>{n}</b>{l}</div>)}
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <p className="verdict" style={{ marginTop: 0 }}>Your next step</p>
          <p>{cur < 0 ? "All lessons complete. Well done!" : `Lesson ${cur + 1}: ${LESSONS[cur].title}`}</p>
          <div className="meter"><i style={{ width: Math.round((done.size / LESSONS.length) * 100) + "%" }} /></div>
          <div className="row">
            <Link className="btn" href="/test"><ClipboardCheck size={18} aria-hidden="true" />Take a mock test</Link>
            <Link className="btn ghost" href="/book"><CalendarCheck size={18} aria-hidden="true" />Book a session</Link>
            <button className="btn ghost" onClick={logout}><LogOut size={18} aria-hidden="true" />Log out</button>
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <p className="verdict" style={{ marginTop: 0 }}>Upcoming classes (UK time)</p>
            {upcoming.map((u) => <p key={u.id} style={{ margin: "4px 0" }}>{fmtUK(u.starts_at)}, {u.classes ? u.classes.name : "Class"}{u.lesson_title ? ", " + u.lesson_title : ""}</p>)}
          </div>
        )}

        <nav className="tabs" style={{ marginTop: 24 }} aria-label="Student portal">
          {TABS.map(([k, l, Icon]) => <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}><Icon size={18} aria-hidden="true" />{l}</button>)}
        </nav>

        {tab === "lessons" && LESSONS.map((l, i) => (
          <div key={l.key} className={`rev ${done.has(l.key) ? "ok" : i === cur ? "bad" : ""}`}>
            <p style={{ fontWeight: 600 }}>{i + 1}. {l.title}</p>
            <p className="why">{done.has(l.key) ? "Done" : i === cur ? "Next to cover" : "To cover"}</p>
          </div>
        ))}

        {tab === "classes" && (<>
          {logs.length === 0 && <p>No classes logged yet. Book a session and your instructor will log it here.</p>}
          {logs.map((c) => (
            <div key={c.id} className="rev ok">
              <p style={{ fontWeight: 600 }}>{fdate(c.taken_on)}, {c.lesson || "Class"}</p>
              {c.note && <p className="why">{c.note}</p>}
            </div>
          ))}
        </>)}

        {tab === "topics" && (<>
          {topics.length === 0 && <p>Take a mock test and your scores by topic will appear here.</p>}
          {topics.map((t) => (
            <div key={t.name}>
              <p style={{ margin: "10px 0 4px" }}>{t.name}: {t.pct}% ({t.right} of {t.total})</p>
              <div className="meter"><i style={{ width: t.pct + "%" }} /></div>
            </div>
          ))}
        </>)}

        {tab === "tests" && (<>
          {results.length === 0 && <p>No tests yet.</p>}
          {results.map((r) => (
            <div key={r.id} className={`rev ${r.passed ? "ok" : "bad"}`}>
              <p style={{ fontWeight: 600 }}>{r.score} out of {r.total}, {r.passed ? "Pass" : "Not yet"}</p>
              <p className="why">{fdate(r.taken_at)}</p>
            </div>
          ))}
        </>)}

        {tab === "badges" && (<>
          <BadgeGrid earned={g.earned} />
          <p className="why" style={{ marginTop: 14 }}>How points work: 10 per test, 1 per correct answer, 50 for a pass, 25 per lesson finished and 15 per class attended.</p>
        </>)}
      </div></section>
      <Footer />
    </>
  );
}
