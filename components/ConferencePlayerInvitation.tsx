"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * The QR invitation panel, drawn on the owner's home and the captain's.
 *
 * MIGRATION.md had this down as entangled, and the entanglement was that the
 * two sizes lived in CSS as ancestor re-scopes - .owner-action-grid set one,
 * .captain-content the other, and a third rule at 900px sized both again. The
 * caller knows which workspace it is in; the stylesheet had to guess from
 * where the element landed. So it is a prop now.
 */
export default function ConferencePlayerInvitation({
  token,
  variant = "owner",
}: {
  token: string;
  variant?: "owner" | "captain";
}) {
  const [copied, setCopied] = useState(false),
    [qrCode, setQrCode] = useState("");
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/invite/${token}`;
  useEffect(() => {
    if (!link) return;
    void QRCode.toDataURL(link, {
      width: 180,
      margin: 1,
      color: { dark: "#071f3d", light: "#ffffff" },
    }).then(setQrCode);
  }, [link]);
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <section
      className={
        variant === "captain"
          ? "card col-span-full m-[12px_0_0] grid grid-cols-[minmax(0,1fr)_116px] items-center gap-3 p-[14px] max-tiny:grid-cols-[minmax(0,1fr)_104px] desk:max-w-[430px] [&_.btn]:text-xs [&_.btn]:whitespace-nowrap [&_img]:h-[116px] [&_img]:w-[116px] [&_img]:max-tiny:h-[104px] [&_img]:max-tiny:w-[104px]"
          : "card col-span-full m-0 grid grid-cols-[minmax(0,1fr)_180px] items-center gap-4 p-4 max-tiny:grid-cols-1 desk:max-w-[470px] desk:grid-cols-[minmax(0,1fr)_132px] desk:p-[18px] [&_img]:h-[180px] [&_img]:w-[180px] [&_img]:max-tiny:justify-self-center desk:[&_img]:h-[132px] desk:[&_img]:w-[132px]"
      }
    >
      <div className="grid gap-3">
        <button type="button" className="btn secondary" onClick={copy}>
          {copied ? "Copied!" : "Conference Player Invitation"}
        </button>
      </div>
      {qrCode && (
        <img
          src={qrCode}
          alt="Conference invitation QR code"
          className="justify-self-end rounded-xl bg-white"
        />
      )}
    </section>
  );
}
