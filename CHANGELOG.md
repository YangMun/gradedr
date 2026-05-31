# Changelog

GradeR의 모든 주요 변경사항을 기록합니다.  
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따릅니다.

---

## [v2.0.0] — 2025-05-31

### 디자인 전면 재설계

- Vercel Geist neutral 팔레트 적용 (#fafafa / #0a0a0a 베이스)
- Indigo → Purple 그라디언트 액센트 (#6366f1 → #a855f7)
- 플랫 카드 스타일 (그림자 없음, 테두리만, radius 24px)
- 세그먼트 컨트롤로 학점 체계 선택 (iOS UISegmentedControl 스타일)
- GPA 숫자 Hero 스타일 (Tabular nums, 그라디언트 텍스트, 40px)
- 과목 행 왼쪽 색상 accent bar + 60px 터치 영역
- 바텀 시트 모달 (Apple HIG — slide-up + backdrop blur)
- 토스트 위치를 하단 내비게이션 바로 위로 이동
- 내비게이션 활성 탭 dot indicator + spring 애니메이션

### 신규 기능

- **과목 구분** (전공 / 교양 / 기타): 색상 칩 표시, 수정 모달에서도 변경 가능
- **과목 삭제 Undo**: 삭제 즉시 4초 undo 토스트 → 취소 시 복구
- **학기 통계**: 최고/최저 성적 과목, 평균 학점수 인라인 표시
- **졸업 학점 진행률**: 데이터 관리에서 목표 학점 설정 → GPA 카드에 progress bar
- **PWA**: `manifest.json` + `service-worker.js` → 홈 화면 설치, 오프라인 캐시

### 버그 수정

- `form.cloneNode()` 제거: 이벤트 중복 및 입력 소실 문제 해결
- `confirm()` 대체: 커스텀 confirm-modal로 교체 (iOS Safari 차단 방지)
- `<button>` 안 `<button>` 중첩 제거: 탭 삭제 버튼을 `<span role="button">`으로 변경
- 100점제 과목 수정 모달: 저장된 `"85점 → B+"` 형식에서 성적 올바르게 표시
- 빈 상태 GPA `0.00` → `—` 표시
- 목표 학점 탭 prefill을 이벤트 기반으로 변경 (과목 추가 후 탭 이동 시 즉시 갱신)
- 시뮬레이터 학점 체계 변경 시 즉시 재계산
- `storage.js` v1→v2 마이그레이션: 기존 과목에 `type: 'major'` 자동 추가

---

## [v1.1.0] — 2025-05

### 추가

- Netlify 배포 + 커스텀 도메인 gradedr.com 연결
- `netlify.toml` 캐시/보안 헤더 설정 (X-Frame-Options, CSP 등)
- `favicon.svg` — G 로고 (인디고 → 퍼플 그라디언트)
- OG 태그 (og:title, og:description, og:image) — 카카오톡/슬랙 링크 미리보기

---

## [v1.0.0] — 2025-05

### 최초 배포

- 학점 계산기: 4.5 / 4.3 만점제, 100점제 — 학기별 + 누적 GPA
- 목표 학점 역산기: 남은 학점 수와 목표 평점 입력 시 필요 점수 계산
- 학기 관리: LocalStorage 저장, 탭 추가/삭제
- 성적 시각화: 과목별 막대, 학기 추이 라인, 등급 도넛 차트 (Chart.js)
- 성적 시뮬레이터: 중간고사 점수 + 비중 → 기말 필요 점수
- 데이터 내보내기/가져오기: JSON 파일 + URL 공유
- 다크 모드 토글 (LocalStorage 저장)
- 모바일 최적화 UI (Pretendard 폰트 + Phosphor Icons)
