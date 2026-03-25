# FLOCO 모바일 UX 기술 원칙

> 모든 UI 관련 코드를 작성하거나 수정할 때 아래 원칙을 반드시 준수한다.

---

## 1. 터치 영역 (Touch Target)

- 모든 버튼·링크·탭 등 인터랙티브 요소의 터치 영역은 **최소 44×44pt (iOS) / 48×48dp (Android)** 이상 확보
- 시각적 크기가 작더라도 `padding` 또는 `hitSlop`으로 터치 영역을 보장할 것
- 예시:
  ```tsx
  // hitSlop 활용
  <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>

  // 또는 padding 확보
  style={{ paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 }}
  ```

---

## 2. 주문 인터페이스 (Order UI)

- 매수/매도 주문은 **반드시 Bottom Sheet**로 구현 (화면 이탈 방지)
- Bottom Sheet 외부 탭 시 닫힘 처리
- 주문 확인 → 최종 확인 → 체결 완료의 2-step 플로우 유지

---

## 3. 상태 처리 (State Handling)

모든 데이터 목록/카드 화면에는 아래 3가지 상태를 **필수 구현**:

| 상태 | 구현 방법 |
|------|-----------|
| Loading | Skeleton UI (`<Skeleton>` 컴포넌트 활용) |
| Empty State | 이모지 + 안내 텍스트 + CTA 버튼 (`<EmptyState>` 컴포넌트) |
| Error State | 에러 메시지 + 재시도 버튼 |

---

## 4. 정보 배치 (Above the Fold)

- **현재가, 수익률, 순위**는 스크롤 없이 첫 화면에서 보여야 한다
- 핵심 KPI는 화면 상단 1/3 영역에 배치
- 보조 정보(상세 내역, 거래 히스토리 등)는 스크롤 영역에 배치

---

## 5. 제스처 (Gesture)

- **포트폴리오** 화면과 **랭킹** 화면에는 Pull-to-Refresh 지원 필수
- ScrollView 사용 시:
  ```tsx
  <ScrollView
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }
  >
  ```

---

## 6. 차트 정책 (Chart Policy)

- 복잡한 인터랙티브 차트보다 **숫자·텍스트 중심의 데이터 시각화** 우선
- 차트가 필요한 경우: `react-native-svg` 기반 커스텀 구현 (외부 차트 라이브러리 지양)
- 수치는 항상 명확한 단위(₩, %, 주)와 함께 표시

---

## 체크리스트 (코드 리뷰 시)

- [ ] 모든 터치 요소 최소 44pt 이상인가?
- [ ] 주문 UI가 Bottom Sheet로 구현되었는가?
- [ ] Loading / Empty / Error 세 가지 상태가 모두 처리되었는가?
- [ ] 핵심 정보가 Above the fold에 위치하는가?
- [ ] 해당 화면에 Pull-to-Refresh가 필요한가?
- [ ] 외부 차트 라이브러리 대신 SVG 커스텀을 사용했는가?
