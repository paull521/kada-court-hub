import { BookOpen } from "lucide-react";
import { RulesDocument } from "@/components/ui/RulesDocument";

export const ownerDemoOverviewTitle = "Demo Owner What to Expect";

export function OwnerDemoOverview({ acknowledgedAt }: { acknowledgedAt?: string | null }) {
  return (
    <RulesDocument
      icon={<BookOpen className="ui-icon" />}
      title={ownerDemoOverviewTitle}
      meta="KCH Demo Overview · Free evaluation"
      footer={
        acknowledgedAt && (
          <footer>
            <b>Demo Overview Acknowledged</b>
            <span>
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(acknowledgedAt))}
            </span>
          </footer>
        )
      }
    >
      <section>
        <p>
          Welcome to Kada Court Hub (KCH). This demo gives you a chance to use KCH to organize and
          run your basketball conference.
        </p>
        <p>
          During the demo, you can create and manage your conference, seasons, divisions, teams,
          player directory, rosters, schedules, scores, standings, uniforms, and league-fee records.
          You can invite players, assign captains and co-captains, and give members access to view
          their team and schedule.
        </p>
      </section>
      <section>
        <h3>Free Demo</h3>
        <p>
          KCH will not charge a setup fee, season subscription, or player fee during this demo
          period.
        </p>
      </section>
      <section>
        <h3>Your Conference</h3>
        <p>
          You remain in charge of your conference. You decide your league rules, player eligibility,
          league fees, venues, teams, schedules, and on-court decisions. KCH provides the tools to
          help you organize and share that information with your members.
        </p>
        <p>
          Please keep player, team, schedule, and contact information accurate. Protect your login
          details and contact KCH if you need support or notice an issue.
        </p>
      </section>
      <section>
        <h3>What Happens Next</h3>
        <p>
          KCH may improve the app during the demo. Some features or screens may change as we learn
          from your experience. KCH will ask before using your conference name, logo, photos, or
          testimonial for promotion.
        </p>
        <p>
          At the end of the demo, you and KCH can discuss whether you would like to continue using
          the platform for a future season. There is no obligation to continue.
        </p>
      </section>
      <section>
        <p>
          By selecting <b>I understand</b>, you confirm that you have read this demo overview and
          understand that KCH is provided for evaluation and feedback.
        </p>
      </section>
    </RulesDocument>
  );
}
