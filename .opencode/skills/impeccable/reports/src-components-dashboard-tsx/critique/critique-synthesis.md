# Critique Synthesis — `src/components/Dashboard.tsx`

> Generated: 2026-07-23 | Slug: src-components-dashboard-tsx

---

## Summary

| Dimension | Score | Key Issue |
|---|---|---|
| Layout / Visual Hierarchy | 7/10 | KPI wrapping on mobile, IIFE in JSX |
| Typography | 7/10 | Sub-10px sizes overused, Space Grotesk only face |
| Color | 7/10 | Hardcoded values bypass theme tokens (28+ instances) |
| Spacing / Rhythm | 7/10 | Inconsistent gaps/padding across sections |
| Component Architecture | 5/10 | 584-line Dashboard, dead KPICard, duplicated helpers |
| UX Patterns | 5/10 | prompt()/alert()/confirm() abuse, no toast system |
| Responsiveness | 6/10 | Nav overflow, hover on touch, cramped mobile |
| **Overall** | **6.1/10** | Strong visual base held back by component disorganization and native dialogs |

---

## Critical Issues (Fix First)

These are bugs or practices that can cause incorrect behavior or maintenance failures.

| # | Issue | File:Line | Severity | Action |
|---|---|---|---|---|
| C1 | **Index as React key in transaction table** | Dashboard.tsx:531 | High | Replace with stable ID (`transaction.id`) |
| C2 | **Unused KPICard component duplicates Dashboard's inline KPI** | KPICard.tsx (dead), Dashboard.tsx:73 | High | Delete KPICard.tsx or refactor Dashboard to use it |
| C3 | **`any` types on Recharts tooltips** | Dashboard.tsx:46,62 | Medium | Import proper `TooltipProps` from recharts |
| C4 | **Fragile ambiguous date parsing** | Dashboard.tsx:168-179 | Medium | Use `date-fns` `parse` with explicit format |
| C5 | **Color map objects recreated on every render** | Dashboard.tsx:79-84,404-408 | Low-Medium | Hoist to module scope |
| C6 | **PieTooltip duplicated in Dashboard and InvestmentsSection** | Dashboard.tsx:62, InvestmentsSection.tsx:65 | Low | Extract to shared component |

---

## Design System Issues (Fix Next)

These undermine consistency and maintainability.

| # | Issue | File:Line | Action |
|---|---|---|---|
| D1 | **28+ arbitrary Tailwind values instead of theme tokens** | Dashboard.tsx (throughout) | Replace `text-[#00d4aa]` → `text-accent`, `bg-[#151e2d]` → `bg-card`, etc. |
| D2 | **Chart COLORS array not derived from theme** | Dashboard.tsx:33 | Import theme tokens instead of hardcoded hex |
| D3 | **Inconsistent card padding (p-4 vs p-5)** | GoalsSection, CreditCardsSection, others | Unify to `p-5` across all section components |
| D4 | **Inconsistent gap values between grids** | Dashboard.tsx:344,353,393 | Use `gap-4` for all major grids |
| D5 | **Duplicate `validDateStr` in Dashboard and BulkImportModal** | Dashboard.tsx:168, BulkImportModal.tsx:23 | Extract to `src/lib/dateUtils.ts` |
| D6 | **Duplicate `parseRowDate`/`parseDate` with slightly diff logic** | Dashboard.tsx:118, sheetsParser.ts:76 | Merge into single utility |

---

## UX / Polish

| # | Issue | File:Line | Action |
|---|---|---|---|
| U1 | **`prompt("Cole a URL...")` instead of a proper input** | Dashboard.tsx:182 | Replace with inline text input or modal |
| U2 | **`alert()` for success/error notifications** | Dashboard.tsx:220,224 | Implement toast system |
| U3 | **`confirm('Excluir...')` for all deletes** | Multiple files | Replace with confirmation modal |
| U4 | **Full-page spinner blocks entire UI on load/refresh** | Dashboard.tsx:237-246 | Replace with per-section skeletons |
| U5 | **No toast/snackbar system** | Project-wide | Create a ToastContext + ToastContainer |
| U6 | **No keyboard navigation on modals/dropdowns** | PeriodFilter, all modals | Add Escape key, aria-*, focus trapping |
| U7 | **Auto-refresh (60s) does not pause when modals open** | Dashboard.tsx:232 | Clear interval when any modal is open |
| U8 | **KPI labels at text-[10px] — illegible on standard-DPI** | Dashboard.tsx:91 | Increase to text-xs/11px minimum |
| U9 | **Badges at text-[9px]** | Dashboard.tsx:449,538 | Increase to text-[10px] |

---

## Architecture / Maintainability

| # | Issue | Action |
|---|---|---|
| A1 | **Dashboard.tsx is 584 lines handling data, rendering, orchestration** | Split into: DashboardHeader, KPIGrid, ChartsSection, InsightsPanel, RecentTransactionsTable |
| A2 | **Each section duplicates `useEffect(() => { load() }, [])` pattern** | Create `useFetch<T>` custom hook |
| A3 | **GoalModal, InvestmentModal, CreditCardModal, BudgetModal are 90% identical** | Create generic `CrudModal` with form config |
| A4 | **Unused CSS utility classes (`.glow-accent`, `.glow-danger`)** | index.css:37-43 | Remove or implement |
| A5 | **`timeAgo` handles only seconds/minutes/hours — no days/years** | Dashboard.tsx:39-44 | Add full relative time formatting |

---

## Detector Findings (Impeccable)

| Finding | Detail |
|---|---|
| **Space Grotesk overused** — only UI font, single voice, no contrast | index.html:11, index.css:13, tailwind.config.js:7 |
| Arbitrary values instead of theme tokens | 28+ instances across Dashboard.tsx |
| `any` types on tooltip callbacks | Dashboard.tsx:46,62 |
| `timeAgo` incomplete | Dashboard.tsx:39-44 |
| Color maps recreated per render | Dashboard.tsx:79-84,404-408 |
| Index as React key | Dashboard.tsx:531 |
| Fragile date parsing | Dashboard.tsx:168-179 |
| No loading skeleton | Dashboard.tsx:237-246 |

---

## Recommended Next Steps (Priority Order)

1. **Fix bugs**: index-as-key (C1), any types (C3), fragile date parsing (C4)
2. **Clean dead code**: delete unused KPICard (C2), extract PieTooltip (C6), remove unused CSS (A4)
3. **Unify design tokens**: replace arbitrary Tailwind values (D1), derive chart COLORS from theme (D2)
4. **Replace native dialogs**: implement toast system (U2) + confirmation modal (U3) + inline input (U1)
5. **Refactor Dashboard**: split into sub-components (A1), create useFetch hook (A2), extract helpers (D5,D6)
6. **Polish UX**: skeletons (U4), keyboard nav (U6), responsive fixes, font size increases (U8,U9)
