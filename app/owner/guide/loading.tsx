import OwnerShellFrame from "@/components/OwnerShellFrame";
import { SkeletonBlock } from "@/components/Skeleton";

/**
 * The guide is fixed words apart from the conference name in its opening
 * panel, so the section index is drawn for real and only the body below it is
 * blocks.
 */
export default function Loading() {
  return (
    <OwnerShellFrame
      title="Owner's Guide"
      subtitle="What a commissioner can do, and where each of it lives."
      active="home"
    >
      <div className="owner-guide">
        <nav className="owner-guide-index" aria-label="Guide sections">
          <a>Where everything lives</a>
          <a>A season, start to finish</a>
          <a>What each page does</a>
          <a>What has to happen first</a>
          <a>Words used here</a>
          <a>Questions</a>
        </nav>
        <div className="owner-guide-body">
          <SkeletonBlock height="150px" radius="22px" />
          <SkeletonBlock height="230px" radius="18px" />
          <SkeletonBlock height="320px" radius="18px" />
        </div>
      </div>
    </OwnerShellFrame>
  );
}
