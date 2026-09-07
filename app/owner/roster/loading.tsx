import OwnerShellFrame from "@/components/OwnerShellFrame";
import OwnerSectionFrame from "@/components/OwnerSectionFrame";

// Teams or Player Directory, decided by ?view=, which a loading.tsx cannot
// read - so this is the one owner heading that waits.
export default function Loading() {
  return (
    <OwnerShellFrame active="teams">
      <OwnerSectionFrame rows={5} />
    </OwnerShellFrame>
  );
}
