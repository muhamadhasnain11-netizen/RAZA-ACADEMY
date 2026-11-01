"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PortalHeader, Footer } from "../../../components/Chrome";
import { supabase } from "../../../lib/supabase";
import { useGuard } from "../../../lib/useGuard";

export default function Review() {
  const user = useGuard("student");
  const [qs, setQs] = useState(null);
  const [pick, setPick] = useState({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const r = await supabase.from("results").select("answers").eq("user_id", user.id).order("taken_at", { ascending: false }).limit(5);
      const ids = [...new Set((r.data || []).flatMap((x) => (x.answers && x.answers._missed) || []))];
      if (!ids.length) { setQs([]); return; }
      const q = await supabase.from("questions").select("*").in("id", ids);
      setQs(q.data || []);
    })();
  }, [user]);

  return (
    <>
      <PortalHeader kind="student" />
      <section className="sec"><div className="wrap">
        <Link className="btn ghost" href="/student">Back to my portal</Link>
        <h1 className="h2" style={{ marginTop: 18 }}>Missed questions</h1>
        <p className="lead" style={{ marginTop: 0 }}>Questions you got wrong in your last five mock tests. Try them again.</p>
        {qs === null && <p>Loading...</p>}
        {qs && qs.length === 0 && <p>Nothing to review yet. Take a mock test and any questions you miss will appear here.</p>}
        {qs && qs.map((q) => {
          const p = pick[q.id], done = p !== undefined;
          return (
            <div key={q.id} className="card" style={{ marginBottom: 16 }}>
              <h3>{q.question}</h3>
              {q.options.map((o, k) => (
                <button key={k} className="opt" disabled={done} aria-pressed={p === k}
                  style={done && k === q.correct_index ? { borderColor: "var(--ok)", background: "#e8f5ec" } : done && p === k ? { borderColor: "var(--bad)" } : undefined}
                  onClick={() => setPick({ ...pick, [q.id]: k })}>{o}</button>
              ))}
              {done && (<>
                <p className="verdict">{p === q.correct_index ? "Correct!" : `Not quite. The answer is: ${q.options[q.correct_index]}`}</p>
                {q.explanation && <p className="why">{q.explanation}</p>}
              </>)}
            </div>
          );
        })}
      </div></section>
      <Footer />
    </>
  );
}
