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
import { getOwnerPortalData } from "@/lib/owner-data";
import { OwnerSupportRequest } from "@/components/PlatformOperations";
import PlatformFeedback from "@/components/PlatformFeedback";
import OwnerConferenceSwitcher from "@/components/OwnerConferenceSwitcher";
import "@/components/ProfileCleanup.module.css";

function InfoPanel({
  title,
  rows,
}: {
  title: string;
  // The leading cell is an icon element now, so the row is no longer all strings.
  rows: (ReactNode | string)[][];
}) {
  return (
    <section className="card panel info-panel">
      <h2>{title}</h2>
      {rows.map(([icon, label, value]) => (
        <div className="info-row" key={String(label)}>
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
  const [data, roles, supabase] = await Promise.all([
    getPlayerPortalData("profile"),
    getAvailableRoles(),
    createClient(),
  ]);
  const ownerMode = requestedView === "owner" && roles.owner;
  const ownerData = ownerMode ? await getOwnerPortalData() : null;
  const [{ data: rulesAcknowledgments }, { data: requiredRules }] = await Promise.all([
    supabase.rpc("get_player_rule_acknowledgments"),
    data.activeRegistrationId
      ? supabase.rpc("get_registration_rules", { p_registration_id: data.activeRegistrationId })
      : Promise.resolve({ data: null }),
  ]);
  const currentRole = ownerMode
    ? "owner"
    : requestedView === "captain" && roles.captain
      ? "captain"
      : "player";
  const { data: ownerSupportRows } = ownerData?.authorized
    ? await supabase
        .from("platform_support_requests")
        .select("id,subject,message,status,created_at")
        .eq("conference_id", ownerData.conferenceId)
        .order("created_at", { ascending: false })
    : { data: [] };
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
  const currentRule = requiredRules?.[0] as
    { rules_document_id: string; acknowledged_at: string | null } | undefined;
  const acknowledgments = (rulesAcknowledgments ?? []) as {
    acknowledgment_id: string;
    rules_document_id: string;
    acknowledged_at: string;
  }[];
  const acknowledgedRule =
    acknowledgments.find((ack) => ack.rules_document_id === currentRule?.rules_document_id) ??
    acknowledgments[0];
  const rulesLink =
    currentRule && !currentRule.acknowledged_at ? (
      <Link
        href={`/rules?registration=${data.activeRegistrationId}`}
        className="card rules-account-link"
      >
        <span>
          <BookOpen className="ui-icon" />
        </span>
        <b>Rules &amp; Discipline</b>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </Link>
    ) : acknowledgedRule ? (
      <Link
        href={`/rules?acknowledgment=${acknowledgedRule.acknowledgment_id}`}
        className="card rules-account-link"
      >
        <span>
          <BookOpen className="ui-icon" />
        </span>
        <b>Rules &amp; Discipline</b>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </Link>
    ) : null;
  const today = new Date().toISOString().slice(0, 10),
    activeSeason =
      ownerData?.seasons.find(
        (season) => !season.canceledAt && season.startsOn <= today && season.endsOn >= today,
      ) ??
      ownerData?.seasons.find((season) => !season.canceledAt) ??
      null;
  const ownerProfileContent = ownerData?.authorized ? (
    <>
      <section className="card profile-card">
        <span className="avatar">
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
          <b className="status">● &nbsp;Active</b>
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
            activeSeason?.name ?? "No active season",
          ],
          [
            <CalendarDays className="ui-icon" />,
            "Divisions Active",
            activeSeason?.divisions.map((division) => division.name).join(", ") ||
              "No active divisions",
          ],
        ]}
      />
      <h2 className="profile-section-title">ACCOUNT</h2>
      <div className="profile-account-list">
        <PlatformFeedback conferenceId={ownerData.conferenceId} />
        <NotificationPreferencesForm preferences={data.notificationPreferences} />
        <Link href="/legal" className="card account-link">
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
          <button className="card account-link logout-account">
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
      <section className="card profile-card">
        <span className="avatar">{player.initials}</span>
        <div>
          <h2>{player.name}</h2>
          <p>KCH Player ID: &nbsp;{player.id}</p>
          <b className="status">● &nbsp;{player.status}</b>
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
      <h2 className="profile-section-title">ACCOUNT</h2>
      <div className="profile-account-list">
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
        {rulesLink}
        <Link href="/legal" className="card account-link">
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
          <button className="card account-link logout-account">
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
      contexts={data.contexts}
      activeRegistrationId={data.activeRegistrationId}
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
      homeHref={
        currentRole === "owner" ? "/owner" : currentRole === "captain" ? "/captain" : "/home"
      }
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
