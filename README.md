# 🌐 팀메이트 월드

### ▶️ [지금 바로 입장하기](https://jamm0316.github.io/teammate-world/frontend/)

> 1~4기 다같이, 손 안에서 — 팀메이트 라이브 월드

캐릭터를 뽑아 입장하고, 같은 공간에서 기수를 넘어 함께 어울리는 모바일 라이브 월드입니다. 별도 설치 없이 위 링크로 바로 시작할 수 있고, "홈 화면에 추가"로 앱처럼 사용할 수 있어요.

---

## ✨ 주요 기능

- **캐릭터 뽑기 & 입장** — 닉네임, 기수(1~4기), 멘토/멘티, 성별을 고르면 외형에 반영된 캐릭터로 월드에 입장합니다.
- **세로 라이브 월드** — 휴대폰 세로 화면에 맞춘 3D 월드에서 기수에 상관없이 다 같이 어울립니다.
- **웰컴 선물 & 쪽지** — 입장과 함께 도착하는 웰컴 선물(3D 에셋)과 쪽지로 첫 만남을 챙겨줍니다. (선물은 단 한 번만 전송 가능)
- **운세존 (사주·타로)** — 라운지 구석에 자리한 점술가 NPC에게 걸어가 탭하면 사주 풀이와 타로 3장 뽑기(메이저 아르카나 22장, 과거·현재·미래)를 볼 수 있습니다.
- **PWA 설치형** — `manifest.json` + Service Worker 기반으로 홈 화면 설치, standalone 실행, 재방문 시 빠른 로딩을 지원합니다.

## 📱 홈 화면에 추가하기 (앱처럼 사용)

- **Android (Chrome):** 메뉴 → "홈 화면에 추가"
- **iOS (Safari):** 공유 버튼 → "홈 화면에 추가"

설치하면 주소창 없이 세로 고정 standalone 모드로 실행됩니다.

## 🛠 기술 스택

- 빌드 도구 없는 **바닐라** 구성 (단일 `index.html` + `manifest.json` + `sw.js`)
- **three.js** 0.160.0 (unpkg CDN, importmap) 기반 3D 렌더링
- Google Fonts (Black Han Sans / Gothic A1 / Jua)

## 📂 프로젝트 구조

```
teammate-world/
├── frontend/
│   ├── index.html       # 앱 본체 (온보딩 · 뽑기 · 월드)
│   ├── games.js         # 종목 (줄다리기 · 팀 계주)
│   ├── fortune.js       # 운세존 (사주 · 타로)
│   ├── manifest.json    # PWA 매니페스트
│   ├── sw.js            # 서비스 워커 (캐시 버전 tw-v11)
│   └── assets/
│       ├── icons/       # PWA 아이콘 세트
│       └── gifts/       # 웰컴 선물 3D 에셋 (.obj/.mtl)
└── docs/
    ├── pwa-spec.md      # PWA 전환 스펙 문서
    └── decisions/       # 설계 결정 기록 (ADR)
```

## 💻 로컬에서 실행하기

정적 파일이므로 간단한 로컬 서버만 있으면 됩니다.

```bash
cd frontend
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

> Service Worker는 `https` 또는 `localhost`에서만 동작합니다.
