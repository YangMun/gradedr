# GradeR — 학점 계산기

[![Live Demo](https://img.shields.io/badge/Live-gradedr.com-6366f1?style=flat-square&logo=netlify)](https://gradedr.com)

**GradeR**는 대학생을 위한 모바일 최적화 학점 관리 앱입니다.  
성적을 입력하면 GPA를 즉시 계산하고, 목표 학점 달성을 위한 계획을 세울 수 있어요.

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 📊 **학점 계산기** | 4.5 / 4.3 만점제, 100점제 지원. 학기별 GPA + 전체 누적 GPA 실시간 계산 |
| 🎯 **목표 학점 역산기** | 목표 GPA 달성에 필요한 앞으로의 평점을 즉시 역산 |
| 📈 **성적 시각화** | 과목별 막대 차트, 학기별 추이 라인 차트, 등급 분포 도넛 차트 (Chart.js) |
| 🧪 **성적 시뮬레이터** | 중간고사 점수와 비중을 입력하면 목표 등급에 필요한 기말고사 점수를 계산 |
| 💾 **데이터 관리** | JSON 파일 내보내기/가져오기, URL 공유, 브라우저 LocalStorage 영구 저장 |
| 🌙 **다크 모드** | 시스템 설정과 독립적으로 토글 가능 |
| 📱 **PWA 지원** | 홈 화면 설치, 오프라인 접속 가능 |
| 🎓 **졸업 학점 관리** | 목표 졸업 학점 설정 시 진행률 바 표시 |
| 🏷️ **과목 구분** | 전공 / 교양 / 기타 분류 및 색상 뱃지 |
| ↩️ **삭제 취소** | 과목 삭제 후 4초 내에 취소(Undo) 가능 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 언어 | HTML5 / CSS3 / Vanilla JavaScript (ES Modules) |
| 폰트 | [Pretendard Variable](https://github.com/orioncactus/pretendard) (CDN) |
| 아이콘 | [Phosphor Icons Bold](https://phosphoricons.com) (CDN) |
| 차트 | [Chart.js 4](https://www.chartjs.org) (CDN) |
| 저장소 | LocalStorage (빌드 도구 없음, 서버 없음) |
| 배포 | [Netlify](https://netlify.com) → [gradedr.com](https://gradedr.com) |
| 빌드 | 없음 — 파일을 열면 바로 실행 |

### 디자인 레퍼런스

- **Vercel Geist** — 색상 팔레트 (true neutral), 플랫 카드 스타일
- **Linear** — 다크 모드 깊이감, 인디고/퍼플 액센트
- **Toss** — 굵은 숫자 표기법, 한국어 모바일 UX
- **Apple HIG** — 바텀 시트 모달, 탭 바, 세그먼트 컨트롤
- **shadcn/ui** — 버튼, 인풋, 배지 컴포넌트 구조

---

## 로컬 실행

별도의 빌드 과정이 없어요. 저장소를 클론한 뒤 `index.html`을 브라우저에서 열면 됩니다.

```bash
git clone https://github.com/YangMun/gradedr.git
cd gradedr
npx serve .   # ES Module을 위한 로컬 서버 (권장)
```

> ES Modules는 `file://` 프로토콜에서 CORS 오류가 발생할 수 있어요.  
> `npx serve .` 또는 VS Code Live Server 확장을 사용하는 것을 권장합니다.

---

## 프로젝트 구조

```
gradedr/
├── index.html          # 단일 페이지 앱 마크업
├── manifest.json       # PWA 메타데이터
├── service-worker.js   # 오프라인 캐시 전략
├── favicon.svg         # 앱 아이콘 (SVG 그라디언트)
├── netlify.toml        # Netlify 캐시 + 보안 헤더 설정
├── css/
│   ├── variables.css   # 디자인 토큰 (색상, 타이포그래피, 간격, 모션)
│   ├── base.css        # 리셋 + 기반 스타일 + 유틸리티
│   ├── components.css  # 버튼, 카드, 입력, 모달, 토스트, 세그먼트 컨트롤
│   └── sections.css    # 섹션 레이아웃, 탭, 과목 목록, GPA 카드
└── js/
    ├── app.js          # 앱 진입점 (모듈 초기화 조율)
    ├── storage.js      # LocalStorage 읽기/쓰기 (스키마 마이그레이션 포함)
    ├── calculator.js   # GPA 계산 + 과목 CRUD + 렌더링
    ├── semesters.js    # 학기 탭 CRUD
    ├── gradeScale.js   # 학점 체계 순수 함수 (4.5/4.3/100)
    ├── targetGpa.js    # 목표 학점 역산 계산
    ├── simulator.js    # 기말 필요 점수 계산
    ├── charts.js       # Chart.js 지연 초기화 + 렌더링
    ├── dataIO.js       # JSON 내보내기/가져오기 + URL 공유
    ├── graduation.js   # 졸업 학점 목표 + 진행률 바
    └── ui.js           # 테마, 내비게이션, 토스트, 모달 헬퍼
```

---

## 브랜치 전략

```
main                           ← 배포 브랜치 (Netlify 연결)
└── claude/gpa-calculator-app  ← 통합 브랜치
    ├── feature/gpa-calculator
    ├── feature/redesign-ui
    ├── feature/ux-improvements
    ├── feature/pwa
    └── feature/docs
```

`feature/*` → 통합 브랜치 PR (squash merge) → `main` (regular merge)

---

## 기여 방법

버그 제보나 기능 제안은 [GitHub Issues](https://github.com/YangMun/gradedr/issues)를 이용해주세요.

---

## 라이선스

MIT License

---

*GradeR는 모든 학기 데이터를 브라우저 LocalStorage에만 저장하며, 서버로 어떤 데이터도 전송하지 않습니다.*
