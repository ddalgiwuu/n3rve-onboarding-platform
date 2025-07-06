# Google OAuth 설정 가이드

## 중요! Google Cloud Console 설정 업데이트 필요

현재 Google OAuth가 백엔드 API URL로 리다이렉트되는 문제를 해결하기 위해 Google Cloud Console에서 설정을 업데이트해야 합니다.

## 설정 단계

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com 접속
   - N3RVE 프로젝트 선택

2. **OAuth 2.0 클라이언트 설정**
   - 좌측 메뉴에서 "APIs & Services" → "Credentials" 클릭
   - OAuth 2.0 Client IDs 섹션에서 사용 중인 클라이언트 클릭

3. **Authorized redirect URIs 업데이트**
   
   현재 설정되어 있을 것으로 예상되는 URI:
   ```
   http://localhost:5001/api/auth/google/callback
   https://n3rve-onboarding.com/api/auth/google/callback
   ```

   **반드시 다음 URI가 포함되어 있어야 합니다:**
   ```
   https://n3rve-onboarding.com/api/auth/google/callback
   ```

   주의사항:
   - `http://` 가 아닌 `https://` 사용
   - 마지막에 슬래시(`/`) 없음
   - 정확히 위의 URL과 일치해야 함

4. **저장**
   - 하단의 "SAVE" 버튼 클릭
   - 변경사항이 적용되는데 몇 분 걸릴 수 있음

## 백엔드 동작 흐름

1. 사용자가 Google 로그인 클릭
2. 프론트엔드가 `https://n3rve-onboarding.com/api/auth/google` 호출
3. 백엔드가 Google OAuth 페이지로 리다이렉트
4. Google이 `https://n3rve-onboarding.com/api/auth/google/callback`로 리다이렉트
5. 백엔드가 인증 처리 후 `https://n3rve-onboarding.com/auth/callback`로 리다이렉트
6. 프론트엔드가 토큰을 받아 로그인 완료

## 문제 해결

### 여전히 localhost로 리다이렉트되는 경우:
1. Google Cloud Console에서 변경사항이 저장되었는지 확인
2. 브라우저 캐시 및 쿠키 삭제
3. 시크릿 모드에서 테스트
4. 5-10분 기다린 후 재시도 (Google 서버에 변경사항 반영 시간)

### invalid_client 에러가 발생하는 경우:
1. Client ID와 Client Secret이 올바른지 확인
2. GitHub Secrets에 올바른 값이 설정되어 있는지 확인
3. 백엔드 컨테이너가 최신 환경변수로 재시작되었는지 확인

## 환경 변수 확인

GitHub Secrets에 다음 값들이 올바르게 설정되어 있어야 합니다:
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL`: https://n3rve-onboarding.com/api/auth/google/callback
- `FRONTEND_URL`: https://n3rve-onboarding.com