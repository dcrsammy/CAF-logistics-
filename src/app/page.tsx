import Link from "next/link";
import { requestQuote } from "@/app/actions/quote";
import { whatsappLink } from "@/lib/site";

export default async function Home({ searchParams }: { searchParams: Promise<{ quote?: string }> }) {
  const q = (await searchParams).quote;
  return (
    <>
      <div className="w hero">
        <div>
          <h1>Ship from Guangzhou to Nigeria and follow every step</h1>
          <p className="lead">
            Air and sea freight, customs cleared by us, delivered to your door or ready for pickup.
          </p>
          <div className="row">
            <Link className="btn pri" href="/#quote">
              Get a quote
            </Link>
            <Link className="btn" href="/login">
              Log in to track
            </Link>
          </div>
        </div>
        <div className="card" aria-label="Example of tracking">
          <p className="mut small">Example shipment</p>
          <h3 style={{ margin: "4px 0 14px" }}>CAF-1001</h3>
          <ol className="tl">
            <li className="on">Received in Guangzhou</li>
            <li className="on">Packed and loaded</li>
            <li className="on">Left China</li>
            <li>Arrived in Nigeria</li>
          </ol>
        </div>
      </div>

      <section id="services">
        <div className="w">
          <h2>Services</h2>
          <div className="grid">
            <div className="card"><h3>Air freight</h3><p className="mut">Faster transit for small or urgent goods.</p></div>
            <div className="card"><h3>Sea freight</h3><p className="mut">Better value for bulk goods.</p></div>
            <div className="card"><h3>Customs clearance</h3><p className="mut">We clear your goods ourselves in Nigeria.</p></div>
            <div className="card"><h3>Delivery or pickup</h3><p className="mut">To your door, or collect from us.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="w">
          <h2>How it works</h2>
          <div className="grid">
            <div className="card"><h3>1. Send to us</h3><p className="mut">Have your supplier deliver to our Guangzhou warehouse.</p></div>
            <div className="card"><h3>2. We photograph it</h3><p className="mut">Photos appear in your account when goods arrive.</p></div>
            <div className="card"><h3>3. Track online</h3><p className="mut">See the status at every stage of the journey.</p></div>
            <div className="card"><h3>4. Receive</h3><p className="mut">Delivered, or ready for pickup.</p></div>
          </div>
        </div>
      </section>

      <section id="quote">
        <div className="w two">
          <div>
            <h2>Get a quote</h2>
            <p className="mut" style={{ marginTop: 12 }}>
              Price depends on the weight and type of goods. We reply with a price, usually on WhatsApp.
            </p>
            <p style={{ marginTop: 16 }}>
              <a href={whatsappLink()} rel="noopener noreferrer" target="_blank">
                Message us on WhatsApp
              </a>
            </p>
          </div>
          {q === "sent" ? (
            <div className="card" role="status">
              <h3>Thank you</h3>
              <p className="mut">We received your request and will contact you shortly.</p>
            </div>
          ) : (
            <form className="card" action={requestQuote}>
              {q === "invalid" && <p className="err" role="alert">Please fill in every field.</p>}
              {q === "error" && <p className="err" role="alert">Something went wrong. Please try again or message us on WhatsApp.</p>}
              <label htmlFor="q1">Full name</label>
              <input id="q1" name="name" required maxLength={100} autoComplete="name" />
              <label htmlFor="q2">WhatsApp number</label>
              <input id="q2" name="phone" type="tel" required maxLength={30} autoComplete="tel" />
              <label htmlFor="q3">What are you shipping?</label>
              <textarea id="q3" name="goods" rows={3} required maxLength={1000} />
              <label htmlFor="q4">Air or sea</label>
              <select id="q4" name="mode" defaultValue="Not sure">
                <option>Air</option>
                <option>Sea</option>
                <option>Not sure</option>
              </select>
              <p style={{ marginTop: 16 }}>
                <button className="btn pri">Request quote</button>
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
