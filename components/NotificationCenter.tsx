"use client";

import { CalendarDays, Check, ChevronRight, Sparkles, Users } from "lucide-react";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/notifications/actions";
import type { PlayerNotification } from "@/lib/kch-data";

export default function NotificationCenter({
  notifications,
}: {
  notifications: PlayerNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const unread = notifications.filter((notification) => !notification.read).length;

  function openNotification(notification: PlayerNotification) {
    startTransition(async () => {
      if (!notification.read) {
        const result = await markNotificationReadAction(notification.id);
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      setOpen(false);
      router.push(notification.linkPath || "/home");
      router.refresh();
    });
  }
  function markAll() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        className="notification"
        type="button"
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        onClick={() => setOpen(true)}
      >
        🔔{unread > 0 && <span />}
      </button>
      {open && (
        <div
          className="context-overlay"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <section
            className="context-sheet notification-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-title"
          >
            <div className="context-sheet-handle" />
            <header>
              <span>
                <small>PLAYER UPDATES</small>
                <h2 id="notification-title">Notifications</h2>
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </header>
            {unread > 0 && (
              <button className="mark-all" type="button" disabled={pending} onClick={markAll}>
                Mark all as read
              </button>
            )}
            {notifications.length ? (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <button
                    type="button"
                    className={`grid min-h-[78px] w-full grid-cols-[40px_1fr_auto] items-center gap-[11px] rounded-[15px] border border-line bg-white p-[13px] text-left [&>i]:grid [&>i]:h-[38px] [&>i]:w-[38px] [&>i]:place-items-center [&>i]:rounded-xl [&>i]:bg-[#eef3f8] [&>i]:text-[19px] [&>i]:text-blue [&>i]:not-italic [&>span]:grid [&>span]:min-w-0 [&>span]:gap-1 [&_b]:text-[15px] [&_b]:leading-[1.25] [&_small]:text-[13px] [&_small]:leading-[1.4] [&_small]:text-muted [&_em]:text-xs [&_em]:text-[#85909e] [&_em]:not-italic [&>strong]:text-[23px] ${
                      notification.read
                        ? ""
                        : "border-[#e8c98f]! bg-[#fffbf3]! [&>i]:bg-[#fff0d5] [&>i]:text-gold"
                    }`}
                    disabled={pending}
                    onClick={() => openNotification(notification)}
                    key={notification.id}
                  >
                    <i aria-hidden="true">
                      {notification.type.includes("game") ? (
                        <CalendarDays />
                      ) : notification.type.includes("roster") ? (
                        <Users />
                      ) : (
                        <Sparkles />
                      )}
                    </i>
                    <span>
                      <b>{notification.title}</b>
                      <small>{notification.body}</small>
                      <em>{notification.createdLabel}</em>
                    </span>
                    <strong aria-hidden="true">
                      <ChevronRight />
                    </strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-[30px_15px] text-center [&>span]:mx-auto [&>span]:grid [&>span]:h-[52px] [&>span]:w-[52px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#e8f4e8] [&>span]:text-[25px] [&>span]:text-green [&>h3]:m-[13px_0_6px] [&>h3]:text-[19px] [&>p]:m-0 [&>p]:text-sm [&>p]:leading-[1.5] [&>p]:text-muted">
                <span>
                  <Check />
                </span>
                <h3>You’re all caught up</h3>
                <p>Game, roster, and season updates will appear here.</p>
              </div>
            )}
            {error && <p className="form-error">{error}</p>}
          </section>
        </div>
      )}
    </>
  );
}
