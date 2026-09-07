import AppShell from "@/components/AppShell";
import PaymentsFrame from "@/components/PaymentsFrame";

/**
 * The page itself, without its numbers. The bell is live here rather than a
 * grey circle - it needs no data to be drawn - and the balance card, the fee
 * panel, the payment panel and the history row are the real ones, so nothing
 * on this screen is replaced by something of a different shape when the read
 * lands.
 */
export default function Loading() {
  return (
    <AppShell contentClass="two-col" active="payments">
      <PaymentsFrame />
    </AppShell>
  );
}
