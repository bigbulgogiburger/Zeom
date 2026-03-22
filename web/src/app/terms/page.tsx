import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관',
  description: '천지연꽃신당 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <main
      className="mx-auto px-6 py-10"
      style={{
        maxWidth: 800,
        color: 'hsl(var(--text-primary))',
        lineHeight: 1.8,
      }}
    >
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--gold))' }}
      >
        이용약관
      </h1>

      <p className="mb-8" style={{ color: 'hsl(var(--text-secondary))', fontSize: 14 }}>
        시행일: 2026년 3월 1일
      </p>

      <Section title="제1조 (목적)">
        <p>
          이 약관은 천지연꽃신당(이하 &quot;회사&quot;)이 제공하는 온라인 점사 및 상담
          예약 서비스(이하 &quot;서비스&quot;)의 이용 조건과 절차, 회사와 회원 간의 권리,
          의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (용어의 정의)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>&quot;회원&quot;이란 이 약관에 동의하고 회원가입을 완료한 자를 말합니다.</li>
          <li>&quot;상담사&quot;란 회사에 등록하여 상담 서비스를 제공하는 자를 말합니다.</li>
          <li>
            &quot;캐시&quot;란 서비스 내에서 상담 이용 시 결제 수단으로 사용되는 가상의
            전자적 지불 수단을 말합니다.
          </li>
          <li>
            &quot;예약&quot;이란 회원이 상담사의 특정 시간대를 선택하여 상담을 신청하는
            행위를 말합니다.
          </li>
        </ol>
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써
            효력이 발생합니다.
          </li>
          <li>
            회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경
            시 적용일자 및 변경 사유를 명시하여 7일 이전에 공지합니다.
          </li>
          <li>
            회원이 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수
            있습니다.
          </li>
        </ol>
      </Section>

      <Section title="제4조 (회원가입 및 이용 계약)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            이용 계약은 회원이 약관에 동의하고, 회사가 이를 승인함으로써 성립합니다.
          </li>
          <li>
            회원은 가입 시 정확하고 최신의 정보를 제공해야 하며, 변경 사항이 있을 경우
            즉시 수정해야 합니다.
          </li>
          <li>
            회사는 다음의 경우 가입을 거부하거나 이용 계약을 해지할 수 있습니다:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>타인의 정보를 도용한 경우</li>
              <li>허위 정보를 기재한 경우</li>
              <li>관련 법령 또는 약관을 위반한 경우</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title="제5조 (서비스의 제공 및 이용)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            회사는 다음의 서비스를 제공합니다:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>상담사 프로필 열람 및 검색</li>
              <li>상담 예약 및 일정 관리</li>
              <li>화상/채팅 상담 서비스</li>
              <li>캐시 충전 및 결제</li>
              <li>운세 서비스</li>
              <li>리뷰 작성 및 열람</li>
            </ul>
          </li>
          <li>
            서비스는 연중무휴, 1일 24시간 제공을 원칙으로 하되, 시스템 점검 등의 사유로
            일시 중단될 수 있습니다.
          </li>
        </ol>
      </Section>

      <Section title="제6조 (결제 및 환불)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            캐시 충전은 회사가 제공하는 결제 수단(신용카드, 계좌이체 등)을 통해
            이루어집니다.
          </li>
          <li>
            상담 예약 시 해당 상담 비용만큼의 캐시가 차감됩니다.
          </li>
          <li>
            환불은 다음 기준에 따릅니다:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>상담 시작 24시간 전 취소: 전액 환불</li>
              <li>상담 시작 12시간 전 취소: 50% 환불</li>
              <li>상담 시작 12시간 이내 취소: 환불 불가</li>
              <li>상담사 귀책 사유로 인한 취소: 전액 환불</li>
            </ul>
          </li>
          <li>
            미사용 캐시의 환불은 전자상거래 등에서의 소비자보호에 관한 법률에 따릅니다.
          </li>
        </ol>
      </Section>

      <Section title="제7조 (회원의 의무)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>회원은 관계 법령, 약관, 이용 안내를 준수하여야 합니다.</li>
          <li>
            회원은 다음 행위를 해서는 안 됩니다:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>타인의 개인정보를 도용하는 행위</li>
              <li>상담 내용을 무단으로 녹음, 녹화, 유포하는 행위</li>
              <li>상담사에게 불쾌감을 주거나 위협하는 행위</li>
              <li>서비스를 부정한 목적으로 이용하는 행위</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title="제8조 (면책 조항)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            회사는 상담사가 제공하는 상담 내용의 정확성, 신뢰성에 대해 보증하지
            않습니다. 상담 결과에 대한 최종 판단과 책임은 회원에게 있습니다.
          </li>
          <li>
            회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력으로 인한
            서비스 중단에 대해 책임을 지지 않습니다.
          </li>
          <li>
            회사는 회원의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
          </li>
        </ol>
      </Section>

      <Section title="제9조 (분쟁 해결)">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 회원은 원만한 해결을
            위하여 성실히 협의합니다.
          </li>
          <li>
            협의가 이루어지지 않을 경우 관할 법원은 민사소송법상의 관할 법원으로 합니다.
          </li>
        </ol>
      </Section>

      <div
        className="mt-10 pt-6"
        style={{ borderTop: '1px solid hsl(var(--border-subtle))' }}
      >
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: 13 }}>
          본 약관은 2026년 3월 1일부터 시행됩니다.
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2
        className="text-lg font-bold mb-3"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15 }}>{children}</div>
    </section>
  );
}
