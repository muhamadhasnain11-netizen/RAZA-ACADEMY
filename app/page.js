import Link from "next/link";
import { Header, Footer } from "../components/Chrome";
import { waLink, BOOK_MSG } from "../lib/config";

export default function Home() {
  return (
    <>
      <Header />
      <section className="hero">
        <div className="hero-l">
          <h1>Pass your UK theory test <em>first time.</em></h1>
          <p className="lead">Join our live mock tests on TikTok, then fix your weak spots in a private session with a fully qualified, patient instructor.</p>
          <div className="row">
            <a className="btn" href={waLink(BOOK_MSG)} target="_blank" rel="noopener noreferrer">Book a private session</a>
            <Link className="btn ghost" href="/test">Try the free mock test</Link>
          </div>
        </div>
        <aside className="poster">
          <h2>Manual &amp; automatic driving lessons available</h2>
          <ul>
            <li>Flexible theory and driving lesson times</li>
            <li>Patient and friendly instructors</li>
            <li>Fully qualified instructors</li>
            <li>Special discount on bundles</li>
          </ul>
        </aside>
      </section>
      <section className="sec cta">
        <div className="wrap">
          <h2>Ready to book?</h2>
          <p>Message us on WhatsApp and we will find a time that suits you.</p>
          <a className="btn" href={waLink(BOOK_MSG)} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>
        </div>
      </section>
      <Footer />
    </>
  );
}
