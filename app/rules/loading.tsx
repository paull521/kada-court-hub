import AppShell from "@/components/AppShell";
import { BookOpen } from "lucide-react";
import { SkeletonText } from "@/components/Skeleton";
import { RulesDocument } from "@/components/ui/RulesDocument";

/**
 * The rules document itself is a conference record, so its words do wait - but
 * the page around them does not. The title, the card and its header are drawn
 * straight away and only the document's own lines are grey.
 */
export default function Loading() {
  return (
    <AppShell active="profile" contentClass="reading-content">
      <h1 className="title">Rules &amp; Discipline</h1>
      <p className="subtitle">
        <SkeletonText width="16em" />
      </p>
      <RulesDocument
        icon={<BookOpen className="ui-icon" />}
        title={<SkeletonText width="11em" />}
        meta={<SkeletonText width="14em" />}
        busy
      >
        <span className="sr-only" role="status">
          Loading
        </span>
        {[0, 1, 2, 3].map((section) => (
          <section key={section}>
            <p>
              <SkeletonText width="13em" />
            </p>
            <p>
              <SkeletonText width="100%" />
            </p>
            <p>
              <SkeletonText width="100%" />
            </p>
            <p>
              <SkeletonText width="62%" />
            </p>
          </section>
        ))}
      </RulesDocument>
    </AppShell>
  );
}
