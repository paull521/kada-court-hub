import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileCheck,
  Mail,
  MapPin,
  Phone,
  Shirt,
  User,
} from "lucide-react";
import { LoadingNote, SkeletonBlock, SkeletonText } from "@/components/Skeleton";
import { accountLink, accountRow } from "@/components/ui/account-classes";
import { avatar, infoRow, profileCard } from "@/components/ui/shared-classes";

function InfoPanelFrame({ title, rows }: { title: string; rows: [ReactNode, string][] }) {
  return (
    <section className="card panel info-panel">
      <h2>{title}</h2>
      {rows.map(([icon, label]) => (
        <div className={infoRow} key={label}>
          <span>{icon}</span>
          <b>{label}</b>
          <em>
            <SkeletonText width="7em" />
          </em>
        </div>
      ))}
    </section>
  );
}

/**
 * Profile is the one frame with no data half. The page branches three ways on
 * the role before it renders anything, so it keeps its own body; this is what
 * its loading.tsx draws, and it is only the part that never varies - the title,
 * the panels and their labels, and the shape of the account list.
 */
export default function ProfileFrame() {
  return (
    <>
      <LoadingNote />
      <h1 className="title">Profile</h1>
      <p className="subtitle">Manage your account and player details</p>
      <section className={`card ${profileCard}`}>
        <span className={avatar} />
        <div>
          <h2>
            <SkeletonText width="8em" />
          </h2>
          <p>
            KCH Player ID: &nbsp;
            <SkeletonText width="6em" />
          </p>
          <SkeletonBlock width="5.5em" height="26px" radius="18px" />
        </div>
      </section>
      {/* No VIEW AS switcher here on purpose.
          It used to be drawn as three fixed words, on the reasoning that the
          read only decides which one is filled. That is not what the read
          decides: it decides which of them exist. A player with no conference
          was shown an Owner tab they do not have and never had, and then the
          whole card vanished, because RoleSwitcher renders nothing for an
          account with a single role. Naming roles before they are known is the
          one thing this frame cannot do, so it waits for them. */}
      {/* Edit My Profile: a disclosure, so one row high and closed. */}
      <SkeletonBlock height="58px" radius="18px" />
      <InfoPanelFrame
        title="PERSONAL INFO"
        rows={[
          [<Phone className="ui-icon" key="mobile" />, "Mobile Number"],
          [<Mail className="ui-icon" key="email" />, "Email"],
          [<CalendarDays className="ui-icon" key="birthdate" />, "Birthdate"],
          [<MapPin className="ui-icon" key="location" />, "Location"],
        ]}
      />
      <InfoPanelFrame
        title="PLAYER DETAILS"
        rows={[
          [<Shirt className="ui-icon" key="number" />, "Jersey Number"],
          [<Shirt className="ui-icon" key="jersey" />, "Jersey Name"],
          [<User className="ui-icon" key="position" />, "Position"],
          [<FileCheck className="ui-icon" key="team" />, "Team"],
          [<User className="ui-icon" key="preferred" />, "Preferred Position"],
          [<Shirt className="ui-icon" key="size" />, "Preferred Uniform Size"],
        ]}
      />
      <h2 className="profile-section-title">ACCOUNT</h2>
      <div className="profile-account-list">
        <SkeletonBlock height="58px" radius="18px" />
        <SkeletonBlock height="58px" radius="18px" />
        {/* These two are the same on every profile there has ever been. */}
        <span className={`card ${accountRow} ${accountLink}`}>
          <span>
            <BookOpen className="ui-icon" />
          </span>
          <b>Privacy &amp; Terms</b>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </span>
        <SkeletonBlock height="58px" radius="18px" />
      </div>
    </>
  );
}
