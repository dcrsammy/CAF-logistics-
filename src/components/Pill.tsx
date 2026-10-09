import { STATUSES } from "@/lib/constants";

export default function Pill({ status }: { status: number }) {
  return <span className="pill">{STATUSES[status] ?? "Unknown"}</span>;
}
