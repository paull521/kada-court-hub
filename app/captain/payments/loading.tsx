import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainPaymentsFrame from "@/components/CaptainPaymentsFrame";

export default function Loading() {
  return (
    <CaptainShellFrame active="payments">
      <CaptainPaymentsFrame />
    </CaptainShellFrame>
  );
}
