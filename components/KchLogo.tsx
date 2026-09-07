import Link from "next/link";

const COURTHUB = ["C", "O", "U", "R", "T"];
const HUB = ["H", "U", "B"];

/**
 * Pass `href` inside a signed-in shell and the mark becomes the way back to the
 * top of that workspace. It is left as a plain mark everywhere else - on login,
 * sign-up and the invitation screens there is nowhere for it to lead.
 *
 * The destination is the workspace's own home rather than always /home, so the
 * mark never changes which role the viewer is acting as. Switching role stays
 * the job of the Player / Captain / Owner switcher.
 */
export default function KchLogo({ className, href }: { className?: string; href?: string }) {
  const mark = (
    <span
      className={className ? `kch-logo ${className}` : "kch-logo"}
      // When the mark is inside a link the link carries the name, and a second
      // label underneath it would only be read out twice.
      {...(href ? { "aria-hidden": true } : { role: "img", "aria-label": "KadaCourtHub" })}
    >
      <span className="kch-logo-sun" />
      <span className="kch-logo-kada">
        <span className="kch-logo-k">K</span>
        <span className="kch-logo-a">A</span>DA
      </span>
      <span className="kch-logo-court">
        {COURTHUB.map((letter) => (
          <span key={letter}>{letter}</span>
        ))}
        <b>
          {HUB.map((letter, index) => (
            <span key={`${letter}${index}`}>{letter}</span>
          ))}
        </b>
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="kch-logo-home" aria-label="KadaCourtHub, back to home">
      {mark}
    </Link>
  ) : (
    mark
  );
}
