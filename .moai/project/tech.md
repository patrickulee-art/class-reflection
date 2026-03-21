# 기술 스택 (Technology Stack)

## 기술 스택 개요

| 계층 | 기술 | 버전 | 역할 |
|------|------|------|------|
| 프론트엔드 | HTML5 / CSS3 / Vanilla JavaScript (ES6+) | - | 전체 UI 및 클라이언트 로직 |
| 백엔드 서비스 | Supabase (BaaS) | JS Client v2 | 인증, 데이터 저장, 실시간 동기화 |
| 로컬 저장소 | Web Storage API (LocalStorage) | - | 오프라인 데이터 영구 저장 |
| 배포 | Vercel | - | 정적 호스팅 (zero-config) |
| 버전 관리 | Git / GitHub | - | 소스 코드 관리 |

---

## 프레임워크 선택 근거

### 프레임워크 없음 (Vanilla JS) 채택 이유

이 프로젝트는 의도적으로 별도의 프레임워크(React, Vue, Angular 등)를 사용하지 않습니다.

**선택 근거:**

| 관점 | 설명 |
|------|------|
| 단순성 | 단일 HTML 파일로 전체 앱 구성, 빌드 도구 불필요 |
| 배포 용이성 | 파일 하나만 호스팅하면 즉시 배포 완료 |
| 의존성 최소화 | 외부 라이브러리 의존 없이 장기 유지보수 용이 |
| 학습 비용 제로 | 프레임워크 학습 없이 웹 표준만으로 개발 가능 |
| 빠른 로딩 | 프레임워크 번들 없이 빠른 초기 로딩 속도 |
| 대상 규모 적합성 | 단일 사용자 도구로서 프레임워크급 상태 관리 불필요 |

**트레이드오프:**

| 장점 | 단점 |
|------|------|
| 빌드 단계 없음 | 코드가 한 파일에 집중 (~1,854줄) |
| 번들러/패키지 관리자 불필요 | 컴포넌트 재사용성 제한적 |
| CDN만으로 외부 라이브러리 로드 | 대규모 확장 시 리팩토링 필요 |
| 즉시 실행 가능 | 자동화된 테스트 설정이 복잡 |

---

## 외부 의존성

### Supabase JavaScript Client v2

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

| 항목 | 설명 |
|------|------|
| 라이브러리 | @supabase/supabase-js |
| 버전 | v2 (CDN을 통한 최신 v2 로드) |
| 로드 방식 | jsDelivr CDN |
| 용도 | 인증(Auth), 데이터베이스(PostgreSQL), 실시간 동기화 |
| 필수 여부 | 선택적 (오프라인에서도 LocalStorage로 기본 기능 동작) |

이 프로젝트는 `package.json`이 없으며, npm/yarn 등의 패키지 관리자를 사용하지 않습니다. Supabase 클라이언트가 유일한 외부 의존성이며, CDN을 통해 로드됩니다.

---

## 개발 환경 요구사항

### 최소 요구사항

| 항목 | 요구 사항 |
|------|-----------|
| 웹 브라우저 | 모던 브라우저 (Chrome, Firefox, Safari, Edge) |
| 텍스트 편집기 | 아무 편집기 (VS Code 권장) |
| 로컬 서버 | 선택사항 (file:// 프로토콜로도 동작 가능) |

### 추가 도구 (선택)

| 도구 | 용도 |
|------|------|
| Git | 버전 관리 |
| Vercel CLI | 배포 관리 |
| Live Server (VS Code 확장) | 로컬 개발 시 실시간 미리보기 |

### 개발 시작 방법

별도의 설치 과정이 필요하지 않습니다.

1. 저장소를 클론합니다: `git clone https://github.com/patrickulee-art/class-reflection.git`
2. `index.html` 파일을 브라우저에서 직접 열거나, 로컬 서버를 실행합니다
3. 개발 완료 후 Git 커밋 및 Vercel에 자동 배포됩니다

---

## 빌드 및 배포 설정

### 빌드 프로세스

이 프로젝트에는 **빌드 프로세스가 없습니다**. 소스 코드가 곧 배포 코드입니다.

- 트랜스파일링: 불필요 (ES6+ 네이티브 사용)
- 번들링: 불필요 (단일 HTML 파일)
- 미니파이: 적용하지 않음
- CSS 전처리: 불필요 (CSS 변수 활용)

### Vercel 배포 설정

| 설정 항목 | 값 |
|-----------|-----|
| 프레임워크 프리셋 | Other (정적 사이트) |
| 빌드 명령어 | 없음 |
| 출력 디렉토리 | `.` (루트) |
| 엔트리 파일 | `index.html` |
| 배포 방식 | Git push 시 자동 배포 |

Vercel은 `index.html` 파일을 자동으로 감지하여 정적 사이트로 배포합니다. 별도의 설정 파일(`vercel.json`)이 필요하지 않은 zero-config 방식입니다.

### 배포 플로우

```
로컬 개발
    |
    v
git commit & push (main 브랜치)
    |
    v
Vercel 자동 감지 (GitHub 연동)
    |
    v
정적 파일 배포 (index.html)
    |
    v
CDN 배포 (전 세계 엣지 네트워크)
    |
    v
프로덕션 URL에서 서비스 제공
```

---

## 데이터베이스 및 저장소 아키텍처

### 이중 저장소 전략 (Dual Persistence)

이 프로젝트는 오프라인 우선(Offline-first) 전략으로 두 가지 저장소를 병행합니다.

```
사용자 데이터
    |
    +---> [1차 저장소] LocalStorage (브라우저)
    |         - 항상 사용 가능
    |         - 오프라인 동작 보장
    |         - 키: 'classReflections'
    |         - 용량 제한: 약 5~10MB
    |
    +---> [2차 저장소] Supabase PostgreSQL (클라우드)
              - 로그인 시에만 활성화
              - 크로스 디바이스 동기화
              - 테이블: 'reflections'
              - 용량: 사실상 무제한 (무료 티어 500MB)
```

### LocalStorage 상세

| 항목 | 설명 |
|------|------|
| 저장 키 | `classReflections` |
| 데이터 형식 | JSON 문자열 (Reflection 객체 배열) |
| 지속성 | 브라우저 데이터 삭제 전까지 영구 보존 |
| 용량 한계 | 브라우저당 약 5~10MB |
| 접근 방식 | `localStorage.getItem()` / `localStorage.setItem()` |

### Supabase 상세

| 항목 | 설명 |
|------|------|
| 서비스 | Supabase (오픈소스 Firebase 대안) |
| 데이터베이스 | PostgreSQL |
| 테이블명 | `reflections` |
| 데이터 저장 방식 | JSONB 컬럼에 전체 Reflection 객체 저장 |
| 인증 방식 | Supabase Auth (매직 링크) |
| API 접근 | Supabase JS Client v2 (RESTful + 실시간) |
| 호스팅 | Supabase 클라우드 |
| 무료 티어 | 500MB 데이터베이스, 50,000 MAU, 무제한 API 요청 |

### 동기화 전략

| 전략 | 설명 |
|------|------|
| 병합 기준 | ID (Unix timestamp) 기반 매칭 |
| 충돌 해결 | `createdAt` 필드 비교, 최신 데이터 우선 |
| 방향 | 양방향 (Bidirectional) |
| 트리거 | 로그인 시 자동 실행, 기록 저장 시 자동 실행 |
| 실패 처리 | 로컬 데이터 유지, 다음 동기화 시 재시도 |

---

## 인증 플로우

### 매직 링크 (Passwordless) 인증

이 프로젝트는 비밀번호 없는 인증 방식을 채택했습니다.

**선택 근거:**
- 교사 사용자의 비밀번호 관리 부담 제거
- 이메일만 기억하면 어디서든 로그인 가능
- Supabase Auth의 기본 기능으로 구현 간단

**인증 플로우 상세:**

```
1. 사용자: 이메일 주소 입력
       |
       v
2. 클라이언트: supabaseClient.auth.signInWithOtp({ email })
       |
       v
3. Supabase Auth: 매직 링크 이메일 발송
       |
       v
4. 사용자: 이메일의 매직 링크 클릭
       |
       v
5. 브라우저: 앱으로 리다이렉트 (토큰 포함)
       |
       v
6. Supabase Auth: onAuthStateChange('SIGNED_IN') 이벤트 발생
       |
       v
7. 클라이언트: 세션 설정 + 자동 동기화 실행
       |
       v
8. UI: 로그인 상태로 전환, 동기화 상태 표시
```

**세션 관리:**
- 세션 유지: Supabase Auth가 자동으로 세션 토큰 갱신
- 세션 확인: 앱 로드 시 `getSession()`으로 기존 세션 확인
- 로그아웃: `signOut()` 호출 후 UI 상태 초기화

---

## CSS 아키텍처

### CSS 변수 (Custom Properties) 기반 디자인 시스템

전역 CSS 변수를 `:root`에 정의하여 일관된 디자인을 유지합니다.

| 변수 카테고리 | 주요 변수 | 용도 |
|--------------|-----------|------|
| 색상 (Primary) | `--primary`, `--primary-light`, `--primary-dark` | 주요 브랜드 색상 (#4a90a4 계열) |
| 색상 (Accent) | `--accent` | 보조 강조 색상 |
| 색상 (Semantic) | `--success`, `--warning`, `--danger` | 상태별 의미 색상 |
| 배경/표면 | `--background`, `--surface` | 배경 및 카드 색상 |
| 텍스트 | `--text-primary`, `--text-secondary`, `--text-muted` | 텍스트 계층 |
| 테두리 | `--border`, `--border-light` | 구분선 및 경계 |
| 그림자 | `--shadow-sm`, `--shadow`, `--shadow-lg` | 깊이감 표현 |
| 모서리 | `--radius`, `--radius-sm` | 둥근 모서리 반경 |
| 전환 | `--transition` | 애니메이션 전환 효과 |

### 반응형 디자인

| 브레이크포인트 | 적용 내용 |
|---------------|-----------|
| 600px 이하 | 폼 그리드를 단일 컬럼으로 변경, 탭 텍스트 크기 축소 |
| 기본 | 2컬럼 그리드 레이아웃, 최대 너비 800px 컨테이너 |

---

## 보안 고려사항

| 항목 | 현재 상태 | 설명 |
|------|-----------|------|
| Supabase 자격 증명 | 클라이언트 코드에 하드코딩 | Supabase anon key는 공개용으로 설계됨 (RLS로 보호) |
| XSS 방지 | `escapeHtml()` 함수 적용 | 사용자 입력 텍스트를 렌더링 전 이스케이프 처리 |
| 데이터 접근 제어 | Supabase RLS (Row Level Security) | 사용자별 데이터 격리 (user_id 기반) |
| 인증 보안 | Supabase Auth 매직 링크 | 비밀번호 미사용으로 크레덴셜 유출 위험 없음 |
| 로컬 데이터 | 브라우저 LocalStorage | 동일 기기의 동일 origin에서만 접근 가능 |

---

## 기술적 제약사항

| 제약 | 영향 | 완화 방법 |
|------|------|-----------|
| 단일 파일 구조 | 코드 유지보수 어려움 증가 | 논리적 섹션 구분, 주석 활용 |
| LocalStorage 용량 제한 | 약 5~10MB 이내 사용 | Supabase 동기화로 클라우드 백업 |
| CDN 의존성 | 오프라인 시 Supabase 라이브러리 로드 불가 | 브라우저 캐시 활용, 핵심 기능은 LocalStorage로 동작 |
| 빌드 도구 부재 | 코드 최적화(미니파이, 트리 셰이킹) 미적용 | 현재 파일 크기(~64KB)로 충분히 빠름 |
| 테스트 프레임워크 부재 | 자동화된 테스트 없음 | 수동 테스트, 향후 테스트 도구 도입 고려 |
