---
description: React/TypeScript frontend coding rules for Retrocast (Phase 2)
---

# React Frontend Rules

These rules apply to all code under `frontend/`. Read `01-general.md` first.

## 1. TypeScript Strict Mode

- `tsconfig.json` must have `"strict": true`.
- **No `any` types.** If the type is truly unknown, use `unknown` with type guards.
- All function parameters and return types must be explicitly typed.

```typescript
// ✅ Correct
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// ❌ Wrong
function formatPercent(value: any) {
  return `${(value * 100).toFixed(2)}%`;
}
```

## 2. Components

- **Functional components only.** No class components.
- One component per file. Filename = component name (PascalCase): `ScenarioEditor.tsx`.
- Export the component as a **named export**, not default export.

```typescript
// ✅ Correct
export function ScenarioEditor({ scenario, onSave }: ScenarioEditorProps) { ... }

// ❌ Wrong
export default class ScenarioEditor extends React.Component { ... }
```

## 3. Props

- Define an explicit interface for props, named `{ComponentName}Props`.
- Place the interface directly above the component in the same file.

```typescript
interface ScenarioEditorProps {
  scenario: Scenario;
  onSave: (updated: Scenario) => void;
  isLoading?: boolean;
}

export function ScenarioEditor({ scenario, onSave, isLoading = false }: ScenarioEditorProps) {
  // ...
}
```

## 4. State Management

- Use React hooks: `useState`, `useEffect`, `useCallback`, `useMemo`.
- Use custom hooks for reusable logic (e.g., `useScenarios`, `useAnalysis`).
- **No Redux.** Keep state management simple and local.
- Lift state only when two sibling components need to share it.

## 5. Styling

- Use **TailwindCSS** for all styling.
- **No** CSS modules, styled-components, or inline `style={}` props.
- Exception: TradingView Lightweight Charts API requires JavaScript style objects — that's acceptable.
- Use shadcn/ui components as the base. Do NOT build custom UI primitives (buttons, inputs, dialogs, etc.) from scratch.

## 6. API Calls

- **All** API calls go through `services/api.ts`. Never call `fetch` or `axios` directly in components.
- Use the configured base URL from `api.ts`. No hardcoded API URLs in components.
- API function naming: verb prefix → `getScenarios()`, `createScenario()`, `runAnalysis()`.

```typescript
// ✅ Correct – in services/api.ts
export async function getScenarios(): Promise<Scenario[]> {
  const response = await apiClient.get("/scenarios");
  return response.data;
}

// ❌ Wrong – in a component file
const response = await fetch("http://localhost:8000/api/scenarios");
```

## 7. Loading / Error / Empty States

Every component that loads data must handle **all four states**:

1. **Loading**: Show a spinner or skeleton.
2. **Error**: Show an error message with a retry option.
3. **Empty**: Show a helpful message (e.g., "No scenarios yet. Create your first one.").
4. **Success**: Show the data.

Do NOT render a blank screen for any state.

## 8. Accessibility

- All interactive elements (buttons, links, inputs) must have `aria-label` attributes when the visible text is insufficient.
- Keyboard navigation must work for critical flows (create scenario, run analysis).
- Form inputs must have associated `<label>` elements.

## 9. Import Order

Enforce this order with blank lines between groups:

```typescript
// 1. React
import { useState, useEffect } from "react";

// 2. Third-party
import { Card, CardContent } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";

// 3. Local
import { useScenarios } from "@/hooks/useScenarios";
import { Scenario } from "@/types/scenario";
import { formatPercent } from "@/lib/utils";
```

## 10. No Hardcoded Strings

- API base URL → `api.ts` config (reads from environment variable).
- Display strings that might change → constants file or inline (no i18n needed for MVP).
- Magic numbers (pagination size, chart height) → named constants.
