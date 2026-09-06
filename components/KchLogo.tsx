const COURTHUB = ["C", "O", "U", "R", "T"];
const HUB = ["H", "U", "B"];

export default function KchLogo({ className }: { className?: string }) {
  return (
    <span
      className={className ? `kch-logo ${className}` : "kch-logo"}
      role="img"
      aria-label="KadaCourtHub"
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
}
