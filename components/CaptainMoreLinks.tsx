import { BookOpen, Check, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { moreList } from "@/components/ui/account-classes";

/**
 * The three links under the captain's More page. Fixed text, so the page and
 * its loading.tsx draw the same list and it does not arrive late.
 */
export default function CaptainMoreLinks() {
  return (
    <nav className={moreList}>
      <Link href="/profile?view=captain">
        <span>
          <User className="ui-icon" />
        </span>
        <div>
          <b>Player Profile</b>
          <small>Personal details and uniform size</small>
        </div>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </Link>
      <Link href="/captain/availability">
        <span>
          <Check className="ui-icon" />
        </span>
        <div>
          <b>Availability</b>
          <small>Next-game team responses</small>
        </div>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </Link>
      <Link href="/legal">
        <span>
          <BookOpen className="ui-icon" />
        </span>
        <div>
          <b>Privacy &amp; Terms</b>
        </div>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </Link>
    </nav>
  );
}
