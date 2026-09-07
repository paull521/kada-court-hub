import { BookOpen } from "lucide-react";

export function OwnerServiceAgreement() {
  return (
    <section className="card rules-document">
      <header>
        <span>
          <BookOpen className="ui-icon" />
        </span>
        <div>
          <h2>KCH Owner Service Agreement</h2>
          <p>Future paid season reference</p>
        </div>
      </header>
      <article>
        <section>
          <h3>1. Agreement and Service</h3>
          <p>
            This agreement governs the Owner’s use of Kada Court Hub (KCH) to organize and operate a
            conference. KCH provides tools for conference setup, rosters, teams, schedules, scores,
            standings, payment tracking, and related administration.
          </p>
          <p>
            The Owner operates the conference independently and remains responsible for league
            rules, venues, team participation, player collections, and conference decisions.
          </p>
        </section>
        <section>
          <h3>2. Season Subscription and Pricing</h3>
          <p>
            For each non-pilot season, the Owner pays a $50 Season Subscription plus $3 for each
            active player registered in a division for that season. KCH does not charge a setup fee.
            Owners set their own league fees and decide how to include KCH’s cost within those fees.
          </p>
        </section>
        <section>
          <h3>3. Pilot Seasons</h3>
          <p>
            KCH may select a conference for one complimentary pilot regular season. A pilot season
            does not include playoffs unless KCH confirms otherwise in writing. It does not create a
            right to free service for later seasons.
          </p>
        </section>
        <section>
          <h3>4. Payment and Suspension</h3>
          <p>
            The Owner’s season subscription is due when the Owner has collected league fees from all
            active players registered in divisions for that season, or when the season begins,
            whichever occurs first. KCH tracks the subscription; it does not collect or hold player
            league fees.
          </p>
          <p>
            Suspension is not automatic. KCH will discuss an overdue subscription with the Owner
            before manually suspending owner access, and may restore it after review.
          </p>
        </section>
        <section>
          <h3>5. Owner Responsibilities</h3>
          <p>
            Owners must keep conference, team, player, schedule, and contact information accurate;
            protect account credentials; obtain needed participant permissions; and remain
            responsible for player fees, refunds, venue arrangements, insurance, rules, and on-court
            conduct.
          </p>
        </section>
        <section>
          <h3>6. Data and Promotion</h3>
          <p>
            KCH keeps conference information separated through access controls and may access it
            only as reasonably necessary to provide, administer, secure, or support the service. KCH
            will ask before using a conference name, logo, photograph, or testimonial for promotion.
          </p>
        </section>
        <section>
          <h3>7. Termination and Records</h3>
          <p>
            Either party may end the service relationship by written notice, subject to unpaid
            obligations. KCH may retain reasonable account, payment, and historical conference
            records for administration, legal compliance, security, and service continuity.
          </p>
        </section>
      </article>
      <footer>
        <b>Draft Agreement</b>
        <span>Not required for the free demo</span>
      </footer>
    </section>
  );
}
