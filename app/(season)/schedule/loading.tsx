import ScheduleFrame from "@/components/ScheduleFrame";

/**
 * Per route rather than one for the group: the three views are different
 * screens, and a placeholder that is not the screen it is standing in for is
 * the thing this replaced. The season layout stays mounted around it, so the
 * header, the bottom nav and the switcher do not take part in the wait.
 */
export default function Loading() {
  return <ScheduleFrame />;
}
