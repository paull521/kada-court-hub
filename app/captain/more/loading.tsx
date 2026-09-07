import CaptainShellFrame from "@/components/CaptainShellFrame";
import CaptainMoreLinks from "@/components/CaptainMoreLinks";

/**
 * Only the role switcher waits here, and only to know which roles the account
 * holds - so it is drawn with nothing selected and nothing to press, and the
 * three links under it are the real ones.
 */
export default function Loading() {
  return (
    <CaptainShellFrame active="more" title="More" subtitle="Captain settings and role tools.">
      <section className="card role-switcher">
        <small>VIEW AS</small>
        <div>
          <a>Player</a>
          <a>Captain</a>
          <a>Owner</a>
        </div>
      </section>
      <CaptainMoreLinks />
    </CaptainShellFrame>
  );
}
