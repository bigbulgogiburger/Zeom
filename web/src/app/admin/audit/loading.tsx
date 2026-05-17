export default function AuditLoading() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-32 rounded-md bg-[hsl(var(--surface-2))] animate-pulse" />
      <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--card))] p-3">
        <div className="flex flex-wrap gap-2">
          {[160, 180, 180, 80, 110].map((w, i) => (
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
            <div className="h-4 w-44 rounded bg-[hsl(var(--surface-2))] animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-[hsl(var(--surface-2))] animate-pulse" />
          </div>
          <div className="mt-2.5 h-3.5 w-2/5 rounded bg-[hsl(var(--surface-2))] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
