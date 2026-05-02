export default function CounselorsLoading() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-6 h-8 w-40 rounded-lg bg-[hsl(var(--surface-2))] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="glow-card h-[220px] animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
        ))}
      </div>
    </main>
  );
}
