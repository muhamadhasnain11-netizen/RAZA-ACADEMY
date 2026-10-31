"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "../../components/Chrome";
import { supabase } from "../../lib/supabase";

const waNum = (p) => { const d = p.replace(/\D/g, ""); return d.startsWith("0") ? "44" + d.slice(1) : d; };

const blank = { id: null, topic: "", question: "", options: ["", "", "", ""], correct: 0, explanation: "" };

export default function Admin() {
  const router = useRouter();
  const [ok, setOk] = useState(null);
  const [rows, setRows] = useState([]);
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState("");
  const [bk, setBk] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("questions").select("*").order("id");
    setRows(data || []);
    const b = await supabase.from("bookings").select("*").order("id", { ascending: false });
    setBk(b.data || []);
  }, []);

  const setStatus = async (b, status) => { await supabase.from("bookings").update({ status }).eq("id", b.id); load(); };
  const delBk = async (b) => {
    if (!window.confirm("Delete this booking request?")) return;
    await supabase.from("bookings").delete().eq("id", b.id); load();
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      const a = await supabase.from("admins").select("email").maybeSingle();
      if (a.data) { setOk(true); load(); } else setOk(false);
    })();
  }, [router, load]);

  const save = async (e) => {
    e.preventDefault(); setMsg("");
    const row = { topic: f.topic || null, question: f.question, options: f.options, correct_index: Number(f.correct), explanation: f.explanation || null };
    const { error } = f.id
      ? await supabase.from("questions").update(row).eq("id", f.id)
      : await supabase.from("questions").insert(row);
    if (error) { setMsg(error.message); return; }
    setMsg(f.id ? "Question updated." : "Question added.");
    setF(blank); load();
  };

  const edit = (r) => {
    setF({ id: r.id, topic: r.topic || "", question: r.question, options: r.options, correct: r.correct_index, explanation: r.explanation || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (r) => {
    if (!window.confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", r.id);
    if (error) setMsg(error.message); else { setMsg("Question deleted."); load(); }
  };

  if (ok === null) return (<><Header /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);
  if (!ok) return (
    <><Header /><section className="sec"><div className="wrap">
      <h1 className="h2">Admins only</h1>
      <div className="card"><p style={{ marginTop: 0 }}>This page is for academy admins. Ask the owner to add your email.</p><Link className="btn" href="/">Back to the site</Link></div>
    </div></section><Footer /></>
  );

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <div className="row" style={{ marginTop: 0 }}><Link className="btn" href="/admin/students">Students</Link></div>
        <h1 className="h2" style={{ marginTop: 24 }}>Booking requests</h1>
        {bk.length === 0 && <p>No requests yet.</p>}
        {bk.map((b) => (
          <div key={b.id} className={`rev ${b.status === "confirmed" ? "ok" : "bad"}`}>
            <p style={{ fontWeight: 600 }}>{b.name}, {b.session_type} ({b.status === "confirmed" ? "Confirmed" : "New"})</p>
            <p>{b.preferred_time.replace("T", " ")}, phone {b.phone}{b.email ? ", " + b.email : ""}</p>
            {b.note && <p className="why">{b.note}</p>}
            <div className="row" style={{ marginTop: 6 }}>
              <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNum(b.phone)}?text=${encodeURIComponent(`Hi ${b.name}, this is Raza Theory & Driving Academy about your ${b.session_type} request.`)}`}>Reply on WhatsApp</a>
              {b.status !== "confirmed" && <button className="btn ghost" onClick={() => setStatus(b, "confirmed")}>Mark confirmed</button>}
              <button className="btn ghost" onClick={() => delBk(b)}>Delete</button>
            </div>
          </div>
        ))}
        <h1 className="h2" style={{ marginTop: 48 }}>Question bank</h1>
        <form className="card" onSubmit={save}>
          <h3>{f.id ? "Edit question" : "Add a question"}</h3>
          <label>Topic (optional)<input value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} /></label>
          <label>Question<textarea required value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} /></label>
          {f.options.map((o, k) => (
            <label key={k}>Answer {"ABCD"[k]}<input required value={o} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === k ? e.target.value : x)) })} /></label>
          ))}
          <label>Correct answer
            <select value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value })}>
              {"ABCD".split("").map((l, k) => <option key={k} value={k}>Answer {l}</option>)}
            </select>
          </label>
          <label>Explanation (shown after the test)<textarea value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} /></label>
          {msg && <p className="verdict" role="status">{msg}</p>}
          <div className="row">
            <button className="btn">{f.id ? "Save changes" : "Add question"}</button>
            {f.id && <button type="button" className="btn ghost" onClick={() => setF(blank)}>Cancel</button>}
          </div>
        </form>
        <p className="verdict" style={{ marginTop: 28 }}>{rows.length} questions in the bank</p>
        {rows.map((r) => (
          <div key={r.id} className="rev ok">
            <p style={{ fontWeight: 600 }}>{r.question}</p>
            <p className="why">{r.topic ? r.topic + ". " : ""}Correct: {r.options[r.correct_index]}</p>
            <div className="row" style={{ marginTop: 6 }}>
              <button className="btn ghost" onClick={() => edit(r)}>Edit</button>
              <button className="btn ghost" onClick={() => del(r)}>Delete</button>
            </div>
          </div>
        ))}
      </div></section>
      <Footer />
    </>
  );
}
