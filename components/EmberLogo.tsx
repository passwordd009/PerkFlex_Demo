export function EmberLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer 8-point sparkle rays */}
      {/* Top */}
      <line x1="50" y1="5" x2="50" y2="22" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Bottom */}
      <line x1="50" y1="78" x2="50" y2="95" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Left */}
      <line x1="5" y1="50" x2="22" y2="50" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Right */}
      <line x1="78" y1="50" x2="95" y2="50" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Top-right diagonal */}
      <line x1="70" y1="10" x2="62" y2="28" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Bottom-left diagonal */}
      <line x1="30" y1="72" x2="38" y2="90" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Top-left diagonal */}
      <line x1="30" y1="10" x2="38" y2="28" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Bottom-right diagonal */}
      <line x1="70" y1="90" x2="62" y2="72" stroke="#FF4D00" strokeWidth="7" strokeLinecap="round"/>
      {/* Center diamond */}
      <polygon
        points="50,30 65,50 50,70 35,50"
        stroke="#FF4D00"
        strokeWidth="5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
