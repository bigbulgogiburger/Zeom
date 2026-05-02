export default function CounselorDetailLoading() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <div className="h-8 w-36 rounded-lg bg-[hsl(var(--surface-2))] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <div className="glow-card h-[280px] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <div className="glow-card h-[180px] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
        </div>
        <div className="hidden lg:block">
          <div className="glow-card h-[320px] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}
