import Link from "next/link";
import { Header, Footer } from "../components/Chrome";
import { waLink, BOOK_MSG } from "../lib/config";

const PASSES = [
  { name: "Raman", when: "June 2025" },
  { name: "Kiranjeet K.", when: "June 2025" },
  { name: "Ees Ur R.", when: "" },
  { name: "Harpreet S.", when: "" },
];

export default function Home() {
  return (
    <>
      <Header />
      <section className="hero">
        <div className="hero-l">
          <h1>Pass your UK theory test <em>first time.</em></h1>
          <p className="lead">Join our live mock tests on TikTok, then fix your weak spots in a private session with a fully qualified, patient instructor.</p>
          <div className="row">
            <Link className="btn" href="/book">Book a private session</Link>
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
      <section className="sec">
        <div className="wrap">
          <h2>Recent passes</h2>
          <p className="lead" style={{ marginTop: 0 }}>Students who passed their practical driving test with us.</p>
          <div className="passes">
            {PASSES.map((p) => (
              <div key={p.name} className="pass">
                <strong>{p.name}</strong>
                <span>Passed the practical driving test</span>
                {p.when && <span className="when">{p.when}</span>}
              </div>
            ))}
          </div>
        </div>
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
