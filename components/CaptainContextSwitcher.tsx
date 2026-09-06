"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchCaptainContextAction } from "@/app/captain/context-actions";
import type { CaptainContextOption } from "@/lib/captain-data";

export default function CaptainContextSwitcher({
  contexts,
  activeRegistrationId,
  variant = "header",
}: {
  contexts: CaptainContextOption[];
  activeRegistrationId: string;
  variant?: "header" | "banner";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(activeRegistrationId);
  const router = useRouter();
  const active =
    contexts.find((context) => context.registrationId === selectedRegistrationId) ?? contexts[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  if (!active) return null;

  function choose(registrationId: string) {
    setError("");
    const previous = selectedRegistrationId;
    setSelectedRegistrationId(registrationId);
    setOpen(false);
    startTransition(async () => {
      const result = await switchCaptainContextAction(registrationId);
      if (result.error) {
        setSelectedRegistrationId(previous);
        setError(result.error);
        setOpen(true);
        return;
      }
      router.refresh();
    });
  }

  if (variant === "banner") {
    return (
      <div className={`team-switcher ${open ? "open" : ""}`.trim()}>
        <button
          className="card team-banner"
          type="button"
          onClick={() => contexts.length > 1 && setOpen(!open)}
          aria-haspopup={contexts.length > 1 ? "menu" : undefined}
          aria-expanded={contexts.length > 1 ? open : undefined}
          disabled={contexts.length < 2}
        >
          <span className="team-mark small" aria-hidden="true">
            K
          </span>
          <span className="team-banner-copy">
            <b>{active.teamName}</b>
            <small>
              {active.divisionName} &nbsp;•&nbsp; {active.seasonName}
            </small>
          </span>
          {contexts.length > 1 && <ChevronDown className="team-banner-caret" aria-hidden="true" />}
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
                    <b>{context.teamName}</b>
                    <small>{context.divisionName}</small>
                    <em>{context.seasonName}</em>
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
            {pending && <p className="context-status">Updating your captain view…</p>}
            {error && <p className="form-error">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        className="context-switcher-trigger captain-context-trigger"
        type="button"
        onClick={() => contexts.length > 1 && setOpen(true)}
        aria-haspopup={contexts.length > 1 ? "dialog" : undefined}
        aria-expanded={contexts.length > 1 ? open : undefined}
        disabled={contexts.length < 2}
      >
        <span>
          <b>{active.teamName}</b>
        </span>
        {contexts.length > 1 && (
          <ChevronDown className="context-switcher-caret" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div
          className="context-overlay context-overlay-open"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <section
            className="context-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="captain-context-title"
          >
            <div className="context-sheet-handle" />
            <header>
              <span>
                <small>CAPTAIN VIEW</small>
                <h2 id="captain-context-title">Choose your team</h2>
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </header>
            <p className="context-help">
              Your Captain Home, Team Roster, Schedule, and Payments will update together.
            </p>
            <div className="context-options">
              {contexts.map((context) => (
                <button
                  className={`context-option ${context.registrationId === active.registrationId ? "selected" : ""}`}
                  type="button"
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
                    <b>{context.teamName}</b>
                    <small>{context.seasonName}</small>
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
            {pending && <p className="context-status">Updating your captain view…</p>}
            {error && <p className="form-error">{error}</p>}
          </section>
        </div>
      )}
    </>
  );
}
