# DiplomaVerif — Project Documentation (English)

Complete documentation for the diploma verification project (DiplomaVerif), including architecture, code organization, features, and security. This document is intended for project defense (viva), handover, and long-term maintenance.

---

## 1. Project Overview

### 1.1 Purpose and Goals

**DiplomaVerif** is a web application for **diploma (certificate) verification**. It provides:

- **Universities**: Manage students, programs, modules, grades, and **issue certificates** (diplomas). Each university account is tied to a single institution via `universityId`.
- **Students**: View their own **certificates** and academic information. Each student account is tied to a single student record via `studentId`.
- **Administrators**: Manage **universities** (CRUD) and have a global view (dashboard). No direct access to students or certificates.
- **Third parties** (employers, recruiters): **Verify the authenticity** of a diploma **without creating an account**, via a public page using either the **QR code hash** printed on the certificate or the **student identifier**.

The application is **frontend-only** in this repository: it consumes a **REST API** (backend not included). The API base URL is configurable via the `VITE_API_URL` environment variable.

### 1.2 Technology Stack

| Layer        | Technology | Notes |
|-------|------------|--------|
| **Frontend** | React 18 | Functional components, hooks |
| **Language** | TypeScript | Typed interfaces and enums in `src/types/index.ts` |
| **Build / Dev server** | Vite 5 | Fast HMR, optimized production build |
| **Routing** | React Router DOM v7 | Declarative routes in `App.tsx` |
| **HTTP client** | Axios | Single instance in `src/lib/axios.ts` with interceptors |
| **Styling** | Tailwind CSS 3 | Utility-first; config in `tailwind.config.js` |
| **Icons** | Lucide React | Used in layout and pages |
| **Notifications** | react-hot-toast | Success/error toasts; Toaster in `App.tsx` |
| **PDF / QR** | jsPDF, qrcode.react | Used for certificate generation and display (where applicable) |
| **Package manager** | npm | `package.json` scripts: `dev`, `build`, `preview`, `typecheck` |

The app expects the backend to expose a **REST API** at the base URL (e.g. `http://localhost:3000/api`). All API calls from the frontend go through the Axios instance, which adds the `Authorization: Bearer <token>` header when a token is present in `localStorage`.

---

## 2. Project Structure — Where Everything Lives

### 2.1 Directory Tree (Detailed)

```
project/
├── index.html                    # Single HTML entry; <title>DiplomaVerif</title>; root div #root
├── package.json                  # Dependencies, scripts (dev, build, preview, typecheck)
├── vite.config.ts                # Vite config: React plugin, optimizeDeps
├── tailwind.config.js            # Tailwind content paths, theme if any
├── postcss.config.js             # PostCSS for Tailwind
├── tsconfig.json / tsconfig.app.json  # TypeScript config for the app
├── DOCUMENTATION.md              # French documentation
├── DOCUMENTATION_EN.md           # This file (English, detailed)
│
├── src/
│   ├── main.tsx                  # Entry: createRoot(#root), renders <App />, imports index.css
│   ├── App.tsx                   # Router, AuthProvider, all Route definitions, ProtectedRoute, Layout
│   ├── index.css                 # @tailwind base/components/utilities; .scrollbar-hide utility
│   │
│   ├── types/
│   │   └── index.ts              # All shared types: Role, CertificateStatus, User, University,
│   │                             # Student, Program, Module, Grade, Certificate, Verification, Subject
│   │
│   ├── context/
│   │   └── AuthContext.tsx       # Global auth state: user, university, student, loading;
│   │                             # login(), logout(), refreshUser(); fetches university/student by role
│   │
│   ├── lib/
│   │   ├── axios.ts              # Axios instance: baseURL from VITE_API_URL; request interceptor
│   │                             # (Bearer token, FormData handling); response interceptor (401/403/404/500)
│   │   └── degreeClassification.ts  # UK degree classification from marks: First, 2:1, 2:2, Third, Fail
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx        # Fixed header (navbar) + fixed sidebar + scrollable <main>; no sidebar scroll
│   │   │   ├── Navbar.tsx        # Logo "DiplomaVerif"; user label (university name+address or student name+uni+program);
│   │   │   │                     # role badge; profile icon dropdown (Settings, Logout)
│   │   │   └── Sidebar.tsx       # Vertical nav: Dashboard, Universities (ADMIN), Students, Programs,
│   │   │                         # Modules, Issue Certificates, Certificates, Verifications (UNIVERSITY),
│   │   │                         # Settings (all); items filtered by user.role
│   │   │
│   │   └── common/
│   │       ├── ProtectedRoute.tsx   # Wraps protected pages; shows loader while loading; redirects to /login if !user
│   │       ├── Button.tsx            # Primary/secondary/danger/success buttons
│   │       ├── Input.tsx             # Label, optional error, controlled input
│   │       ├── Select.tsx            # Dropdown select
│   │       ├── Card.tsx               # Container with optional title
│   │       ├── Modal.tsx             # Overlay + title + close; sizes sm/md/lg/xl
│   │       ├── Table.tsx              # Generic table with columns and data
│   │       ├── FileUpload.tsx         # File upload (e.g. logo, seal, signature for universities)
│   │       ├── PhotoUpload.tsx        # Student photo upload
│   │       └── ImageCropper.tsx       # Image crop callback for photos
│   │
│   └── pages/
│       ├── Login.tsx                  # Email + password form; calls login(); redirect to /dashboard on success;
│       │                               # link to /verify for public verification
│       ├── Dashboard.tsx              # Role-based stats (universities, students, certificates, etc.);
│       │                               # welcome card with university/student info or generic message
│       ├── Settings.tsx               # Two cards (inline flex): (1) University info (UNIVERSITY only):
│       │                               # name, address, contactEmail, phone, website, ukprn, registrarName
│       │                               # via PUT /universities/:id; (2) Change password: current, new, confirm
│       │                               # via POST /auth/change-password
│       ├── Universities.tsx          # List + create/edit modal; CRUD universities (ADMIN); logo, seal, signature uploads
│       ├── Students.tsx               # List + create/edit modal; CRUD students (UNIVERSITY); photo upload
│       ├── Programs.tsx               # CRUD programs (UNIVERSITY)
│       ├── Modules.tsx                # CRUD modules (UNIVERSITY)
│       ├── Grades.tsx                 # Manage grades per student/module (UNIVERSITY)
│       ├── Certificates.tsx           # List certificates; filter by university (UNIVERSITY) or own (STUDENT);
│       │                               # view details, status ACTIVE/REVOKED
│       ├── CertificateIssuance.tsx    # Multi-step: select students, enter marks, generate certificates (UNIVERSITY)
│       ├── Verifications.tsx          # List of verification records (UNIVERSITY)
│       ├── VerifyCertificate.tsx      # PUBLIC page (no auth): verify by QR hash or student ID; optional
│       │                               # verification form (company, email, reason); QR scanner placeholder
│       ├── Subjects.tsx               # Subjects management (if used)
│       └── StudentRecords.tsx         # Student records (if used)
│
└── (backend not in repo — API expected at VITE_API_URL)
```

### 2.2 Key Files and Their Responsibilities

| File or folder                              | Responsibility |
|---------------------------------------------|----------------|
| `src/App.tsx`                               | Wraps the app in `BrowserRouter` and `AuthProvider`. Defines all routes: public (`/login`, `/verify`, `/verify/:qrHash`) and protected (wrapped in `ProtectedRoute` and `Layout`). Default and catch-all redirect to `/dashboard`. |
| `src/context/AuthContext.tsx`              | Holds `user`, `university`, `student`, `loading`. On mount, if a token exists, calls `GET /auth/me` then fetches university or student by role. `login()` stores token and fetches university/student; `logout()` clears all; `refreshUser()` re-runs fetch (e.g. after Settings update). |
| `src/lib/axios.ts`                          | Axios instance: `baseURL` from `VITE_API_URL`, 10s timeout. Request: adds `Authorization: Bearer <token>`, handles FormData. Response: 401 → clear token + redirect `/login`; 403/404/500 → toast; network error → connection toast. |
| `src/types/index.ts`                        | Enums (`Role`, `CertificateStatus`) and interfaces (`User`, `University`, `Student`, `Program`, `Module`, `Grade`, `Certificate`, `Verification`, `Subject`). Used by context, pages, components. |
| `src/components/layout/Layout.tsx`          | Fixed header (navbar), fixed left sidebar (no scroll), main content area as only scrollable region. Fixed positioning and z-index. |
| `src/components/layout/Navbar.tsx`         | App name; user label (university name+address or student name+uni+program or email); role badge; profile dropdown (Settings, Logout). |
| `src/components/layout/Sidebar.tsx`         | Nav items (path, label, icon, roles). Filters by `user?.role`. Each item is a `NavLink` with active styling. |
| `src/components/common/ProtectedRoute.tsx` | Uses `useAuth()`. If `loading`: full-screen spinner. If `!user`: `<Navigate to="/login" />`. Else renders `children`. Wraps every protected page. |
| `src/pages/VerifyCertificate.tsx`            | Public (no `ProtectedRoute`). Verify certificate by QR hash or student ID; show details (ACTIVE/REVOKED); submit verification (company, email, reason). QR scanner placeholder. |

### 2.3 Data Flow Summary

- **Login**: User submits email/password in `Login.tsx` → `AuthContext.login()` → `POST /auth/login` → backend returns `{ token, user }` → token stored in `localStorage`, `user` (and optionally `university` or `student`) stored in context → redirect to `/dashboard`.
- **Page load with token**: `AuthContext` runs `fetchUser()` (GET `/auth/me`), then loads university or student by role. Protected routes wait for `loading === false`; if `user` is null, redirect to `/login`.
- **API calls**: All requests use `src/lib/axios`. The request interceptor attaches the Bearer token. The response interceptor handles 401 (logout + redirect), 403, 404, 500 (toast). Pages use the same axios instance for GET/POST/PUT/DELETE.

---

## 3. Roles and Permissions (Frontend)

The frontend does **not** enforce authorization for API actions; it only **hides or shows** UI based on `user.role`. The backend must enforce role-based access control (RBAC) and resource-level permissions.

### 3.1 Role Definitions

| Role        | Constant         | Description                                      | Typical use |
|-------------|------------------|--------------------------------------------------|-------------|
| ADMIN       | `Role.ADMIN`     | Global administrator.                            | Manage universities (CRUD). Dashboard: counts for universities, students, certificates, verifications, programs, modules. No student/certificate management. |
| UNIVERSITY  | `Role.UNIVERSITY`| Account linked to one university (`universityId`).| Manage students, programs, modules, grades; issue certificates; view certificates and verifications. Navbar/Dashboard: university name and address. Settings: "University information" form. |
| STUDENT     | `Role.STUDENT`   | Account linked to one student (`studentId`).     | View own certificates and dashboard. Navbar/Dashboard: student name, university, program. No access to other students or university admin. |

### 3.2 Where Roles Are Used

- **AuthContext**: After `/auth/me`, if `user.role === Role.UNIVERSITY` and `user.universityId` is set, the context fetches the university and sets `university`. If `user.role === Role.STUDENT` and `user.studentId` is set, it fetches the student (and optionally enriches with `university` and `program`) and sets `student`.
- **Sidebar**: Each nav item has a `roles` array (e.g. `[Role.ADMIN]`, `[Role.UNIVERSITY]`, `[Role.ADMIN, Role.UNIVERSITY, Role.STUDENT]`). Only items whose `roles` include `user.role` are rendered.
- **Dashboard**: Stats cards are shown or hidden based on role (e.g. "Universities" only for ADMIN; "Students", "Certificates", "Verifications", "Programs", "Modules" for UNIVERSITY; "Certificates" for STUDENT). Welcome text and displayed identity (university vs student) also depend on role.
- **Settings**: The "University information" card is rendered only when `user?.role === Role.UNIVERSITY && university` is truthy.

---

## 4. Routes and Navigation

### 4.1 Public Routes (No Authentication)

| Path            | Component         | Description |
|-----------------|-------------------|-------------|
| `/login`       | `Login`           | Email and password form. On success: store token and user, navigate to `/dashboard`. Link to "Verify a certificate" (`/verify`). |
| `/verify`      | `VerifyCertificate` | Public verification by certificate hash (from QR) or student ID. No token required. |
| `/verify/:qrHash` | `VerifyCertificate` | Same as `/verify` with hash pre-filled from URL (e.g. links from QR on printed diplomas). |

### 4.2 Protected Routes (Authentication Required)

All protected routes are wrapped in `ProtectedRoute` and `Layout`. If the user is not logged in after the auth check, they are redirected to `/login`.

| Path                    | Component            | Intended roles    |
|-------------------------|----------------------|-------------------|
| `/`                     | (Redirect)           | → `/dashboard`    |
| `/dashboard`            | `Dashboard`          | All roles         |
| `/universities`        | `Universities`       | ADMIN only        |
| `/students`            | `Students`           | UNIVERSITY        |
| `/programs`             | `Programs`           | UNIVERSITY        |
| `/modules`              | `Modules`            | UNIVERSITY        |
| `/certificate-issuance`| `CertificateIssuance`| UNIVERSITY        |
| `/certificates`         | `Certificates`       | UNIVERSITY, STUDENT |
| `/verifications`        | `Verifications`     | UNIVERSITY        |
| `/subjects`             | `Subjects`           | (As configured)   |
| `/grades`               | `Grades`             | UNIVERSITY        |
| `/settings`             | `Settings`           | All roles         |

The catch-all route `path="*"` redirects to `/dashboard`.

### 4.3 Layout Behavior

- **Layout** (`Layout.tsx`): The viewport is split into:
  - **Header**: Fixed at the top (`fixed top-0 left-0 right-0 z-50 h-16`), contains the Navbar.
  - **Sidebar**: Fixed on the left below the header (`fixed top-16 left-0 bottom-0 z-40 w-64 overflow-hidden`). Content does not scroll.
  - **Main**: Fills the rest of the screen (`fixed top-16 left-64 right-0 bottom-0 overflow-y-auto p-8`). This is the only scrollable area; all page content (Dashboard, Settings, etc.) is rendered here and scrolls inside this region.

---

## 5. Features by Area (Detailed)

### 5.1 Authentication and Session

- **Login flow**: `Login.tsx` calls `login(email, password)` from `useAuth()`. The API is expected to return something like `{ data: { token, user } }`. The context stores the token in `localStorage` and the user in state. For UNIVERSITY role it then fetches the university; for STUDENT it fetches the student (with optional university and program). On success, the app navigates to `/dashboard`.
- **Session persistence**: On initial load, `AuthContext` checks for a token. If present, it calls `GET /auth/me` to get the current user, then again loads university or student by role. If `/auth/me` fails (e.g. 401), the axios interceptor clears the token and redirects to `/login`.
- **Logout**: The profile menu in the Navbar has a "Logout" button. It calls `logout()` (clears token and sets `user`, `university`, `student` to `null`) and navigates to `/login`.

### 5.2 Settings Page

- **Change password**: Form with "Current password", "New password", "Confirm new password". Client-side validation (required, min length, match). On submit: `POST /auth/change-password` with body `{ currentPassword, newPassword }`. The request is sent with the Bearer token. On success, fields are cleared and a success toast is shown.
- **University information** (UNIVERSITY role only): Form with name, address, contact email, phone, website, UKPRN, registrar name. Pre-filled from `university` in context. On submit: `PUT /universities/:id` with the form data. On success, `refreshUser()` is called so the navbar and dashboard show the updated university name and address.

The two cards (University information and Change password) are laid out with **inline flex** (`flex flex-wrap gap-6`) so they appear side by side on larger screens.

### 5.3 Public Certificate Verification

- **File**: `src/pages/VerifyCertificate.tsx`.
- **Behavior**: User can search by **QR hash** (from the diploma’s QR code) or by **student ID**. The app calls the API to fetch the certificate. If found, it displays certificate details and status (ACTIVE or REVOKED). The user can optionally submit a **verification record** (company name, email, reason); this typically corresponds to a dedicated API endpoint (e.g. POST verification). The page may include a QR scanner (camera) placeholder; actual QR decoding may require a library such as jsQR.

### 5.4 Certificate Issuance and List

- **CertificateIssuance** (`CertificateIssuance.tsx`): University selects one or more students, enters or confirms marks per module, and triggers certificate generation. The app may use `degreeClassification.ts` to compute the UK classification (First, 2:1, etc.) from marks and credits. The actual PDF and QR generation may be done by the backend; the frontend sends the necessary data and displays results or download links.
- **Certificates** (`Certificates.tsx`): Lists certificates. For UNIVERSITY, the list is filtered by the current university (e.g. `params.universityId = user.universityId`). For STUDENT, only that student’s certificates are shown. User can open a detail view and see status (ACTIVE/REVOKED).

### 5.5 UK Degree Classification

- **File**: `src/lib/degreeClassification.ts`.
- **Function**: `calculateDegreeClassification(marks: Array<{ mark, credits }>)` returns `{ averageMark, classification, classificationFull }`.
- **Rules** (UK standards): First Class Honours ≥70%; Upper Second (2:1) 60–69%; Lower Second (2:2) 50–59%; Third 40–49%; Fail &lt;40%. The average is a **weighted average** by credits. Used where the frontend needs to display or prepare classification data (e.g. certificate issuance flow).

---

## 6. Security

### 6.1 Authentication and Token Handling

- **Token storage**: The JWT (or session token) returned by `POST /auth/login` is stored in **localStorage** under the key `"token"`. No password or other sensitive data is stored in localStorage.
- **Sending the token**: The Axios request interceptor in `src/lib/axios.ts` runs on every outgoing request. It reads `localStorage.getItem('token')` and, if present, sets `config.headers.Authorization = 'Bearer ' + token`. So all authenticated API calls automatically include the token.
- **Session validation**: On app load, the presence of a token triggers `GET /auth/me`. If the backend returns 401 (e.g. token expired or invalid), the **response interceptor** removes the token from localStorage and redirects the browser to `/login`. The user must log in again.
- **Change password**: Implemented via `POST /auth/change-password` with body `{ currentPassword, newPassword }`. The request is authenticated with the Bearer token. The frontend never stores the current or new password beyond the form state during the request.

### 6.2 Route Protection (Frontend)

- **ProtectedRoute**: Every protected page is wrapped in `<ProtectedRoute><Layout><PageComponent /></Layout></ProtectedRoute>`. `ProtectedRoute` uses `useAuth()` and checks `user` and `loading`. While `loading` is true, it shows a full-page loading spinner. When loading is false and `user` is null, it renders `<Navigate to="/login" replace />`, so unauthenticated users cannot access those URLs directly.
- **Role-based UI**: The Sidebar only renders links for which the current `user.role` is in the item’s `roles` array. This is a **UI convenience** only; it does not prevent a user from manually navigating to a URL (e.g. `/students` as a STUDENT). The **backend must enforce** that only UNIVERSITY (or ADMIN) can access student data. The frontend does not perform per-route role checks; it only hides menu items.

### 6.3 API Communication and Error Handling

- **HTTPS**: In production, `VITE_API_URL` should point to an API served over **HTTPS** to protect credentials and data in transit.
- **Axios response interceptor**:
  - **401 Unauthorized**: Token missing, invalid, or expired. Frontend clears the token and redirects to `/login`.
  - **403 Forbidden**: User is authenticated but not allowed to perform the action. A toast displays "You do not have the necessary permissions."
  - **404 Not Found**: Toast "Resource not found."
  - **500 Server Error**: Toast "Server error. Please try again later."
  - **Other errors**: Toast shows `response.data.message` or `response.data.error` or a generic message.
  - **Network error** (no response): Toast "Server connection error. Please check your connection."
- **Public endpoints**: The verification page (`/verify`) may call the API **without** a token (e.g. to fetch certificate by hash or student ID). The backend should allow these calls and return only the data needed for verification (e.g. certificate status and public details), not sensitive personal data.

### 6.4 Sensitive Data and Best Practices

- **LocalStorage**: Only the **token** is stored. No passwords, no full user object with sensitive fields. If the backend returns sensitive data in the user object, the frontend does not persist it beyond React state (lost on refresh; only token persists).
- **Client-side validation**: Forms (login, change password, university info) perform basic validation (required fields, password length, confirmation match) to improve UX. **All critical validation and business rules must be enforced by the backend** (e.g. password strength, uniqueness, authorization).
- **XSS**: React escapes text content by default. Avoid `dangerouslySetInnerHTML` with user-controlled or API data unless properly sanitized.
- **Dependencies**: Keep dependencies up to date and run `npm audit` to address known vulnerabilities.

### 6.5 Security Summary for Defense / Documentation

1. **Token-based authentication**: Bearer token in `Authorization` header; token stored in localStorage; session revalidated via `/auth/me` on load; 401 triggers logout and redirect to login.
2. **Protected routes**: Frontend ensures only authenticated users can access protected pages; backend must enforce role and resource-level authorization on every API call.
3. **Centralized error handling**: One Axios instance with interceptors for 401 (logout), 403 (permission message), 404/500 (user-friendly messages).
4. **Password change**: Requires current password and new password; sent over HTTPS with Bearer token; no client-side storage of passwords.
5. **Public verification**: Designed so third parties can verify a certificate without an account; API should expose only verification-needed data and record verification events (e.g. company, email, reason, IP).
6. **Role separation**: Clear separation of ADMIN, UNIVERSITY, and STUDENT in the UI and in expected API behavior; backend must implement corresponding access control.

---

## 7. Configuration and Deployment

### 7.1 Environment Variables

- **`VITE_API_URL`**: Base URL of the REST API. Example: `https://api.yourdomain.com/api`. Default in code: `http://localhost:3000/api`. Must be set at **build time** (Vite embeds it in the bundle). Example `.env`:
  ```
  VITE_API_URL=https://api.example.com/api
  ```

### 7.2 NPM Scripts

| Command           | Description |
|-------------------|-------------|
| `npm run dev`     | Start Vite dev server (e.g. http://localhost:5173). HMR for development. |
| `npm run build`   | Production build. Output in `dist/`. |
| `npm run preview` | Serve the production build locally (test before deploying). |
| `npm run typecheck` | Run TypeScript in noEmit mode to check types. |
| `npm run lint`    | Run ESLint. |

### 7.3 Build and Deploy

- Build: `npm run build`. Static assets and HTML/JS/CSS are generated in `dist/`.
- The app is a **single-page application (SPA)**. The server must be configured to serve `index.html` for all routes (or at least for `/`, `/login`, `/dashboard`, `/verify`, etc.) so that React Router can handle client-side routing.
- Ensure the production API is served over HTTPS and that `VITE_API_URL` points to that URL when building.

---

## 8. Data Types (Reference)

Defined in `src/types/index.ts`:

- **Role**: `ADMIN` | `UNIVERSITY` | `STUDENT`
- **CertificateStatus**: `ACTIVE` | `REVOKED`
- **User**: `id`, `email`, `role`, `universityId?`, `studentId?`, `createdAt`, `updatedAt`
- **University**: `id`, `name`, `address`, `contactEmail`, `phone`, `website?`, `logoUrl?`, `ukprn?`, `officialSealUrl?`, `registrarName?`, `signatureUrl?`, `createdAt`
- **Student**: `id`, `studentId`, `universityId`, `programId?`, `firstName`, `lastName`, `email`, `photoUrl?`, `enrollmentDate?`, `dateOfBirth?`, `createdAt`, `university?`, `program?`, `grades?`
- **Program**: `id`, `universityId`, `title`, `level`, `totalCreditsRequired`, `createdAt`, `updatedAt`
- **Module**: `id`, `universityId?`, `programId?`, `code`, `name`, `credits`, `createdAt`, `updatedAt`
- **Grade**: `id`, `studentId`, `moduleId`, `mark`, `date`, `createdAt`, `updatedAt`, `module?`
- **Certificate**: `id`, `studentId`, `universityId`, `degreeTitle`, `specialization`, `graduationDate`, `finalMark?`, `degreeClassification?`, `pdfUrl`, `qrCodeUrl`, `qrHash`, `status`, `createdAt`, `student?`, `university?`, `grades?`, `averageGrade?`
- **Verification**: `id`, `certificateId`, `companyName`, `email`, `reason`, `verificationDate`, `ipAddress`, `certificate?`

---

## 9. Glossary and Quick Reference

- **QR hash**: Unique identifier tied to a certificate, encoded in the diploma’s QR code. Used on the public verification page to fetch and display certificate status (ACTIVE/REVOKED).
- **UK degree classification**: First (70%+), Upper Second / 2:1 (60–69%), Lower Second / 2:2 (50–59%), Third (40–49%), Fail (&lt;40%). Implemented in `src/lib/degreeClassification.ts` using a weighted average by credits.
- **CertificateStatus**: `ACTIVE` — certificate is valid; `REVOKED` — certificate has been revoked (e.g. after fraud or correction).
- **UKPRN**: UK Provider Reference Number; optional identifier for universities, stored in the University type and editable in Settings (UNIVERSITY role).

---

*This documentation reflects the DiplomaVerif frontend project structure and behavior at the time of writing. For API contracts and backend behavior, refer to the backend documentation or OpenAPI spec.*
