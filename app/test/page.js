"use client";
import { useState, useEffect } from "react";
import { Header, Footer } from "../../components/Chrome";
import { QUESTIONS, SECONDS_PER_Q, PASS_NUM, PASS_DEN } from "../../lib/questions";
import { waLink } from "../../lib/config";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { Share2 } from "lucide-react";

const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const fmt = (s) => `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.max(s, 0) % 60).padStart(2, "0")}`;

export default function TestPage() {
  const [phase, setPhase] = useState("intro");
  const [qs, setQs] = useState([]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState({});
  const [flag, setFlag] = useState({});
  const [left, setLeft] = useState(0);
  const [saved, setSaved] = useState("");
  const [bank, setBank] = useState(QUESTIONS);
  const [focus, setFocus] = useState([]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("topics");
    if (t) setFocus(t.split("|"));
  }, []);

  useEffect(() => {
    supabase.from("questions").select("*").order("id").then(({ data }) => {
      if (data && data.length) setBank(data.map((r) => ({ q: r.question, o: r.options, a: r.correct_index, e: r.explanation || "", t: r.topic || "General", id: r.id })));
    });
  }, []);

  useEffect(() => {
    if (phase !== "run") return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "run" && left <= 0) setPhase("done");
  }, [left, phase]);

  useEffect(() => {
    if (phase !== "done") return;
    if (focus.length) { setSaved("practice"); return; }
    const score = qs.filter((q, k) => pick[k] === q.a).length;
    const need = Math.ceil((qs.length * PASS_NUM) / PASS_DEN - 1e-9);
    const topics = {};
    qs.forEach((q, k) => {
      const t = q.t || "General";
      topics[t] = topics[t] || { right: 0, total: 0 };
      topics[t].total++;
      if (pick[k] === q.a) topics[t].right++;
    });
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setSaved("login"); return; }
      const { error } = await supabase.from("results").insert({ user_id: data.user.id, score, total: qs.length, passed: score >= need, answers: { ...topics, _missed: qs.filter((q, k) => pick[k] !== q.a && q.id).map((q) => q.id) } });
      setSaved(error ? "error" : "saved");
    })();
  }, [phase]);

  const start = () => {
    const focused = bank.filter((q) => focus.includes(q.t));
    const s = shuffle(focus.length && focused.length >= 5 ? focused : bank).slice(0, 50);
    setQs(s); setI(0); setPick({}); setFlag({});
    setLeft(Math.round(s.length * SECONDS_PER_Q));
    setSaved(""); setPhase("run");
  };

  const finish = () => {
    const open = qs.length - Object.keys(pick).length;
    if (open > 0 && left > 0 && !window.confirm(`${open} unanswered. Finish anyway?`)) return;
    setPhase("done");
  };

  let body;
  if (phase === "intro") {
    body = (
      <div className="card">
        <p style={{ marginTop: 0 }}>
          {Math.min(bank.length, 50)} practice questions, {Math.round((Math.min(bank.length, 50) * SECONDS_PER_Q) / 60)} minutes, same pace and 86% pass mark as the real test. You can flag questions and jump between them. Explanations show at the end.{focus.length > 0 && <strong> Focused practice on: {focus.join(", ")}.</strong>}
        </p>
        <button className="btn" onClick={start}>Start the test</button>
      </div>
    );
  } else if (phase === "run") {
    const q = qs[i];
    body = (
      <div className="card">
        <div className="top">
          <span>Question {i + 1} of {qs.length}</span>
          <span className="clock">{fmt(left)}</span>
        </div>
        <h3>{q.q}</h3>
        {q.o.map((t, k) => (
          <button key={k} className="opt" aria-pressed={pick[i] === k} onClick={() => setPick({ ...pick, [i]: k })}>{t}</button>
        ))}
        <div className="row">
          <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
          {i < qs.length - 1
            ? <button className="btn" onClick={() => setI(i + 1)}>Next</button>
            : <button className="btn" onClick={finish}>Finish test</button>}
          <button className="btn ghost" onClick={() => setFlag({ ...flag, [i]: !flag[i] })}>{flag[i] ? "Remove flag" : "Flag for review"}</button>
        </div>
        <div className="qnav" aria-label="Question navigator">
          {qs.map((_, k) => (
            <button key={k} className={`${pick[k] != null ? "done" : ""} ${flag[k] ? "flag" : ""} ${k === i ? "cur" : ""}`} onClick={() => setI(k)}>{k + 1}</button>
          ))}
        </div>
        <button className="btn" onClick={finish}>Finish test</button>
      </div>
    );
  } else {
    const score = qs.filter((q, k) => pick[k] === q.a).length;
    const need = Math.ceil((qs.length * PASS_NUM) / PASS_DEN - 1e-9);
    const pass = score >= need;
    body = (
      <div className="card">
        <h3>{left <= 0 ? "Time\u2019s up. " : ""}You scored {score} out of {qs.length}</h3>
        <p className="verdict">{pass ? "Pass. You are above the 86% pass mark." : `Not yet. You need ${need} out of ${qs.length}, the same 86% as the real test.`}</p>
        {saved === "saved" && <p>Score saved to your progress.</p>}
        {saved === "practice" && <p>Practice sessions are not counted in your mock test scores.</p>}
        {pass && !focus.length && (
          <div className="row" style={{ marginTop: 0, marginBottom: 12 }}>
            <a className="btn ghost" target="_blank" rel="noopener noreferrer" href={"https://wa.me/?text=" + encodeURIComponent(`I just passed a mock theory test (${score} out of ${qs.length}) with Raza Theory & Driving Academy! Try it: ${window.location.origin}/test`)}><Share2 size={18} aria-hidden="true" />Share my pass</a>
          </div>
        )}
        {saved === "login" && <p><Link href="/student/login">Log in or create an account</Link> to save your scores and track your progress.</p>}
        {saved === "error" && <p>We could not save this score. Try again later.</p>}
        {qs.map((q, k) => {
          const ok = pick[k] === q.a;
          return (
            <div key={k} className={`rev ${ok ? "ok" : "bad"}`}>
              <p style={{ fontWeight: 600 }}>{q.q}{flag[k] ? " (flagged)" : ""}</p>
              <p>Your answer: {pick[k] == null ? "No answer" : q.o[pick[k]]}</p>
              {!ok && <p>Correct answer: {q.o[q.a]}</p>}
              <p className="why">{q.e}</p>
            </div>
          );
        })}
        <div className="row">
          <button className="btn ghost" onClick={start}>Try again</button>
          <a className="btn" target="_blank" rel="noopener noreferrer" href={waLink(`Hi Raza Theory & Driving Academy, I scored ${score}/${qs.length} on your website mock test and I\u2019d like a private theory session.`)}>Book a private session</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap"><h1 className="h2">Free mock test</h1>{body}</div></section>
      <Footer />
    </>
  );
}
