# FLOCO 모바일 UX 기술 원칙

> **모든 UI 작업(컴포넌트 생성·수정) 시 이 원칙을 1순위로 준수한다.**

---

## 원칙 1 — 터치 영역 (Touch Target)

모든 버튼·링크·탭 등 인터랙티브 요소의 터치 영역은 **최소 44×44pt (iOS) / 48×48dp (Android)** 이상 확보.

```tsx
// ✅ 올바른 예 — padding 또는 minWidth/minHeight로 확보
<TouchableOpacity style={{ minWidth: 44, minHeight: 44, padding: 12 }}>

// ✅ 올바른 예 — 시각 크기가 작을 때 hitSlop으로 보완
<TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>

// ❌ 잘못된 예 — 텍스트 크기만큼만 터치 가능
<TouchableOpacity>
  <Text style={{ fontSize: 12 }}>전체보기</Text>
</TouchableOpacity>
```

---

## 원칙 2 — 주문 인터페이스 (Order UI)

매수·매도 주문은 **반드시 Bottom Sheet**로 구현. 화면 이탈(페이지 이동) 금지.

- Bottom Sheet 외부 터치 시 닫힘 처리
- 주문 확인 → 최종 확인 → 체결 완료의 **2-step 플로우** 유지
- `<BottomSheet>` 컴포넌트(`components/ui.tsx`) 재사용

---

## 원칙 3 — 상태 처리 (State Handling)

데이터 목록·카드 화면은 아래 **3가지 상태를 모두 구현**:

| 상태 | 구현 | 컴포넌트 |
|------|------|----------|
| Loading | Skeleton UI | `<Skeleton>` (`components/ui.tsx`) |
| Empty | 안내 메시지 + CTA | `<EmptyState>` (`components/ui.tsx`) |
| Error | 에러 메시지 + 재시도 버튼 | 인라인 구현 |

```tsx
// 상태 처리 패턴
if (loading) return <Skeleton width="100%" height={80} />;
if (error)   return <ErrorCard onRetry={reload} />;
if (!data.length) return <EmptyState emoji="📋" title="항목이 없어요" />;
return <DataList data={data} />;
```

---

## 원칙 4 — 정보 배치 (Above the Fold)

**현재가·수익률·순위**는 스크롤 없이 첫 화면에서 보여야 한다.

- 핵심 KPI는 화면 상단 영역에 배치
- 보조 정보(상세 내역, 거래 히스토리)는 스크롤 영역에 배치
- ScrollView 내부 첫 번째 컴포넌트에 핵심 지표 포함

---

## 원칙 5 — Pull-to-Refresh (제스처)

**포트폴리오** 화면과 **랭킹** 화면에는 Pull-to-Refresh 필수.

```tsx
import { RefreshControl } from 'react-native';

const [refreshing, setRefreshing] = useState(false);
const onRefresh = useCallback(() => {
  setRefreshing(true);
  fetchData().finally(() => setRefreshing(false));
}, []);

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.primary}
    />
  }
>
```

---

## 원칙 6 — 차트 정책 (Data Visualization)

복잡한 인터랙티브 차트보다 **숫자·텍스트 중심 데이터 시각화** 우선.

- 차트가 필요한 경우: `react-native-svg` 기반 커스텀 구현 (외부 라이브러리 지양)
- 수치는 항상 명확한 단위(`₩`, `%`, `주`)와 함께 표시
- 색상: 상승 `Colors.green (#2ECC71)` / 하락 `Colors.red (#E74C3C)`

---

## 코드 리뷰 체크리스트

UI 코드 작성·수정 후 아래를 확인:

- [ ] 모든 터치 요소 최소 44pt 이상인가?
- [ ] 주문 UI가 Bottom Sheet로 구현되었는가?
- [ ] Loading / Empty / Error 세 가지 상태가 모두 처리되었는가?
- [ ] 핵심 정보(현재가·수익률·순위)가 Above the fold에 있는가?
- [ ] 해당 화면에 Pull-to-Refresh가 필요한가?
- [ ] 외부 차트 라이브러리 대신 SVG 커스텀을 사용했는가?

---

*이 가이드라인은 `MOBILE_UX_GUIDELINE.md`(프로젝트 루트)와 동일한 원칙을 기준으로 한다.*
