# Figma 컴포넌트 명명 규칙 + Auto Layout 규칙 v1

## 1) 컴포넌트 명명 규칙

형식:
`{Platform}/{Category}/{Component}/{Variant}/{State}`

예시:
- `Web/Nav/TopNav/Default/LoggedIn`
- `Web/Card/Counselor/Default/Hover`
- `App/Tab/BottomTab/5Items/ActiveHome`
- `Common/Button/Primary/Large/Disabled`
- `Common/Badge/Status/Reserved/Default`

### Category 권장 집합
- `Nav`, `Button`, `Input`, `Card`, `Chip`, `Badge`, `Modal`, `Toast`, `Sheet`, `Timer`, `Empty`, `Skeleton`

### Variant 규칙
- 사이즈: `Small | Medium | Large`
- 형태: `Default | WithIcon | WithSubtitle | Sticky`

### State 규칙
- `Default | Hover | Pressed | Focus | Disabled | Loading | Error | Success`

---

## 2) 페이지/프레임 명명 규칙

형식:
`{PageCode}_{ScreenName}_{Breakpoint}_{Version}`

예시:
- `W03_CounselorDetail_1440_v1`
- `W03_CounselorDetail_1024_v1`
- `A05_WaitingRoom_390_v1`

### 코드 체계
- Web: `W01~W99`
- App: `A01~A99`
- Flow: `F01~F99`
- Component: `C01~C99`

---

## 3) Auto Layout 기본 규칙

## 3.1 방향/정렬
- 세로 스택 기본: `Vertical`
- 카드 내부: `Vertical`
- 버튼 그룹: `Horizontal`
- 정렬: 텍스트는 Left, 액션은 Right 기준

## 3.2 간격(Spacing)
- 컴포넌트 내부: 8 / 12 / 16
- 섹션 간격: 24 / 32
- 페이지 최외곽 패딩:
  - Web Desktop: 40
  - Web Tablet: 24
  - App Mobile: 16

## 3.3 Resizing
- Container: `Fill container` 우선
- 텍스트: `Hug contents`
- 버튼:
  - Primary CTA: width `Fill`
  - 보조 버튼: width `Hug`

## 3.4 최소 높이
- 입력필드: 44
- 버튼: 44 (앱은 48 권장)
- 탭 아이템: 56

---

## 4) 반응형 규칙

## Web
- 1440: 12컬럼 (gutter 24, margin 120)
- 1024: 12컬럼 (gutter 20, margin 48)
- 768: 8컬럼 (gutter 16, margin 24)

## App
- 기본 아트보드: 390x844
- 소형 대응: 360x800
- Safe area 준수

---

## 5) 상태 컴포넌트 필수 세트

모든 핵심 화면은 아래 4개 상태를 반드시 보유:
1. Default
2. Loading (Skeleton)
3. Empty
4. Error

예시 명명:
- `Web/Section/ReservationList/Default`
- `Web/Section/ReservationList/Loading`
- `Web/Section/ReservationList/Empty`
- `Web/Section/ReservationList/Error`

---

## 6) 프로토타입 인터랙션 네이밍

형식:
`{Trigger}->{Target} ({Condition})`

예시:
- `Click_ReserveButton->W04_ReservationConfirm (cash>=required)`
- `Click_ReserveButton->W06_CashCharge (cash<required)`
- `Click_StartConsult->W08_ConsultRoom (t<=10min)`

---

## 7) 디자인 QA 체크리스트

- [ ] 모든 버튼에 Disabled 상태 존재
- [ ] 정책 문구(환불/노쇼/60분)가 예약/결제/취소 화면에 노출
- [ ] 색상 스타일 직접 hex 하드코딩 금지 (스타일 참조)
- [ ] 컴포넌트 중복 생성 금지 (Variants로 통합)
- [ ] 텍스트 오버플로우 대응(2줄/말줄임) 확인

---

## 8) 실무 팁

- 아이콘은 `Common/Icon/{name}/{size}`로 통일
- 버튼 텍스트는 동사형으로 통일 (`예약하기`, `결제하기`, `입장하기`)
- 상태 배지는 색 + 라벨 동시 제공 (색만 의존 금지)
