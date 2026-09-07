import OwnerShellFrame from "@/components/OwnerShellFrame";
import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Conferences"
      subtitle="Create an isolated test conference or switch owner workspaces."
      active="more"
    >
      <div className="owner-frame-list">
        <SkeletonBlock height="96px" radius="18px" />
        <SkeletonBlock height="68px" radius="18px" />
      </div>
    </OwnerShellFrame>
  );
}
