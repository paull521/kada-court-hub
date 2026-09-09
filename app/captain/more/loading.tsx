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
      <section className="card m-[16px_0] grid gap-[10px] p-4 [&>small]:font-[800] [&>small]:tracking-[0.08em] [&>small]:text-[#a85d00] [&>div]:relative [&>div]:grid [&>div]:auto-cols-fr [&>div]:grid-flow-col [&>div]:gap-[6px] [&>div]:rounded-[14px] [&>div]:bg-[#eef1f4] [&>div]:p-1">
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
