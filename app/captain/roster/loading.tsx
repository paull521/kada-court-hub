import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainRosterFrame from "@/components/CaptainRosterFrame";

export default function Loading() {
  return (
    <CaptainShellFrame
      active="dashboard"
      title="Team Roster"
      subtitle="Build, submit, and revise your team roster."
    >
      <CaptainRosterFrame />
    </CaptainShellFrame>
  );
}
