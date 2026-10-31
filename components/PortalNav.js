"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CalendarCheck, FileQuestion, Trophy, LogOut, UserCog, CalendarDays } from "lucide-react";
import { supabase } from "../lib/supabase";

const TABS = [
  ["/client", "Overview", LayoutDashboard],
  ["/client/students", "Students", Users],
  ["/client/teachers", "Teachers", UserCog],
  ["/client/classes", "Classes", CalendarDays],
  ["/client/bookings", "Bookings", CalendarCheck],
  ["/client/questions", "Question bank", FileQuestion],
  ["/client/leaderboard", "Leaderboard", Trophy],
];

export function PortalNav() {
  const path = usePathname();
  const router = useRouter();
  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };
  return (
    <div className="portalbar">
      <p className="portal-title">Client portal</p>
      <nav className="tabs" aria-label="Client portal">
        {TABS.map(([href, label, Icon]) => (
          <Link key={href} href={href} className={`tab ${path === href ? "on" : ""}`}><Icon size={18} aria-hidden="true" />{label}</Link>
        ))}
        <button className="tab" onClick={logout}><LogOut size={18} aria-hidden="true" />Log out</button>
      </nav>
    </div>
  );
}
