export default function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base dark background */}
      <div className="absolute inset-0" style={{ background: '#0B1026' }} />

      {/* Radial glow — gold, top-left */}
      <div
        className="blob absolute -top-60 -left-60 w-[36rem] h-[36rem] rounded-full blur-3xl animate-float-1"
        style={{ background: 'radial-gradient(circle, rgba(245,199,107,0.10) 0%, transparent 70%)' }}
      />

      {/* Radial glow — coral, bottom-right */}
      <div
        className="blob absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full blur-3xl animate-float-2"
        style={{ background: 'radial-gradient(circle, rgba(255,107,91,0.08) 0%, transparent 70%)' }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'linear-gradient(rgba(242,238,227,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(242,238,227,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)',
        }}
      />

      {/* Rotating orbit circle */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.06] pointer-events-none"
      >
        <svg viewBox="0 0 600 600" width="100%" height="100%">
          <circle cx="300" cy="300" r="280" fill="none" stroke="#F5C76B" strokeWidth="1" strokeDasharray="3 10">
            <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="60s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
    </div>
  );
}
