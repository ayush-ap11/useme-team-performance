# Useme Team Platform — Technical Documentation: Proposed Backend API Contracts

This document defines the RESTful HTTP API specifications required to replace the client-side `localStorage` data layer with a robust backend service.

All endpoints adhere to JSON payloads, standard HTTP status codes, and strict role-based access control.

---

## 1. Global API Standards

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json` (except multipart file uploads)
- **Standard Error Response Format**:
  ```json
  {
    "error": "ErrorCategory",
    "message": "Human-readable explanation of error.",
    "statusCode": 400,
    "details": []
  }
  ```
- **Standard HTTP Status Codes**:
  - `200 OK`: Successful query or update.
  - `201 Created`: Resource successfully created.
  - `204 No Content`: Successful deletion.
  - `400 Bad Request`: Payload validation failed.
  - `401 Unauthorized`: Missing or invalid session token.
  - `403 Forbidden`: Authenticated user lacks required role/ownership.
  - `404 Not Found`: Resource does not exist.
  - `409 Conflict`: Business constraint violation (e.g. duplicate username, venue collision, active tasks blocking deletion).

---

## 2. Authentication & Identity (`/api/v1/auth`)

### 2.1 User Login
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Auth Required**: Public
- **Request Body**:
  ```json
  {
    "identifier": "rahul.sen",
    "password": "Useme@Member1",
    "requestedRole": "member"
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "m5",
      "name": "Rahul Sen",
      "username": "rahul.sen",
      "email": "rahul@useme.in",
      "role": "member",
      "department": "Engineering",
      "avatar": "RS"
    }
  }
  ```
- **Cookies Set**: `useme_session=<jwt_token>; HttpOnly; Secure; SameSite=Lax; Path=/`

### 2.2 User Logout
- **Method**: `POST`
- **Path**: `/api/v1/auth/logout`
- **Auth Required**: Any Authenticated User
- **Response Body (`200 OK`)**:
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

### 2.3 Get Current Authenticated Session
- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Auth Required**: Any Authenticated User
- **Response Body (`200 OK`)**:
  ```json
  {
    "user": {
      "id": "m5",
      "name": "Rahul Sen",
      "username": "rahul.sen",
      "email": "rahul@useme.in",
      "role": "member",
      "department": "Engineering",
      "avatar": "RS",
      "band": "L5 - Senior Staff",
      "location": "Bangalore, IN"
    }
  }
  ```

### 2.4 Public Self-Registration
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Auth Required**: Public
- **Request Body**:
  ```json
  {
    "name": "Kavita Rao",
    "username": "kavita.rao",
    "email": "kavita.rao@useme.in",
    "password": "Useme@2026",
    "phone": "+91 98765 43210",
    "location": "Bangalore, IN"
  }
  ```
- **Response Body (`201 Created`)**:
  ```json
  {
    "id": "m-unassigned-1",
    "name": "Kavita Rao",
    "username": "kavita.rao",
    "email": "kavita.rao@useme.in",
    "role": "Unassigned",
    "department": "Unassigned",
    "isUnassigned": true
  }
  ```

---

## 3. Members & Hierarchy (`/api/v1/members`, `/api/v1/departments`)

### 3.1 List Members
- **Method**: `GET`
- **Path**: `/api/v1/members`
- **Auth Required**: Any Authenticated User
- **Query Parameters**:
  - `department` (optional): Filter by department name.
  - `role` (optional): Filter by role string.
  - `skillCategory` (optional): Filter by primary skill category.
  - `includeInactive` (optional, boolean): Defaults to `false`. Admin only.
  - `unassigned` (optional, boolean): Filter `isUnassigned === true`.
- **Response Body (`200 OK`)**:
  ```json
  {
    "members": [
      {
        "id": "m1",
        "name": "Aditya Sharma",
        "username": "aditya.sharma",
        "email": "aditya@useme.in",
        "role": "Director / Operations Head",
        "department": "Executive",
        "reportsTo": null,
        "avatar": "AS",
        "compositeScore": 94.0,
        "rank": "#1",
        "isActive": true
      }
    ],
    "total": 180
  }
  ```

### 3.2 Get Member Detail
- **Method**: `GET`
- **Path**: `/api/v1/members/:id`
- **Auth Required**: Any Authenticated User
- **Response Body (`200 OK`)**: Full `Member` object.

### 3.3 Administrative Member Onboarding
- **Method**: `POST`
- **Path**: `/api/v1/members`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "name": "Siddharth Nambiar",
    "username": "siddharth.nambiar",
    "email": "siddharth@useme.in",
    "initialPassword": "Useme@2026",
    "phone": "+91 98765 11223",
    "role": "Frontend Specialist",
    "department": "Engineering",
    "reportsTo": "m5",
    "band": "L4 - Specialist",
    "location": "Bangalore, IN",
    "startDate": "2026-09-01",
    "skillCategory": "dev",
    "proficiency": "Intermediate"
  }
  ```
- **Response Body (`201 Created`)**: Created `Member` object.

### 3.4 Assign Unassigned Member to Hierarchy
- **Method**: `PATCH`
- **Path**: `/api/v1/members/:id/assign`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "role": "Junior Frontend Developer",
    "department": "Engineering",
    "reportsTo": "m5",
    "band": "L3 - Specialist",
    "location": "Bangalore, IN",
    "startDate": "2026-09-18",
    "skillCategory": "dev",
    "proficiency": "Beginner"
  }
  ```
- **Response Body (`200 OK`)**: Updated `Member` object.

### 3.5 Update Member Profile & Hierarchy Details
- **Method**: `PATCH`
- **Path**: `/api/v1/members/:id`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "name": "Rahul Sen",
    "role": "Principal Staff Engineer",
    "department": "Engineering",
    "reportsTo": "m2",
    "band": "L6 - Principal Lead",
    "phone": "+91 98765 43210",
    "location": "Bangalore, IN"
  }
  ```
- **Response Body (`200 OK`)**: Updated `Member` object.

### 3.6 Offboard Member
- **Method**: `POST`
- **Path**: `/api/v1/members/:id/offboard`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "reassignReportsTo": "m2"
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "offboardedMemberId": "m5",
    "reassignedCount": 3
  }
  ```

### 3.7 Self-Service Password Update
- **Method**: `POST`
- **Path**: `/api/v1/members/:id/password`
- **Auth Required**: `Self Only` (`req.user.id === req.params.id`)
- **Request Body**:
  ```json
  {
    "oldPassword": "Useme@Member1",
    "newPassword": "NewSecurePassword#2026"
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  { "success": true, "message": "Password changed successfully" }
  ```

### 3.8 Administrative Password Reset
- **Method**: `POST`
- **Path**: `/api/v1/members/:id/reset-password`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "newPassword": "TemporaryPassword#2026"
  }
  ```
- **Response Body (`200 OK`)**:
  ```json
  { "success": true, "message": "Password reset successfully for member" }
  ```

### 3.9 Department CRUD
- `GET /api/v1/departments`: List all departments sorted by order (Public/Auth).
- `POST /api/v1/departments`: Create department (`admin` Only). Body: `{ "name": "Security", "colorHex": "#E11D48", "order": 8 }`.
- `PATCH /api/v1/departments/:id`: Update department (`admin` Only). Body: `{ "name": "InfoSec", "colorHex": "#BE123C" }`.
- `DELETE /api/v1/departments/:id`: Delete department (`admin` Only). Blocked if active members are assigned (`409 Conflict`).

---

## 4. Skills & Proficiencies (`/api/v1/skills`)

### 4.1 List Categories & Headcounts
- **Method**: `GET`
- **Path**: `/api/v1/skills/categories`
- **Auth Required**: Any Authenticated User
- **Response Body (`200 OK`)**: Array of `SkillCategory` with active `count`.

### 4.2 Category CRUD
- `POST /api/v1/skills/categories`: Create category (`admin` Only). Body: `{ "name": "AI / ML", "description": "LLMs and vision" }`.
- `PATCH /api/v1/skills/categories/:id`: Update category (`admin` Only).
- `DELETE /api/v1/skills/categories/:id`: Delete category (`admin` Only). Blocked if members hold proficiency records.

### 4.3 Update Member Proficiency
- **Method**: `PUT`
- **Path**: `/api/v1/skills/proficiencies`
- **Auth Required**: Any Authenticated User
- **Request Body**:
  ```json
  {
    "memberId": "m5",
    "categoryId": "dev",
    "level": "Expert"
  }
  ```
- **Rules**:
  - If `req.user.role === 'member'`: `memberId` must equal `req.user.id`; records `verified: false`.
  - If `req.user.role === 'admin'`: Can update any member; records `verified: true`.
- **Response Body (`200 OK`)**: Updated `SkillProficiency` object.

---

## 5. Tasks & Deliverables (`/api/v1/tasks`)

### 5.1 List Tasks
- **Method**: `GET`
- **Path**: `/api/v1/tasks`
- **Auth Required**: Any Authenticated User
- **Query Parameters**:
  - `status` (optional): `notStarted`, `inProgress`, `testing`, `awaitingFeedback`, `reworkNeeded`, `completed`.
  - `assigneeId` (optional): Filter by assigned member ID.
  - `projectId` (optional): Filter by project ID.
  - `linkedSkill` (optional): Filter by skill category.
  - `limit`, `offset` (optional, integers): Pagination parameters.
- **Rules**: If `req.user.role === 'member'`, query automatically appends `assigneeId = req.user.id`.
- **Response Body (`200 OK`)**:
  ```json
  {
    "tasks": [
      {
        "id": "t1",
        "title": "PostgreSQL Query Plan Optimization & PgBouncer Tuning",
        "assignedTo": ["m5", "m7"],
        "status": "inProgress",
        "dueDate": "2026-09-02",
        "linkedSkill": "dev",
        "linkedProject": "V2 Analytics & Platform Core",
        "qualityScore": 8.8
      }
    ],
    "total": 1250
  }
  ```

### 5.2 Create Task
- **Method**: `POST`
- **Path**: `/api/v1/tasks`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "title": "Build Redis PubSub Notification Hub",
    "description": "Implement low-latency telemetry worker.",
    "assignedTo": ["m5"],
    "linkedSkill": "dev",
    "projectId": "p1",
    "dueDate": "2026-09-10",
    "resources": ["WebSocket RFC", "PubSub Blueprint"]
  }
  ```
- **Response Body (`201 Created`)**: Created `Task` object.

### 5.3 Update Task Metadata
- **Method**: `PATCH`
- **Path**: `/api/v1/tasks/:id`
- **Auth Required**: `admin` Only
- **Request Body**: Subset of task fields (`title`, `description`, `assignedTo`, `dueDate`, `projectId`, `linkedSkill`).
- **Response Body (`200 OK`)**: Updated `Task` object.

### 5.4 Update Task Status FSM
- **Method**: `PATCH`
- **Path**: `/api/v1/tasks/:id/status`
- **Auth Required**: Assigned Member or `admin`
- **Request Body**:
  ```json
  {
    "status": "testing"
  }
  ```
- **Rules**:
  - If `member`: Must be in `task.assignedTo`. Allowed transitions: `inProgress` $\to$ `testing` $\to$ `awaitingFeedback`. **Cannot set `completed`.**
  - If `admin`: Can set any status.
- **Response Body (`200 OK`)**: Updated `Task` object.

### 5.5 Submit Task Deliverable for Review
- **Method**: `POST`
- **Path**: `/api/v1/tasks/:id/submit`
- **Auth Required**: Assigned Member Only
- **Request Body**:
  ```json
  {
    "asset": {
      "name": "benchmarks_v2.sql",
      "type": "document",
      "url": "https://s3.amazonaws.com/useme-deliverables/benchmarks_v2.sql",
      "sizeText": "24 KB"
    }
  }
  ```
- **Side Effects**:
  - Appends asset to `task.assets`.
  - Sets `task.status = 'awaitingFeedback'` and `task.submittedForReview = true`.
  - Records status history entry with timestamp.
  - Generates `submissions` queue entry.
- **Response Body (`200 OK`)**: Updated `Task` object.

### 5.6 Delete Task
- **Method**: `DELETE`
- **Path**: `/api/v1/tasks/:id`
- **Auth Required**: `admin` Only
- **Rules**: Rejects with `409 Conflict` if `task.submittedForReview === true` or `task.status === 'awaitingFeedback'`. Soft-archives if assets or history exist.
- **Response Body (`204 No Content`)**.

---

## 6. Submissions Review Queue (`/api/v1/submissions`)

### 6.1 List Submissions
- **Method**: `GET`
- **Path**: `/api/v1/submissions`
- **Auth Required**: Any Authenticated User
- **Query Parameters**:
  - `queue`: `pending` (`status === 'awaitingFeedback'`), `approved` (`status === 'completed'`), `needsRework` (`status === 'reworkNeeded'`).
- **Rules**: Non-admins only receive submissions authored by themselves.
- **Response Body (`200 OK`)**: Array of `Submission` objects.

### 6.2 Approve Submission
- **Method**: `POST`
- **Path**: `/api/v1/submissions/:id/approve`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "qualityRating": 4.8
  }
  ```
- **Side Effects**:
  - Sets linked `Task.status = 'completed'`, `submittedForReview = false`.
  - Triggers asynchronous score recalculation for task assignees.
- **Response Body (`200 OK`)**: Approved `Submission` object.

### 6.3 Request Rework on Submission
- **Method**: `POST`
- **Path**: `/api/v1/submissions/:id/rework`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "reworkNotes": "Missing boundary test cases for Redis sliding-window counter."
  }
  ```
- **Side Effects**:
  - Sets linked `Task.status = 'reworkNeeded'`, `submittedForReview = false`.
  - Stores `reworkNotes` on both task and submission.
  - Triggers score recalculation.
- **Response Body (`200 OK`)**: Updated `Submission` object.

---

## 7. Projects & Events (`/api/v1/projects`, `/api/v1/events`)

### 7.1 Projects CRUD
- `GET /api/v1/projects`: List projects with computed progress (Any Authenticated).
- `POST /api/v1/projects`: Create project (`admin` Only). Body: `{ "name", "description", "startDate", "targetDate", "memberIds" }`.
- `PATCH /api/v1/projects/:id`: Update project (`admin` Only).
- `DELETE /api/v1/projects/:id`: Delete project (`admin` Only). Rejects (`409 Conflict`) if active incomplete tasks are linked.

### 7.2 Events CRUD & Conflict Detection
- `GET /api/v1/events`: List events with crew assignments (Any Authenticated).
- `POST /api/v1/events`: Create event (`admin` Only). Body: `{ "name", "venue", "eventDate", "members": [{ "memberId", "roleAtEvent" }] }`.
- `PATCH /api/v1/events/:id`: Update event (`admin` Only).
- `DELETE /api/v1/events/:id`: Delete event (`admin` Only). Rejects (`409 Conflict`) if linked prep tasks are incomplete.
- `GET /api/v1/events/check-conflict`:
  - **Query**: `venue=Grand+Horizon&date=2026-09-15&excludeId=e1`
  - **Response (`200 OK`)**: `{ "conflict": true, "conflictingEvent": { "id": "e3", "name": "Regional Tech Expo" } }`.

---

## 8. Review Cycles & KRA Performance (`/api/v1/cycles`, `/api/v1/kra`)

### 8.1 Review Cycles CRUD
- `GET /api/v1/cycles`: List all review cycles (Any Authenticated).
- `POST /api/v1/cycles`: Create cycle (`admin` Only). Body: `{ "label": "Sep 2026", "startDate": "2026-09-01", "endDate": "2026-09-30", "isCurrent": false }`.
- `PATCH /api/v1/cycles/:id`: Update cycle dates / label (`admin` Only).
- `POST /api/v1/cycles/:id/set-current`: Atomically sets target cycle `isCurrent: true` and all others `false` (`admin` Only).
- `DELETE /api/v1/cycles/:id`: Delete cycle (`admin` Only). Blocked if active tasks/submissions reference it.

### 8.2 KRA Strategic Pillars
- `GET /api/v1/kra/pillars`: List 5 strategic pillars with weights (Any Authenticated).
- `POST /api/v1/kra/pillars`: Create pillar (`admin` Only). Validates sum of all pillar weights **equals 100%**.
- `PATCH /api/v1/kra/pillars/:id`: Update pillar weight/description (`admin` Only). Validates sum equals 100%.
- `DELETE /api/v1/kra/pillars/:id`: Delete pillar (`admin` Only). Blocked if scores exist.
- `POST /api/v1/kra/pillars/reorder`: Reorder pillar display index (`admin` Only). Body: `{ "orderedIds": ["pillar-growth", ...] }`.

### 8.3 KRA Per-Member Scores
- `GET /api/v1/kra/scores`: List evaluated pillar scores. Query: `memberId`, `cycleId` (Any Authenticated).
- `POST /api/v1/kra/scores`: Enter or update member pillar score (`admin` Only).
  - **Request Body**:
    ```json
    {
      "memberId": "m5",
      "cycleId": "cycle-aug-2026",
      "pillarId": "pillar-growth",
      "score": 92.5,
      "notes": "Delivered 14 major microservices PRs."
    }
    ```
  - **Response (`200 OK`)**: Saved `KraScore` object.

---

## 9. Engagement, Motivation & Zoom Syncs (`/api/v1/engagement`, `/api/v1/zoom`)

### 9.1 Activity Type Catalog
- `GET /api/v1/activity-types`: List outreach and motivation activity types (Any Authenticated).
- `POST /api/v1/activity-types`: Create type (`admin` Only). Body: `{ "label", "category": "outreach" | "motivation", "pointValue": 4, "requiresProof": true }`.
- `PATCH /api/v1/activity-types/:id`: Update point values / rules (`admin` Only).
- `DELETE /api/v1/activity-types/:id`: Delete type (`admin` Only). Blocked if submissions reference it.

### 9.2 Log Outreach Activity
- **Method**: `POST`
- **Path**: `/api/v1/engagement/submissions`
- **Auth Required**: `member` Only (`req.user.role === 'member'`)
- **Request Body**:
  ```json
  {
    "type": "onGround",
    "title": "Bangalore Tech Summit Booth Demo",
    "date": "2026-08-25",
    "proofType": "url",
    "proofValue": "https://youtu.be/demo-booth-bts"
  }
  ```
- **Rules**: Server forces `memberId = req.user.id`, sets `status = 'pending'`.
- **Response (`201 Created`)**: Created `EngagementSubmission` object.

### 9.3 Log Motivation Activity (Talks / Micro-Events)
- **Method**: `POST`
- **Path**: `/api/v1/motivation/submissions`
- **Auth Required**: `member` Only
- **Request Body**:
  ```json
  {
    "type": "groupTalk",
    "title": "Zero-Downtime PostgreSQL Schema Migrations",
    "date": "2026-08-18",
    "proofType": "url",
    "proofValue": "https://youtu.be/postgres-migrations"
  }
  ```
- **Response (`201 Created`)**: Created `MotivationSubmission` object.

### 9.4 Review Engagement / Motivation Submissions
- **Method**: `PATCH`
- **Path**: `/api/v1/engagement/submissions/:id/status` (and `/motivation/submissions/:id/status`)
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "status": "approved"
  }
  ```
- **Side Effects**: Accrues attainment points; recalculates member composite score.
- **Response (`200 OK`)**: Updated submission object.

### 9.5 Zoom Sessions CRUD
- `GET /api/v1/zoom/sessions`: List sessions with attendance records (Any Authenticated).
- `POST /api/v1/zoom/sessions`: Create session (`admin` Only). Body: `{ "title", "date", "time", "zoomUrl" }`.
- `PATCH /api/v1/zoom/sessions/:id`: Update session details (`admin` Only).
- `DELETE /api/v1/zoom/sessions/:id`: Delete session (`admin` Only).

### 9.6 Zoom Self-Capture Check-In
- **Method**: `POST`
- **Path**: `/api/v1/zoom/sessions/:id/checkin`
- **Auth Required**: Any Authenticated User
- **Request Body**:
  ```json
  {
    "clientTimestamp": "2026-08-25T10:02:14.000Z"
  }
  ```
- **Logic**: Evaluates server timestamp vs `scheduledStart`. Assigns `present` ($\le 5$ min), `late` ($\le 15$ min), or `absent` ($> 15$ min). Flags record as `pending: true` awaiting admin confirmation. Returns `zoomUrl` for redirect.
- **Response (`200 OK`)**:
  ```json
  {
    "suggestedStatus": "present",
    "capturedAt": "2026-08-25T10:02:14.000Z",
    "zoomUrl": "https://zoom.us/j/84920193842?pwd=UsemeTeamLiveSync"
  }
  ```

### 9.7 Admin Override Zoom Attendance
- **Method**: `POST`
- **Path**: `/api/v1/zoom/sessions/:id/attendance`
- **Auth Required**: `admin` Only
- **Request Body**:
  ```json
  {
    "memberId": "m5",
    "status": "present"
  }
  ```
- **Side Effects**: Sets `source = 'admin-override'`; sets `pending = false`; recalculates streak.
- **Response (`200 OK`)**: Updated session object.

### 9.8 Target Groups & Overrides CRUD
- `GET /api/v1/targets/groups`: List cohort target groups (Any Authenticated).
- `POST /api/v1/targets/groups`: Create/update target group (`admin` Only). Body: `{ "id", "name", "targetPoints": 45, "memberIds": ["m5", "m6"] }`.
- `DELETE /api/v1/targets/groups/:id`: Delete target group (`admin` Only).
- `PUT /api/v1/targets/overrides/:memberId`: Set personal target override (`admin` Only). Body: `{ "engagement": 50, "motivation": 45 }`.

---

## 10. Operational Insights, Reports & Search (`/api/v1/insights`, `/api/v1/reports`, `/api/v1/search`)

### 10.1 Automated Performance Insights
- **Method**: `GET`
- **Path**: `/api/v1/insights`
- **Auth Required**: `admin` Only
- **Response (`200 OK`)**:
  ```json
  {
    "lastAnalyzed": "2026-08-25T12:00:00.000Z",
    "insights": [
      {
        "type": "Stuck Task",
        "severity": "high",
        "headline": "Stalled Deliverable: Marketing Sprint Ad Creatives",
        "explanation": "In 'reworkNeeded' status for 7 days without milestone progress.",
        "actionTarget": { "entity": "task", "id": "t4" }
      }
    ]
  }
  ```

### 10.2 Executive Reports Summary & Charts
- **Method**: `GET`
- **Path**: `/api/v1/reports/metrics`
- **Auth Required**: `admin` Only
- **Query Parameters**: `period=week|month|quarter|all`
- **Response (`200 OK`)**:
  ```json
  {
    "completed": 48,
    "avgScore": 84.2,
    "overdue": 3,
    "reworkRate": "6.2%",
    "skillGaps": [
      { "skill": "CA / Finance", "gapLevel": "High (1 lead, 2 rework)", "status": "Immediate Review" }
    ],
    "chartData": {
      "completedPerWeek": [{ "label": "Week 1", "count": 12 }],
      "reworkTrend": [{ "label": "Week 1", "rate": 8 }]
    }
  }
  ```

### 10.3 Executive Report CSV Export
- **Method**: `GET`
- **Path**: `/api/v1/reports/export`
- **Auth Required**: `admin` Only
- **Query Parameters**: `period=month`
- **Response Headers**:
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename="useme-team-report-month.csv"`
- **Response (`200 OK`)**: Streamed CSV binary payload.

### 10.4 Consolidated Asset Deletion
- **Method**: `DELETE`
- **Path**: `/api/v1/resources/:type/:id`
- **Auth Required**: `admin` Only
- **Parameters**: `type = task | engagement | motivation | project`, `id = target asset identifier`.
- **Response (`204 No Content`)**.

### 10.5 Global Command Palette Search
- **Method**: `GET`
- **Path**: `/api/v1/search`
- **Auth Required**: Any Authenticated User
- **Query Parameters**: `q=database`
- **Response (`200 OK`)**:
  ```json
  {
    "results": [
      { "category": "Tasks", "title": "Zero-Downtime Database Failover", "id": "t16", "url": "tasks.html?id=t16" },
      { "category": "Projects", "title": "Zero-Downtime Database Migration Pipeline", "id": "p9", "url": "projects.html?id=p9" }
    ]
  }
  ```
