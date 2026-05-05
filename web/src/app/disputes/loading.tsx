import { SkeletonCard } from '../../components/ui';

export default function DisputesLoading() {
  return (
    <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 grid gap-4">
      <div className="skeleton h-8 w-32 rounded-md" />
      {[1, 2].map((i) => (
        <SkeletonCard key={i} lines={3} />
      ))}
    </main>
  );
}
