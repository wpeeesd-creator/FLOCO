# FLOCO 앱 설치 & 실행 가이드

## 기술 스택
- **UI**: 토스 방식 — React Native + TypeScript
- **알고리즘**: 듀오링고 방식 — XP, 스트릭, 단계별 잠금해제, 하트 시스템
- **세계관**: 마인크래프트 방식 — 플로월드 구역 탐험
- **상태관리**: Zustand (토스, 듀오링고 공통 사용)

## 파일 구조
```
floco/
├── App.tsx                    # 루트 + 탭 네비게이션
├── package.json               # 의존성
├── store/
│   └── appStore.ts            # Zustand 전역 스토어 (듀오링고 알고리즘)
├── components/
│   └── ui.tsx                 # 토스 스타일 공통 컴포넌트
└── screens/
    ├── HomeScreen.tsx          # 홈 (포트폴리오 + 자산배분 + 학습 미리보기)
    ├── LearnScreen.tsx         # 학습 + 레슨상세 (듀오링고 퀴즈)
    ├── TradeScreen.tsx         # 모의투자 + 종목상세 (토스 Bottom Sheet)
    └── FloWorldScreen.tsx      # 플로월드 + 이벤트 + 마이페이지
```

## 설치 방법

```bash
# 1. 프로젝트 폴더로 이동
cd floco

# 2. 패키지 설치
npm install

# 3. iOS 실행
npx expo start --ios

# 4. Android 실행
npx expo start --android
```

## 듀오링고 알고리즘 구현 내용

### 단계별 잠금해제
- 이전 단계 퀴즈 통과 시 다음 단계 자동 해제
- `getLessonStatus()` 함수로 completed/active/locked 관리

### XP + 레벨 시스템
- 레슨 완료 시 XP 획득
- 500 XP 마다 레벨업
- 레벨업 시 팝업 표시

### 스트릭 시스템
- 매일 학습 시 스트릭 +1
- 7일 연속 시 XP 2배 보너스
- 하루 빠지면 스트릭 초기화

### 하트 시스템
- 기본 5하트
- 오답 시 하트 1개 감소
- Haptic + Vibration 피드백

## 토스 UI 패턴 구현 내용

### Bottom Sheet
- 매수/매도 주문 시 하단에서 올라오는 시트
- 수량 입력 + 금액 계산 + 수수료 표시

### 즉각 피드백
- 거래 성공/실패 시 Toast 메시지
- Haptic Feedback으로 물리적 피드백

### 토스트 메시지
- 성공: 초록 / 실패: 빨강 / 정보: 네이비

## 컬러 시스템
```
Primary:  #1A7FD4
Navy:     #1A2B4A
Green:    #2ECC71
Red:      #E74C3C
Gold:     #F59E0B
BG:       #F0F4F8
```
