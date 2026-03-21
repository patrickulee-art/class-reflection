# SPEC-ENHANCE-001: Implementation Plan

## SPEC Reference

| Field   | Value            |
|---------|------------------|
| SPEC ID | SPEC-ENHANCE-001 |
| Status  | Planned          |

---

## Milestone 1: Lesson Goal & Motivating Speech Fields (Priority High)

### Goals
- Extend `Reflection` type with `lessonGoal` and `motivatingSpeech`
- Create input UI component for the write page
- Integrate with save, draft auto-save, and edit-mode restoration

### Tasks

1. **Type Extension** (`src/lib/types.ts`)
   - Add `lessonGoal: string` and `motivatingSpeech: string` to `Reflection` interface
   - Both optional at runtime (default to `''`)

2. **LessonGoalSection Component** (`src/components/LessonGoalSection.tsx`)
   - Card-style section with heading "수업 방향"
   - Text input for "수업 목표" (lessonGoal)
   - Textarea for "Motivating Speech" (motivatingSpeech)
   - Accept value + onChange props for controlled inputs
   - Mobile-responsive styling

3. **Write Page Integration** (`src/app/write/page.tsx`)
   - Add `lessonGoal` and `motivatingSpeech` state variables
   - Place `LessonGoalSection` above `TensionWarmup` in render
   - Include new fields in draft auto-save object
   - Include new fields in edit-mode restoration logic
   - Include new fields in `handleSave` Reflection construction

### Technical Approach
- Follow existing pattern: state in WritePage, props passed to child component
- Use same card styling pattern as BasicInfo component
- Default value pattern: `reflection.lessonGoal || ''`

### Risks
- Draft format change may invalidate old drafts (low risk: graceful fallback to `''`)

---

## Milestone 2: Reflection Detail View Page (Priority High)

### Goals
- Create read-only detail page at `/reflections/[id]`
- Update list page navigation to point to detail view
- Clean, print-friendly layout

### Tasks

1. **Detail Page** (`src/app/reflections/[id]/page.tsx`)
   - Client component using `useReflectionsContext` to find reflection by ID
   - Display lesson goal and motivating speech section (if non-empty)
   - Display basic info: date, course, session, time range
   - Reuse `CognitiveScorePreview` for cognitive load visualization
   - Render all plan blocks expanded with full details:
     - Title, subtitle, minutes, cognitive level badge
     - Read-only star ratings for default evals (flow, kick, humor, nonverbal, board)
     - Read-only star ratings for custom evals
     - Kicks list, memo text
   - "편집하기" button navigating to edit mode
   - Back button to `/reflections`
   - Not-found state with message and link

2. **List Page Update** (`src/app/reflections/page.tsx`)
   - Change card `onClick` from `handleEdit` to `router.push('/reflections/${id}')`
   - Keep explicit "편집" button behavior (direct to edit)
   - Keep "삭제" button behavior unchanged

3. **Styling**
   - Print-friendly layout: clean margins, good contrast
   - No accordion - all blocks expanded by default
   - Clear section dividers between blocks
   - Star ratings rendered as filled/empty stars (read-only)
   - Mobile-responsive with appropriate breakpoints

### Technical Approach
- Use Next.js App Router dynamic route: `src/app/reflections/[id]/page.tsx`
- Client component (needs context access for reflection data)
- Reuse `CognitiveScorePreview` directly (already accepts planBlocks + totalTimeLimit props)
- Star rendering: simple loop creating filled/empty star characters based on rating value

### Risks
- Reflection lookup by ID depends on reflections being loaded from context (handle loading state)

---

## Milestone 3: Supabase Migration Formalization (Priority Medium)

### Goals
- Create proper SQL migration file
- Formalize existing table schema with indexes and RLS
- Ensure idempotent execution

### Tasks

1. **Migration File** (`supabase/migrations/{timestamp}_create_reflections_table.sql`)
   - `CREATE TABLE IF NOT EXISTS reflections`
   - Columns: `id BIGINT PRIMARY KEY`, `data JSONB NOT NULL`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
   - Index on `created_at`
   - Index on `(data->>'date')` for lesson date filtering
   - Enable RLS with anonymous access policy
   - `updated_at` auto-update trigger function

2. **Migration Directory**
   - Create `supabase/migrations/` directory if not exists

### Technical Approach
- Use `IF NOT EXISTS` / `IF NOT EXISTS` patterns throughout
- RLS policy: allow all operations for `anon` role (matches current no-auth setup)
- Standard Supabase trigger pattern for `updated_at`

### Risks
- Table may already exist in production with slightly different schema (mitigated by IF NOT EXISTS)
- Future auth addition will require RLS policy update

---

## Milestone 4: PDF Export with Clean Page Breaks (Priority High)

### Goals
- Generate clean, professional PDFs from reflection detail view
- Ensure no content block is split across page boundaries
- Client-side only generation (no server dependency)

### Tasks

1. **Install html2pdf.js** (or equivalent)
   - `npm install html2pdf.js` - lightweight, client-side PDF from HTML
   - Wraps html2canvas + jsPDF internally
   - Supports CSS `break-inside: avoid` for page break control

2. **PdfExportButton Component** (`src/components/PdfExportButton.tsx`)
   - Accepts reflection data as props
   - Renders a hidden print-optimized div with reflection content
   - On click: generates PDF from the hidden div using html2pdf.js
   - Applies print-specific CSS:
     - `break-inside: avoid` on each plan block section
     - `break-before: auto` to allow natural breaks between blocks
     - A4 page margins (20mm)
     - Clean typography without interactive elements
   - File naming: `{date}_{courseTitle}_{sessionNumber}.pdf`

3. **Detail Page Integration** (`src/app/reflections/[id]/page.tsx`)
   - Add PdfExportButton next to "편집하기" button
   - Pass reflection data to the button component

### Technical Approach
- Use html2pdf.js for client-side PDF generation (most reliable for Korean text + CSS layout)
- Create a separate print-optimized rendering of the reflection (hidden from screen)
- CSS page break rules: `break-inside: avoid` on `.pdf-block` wrapper around each plan block
- Star ratings rendered as Unicode characters (★☆) for PDF compatibility
- Cognitive load bar rendered as colored divs (inline styles for PDF reliability)

### Risks
- Korean font rendering in PDF (mitigated: html2pdf.js uses browser rendering engine)
- Very long reflections may have oversized blocks that exceed one page (mitigated: blocks break internally only if absolutely necessary)

---

## Architecture Direction

### No Breaking Changes
- All new fields are additive to existing `Reflection` type
- localStorage key remains `reflections_v13`
- Supabase sync logic structure unchanged
- Existing routes continue to function

### Component Reuse
- `CognitiveScorePreview` reused directly in detail view
- `BasicInfo` display patterns inform detail view layout
- Existing card styling patterns applied to new LessonGoalSection

### Dependency Map
```
Milestone 1 (Type + UI) ──> Milestone 2 (Detail View uses new fields)
                              |               |
Milestone 3 (Migration) ─────┘               └──> Milestone 4 (PDF from Detail View)
(independent, parallel with M1)
```

---

## Expert Consultation Recommendations

- **expert-frontend**: Detail view layout, print-friendly CSS, star rating component, mobile responsiveness
- **expert-backend**: Supabase migration validation, RLS policy review, index optimization
