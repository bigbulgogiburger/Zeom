import { SkeletonCard } from '../../components/ui';

export default function DashboardLoading() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 grid gap-6">
      <div className="skeleton h-9 w-48 rounded-md" />
      <SkeletonCard lines={3} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    </main>
  );
}
