import Link from "next/link";
import { BRAND, PHONE_DISPLAY, waLink, BOOK_MSG } from "../lib/config";

export function Header() {
  return (
    <header>
      <div className="wrap bar">
        <Link href="/" className="brand">RAZA<small>THEORY &amp; DRIVING ACADEMY</small></Link>
        <div className="row" style={{ margin: 0 }}>
          <Link className="btn ghost" href="/dashboard">My progress</Link>
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
        Questions are original practice questions, not official DVSA ones.
      </div>
    </footer>
  );
}
