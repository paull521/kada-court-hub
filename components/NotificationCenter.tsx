"use client";

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
                    className={`notification-item ${notification.read ? "" : "unread"}`}
                    disabled={pending}
                    onClick={() => openNotification(notification)}
                    key={notification.id}
                  >
                    <i aria-hidden="true">
                      {notification.type.includes("game")
                        ? "▦"
                        : notification.type.includes("roster")
                          ? "♟"
                          : "✦"}
                    </i>
                    <span>
                      <b>{notification.title}</b>
                      <small>{notification.body}</small>
                      <em>{notification.createdLabel}</em>
                    </span>
                    <strong aria-hidden="true">›</strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="notification-empty">
                <span>✓</span>
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
