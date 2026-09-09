/**
 * The Privacy & Terms summary. Every word of it is fixed, so it does not belong
 * behind a read: the page and app/legal/loading.tsx draw the same document, and
 * the only thing the wait is actually for is the shell's own chrome.
 */
export default function LegalDocument() {
  return (
    <section className="card p-[20px] [&>h2]:m-[21px_0_6px] [&>h2]:text-[18px] [&>h2:first-child]:mt-0 [&>p]:m-0 [&>p]:text-[15px] [&>p]:leading-[1.65] [&>p]:text-muted">
      <h2>Your KCH profile</h2>
      <p>
        KadaCourtHub stores the information needed to identify your account, place you on team
        rosters, show schedules, and track conference fees and payments.
      </p>
      <h2>Who can see information</h2>
      <p>
        Players see their own profile and team information. Captains receive limited access for
        their team. Conference owners can manage information within their conference. Access is
        restricted by account and conference role.
      </p>
      <h2>Payments</h2>
      <p>
        Zelle and cash entries are payment notices until the conference owner confirms receipt. KCH
        preserves payment and review history for conference records.
      </p>
      <h2>Player responsibilities</h2>
      <p>
        Keep your profile accurate, protect your login, use respectful team communication, and
        report incorrect roster, schedule, or payment information to your conference owner.
      </p>
      <h2>Historical records</h2>
      <p>
        Completed or canceled seasons are preserved rather than deleted so rosters, games, payments,
        and administrative history remain accurate.
      </p>
      <p className="mt-[22px]! rounded-[12px] bg-[#fff4da] p-[13px] text-[13px]! text-[#795009]!">
        This is the working MVP summary and should receive formal legal review before public launch.
      </p>
    </section>
  );
}
