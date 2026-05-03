import type { Metadata } from 'next';
import { AnchorNav, type AnchorNavItem } from '@/components/design';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '천지연꽃신당 개인정보처리방침',
};

const sections: AnchorNavItem[] = [
  { id: 'sec-1', label: '제1조 (수집 항목)' },
  { id: 'sec-2', label: '제2조 (이용 목적)' },
  { id: 'sec-3', label: '제3조 (보유 기간)' },
  { id: 'sec-4', label: '제4조 (제3자 제공)' },
  { id: 'sec-5', label: '제5조 (파기)' },
  { id: 'sec-6', label: '제6조 (이용자 권리)' },
  { id: 'sec-7', label: '제7조 (안전성 조치)' },
  { id: 'sec-8', label: '제8조 (책임자)' },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16 grid md:grid-cols-[240px_1fr] gap-12">
      <AnchorNav items={sections} ariaLabel="개인정보처리방침 목차" />

      <article className="prose mx-auto w-full max-w-[720px]">
        <h1>개인정보처리방침</h1>
        <p className="text-sm text-[hsl(var(--text-secondary))]">시행일: 2026년 3월 1일</p>

        <p>
          천지연꽃신당(이하 &quot;회사&quot;)은 개인정보보호법, 정보통신망 이용촉진 및
          정보보호 등에 관한 법률 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기
          위해 다음과 같이 개인정보처리방침을 수립하여 공개합니다.
        </p>

        <section id="sec-1">
          <h2>제1조 (수집하는 개인정보 항목)</h2>
          <p>회사는 다음의 개인정보를 수집합니다:</p>
          <table>
            <thead>
              <tr>
                <th>수집 시점</th>
                <th>수집 항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>회원가입</td>
                <td>이메일, 비밀번호, 닉네임, 전화번호(선택)</td>
              </tr>
              <tr>
                <td>소셜 로그인</td>
                <td>소셜 계정 식별자, 이메일, 프로필 이미지</td>
              </tr>
              <tr>
                <td>결제</td>
                <td>결제 수단 정보, 거래 내역</td>
              </tr>
              <tr>
                <td>상담 이용</td>
                <td>예약 내역, 상담 기록, 리뷰 내용</td>
              </tr>
              <tr>
                <td>운세 서비스</td>
                <td>생년월일, 태어난 시간(선택), 성별</td>
              </tr>
              <tr>
                <td>자동 수집</td>
                <td>IP 주소, 접속 로그, 쿠키, 기기 정보, 서비스 이용 기록</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="sec-2">
          <h2>제2조 (개인정보의 이용 목적)</h2>
          <ul>
            <li>회원 가입 및 관리: 본인 확인, 서비스 제공, 부정 이용 방지</li>
            <li>서비스 제공: 상담 예약, 결제 처리, 캐시 관리, 운세 서비스 제공</li>
            <li>고객 지원: 문의 응대, 분쟁 해결, 환불 처리</li>
            <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
            <li>마케팅: 이벤트 안내, 맞춤형 서비스 추천 (동의 시)</li>
          </ul>
        </section>

        <section id="sec-3">
          <h2>제3조 (개인정보의 보유 및 이용 기간)</h2>
          <p>
            회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이
            파기합니다. 단, 관련 법령에 의해 보존할 필요가 있는 경우 아래 기간 동안
            보관합니다:
          </p>
          <ul>
            <li>계약 또는 청약철회에 관한 기록: 5년 (전자상거래법)</li>
            <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
            <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
          </ul>
        </section>

        <section id="sec-4">
          <h2>제4조 (개인정보의 제3자 제공)</h2>
          <p>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만,
            다음의 경우에는 예외로 합니다:
          </p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>
              법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라
              수사기관의 요구가 있는 경우
            </li>
            <li>
              상담 서비스 제공을 위해 상담사에게 최소한의 정보(닉네임, 예약 시간)를
              제공하는 경우
            </li>
          </ul>
        </section>

        <section id="sec-5">
          <h2>제5조 (개인정보의 파기)</h2>
          <ul>
            <li>전자적 파일: 기록을 재생할 수 없는 기술적 방법을 사용하여 완전 삭제</li>
            <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
            <li>
              회원 탈퇴 시 개인정보는 즉시 파기하되, 관련 법령에 따라 보관이 필요한
              정보는 별도 분리 보관 후 기간 경과 시 파기합니다.
            </li>
          </ul>
        </section>

        <section id="sec-6">
          <h2>제6조 (이용자의 권리와 행사 방법)</h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
          <ul>
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리 정지 요구</li>
          </ul>
          <p>
            위 권리 행사는 서비스 내 설정 메뉴 또는 고객센터를 통해 가능하며, 회사는 이에
            대해 지체 없이 조치하겠습니다.
          </p>
        </section>

        <section id="sec-7">
          <h2>제7조 (개인정보의 안전성 확보 조치)</h2>
          <p>회사는 개인정보의 안전성 확보를 위해 다음 조치를 취하고 있습니다:</p>
          <ul>
            <li>비밀번호 암호화 저장 (BCrypt)</li>
            <li>SSL/TLS를 통한 데이터 전송 암호화</li>
            <li>접근 권한 관리 및 접근 통제</li>
            <li>개인정보 접근 로그 기록 및 보관</li>
            <li>정기적인 보안 점검</li>
          </ul>
        </section>

        <section id="sec-8">
          <h2>제8조 (개인정보 보호책임자)</h2>
          <ul>
            <li>담당부서: 개인정보보호팀</li>
            <li>이메일: privacy@cheonjiyeon.com</li>
          </ul>
          <p>
            기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하시기
            바랍니다:
          </p>
          <ul>
            <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
            <li>대검찰청 사이버수사과 (spo.go.kr / 1301)</li>
            <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)</li>
          </ul>
        </section>

        <hr />
        <p className="text-sm text-[hsl(var(--text-secondary))]">
          본 개인정보처리방침은 2026년 3월 1일부터 시행됩니다.
        </p>
      </article>
    </main>
  );
}
