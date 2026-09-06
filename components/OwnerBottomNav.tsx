import Link from "next/link";
import { ownerNavLinks } from "@/lib/nav-links";

export type OwnerNavKey = (typeof ownerNavLinks)[number]["key"] | "season" | "scores" | "more";

export default function OwnerBottomNav({ active }: { active: OwnerNavKey }) {
  const selected =
    active === "season" || active === "scores" ? "home" : active === "more" ? "profile" : active;
  return (
    <nav className="bottom owner-bottom" aria-label="Owner navigation">
      {ownerNavLinks.map(({ href, key, icon, label }) => (
        <Link key={key} href={href} className={`nav ${selected === key ? "active" : ""}`}>
          <b aria-hidden="true">{icon}</b>
          {label}
        </Link>
      ))}
    </nav>
  );
}
