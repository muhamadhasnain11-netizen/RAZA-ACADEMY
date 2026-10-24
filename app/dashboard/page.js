"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "../../components/Chrome";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      setUser(data.user);
      const res = await supabase.from("results").select("*").order("taken_at", { ascending: false });
      setRows(res.data || []);
    })();
  }, [router]);

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };

  if (!user || !rows) return (<><Header /><section className="sec"><div className="wrap"><p>Loading your progress...</p></div></section></>);

  const best = rows.length ? Math.max(...rows.map((r) => Math.round((r.score / r.total) * 100))) : 0;
  const passes = rows.filter((r) => r.passed).length;

  return (
    <>
      <Header />
      <section className="sec"><div className="wrap">
        <h1 className="h2">My progress</h1>
        <div className="card">
          <p style={{ marginTop: 0 }}>Signed in as {user.email}</p>
          <p className="verdict">{rows.length} tests taken, best score {best}%, {passes} passed</p>
          {rows.length === 0 && <p>No scores yet. Take a mock test and your result will appear here.</p>}
          {rows.map((r) => (
            <div key={r.id} className={`rev ${r.passed ? "ok" : "bad"}`}>
              <p style={{ fontWeight: 600 }}>{r.score} out of {r.total}, {r.passed ? "Pass" : "Not yet"}</p>
              <p className="why">{new Date(r.taken_at).toLocaleDateString("en-GB")}</p>
            </div>
          ))}
          <div className="row">
            <Link className="btn" href="/test">Take a mock test</Link>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </div>
        </div>
      </div></section>
      <Footer />
    </>
  );
}
