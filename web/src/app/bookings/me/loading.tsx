export default function BookingsLoading() {
  return (
    <main className="mx-auto max-w-[880px] px-6 py-10">
      <div className="mb-6 h-8 w-32 rounded-lg bg-[hsl(var(--surface-2))] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glow-card h-[120px] animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
        ))}
      </div>
    </main>
  );
}
