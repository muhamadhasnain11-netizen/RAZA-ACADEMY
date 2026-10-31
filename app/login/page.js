"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "../../components/Chrome";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { data, error } = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === "signup" && !data.session) setMsg("Check your email to confirm your account, then log in.");
    else router.push("/dashboard");
  };

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <h1 className="h2">{mode === "signup" ? "Create your account" : "Log in"}</h1>
        <form className="card" onSubmit={submit}>
          {mode === "signup" && <label>Your name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
          {msg && <p className="verdict" role="alert">{msg}</p>}
          <div className="row">
            <button className="btn" disabled={busy}>{mode === "signup" ? "Create account" : "Log in"}</button>
            <button type="button" className="btn ghost" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMsg(""); }}>
              {mode === "signup" ? "I already have an account" : "Create an account"}
            </button>
          </div>
        </form>
      </div></section>
      <Footer />
    </>
  );
}
