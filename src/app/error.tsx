"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="w narrow">
      <h1>Something went wrong</h1>
      <p className="mut" style={{ margin: "12px 0 20px" }}>Please try again. If it keeps happening, message us on WhatsApp.</p>
      <button className="btn pri" onClick={reset}>Try again</button>
    </div>
  );
}
