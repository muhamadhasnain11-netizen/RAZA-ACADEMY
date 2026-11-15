"use client";
import { useState, useEffect, useRef } from "react";
import { Header, Footer } from "../../components/Chrome";
import { QUESTIONS, SECONDS_PER_Q, PASS_NUM, PASS_DEN } from "../../lib/questions";
import { waLink } from "../../lib/config";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { Share2 } from "lucide-react";
import DrawingTool from "../../components/DrawingTool";

const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const fmt = (s) => `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.max(s, 0) % 60).padStart(2, "0")}`;

const BG_CSS = `
.mt-bg{position:relative;overflow:hidden;padding-bottom:60px;background:linear-gradient(180deg,#ffffff 0%,#f4f4f4 100%)}
.mt-bg .wrap{position:relative;z-index:1}
.mt-rib{position:absolute;pointer-events:none;z-index:0;width:min(34vw,520px);height:min(34vw,520px)}
.mt-rib.tr{top:0;right:0}
.mt-rib.bl{bottom:0;left:0;transform:rotate(180deg)}
.mt-wm{position:absolute;pointer-events:none;z-index:0;right:2%;top:150px;width:min(30vw,520px);opacity:.22}
.mt-bg .h2{color:#8a0014}
.mt-bg .card{background:rgba(255,255,255,.96);color:#111;box-shadow:0 10px 30px rgba(0,0,0,.12)}
.mt-logobar{display:flex;justify-content:center;margin:0 0 14px}
.mt-logobar img{height:84px;width:auto}
.mt-rec{position:fixed;left:16px;bottom:16px;z-index:9999;display:flex;align-items:center;gap:8px;font-family:system-ui,sans-serif}
.mt-rec button{cursor:pointer;border:none;border-radius:999px;padding:10px 16px;font-size:14px;font-weight:600;color:#fff;background:#111;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.mt-rec button.on{background:#e11d2e}
.mt-rec .dot{width:10px;height:10px;border-radius:50%;background:#fff;display:inline-block;margin-right:8px;animation:mtp 1s infinite}
.mt-rec .msg{background:#fff;color:#8a0014;font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid #ecd2d4;max-width:260px}
@keyframes mtp{50%{opacity:.25}}
@media (max-width:1000px){.mt-wm{right:50%;transform:translateX(50%);opacity:.08;width:80vw}}
`;

const Ribbon = ({ cls }) => (
  <svg className={"mt-rib " + cls} viewBox="0 0 400 400" aria-hidden="true">
    <defs><linearGradient id={"rg" + cls} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c40018" /><stop offset="1" stopColor="#ff1a1a" /></linearGradient></defs>
    <path d="M110 0 L215 0 C300 80 360 190 400 330 L400 400 C375 290 320 190 235 115 C195 80 150 40 110 0 Z" fill={"url(#rg" + cls + ")"} />
  </svg>
);

const LogoBar = () => (<div className="mt-logobar"><img src="/raza-logo.png" alt="Raza Theory and Driving Academy" /></div>);

function Recorder() {
  const [on, setOn] = useState(false);
  const [secs, setSecs] = useState(0);
  const [msg, setMsg] = useState("");
  const rec = useRef(null);
  const parts = useRef([]);
  const streams = useRef([]);
  const ctxRef = useRef(null);
  const timer = useRef(null);

  const stop = () => { if (rec.current && rec.current.state !== "inactive") rec.current.stop(); };

  const start = async () => {
    setMsg("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || typeof MediaRecorder === "undefined") {
      setMsg("Screen recording works on a computer in Chrome or Edge.");
      return;
    }
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      let mic = null;
      try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch (e) { setMsg("Microphone blocked. Recording the screen without your voice."); }
      streams.current = [screen, mic].filter(Boolean);
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const dest = ctx.createMediaStreamDestination();
      [screen, mic].forEach((st) => {
        if (st && st.getAudioTracks().length) ctx.createMediaStreamSource(new MediaStream(st.getAudioTracks())).connect(dest);
      });
      const out = new MediaStream([...screen.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(out, mime ? { mimeType: mime } : undefined);
      parts.current = [];
      r.ondataavailable = (e) => { if (e.data && e.data.size) parts.current.push(e.data); };
      r.onstop = () => {
        clearInterval(timer.current);
        streams.current.forEach((st) => st.getTracks().forEach((t) => t.stop()));
        if (ctxRef.current) ctxRef.current.close();
        const blob = new Blob(parts.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        a.href = url;
        a.download = `raza-mock-test-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.webm`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        setOn(false); setSecs(0);
      };
      screen.getVideoTracks()[0].addEventListener("ended", stop);
      r.start(1000);
      rec.current = r;
      setOn(true); setSecs(0);
      timer.current = setInterval(() => setSecs((x) => x + 1), 1000);
    } catch (e) {
      setMsg("Recording was cancelled or blocked.");
    }
  };

  useEffect(() => () => { clearInterval(timer.current); }, []);

  return (
    <div className="mt-rec">
      {on
        ? <button className="on" onClick={stop}><span className="dot" />Stop {fmt(secs)}</button>
        : <button onClick={start}>Record screen and voice</button>}
      {msg && <span className="msg" role="status">{msg}</span>}
    </div>
  );
}


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
        <LogoBar />
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
        <LogoBar />
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
        <LogoBar />
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
      <style>{BG_CSS}</style>
      <section className="sec mt-bg">
        <Ribbon cls="tr" /><Ribbon cls="bl" />
        <img className="mt-wm" src="/raza-logo.png" alt="" aria-hidden="true" />
        <div className="wrap"><h1 className="h2">Free mock test</h1>{body}</div>
      </section>
      <Recorder />
      <DrawingTool />
      <Footer />
    </>
  );
}
