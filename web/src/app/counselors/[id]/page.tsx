import CounselorDetailClient from './CounselorDetailClient';

export default async function CounselorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CounselorDetailClient id={id} />;
}
