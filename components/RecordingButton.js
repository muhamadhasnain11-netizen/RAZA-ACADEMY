"use client";
import { useState } from "react";
import { Play } from "lucide-react";
import { supabase } from "../lib/supabase";

export function RecordingButton({ sessionId }) {
  const [msg, setMsg] = useState("");
  const go = async () => {
    setMsg("Looking for the recording...");
    const { data } = await supabase.auth.getSession();
    const r = await fetch("/api/recording?s=" + sessionId, { headers: { Authorization: "Bearer " + data.session.access_token } });
    const j = await r.json();
    if (j.url) { setMsg(""); window.open(j.url, "_blank", "noopener"); } else setMsg(j.error || "No recording available.");
  };
  return (
    <div>
      <button className="btn ghost" style={{ minHeight: 36, padding: "4px 14px", marginTop: 6 }} onClick={go}><Play size={16} aria-hidden="true" />Watch recording</button>
      {msg && <span className="why" style={{ marginLeft: 10 }}>{msg}</span>}
    </div>
  );
}
