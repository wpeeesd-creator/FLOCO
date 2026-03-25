# FLOCO 성능 요구사항 (Performance Requirements)

> **모든 로직 구현 시 아래 수치를 달성할 수 있도록 최적화된 코드를 작성한다.**

---

## 핵심 목표

| # | 항목 | 목표 수치 | 구현 지침 |
|---|------|-----------|-----------|
| 1 | **거래 응답** | 매수/매도 처리 **1초 이내** 완료 | Optimistic UI 적용 권장 |
| 2 | **랭킹 갱신** | 거래 후 **3초 이내** 반영 | Firebase 실시간 리스너 활용 |
| 3 | **앱 실행** | 콜드 스타트 **3초 이내** | Splash Screen 최적화 |
| 4 | **안정성** | 크래시율 **0.5% 미만** | Try-Catch 및 Error Boundary 필수 |
| 5 | **리소스** | 설치 용량 **50MB** / 메모리 **200MB** 미만 | 이미지 에셋 최적화 및 메모리 누수 방지 |

---

## 목표별 구현 가이드

### 1. 거래 응답 — 1초 이내 (Optimistic UI)

매수/매도 요청 시 서버 응답을 기다리지 않고 UI를 먼저 업데이트한다.

```tsx
// ✅ Optimistic UI 패턴
const handleBuy = async (ticker: string, qty: number) => {
  // 1) 즉시 UI 반영
  optimisticUpdate(ticker, qty, 'buy');

  try {
    // 2) 백그라운드에서 실제 처리
    await buyStock(ticker, qty);
  } catch (e) {
    // 3) 실패 시 롤백
    rollbackUpdate(ticker, qty, 'buy');
    showToast('거래에 실패했어요. 다시 시도해주세요.');
  }
};
```

### 2. 랭킹 갱신 — 3초 이내 (Firebase Realtime)

`onSnapshot` 리스너를 사용해 거래 직후 랭킹이 자동 반영되도록 한다.

```ts
// ✅ Firestore 실시간 리스너
const unsubscribe = onSnapshot(
  query(collection(db, 'rankings'), orderBy('returnRate', 'desc'), limit(50)),
  (snap) => {
    const rankings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setRankings(rankings);
  }
);

// 컴포넌트 언마운트 시 반드시 해제 (메모리 누수 방지)
useEffect(() => () => unsubscribe(), []);
```

### 3. 앱 실행 — 콜드 스타트 3초 이내

- `expo-splash-screen`으로 폰트·에셋 로딩 완료 후 스플래시 해제
- 초기 데이터는 AsyncStorage 캐시 우선 → 백그라운드 갱신
- 무거운 모듈은 lazy import 적용

```ts
// ✅ 스플래시 제어 패턴
await SplashScreen.preventAutoHideAsync();
await Promise.all([loadFonts(), loadCachedData()]);
await SplashScreen.hideAsync();
```

### 4. 안정성 — 크래시율 0.5% 미만

모든 비동기 로직에 try-catch, 화면 단위 Error Boundary를 필수 적용한다.

```tsx
// ✅ Error Boundary (클래스 컴포넌트)
class ScreenErrorBoundary extends React.Component<...> {
  componentDidCatch(error: Error) {
    // 크래시 리포팅 (e.g., Sentry)
    logError(error);
  }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}

// ✅ 비동기 try-catch 필수
try {
  await riskyOperation();
} catch (e: any) {
  console.warn('[ERROR]', e.message);
  // 사용자에게 피드백 제공
}
```

### 5. 리소스 — 50MB / 200MB 미만

- **이미지**: WebP 포맷 우선, 2× 레티나 이하 해상도
- **메모리 누수 방지**: `useEffect` cleanup, `onSnapshot` unsubscribe 철저히
- **번들 크기**: 외부 차트 라이브러리 지양 (`react-native-svg` 커스텀 사용)
- **코드 스플리팅**: 탭별 lazy load 적용 고려

```ts
// ✅ 메모리 누수 방지 패턴
useEffect(() => {
  const unsub = onSnapshot(ref, handler);
  return () => unsub(); // 반드시 cleanup
}, []);
```

---

## 코드 작성 체크리스트

UI 로직 작성·수정 후 아래를 확인:

- [ ] 매수/매도 액션에 Optimistic UI가 적용되었는가?
- [ ] Firebase 리스너에 `useEffect` cleanup(unsubscribe)이 있는가?
- [ ] 비동기 함수에 try-catch가 모두 적용되었는가?
- [ ] 화면 컴포넌트에 Error Boundary가 감싸져 있는가?
- [ ] 외부 이미지·에셋이 최적화(WebP, 적정 해상도)되었는가?
- [ ] 무거운 모듈에 lazy import를 고려했는가?

---

*이 요구사항은 `docs/PERFORMANCE_GOALS.md`에서 관리한다.*
