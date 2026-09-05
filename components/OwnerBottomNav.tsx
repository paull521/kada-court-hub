import Link from "next/link";
import { CalendarDays, Home, User, Users, Wallet } from "lucide-react";

const links = [
  { href: "/owner", key: "home", icon: <Home />, label: "Home" },
  { href: "/owner/roster?view=teams", key: "teams", icon: <Users />, label: "Teams" },
  { href: "/owner/schedule", key: "schedule", icon: <CalendarDays />, label: "Schedule" },
  { href: "/owner/payments", key: "payments", icon: <Wallet />, label: "Payments" },
  { href: "/profile?view=owner", key: "profile", icon: <User />, label: "Profile" },
] as const;

export type OwnerNavKey = (typeof links)[number]["key"] | "season" | "scores" | "more";

export default function OwnerBottomNav({ active }: { active: OwnerNavKey }) {
  const selected =
    active === "season" || active === "scores" ? "home" : active === "more" ? "profile" : active;
  return (
    <nav className="bottom owner-bottom" aria-label="Owner navigation">
      {links.map(({ href, key, icon, label }) => (
        <Link key={key} href={href} className={`nav ${selected === key ? "active" : ""}`}>
          <b aria-hidden="true">{icon}</b>
          {label}
        </Link>
      ))}
    </nav>
  );
}
