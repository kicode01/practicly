<div align="center">
  <img src="public/system-logo.svg" alt="Practicly logo" width="56" height="56" />
  <h1>Practicly</h1>
  <p><strong>Manage student practicums in one shared workspace.</strong></p>
  <p>Built for colleges and universities across any degree program. Coordinate daily DTR logs, supervisor sign-offs, and faculty clearances from day one.</p>

  <p>
    <a href="https://practicly-portal.vercel.app">Live Workspace</a>
    &nbsp;&middot;&nbsp;
    <a href="#workspaces">Workspaces</a>
    &nbsp;&middot;&nbsp;
    <a href="#architecture">Architecture</a>
    &nbsp;&middot;&nbsp;
    <a href="#database-schema">Database Schema</a>
    &nbsp;&middot;&nbsp;
    <a href="#demo-workspaces">Demo Workspaces</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/UI-Material%20Design%203-0B57D0?style=flat-square" alt="Material Design 3" />
    <img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%205-1F2937?style=flat-square" alt="React 18 + Vite 5" />
    <img src="https://img.shields.io/badge/API-PHP%208.3%20REST-4F5B93?style=flat-square" alt="PHP 8.3 REST" />
    <img src="https://img.shields.io/badge/Database-SQLite%203%20%7C%20MySQL-0F766E?style=flat-square" alt="SQLite 3 | MySQL" />
    <img src="https://img.shields.io/badge/Deploy-Vercel%20Container-111827?style=flat-square" alt="Vercel Container" />
  </p>

  <br />
  <img src="public/hero-workspace.jpg" alt="Practicly workspace overview" width="820" />
</div>

---

## Workspaces

Practicly separates permissions, views, and compliance workflows into four purpose-built workspaces backed by clean role-scoped routes:

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>Student Intern</h3>
      <p>Clock shifts with the live stopwatch, import attendance spreadsheets, and attach signed DTR PDFs while tracking real-time progress toward required practicum hours.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Host Supervisor</h3>
      <p>Approve logged trainee shifts and submit competency ratings via a direct HMAC-signed verification link (<code>?verify=1</code>) or an authenticated mentor account.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>Faculty Adviser</h3>
      <p>Compare digital attendance against wet-signed scans side by side, conduct HTE quality audits (INST-03), review 360-degree forms, and endorse final clearance.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Practicum Coordinator</h3>
      <p>Maintain host organization MOAs, configure program hour targets, approve faculty accounts, export institutional clearance reports, and inspect the live database schema.</p>
    </td>
  </tr>
</table>

---

## How a Practicum Term Runs

Every attendance record and evaluation stays connected from onboarding through final clearance:

| Stage | Milestone | Description |
| :---: | :--- | :--- |
| **1** | **Placement Setup** | Pair interns with an approved partner organization, host supervisor, faculty adviser, and program hour goal. |
| **2** | **Attendance & DTR Filing** | Record daily shifts throughout the term and attach wet-signed physical timecards alongside digital shift logs. |
| **3** | **Workplace Verification** | Host mentors review submitted attendance shifts and file mid-term and final competency evaluations without friction. |
| **4** | **Cross-Audit & Clearance** | Faculty advisers verify logged hours against DTR scans, complete required evaluation forms, and issue official completion clearance. |

---

## Architecture

### Frontend & Design System
- **Google Material Design 3** components built with `@fontsource/inter`, `@fontsource/open-runde`, light/dark theme tokens, custom SVG iconography, M3 sliders, filter chips, segmented toolbars, and accessible modals.
- **Client-Side Path Routing** ([`src/utils/appRouter.js`](src/utils/appRouter.js)) with role-based route guards and canonical tab aliases (`/dashboard`, `/timelogs`, `/evaluations`, `/compliance`, `/employers`, `/students`, `/adviser-monitoring`, `/placements`, `/admin`, `/database-erd`).

### Backend, Security & RBAC
- **Unified PHP REST Controller** ([`backend/api/index.php`](backend/api/index.php)) with strict `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy` headers.
- **Stateless HMAC-SHA256 Auth & Verification Tokens**: Signed with an internal runtime key (`AppSecret`), paired with bcrypt `Users.password_hash` verification, tenant-scoped SQL queries, and strict role-based access enforcement (`401`/`403` isolation).
- **Zero-Login HTE Portal (`?verify=1`)**: Scoped verification tokens let external host supervisors approve trainee logs and submit INST-02 evaluations directly without managing portal passwords.

### Tech Stack
- **Frontend**: React 18, Vite 5, Material Design 3 tokens & custom CSS
- **Backend**: PHP 8.3 (built-in router for static bundle + `/api/*` REST endpoints)
- **Database**: SQLite 3 (`database/ojt_tracking.db`) & MySQL / MariaDB (`database/schema_and_seed.sql`)
- **Deployment**: Multi-stage Docker (`Dockerfile.vercel` — Node 22 build + PHP 8.3 runtime) on Vercel

---

## Database Schema

Practicly runs on a normalized relational schema supporting both **SQLite 3** and **MySQL / MariaDB** ([`backend/config/database.php`](backend/config/database.php)):

- **8 Core Entities + Runtime Key Store**: `Student`, `Employer`, `Adviser`, `Users`, `Placement`, `TimeLog`, `Evaluation`, `ComplianceReport`, and `AppSecret`.
- **Automated Triggers**: `trg_timelog_after_*`, `trg_evaluation_after_*`, and `trg_placement_after_*` automatically recompute total rendered hours (excluding flagged shifts), check all 4 evaluation instruments (`INST-01` through `INST-04` or signed DTR/evaluation scans), update `Placement.status`, and generate clearance references when `total_hours_completed >= required_hours`.
- **Analytical SQL Views**: `vw_placement_progress`, `vw_employer_analytics`, and `vw_adviser_monitoring`, plus an interactive schema & ERD inspector built into the Coordinator workspace.

---

## Project Structure

```text
├── backend/
│   ├── api/index.php                 # Unified REST API controller, RBAC & HMAC auth
│   ├── config/database.php           # Dual SQLite 3 / MySQL PDO connector
│   └── router.php                    # Serves /api/*, uploads, and SPA dist fallback
├── database/
│   ├── ojt_tracking.db               # Pre-seeded SQLite 3 database
│   ├── schema_and_seed.sql           # MySQL / MariaDB schema, views & stored procedures
│   ├── schema_and_seed_sqlite.sql    # SQLite 3 schema, triggers, views & seed data
│   └── practicly-erd.png             # System Entity-Relationship Diagram
├── public/                           # Brand icons, webmanifest, landing & role illustrations
├── src/
│   ├── components/                   # Material 3 UI primitives, modals & role views
│   ├── styles/app.css                # Material Design 3 tokens & responsive layouts
│   ├── utils/                        # Client router, API client & rubric helpers
│   └── App.jsx                       # Application shell, landing experience & workspaces
├── Dockerfile.vercel                 # Production container image (Node 22 + PHP 8.3)
├── vercel.json                       # Vercel container deployment config
└── vite.config.js                    # Vite build & /api dev proxy configuration
```

---

## Demo Workspaces

The seeded database includes role accounts for evaluation (default demo password: `password123`). New students and faculty advisers can also self-register directly from the **Create an account** flow:

| Role | Demo Username | Workspace Scope |
| :--- | :--- | :--- |
| **Practicum Coordinator** | `admin` | System-wide oversight, MOAs, placements, user approvals & schema inspector |
| **Faculty Adviser** | `engr.delacruz` | Advisee monitoring, DTR scan audit, HTE quality audits & clearance endorsement |
| **Host Supervisor** | `supervisor.accenture` | Assigned company trainees, shift approval & competency evaluations |
| **Student Intern** | `clarisse.villanueva` | DTR time logging, signed PDF uploads, evaluations & clearance status |
