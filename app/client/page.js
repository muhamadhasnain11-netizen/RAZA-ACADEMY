"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "../../components/Chrome";
import { PortalNav } from "../../components/PortalNav";
import { supabase } from "../../lib/supabase";
import { pct } from "../../lib/lessons";

export default function ClientHome() {
  const router = useRouter();
  const [ok, setOk] = useState(null);
  const [s, setS] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      const a = await supabase.from("admins").select("email").maybeSingle();
      if (!a.data) { setOk(false); return; }
      setOk(true);
      const week = new Date(Date.now() - 7 * 864e5).toISOString();
      const [st, nb, qb, rs] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("results").select("score,total,taken_at"),
      ]);
      const all = rs.data || [];
      setS({
        students: st.count || 0, bookings: nb.count || 0, questions: qb.count || 0,
        week: all.filter((r) => r.taken_at >= week).length,
        avg: all.length ? Math.round(all.reduce((t, r) => t + pct(r), 0) / all.length) : 0,
      });
    })();
  }, [router]);

  if (ok === false) return (<><Header /><section className="sec"><div className="wrap"><h1 className="h2">Client portal</h1><div className="card"><p style={{ marginTop: 0 }}>This portal is for the academy owner and instructors. Ask the owner to add your email.</p><Link className="btn" href="/">Back to the site</Link></div></div></section><Footer /></>);
  if (!s) return (<><Header /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);

  const stats = [
    [s.students, "Students"], [s.bookings, "New booking requests"], [s.week, "Tests taken this week"],
    [s.avg + "%", "Average test score"], [s.questions, "Questions in the bank"],
  ];
  const cards = [
    ["/client/students", "Students", "Open any student's full file, tick lessons, log classes and see their scores."],
    ["/client/bookings", "Bookings", "See new booking requests, reply on WhatsApp and mark them confirmed."],
    ["/client/questions", "Question bank", "Add, edit or delete the questions students are tested on."],
  ];
  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <div className="stats">
          {stats.map(([n, l]) => <div key={l} className="stat"><b>{n}</b>{l}</div>)}
        </div>
        <div className="stats" style={{ marginTop: 18 }}>
          {cards.map(([href, t, d]) => (
            <Link key={href} href={href} className="stat go"><b style={{ fontSize: 30 }}>{t}</b>{d}</Link>
          ))}
        </div>
      </div></section>
      <Footer />
    </>
  );
}
