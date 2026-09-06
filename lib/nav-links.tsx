import { CalendarDays, Home, User, Users, Wallet } from "lucide-react";

/**
 * The bottom-nav tables, one per workspace. They live together because the
 * Profile entry has to carry the role in the URL - /profile reads ?view= to
 * decide which role it is showing, so a bare /profile link drops a captain or
 * an owner back into the player view.
 */
export const playerNavLinks = [
  { href: "/home", key: "home", icon: <Home />, label: "Home" },
  { href: "/my-team", key: "team", icon: <Users />, label: "Teams" },
  { href: "/schedule", key: "schedule", icon: <CalendarDays />, label: "Schedule" },
  { href: "/payments", key: "payments", icon: <Wallet />, label: "Payments" },
  { href: "/profile", key: "profile", icon: <User />, label: "Profile" },
] as const;

export const captainNavLinks = [
  { href: "/captain", key: "home", icon: <Home />, label: "Home" },
  { href: "/captain/team", key: "team", icon: <Users />, label: "Teams" },
  { href: "/captain/schedule", key: "schedule", icon: <CalendarDays />, label: "Schedule" },
  { href: "/captain/payments", key: "payments", icon: <Wallet />, label: "Payments" },
  { href: "/profile?view=captain", key: "profile", icon: <User />, label: "Profile" },
] as const;

export const ownerNavLinks = [
  { href: "/owner", key: "home", icon: <Home />, label: "Home" },
  { href: "/owner/roster?view=teams", key: "teams", icon: <Users />, label: "Teams" },
  { href: "/owner/schedule", key: "schedule", icon: <CalendarDays />, label: "Schedule" },
  { href: "/owner/payments", key: "payments", icon: <Wallet />, label: "Payments" },
  { href: "/profile?view=owner", key: "profile", icon: <User />, label: "Profile" },
] as const;
