// Original abstract line-art diagrams, one per project. Not screenshots —
// swap these out for real project imagery/video once you have it.
export default function DiagramDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="d-awp" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="100" cy="100" r="10" />
          <circle cx="40" cy="50" r="7" />
          <circle cx="160" cy="50" r="7" />
          <circle cx="40" cy="150" r="7" />
          <circle cx="160" cy="150" r="7" />
          <circle cx="100" cy="30" r="6" />
          <line x1="100" y1="100" x2="40" y2="50" />
          <line x1="100" y1="100" x2="160" y2="50" />
          <line x1="100" y1="100" x2="40" y2="150" />
          <line x1="100" y1="100" x2="160" y2="150" />
          <line x1="100" y1="100" x2="100" y2="30" />
          <line x1="40" y1="50" x2="100" y2="30" />
          <line x1="160" y1="50" x2="100" y2="30" />
        </g>
      </symbol>
      <symbol id="d-twin" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="100" cy="100" r="80" />
          <circle cx="100" cy="100" r="55" />
          <ellipse cx="100" cy="100" rx="80" ry="26" />
          <line x1="20" y1="100" x2="180" y2="100" />
          <line x1="100" y1="20" x2="100" y2="180" />
        </g>
      </symbol>
      <symbol id="d-hand" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <rect x="70" y="120" width="60" height="55" />
          <line x1="80" y1="120" x2="72" y2="40" />
          <line x1="95" y1="120" x2="90" y2="30" />
          <line x1="110" y1="120" x2="112" y2="30" />
          <line x1="125" y1="120" x2="132" y2="42" />
          <line x1="70" y1="140" x2="34" y2="150" />
        </g>
      </symbol>
      <symbol id="d-nav" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="20" y="20" width="160" height="160" />
          <line x1="20" y1="60" x2="180" y2="60" />
          <line x1="20" y1="100" x2="180" y2="100" />
          <line x1="20" y1="140" x2="180" y2="140" />
          <line x1="60" y1="20" x2="60" y2="180" />
          <line x1="140" y1="20" x2="140" y2="180" />
          <path d="M60 140 L100 100 L140 60" strokeWidth="2.4" />
          <circle cx="60" cy="140" r="5" fill="currentColor" stroke="none" />
          <circle cx="140" cy="60" r="5" fill="currentColor" stroke="none" />
        </g>
      </symbol>
      <symbol id="d-quantum" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="100" cy="100" r="60" />
          <ellipse cx="100" cy="100" rx="60" ry="22" transform="rotate(30 100 100)" />
          <ellipse cx="100" cy="100" rx="60" ry="22" transform="rotate(-30 100 100)" />
          <circle cx="100" cy="40" r="5" fill="currentColor" stroke="none" />
          <circle cx="100" cy="160" r="5" fill="currentColor" stroke="none" />
        </g>
      </symbol>
      <symbol id="d-teleop" viewBox="0 0 200 200">
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="40" y1="170" x2="90" y2="100" />
          <line x1="90" y1="100" x2="80" y2="40" />
          <line x1="80" y1="40" x2="140" y2="55" />
          <circle cx="40" cy="170" r="6" />
          <circle cx="90" cy="100" r="6" />
          <circle cx="80" cy="40" r="6" />
          <circle cx="140" cy="55" r="6" />
        </g>
      </symbol>
    </svg>
  );
}
