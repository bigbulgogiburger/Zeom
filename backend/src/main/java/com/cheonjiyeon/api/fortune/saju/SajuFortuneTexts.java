package com.cheonjiyeon.api.fortune.saju;

import java.util.Map;

/**
 * 사주 기반 운세 텍스트 템플릿
 *
 * 십성 유형 x 점수 등급별 운세 문장 (200+ 문장)
 * 카테고리별 텍스트 + 상담사 CTA 메시지
 */
public final class SajuFortuneTexts {

    private SajuFortuneTexts() {}

    // ========== 총운 텍스트 (십성별) ==========

    // 비견(比肩) - 경쟁, 자립
    static final String[] BIGYEON_EXCELLENT = {
        "같은 기운이 모여 큰 힘을 발휘하는 날입니다. 동료와 함께라면 큰 일도 해낼 수 있어요.",
        "자립심이 빛나는 하루! 독립적으로 추진하던 일에 좋은 성과가 기대됩니다.",
        "경쟁 속에서 실력이 드러나는 날이에요. 당당하게 자신을 표현하세요."
    };
    static final String[] BIGYEON_GOOD = {
        "비견의 기운으로 안정적인 하루가 됩니다. 자신의 페이스를 유지하세요.",
        "친구나 동료와의 시너지가 좋은 날입니다. 협력하면 더 좋은 결과를 얻어요.",
        "꾸준히 해온 일에 보상이 돌아오는 날이에요. 묵묵히 나아가세요."
    };
    static final String[] BIGYEON_NORMAL = {
        "평범한 일상이지만 자기 관리가 중요한 날입니다.",
        "비견의 기운이 적당히 작용합니다. 무리하지 않으면 무난한 하루예요.",
        "내면의 힘을 다지는 시간입니다. 조용히 자신을 돌아보세요."
    };
    static final String[] BIGYEON_BAD = {
        "경쟁 상대와 마찰이 생길 수 있으니 양보하는 지혜가 필요합니다.",
        "욕심을 내려놓으면 오히려 더 많은 것을 얻을 수 있는 날이에요.",
        "고집을 부리면 손해를 봅니다. 유연하게 대처하세요."
    };
    static final String[] BIGYEON_TERRIBLE = {
        "경쟁에서 불리한 상황이 올 수 있으니 신중하게 행동하세요.",
        "혼자 감당하려 하지 말고 도움을 요청하는 것이 현명합니다.",
        "다툼이나 분쟁에 휘말리지 않도록 주의하세요."
    };

    // 겁재(劫財) - 손재, 분쟁
    static final String[] GEOPJAE_EXCELLENT = {
        "겁재의 도전 정신이 빛을 발합니다! 과감한 도전이 행운을 가져와요.",
        "손실의 기운을 극복하고 역전의 기회를 잡는 날입니다.",
        "위기를 기회로 바꾸는 힘이 있는 날이에요. 적극적으로 움직이세요."
    };
    static final String[] GEOPJAE_GOOD = {
        "겁재의 기운이 순하게 작용합니다. 새로운 도전에 좋은 시기예요.",
        "작은 손실은 있을 수 있지만 전체적으로 긍정적인 흐름입니다.",
        "도전적인 마음가짐이 행운을 불러옵니다."
    };
    static final String[] GEOPJAE_NORMAL = {
        "재정 관리에 신경 쓰면 무난한 하루가 됩니다.",
        "겁재의 기운이 중립적입니다. 큰 거래는 피하는 게 좋아요.",
        "충동적인 결정은 삼가고 신중하게 행동하세요."
    };
    static final String[] GEOPJAE_BAD = {
        "금전적 손실에 주의해야 하는 날입니다. 불필요한 지출을 줄이세요.",
        "겁재의 기운으로 분쟁이 생기기 쉬우니 말조심하세요.",
        "남에게 돈을 빌려주거나 보증을 서면 안 되는 날이에요."
    };
    static final String[] GEOPJAE_TERRIBLE = {
        "큰 재물 손실의 위험이 있으니 거래나 투자를 삼가세요.",
        "주변 사람과의 금전 문제가 발생할 수 있으니 각별히 주의하세요.",
        "겁재의 강한 기운으로 시비가 발생할 수 있습니다. 조용히 지내세요."
    };

    // 식신(食神) - 재능, 표현, 풍요
    static final String[] SIKSIN_EXCELLENT = {
        "식신의 풍요로운 기운이 넘칩니다! 재능을 마음껏 발휘하세요.",
        "창작 활동에 최적의 날입니다. 아이디어가 샘솟아요.",
        "맛있는 음식과 좋은 사람들로 풍요로운 하루가 됩니다."
    };
    static final String[] SIKSIN_GOOD = {
        "식신의 기운으로 재능이 빛나는 날입니다. 자신감을 가지세요.",
        "안정적인 수입과 함께 마음의 여유가 생기는 하루예요.",
        "표현력이 좋아지는 날이니 프레젠테이션이나 면접에 유리해요."
    };
    static final String[] SIKSIN_NORMAL = {
        "평온하지만 조금 게을러질 수 있는 날입니다. 적당한 활동을 하세요.",
        "식신의 기운이 적당합니다. 규칙적인 생활을 유지하세요.",
        "소소한 즐거움을 찾는 것이 오늘의 행복 비결이에요."
    };
    static final String[] SIKSIN_BAD = {
        "과식이나 과음에 주의하세요. 절제가 필요한 날입니다.",
        "게으름이 찾아올 수 있으니 적극적으로 움직이세요.",
        "식신의 기운이 과하면 무기력해질 수 있어요. 자극을 찾으세요."
    };
    static final String[] SIKSIN_TERRIBLE = {
        "건강 관리에 특히 주의하세요. 위장이 약해지기 쉬운 날이에요.",
        "나태함에 빠지기 쉬운 날입니다. 일정을 반드시 지키세요.",
        "식신의 기운이 약해져 의욕이 떨어질 수 있습니다. 충분히 쉬세요."
    };

    // 상관(傷官) - 창의, 반항
    static final String[] SANGGWAN_EXCELLENT = {
        "상관의 창의력이 폭발하는 날! 혁신적인 아이디어가 떠오릅니다.",
        "기존의 틀을 깨는 발상이 큰 성공을 가져올 수 있어요.",
        "자유로운 표현이 인정받는 하루가 됩니다."
    };
    static final String[] SANGGWAN_GOOD = {
        "창의적인 기운이 활발합니다. 새로운 시도에 좋은 날이에요.",
        "상관의 에너지로 설득력이 높아집니다. 의견을 적극 피력하세요.",
        "예술이나 문화 활동에 좋은 날입니다."
    };
    static final String[] SANGGWAN_NORMAL = {
        "상관의 기운이 적당합니다. 감정 조절에 신경 쓰세요.",
        "창의력은 있지만 실행력이 부족할 수 있어요. 계획을 세우세요.",
        "자유롭게 생각하되 행동은 신중하게 하세요."
    };
    static final String[] SANGGWAN_BAD = {
        "상관의 기운으로 윗사람과 마찰이 생길 수 있어요. 말을 가려서 하세요.",
        "반항심이 생기기 쉬운 날이니 감정을 다스리세요.",
        "날카로운 말이 관계를 해칠 수 있습니다. 한 박자 쉬고 말하세요."
    };
    static final String[] SANGGWAN_TERRIBLE = {
        "직장이나 대인관계에서 큰 충돌이 있을 수 있으니 각별히 조심하세요.",
        "상관의 날카로운 기운이 강합니다. 중요한 미팅은 연기하세요.",
        "구설수에 오르기 쉬운 날이에요. 조용히 지내는 것이 최선입니다."
    };

    // 편재(偏財) - 투자, 횡재
    static final String[] PYEONJAE_EXCELLENT = {
        "편재의 기운으로 뜻밖의 재물이 들어올 수 있습니다! 기회를 놓치지 마세요.",
        "투자나 사업에서 좋은 결과가 기대되는 날이에요.",
        "사교적 활동이 재물 운을 높여주는 날입니다."
    };
    static final String[] PYEONJAE_GOOD = {
        "편재의 기운으로 재정 상황이 좋아지는 날입니다.",
        "부수입을 기대할 수 있어요. 관심 분야에 투자해보세요.",
        "인맥을 통한 기회가 찾아오는 날이니 적극적으로 사교하세요."
    };
    static final String[] PYEONJAE_NORMAL = {
        "편재의 기운이 보통입니다. 안정적인 재정 관리를 하세요.",
        "큰 수입은 없지만 손실도 없는 무난한 날이에요.",
        "과도한 투자는 삼가고 현금 흐름을 관리하세요."
    };
    static final String[] PYEONJAE_BAD = {
        "편재의 기운이 불안정합니다. 큰 금전 거래는 피하세요.",
        "투자에 손실이 발생할 수 있으니 보수적으로 접근하세요.",
        "유혹에 넘어가지 마세요. 쉽게 벌리는 돈은 없습니다."
    };
    static final String[] PYEONJAE_TERRIBLE = {
        "재물 손실의 위험이 큰 날입니다. 모든 거래를 중단하세요.",
        "사기나 금전 사고에 각별히 주의해야 합니다.",
        "투기성 행위는 절대 금물! 안전한 선택만 하세요."
    };

    // 정재(正財) - 안정 수입
    static final String[] JEONGJAE_EXCELLENT = {
        "정재의 기운으로 안정적인 수입이 증가하는 날입니다.",
        "근면한 노력에 대한 보상이 돌아오는 멋진 하루예요.",
        "저축이나 부동산 관련 좋은 소식이 있을 수 있습니다."
    };
    static final String[] JEONGJAE_GOOD = {
        "정재의 안정적 기운으로 재정이 든든한 하루입니다.",
        "계획적인 소비가 빛을 발하는 날이에요. 현명하게 관리하세요.",
        "성실한 태도가 재물 운을 높여줍니다."
    };
    static final String[] JEONGJAE_NORMAL = {
        "큰 변화 없이 안정적인 재정 흐름이 이어집니다.",
        "정재의 기운이 보통이에요. 무리한 지출만 피하면 괜찮습니다.",
        "꾸준한 저축 습관이 미래를 밝게 합니다."
    };
    static final String[] JEONGJAE_BAD = {
        "예상치 못한 지출이 발생할 수 있으니 여유 자금을 확보하세요.",
        "정재의 기운이 약해 수입이 줄어들 수 있어요. 절약하세요.",
        "고정 지출을 점검하고 불필요한 구독을 정리하세요."
    };
    static final String[] JEONGJAE_TERRIBLE = {
        "재정적 어려움이 닥칠 수 있으니 최대한 절약하세요.",
        "대출이나 보증은 절대 삼가야 하는 날입니다.",
        "정재의 기운이 매우 약합니다. 재물에 욕심 부리지 마세요."
    };

    // 편관(偏官) - 권위, 압박
    static final String[] PYEONGWAN_EXCELLENT = {
        "편관의 기운으로 리더십을 발휘하기 좋은 날입니다!",
        "도전적인 과제에서 뛰어난 성과를 낼 수 있어요.",
        "상사나 윗사람에게 인정받는 하루가 됩니다."
    };
    static final String[] PYEONGWAN_GOOD = {
        "편관의 기운이 적당히 작용합니다. 책임감을 가지고 임하세요.",
        "직장에서 좋은 평가를 받을 수 있는 날이에요.",
        "용기를 내어 추진하면 좋은 결과가 있습니다."
    };
    static final String[] PYEONGWAN_NORMAL = {
        "편관의 압박감이 느껴질 수 있지만 감당할 수 있는 수준입니다.",
        "직장 생활에서 무난하게 하루를 보낼 수 있어요.",
        "적당한 긴장감이 성장의 원동력이 됩니다."
    };
    static final String[] PYEONGWAN_BAD = {
        "편관의 압박이 강해 스트레스를 받기 쉽습니다. 마음을 편히 가지세요.",
        "윗사람과의 갈등에 주의하세요. 순응하는 것이 현명합니다.",
        "갑작스러운 변화나 이동이 있을 수 있으니 대비하세요."
    };
    static final String[] PYEONGWAN_TERRIBLE = {
        "편관의 기운이 매우 강하여 사고나 부상에 주의해야 합니다.",
        "법적 분쟁이나 관재(官災)에 조심하세요.",
        "무리한 행동은 큰 화를 부를 수 있습니다. 조심하고 또 조심하세요."
    };

    // 정관(正官) - 명예, 규율
    static final String[] JEONGGWAN_EXCELLENT = {
        "정관의 기운으로 명예가 높아지는 최고의 날입니다!",
        "승진이나 합격 등 좋은 소식이 기대되는 하루예요.",
        "사회적으로 인정받는 일이 생길 수 있습니다."
    };
    static final String[] JEONGGWAN_GOOD = {
        "정관의 안정적인 기운으로 직장에서 좋은 평판을 얻습니다.",
        "규칙적이고 성실한 태도가 빛을 발하는 날이에요.",
        "공적인 자리에서 능력을 보여주기 좋은 날입니다."
    };
    static final String[] JEONGGWAN_NORMAL = {
        "정관의 기운이 적당합니다. 규칙을 따르면 무난한 하루예요.",
        "큰 변화 없이 안정적인 사회 생활을 유지합니다.",
        "일상적인 업무를 충실히 수행하면 충분합니다."
    };
    static final String[] JEONGGWAN_BAD = {
        "정관의 기운이 약해 불안감을 느낄 수 있어요. 차분하게 대처하세요.",
        "규칙이나 법규를 어기면 불이익을 받을 수 있으니 주의하세요.",
        "직장에서의 평판에 흠이 갈 수 있으니 언행을 조심하세요."
    };
    static final String[] JEONGGWAN_TERRIBLE = {
        "명예에 손상이 올 수 있는 날입니다. 신중하게 행동하세요.",
        "관재수에 조심하세요. 모든 서류를 꼼꼼히 확인하세요.",
        "정관이 깨지면 큰 혼란이 올 수 있어요. 원칙을 지키세요."
    };

    // 편인(偏印) - 학문, 변화
    static final String[] PYEONIN_EXCELLENT = {
        "편인의 기운으로 학문적 성취가 빛나는 날입니다!",
        "새로운 지식을 습득하거나 자격증 취득에 좋은 날이에요.",
        "직관력이 높아져 통찰력 있는 판단을 할 수 있습니다."
    };
    static final String[] PYEONIN_GOOD = {
        "편인의 기운으로 배움의 즐거움을 느끼는 하루예요.",
        "비상한 아이디어가 떠오를 수 있습니다. 메모해두세요.",
        "정신적으로 성장하는 날이에요. 독서나 명상이 좋습니다."
    };
    static final String[] PYEONIN_NORMAL = {
        "편인의 기운이 적당합니다. 집중력을 유지하세요.",
        "새로운 것을 배우기에 나쁘지 않은 날이에요.",
        "조용한 환경에서 사색하면 좋은 답을 찾을 수 있습니다."
    };
    static final String[] PYEONIN_BAD = {
        "편인의 기운이 불안정하여 집중이 어려울 수 있어요.",
        "변덕스러운 마음을 다잡아야 합니다. 한 가지에 집중하세요.",
        "너무 많은 것을 한꺼번에 하려 하지 마세요."
    };
    static final String[] PYEONIN_TERRIBLE = {
        "편인의 기운이 과도하여 우울함이 찾아올 수 있어요. 마음 관리를 하세요.",
        "고독감을 느끼기 쉬운 날입니다. 가까운 사람과 소통하세요.",
        "현실 도피적 행동에 주의하세요. 문제를 직면하는 용기가 필요합니다."
    };

    // 정인(正印) - 지원, 안정
    static final String[] JEONGIN_EXCELLENT = {
        "정인의 든든한 기운! 주변의 도움으로 큰 성공을 거둘 수 있어요.",
        "학업이나 자격 시험에서 최고의 성과가 기대됩니다.",
        "어머니나 스승의 은혜가 빛나는 하루입니다."
    };
    static final String[] JEONGIN_GOOD = {
        "정인의 안정적인 기운으로 마음이 편안한 하루예요.",
        "문서 운이 좋은 날입니다. 계약이나 서명에 유리해요.",
        "지식과 지혜가 깊어지는 날이에요. 공부에 집중하세요."
    };
    static final String[] JEONGIN_NORMAL = {
        "정인의 기운이 적당합니다. 학업에 꾸준히 임하세요.",
        "평온하지만 특별한 변화는 없는 하루예요.",
        "자기 계발에 시간을 투자하면 좋은 날입니다."
    };
    static final String[] JEONGIN_BAD = {
        "정인의 기운이 약해 도움을 받기 어려울 수 있어요.",
        "문서 관련 실수에 주의하세요. 꼼꼼히 확인하세요.",
        "수동적인 태도가 기회를 놓치게 할 수 있습니다."
    };
    static final String[] JEONGIN_TERRIBLE = {
        "정인의 기운이 매우 약합니다. 중요한 서류나 계약은 연기하세요.",
        "배움의 벽을 느끼더라도 포기하지 마세요. 때가 오면 열립니다.",
        "주변의 도움을 기대하기 어려운 날이에요. 자력으로 해결하세요."
    };

    // ========== 카테고리별 텍스트 ==========

    static final String[] CAREER_EXCELLENT = {
        "사업 운이 최고조입니다! 새로운 프로젝트를 시작하기에 완벽한 날이에요.",
        "직장에서 능력을 인정받아 승진이나 보너스의 기회가 찾아옵니다.",
        "비즈니스 미팅에서 좋은 결과를 기대할 수 있어요."
    };
    static final String[] CAREER_GOOD = {
        "업무 효율이 높은 날입니다. 밀린 일을 처리하세요.",
        "동료와의 협업이 좋은 결과를 낳는 하루예요.",
        "상사에게 좋은 인상을 줄 수 있는 날이니 적극적으로 임하세요."
    };
    static final String[] CAREER_NORMAL = {
        "업무가 평탄하게 흘러가는 날입니다. 차분히 임하세요.",
        "큰 성과는 없지만 안정적인 업무 처리가 가능해요.",
        "장기 프로젝트의 기반을 다지기 좋은 하루입니다."
    };
    static final String[] CAREER_BAD = {
        "업무에서 실수가 발생할 수 있으니 꼼꼼히 확인하세요.",
        "직장 내 갈등에 주의하세요. 감정적 대응은 피하세요.",
        "새로운 사업 제안은 신중하게 검토하세요."
    };
    static final String[] CAREER_TERRIBLE = {
        "직장에서 큰 어려움에 직면할 수 있으니 마음의 준비를 하세요.",
        "무리한 업무 추진은 실패로 이어질 수 있습니다.",
        "사업상 중요한 결정은 오늘 내리지 마세요."
    };

    static final String[] STUDY_EXCELLENT = {
        "학업 운이 최고! 집중력이 높아져 많은 것을 흡수할 수 있어요.",
        "시험이나 자격증 도전에 최적의 날입니다.",
        "새로운 분야의 공부를 시작하면 큰 성과를 거둘 수 있어요."
    };
    static final String[] STUDY_GOOD = {
        "학업에 집중하기 좋은 날이에요. 도서관이나 조용한 곳에서 공부하세요.",
        "배운 것을 정리하고 복습하면 기억에 오래 남아요.",
        "선생님이나 멘토에게 좋은 조언을 들을 수 있는 날입니다."
    };
    static final String[] STUDY_NORMAL = {
        "보통의 집중력이지만 꾸준히 공부하면 성과가 있어요.",
        "학업 계획을 점검하고 조정하기 좋은 날이에요.",
        "무리하지 않는 범위에서 공부를 진행하세요."
    };
    static final String[] STUDY_BAD = {
        "집중이 안 될 수 있어요. 짧은 시간씩 나눠서 공부하세요.",
        "학업 스트레스가 쌓일 수 있으니 적절한 휴식을 취하세요.",
        "암기보다는 이해 위주의 공부가 효과적인 날이에요."
    };
    static final String[] STUDY_TERRIBLE = {
        "학업 의욕이 떨어지기 쉬운 날이에요. 목표를 다시 확인하세요.",
        "시험 준비 중이라면 무리하지 말고 컨디션 관리에 집중하세요.",
        "오늘은 쉬면서 재충전하는 것도 학업의 일부입니다."
    };

    // ========== 상담사 CTA 메시지 ==========
    static final String[] CTA_WEALTH = {
        "올해의 재물운이 궁금하신가요? 전문 상담사에게 재물 흐름을 더 깊이 알아보세요.",
        "편재/정재의 기운을 잘 활용하는 방법, 전문 상담사가 알려드립니다.",
        "재물운을 높이는 구체적인 방법이 궁금하다면 전문 상담을 받아보세요."
    };
    static final String[] CTA_LOVE = {
        "연인이나 배우자와의 궁합이 궁금하다면 전문 상담사에게 물어보세요.",
        "올해의 인연운, 전문 상담사가 사주로 자세히 분석해드립니다.",
        "관성의 흐름으로 보는 배우자운, 전문 상담을 통해 알아보세요."
    };
    static final String[] CTA_CAREER = {
        "전문 상담사에게 올해의 관운(官運)을 더 깊이 알아보세요.",
        "이직이나 승진 시기, 사주를 통해 최적의 타이밍을 찾아보세요.",
        "사업 운의 흐름이 궁금하다면 전문 상담사에게 물어보세요."
    };
    static final String[] CTA_HEALTH = {
        "사주로 보는 건강 취약 부위, 전문 상담사에게 자세히 알아보세요.",
        "올해 건강 관리 포인트, 전문 상담사가 사주로 분석해드립니다.",
        "오행 균형으로 건강을 관리하는 방법, 전문 상담을 받아보세요."
    };
    static final String[] CTA_GENERAL = {
        "오늘의 사주 운세를 더 자세히 알고 싶다면 전문 상담사에게 물어보세요.",
        "사주팔자의 깊은 의미, 전문 상담사가 쉽게 풀어드립니다.",
        "운세가 궁금할 때, 전문 상담사에게 한 번에 풀어보세요."
    };

    // ========== 텍스트 조회 메서드 ==========

    /**
     * 십성과 점수에 따른 총운 텍스트 반환
     */
    public static String getOverallText(SipseongEnum sipseong, int score) {
        String[][] tiers = getSipseongTexts(sipseong);
        int tier = scoreTier(score);
        String[] texts = tiers[tier];
        return texts[Math.abs(score) % texts.length];
    }

    /**
     * 카테고리와 점수에 따른 텍스트 반환
     */
    public static String getCategoryText(String category, int score) {
        String[][] tiers = switch (category) {
            case "career" -> new String[][] {
                CAREER_TERRIBLE, CAREER_BAD, CAREER_NORMAL, CAREER_GOOD, CAREER_EXCELLENT
            };
            case "study" -> new String[][] {
                STUDY_TERRIBLE, STUDY_BAD, STUDY_NORMAL, STUDY_GOOD, STUDY_EXCELLENT
            };
            default -> null;
        };
        if (tiers == null) return "";
        int tier = scoreTier(score);
        String[] texts = tiers[tier];
        return texts[Math.abs(score) % texts.length];
    }

    /**
     * 사주 인사이트 생성
     */
    public static String generateSajuInsight(SipseongEnum sipseong, TwelveUnseongEnum unseong,
                                              String harmonyType, CheonganEnum dayGan, CheonganEnum todayGan) {
        String relation = dayGan.getOhaeng().getRelation(todayGan.getOhaeng());
        String ganDescription = "일간 " + dayGan.getName() + dayGan.getOhaeng().getName() +
            "(" + dayGan.getHanja() + dayGan.getOhaeng().getHanja() + ")가 오늘 일진 " +
            todayGan.getName() + todayGan.getOhaeng().getName() +
            "(" + todayGan.getHanja() + todayGan.getOhaeng().getHanja() + ")와 만나 " +
            sipseong.getName() + "의 기운이 활성화됩니다. ";

        String unseongDescription = unseong.getName() + "의 에너지로 " + unseong.getKeyword() + "의 시기입니다. ";

        String harmonyDescription = !"없음".equals(harmonyType)
            ? harmonyType + "의 작용이 있어 " + getHarmonyAdvice(harmonyType)
            : "";

        return ganDescription + unseongDescription + harmonyDescription;
    }

    /**
     * 상담사 CTA 메시지 반환
     */
    public static String getCounselorCtaMessage(SipseongEnum sipseong, int score) {
        String[] ctaTexts = switch (sipseong) {
            case PYEONJAE, JEONGJAE, GEOPJAE -> CTA_WEALTH;
            case JEONGGWAN, PYEONGWAN -> CTA_CAREER;
            case JEONGIN, PYEONIN -> CTA_GENERAL;
            case SIKSIN, SANGGWAN -> CTA_CAREER;
            default -> CTA_GENERAL;
        };
        return ctaTexts[Math.abs(score) % ctaTexts.length];
    }

    private static String getHarmonyAdvice(String harmonyType) {
        return switch (harmonyType) {
            case "삼합" -> "큰 행운의 기운이 감돌고 있습니다. 적극적으로 활동하세요.";
            case "육합" -> "좋은 만남과 인연의 기운이 있습니다.";
            case "충" -> "변동과 이동의 기운이 강하니 신중하게 행동하세요.";
            case "형" -> "구설과 시비에 주의하세요.";
            case "파" -> "계획에 차질이 생길 수 있으니 유연하게 대처하세요.";
            case "해" -> "예상치 못한 손해에 주의하세요.";
            default -> "";
        };
    }

    private static String[][] getSipseongTexts(SipseongEnum sipseong) {
        return switch (sipseong) {
            case BIGYEON -> new String[][] {
                BIGYEON_TERRIBLE, BIGYEON_BAD, BIGYEON_NORMAL, BIGYEON_GOOD, BIGYEON_EXCELLENT
            };
            case GEOPJAE -> new String[][] {
                GEOPJAE_TERRIBLE, GEOPJAE_BAD, GEOPJAE_NORMAL, GEOPJAE_GOOD, GEOPJAE_EXCELLENT
            };
            case SIKSIN -> new String[][] {
                SIKSIN_TERRIBLE, SIKSIN_BAD, SIKSIN_NORMAL, SIKSIN_GOOD, SIKSIN_EXCELLENT
            };
            case SANGGWAN -> new String[][] {
                SANGGWAN_TERRIBLE, SANGGWAN_BAD, SANGGWAN_NORMAL, SANGGWAN_GOOD, SANGGWAN_EXCELLENT
            };
            case PYEONJAE -> new String[][] {
                PYEONJAE_TERRIBLE, PYEONJAE_BAD, PYEONJAE_NORMAL, PYEONJAE_GOOD, PYEONJAE_EXCELLENT
            };
            case JEONGJAE -> new String[][] {
                JEONGJAE_TERRIBLE, JEONGJAE_BAD, JEONGJAE_NORMAL, JEONGJAE_GOOD, JEONGJAE_EXCELLENT
            };
            case PYEONGWAN -> new String[][] {
                PYEONGWAN_TERRIBLE, PYEONGWAN_BAD, PYEONGWAN_NORMAL, PYEONGWAN_GOOD, PYEONGWAN_EXCELLENT
            };
            case JEONGGWAN -> new String[][] {
                JEONGGWAN_TERRIBLE, JEONGGWAN_BAD, JEONGGWAN_NORMAL, JEONGGWAN_GOOD, JEONGGWAN_EXCELLENT
            };
            case PYEONIN -> new String[][] {
                PYEONIN_TERRIBLE, PYEONIN_BAD, PYEONIN_NORMAL, PYEONIN_GOOD, PYEONIN_EXCELLENT
            };
            case JEONGIN -> new String[][] {
                JEONGIN_TERRIBLE, JEONGIN_BAD, JEONGIN_NORMAL, JEONGIN_GOOD, JEONGIN_EXCELLENT
            };
        };
    }

    private static int scoreTier(int score) {
        if (score <= 20) return 0;
        if (score <= 40) return 1;
        if (score <= 60) return 2;
        if (score <= 80) return 3;
        return 4;
    }
}
