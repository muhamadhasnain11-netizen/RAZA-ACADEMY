import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { BRAND, PHONE_DISPLAY, waLink, BOOK_MSG } from "../lib/config";

export function Header() {
  return (
    <header>
      <div className="wrap bar">
        <Link href="/" aria-label="Raza Theory & Driving Academy, home"><img className="logo" src="/logo.jpg" alt="Raza Theory & Driving Academy" /></Link>
        <div className="row" style={{ margin: 0 }}>
          <Link className="btn ghost" href="/student"><GraduationCap size={18} aria-hidden="true" />Student portal</Link>
          <Link className="btn" href="/book">Book a session</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        {BRAND}, {PHONE_DISPLAY}<br />
        Questions are original practice questions, not official DVSA ones.<br />
        <Link href="/teacher/login">Teacher login</Link> | <Link href="/client/login">Client login</Link>
      </div>
    </footer>
  );
}

export function PortalHeader({ kind }) {
  const label = { student: "Student portal", teacher: "Teacher portal", client: "Client portal" }[kind];
  return (
    <header>
      <div className="wrap bar">
        <Link href="/" aria-label="Home"><img className="logo" src="/logo.jpg" alt="Raza Theory & Driving Academy" /></Link>
        <span className="portal-label">{label}</span>
        {kind === "student" && (
          <div className="row" style={{ margin: 0 }}>
            <Link className="btn ghost" href="/test">Mock test</Link>
            <Link className="btn" href="/book">Book a course</Link>
          </div>
        )}
      </div>
    </header>
  );
}
