# FLOCO 플랫폼별 네이티브 개발 가이드라인

> 코드 생성 및 수정 시 플랫폼별 아래 스펙을 반드시 준수한다.

---

## iOS 스펙

| 항목 | 사양 |
|------|------|
| 언어 | Swift 5.9+ |
| UI 프레임워크 | SwiftUI (Xcode 15+) |
| 최소 타깃 | iOS 16.0 |
| 의존성 관리 | Swift Package Manager (SPM) |

### 코드 작성 규칙

- SwiftUI 전용으로 작성 (UIKit 사용 금지, 단 필수 인터랙션 브릿지 제외)
- `@Observable` 매크로 활용 (iOS 17+) / 하위 호환 시 `ObservableObject`
- SPM `Package.swift`로 의존성 선언, CocoaPods 사용 금지

```swift
// ✅ 올바른 예 — SwiftUI + SPM
import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("Hello, FLOCO")
    }
}
```

---

## Android 스펙

| 항목 | 사양 |
|------|------|
| 언어 | Kotlin 1.9+ |
| UI 프레임워크 | Jetpack Compose |
| IDE | Android Studio Hedgehog+ |
| 최소 SDK | API 26 (Android 8.0) |
| 의존성 관리 | Gradle + Version Catalog (`libs.versions.toml`) |

### 코드 작성 규칙

- Jetpack Compose 전용으로 작성 (XML 레이아웃 사용 금지)
- 의존성 버전은 `gradle/libs.versions.toml`에서 중앙 관리
- `minSdk = 26`, `targetSdk`는 최신 안정 API 유지

```kotlin
// ✅ 올바른 예 — Compose + Version Catalog
@Composable
fun GreetingScreen() {
    Text(text = "Hello, FLOCO")
}
```

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "1.9.0"
compose-bom = "2024.02.00"

[libraries]
compose-ui = { group = "androidx.compose.ui", name = "ui" }
```

---

## 배포 방식

| 플랫폼 | 채널 |
|--------|------|
| iOS | TestFlight (내부 테스트 → 외부 베타) |
| Android | Google Play 내부 테스트 트랙 |

---

## 현재 프로젝트 컨텍스트

이 프로젝트는 **Expo (React Native)** 기반으로 개발 중이며, 위 네이티브 스펙은 향후 네이티브 모듈 작성, 플러그인 개발, 또는 완전 네이티브 전환 시 적용한다.

- Expo 환경: `react-native-svg`, `expo-secure-store` 등 Expo 호환 라이브러리 우선 사용
- 네이티브 브릿지가 필요한 경우: iOS는 Swift SPM 모듈, Android는 Kotlin Gradle 모듈로 작성
