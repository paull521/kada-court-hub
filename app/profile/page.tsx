import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  FileCheck,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shirt,
  User,
} from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import NotificationPreferencesForm from "@/components/NotificationPreferencesForm";
import ProfileEditForm from "@/components/ProfileEditForm";
import RoleSwitcher from "@/components/RoleSwitcher";
import { logoutAction } from "@/app/auth/actions";
import { getPlayerPortalData } from "@/lib/kch-data";
import { getAvailableRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getOwnerProfileSummary } from "@/lib/owner-data";
import { OwnerSupportRequest } from "@/components/PlatformOperations";
import PlatformFeedback from "@/components/PlatformFeedback";
import OwnerConferenceSwitcher from "@/components/OwnerConferenceSwitcher";
import "@/components/ProfileCleanup.css";
import { accountLink, accountRow } from "@/components/ui/account-classes";
import {
  accountList,
  avatar,
  infoRow,
  logoutAccount,
  panel,
  profileCard,
  profileSectionTitle,
  statusPill,
} from "@/components/ui/shared-classes";

function InfoPanel({
  title,
  rows,
}: {
  title: string;
  // The leading cell is an icon element now, so the row is no longer all strings.
  rows: (ReactNode | string)[][];
}) {
  return (
    <section className={`card ${panel} [&>h2]:mb-[5px] [&_form]:m-0`}>
      <h2>{title}</h2>
      {rows.map(([icon, label, value]) => (
        <div className={infoRow} key={String(label)}>
          <span>{icon}</span>
          <b>{label}</b>
          <em>{value}</em>
        </div>
      ))}
    </section>
  );
}

export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const requestedView = (await searchParams).view;
  // The owner read used to be awaited only after getAvailableRoles() came back,
  // which put its round trips *after* the whole player portal had finished -
  // the two never overlapped, and this was the slowest route in the app because
  // of it. Starting it here costs nothing when the viewer turns out not to be
  // an owner: it returns the unauthorized empty record as soon as its
  // membership read comes back.
  const ownerDataPromise = requestedView === "owner" ? getOwnerProfileSummary() : null;
  const [data, roles, supabase] = await Promise.all([
    getPlayerPortalData("profile"),
    getAvailableRoles(),
    createClient(),
  ]);
  const ownerMode = requestedView === "owner" && roles.owner;
  // Awaited whenever it was started, never only when ownerMode holds - a
  // started promise that nothing awaits becomes an unhandled rejection if the
  // read fails, and swallowing it here would hide a real error behind an empty
  // owner panel.
  const ownerPortal = ownerDataPromise ? await ownerDataPromise : null;
  const ownerData = ownerMode ? ownerPortal : null;
  const [{ data: ownerSupportRows }] = await Promise.all([
    ownerData?.authorized
      ? supabase
          .from("platform_support_requests")
          .select("id,subject,message,status,created_at")
          .eq("conference_id", ownerData.conferenceId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const currentRole = ownerMode
    ? "owner"
    : requestedView === "captain" && roles.captain
      ? "captain"
      : "player";
  const player = data.profile,
    context = data.context;
  const personal = [
    [<Phone className="ui-icon" />, "Mobile Number", player.mobile || "Not provided"],
    [<Mail className="ui-icon" />, "Email", player.email],
    [<CalendarDays className="ui-icon" />, "Birthdate", player.birthdate || "Not provided"],
    [<MapPin className="ui-icon" />, "Location", player.location || "Not provided"],
  ];
  const details = [
    [<Shirt className="ui-icon" />, "Jersey Number", String(player.jerseyNumber || "Not assigned")],
    [<Shirt className="ui-icon" />, "Jersey Name", player.jerseyName || "Not assigned"],
    [<User className="ui-icon" />, "Position", player.position || "Not assigned"],
    [<FileCheck className="ui-icon" />, "Team", context.team],
    [
      <User className="ui-icon" />,
      "Preferred Position",
      player.preferredPosition || "Please complete",
    ],
    [<Shirt className="ui-icon" />, "Preferred Uniform Size", player.uniformSize || "Not provided"],
  ];
  const playerDocumentsLink = currentRole !== "owner" ? (
    <Link
      href={`/player-documents${data.activeRegistrationId ? `?registration=${data.activeRegistrationId}&view=${currentRole}` : `?view=${currentRole}`}`}
      prefetch
      // desk: replaces two ancestor-scoped rules in desktop.css. This row
      // renders only on /profile, which is the one place either could reach.
      className="card grid grid-cols-[38px_minmax(0,1fr)_20px] items-center gap-[12px] p-[14px_15px] desk:w-full desk:justify-self-center"
    >
      <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] bg-[#fff2d7] text-[19px] font-[900] text-gold">
        <BookOpen className="ui-icon" />
      </span>
      <b className="text-[15px]">Player Documents</b>
      <strong aria-hidden="true" className="text-right text-[24px]">
        <ChevronRight className="go-caret" />
      </strong>
    </Link>
  ) : null;
  const ownerProfileContent = ownerData?.authorized ? (
    <>
      <section className={`card ${profileCard}`}>
        <span className={avatar}>
          {ownerData.ownerName
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <div>
          <h2>{ownerData.ownerName}</h2>
          <p>Conference Owner</p>
          <b className={statusPill}>● &nbsp;Active</b>
        </div>
      </section>
      <RoleSwitcher roles={roles} current="owner" profile />
      <InfoPanel title="PERSONAL INFO" rows={personal} />
      <InfoPanel
        title="CONFERENCE DETAILS"
        rows={[
          [<FileCheck className="ui-icon" />, "Conference Name", ownerData.conferenceName],
          [
            <Clock className="ui-icon" />,
            "Season Active",
            ownerData.activeSeasonName || "No active season",
          ],
          [
            <CalendarDays className="ui-icon" />,
            "Divisions Active",
            ownerData.activeSeasonDivisions.join(", ") || "No active divisions",
          ],
        ]}
      />
      <h2 className={profileSectionTitle}>ACCOUNT</h2>
      <div className={accountList}>
        <PlatformFeedback conferenceId={ownerData.conferenceId} />
        <NotificationPreferencesForm preferences={data.notificationPreferences} />
        <Link href="/documents" className={`card ${accountRow} ${accountLink}`}>
          <span>
            <BookOpen className="ui-icon" />
          </span>
          <b>Documents</b>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        <Link
          href={`/legal?view=${currentRole}`}
          // desk: replaces an ancestor-scoped rule in desktop.css. This row
          // renders only on /profile, the one place that rule could reach.
          className={`card ${accountRow} ${accountLink} desk:w-full desk:justify-self-center`}
        >
          <span>
            <BookOpen className="ui-icon" />
          </span>
          <b>Privacy &amp; Terms</b>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        <OwnerSupportRequest
          conferenceId={ownerData.conferenceId}
          history={(ownerSupportRows ?? []).map((row) => ({
            id: row.id,
            subject: row.subject,
            message: row.message,
            status: row.status,
            createdAt: row.created_at,
          }))}
        />
        <form action={logoutAction}>
          <button className={`card ${logoutAccount} ${accountRow} ${accountLink}`}>
            <span>
              <LogOut className="ui-icon" />
            </span>
            <b>Log Out</b>
            <strong aria-hidden="true">
              <ChevronRight className="go-caret" />
            </strong>
          </button>
        </form>
      </div>
    </>
  ) : null;
  const profileContent = (
    <>
      <section className={`card ${profileCard}`}>
        <span className={avatar}>{player.initials}</span>
        <div>
          <h2>{player.name}</h2>
          <p>KCH Player ID: &nbsp;{player.id}</p>
          <b className={statusPill}>● &nbsp;{player.status}</b>
        </div>
      </section>
      <RoleSwitcher roles={roles} current={currentRole} profile />
      <ProfileEditForm
        mobile={player.mobile}
        email={player.email}
        birthdate={player.birthdateValue}
        location={player.location}
        preferredPosition={player.preferredPosition}
      />
      <InfoPanel title="PERSONAL INFO" rows={personal} />
      <InfoPanel title="PLAYER DETAILS" rows={details} />
      <h2 className={profileSectionTitle}>ACCOUNT</h2>
      <div className={accountList}>
        {ownerData?.authorized ? (
          <PlatformFeedback conferenceId={ownerData.conferenceId} />
        ) : data.contexts.length > 0 ? (
          <PlatformFeedback
            conferenceId={
              data.contexts.find((item) => item.registrationId === data.activeRegistrationId)
                ?.conferenceId ?? ""
            }
          />
        ) : null}
        <NotificationPreferencesForm preferences={data.notificationPreferences} />
        {playerDocumentsLink}
        <Link
          href={`/legal?view=${currentRole}`}
          // desk: replaces an ancestor-scoped rule in desktop.css. This row
          // renders only on /profile, the one place that rule could reach.
          className={`card ${accountRow} ${accountLink} desk:w-full desk:justify-self-center`}
        >
          <span>
            <BookOpen className="ui-icon" />
          </span>
          <b>Privacy &amp; Terms</b>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </Link>
        {ownerData?.authorized && (
          <OwnerSupportRequest
            conferenceId={ownerData.conferenceId}
            history={(ownerSupportRows ?? []).map((row) => ({
              id: row.id,
              subject: row.subject,
              message: row.message,
              status: row.status,
              createdAt: row.created_at,
            }))}
          />
        )}
        <form action={logoutAction}>
          <button className={`card ${logoutAccount} ${accountRow} ${accountLink}`}>
            <span>
              <LogOut className="ui-icon" />
            </span>
            <b>Log Out</b>
            <strong aria-hidden="true">
              <ChevronRight className="go-caret" />
            </strong>
          </button>
        </form>
      </div>
    </>
  );
  return (
    <AppShell
      active="profile"
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
      role={currentRole}
      contentClass={currentRole === "player" ? "player-profile-content" : "role-profile-content"}
      headerAction={
        ownerData?.authorized ? (
          <OwnerConferenceSwitcher
            conferences={ownerData.conferences}
            currentId={ownerData.conferenceId}
          />
        ) : undefined
      }
    >
      {
        <>
          <h1 className="title">Profile</h1>
          <p className="subtitle">Manage your account and player details</p>
          {ownerProfileContent ?? profileContent}
        </>
      }
    </AppShell>
  );
}
