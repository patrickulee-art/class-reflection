# 프로젝트 구조 (Project Structure)

## 디렉토리 트리

```
/Users/m2air/coding/project/
├── index.html                    # 메인 애플리케이션 파일 (HTML + CSS + JS 통합)
├── CLAUDE.md                     # MoAI 오케스트레이터 설정 파일
├── .mcp.json                     # MCP(Model Context Protocol) 서버 설정
├── .gitignore                    # Git 추적 제외 패턴 정의
│
├── .github/                      # GitHub 설정 디렉토리
│   └── workflows/                # GitHub Actions 워크플로우 (현재 비어 있음)
│
├── .moai/                        # MoAI-ADK 설정 및 데이터 디렉토리
│   ├── config/                   # 프로젝트 설정 파일
│   │   └── sections/             # 분할된 설정 파일
│   │       ├── user.yaml         # 사용자 이름 등 개인 설정
│   │       ├── language.yaml     # 대화/코드/문서 언어 설정
│   │       └── quality.yaml      # TRUST 5 품질 게이트 설정
│   ├── logs/                     # 세션 로그 저장소
│   ├── specs/                    # SPEC 문서 저장소
│   ├── project/                  # 프로젝트 문서 (현재 디렉토리)
│   │   ├── product.md            # 제품 소개 및 기능 명세
│   │   ├── structure.md          # 프로젝트 구조 설명 (이 파일)
│   │   └── tech.md               # 기술 스택 및 아키텍처
│   └── announcements/            # 다국어 공지사항
│
└── .claude/                      # Claude Code 설정 디렉토리
    ├── rules/moai/               # MoAI 개발 규칙
    │   ├── core/                 # 핵심 원칙 (헌법, TRUST 5)
    │   ├── workflow/             # 워크플로우 규칙 (SPEC, 파일 읽기 최적화)
    │   └── development/          # 개발 표준 (코딩 표준, 스킬 작성)
    ├── skills/                   # MoAI 스킬 정의 파일
    └── agents/                   # 커스텀 에이전트 정의 파일
```

---

## 핵심 파일 역할

### index.html - 메인 애플리케이션

프로젝트의 유일한 애플리케이션 파일로, 약 1,854줄(~64KB)의 단일 HTML 파일입니다. HTML 마크업, CSS 스타일, JavaScript 로직이 모두 하나의 파일에 통합되어 있습니다.

**파일 내 구조 (섹션별 구성):**

| 줄 범위 (대략) | 섹션 | 설명 |
|----------------|------|------|
| 1~9 | HTML Head | 메타 정보, Supabase CDN 로드 |
| 10~700 | CSS Styles | CSS 변수, 컴포넌트 스타일, 반응형 미디어 쿼리 |
| 700~1190 | HTML Body | 탭 네비게이션, 폼, 모달, 통계 영역 |
| 1190~1210 | 변수 선언 | 전역 상수 및 상태 변수 |
| 1210~1270 | 초기화 함수 | DOMContentLoaded 이벤트, 슬라이더/탭 초기화 |
| 1270~1330 | 폼 처리 | 성찰 기록 저장, 폼 리셋 |
| 1330~1430 | 이력 관리 | 기록 목록 렌더링, 카드 UI 생성 |
| 1430~1580 | 통계 기능 | 평균 계산, 연속 기록일, 추세 차트 |
| 1580~1620 | 데이터 관리 | JSON 내보내기, 삭제 모달 |
| 1620~1660 | UI 유틸리티 | 토스트 알림, HTML 이스케이프 |
| 1660~1850 | Supabase 연동 | 인증, 동기화, 세션 관리 |

### HTML 구조 (주요 섹션)

**탭 기반 네비게이션:**
- 성찰 기록 탭 (`#write`): 새 성찰 기록 작성 폼
- 이력 탭 (`#history`): 기존 기록 목록 열람 및 관리
- 통계 탭 (`#stats`): 통계 대시보드 및 추세 분석

**모달 컴포넌트:**
- 삭제 확인 모달 (`#deleteModal`): 기록 삭제 전 확인
- 설정 모달 (`#settingsModal`): Supabase 연결 설정
- 인증 모달 (`#authModal`): 이메일 매직 링크 로그인

**알림 컴포넌트:**
- 토스트 알림 (`#toast`): 저장/삭제/동기화 결과 피드백

---

## 데이터 흐름

### 기록 저장 흐름

```
사용자 입력
    |
    v
폼 제출 (submit 이벤트)
    |
    v
reflection 객체 생성
(id: timestamp, datetime, className, topic, scores, texts)
    |
    +---> LocalStorage 저장 (즉시)
    |         key: 'classReflections'
    |
    +---> Supabase 업로드 (로그인 시)
              table: 'reflections'
              column: { id, user_id, data (JSONB) }
    |
    v
UI 업데이트
    |
    +---> 이력 목록 갱신 (loadHistory)
    +---> 통계 갱신 (updateStats)
    +---> 토스트 알림 표시
```

### 동기화 흐름

```
syncReflections() 호출
    |
    v
Supabase에서 원격 데이터 조회
(SELECT * FROM reflections WHERE user_id = ?)
    |
    v
로컬 데이터 조회
(localStorage.getItem('classReflections'))
    |
    v
ID 기반 병합 (Map 사용)
    |
    +---> 동일 ID: createdAt 비교하여 최신 데이터 채택
    +---> 로컬만 존재: 서버에 INSERT
    +---> 서버만 존재: 로컬에 추가
    |
    v
병합 결과를 양쪽에 저장
    |
    +---> LocalStorage 갱신
    +---> Supabase UPSERT (신규 데이터)
    |
    v
UI 전체 갱신
```

### 인증 흐름

```
사용자: 이메일 입력
    |
    v
Supabase Auth: signInWithOtp (매직 링크)
    |
    v
이메일로 매직 링크 발송
    |
    v
사용자: 이메일의 링크 클릭
    |
    v
Supabase Auth: onAuthStateChange 이벤트
    |
    v
세션 설정 (currentUser 업데이트)
    |
    v
자동 데이터 동기화 실행
    |
    v
UI 상태 업데이트 (로그인 버튼 -> 로그아웃 버튼)
```

---

## 데이터 모델

### Reflection 객체 구조

```javascript
{
    id: Number,                    // Unix timestamp (밀리초) - 고유 식별자
    datetime: String,              // ISO 8601 날짜/시간 (예: "2026-02-12T14:30")
    className: String,             // 수업 대상 (예: "2학년 3반")
    topic: String,                 // 수업 주제
    scores: {
        preparation: Number,       // 수업 준비 충실도 (1~5)
        engagement: Number,        // 학생 집중도/참여도 (1~5)
        timeManagement: Number,    // 시간 관리 (1~5)
        satisfaction: Number,      // 자기 만족도 (1~5)
        energy: Number             // 에너지 레벨 (1~5)
    },
    preparationProcess: String,    // 수업 준비 과정 (서술)
    strengths: String,             // 잘한 점 (서술)
    improvements: String,          // 개선할 점 (서술)
    actionItems: String,           // 다음 수업 적용 사항 (서술)
    createdAt: String              // 생성 시각 (ISO 8601, 동기화 충돌 해결용)
}
```

### LocalStorage 저장 형식

| 키 | 값 | 설명 |
|----|-----|------|
| `classReflections` | JSON 배열 | Reflection 객체 배열 (최신순 정렬) |
| `supabaseConfig` | JSON 객체 | Supabase 연결 설정 (URL, API Key) |

### Supabase 테이블 구조

**reflections 테이블:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | Integer | 기본 키 (클라이언트 생성 timestamp) |
| `user_id` | UUID | Supabase Auth 사용자 ID |
| `data` | JSONB | Reflection 객체 전체 (JSON 형태로 저장) |

---

## 모듈 구성

단일 HTML 파일 구조이므로 물리적 모듈 분리는 없으나, 논리적으로 다음과 같이 구분됩니다.

| 논리 모듈 | 주요 함수 | 역할 |
|-----------|-----------|------|
| 초기화 | `initializeDatetime()`, `initializeSliders()`, `initializeTabs()` | 앱 시작 시 UI 및 이벤트 설정 |
| 데이터 관리 | `getReflections()`, `saveReflections()`, `getLocalReflections()`, `saveLocalReflections()` | 데이터 CRUD 연산 |
| 이력 관리 | `loadHistory()` | 기록 목록 렌더링 |
| 통계 분석 | `updateStats()`, `calculateStreak()`, `updateTrendChart()` | 통계 계산 및 시각화 |
| 데이터 내보내기 | `exportData()` | JSON 파일 다운로드 |
| 삭제 관리 | `openDeleteModal()`, `closeDeleteModal()`, `confirmDelete()` | 기록 삭제 워크플로우 |
| UI 유틸리티 | `showToast()`, `escapeHtml()` | 알림 및 보안 유틸리티 |
| Supabase 연동 | `initSupabase()`, `checkSession()`, `handleSessionChange()` | 백엔드 초기화 및 인증 |
| 동기화 | `syncReflections()` | 로컬-서버 데이터 병합 |
| 인증 | `handleAuthSubmit()`, `handleLogout()`, `toggleAuth()` | 사용자 인증 처리 |
| 설정 | `openSettings()`, `closeSettings()`, `saveSettings()` | Supabase 설정 관리 |
| 동기화 UI | `updateSyncUI()` | 동기화 상태 표시 |
