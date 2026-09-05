"use client";

import { ChevronRight } from "lucide-react";
import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/profile/actions";

const initialState: ProfileActionState = {};

export default function ProfileEditForm({
  mobile,
  email,
  birthdate,
  location,
  preferredPosition,
}: {
  mobile: string;
  email: string;
  birthdate: string;
  location: string;
  preferredPosition: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  return (
    <details className="card edit-profile">
      <summary>
        Edit My Profile{" "}
        <span aria-hidden="true">
          <ChevronRight className="go-caret" />
        </span>
      </summary>
      <form action={action}>
        <label htmlFor="editMobile">Mobile Number</label>
        <input
          id="editMobile"
          name="mobile"
          defaultValue={mobile}
          inputMode="tel"
          autoComplete="tel"
          placeholder="Your mobile number"
        />
        <label htmlFor="editEmail">Email</label>
        <input
          id="editEmail"
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <label htmlFor="editBirthdate">Birthdate</label>
        <input id="editBirthdate" name="birthdate" type="date" defaultValue={birthdate} />
        <label htmlFor="editLocation">Location</label>
        <input
          id="editLocation"
          name="location"
          defaultValue={location}
          autoComplete="address-level2"
          placeholder="City, State"
        />
        <label htmlFor="preferredPosition">Preferred Position</label>
        <select id="preferredPosition" name="preferredPosition" defaultValue={preferredPosition}>
          <option value="">Choose your preferred position</option>
          {["G", "SG", "PG", "F", "PF", "C"].map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
        <button className="btn primary" disabled={pending}>
          {pending ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </details>
  );
}
