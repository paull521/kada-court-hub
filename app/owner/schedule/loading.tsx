import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Schedule"
      subtitle="Create, update, and finalize regular-season and playoff schedules."
      active="schedule"
    >
      <OwnerSectionFrame intro="Choose a season, then a division. Each division keeps its own schedule, teams, and results." />
    </OwnerShellFrame>
  );
}
