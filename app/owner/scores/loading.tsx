import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Scoresheets"
      subtitle="Post final scores without the schedule-management clutter."
      active="home"
    >
      <OwnerSectionFrame />
    </OwnerShellFrame>
  );
}
