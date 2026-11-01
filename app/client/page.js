"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PortalHeader, Footer } from "../../components/Chrome";
import { PortalNav } from "../../components/PortalNav";
import { supabase } from "../../lib/supabase";
import { pct, topicTotals } from "../../lib/lessons";
import { waTo } from "../../lib/wa";

export default function ClientHome() {
  const router = useRouter();
  const [ok, setOk] = useState(null);
  const [s, setS] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/client/login"); return; }
      const a = await supabase.from("admins").select("email").maybeSingle();
      if (!a.data) { setOk(false); return; }
      setOk(true);
      const week = new Date(Date.now() - 7 * 864e5).toISOString();
      const [st, nb, qb, rs, pf] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("results").select("*"),
        supabase.from("profiles").select("*"),
      ]);
      const all = rs.data || [];
      const DAY = 864e5, nowMs = Date.now();
      const attention = (pf.data || []).map((p) => {
        const mine = all.filter((r) => r.user_id === p.id), reasons = [];
        const last = mine.map((r) => r.taken_at).sort().pop();
        if (!last && nowMs - new Date(p.created_at) > 3 * DAY) reasons.push("Has not taken a mock test yet");
        else if (last && nowMs - new Date(last) > 7 * DAY) reasons.push(`No mock test for ${Math.floor((nowMs - new Date(last)) / DAY)} days`);
        topicTotals(mine).filter((t) => t.total >= 5 && t.pct < 50).slice(0, 2).forEach((t) => reasons.push(`Struggling with ${t.name} (${t.pct}%)`));
        return { p, reasons };
      }).filter((x) => x.reasons.length).slice(0, 10);
      setS({
        attention, students: st.count || 0, bookings: nb.count || 0, questions: qb.count || 0,
        week: all.filter((r) => r.taken_at >= week).length,
        avg: all.length ? Math.round(all.reduce((t, r) => t + pct(r), 0) / all.length) : 0,
      });
    })();
  }, [router]);

  if (ok === false) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><h1 className="h2">Client portal</h1><div className="card"><p style={{ marginTop: 0 }}>This portal is for the academy owner and instructors. Ask the owner to add your email.</p><Link className="btn" href="/">Back to the site</Link></div></div></section><Footer /></>);
  if (!s) return (<><PortalHeader kind="client" /><section className="sec"><div className="wrap"><p>Loading...</p></div></section></>);

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
      <PortalHeader kind="client" />
      <section className="sec"><div className="wrap">
        <PortalNav />
        <div className="stats">
          {stats.map(([n, l]) => <div key={l} className="stat"><b>{n}</b>{l}</div>)}
        </div>
        <h3 className="sub">Needs attention</h3>
        {s.attention.length === 0 && <p>Nobody needs a nudge right now.</p>}
        {s.attention.map(({ p, reasons }) => (
          <div key={p.id} className="rev bad">
            <p style={{ fontWeight: 600 }}>{p.full_name || p.email}</p>
            <p className="why">{reasons.join(". ")}</p>
            {p.phone
              ? <a className="btn ghost" style={{ marginTop: 6 }} target="_blank" rel="noopener noreferrer" href={waTo(p.phone, `Hi ${(p.full_name || "there").split(" ")[0]}, this is Raza Theory & Driving Academy checking in. How is your theory practice going? Let us know if you need any help.`)}>Message on WhatsApp</a>
              : <p className="why">No phone number on file</p>}
          </div>
        ))}
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
