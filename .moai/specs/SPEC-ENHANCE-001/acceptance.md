# SPEC-ENHANCE-001: Acceptance Criteria

## SPEC Reference

| Field   | Value            |
|---------|------------------|
| SPEC ID | SPEC-ENHANCE-001 |
| Status  | Planned          |

---

## Feature 1: Lesson Goal & Motivating Speech Fields

### SC-F1-01: Data Model Extension

```gherkin
Given the Reflection interface in src/lib/types.ts
When a developer inspects the type definition
Then it shall contain lessonGoal as string
And it shall contain motivatingSpeech as string
```

### SC-F1-02: Write Page UI Rendering

```gherkin
Given the user navigates to /write
When the page renders
Then a card section labeled "수업 방향" shall appear above TensionWarmup
And it shall contain a text input labeled "수업 목표"
And it shall contain a textarea labeled "Motivating Speech"
And both fields shall be initially empty for new reflections
```

### SC-F1-03: Save Includes New Fields

```gherkin
Given the user fills in lessonGoal as "실전력 향상"
And fills in motivatingSpeech as "너희는 충분히 할 수 있다"
When the user clicks the save button
Then the saved Reflection object shall contain lessonGoal "실전력 향상"
And shall contain motivatingSpeech "너희는 충분히 할 수 있다"
```

### SC-F1-04: Draft Auto-Save

```gherkin
Given the user types "테스트 목표" in the lessonGoal field
When 500ms passes without further input
Then localStorage key reflection_draft_v1 shall contain lessonGoal "테스트 목표"
```

### SC-F1-05: Edit Mode Restoration

```gherkin
Given a saved reflection with lessonGoal "실전력 향상"
When the user opens it in edit mode
Then the lessonGoal field shall display "실전력 향상"
```

### SC-F1-06: Backward Compatibility

```gherkin
Given an existing reflection saved without lessonGoal field
When the reflection is loaded in edit mode
Then lessonGoal shall default to empty string
And motivatingSpeech shall default to empty string
And no errors shall occur
```

---

## Feature 2: Reflection Detail View Page

### SC-F2-01: Detail Page Route

```gherkin
Given a saved reflection with id 1234567890
When the user navigates to /reflections/1234567890
Then a read-only detail page shall render
And it shall display the complete reflection data
```

### SC-F2-02: Detail Page Content

```gherkin
Given a reflection with:
  | field            | value              |
  | courseTitle       | 수학 심화          |
  | sessionNumber    | 3회차              |
  | date             | 2026-03-21         |
  | lessonGoal       | 실전력 향상        |
  | motivatingSpeech | 오늘은 집중하자    |
  | planBlocks       | 3 blocks           |
When the detail page renders
Then it shall display "수학 심화 - 3회차" as the title
And display "2026-03-21" as the date
And display "실전력 향상" in the lesson goal section
And display "오늘은 집중하자" in the motivating speech section
And display 3 plan blocks with all details expanded
And display cognitive load visualization
And display star ratings as read-only for all evaluations
```

### SC-F2-03: List Page Navigation Update

```gherkin
Given the reflections list page with saved reflections
When the user clicks on a reflection card
Then the browser shall navigate to /reflections/{id}
And shall NOT navigate directly to /write in edit mode
```

### SC-F2-04: Edit Button Navigation

```gherkin
Given the detail page for reflection id 1234567890
When the user clicks the "편집하기" button
Then the browser shall navigate to /write
And the reflection shall load in edit mode
```

### SC-F2-05: Back Navigation

```gherkin
Given the detail page is open
When the user clicks the back button
Then the browser shall navigate to /reflections
```

### SC-F2-06: Not Found State

```gherkin
Given no reflection exists with id 9999999999
When the user navigates to /reflections/9999999999
Then the page shall display "회고를 찾을 수 없습니다"
And shall provide a link to /reflections
```

### SC-F2-07: Mobile Responsiveness

```gherkin
Given the detail page is open on a mobile device (width < 768px)
When the user views the page
Then all content shall be readable without horizontal scrolling
And sections shall stack vertically with appropriate spacing
```

---

## Feature 3: Supabase Migration Formalization

### SC-F3-01: Migration File Exists

```gherkin
Given the project repository
When a developer inspects supabase/migrations/
Then a SQL file shall exist with name pattern {timestamp}_create_reflections_table.sql
```

### SC-F3-02: Idempotent Execution

```gherkin
Given the reflections table already exists in the database
When the migration is run again
Then no errors shall occur
And existing data shall remain intact
```

### SC-F3-03: Table Schema

```gherkin
Given the migration has been applied
When inspecting the reflections table
Then it shall have column id of type BIGINT as primary key
And column data of type JSONB with NOT NULL constraint
And column created_at of type TIMESTAMPTZ with default now()
And column updated_at of type TIMESTAMPTZ with default now()
```

### SC-F3-04: Indexes

```gherkin
Given the migration has been applied
When inspecting the table indexes
Then an index on created_at shall exist
And an index on (data->>'date') shall exist
```

### SC-F3-05: RLS Enabled

```gherkin
Given the migration has been applied
When inspecting row level security
Then RLS shall be enabled on the reflections table
And an anonymous access policy shall allow SELECT, INSERT, UPDATE, DELETE
```

### SC-F3-06: Updated-At Trigger

```gherkin
Given a row exists in the reflections table
When the row is updated
Then the updated_at column shall automatically reflect the current timestamp
```

---

## Feature 4: PDF Export with Clean Page Breaks

### SC-F4-01: Export Button Visible

```gherkin
Given the user is on the detail page /reflections/{id}
When the page renders
Then a "PDF 내보내기" button shall be visible alongside "편집하기"
```

### SC-F4-02: PDF Generation

```gherkin
Given the detail page for a reflection with 5 plan blocks
When the user clicks "PDF 내보내기"
Then a PDF file shall download automatically
And the file name shall follow pattern {date}_{courseTitle}_{sessionNumber}.pdf
```

### SC-F4-03: No Block Splitting Across Pages

```gherkin
Given a reflection with many plan blocks that span multiple PDF pages
When the PDF is generated
Then no individual plan block shall be split across a page boundary
And each block shall appear completely on one page
```

### SC-F4-04: PDF Content Completeness

```gherkin
Given a reflection with lessonGoal, motivatingSpeech, 3 plan blocks with evaluations
When the PDF is generated
Then it shall contain the lesson goal section
And the motivating speech section
And basic info (date, course, session, time)
And cognitive load visualization
And all 3 plan blocks with their evaluations rendered as star indicators
```

### SC-F4-05: Korean Text Rendering

```gherkin
Given a reflection with Korean text content
When the PDF is generated
Then all Korean characters shall render correctly without missing glyphs
```

---

## Quality Gates

### Definition of Done

- [ ] All SC-F1 scenarios pass (Feature 1)
- [ ] All SC-F2 scenarios pass (Feature 2)
- [ ] All SC-F3 scenarios pass (Feature 3)
- [ ] All SC-F4 scenarios pass (Feature 4)
- [ ] No TypeScript compilation errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Existing reflections load without errors (backward compatibility)
- [ ] Mobile-responsive layout verified at 375px and 768px widths
- [ ] Detail page renders correctly with reflections that lack new fields
- [ ] Migration SQL runs without errors on fresh database
- [ ] Migration SQL runs without errors on database with existing table

### Verification Methods

| Method              | Scope                              |
|---------------------|------------------------------------|
| Manual testing      | UI rendering, navigation, forms    |
| TypeScript compiler | Type safety, interface compliance  |
| ESLint              | Code quality, React patterns       |
| Supabase CLI        | Migration execution validation     |
| Browser DevTools    | Mobile responsive, localStorage    |
