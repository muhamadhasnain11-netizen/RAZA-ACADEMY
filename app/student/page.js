"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Flame, Award, ClipboardCheck, Target, Car, BookOpen, BarChart3, ClipboardList, LogOut, CalendarCheck, Video } from "lucide-react";
import { PortalHeader, Footer } from "../../components/Chrome";
import { fmtUK } from "../../lib/time";
import { Ring } from "../../components/Ring";
import { BadgeGrid } from "../../components/Badges";
import { RecordingButton } from "../../components/RecordingButton";
import { supabase } from "../../lib/supabase";
import { LESSONS, pct, currentLesson, fdate, topicTotals } from "../../lib/lessons";
import { BADGES, summary, readiness } from "../../lib/game";

const TABS = [["lessons", "Lessons", BookOpen], ["classes", "Classes", Car], ["topics", "Topics", BarChart3], ["tests", "Tests", ClipboardList], ["badges", "Badges", Award]];

export default function StudentPortal() {
  const router = useRouter();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState("lessons");
  const [dateDraft, setDateDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/student/login"); return; }
      const id = data.user.id;
      const [r, c, l, p, s] = await Promise.all([
        supabase.from("results").select("*").eq("user_id", id).order("taken_at", { ascending: false }),
        supabase.from("class_logs").select("*").eq("student_id", id).order("taken_on", { ascending: false }),
        supabase.from("lesson_progress").select("lesson").eq("student_id", id),
        supabase.from("profiles").select("full_name, test_date, phone").eq("id", id).maybeSingle(),
        supabase.from("sessions").select("*, classes(name)").gte("starts_at", new Date(Date.now() - 4 * 36e5).toISOString()).is("checked_out_at", null).order("starts_at").limit(5),
      ]);
      setD({ upcoming: s.data || [], user: data.user, results: r.data || [], logs: c.data || [], done: new Set((l.data || []).map((x) => x.lesson)), name: p.data ? p.data.full_name : "", testDate: p.data ? p.data.test_date : null, phone: p.data ? p.data.phone : "" });
    })();
  }, [router]);

  const saveDate = async () => {
    await supabase.from("profiles").update({ test_date: dateDraft || null }).eq("id", d.user.id);
    setD({ ...d, testDate: dateDraft || null });
  };
  const savePhone = async () => {
    const { error } = await supabase.from("profiles").update({ phone: phoneDraft }).eq("id", d.user.id);
    setPhoneMsg(error ? "Could not save. Try again." : "Saved."); if (!error) setD({ ...d, phone: phoneDraft });
  };
  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };
  if (!d) return (<><PortalHeader kind="student" /><section className="sec"><div className="wrap"><p>Loading your portal...</p></div></section></>);

  const { user, results, logs, done, name, upcoming, testDate, phone } = d;
  const cur = currentLesson(done);
  const daysLeft = testDate ? Math.round((new Date(testDate + "T00:00:00") - new Date(new Date().toDateString())) / 864e5) : null;
  const best = results.length ? Math.max(...results.map(pct)) : 0;
  const topics = topicTotals(results);
  const weak = topics.filter((t) => t.pct < 86).slice(0, 3).map((t) => t.name);
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
            {weak.length > 0 && <Link className="btn ghost" href={"/test?topics=" + encodeURIComponent(weak.join("|"))}><Target size={18} aria-hidden="true" />Practise weak topics</Link>}
            <Link className="btn ghost" href="/student/review"><BookOpen size={18} aria-hidden="true" />Review missed questions</Link>
            <Link className="btn ghost" href="/book"><CalendarCheck size={18} aria-hidden="true" />Book a session</Link>
            <button className="btn ghost" onClick={logout}><LogOut size={18} aria-hidden="true" />Log out</button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <p className="verdict" style={{ marginTop: 0 }}>Your theory test</p>
          <p>{daysLeft === null ? "Add your test date to see a countdown." : daysLeft > 0 ? `${daysLeft} days to go until your test on ${fdate(testDate)}.` : daysLeft === 0 ? "Your test is today. Good luck!" : "Your test date has passed. Update it if you are re-booking."}</p>
          <label>Test date<input type="date" value={dateDraft || testDate || ""} onChange={(e) => setDateDraft(e.target.value)} /></label>
          <button className="btn" onClick={saveDate}>Save date</button>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <p className="verdict" style={{ marginTop: 0 }}>Your contact number</p>
          <label>Phone number (WhatsApp)<input type="tel" value={phoneDraft || phone || ""} onChange={(e) => setPhoneDraft(e.target.value)} /></label>
          {phoneMsg && <p className="why" role="status">{phoneMsg}</p>}
          <button className="btn" onClick={savePhone}>Save number</button>
        </div>

        {upcoming.length > 0 && (
          <div className="card" style={{ marginTop: 18 }}>
            <p className="verdict" style={{ marginTop: 0 }}>Upcoming classes (UK time)</p>
            {upcoming.map((u) => (
              <p key={u.id} style={{ margin: "6px 0" }}>{fmtUK(u.starts_at)}, {u.classes ? u.classes.name : "Class"}{u.lesson_title ? ", " + u.lesson_title : ""}{new Date(u.starts_at) - Date.now() < 20 * 60e3 && <>{" "}<Link className="btn" style={{ minHeight: 36, padding: "4px 14px" }} href={"/classroom/" + u.id}><Video size={16} aria-hidden="true" />Join class</Link></>}</p>
            ))}
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
              {c.session_id && <RecordingButton sessionId={c.session_id} />}
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
