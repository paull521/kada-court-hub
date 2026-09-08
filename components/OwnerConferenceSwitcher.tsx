"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { selectOwnerConferenceAction } from "@/app/owner/actions";
import type { OwnerConferenceOption } from "@/lib/owner-data";
import {
  contextOption,
  contextOptionMark,
  contextOptionSelected,
  contextSheet,
  contextTrigger,
} from "@/components/ui/context-classes";
import { contextHelp, contextOptions, sheetHandle } from "@/components/ui/shared-classes";

export default function OwnerConferenceSwitcher({
  conferences,
  currentId,
}: {
  conferences: OwnerConferenceOption[];
  currentId: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const returnPath = pathname === "/profile" ? "/profile?view=owner" : pathname;
  const current = conferences.find((conference) => conference.id === currentId) ?? conferences[0];
  const hasChoices = conferences.length > 1;

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  if (!current || !hasChoices) return null;

  return (
    <>
      <button
        className={`owner-context-trigger ${contextTrigger}`}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>
          <b>{current.name}</b>
        </span>
        <ChevronDown className="context-switcher-caret" aria-hidden="true" />
      </button>
      {open && (
        <div
          className="context-overlay context-overlay-open"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <section
            className={contextSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-conference-title"
          >
            <div className={sheetHandle} />
            <header>
              <span>
                <small>OWNER VIEW</small>
                <h2 id="owner-conference-title">Choose your conference</h2>
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </header>
            <p className={contextHelp}>
              Your owner workspace will update to the selected conference.
            </p>
            <div className={contextOptions}>
              {conferences.map((conference) => (
                <form action={selectOwnerConferenceAction} key={conference.id}>
                  <input type="hidden" name="conferenceId" value={conference.id} />
                  <input type="hidden" name="returnPath" value={returnPath} />
                  <button
                    className={`${contextOption} ${conference.id === current.id ? contextOptionSelected : ""}`}
                    type="submit"
                    disabled={conference.id === current.id}
                  >
                    <span className={contextOptionMark} aria-hidden="true">
                      {conference.id === current.id ? <Check className="ui-icon" /> : "K"}
                    </span>
                    <span>
                      <b>{conference.name}</b>
                      <small>Conference owner workspace</small>
                    </span>
                    <strong aria-hidden="true">
                      {conference.id === current.id ? (
                        "Current"
                      ) : (
                        <ChevronRight className="go-caret" />
                      )}
                    </strong>
                  </button>
                </form>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
