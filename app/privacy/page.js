import { Header, Footer } from "../../components/Chrome";
import { BRAND, PHONE_DISPLAY, CONTACT_EMAIL, BUSINESS_ADDRESS } from "../../lib/config";

export const metadata = { title: "Privacy policy | Raza Theory & Driving Academy" };

export default function Privacy() {
  return (
    <>
      <Header />
      <section className="sec"><div className="wrap" style={{ maxWidth: 780 }}>
        <h1 className="h2">Privacy policy</h1>
        <div className="card">
          <h3>Who we are</h3>
          <p>{BRAND} runs theory test classes and driving lessons. We are the controller of the personal information described here. Contact us at {CONTACT_EMAIL}, {BUSINESS_ADDRESS}, or on {PHONE_DISPLAY}.</p>
          <h3>What we collect</h3>
          <p>Your name, email address and phone number when you create an account or book. Your mock test results, lesson progress, class attendance, test date and instructor notes. Booking requests and payment records. Teachers and staff: name and email. If we record online classes, the recording will include your image and voice, and we will tell you first.</p>
          <h3>Why we use it</h3>
          <p>To provide your classes and bookings, show your progress, contact you about your sessions, take payment, and keep our records. We rely on our contract with you, our legitimate interest in running the academy, and your consent where we ask for it, for example for recordings.</p>
          <h3>Who we share it with</h3>
          <p>We do not sell your data. We use trusted providers to run the service: Supabase (database and logins), Vercel (website hosting), Stripe (payments) and, for online classes, a video provider. Your instructor can see the progress of the students in their classes.</p>
          <h3>How long we keep it</h3>
          <p>We keep your records while you are a student and for a reasonable period afterwards. Class recordings are deleted after a set period. Ask us for the exact periods.</p>
          <h3>Your rights</h3>
          <p>You can ask to see, correct or delete your personal information, object to how we use it, or withdraw consent at any time. Contact us using the details above. You can also complain to the Information Commissioner&apos;s Office at ico.org.uk.</p>
          <h3>Cookies</h3>
          <p>We use only the browser storage needed to keep you logged in. We do not use advertising cookies.</p>
        </div>
      </div></section>
      <Footer />
    </>
  );
}
