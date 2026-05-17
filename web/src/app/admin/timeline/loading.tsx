export default function TimelineLoading() {
  return (
    <div className="space-y-3.5">
      <div className="h-8 w-44 rounded-md bg-[hsl(var(--surface-2))] animate-pulse" />
      <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--card))] p-3">
        <div className="flex flex-wrap gap-2">
          {[100, 120, 120, 100, 180, 180, 60].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded bg-[hsl(var(--surface-2))] animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--card))] p-3"
        >
          <div className="flex justify-between">
            <div className="h-4 w-52 rounded bg-[hsl(var(--surface-2))] animate-pulse" />
            <div className="flex gap-1.5">
              <div className="h-5 w-14 rounded-full bg-[hsl(var(--surface-2))] animate-pulse" />
              <div className="h-5 w-12 rounded-full bg-[hsl(var(--surface-2))] animate-pulse" />
            </div>
          </div>
          <div className="mt-2.5 h-3.5 w-1/2 rounded bg-[hsl(var(--surface-2))] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
