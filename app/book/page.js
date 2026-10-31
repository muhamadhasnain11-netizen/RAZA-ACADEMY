"use client";
import { useState } from "react";
import { Header, Footer } from "../../components/Chrome";
import { supabase } from "../../lib/supabase";
import { waLink } from "../../lib/config";

const TYPES = ["Group theory course, 4 weeks (£75)", "1-to-1 theory course, 4 weeks (£300)", "Driving lessons, manual", "Driving lessons, automatic", "Bundle, theory and driving"];

export default function Book() {
  const [f, setF] = useState({ name: "", phone: "", email: "", type: TYPES[0], time: "", note: "", website: "" });
  const [state, setState] = useState("form");
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (f.website) { setState("sent"); return; }
    setState("busy");
    const { error } = await supabase.from("bookings").insert({
      name: f.name, phone: f.phone, email: f.email || null, session_type: f.type, preferred_time: f.time, note: f.note || null,
    });
    if (error) { setErr("We could not send your request. Please try again or message us on WhatsApp."); setState("form"); }
    else setState("sent");
  };

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <h1 className="h2">Book a course</h1>
        <p className="lead" style={{ marginTop: 0 }}>Group course £75 (50% off, was £150) or 1-to-1 course £300. Both run for four weeks, Monday to Friday. We confirm your start date and payment on WhatsApp.</p>
        {state === "sent" ? (
          <div className="card">
            <h3>Request sent</h3>
            <p>Thanks {f.name}. We will message you on WhatsApp to confirm the time and price.</p>
            <a className="btn" target="_blank" rel="noopener noreferrer" href={waLink(`Hi Raza Theory & Driving Academy, I just requested a ${f.type} for ${f.time.replace("T", " ")}.`)}>Message us on WhatsApp</a>
          </div>
        ) : (
          <form className="card" onSubmit={submit}>
            <label>Your name<input required value={f.name} onChange={set("name")} autoComplete="name" /></label>
            <label>WhatsApp number<input required type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
            <label>Email (optional)<input type="email" value={f.email} onChange={set("email")} autoComplete="email" /></label>
            <label>What do you need?
              <select value={f.type} onChange={set("type")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            </label>
            <label>Preferred date and time<input required type="datetime-local" value={f.time} onChange={set("time")} /></label>
            <label>Anything we should know? (optional)<textarea value={f.note} onChange={set("note")} /></label>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} />
            {err && <p className="verdict" role="alert">{err}</p>}
            <button className="btn" disabled={state === "busy"}>{state === "busy" ? "Sending..." : "Send booking request"}</button>
          </form>
        )}
      </div></section>
      <Footer />
    </>
  );
}
