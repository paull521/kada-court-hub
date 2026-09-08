import OwnerShellFrame from "@/components/OwnerShellFrame";
import { SkeletonBlock } from "@/components/Skeleton";
import { frameList } from "@/components/ui/shared-classes";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Conferences"
      subtitle="Create an isolated test conference or switch owner workspaces."
      active="more"
    >
      <div className={frameList}>
        <SkeletonBlock height="96px" radius="18px" />
        <SkeletonBlock height="68px" radius="18px" />
      </div>
    </OwnerShellFrame>
  );
}
