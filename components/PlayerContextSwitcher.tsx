"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchPlayerContextAction } from "@/app/context/actions";
import type { PlayerContextOption } from "@/lib/kch-data";

export default function PlayerContextSwitcher({
  contexts,
  activeRegistrationId,
}: {
  contexts: PlayerContextOption[];
  activeRegistrationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(activeRegistrationId);
  const router = useRouter();
  const wrapper = useRef<HTMLDivElement>(null);
  const active =
    contexts.find((context) => context.registrationId === selectedRegistrationId) ?? contexts[0];
  const hasContextChoices = contexts.length > 1;

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    // The scrim only covers the page, so a click on the header or the nav
    // outside it has to close the list too.
    const closeOnOutside = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("mousedown", closeOnOutside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("mousedown", closeOnOutside);
    };
  }, [open]);

  if (!active) return null;

  function choose(registrationId: string) {
    setError("");
    const previous = selectedRegistrationId;
    setSelectedRegistrationId(registrationId);
    setOpen(false);
    startTransition(async () => {
      const result = await switchPlayerContextAction(registrationId);
      if (result.error) {
        setSelectedRegistrationId(previous);
        setError(result.error);
        setOpen(true);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={`team-switcher ${open ? "open" : ""}`.trim()} ref={wrapper}>
      <button
        className="card team-banner"
        type="button"
        onClick={() => hasContextChoices && setOpen(!open)}
        aria-haspopup={hasContextChoices ? "menu" : undefined}
        aria-expanded={hasContextChoices ? open : undefined}
        disabled={!hasContextChoices}
      >
        <span className="team-mark small" aria-hidden="true">
          K
        </span>
        <span className="team-banner-copy">
          <b>{active.team}</b>
          <small>
            {active.division} &nbsp;•&nbsp; {active.season}
          </small>
        </span>
        {hasContextChoices && <ChevronDown className="team-banner-caret" aria-hidden="true" />}
      </button>
      {open && (
        <div
          className="team-dropdown-scrim"
          aria-hidden="true"
          onMouseDown={() => setOpen(false)}
        />
      )}
      {open && (
        <div className="team-dropdown" role="menu" aria-label="Choose your team">
          <div className="context-options">
            {contexts.map((context) => (
              <button
                className={`context-option ${context.registrationId === active.registrationId ? "selected" : ""}`}
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={() => choose(context.registrationId)}
                key={context.registrationId}
              >
                <span className="context-option-mark" aria-hidden="true">
                  {context.registrationId === active.registrationId ? (
                    <Check className="ui-icon" />
                  ) : (
                    "K"
                  )}
                </span>
                <span>
                  <b>{context.team}</b>
                  <small>{context.conference}</small>
                  <em>
                    {context.division} &nbsp;•&nbsp; {context.season}
                  </em>
                </span>
                <strong aria-hidden="true">
                  {context.registrationId === active.registrationId ? (
                    "Current"
                  ) : (
                    <ChevronRight className="go-caret" />
                  )}
                </strong>
              </button>
            ))}
          </div>
          {pending && <p className="context-status">Updating your player view…</p>}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
