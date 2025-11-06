## Purpose
Short, practical guidance for AI coding agents working on this repo (React + Vite + TypeScript).

Keep edits focused and low-risk. Prefer small, isolated changes (component, hook, API call) and run typecheck/lint after edits.

## Key project facts
- Framework: React 18 + Vite + TypeScript. Entrypoint: `src/main.tsx` -> `src/App.tsx`.
- Routing: `react-router-dom` is used (see `src/App.tsx`); pages live under `src/pages/` and are wrapped with `ProtectedRoute` and `Layout` for authenticated routes.
- API layer: `src/lib/axios.ts` creates an axios instance. Base URL is taken from `import.meta.env.VITE_API_URL` (fallback `http://localhost:3000/api`).
- Auth: `src/context/AuthContext.tsx` stores the JWT in `localStorage` under the key `token`. The axios request interceptor injects `Authorization: Bearer <token>`; response interceptor clears token and redirects to `/login` on 401.

## Dev / build / checks (explicit)
- Start dev server: `npm run dev` (runs `vite`).
- Build: `npm run build` (Vite build).
- Preview build: `npm run preview`.
- Lint: `npm run lint` (eslint configured at project root).
- Typecheck: `npm run typecheck` (runs `tsc --noEmit -p tsconfig.app.json`).

Run these after making changes to ensure no regressions. There are no test scripts present in package.json.

## Patterns & conventions to follow (concrete)
- Components live in `src/components/` with small shared components under `src/components/common/` (Button, Card, Table, Modal, Input, Select). Inspect `src/pages/Certificates.tsx` for common usage examples.
- Pages are under `src/pages/`. Secure pages are wrapped in `<ProtectedRoute><Layout>...` in `src/App.tsx`.
- API responses often return payloads under `response.data.data` or `response.data`. When consuming responses, code checks `res.data.data || res.data` — follow this when adding new API handlers.
- Role-based data scoping is used in pages like `Certificates` (see `useAuth()` and `Role` usage). Check `src/types/index.ts` for role/type definitions before changing role logic.
- Error handling on API calls typically extracts message from `error.response?.data?.message` before falling back to a generic toast message. Match that pattern for UX consistency.

## Integration points / gotchas
- Environment variable: `VITE_API_URL` controls API endpoint for axios. If adding backend-related code, ensure any new services use the axios instance at `src/lib/axios.ts`.
- Auth flow: Token lifecycle is handled by `localStorage` + axios interceptors; modifying auth must respect that flow.
- QR codes / verification: `src/pages/Certificates.tsx` constructs QR links with a hard-coded dev host in some places (e.g. appended `http://localhost:5173/verify` + `qrHash`). Be careful when changing deployment URL — update QR generation to use an environment variable or window location.

## File examples to reference when coding
- API client and interceptors: `src/lib/axios.ts`
- Auth & token handling: `src/context/AuthContext.tsx`
- Route composition / page wrapping: `src/App.tsx`
- Layout and top-level UI shell: `src/components/layout/Layout.tsx`
- Example page demonstrating patterns (API calls, role checks, component usage): `src/pages/Certificates.tsx`

## What an AI agent should do before making changes
1. Read the relevant page/component and `src/lib/axios.ts` to understand API shape.
2. Search for `response.data.data` usage to match payload handling.
3. If modifying auth or API endpoints, run `npm run typecheck` and `npm run lint` locally.
4. Avoid changing global CSS or tailwind config unless requested — focus on behavior-first changes.

## Prompting tips for code edits
- When asked to update an API call: "Update axios call in `src/pages/X.tsx` — use `src/lib/axios.ts` and handle response with `res.data.data || res.data`, preserve existing toast/error patterns." 
- When asked to edit auth: "Respect token storage (`localStorage.getItem('token')`), use `useAuth()` and do not bypass axios interceptors; update `AuthContext` and `src/lib/axios.ts` together if needed."

---
If anything is unclear or you want this file to include additional examples (e.g., component prop contracts, more file references), tell me which area to expand and I will iterate.