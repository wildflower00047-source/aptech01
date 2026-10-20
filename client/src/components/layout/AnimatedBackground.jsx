export const AnimatedBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-grid opacity-70 dark:opacity-40" />
    <div className="absolute -left-24 -top-24 h-96 w-96 animate-float-slow rounded-full bg-brand-500/25 blur-3xl" />
    <div className="absolute right-0 top-1/3 h-80 w-80 animate-float-slower rounded-full bg-violet-500/20 blur-3xl" />
    <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-float-slow rounded-full bg-fuchsia-500/20 blur-3xl" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-50 dark:to-ink-950" />
  </div>
);

export default AnimatedBackground;
