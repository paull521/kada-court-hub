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

function InfoPanelFrame({ title, rows }: { title: string; rows: [ReactNode, string][] }) {
  return (
    <section className="card panel info-panel">
      <h2>{title}</h2>
      {rows.map(([icon, label]) => (
        <div className="info-row" key={label}>
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
      <section className="card profile-card">
        <span className="avatar" />
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
      {/* VIEW AS is a label and three fixed words. All the read decides is which
          one is filled, so the switcher is drawn straight away with no pill on
          it and nothing to press - anchors with no href, which are text rather
          than links until the real one takes over. */}
      <section className="card role-switcher">
        <small>VIEW AS</small>
        <div>
          <a>Player</a>
          <a>Captain</a>
          <a>Owner</a>
        </div>
      </section>
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
        <span className="card account-link">
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
