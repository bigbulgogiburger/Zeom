import { getTranslations } from 'next-intl/server';
import { EmptyStateCard } from '../components/empty-state';

export default async function NotFound() {
  const t = await getTranslations('errors');

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-10">
      <div className="max-w-[480px] w-full">
        <EmptyStateCard
          icon="🔮"
          title={t('notFound')}
          description={t('notFoundDescription')}
          actionLabel={t('goHome')}
          actionHref="/"
        />
      </div>
    </main>
  );
}
