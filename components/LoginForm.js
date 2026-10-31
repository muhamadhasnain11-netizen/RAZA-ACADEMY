"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "./Chrome";
import { supabase } from "../lib/supabase";

const TITLES = { student: "Student login", teacher: "Teacher login", client: "Client login" };

export function LoginForm({ kind }) {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const enter = async (user) => {
    const mail = user.email.toLowerCase();
    if (kind === "client") {
      const a = await supabase.from("admins").select("email").maybeSingle();
      if (!a.data) { await supabase.auth.signOut(); setMsg("This login is only for approved academy staff."); return; }
    }
    if (kind === "teacher") {
      const t = await supabase.from("teachers").select("email").eq("email", mail).maybeSingle();
      if (!t.data) { await supabase.auth.signOut(); setMsg("This email has not been added as a teacher. Ask the academy owner."); return; }
    }
    router.push("/" + kind);
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg("");
    const { data, error } = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (!data.session) setMsg("Check your email to confirm your account, then log in.");
    else await enter(data.user);
  };

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <h1 className="h2">{mode === "signup" ? "Create your account" : TITLES[kind]}</h1>
        <form className="card" onSubmit={submit}>
          {mode === "signup" && <label>Your name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
          {msg && <p className="verdict" role="alert">{msg}</p>}
          <div className="row">
            <button className="btn" disabled={busy}>{mode === "signup" ? "Create account" : "Log in"}</button>
            <button type="button" className="btn ghost" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMsg(""); }}>{mode === "signup" ? "I already have an account" : "Create an account"}</button>
          </div>
        </form>
      </div></section>
      <Footer />
    </>
  );
}
