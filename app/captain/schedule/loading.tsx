import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainScheduleFrame from "@/components/CaptainScheduleFrame";

export default function Loading() {
  return (
    <CaptainShellFrame active="schedule" contentClass="two-col">
      <CaptainScheduleFrame />
    </CaptainShellFrame>
  );
}
