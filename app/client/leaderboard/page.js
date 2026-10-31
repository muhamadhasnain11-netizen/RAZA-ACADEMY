"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Flame, Award, Maximize2 } from "lucide-react";
import { Header, Footer } from "../../../components/Chrome";
import { PortalNav } from "../../../components/PortalNav";
import { supabase } from "../../../lib/supabase";
import { summary } from "../../../lib/game";

const short = (p) => {
  const n = (p.full_name || "").trim().split(/\s+/).filter(Boolean);
  return n.length > 1 ? `${n[0]} ${n[n.length - 1][0].toUpperCase()}.` : n[0] || "Student " + p.id.slice(0, 4);
};

export default function Leaderboard() {
  const router = useRouter();
  const [ok, setOk] = useState(null);
  const [rows, setRows] = useState([]);
  const [big, setBig] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      const a = await supabase.from("admins").select("email").maybeSingle();
      if (!a.data) { setOk(false); return; }
      setOk(true);
      const [p, r, c, l] = await Promise.all([
        supabase.from("profiles").select("*"), supabase.from("results").select("*"),
        supabase.from("class_logs").select("*"), supabase.from("lesson_progress").select("*"),
      ]);
      const list = (p.data || []).map((x) => {
        const g = summary({
          results: (r.data || []).filter((y) => y.user_id === x.id),
          logs: (c.data || []).filter((y) => y.student_id === x.id),
          done: new Set((l.data || []).filter((y) => y.student_id === x.id).map((y) => y.lesson)),
        });
        return { id: x.id, name: short(x), ...g };
      }).filter((x) => x.points > 0).sort((a, b) => b.points - a.points).slice(0, 10);
      setRows(list);
    })();
  }, [router]);

  if (ok === false) return (<><Header /><section className="sec"><div className="wrap"><h1 className="h2">Admins only</h1><Link className="btn" href="/">Back to the site</Link></div></section><Footer /></>);
  if (ok === null) return (<><Header /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <div className="row" style={{ marginTop: 0, justifyContent: "space-between", alignItems: "center" }}>
          <p className="verdict" style={{ margin: 0 }}>Top students by points. Names show first name and last initial.</p>
          <button className="btn ghost" onClick={() => setBig(!big)}><Maximize2 size={18} aria-hidden="true" />{big ? "Normal size" : "Big screen mode"}</button>
        </div>
        <div className={`lb ${big ? "big" : ""}`}>
          {rows.length === 0 && <p>No points yet. Points appear once students take tests, finish lessons and attend classes.</p>}
          {rows.map((r, i) => (
            <div key={r.id} className="lb-row">
              <span className="lb-rank">{i === 0 ? <Crown size={big ? 40 : 30} aria-label="1st" /> : i + 1}</span>
              <span className="lb-name">{r.name}<br /><small className="why">Level {r.level.index + 1}, {r.level.name}</small></span>
              <span className="chip dark"><Flame size={16} aria-hidden="true" />{r.streak.current}</span>
              <span className="chip dark"><Award size={16} aria-hidden="true" />{r.earned.length}</span>
              <span className="lb-pts">{r.points}</span>
            </div>
          ))}
        </div>
      </div></section>
      <Footer />
    </>
  );
}
