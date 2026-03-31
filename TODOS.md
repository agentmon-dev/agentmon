# TODOS

## macOS/Windows 코드 사이닝 파이프라인
- **What:** Bun 컴파일 바이너리의 macOS 코드 사이닝/공증 + Windows 서명 CI/CD 파이프라인
- **Why:** macOS Gatekeeper가 미공증 바이너리를 차단함. Windows Defender가 미서명 바이너리를 의심함. npm 배포 시 사용자가 실행하지 못하는 상황 발생
- **Pros:** 사용자가 보안 경고 없이 설치 가능. 신뢰도 향상
- **Cons:** Apple Developer 계정($99/yr), Windows 코드 사이닝 인증서 비용. CI/CD 복잡도 증가
- **Context:** Step 10 (배포) 단계에서 해결. esbuild, turbo 등 Bun 바이너리를 npm으로 배포하는 프로젝트들의 CI/CD 참조. GitHub Actions에서 macOS runner로 `codesign` + `notarytool` 실행
- **Depends on:** Step 10 배포 단계 진입 시
