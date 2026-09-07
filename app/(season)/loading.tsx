import { ContentPlaceholder } from "@/components/Skeleton";

/**
 * Renders inside the season layout, so it replaces the body under the switcher
 * and nothing else: the header, the bottom nav and the switcher itself stay
 * exactly where they are while the next view's data is in flight.
 */
export default function Loading() {
  return <ContentPlaceholder />;
}
