"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "../../components/Chrome";
import { supabase } from "../../lib/supabase";
import { LESSONS, pct, currentLesson, fdate, topicTotals } from "../../lib/lessons";

const TABS = [["lessons", "Lessons"], ["classes", "Classes"], ["topics", "Topics"], ["tests", "Tests"]];

export default function StudentPortal() {
  const router = useRouter();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState("lessons");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      const id = data.user.id;
      const [r, c, l, p] = await Promise.all([
        supabase.from("results").select("*").eq("user_id", id).order("taken_at", { ascending: false }),
        supabase.from("class_logs").select("*").eq("student_id", id).order("taken_on", { ascending: false }),
        supabase.from("lesson_progress").select("lesson").eq("student_id", id),
        supabase.from("profiles").select("full_name").eq("id", id).maybeSingle(),
      ]);
      setD({ user: data.user, results: r.data || [], logs: c.data || [], done: new Set((l.data || []).map((x) => x.lesson)), name: p.data ? p.data.full_name : "" });
    })();
  }, [router]);

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };
  if (!d) return (<><Header /><section className="sec"><div className="wrap"><p>Loading your portal...</p></div></section></>);

  const { user, results, logs, done, name } = d;
  const cur = currentLesson(done);
  const best = results.length ? Math.max(...results.map(pct)) : 0;
  const topics = topicTotals(results);

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <div className="portalbar"><p className="portal-title">Student portal</p></div>
        <div className="card">
          <p style={{ marginTop: 0 }}>{name ? name + ", " : ""}signed in as {user.email}</p>
          <p className="verdict">{results.length} tests taken, best {best}%, {results.filter((r) => r.passed).length} passed. {logs.length} classes taken, {done.size} of {LESSONS.length} lessons done.</p>
          <div className="meter"><i style={{ width: Math.round((done.size / LESSONS.length) * 100) + "%" }} /></div>
          <p>{cur < 0 ? "All lessons complete. Well done!" : `You are on lesson ${cur + 1}: ${LESSONS[cur].title}`}</p>
          <div className="row">
            <Link className="btn" href="/test">Take a mock test</Link>
            <Link className="btn ghost" href="/book">Book a session</Link>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </div>
        </div>

        <nav className="tabs" style={{ marginTop: 24 }} aria-label="Student portal">
          {TABS.map(([k, l]) => <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
        </nav>

        {tab === "lessons" && LESSONS.map((l, i) => (
          <div key={l.key} className={`rev ${done.has(l.key) ? "ok" : i === cur ? "bad" : ""}`}>
            <p style={{ fontWeight: 600 }}>{i + 1}. {l.title}</p>
            <p className="why">{done.has(l.key) ? "Done" : i === cur ? "Current lesson" : "Not started"}</p>
          </div>
        ))}

        {tab === "classes" && (<>
          {logs.length === 0 && <p>No classes logged yet.</p>}
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
      </div></section>
      <Footer />
    </>
  );
}
