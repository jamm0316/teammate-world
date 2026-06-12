# 팀메이트 월드 — PWA 전환 스펙

> 결정 사항 (2026-06-12 합의)
> - 화면: **세로(portrait) 고정** + 휴대폰 디스플레이 크기별 반응형
> - 오프라인: **설치형 + 빠른 로딩** (완전 오프라인 X — 실시간 앱 성격에 맞춤)
> - 툴링: **바닐라 유지** (빌드 도구 없이 manifest.json + sw.js 직접 작성)
> - 아이콘: `~/Downloads/logo_transparent.webp` (1024×600) 를 가공해서 사용

> **구현 상태 (2026-06-12 완료, branch `feature/pwa-portrait-conversion`)** — 이 스펙은 전부 구현됨.
> - 아이콘 가공 도구: ImageMagick 미설치 확인 → **macOS `sips`로 생성**. 일반 폭 85%, maskable 폭 65%(safe zone), apple-touch는 JPEG 경유 alpha 플래튼으로 불투명 처리(`hasAlpha: no`).
> - 신규 파일: `frontend/manifest.json`, `frontend/sw.js`(`CACHE_VERSION = 'tw-v1'`), `frontend/assets/icons/`(icon-192/512, icon-maskable-192/512, apple-touch-icon, 원본 logo_transparent.webp).
> - `index.html`: head 메타 보강 + 첫 `<script>` 블록 끝에 SW 등록, `#rotate` 가로 유도 제거, `.stage`/`.stage-wrap` flex 채움, `100dvh`/`88dvh`, `.app` safe-area padding 적용. 게임 카메라/월드 좌표 로직 무변경.

---

## 1. 현재 상태 (As-Is)

- `frontend/index.html` 단일 파일, 빌드 없음
- 외부 리소스: Google Fonts (Black Han Sans / Gothic A1 / Jua), three.js 0.160.0 (unpkg CDN, importmap)
- 로컬 에셋: `frontend/assets/gifts/chicken/Chicken_01.{obj,mtl}`
- **가로 유도 구조**: 폭 760px 미만이면 `#rotate` 오버레이("기기를 가로로 돌려주세요") 표시 (`index.html:449`, `:219`)
- 게임 스테이지가 `aspect-ratio:16/10` 고정 → 세로 폰에서 화면 상단에 납작하게 보임
- PWA 요소 없음: manifest 無, service worker 無, 아이콘 無

## 2. 목표 (To-Be)

1. 홈 화면에 설치 가능한 PWA (Android Chrome / iOS Safari "홈 화면에 추가")
2. standalone 모드로 주소창 없이 앱처럼 구동
3. **세로 고정** — 모든 화면(온보딩/뽑기/게임 월드)이 세로 기준으로 동작
4. 휴대폰 디스플레이 크기(320~430px 폭, 노치/홈바 포함)에 따른 반응형
5. 재방문 시 정적 리소스 캐시로 빠른 로딩, 오프라인이어도 셸은 뜨는 수준

---

## 3. 디렉토리 구조 (추가 파일)

```
frontend/
├── index.html          # head/메타 수정, SW 등록 추가
├── manifest.json       # 신규
├── sw.js               # 신규 (루트에 둬야 scope가 전체에 적용됨)
└── assets/
    └── icons/
        ├── icon-192.png            # 신규
        ├── icon-512.png            # 신규
        ├── icon-maskable-192.png   # 신규
        ├── icon-maskable-512.png   # 신규
        └── apple-touch-icon.png    # 신규 (180×180)
```

## 4. 아이콘 가공 스펙

원본: `/Users/evan/Downloads/logo_transparent.webp` (1024×600, 투명 배경)

| 파일 | 크기 | 가공 방법 |
|---|---|---|
| icon-192.png / icon-512.png | 192² / 512² | 정사각 캔버스(배경 `#14111d`) 중앙에 로고를 **폭 기준 85%**로 배치 |
| icon-maskable-192.png / icon-maskable-512.png | 192² / 512² | 동일하되 로고를 **폭 기준 65%**로 축소 배치 (maskable safe zone = 중앙 80% 원 안에 들어와야 함) |
| apple-touch-icon.png | 180² | icon-192와 동일 규격, 배경 불투명 필수 (iOS는 투명 배경을 검정으로 칠함) |

- 변환은 macOS `sips` 또는 ImageMagick 사용 (webp → png 리사이즈/패딩)
- 원본 webp도 `assets/icons/` 에 보관

## 5. manifest.json

```json
{
  "name": "팀메이트 월드",
  "short_name": "팀메이트",
  "description": "1~4기 다같이, 손 안에서 — 팀메이트 라이브 월드",
  "lang": "ko",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#14111d",
  "theme_color": "#14111d",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "assets/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

주의: `orientation`은 Android 설치형에서만 강제됨. iOS는 무시하므로 세로 레이아웃 자체가 가로에서도 깨지지 않게 CSS로 보장한다 (6절).

## 6. index.html 수정 스펙

### 6-1. head 추가/변경

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#14111d">
<link rel="manifest" href="manifest.json">
<!-- iOS -->
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="팀메이트">
```

- 기존 viewport meta(`index.html:2`)에 `viewport-fit=cover`만 추가
- `<!DOCTYPE html><html lang="ko">` 등 문서 골격이 없으면 함께 보강

### 6-2. Service Worker 등록 (body 끝 스크립트)

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
```

### 6-3. 세로 반응형 전환

1. **가로 유도 제거**: `#rotate` 오버레이(HTML `:251`, CSS `:214-219`, JS `:449`) 전부 삭제
2. **스테이지 세로 채움**: `.stage`의 `aspect-ratio:16/10` 제거 → `flex:1` + `min-height:0`으로 HUD 아래 남은 세로 공간을 전부 채움. `.stage-wrap`도 `flex:1; display:flex; flex-direction:column` 으로 변경
3. **dvh 사용**: `min-height:100vh` → `min-height:100dvh` (모바일 주소창 수축 대응, `html,body`와 `.app` 두 곳)
4. **safe-area 대응**: `.app`에 `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` (노치/홈바)
5. **카메라/월드 로직은 무수정**: `view.w/h`는 `getBoundingClientRect()` 기반이라 세로 뷰포트에서도 그대로 동작. `WORLD(1800×1100)`는 카메라 스크롤로 탐색하므로 변경 불필요
6. **HUD/보드 좁은 폭 대응**: 320~430px 폭에서 HUD 버튼이 줄바꿈 없이 들어가는지 확인, 필요 시 버튼 패딩/폰트를 `clamp()`로 축소 (보드는 이미 `clamp()` 적용됨)
7. **모달**: `.modal { max-height:88vh }` → `88dvh`

검증 뷰포트: 320×568 (SE), 390×844 (iPhone 14), 412×915 (Galaxy), 430×932 (Pro Max)

## 7. sw.js 스펙

### 7-1. 전략 요약

| 대상 | 전략 | 이유 |
|---|---|---|
| `index.html` (navigate 요청) | **Network-first**, 실패 시 캐시 fallback | 항상 최신 코드, 오프라인 시 셸 제공 |
| 로컬 정적 에셋 (icons, obj/mtl, manifest) | **Cache-first** | 변경 적음, 빠른 로딩 |
| Google Fonts CSS (`fonts.googleapis.com`) | **Stale-while-revalidate** | CSS는 UA별로 갱신될 수 있음 |
| Google Fonts woff2 (`fonts.gstatic.com`) | **Cache-first** | URL이 불변 |
| three.js (`unpkg.com`) | **Cache-first** | 버전 고정 URL(0.160.0)이라 불변 |
| 그 외 / 비-GET 요청 | passthrough (가로채지 않음) | storage API 등 동적 요청 보호 |

### 7-2. 구현 규칙

```js
const CACHE_VERSION = 'tw-v1';   // 배포 시 수동으로 올림
const PRECACHE = ['./', 'manifest.json',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];
```

- **install**: PRECACHE 저장 후 `self.skipWaiting()`
- **activate**: `CACHE_VERSION` 과 다른 캐시 전부 삭제 후 `self.clients.claim()` → 새 버전 즉시 적용 (POC라 업데이트 알림 UI는 생략)
- **fetch**:
  - `request.method !== 'GET'` → return (가로채지 않음)
  - `request.mode === 'navigate'` → network-first, 실패 시 `caches.match('./')`
  - 위 표의 도메인/경로 매칭으로 cache-first / SWR 분기
  - 응답 `ok`(status 200)일 때만 캐시에 저장. opaque 응답(cross-origin no-cors)은 캐시하지 않음 — fonts/unpkg는 CORS 응답이라 문제 없음
- 3D 에셋(obj/mtl)은 precache하지 않고 **runtime cache** (선물 종류가 늘어나도 sw.js 수정 불필요)

### 7-3. 업데이트 흐름

1. 코드 변경 배포 시 `CACHE_VERSION` 을 올린다 (`tw-v1` → `tw-v2`)
2. 사용자가 재방문하면 새 SW가 install → skipWaiting → 구캐시 삭제 → 다음 로드부터 신버전
3. index.html 자체는 network-first라 SW 갱신과 무관하게 항상 최신

## 8. 전제 조건 / 제약

- **HTTPS 필수**: SW와 설치 프롬프트는 https(또는 localhost)에서만 동작. 배포 환경이 정해지면 확인 필요
- **iOS 제약**: `orientation` 무시됨(세로 CSS로 커버), `beforeinstallprompt` 없음(사용자가 공유 → 홈 화면에 추가), webp 아이콘 미지원 → png 필수
- `window.storage` 호스트 API는 SW와 무관 (fetch 기반이 아니므로 캐싱 영향 없음). 단 storage API가 없는 환경에선 기존대로 메모리 fallback

## 9. 수용 기준 (Acceptance Criteria)

- [ ] Chrome DevTools > Application 에서 manifest 항목 전부 인식, "installable" 경고 없음
- [ ] Android Chrome 설치 → standalone(주소창 없음) + 세로 고정 구동
- [ ] iOS Safari "홈 화면에 추가" → 아이콘/이름 정상, standalone 구동
- [ ] 세로 모드에서 온보딩/뽑기/게임 월드 모두 레이아웃 깨짐 없음 (320/390/412/430px 폭)
- [ ] "돌려주세요" 오버레이가 더 이상 존재하지 않음
- [ ] 첫 방문 후 오프라인 전환 → 새로고침 시 셸(index.html)이 캐시에서 로드됨
- [ ] 폰트/three.js가 두 번째 방문부터 캐시에서 서빙됨 (Network 탭에서 "ServiceWorker" 표시)
- [ ] `CACHE_VERSION` 변경 배포 후 재방문 시 구캐시가 삭제됨
