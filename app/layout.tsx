import "./globals.css";
import "./workspaces.css";
import "./patriotism.css";
import "./kch-logo.css";
import "./desktop.css";
// Last, so a utility class outranks the seven stylesheets above it.
import "./tailwind.css";
import { ReactNode } from "react";
export const metadata = {
  title: "KadaCourtHub",
  description: "Your team, schedule, payments, and profile in one place.",
  appleWebApp: { capable: true, title: "KCH BBALL", statusBarStyle: "default" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
