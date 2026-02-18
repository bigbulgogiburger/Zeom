import Link from 'next/link';
import { Card, PageTitle } from '../components/ui';

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-10">
      <div className="max-w-[480px] w-full space-y-8 text-center">
        <PageTitle>404 -- 페이지를 찾을 수 없습니다</PageTitle>
        <Card>
          <div className="py-6 space-y-4">
            <p className="text-[#a49484] m-0">
              요청하신 페이지가 존재하지 않습니다.
            </p>
            <Link
              href="/"
              className="inline-block text-[#C9A227] font-medium hover:underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
