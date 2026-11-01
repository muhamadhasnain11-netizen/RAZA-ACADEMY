"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PortalHeader, Footer } from "../../../components/Chrome";
import { supabase } from "../../../lib/supabase";

export default function Classroom() {
  const { id } = useParams();
  const router = useRouter();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/student/login"); return; }
      const r = await fetch("/api/join", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session.access_token }, body: JSON.stringify({ sessionId: Number(id) }) });
      const j = await r.json();
      setState(j.url ? { status: "ok", url: j.url } : { status: "error", error: j.error || "Could not join this class." });
    })();
  }, [id, router]);

  return (
    <>
      <PortalHeader kind="class" />
      <section className="sec"><div className="wrap">
        {state.status === "loading" && <p>Opening your classroom...</p>}
        {state.status === "error" && (
          <div className="card">
            <h3>Cannot join yet</h3>
            <p>{state.error}</p>
            <button className="btn" onClick={() => router.back()}>Go back</button>
          </div>
        )}
        {state.status === "ok" && (<>
          <iframe src={state.url} title="Live class" allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write" style={{ width: "100%", height: "76vh", border: 0, borderRadius: 12, background: "#111" }} />
          <p className="why" style={{ marginTop: 10 }}>This class may be recorded. Teachers can share their screen from the call controls.</p>
          <button className="btn ghost" onClick={() => router.back()}>Leave class</button>
        </>)}
      </div></section>
      <Footer />
    </>
  );
}
