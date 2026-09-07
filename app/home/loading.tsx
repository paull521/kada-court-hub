import AppShell from "@/components/AppShell";
import HomeFrame from "@/components/HomeFrame";

/**
 * /home blocks on its read on purpose - its rules redirect needs
 * activeRegistrationId - so this is the whole of what a player sees for that
 * wait, and it is the page: the greeting, both cards, both rows and the
 * sign-off, with the name, the fixture and the team left grey. The two-column
 * layout is the one a player with a team gets, which is all but the first
 * screen of a first season.
 */
export default function Loading() {
  return (
    <AppShell contentClass="two-col" active="home">
      <HomeFrame />
    </AppShell>
  );
}
