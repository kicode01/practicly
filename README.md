# Internship / OJT Tracking and Employer Database System

**Polytechnic University of the Philippines (PUP)**  
*College of Engineering — Computer Engineering Department (Sta. Mesa, Manila)*  
**Course:** Database Management System (Software Development / Computer Engineering)

### Prepared by Group 8
| Member Name | Role | Primary Responsibilities |
| :--- | :--- | :--- |
| **Balanag, Kian H.** | Frontend Developer | UI/UX for time-log entry, student/adviser dashboards, compliance report & clearance certificate views |
| **Calangian, Emmanuel G.** | Backend Developer | Relational database schema, SQL views/triggers, PHP REST API for placements & attendance aggregation |
| **Gutierrez, Sophia Margarete N.** | Documentation Lead | Project proposal, ERD specification, system documentation, compliance reporting & QA |
| **Yadao, Adrian E.** | Backend Developer | Stored procedures for hour aggregation (`SUM`), multi-table eligibility logic, and HTE analytics |

---

## 1. System Overview & Key Optimizations

The **Internship / OJT Tracking and Employer Database System** centralizes student OJT placements, partner Host Training Establishments (HTEs), daily/weekly attendance time logs, supervisor evaluations, and clearance compliance reporting into a normalized 8-table MySQL/MariaDB relational database backed by a PHP 8.2 REST API and a React (Vite) frontend.

### Key Architectural & Database Improvements Implemented
1. **Normalized 8-Table Relational Schema (`database/schema_and_seed.sql`)**:
   - **Master Stakeholder Entities**: `Users`, `Student`, `Employer`, `Adviser`
   - **Core 3-Way Junction Contract Entity**: `Placement` (linking `student_id`, `employer_id`, `adviser_id`, `required_hours`, and `status`)
   - **Dependent Transaction & Aggregation Entities**: `TimeLog`, `Evaluation`, `ComplianceReport`
2. **Real-Time Database Triggers & Stored Procedures**:
   - `sp_sync_placement_compliance(p_placement_id)` and `sp_sync_all_compliance_reports()` automatically execute `SUM(hours_rendered)` grouped by `placement_id` and join `Evaluation` records whenever any `TimeLog` or `Evaluation` row is inserted, updated, or deleted (`trg_timelog_after_*` and `trg_evaluation_after_*`).
   - Enforces the core eligibility rule:
     $$\text{total\_hours\_completed} \ge \text{required\_hours} \land \text{evaluation\_exists} \implies \text{requirement\_met} = 1$$
3. **Pre-Joined Analytical SQL Views**:
   - `vw_placement_progress`: Multi-table `JOIN` across `Placement`, `Student`, `Employer`, `Adviser`, aggregated `TimeLog` (`SUM`, `COUNT`, `MAX(date)`), `Evaluation` (`AVG(rating)`), and `ComplianceReport`.
   - `vw_employer_analytics`: Aggregates active interns, completed interns, total hours hosted, and mean rating per HTE partner.
   - `vw_adviser_monitoring`: Tracks each faculty adviser's supervision load, average student progress, and pending evaluations.
4. **Bespoke Institutional UI with Custom SVG Icons**:
   - Crafted specifically for the PUP College of Engineering (CpE Department) with custom inline SVG iconography, tabular-numeric alignment, CSV export, a live **ERD & SQL Architecture Inspector**, and a printable **Official PUP-CpE OJT Clearance Certificate**.

---

## 2. Quick Start & Running the System

### Option A: One-Click Windows Launcher
Double-click or run [`start-system.bat`](./start-system.bat), which automatically starts XAMPP MySQL, initializes `ojt_tracking_db` if needed, starts the PHP API server on port `8000`, and launches the Vite React server on port `5173`.

### Option B: Manual Commands
```powershell
# 1. Import schema and seed data into XAMPP MySQL
C:\xampp\mysql\bin\mysql.exe -u root < database\schema_and_seed.sql

# 2. Start PHP REST API server (serves /api/* and production dist/ build)
C:\xampp\php\php.exe -S 127.0.0.1:8000 backend\router.php

# 3. Start Vite React development server
npm run dev
```

- **Development URL**: http://127.0.0.1:5173
- **Production Build URL**: http://127.0.0.1:8000

---

## 3. Demo Role Credentials

All pre-seeded accounts use the password: **`password123`** (verified against bcrypt `Users.password_hash`). You can also switch roles with one click from the Login screen or the top navigation bar.

| Username | Role | Linked Stakeholder | OJT / Demo State |
| :--- | :--- | :--- | :--- |
| `admin` | `admin` | System Administrator | Full access to all 9 modules, user control, HTEs & placements |
| `engr.delacruz` | `adviser` | Engr. Arlene R. Dela Cruz, MSc | OJT Coordinator supervising Kian, Emmanuel, and Sophia |
| `engr.santos` | `adviser` | Engr. Marco Antonio V. Santos, PCpE | Faculty Adviser supervising Adrian Yadao & Miguel Delos Santos |
| `kian.balanag` | `student` | Balanag, Kian H. (`2023-00108-MN-0`) | **Completed & Cleared** (304.00 / 300.00 hrs at Accenture + 2 Evals) |
| `emmanuel.calangian` | `student` | Calangian, Emmanuel G. (`2023-00115-MN-0`) | **Completed & Cleared** (300.00 / 300.00 hrs at Pointwest + 2 Evals) |
| `sophia.gutierrez` | `student` | Gutierrez, Sophia Margarete N. (`2023-00129-MN-0`) | **Ongoing — Near Completion** (284.00 / 300.00 hrs at Azeus, 16 hrs left) |
| `adrian.yadao` | `student` | Yadao, Adrian E. (`2023-00142-MN-0`) | **Hours Met, Pending Evaluation** (302.50 / 300.00 hrs at Analog Devices) |
| `miguel.delossantos` | `student` | Delos Santos, Miguel R. (`2023-00164-MN-0`) | **Ongoing** (192.00 / 300.00 hrs at Globe Telecom) |
| `clarisse.villanueva` | `student` | Villanueva, Clarisse Anne T. (`2023-00188-MN-0`) | **Completed & Cleared** (310.00 / 300.00 hrs at Samsung R&D) |
