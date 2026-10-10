import { requestQuote } from "@/app/actions/quote";
import { whatsappLink } from "@/lib/site";

export default async function Home({ searchParams }: { searchParams: Promise<{ quote?: string }> }) {
  const q = (await searchParams).quote;
  return (
    <>
      <div className="band">
        <div className="w hero">
          <div>
            <h1>Ship from China to Nigeria. Track every step.</h1>
            <p className="lead">Air and sea freight from our Guangzhou warehouse, customs cleared, delivered to you.</p>
          </div>
          <form className="track-card" action="/track" method="get" role="search">
            <h2 className="h-sm">Track a shipment</h2>
            <label htmlFor="tn">Tracking number</label>
            <input id="tn" name="no" placeholder="CAF-1001" required maxLength={40} autoComplete="off" />
            <button className="btn dark wide">Track</button>
          </form>
        </div>
      </div>

      <section id="services">
        <div className="w">
          <h2>Our services</h2>
          <div className="grid">
            <div className="card"><h3>Express shipping</h3><p className="mut">Fast delivery for urgent parcels.</p></div>
            <div className="card"><h3>Cargo shipping</h3><p className="mut">For larger shipments from China.</p></div>
            <div className="card"><h3>Sea shipping</h3><p className="mut">Best value for bulk goods.</p></div>
            <div className="card"><h3>RMB exchange</h3><p className="mut">Buy RMB to pay your suppliers in China.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="w">
          <h2>How it works</h2>
          <div className="grid">
            <div className="card"><span className="step">1</span><h3>Add your orders</h3><p className="mut">Create an account and add each order with the store&apos;s tracking number.</p></div>
            <div className="card"><span className="step">2</span><h3>We match and receive</h3><p className="mut">Parcels arriving at our Guangzhou warehouse are matched to you by tracking number.</p></div>
            <div className="card"><span className="step">3</span><h3>One tracking number</h3><p className="mut">We pack everything together and issue a single CAF tracking number.</p></div>
            <div className="card"><span className="step">4</span><h3>Track and receive</h3><p className="mut">Follow the shipment online until it is delivered or ready for pickup.</p></div>
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
              <a href={whatsappLink()} rel="noopener noreferrer" target="_blank">Message us on WhatsApp</a>
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
              <p style={{ marginTop: 16 }}><button className="btn dark">Request quote</button></p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
