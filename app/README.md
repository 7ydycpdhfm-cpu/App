# FocusFlow PWA 배포 가이드

## 📱 완성되면 이렇게 됩니다
- 폰 홈 화면에 앱 아이콘 생성
- 앱처럼 전체 화면으로 실행
- 오프라인에서도 작동
- 일정 시간 알림 (브라우저 알림)

---

## 🚀 Vercel로 배포하기 (무료 · 5분)

### 1단계 — GitHub에 올리기

```bash
# 이 폴더에서 실행
git init
git add .
git commit -m "FocusFlow PWA"
```

GitHub에서 새 레포 만들고:
```bash
git remote add origin https://github.com/내아이디/focusflow.git
git push -u origin main
```

### 2단계 — Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub로 로그인
2. **"New Project"** 클릭
3. 방금 만든 레포 선택
4. **Framework: Vite** 자동 감지됨
5. **Deploy** 클릭 → 1~2분 후 완료

➡️ `https://focusflow-xxx.vercel.app` 같은 URL 발급

---

## 📲 폰에 설치하기

### iPhone (Safari)
1. Safari에서 배포 URL 열기
2. 하단 **공유 버튼(□↑)** 탭
3. **"홈 화면에 추가"** 탭
4. **추가** 탭 → 홈 화면에 앱 아이콘 생성!

### Android (Chrome)
1. Chrome에서 배포 URL 열기
2. 주소창 우측 **⋮** 탭
3. **"앱 설치"** 또는 **"홈 화면에 추가"** 탭
4. **설치** 탭 → 완료!

---

## 🔔 알림 설정
앱 처음 열면 "알림 허용" 팝업이 뜹니다.
**허용** 누르면 일정 시간에 맞춰 자동 알림이 와요.

---

## 💻 로컬에서 먼저 테스트하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 열기

---

## 📦 폴더 구조
```
focusflow-pwa/
├── index.html          ← 진입점
├── vite.config.js      ← PWA 설정 포함
├── package.json
└── src/
    ├── main.jsx        ← React 마운트
    └── App.jsx         ← 전체 앱 코드
```

---

> **Node.js 18 이상** 필요. [nodejs.org](https://nodejs.org) 에서 설치
