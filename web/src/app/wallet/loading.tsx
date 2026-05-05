export default function WalletLoading() {
  return (
    <main className="mx-auto max-w-[1000px] px-6 py-10 grid gap-6">
      <div className="skeleton h-8 w-24" />
      <div className="mx-auto w-full max-w-[520px] rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] p-10 text-center">
        <div className="skeleton h-3.5 w-20 mx-auto mb-4" />
        <div className="skeleton h-10 w-48 mx-auto mb-6" />
        <div className="skeleton h-11 w-32 mx-auto rounded-full" />
      </div>
      <div className="skeleton h-6 w-24" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] p-6"
        >
          <div className="flex justify-between">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-20" />
          </div>
          <div className="skeleton h-3 w-2/5 mt-2" />
        </div>
      ))}
    </main>
  );
}
