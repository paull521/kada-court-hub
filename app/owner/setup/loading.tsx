import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";

// The subtitle names the conference, so it is the read; the title is not.
export default function Loading() {
  return (
    <OwnerShellFrame title="Season Setup" active="home">
      <OwnerSectionFrame rows={4} rowHeight="76px" />
    </OwnerShellFrame>
  );
}
