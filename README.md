<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Instatoon Creator

인스타툰 캐릭터/대본/배경을 Gemini로 생성하는 Vite + React 앱입니다.

## 주요 기능

- 캐릭터 생성 + 캐릭터 이미지 생성
- 컷 수 기반 대본 생성
- 패널별 배경 이미지 생성
- Gemini API 키 직접 입력
- API 키 기억하기(localStorage 저장)

## 로컬 실행

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. (선택) `.env.local` 파일을 만들고 아래를 설정:
   `VITE_GEMINI_API_KEY=YOUR_KEY`
3. 또는 앱 실행 후 상단 API 키 입력 칸에 키를 입력하고 `기억하기`를 체크
3. Run the app:
   `npm run dev`

## Vercel 배포

1. GitHub 저장소를 Vercel에 Import
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Environment Variables에 `VITE_GEMINI_API_KEY` 추가(선택)

참고:
- 환경변수를 설정하지 않아도 사용자가 브라우저에서 API 키를 입력해 사용할 수 있습니다.
- 환경변수 키가 있더라도 입력칸에 값을 넣으면 입력값이 우선 적용됩니다.
