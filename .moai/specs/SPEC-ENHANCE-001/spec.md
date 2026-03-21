# SPEC-ENHANCE-001: Lesson Enhancement & Detail View

## Metadata

| Field       | Value                                          |
|-------------|------------------------------------------------|
| SPEC ID     | SPEC-ENHANCE-001                               |
| Title       | Lesson Enhancement & Detail View               |
| Created     | 2026-03-21T00:00:00+09:00                      |
| Status      | Planned                                        |
| Priority    | High                                           |
| Lifecycle   | spec-first                                     |

---

## Environment

- **Runtime**: Next.js 16 App Router, TypeScript, React 19
- **Backend**: Supabase (PostgreSQL, JSONB data column)
- **State**: ReflectionsContext (localStorage `reflections_v13` + Supabase sync)
- **Data Model**: `Reflection` interface in `src/lib/types.ts` containing `PlanBlock[]` and `ActualBlock[]`
- **UI Language**: Korean labels, English code/comments
- **Storage Key**: `reflections_v13` (localStorage), `reflections` table (Supabase)
- **Current Routes**: `/write` (create/edit), `/reflections` (list)

---

## Assumptions

| ID   | Assumption                                                                 | Confidence | Risk if Wrong                                      |
|------|---------------------------------------------------------------------------|------------|-----------------------------------------------------|
| A-01 | Supabase `reflections` table uses a single JSONB `data` column            | High       | Migration script needs different column structure    |
| A-02 | Existing localStorage data (`reflections_v13`) must remain compatible     | High       | Data loss for existing users                         |
| A-03 | New fields default to empty string for backward compatibility             | High       | Old reflections break on detail view                 |
| A-04 | No authentication/RLS is currently enforced on the reflections table      | Medium     | Migration RLS policies may conflict                  |
| A-05 | CognitiveScorePreview component can be reused in read-only context        | High       | Component refactor needed for read-only mode         |

---

## Requirements

### Feature 1: Lesson Goal & Motivating Speech Fields

#### REQ-F1-01: Data Model Extension (Ubiquitous)

The system **shall** include `lessonGoal` (string) and `motivatingSpeech` (string) fields in the `Reflection` interface.

#### REQ-F1-02: Default Values (Ubiquitous)

The system **shall** default `lessonGoal` and `motivatingSpeech` to empty string (`''`) when these fields are absent from existing reflection data.

#### REQ-F1-03: Write Page UI (Event-Driven)

**WHEN** the user opens the write page (`/write`) **THEN** the system **shall** display a visually prominent card section at the top of the form (above TensionWarmup and BasicInfo) containing:
- A short text input labeled "수업 목표" for `lessonGoal`
- A multi-line textarea labeled "Motivating Speech" for `motivatingSpeech`

#### REQ-F1-04: Data Persistence (Event-Driven)

**WHEN** the user saves a reflection **THEN** the system **shall** persist `lessonGoal` and `motivatingSpeech` as part of the `Reflection` object in both localStorage and Supabase.

#### REQ-F1-05: Draft Auto-Save (Event-Driven)

**WHEN** the user modifies `lessonGoal` or `motivatingSpeech` on the write page **THEN** the system **shall** include these fields in the auto-save draft (key: `reflection_draft_v1`).

#### REQ-F1-06: Edit Mode Restoration (Event-Driven)

**WHEN** the user opens the write page in edit mode **THEN** the system **shall** populate `lessonGoal` and `motivatingSpeech` from the existing reflection data, defaulting to empty string if absent.

#### REQ-F1-07: Optional Fields (Ubiquitous)

The system **shall** treat both `lessonGoal` and `motivatingSpeech` as optional fields; empty values are valid and do not block saving.

---

### Feature 2: Reflection Detail View Page

#### REQ-F2-01: Detail Route (Ubiquitous)

The system **shall** provide a read-only detail page at the route `/reflections/[id]`.

#### REQ-F2-02: Complete Data Display (Event-Driven)

**WHEN** the user navigates to `/reflections/[id]` **THEN** the system **shall** display the complete reflection data including:
- Lesson goal and motivating speech (if present)
- Basic info: date, course title, session number, time range
- All plan blocks with titles, subtitles, minutes, cognitive levels
- Default evaluations displayed as read-only star ratings
- Custom evaluations displayed as read-only star ratings
- Kicks and memo content for each block
- Cognitive load visualization (reuse `CognitiveScorePreview`)

#### REQ-F2-03: Edit Navigation (Event-Driven)

**WHEN** the user clicks the "편집하기" button on the detail page **THEN** the system **shall** navigate to `/write` with the reflection loaded in edit mode (via `edit_reflection_id` in localStorage).

#### REQ-F2-04: Back Navigation (Event-Driven)

**WHEN** the user clicks the back button on the detail page **THEN** the system **shall** navigate back to `/reflections`.

#### REQ-F2-05: List Page Link Update (Event-Driven)

**WHEN** the user clicks a reflection card on the `/reflections` list page **THEN** the system **shall** navigate to `/reflections/[id]` (detail view) instead of directly to edit mode.

#### REQ-F2-06: Not Found Handling (State-Driven)

**IF** the requested reflection ID does not exist in the reflections data **THEN** the system **shall** display a "회고를 찾을 수 없습니다" message with a link back to the list.

#### REQ-F2-07: Layout Design (Ubiquitous)

The system **shall** render the detail view with:
- Print-friendly layout with clean typography and adequate spacing
- All block details expanded by default (no accordion collapse)
- Sections clearly separated with visual dividers
- Mobile-responsive design

---

### Feature 3: Supabase Migration Formalization

#### REQ-F3-01: Migration File (Ubiquitous)

The system **shall** include a SQL migration file at `supabase/migrations/{timestamp}_create_reflections_table.sql`.

#### REQ-F3-02: Table Schema (Ubiquitous)

The migration **shall** create the `reflections` table with:
- `id` (BIGINT, PRIMARY KEY) - reflection timestamp ID
- `data` (JSONB, NOT NULL) - complete reflection object
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

#### REQ-F3-03: Idempotent Execution (Ubiquitous)

The migration **shall** use `CREATE TABLE IF NOT EXISTS` to ensure safe re-execution.

#### REQ-F3-04: Indexes (Ubiquitous)

The migration **shall** create indexes on:
- `id` (primary key, automatic)
- `created_at` for date-based sorting queries
- `data->>'date'` (GIN or BTREE) for filtering reflections by lesson date

#### REQ-F3-05: RLS Policies (Ubiquitous)

The migration **shall** enable Row Level Security on the `reflections` table and create a policy allowing anonymous read/write access (matching current app behavior without authentication).

#### REQ-F3-06: Updated-At Trigger (Ubiquitous)

The migration **shall** create a trigger that automatically updates the `updated_at` column on row modification.

#### REQ-F3-07: Non-Breaking (Unwanted)

The migration **shall not** alter or drop any existing data in the `reflections` table if it already exists.

---

### Feature 4: PDF Export with Clean Page Breaks

#### REQ-F4-01: Export Button (Event-Driven)

**WHEN** the user views a reflection on the detail page (`/reflections/[id]`) **THEN** the system **shall** display a "PDF 내보내기" button alongside the "편집하기" button.

#### REQ-F4-02: PDF Generation (Event-Driven)

**WHEN** the user clicks the "PDF 내보내기" button **THEN** the system **shall** generate a PDF document containing the complete reflection data with professional formatting.

#### REQ-F4-03: Page Break Control (Ubiquitous)

The system **shall** ensure that no plan block is split across PDF pages. Each block **shall** start on a new page if it would otherwise be cut at a page boundary (using CSS `break-inside: avoid` and equivalent print-safe rules).

#### REQ-F4-04: PDF Content (Ubiquitous)

The generated PDF **shall** include:
- Lesson goal and motivating speech (if present)
- Basic info header: course title, session number, date, time range
- Cognitive load visualization bar
- All plan blocks with evaluations, kicks, and memos
- Clean typography with adequate margins for readability

#### REQ-F4-05: PDF Styling (Ubiquitous)

The PDF **shall** be styled with:
- A4 page size orientation
- Consistent fonts and spacing
- Section headers clearly distinguished
- Star ratings rendered as visual indicators (not interactive)
- No UI chrome (sidebar, navigation buttons excluded)

#### REQ-F4-06: File Naming (Event-Driven)

**WHEN** the PDF is generated **THEN** the file name **shall** follow the pattern `{date}_{courseTitle}_{sessionNumber}.pdf` (e.g., `2026-03-21_수학심화_3회차.pdf`).

#### REQ-F4-07: Client-Side Generation (Ubiquitous)

The system **shall** generate PDFs entirely on the client side without requiring server-side rendering or external API calls.

---

## Specifications

### Data Model Changes

```typescript
// src/lib/types.ts - Reflection interface additions
export interface Reflection {
  // ... existing fields ...
  lessonGoal: string;        // NEW: overall lesson objective
  motivatingSpeech: string;  // NEW: key message/speech for students
}
```

### File Impact Analysis

| File                                        | Change Type | Description                                         |
|---------------------------------------------|-------------|-----------------------------------------------------|
| `src/lib/types.ts`                          | Modify      | Add `lessonGoal`, `motivatingSpeech` to Reflection   |
| `src/app/write/page.tsx`                    | Modify      | Add goal/speech fields UI, include in save/draft     |
| `src/app/reflections/page.tsx`              | Modify      | Change card click to navigate to detail view         |
| `src/app/reflections/[id]/page.tsx`         | Create      | New detail view page                                 |
| `src/components/LessonGoalSection.tsx`      | Create      | New component for goal/speech input card             |
| `supabase/migrations/{ts}_create_reflections_table.sql` | Create | Formalized migration file               |
| `src/components/PdfExportButton.tsx`    | Create      | PDF generation button with html2pdf.js             |

### Backward Compatibility Strategy

- New fields use `reflection.lessonGoal || ''` pattern for safe access
- No changes to localStorage key (`reflections_v13`)
- No changes to Supabase sync logic structure
- Existing reflections without new fields render with empty values

---

## Traceability

| Requirement  | Plan Reference          | Acceptance Reference     |
|-------------|-------------------------|--------------------------|
| REQ-F1-01   | plan.md - Milestone 1   | acceptance.md - SC-F1-01 |
| REQ-F1-03   | plan.md - Milestone 1   | acceptance.md - SC-F1-02 |
| REQ-F2-01   | plan.md - Milestone 2   | acceptance.md - SC-F2-01 |
| REQ-F2-05   | plan.md - Milestone 2   | acceptance.md - SC-F2-03 |
| REQ-F3-01   | plan.md - Milestone 3   | acceptance.md - SC-F3-01 |
| REQ-F3-03   | plan.md - Milestone 3   | acceptance.md - SC-F3-02 |
