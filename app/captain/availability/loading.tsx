import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainAvailabilityFrame from "@/components/CaptainAvailabilityFrame";

export default function Loading() {
  return (
    <CaptainShellFrame
      active="team"
      title="Availability"
      subtitle="See who is playing in the next game."
    >
      <CaptainAvailabilityFrame />
    </CaptainShellFrame>
  );
}
