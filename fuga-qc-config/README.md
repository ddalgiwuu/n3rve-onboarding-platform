# FUGA QC Configuration Management

이 폴더는 FUGA Quality Control (QC) 검증 규칙과 도움말 콘텐츠를 관리합니다.

## 📁 파일 구조

```
fuga-qc-config/
├── version.json          # 버전 정보
├── validation-rules.json # 검증 규칙
├── help-content.json     # 도움말 내용
├── changelog.md          # 변경 이력
└── README.md            # 이 파일
```

## 🔧 업데이트 방법

### 1. 검증 규칙 수정 (validation-rules.json)

```json
{
  "terms": {
    "promotional": ["NEW", "HOT", ...] // 홍보 문구 추가/제거
  }
}
```

### 2. 도움말 내용 수정 (help-content.json)

```json
{
  "faq": [
    {
      "question": "새로운 질문",
      "answer": "답변 내용"
    }
  ]
}
```

### 3. 버전 업데이트 (version.json)

```json
{
  "version": "1.0.1",  // 버전 증가
  "lastUpdated": "2025-07-14",  // 날짜 업데이트
  "updatedBy": "관리자 이름",
  "description": "변경 사항 설명"
}
```

### 4. 변경 이력 기록 (changelog.md)

```markdown
## [1.0.1] - 2025-07-14
### Changed
- 홍보 문구 목록에 "TRENDING" 추가
- FAQ에 새로운 질문 추가
```

## 📋 주요 섹션 설명

### validation-rules.json

- **patterns**: 정규표현식 패턴
- **terms**: 금지어, 제한어 목록
- **languageSpecific**: 언어별 특수 규칙
- **formatting**: 포맷 관련 규칙
- **rules**: 각 필드별 검증 규칙
- **messages**: 오류/경고 메시지

### help-content.json

- **overview**: FUGA QC 소개
- **process**: QC 프로세스 단계
- **commonErrors**: 자주 발생하는 오류 예시
- **languageRules**: 언어별 표기 규칙
- **genres**: 장르 가이드
- **metadata**: 메타데이터 가이드
- **audioSpecs**: 음원 파일 규격
- **albumArt**: 앨범아트 규격
- **timeline**: 처리 시간
- **tips**: 프로 팁
- **faq**: 자주 묻는 질문

## ⚠️ 주의사항

1. **JSON 문법 확인**: 수정 후 반드시 JSON 유효성 검사
2. **인코딩**: UTF-8 인코딩 유지
3. **버전 관리**: 모든 변경사항은 버전 업데이트 필수
4. **테스트**: 로컬에서 충분히 테스트 후 배포

## 🚀 배포 프로세스

1. JSON 파일 수정
2. version.json 업데이트
3. changelog.md 업데이트
4. Git 커밋 & 푸시
5. 배포 스크립트 실행: `./scripts/deploy.sh`

## 💡 유용한 도구

- JSON 검증: https://jsonlint.com/
- 정규표현식 테스트: https://regex101.com/
- 유니코드 문자 확인: https://unicode-table.com/

## 📞 문의

QC 규칙 관련 문의: N3RVE 기술팀