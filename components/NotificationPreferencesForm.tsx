"use client";

import { Bell, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  updateNotificationPreferencesAction,
  type PreferenceActionState,
} from "@/app/profile/notification-actions";
import type { NotificationPreferences } from "@/lib/kch-data";
import { accountDisclosure, accountRow } from "@/components/ui/account-classes";

const options = [
  ["gameUpdates", "Games & scores", "Schedule changes and final scores"],
  ["teamUpdates", "Team & roster", "Roster publication and team changes"],
  ["paymentUpdates", "Payments", "Payment reviews and balance updates"],
  ["seasonUpdates", "Seasons", "Invitations, deadlines, and cancellations"],
] as const;

export default function NotificationPreferencesForm({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const [values, setValues] = useState(preferences),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  async function change(name: keyof NotificationPreferences, next: boolean) {
    const previous = values;
    const updated = { ...values, [name]: next };
    setValues(updated);
    setSaving(true);
    setError("");
    const formData = new FormData();
    for (const [key, enabled] of Object.entries(updated)) if (enabled) formData.set(key, "on");
    const result = await updateNotificationPreferencesAction({} as PreferenceActionState, formData);
    if (result.error) {
      setValues(previous);
      setError(result.error);
    }
    setSaving(false);
  }
  return (
    <details className={`card ${accountDisclosure}`}>
      <summary className={accountRow}>
        <span>
          <Bell className="ui-icon" />
        </span>
        <b>Notification Preferences</b>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="grid gap-0 border-t border-line p-[4px_16px_16px] [&>.btn]:mt-[14px] [&>.btn]:min-h-[48px] [&>.btn]:text-[15px] [&>p]:my-[12px] [&>p]:mb-[5px] [&>p]:text-[13px] [&>p]:leading-[1.5] [&>p]:text-muted">
        <p>Choose what appears in your notification bell.</p>
        {options.map(([name, label, help]) => (
          <label
            className="grid min-h-[68px] cursor-pointer grid-cols-[1fr_50px] items-center gap-[12px] border-b border-line"
            key={name}
          >
            <span className="grid gap-[4px]">
              <b className="text-[15px]">{label}</b>
              <small className="text-[12px] leading-[1.35] text-muted">{help}</small>
            </span>
            {/* The switch: a bare checkbox with its knob drawn as an ::after. */}
            <input
              className="relative m-0 h-[28px] w-[48px] appearance-none rounded-[20px] border-0 bg-[#c8cdd3] transition-[background] duration-[160ms] after:absolute after:top-[3px] after:left-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:shadow-[0_1px_4px_rgba(0,0,0,0.22)] after:transition-transform after:duration-[160ms] after:content-[''] checked:bg-green checked:after:translate-x-[20px]"
              type="checkbox"
              checked={values[name]}
              onChange={(event) => change(name, event.target.checked)}
              disabled={saving}
            />
          </label>
        ))}
        {error && <p className="form-error">{error}</p>}
      </div>
    </details>
  );
}
