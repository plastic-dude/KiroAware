# KiroAware Coding Style

## TypeScript
- Strict mode: enabled (`strict: true`)
- No `any` without explicit justification
- Readonly types for immutable data
- Explicit return types on exported functions

## React
- Functional components only
- Props interface: `readonly` fields
- `useCallback` for event handlers passed to children
- `useMemo` for expensive computations

## CSS
- Design tokens via CSS custom properties
- No inline styles
- No magic numbers
- BEM-like naming within component scope

## File Organization
- One component per file
- Types in `src/types/`
- Styles in `src/styles/`
- Components in `src/components/`

## Naming
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

## Build Checks
- `npm run typecheck` — zero errors
- `npm run lint` — zero errors, zero warnings
- `npm run build` — zero errors
- `./build-check.sh` — all gates pass
