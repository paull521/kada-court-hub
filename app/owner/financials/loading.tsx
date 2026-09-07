import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Financial Summary"
      subtitle="Track season income, expenses, and profit or loss."
      active="more"
    >
      <OwnerSectionFrame intro="Add other expenses such as uniform, referee, court, and league operations. The page will provide the actual season financial summary." />
    </OwnerShellFrame>
  );
}
