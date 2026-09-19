# Useme Team Platform — Technical Documentation: Roles & Permissions

This document details the Role-Based Access Control (RBAC) matrix for the Useme Team platform and highlights every security vulnerability and unenforced write operation identified in the current frontend-only build.

---

## 1. Authentication & Persona Model

The platform enforces two primary system roles:
- **`admin`**: System administrators, operations heads, and executive directors (`m1`, Executive department). Possesses unrestricted CRUD permissions across all system entities, score overrides, and audit reporting.
- **`member`**: Standard organizational team members (`m2` through `m180`). Granted scoped access to view their own assignments, submit deliverables, log verified outreach and motivation activities, check in to live Zoom calls, self-declare skill proficiencies, and update their personal passwords.

### Inherent Role Resolution
During authentication, the system evaluates the user's inherent organizational role:
- Members with `id === 'm1'` or `department === 'Executive'` are inherent **`admin`** users.
- All other active members are inherent **`member`** users.
- An inherent `member` requesting an `admin` session is rejected at login.

---

## 2. Action-Permission Matrix (Admin vs. Team Member)

The following matrix documents every operation in the application, defining what each persona is authorized to **Create (C)**, **Read (R)**, **Update (U)**, or **Delete (D)**.

| Domain / Action | Administrator (`admin`) | Team Member (`member`) | Scoping & Business Rules |
| :--- | :---: | :---: | :--- |
| **Authentication & Profile** | | | |
| User Login (`/auth/login`) | **C** | **C** | Authenticates via username or email + password. |
| User Self-Registration (`registerMember`) | **C** | **C** | Public onboarding; creates `isUnassigned: true` member. |
| View Own Profile (`/profile`) | **R** | **R** | Full personal record, contact details, assigned tasks. |
| Change Own Password (`updateMemberPassword`)| **U** | **U** | Allowed for **own account only**; requires old password. |
| Reset Other Member Password (`resetMemberPassword`)| **U** | **—** | Admin can reset any member's password without old hash. |
| **Hierarchy & Organization** | | | |
| View Organization Hierarchy Tree (`hierarchy.html`)| **R** | **R** | Full interactive multi-column visualizer and popovers. |
| Onboard New Member (`addTeamMember`) | **C** | **—** | Requires unique username and temporary password. |
| Assign Unassigned Member (`assignMemberToHierarchy`)| **U** | **—** | Assigns department, manager, band, and skill category. |
| Edit Member Profile (`updateMember`) | **U** | **—** | Edits name, role, band, phone, location, department. |
| Update Department (`updateDepartment`) | **U** | **—** | Department name changes cascade to all assigned members. |
| Offboard Member (`deleteMember`) | **D** | **—** | Soft-delete (`isActive: false`); requires reassigning reports. |
| Create / Delete Department (`departments`) | **C / D** | **—** | Deletion blocked if active members belong to department. |
| **Skill Mapping & Proficiencies** | | | |
| View Skill Directory & Search (`skill-mapping.html`)| **R** | **R** | Full access to search members by skill and category. |
| Self-Declare Skill Proficiency (`upgradeSkillProficiency`)| **—** | **U** | Members can update **own level only**; marked `verified: false`. |
| Verify / Override Skill Proficiency | **U** | **—** | Admin can update any member's level; sets `verified: true`. |
| Create / Update / Delete Skill Category | **C / U / D**| **—** | Category deletion blocked if active members assigned. |
| **Tasks & Deliverables** | | | |
| View Tasks (`tasks.html`) | **R (All)** | **R (Assigned)** | Members only see tasks where `assignedTo.includes(userId)`. |
| Create Task (`createTask`) | **C** | **—** | Admin sets assignees, skill, due date, project/event link. |
| Edit Task Metadata (`updateTask`) | **U** | **—** | Admin modifies title, description, assignees, dates. |
| Delete Task (`deleteTask`) | **D** | **—** | Blocked if task has submission awaiting review. Soft-archives. |
| Advance Status: `testing` (`updateTaskStatus`)| **U** | **U** | Assigned members can transition task to `testing`. |
| Submit for Review (`submitTaskForReview`)| **—** | **U** | Transitions status to `awaitingFeedback` and sets review flag. |
| Direct Complete Task (`status = 'completed'`)| **U** | **—** | **Members cannot directly mark tasks completed.** |
| Upload Task Deliverable Asset (`addTaskAsset`)| **C** | **C** | Allowed for Admin or **assigned member only**. |
| Delete Task Deliverable Asset (`deleteAsset`)| **D** | **—** | Admin cleanup only. |
| **Submissions Review Queue** | | | |
| View Submissions (`submissions.html`) | **R (All)** | **R (Assigned)** | Admin views all queues; members view own submissions. |
| Approve Task Deliverable (`approveSubmission`)| **U** | **—** | Marks task `completed`, clears review flag, awards KPI. |
| Request Task Rework (`reworkSubmission`)| **U** | **—** | Marks task `reworkNeeded`, saves mandatory rework notes. |
| Remove Task from Review Queue (`deleteSubmission`)| **D** | **—** | Reverts task to `inProgress` and removes from review list. |
| **Projects & Events** | | | |
| View Projects (`projects.html`) | **R** | **R** | Both view active projects, progress bars, and team roster. |
| Create / Edit Project (`projects`) | **C / U** | **—** | Admin manages milestones, target dates, linked tasks. |
| Delete Project (`deleteProject`) | **D** | **—** | Blocked if active incomplete tasks are linked to project. |
| View Events (`events.html`) | **R** | **R** | Both view schedule, venues, crew assignments. |
| Create / Edit Event (`events`) | **C / U** | **—** | Admin configures venue, date, and crew assignments. |
| Delete Event (`deleteEvent`) | **D** | **—** | Blocked if active prep tasks are linked to event. |
| Check Venue Conflict (`checkEventVenueConflict`)| **R** | **—** | Automated collision detection for duplicate venue booking. |
| **Ranking & Insights** | | | |
| View Leaderboard Ranking (`ranking.html`) | **R (All)** | **R (Own Highlight)** | Leaderboard is strictly read-only. Members see own row. |
| View Automated Performance Insights (`insights.html`)| **R** | **—** | **Admin only.** Non-admins are redirected to dashboard. |
| Trigger Insights Re-analysis | **U** | **—** | Admin triggers deterministic rules engine re-evaluation. |
| **KRA & Review Cycles** | | | |
| View KRA & KPI Matrix (`kra.html`) | **R (Org/All)** | **R (Own)** | Admin selects any member or org; member views own. |
| Switch Active Review Cycle in UI | **R** | **R** | Changes evaluation window filter in browser session. |
| Create / Edit / Delete Review Cycle (`cycles`)| **C / U / D**| **—** | Deletion blocked if active tasks/submissions reference it. |
| Set Current Active Cycle (`setCurrentCycle`)| **U** | **—** | Only one review cycle can be current at a time. |
| Manage KRA Strategic Pillars (`kraPillars`)| **C / U / D**| **—** | Weights must sum to 100%. Deletion blocked if scores exist. |
| Enter / Edit Member KRA Pillar Score (`setKraScore`)| **C / U** | **—** | Admin inputs evaluated attainment score ($0..100$) + notes. |
| **Engagement, Motivation & Zoom** | | | |
| View Engagement & Motivation (`engagement-motivation.html`)| **R (Team)** | **R (Personal)** | Admin sees org metrics; member sees personal attainment. |
| Log Outreach Activity (`logEngagementActivity`)| **—** | **C** | Members log outreach; `memberId` forced to `currentUser.id`. |
| Log Motivation Activity (`logMotivationActivity`)| **—** | **C** | Members log group talks / micro-events with proof URL. |
| Approve / Rework Outreach & Motivation Submissions| **U** | **—** | Admin review; points only accrue upon approval. |
| Edit / Delete Engagement Submissions | **U / D** | **—** | Admin cleanup and metadata adjustments. |
| Join Live Zoom Call & Self-Capture (`recordZoomSelfCapture`)| **—** | **U** | Captures check-in timestamp; redirects user to Zoom URL. |
| Override Member Zoom Attendance (`setZoomAttendance`)| **U** | **—** | Admin overrides status (`present`, `late`, `absent`). |
| Create / Edit / Delete Zoom Session | **C / U / D**| **—** | Admin configures meeting date, time, and Zoom URL. |
| Manage Activity Type Registry (`activityTypes`)| **C / U / D**| **—** | Point values and proof requirements. Blocked if referenced. |
| Manage Target Groups & Member Overrides | **C / U / D**| **—** | Admin customizes attainment benchmarks. |
| **Resources & Reports** | | | |
| View Consolidated Resources (`resources.html`)| **R** | **R** | Aggregates all deliverable files, proofs, and project docs. |
| Delete Resource / Proof Asset (`deleteAsset`)| **D** | **—** | Admin can delete deliverables, proofs, or project assets. |
| View Executive Reports Dashboard (`reports.html`)| **R** | **—** | **Admin only.** Multi-period aggregations and trends. |
| Export Executive Performance CSV (`reports-export.js`)| **R** | **—** | Admin only. Writes an audit entry to `activityLog`. |
| **System & Administration** | | | |
| Full-Text Global Search (`command-palette.js`)| **R** | **R** | Keyboard palette (`Ctrl+K`) searching accessible entities. |
| View System Activity Feed (`activityLog`) | **R** | **R** | Live activity ticker displaying recent operations. |
| Reseed Database (`reseedDatabase`) | **U** | **—** | Development helper to restore default seed dataset. |

---

## 3. Security Audit: Unenforced Client-Side Writes & Gaps

In the current frontend-only architecture, data integrity and access control are simulated client-side. The backend team must understand the following **seven critical security vulnerabilities** present in the prototype and address them in the server layer:

### Vulnerability 1: Client-Side Identity & Role Spoofing
- **Current Behavior**: The client reads authentication status and roles from `localStorage.getItem('useme_role')` and `localStorage.getItem('useme_user_id')`.
- **Exploit**: Any user can open DevTools and execute `localStorage.setItem('useme_role', 'admin')`. Upon refreshing, the UI renders all administrative action buttons and navigation links.
- **Backend Fix**: Auth state must reside in an encrypted, server-signed HTTP cookie (`HttpOnly; Secure; SameSite=Lax`) or JWT verified via HMAC-SHA256/RSA-256. The server must never trust client-asserted roles.

### Vulnerability 2: Caller-Injected User Object in DataStore Writes
- **Current Behavior**: Write functions in `data-store-writes.js` and `data-store-team-writes.js` accept an untrusted user object:
  ```javascript
  DS.createTask = (data, u) => {
    reqAdmin('createTask', u); // Checks u?.role === 'admin'
    // ...
  };
  ```
- **Exploit**: Any script running in the console can call `window.DataStore.createTask({ title: "Hacked" }, { id: "m1", role: "admin" })` and bypass authorization.
- **Backend Fix**: Extract user context strictly from the cryptographically verified session token on `req.user`. Discard any client-submitted `user` or `role` fields in the request body.

### Vulnerability 3: Completely Unenforced Score Overwrite API
- **Current Behavior**: `DataStore.updateMemberScores(id, scores)` in `js/data-store.js` (lines 666–672) performs **zero role or ownership checks**:
  ```javascript
  updateMemberScores: (id, scores) => {
    const m = (_data.members || []).find(x => x.id === id);
    if (!m) return null;
    Object.assign(m, scores);
    persist();
    return { ...m };
  }
  ```
- **Exploit**: Any member can modify their own or any peer's `kpiScore`, `kriPenalty`, `compositeScore`, or `rank` to `#1` without authentication.
- **Backend Fix**: Remove client-facing score write endpoints entirely. Scores must only be computed by server-side business logic and background scoring workers.

### Vulnerability 4: Unauthenticated Activity Logging
- **Current Behavior**: `DataStore.logActivity(actorMemberId, actionText, ...)` in `js/data-store.js` (line 794) accepts any `actorMemberId` without verification.
- **Exploit**: Users can forge audit logs claiming administrative actions were executed by other members.
- **Backend Fix**: Bind audit log creation to the authenticated session context inside server middleware.

### Vulnerability 5: Public Reseed Function in Global Scope
- **Current Behavior**: `window.reseedDatabase()` and `window.DataStore.reseed()` are exposed globally on the `window` object without authentication.
- **Exploit**: Anyone can wipe the database and reseed default records by typing `reseedDatabase()` in the browser console.
- **Backend Fix**: Reseeding must be an authenticated administrative CLI tool or restricted behind strict development environment flags (`NODE_ENV === 'development'`).

### Vulnerability 6: Client-Side Password Hash Verification
- **Current Behavior**: `js/data-store.js` stores 64-character SHA-256 password digests in `localStorage`. The client compares `sha256(enteredPassword) === member.passwordHash`.
- **Exploit**: The password hashes are stored in plaintext in the user's browser `localStorage`, exposing all member hashes to inspection, rainbow table attacks, or XSS exfiltration.
- **Backend Fix**: Passwords must be hashed server-side using **Argon2id** or **bcrypt** ($cost \ge 12$). Hashes must never be returned in any user profile or member directory API response.

### Vulnerability 7: In-Memory Mutation via Global Data Pointers
- **Current Behavior**: The internal database is directly accessible via `window.USEME_DATA` and `window.DataStore._data`.
- **Exploit**: A user can mutate `window.USEME_DATA.tasks[0].status = 'completed'` and invoke `window.DataStore._persist()` to bypass all state machine guards.
- **Backend Fix**: All state transitions must be executed through transactional REST/RPC endpoints backed by database constraint validations.

---

## 4. Required Backend Authorization Middleware Architecture

To implement the RBAC specifications, the backend must construct three core middleware layers:

```
[ Incoming Request ]
         │
         ▼
┌─────────────────────────────────┐
│ 1. Authentication Middleware    │ ---> Validates JWT / Session Cookie
│    (authenticateToken)          │      Populates req.user = { id, role, department }
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 2. Role Verification Middleware │ ---> Asserts req.user.role === requiredRole
│    (requireAdmin / requireAuth) │      Returns 403 Forbidden on mismatch
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 3. Resource Ownership Guard     │ ---> Asserts user has authority over target resource
│    (assertResourceOwnership)    │      (e.g., isAssignedToTask, isSelf)
└─────────────────────────────────┘
         │
         ▼
[ Controller Business Logic ]
```

### Middleware Specifications

#### 1. `authenticateToken(req, res, next)`
- Reads session cookie or `Authorization: Bearer <token>` header.
- Rejects missing or expired tokens with HTTP `401 Unauthorized`.
- Queries Redis/Database to verify the member is active (`isActive === true`).
- Binds verified member entity to `req.user`.

#### 2. `requireAdmin(req, res, next)`
- Inspects `req.user.role`.
- If `req.user.role !== 'admin'`, logs unauthorized attempt and terminates request:
  ```json
  {
    "error": "Forbidden",
    "message": "Administrative privileges are required to perform this action.",
    "statusCode": 403
  }
  ```

#### 3. `assertTaskAssigneeOrAdmin(req, res, next)`
- Fetches task by `req.params.id`.
- If `req.user.role === 'admin'`, proceeds.
- If `req.user.role === 'member'`:
  - Verifies `task.assignedTo.includes(req.user.id)`.
  - If false, rejects with HTTP `403 Forbidden` (`"You are not assigned to this task"`).
