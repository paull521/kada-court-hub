import AppShell from "@/components/AppShell";
import { BookOpen } from "lucide-react";
import { SkeletonText } from "@/components/Skeleton";

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
      <section className="card rules-document">
        <header>
          <span>
            <BookOpen className="ui-icon" />
          </span>
          <div>
            <h2>
              <SkeletonText width="11em" />
            </h2>
            <p>
              <SkeletonText width="14em" />
            </p>
          </div>
        </header>
        <article aria-busy="true">
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
        </article>
      </section>
    </AppShell>
  );
}
