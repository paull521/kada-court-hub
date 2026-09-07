import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainTeamFrame from "@/components/CaptainTeamFrame";

export default function Loading() {
  return (
    <CaptainShellFrame active="team">
      <CaptainTeamFrame />
    </CaptainShellFrame>
  );
}
