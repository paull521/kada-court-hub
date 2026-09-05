// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlayerContextSwitcher from "@/components/PlayerContextSwitcher";
import type { PlayerContextOption } from "@/lib/kch-data";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/app/context/actions", () => ({
  switchPlayerContextAction: vi.fn(async () => ({})),
}));

const option = (over: Partial<PlayerContextOption> = {}): PlayerContextOption =>
  ({
    registrationId: "r1",
    conferenceId: "c1",
    conference: "KCH Basketball League",
    season: "Fall 2026",
    divisionId: "d1",
    division: "Division A",
    team: "Team Kada",
    ownerName: "Owner",
    ...over,
  }) as PlayerContextOption;

/**
 * app/home/page.tsx deliberately renders the shell with an empty contexts array
 * for a player whose invitation has not been accepted yet, so the switcher has
 * to cope with having nothing to switch between. It renders nothing at all in
 * that case - the header simply has no switcher - which is what keeps the
 * invitations empty state reachable.
 */
describe("PlayerContextSwitcher", () => {
  it("renders nothing when the player has no contexts", () => {
    const { container } = render(<PlayerContextSwitcher contexts={[]} activeRegistrationId="" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing rather than throwing when the selected id matches nothing and the list is empty", () => {
    const { container } = render(
      <PlayerContextSwitcher contexts={[]} activeRegistrationId="stale-id" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the active team name", () => {
    render(<PlayerContextSwitcher contexts={[option()]} activeRegistrationId="r1" />);
    expect(screen.getByRole("button")).toHaveTextContent("Team Kada");
  });

  it("falls back to the active context when the selected id is unknown", () => {
    render(<PlayerContextSwitcher contexts={[option()]} activeRegistrationId="does-not-exist" />);
    expect(screen.getByRole("button")).toHaveTextContent("Team Kada");
  });

  it("stays disabled with exactly one context", () => {
    render(<PlayerContextSwitcher contexts={[option()]} activeRegistrationId="r1" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("enables the trigger once there is a real choice", () => {
    render(
      <PlayerContextSwitcher
        contexts={[option(), option({ registrationId: "r2", team: "Team Two" })]}
        activeRegistrationId="r1"
      />,
    );
    expect(screen.getByRole("button", { name: /Team Kada/ })).toBeEnabled();
  });
});
