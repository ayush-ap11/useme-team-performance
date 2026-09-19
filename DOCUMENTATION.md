# Useme Team Platform — Frontend Technical Documentation (Backend Handoff)

Welcome to the technical handoff documentation for the **Useme Team Performance Tracking Platform**. This master document synthesizes the executive summary, architecture, relational schemas, role permissions, authoritative scoring logic, API contracts, prototype limitations, and domain terminology across the platform.

Each section begins with an immediate **Reference File** link so engineers can navigate directly to the comprehensive specification in [`docs/`](docs/).

---

## Table of Contents
1. [Module 01: System Overview & Target Architecture](#module-01-system-overview--target-architecture) — `docs/01-overview.md`
2. [Module 02: Data Models & Entity Schemas](#module-02-data-models--entity-schemas) — `docs/02-data-models.md`
3. [Module 03: Roles & Permissions Matrix + Security Audit](#module-03-roles--permissions-matrix--security-audit) — `docs/03-roles-permissions.md`
4. [Module 04: Feature Specifications & Authoritative Scoring Logic](#module-04-feature-specifications--authoritative-scoring-logic) — `docs/04-feature-documentation.md`
5. [Module 05: Proposed Backend API Contracts](#module-05-proposed-backend-api-contracts) — `docs/05-api-contracts.md`
6. [Module 06: Known Limitations & Frontend Assumptions](#module-06-known-limitations--frontend-assumptions) — `docs/06-limitations-assumptions.md`
7. [Module 07: Domain Terminology Glossary](#module-07-domain-terminology-glossary) — `docs/07-glossary.md`
8. [Migration Checklist for Backend Engineers](#migration-checklist-for-backend-engineers)

---

## Module 01: System Overview & Target Architecture

> **Reference File**: [docs/01-overview.md](docs/01-overview.md)

### Summary
Useme Team is an enterprise operational management and talent appraisal operating system designed for distributed technology and field organizations. It unifies daily deliverable execution (tasks, projects, events) with quantitative performance measurement (5-pillar KRAs, outreach engagement, peer motivation, attendance streaks, and automated risk detection).

### Core Logic & Personas
The system enforces two distinct operational personas:
- **Administrator (`admin`)**: Operations heads, HR leadership, and managers (`m1`, Executive department). Possesses unrestricted authority to create/edit/delete tasks and projects, review and score deliverable submissions, onboard/offboard personnel (with mandatory direct-report reassignment), configure review cycles and pillar weights, override Zoom attendance, and view executive analytics.
- **Team Member (`member`)**: Field outreach specialists, engineers, designers, financial associates, and support agents (`m2`–`m180`). Granted scoped access to view assigned deliverables, transition task statuses (`testing`, `awaitingFeedback`), upload deliverable proof assets, log verified outreach and motivation activities, join live Zoom calls (with latency self-capture), self-declare skill proficiencies (marked unverified), and track personal performance rankings.

### Target 3-Tier Production Architecture
The prototype's monolithic in-browser `localStorage` state must be replaced by a production 3-tier architecture:
1. **Presentation Layer**: Client browser (HTML5, Vanilla CSS, JS modules) communicating via standard HTTPS REST JSON.
2. **Application Layer**: Backend API service (Node.js/Express/NestJS, Go, or Python) enforcing authentication, RBAC middleware, FSM status transitions, authoritative mathematical scoring, and automated insight scanning.
3. **Data & Integration Layer**: PostgreSQL 16+ (relational data, ACID transactions), Redis 7+ (session storage and cache), Cloud Object Storage (presigned S3 deliverable uploads), and Zoom Server-to-Server Webhook ingestion.

---

## Module 02: Data Models & Entity Schemas

> **Reference File**: [docs/02-data-models.md](docs/02-data-models.md)

### Summary
The platform state comprises **23 normalized entities** spanning organizational structure, deliverable lifecycle, performance appraisal, synchronous attendance, and audit trails.

### Core Entity Breakdown & Relational Logic

| Entity Name | Primary Key | Key Attributes | Foreign Keys & Relational Constraints |
| :--- | :--- | :--- | :--- |
| **`Member`** | `id` (`m1`..`m180`) | `name`, `username`, `email`, `role`, `department`, `band`, `kpiScore`, `compositeScore`, `rank`, `isActive` | `reportsTo` $\to$ `Member.id`, `department` $\to$ `Department.name`, `skillCategory` $\to$ `SkillCategory.id`. Self-referencing tree for org hierarchy. |
| **`Department`** | `id` (`dept-eng`) | `name`, `colorHex`, `order` | Referenced by `Member.department`. Unique constraint on `name`. Deletion blocked if active members assigned. |
| **`SkillCategory`** | `id` (`dev`, `data`) | `name`, `description`, `count` | Referenced by `Task.linkedSkill`, `Member.skillCategory`, `SkillProficiency`. Deletion blocked if active members assigned. |
| **`SkillProficiency`** | `id` (`sp-m5-dev`) | `memberId`, `categoryId`, `level` (`Beginner`..`Expert`), `verified` | Composite unique on `(memberId, categoryId)`. Self-declared entries set `verified = false`. |
| **`Task`** | `id` (`t1`..`t1250`) | `title`, `status` (7-state FSM), `dueDate`, `qualityScore`, `submittedForReview`, `complianceFlag` | `assignedTo` $\to$ `Member.id[]`, `projectId` $\to$ `Project.id`, `eventId` $\to$ `Event.id`, `cycleId` $\to$ `ReviewCycle.id`. |
| **`Submission`** | `id` (`sub-t1`) | `taskId`, `memberId`, `status` (`pending`, `approved`, `needsRework`), `qualityScore`, `reworkNotes` | 1-to-1 mapping with `Task.id`. Stores review queue state and rework loop history. |
| **`Project`** | `id` (`p1`..`p100`) | `name`, `status` (`active`, `onHold`, `completed`), `startDate`, `targetDate`, `progress` (%) | `memberIds` $\to$ `Member.id[]`, `linkedTaskIds` $\to$ `Task.id[]`. Deletion blocked if active tasks linked. |
| **`Event`** | `id` (`e1`..`e120`) | `name`, `venue`, `eventDate`, `status`, `members` (`[{ memberId, roleAtEvent }]`) | Unique constraint on `(venue, eventDate)` to prevent physical scheduling collisions. |
| **`ReviewCycle`** | `id` (`cycle-aug-2026`) | `label`, `startDate`, `endDate`, `isCurrent` (boolean) | Unique active cycle constraint (`isCurrent === true`). Baselines all appraisals and metrics. |
| **`KraPillar`** | `id` (`pillar-growth`) | `name`, `weight` (numeric), `targetDescription`, `order` | **Critical Constraint**: Sum of all pillar weights across the organization must equal exactly **100.0%**. |
| **`KraObjective`** | `id` (`kra-1`) | `pillar`, `ownerId`, `target` (e.g. 90.0), `orgActual` | Maps strategic benchmarks to executive owners (`Member.id`). |
| **`KraScore`** | `id` (`score-m5-growth`) | `memberId`, `cycleId`, `pillarId`, `score` ($0..100$), `notes` | Composite unique on `(memberId, cycleId, pillarId)`. Evaluated pillar attainment per member per cycle. |
| **`KraHistory`** | `months` / `org` | `months` (`["Mar",..]`), `org` (averages), `members` (`{ [mId]: scores[] }`) | 6-month historical performance telemetry for trend visualization. |
| **`ActivityType`** | `id` (`onGround`) | `label`, `category` (`outreach`, `motivation`), `pointValue`, `requiresProof` | Administrative catalog governing points awarded for field engagement and peer workshops. |
| **`EngagementSubmission`** | `id` (`eng-1`) | `memberId`, `type`, `title`, `date`, `proofType` (`url`/`file`), `proofValue`, `status` | Outreach logs. Points accrue toward monthly target only upon transition to `approved`. |
| **`MotivationSubmission`** | `id` (`mot-1`) | `memberId`, `type` (`groupTalk`/`microEvent`), `title`, `date`, `proofValue`, `status` | Peer workshops. Points accrue toward monthly target only upon transition to `approved`. |
| **`ZoomSession`** | `id` (`z-live`) | `title`, `date`, `time`, `scheduledStart`, `sessionEnd`, `zoomUrl`, `attendance` | Video syncs with structured attendance and latency records (`present`, `late`, `absent`). |
| **`TargetGroup`** | `id` (`tg-field`) | `name`, `memberIds`, `targetPoints` (e.g. 45 pts/mo) | Cohort-level monthly attainment quotas for engagement and motivation. |
| **`MemberTargetOverride`** | `memberId` (`m5`) | `engagement` (pts), `motivation` (pts) | Personal member overrides superseding cohort quotas and system fallbacks. |
| **`ActivityLog`** | `id` (`act-101`) | `actorMemberId`, `actionText`, `timestamp`, `relatedEntityType`, `relatedEntityId` | Append-only operational audit log tracking administrative and lifecycle mutations. |
| **`ResourceItem`** | `id` (`res-1`) | `title`, `type` (`document`, `link`, `template`), `url`, `fileSize`, `uploadedBy` | Centralized digital asset hub for team templates and deliverable references. |
| **`MetricSummary`** | `cycleId` | `totalTasks`, `completionRate`, `activeMembers`, `avgKpiScore`, `riskCount` | Materialized cache of executive operational KPIs per review cycle. |
| **`InsightItem`** | `id` (`ins-1`) | `ruleId`, `severity` (`high`, `medium`), `title`, `entityType`, `entityId`, `message` | Ephemeral or cached anomaly notifications flagged by the automated insights engine. |

### Core Schema Invariants
1. **Pillar Weight Integrity**: The sum of `KraPillar.weight` must equal exactly $100.0\%$. Updates that violate this invariant must be rejected with `400 Bad Request`.
2. **Active Cycle Singularity**: Exactly one `ReviewCycle` may have `isCurrent = true` at any time. Setting a cycle as current must atomically reset all other cycles to `isCurrent = false`.
3. **Venue Collision Prevention**: Attempting to schedule an `Event` with identical `venue` and `eventDate` must be rejected with `409 Conflict`.
4. **Hierarchy Deletion Guard**: A manager cannot be soft-deleted (`isActive = false`) until all their direct reports (`reportsTo === memberId`) have been reassigned to another active manager.

---

## Module 03: Roles & Permissions Matrix + Security Audit

> **Reference File**: [docs/03-roles-permissions.md](docs/03-roles-permissions.md)

### Summary
The platform implements Role-Based Access Control (RBAC) separating administrative governance from member execution. This section outlines the authoritative CRUD access matrix, details seven critical security vulnerabilities identified in the frontend prototype, and specifies the required backend middleware architecture.

### Core Permissions Matrix
- **Member Management**: Admin creates, updates, and offboards members (with direct-report reassignment). Members can only view profiles and change their own password.
- **Tasks & Submissions**: Admin creates/edits/deletes tasks and approves/reworks submissions. Assigned members can advance tasks to `testing`, upload deliverables, and submit for review. **Members cannot mark tasks completed**.
- **KRA & Scoring**: Admin configures pillars, review cycles, and inputs evaluated scores. Members view personal scores.
- **Engagement & Zoom**: Members log outreach/talks and trigger self-check-in upon joining Zoom calls. Admin configures activity types, reviews submissions, and overrides attendance statuses.
- **Insights & Reports**: Admin only.

### 7 Critical Security Vulnerabilities (Must Fix on Backend)
1. **Client-Side Identity Spoofing**: `localStorage` stores `useme_role` and `useme_user_id` as raw plaintext. Any user can self-elevate to `admin` in DevTools.
2. **Caller Parameter Injection**: DataStore write methods accept untrusted client-supplied user objects (`u?.role`).
3. **Unprotected Score Overwrite**: `DataStore.updateMemberScores()` has **zero authorization checks**, allowing arbitrary score tampering.
4. **Unprotected Audit Logging**: `DataStore.logActivity()` accepts any spoofed `actorMemberId`.
5. **Global Reseed Function**: `window.reseedDatabase()` is globally exposed on `window` without authentication.
6. **Client-Side SHA-256 Hashing**: Password hashes are stored unsalted in `localStorage`, exposed to local inspection and rainbow tables.
7. **In-Memory State Mutation**: `window.USEME_DATA` is globally mutable in DevTools console.

### Target Backend Middleware Architecture
Backend APIs must implement a strict 3-tier middleware chain:
1. **`authenticateSession`**: Validates signed `HttpOnly` session tokens; loads verified `req.user`.
2. **`requireRole('admin')`**: Enforces system-level role constraints.
3. **`assertOwnershipOrAdmin(req => req.params.memberId)`**: Ensures members can only access or mutate their own resources (e.g. personal profile, assigned tasks, password updates).

---

## Module 04: Feature Specifications & Authoritative Scoring Logic

> **Reference File**: [docs/04-feature-documentation.md](docs/04-feature-documentation.md)

### Summary
Detailed specifications for all fifteen features across the platform: Dashboard, Hierarchy Visualizer, Skill Mapping, Task Lifecycle, Submissions Review Queue, Projects, Events, Leaderboard, Automated Insights, KRA/KPI Appraisal, Engagement & Zoom, Asset Hub, Reports & Export Engine, Command Palette, and Profile Management.

### Authoritative Mathematical Scoring Logic

#### 1. Master Overall Performance Score Formula
$$\text{Overall Score} = \max\Big(0, \min\Big(100, \text{round}\Big((\text{KRA} \times 0.40) + (\text{ENG} \times 0.20) + (\text{MOT} \times 0.20) + (\text{QUAL} \times 0.20) - \text{PEN}\Big)\Big)\Big)$$

#### 2. KRA Strategic Pillars (100% Total Weight)
- **Growth (25%)**: $\min(100, \text{round}((\text{Completed Tasks} / \text{Total Tasks}) \times 100))$. Default fallback: $88.0$.
- **Quality (25%)**: Evaluated via Submission Quality Score ($0..100$).
- **Timeliness (20%)**: $(\text{On-Time Completed Tasks} / \text{Completed Tasks}) \times 100$. Default fallback: $85.0$.
- **Skill (15%)**: Average evaluated competency score ($\text{Expert/L4}=95, \text{Advanced/L3}=85, \text{Intermediate/L2}=75, \text{Beginner/L1}=65$). Default fallback: $82.0$.
- **Compliance (15%)**: $\max(50, 100 - (\text{Overdue Incomplete Tasks} \times 5))$.

#### 3. Submission Quality Score Formula
$$\text{First-Pass Rate} = \frac{\text{Completed Tasks with Zero Rework}}{\text{Total Completed Tasks}} \times 100 \quad (\text{fallback: } 86.5\%)$$
$$\text{Quality Score} = \text{round}\left((\text{First-Pass Rate} \times 0.6) + \left(\frac{\text{Average Quality Rating}}{5} \times 100 \times 0.4\right)\right)$$

#### 4. Target Resolution Precedence (Engagement & Motivation)
When resolving monthly point quotas, the system evaluates in strict order:
1. **Personal Member Target Override**: `memberTargetOverrides[memberId][category]`
2. **Cohort Target Group**: `targetGroups.find(g => g.memberIds.includes(memberId)).targetPoints`
3. **Default System Fallback**: `40` points

#### 5. Engagement & Motivation Attainment %
$$\text{Engagement Attainment \%} = \min\left(100, \text{round}\left(\frac{\sum_{\text{approved}} \text{activity.pointValue}}{\text{Resolved Target}} \times 100\right)\right)$$
$$\text{Motivation Attainment \%} = \min\left(100, \text{round}\left(\frac{\text{Zoom Points} + \text{Talk Points}}{\text{Resolved Target}} \times 100\right)\right)$$
*(Zoom: Present = 3 pts, Late = 1 pt, Absent = 0 pts; Group Talk = 4 pts, Micro Event = 5 pts)*

#### 6. Key Risk Indicator (KRI) Penalty Deductions
- **Overdue Incomplete Task**: $+3$ pts per task past `dueDate`.
- **Repeated Rework Penalty**: $+5 \times (\text{reworkCount} - 1)$ for tasks requiring $> 1$ revision.
- **Compliance Flag**: $+5$ pts if `task.complianceFlag === true`.

#### 7. RAG Health Classification
- **Green (On Track)**: Attainment Score $\ge 85.0\%$
- **Amber (At Risk)**: $60.0\% \le \text{Attainment Score} < 85.0\%$
- **Red (Behind)**: Attainment Score $< 60.0\%$

#### 8. Zoom Self-Capture Latency Window
$$\Delta = \frac{\text{clientTimestamp} - \text{scheduledStart}}{60000} \text{ (minutes)}$$
- $\Delta \le 5 \text{ min} \implies \text{Present}$ ($3$ pts)
- $5 < \Delta \le 15 \text{ min} \implies \text{Late}$ ($1$ pt)
- $\Delta > 15 \text{ min} \implies \text{Absent}$ ($0$ pts)

#### 9. 6 Deterministic Automated Insights Rules
1. **Stuck Tasks**: Non-terminal task in same status for $\ge 4$ days ($\ge 6$ days = High severity, $4..5$ days = Medium).
2. **Rework Cluster**: Member with $\ge 2$ active tasks in `reworkNeeded` (High severity).
3. **Domain Bottleneck**: Skill category with $\ge 3$ active tasks blocked in review/rework (Medium severity).
4. **At-Risk Projects**: Project due in $\le 20$ days with $< 50\%$ completed deliverables (High severity).
5. **Low Engagement**: Member with approved activities in cycle $< \max(1, \lfloor 0.5 \times \text{team average} \rfloor)$ (Medium severity).
6. **Repeated Zoom Absence**: Member with $\ge 2$ absences in current cycle Zoom calls (High severity).

---

## Module 05: Proposed Backend API Contracts

> **Reference File**: [docs/05-api-contracts.md](docs/05-api-contracts.md)

### Summary
The backend service must expose 18 RESTful HTTP resource groups under `/api/v1`, adhering to standard JSON payloads, HTTP status codes (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`), and strict role-based route guards.

### Resource Group Surface

- **`/auth`**: User login (`POST /auth/login`), logout (`POST /auth/logout`), session verification (`GET /auth/me`), public registration (`POST /auth/register`).
- **`/members`**: Member list, detail, administrative onboarding (`POST /members`), hierarchy assignment (`PATCH /members/:id/assign`), profile updates, offboarding (`POST /members/:id/offboard`), self-service password update (`POST /members/:id/password`), admin password reset (`POST /members/:id/reset-password`).
- **`/departments`**: Department CRUD with member assignment conflict validation (`DELETE` blocked if members exist).
- **`/skills`**: Category listing/CRUD, member proficiency updates (`PUT /skills/proficiencies`).
- **`/tasks`**: Task listing (filtered by assignee for members), creation, metadata update, FSM status transition (`PATCH /tasks/:id/status`), review submission (`POST /tasks/:id/submit`), deliverable asset uploads, deletion/archival.
- **`/submissions`**: Review queue listing (pending, approved, needsRework), administrative approval (`POST /submissions/:id/approve`), rework requests (`POST /submissions/:id/rework`).
- **`/projects`**: Project CRUD with linked task progress calculation and active task deletion guards.
- **`/events`**: Event scheduling, crew staffing, and automated venue collision detection (`GET /events/check-conflict`).
- **`/cycles`**: Review cycle CRUD and atomic active cycle switcher (`POST /cycles/:id/set-current`).
- **`/kra`**: Strategic pillars CRUD (weights summing to 100%), per-member score entry (`POST /kra/scores`), historical telemetry.
- **`/engagement` & `/motivation`**: Activity type catalog CRUD, self-reported activity logging, admin approval/rework.
- **`/zoom`**: Session CRUD, self-capture check-in endpoint (`POST /zoom/sessions/:id/checkin`), admin attendance overrides (`POST /zoom/sessions/:id/attendance`).
- **`/targets`**: Target groups and member personal overrides CRUD.
- **`/insights`**: Deterministic anomaly scan endpoint (`GET /insights`).
- **`/resources`**: Cross-entity asset aggregation and administrative deletion/cleanup (`DELETE /resources/:type/:id`).
- **`/reports`**: Metric aggregations, dynamic trend charts, and multi-section CSV export (`GET /reports/export`).
- **`/search`**: Global fuzzy command palette indexing.

---

## Module 06: Known Limitations & Frontend Assumptions

> **Reference File**: [docs/06-limitations-assumptions.md](docs/06-limitations-assumptions.md)

### Summary
Documents all client-side assumptions, storage limits, and prototype simplifications present in the current build that the backend engineering team must replace for production readiness.

### Core Limitations & Technical Boundaries
1. **`localStorage` Confinement**: The entire 2.7MB database is serialized into a single browser key (`useme_data_store`). There is zero multi-user concurrency; edits in one browser are invisible to others; opening multiple tabs causes lost updates; clearing cache wipes all data; high-volume data risks the 5MB quota ceiling.
2. **Insecure Authentication**: Client stores plaintext role (`useme_role`) and ID in localStorage without cryptographic signatures. Passwords use client-side unsalted SHA-256 vulnerable to rainbow tables. All 180 seed accounts use well-known default passwords (`Useme@Admin1`, `Useme@Member1`, `Useme@2026`).
3. **Simulated Zoom Self-Capture**: Attendance check-in relies on the client machine's local clock (clock skew vulnerability) and records only click intent without verifying whether the user actually attended or how long they stayed.
4. **Synchronous UI Thread Scoring**: All mathematical scoring equations, leaderboard rankings, and anomaly scans execute synchronously on the client CPU, risking UI thread stalls on large datasets.
5. **Mocked Asset Storage**: File uploads are simulated via local filenames, data URIs, or mock byte strings without actual cloud object storage or MIME-type inspection.

---

## Module 07: Domain Terminology Glossary

> **Reference File**: [docs/07-glossary.md](docs/07-glossary.md)

### Summary
Authoritative dictionary defining domain concepts, organizational structures, and scoring acronyms across the Useme Team platform.

### Core Domain Definitions
- **KRA (Key Result Area)**: High-level strategic accountability pillars across which organizational performance is evaluated: Growth (25%), Quality (25%), Timeliness (20%), Skill (15%), and Compliance (15%). Weights must sum to 100%.
- **KPI (Key Performance Indicator)**: Positive, quantifiable operational milestones that accumulate points towards appraisal (approved deliverables, on-time delivery, first-pass approval).
- **KRI (Key Risk Indicator)**: Negative operational metrics that deduct penalty points from a member's composite score (overdue task: $-3$ pts, repeat rework: $-5$ pts/rev, compliance breach: $-5$ pts).
- **Composite Score**: Final aggregated performance rating ($0.0$ to $100.0$) combining KRA attainment (40%), Engagement (20%), Motivation (20%), and Quality (20%), minus KRI penalties.
- **First-Pass Rate**: Percentage of completed deliverables approved on initial submission without ever being flagged for rework (`reworkNeeded`).
- **RAG Status**: Standardized executive health classification: Green ($\ge 85.0\%$), Amber ($60.0\%..84.9\%$), Red ($< 60.0\%$).
- **Review Cycle**: Bounded evaluation period (monthly/quarterly) against which deliverables, attendance, and scores are baselined. Only one cycle can be active (`isCurrent = true`) at a time.
- **Target Resolution Order**: 3-step hierarchy for resolving monthly outreach/motivation quotas: Personal Member Override $\to$ Cohort Target Group $\to$ Default Fallback ($40$ pts).
- **Miller Columns**: Multi-tier horizontal column navigation paradigm used in the Team Hierarchy visualizer.
- **Self-Capture**: Timestamp captured when a member clicks "Join Call" on a live Zoom session, evaluated against scheduled start time.

---

## Migration Checklist for Backend Engineers

- [ ] **Database Migration**: Create relational tables matching [docs/02-data-models.md](docs/02-data-models.md) with foreign keys, cascading rules, and composite indexes.
- [ ] **Cryptographic Auth**: Replace client SHA-256 with server-side **Argon2id** or **bcrypt** ($cost \ge 12$). Issue signed `HttpOnly; Secure; SameSite=Lax` session cookies.
- [ ] **Enforce Server RBAC**: Eliminate untrusted client-supplied user objects. Assert role context strictly from verified server-side session tokens.
- [ ] **Patch Score Overwrite Hole**: Strip any client-facing API that directly writes `kpiScore` or `compositeScore`. Authoritative scoring must execute purely server-side.
- [ ] **Secure File Deliverables**: Implement S3 / Cloud Storage presigned upload URLs with MIME-type verification, eliminating data URI mocking.
- [ ] **Zoom Webhook Relay**: Build webhook receivers for `meeting.participant_joined` and `meeting.participant_left` to record verified dwell time rather than self-reported clicks.
- [ ] **Input Sanitization**: Validate all incoming strings against XSS and enforce schema length constraints before saving to PostgreSQL.
