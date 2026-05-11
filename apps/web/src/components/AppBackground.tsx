export default function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Radial gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 15%, #eef2ff 0%, #ffffff 55%, #f0fdf4 100%)',
        }}
      />

      {/* Blob 1 — indigo, top-left */}
      <div className="blob absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-indigo-400/20 blur-3xl animate-float-1" />

      {/* Blob 2 — violet, right-center */}
      <div className="blob absolute top-1/3 -right-56 w-[36rem] h-[36rem] rounded-full bg-violet-400/15 blur-3xl animate-float-2" />

      {/* Blob 3 — cyan, bottom-left */}
      <div className="blob absolute -bottom-40 left-1/4 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl animate-float-3" />
    </div>
  );
}
