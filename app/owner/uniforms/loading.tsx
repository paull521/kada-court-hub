import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";

export default function Loading() {
  return (
    <OwnerShellFrame
      title="Uniforms"
      subtitle="Dark and light reference photos, organized by season."
      active="more"
    >
      <OwnerSectionFrame
        eyebrow="DIVISION DETAILS"
        heading="Uniform Photos"
        intro="Open one season, then one division. Upload one dark and one light reference photo for every team in that division."
      />
    </OwnerShellFrame>
  );
}
