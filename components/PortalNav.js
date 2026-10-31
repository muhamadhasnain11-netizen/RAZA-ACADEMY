"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const TABS = [
  ["/client", "Overview"],
  ["/client/students", "Students"],
  ["/client/bookings", "Bookings"],
  ["/client/questions", "Question bank"],
];

export function PortalNav() {
  const path = usePathname();
  const router = useRouter();
  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };
  return (
    <div className="portalbar">
      <p className="portal-title">Client portal</p>
      <nav className="tabs" aria-label="Client portal">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={`tab ${path === href ? "on" : ""}`}>{label}</Link>
        ))}
        <button className="tab" onClick={logout}>Log out</button>
      </nav>
    </div>
  );
}
