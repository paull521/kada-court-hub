import { joinCard } from "@/components/ui/shared-classes";
export default function JoinPage() {
  return (
    <main className="shell invite-shell">
      <section className="content">
        <section className={`card ${joinCard}`}>
          <h1>Invitation unavailable</h1>
        </section>
      </section>
    </main>
  );
}
