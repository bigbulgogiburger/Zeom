export default function NotificationsLoading() {
  return (
    <main className="mx-auto max-w-[800px] px-6 py-12 grid gap-3">
      <div className="flex justify-between items-center mb-4">
        <div className="skeleton h-8 w-16" />
        <div className="skeleton h-7 w-20 rounded-full" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] p-4"
        >
          <div className="skeleton h-3 w-20 mb-2" />
          <div className="skeleton h-4 w-[70%] mb-1.5" />
          <div className="skeleton h-3 w-[50%]" />
        </div>
      ))}
    </main>
  );
}
