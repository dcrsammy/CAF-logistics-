import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w narrow">
      <h1>Page not found</h1>
      <p className="mut" style={{ margin: "12px 0 20px" }}>We could not find what you were looking for.</p>
      <Link className="btn pri" href="/">Back to home</Link>
    </div>
  );
}
