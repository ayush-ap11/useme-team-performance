# Useme Team Platform — Technical Documentation: Known Limitations & Frontend Assumptions

This document explicitly details all prototype simplifications, client-side assumptions, and architectural boundaries in the current frontend-only build. The backend engineering team must address each item when designing the production system.

---

## 1. Storage & Persistence Boundaries

### 1.1 In-Memory & `localStorage` Isolation
- **Current Behavior**: The entire platform state (180 members, 1,250 tasks, 650 submissions, 100 projects, 120 events, 65 Zoom sessions, KRA scores, and audit logs) is maintained as a single monolithic in-memory JavaScript object (`window.USEME_DATA`), serialized to browser `localStorage` under the key `useme_data_store`.
- **Limitation**: 
  - **No Multi-User Concurrency**: Data is strictly sandboxed to the local browser profile. Edits made by User A on one computer are completely invisible to User B on another computer.
  - **Single Tab Discrepancies**: If a user opens two browser tabs, state mutations in Tab 1 do not reactively propagate to Tab 2 unless an explicit `storage` event listener is wired.
  - **Browser Quota Ceiling**: Modern browser `localStorage` is capped at approximately 5MB per origin. The initial seed output consumes ~2.7MB. High-volume usage will trigger `DOMException: QUOTA_EXCEEDED_ERR`.
  - **Data Volatility**: Clearing browser history, cookies, or opening an Incognito session completely erases all created tasks, logged activities, and password updates, resetting the app to default seed state.
- **Backend Mandate**: Replace `localStorage` with a persistent PostgreSQL database. Wrap state mutations in ACID transactions. Implement optimistic locking (`version` field) on deliverables and project entities to prevent lost updates.

---

## 2. Authentication & Identity Boundaries

### 2.1 Absence of Cryptographic Session Tokens
- **Current Behavior**: Login success sets three plaintext strings in `localStorage`:
  - `useme_logged_in = "true"`
  - `useme_role = "admin"` (or `"member"`)
  - `useme_user_id = "m1"` (or `"m5"`)
- **Limitation**:
  - No cryptographic signature (HMAC-SHA256, RSA) validates the token.
  - No token expiration or sliding window renewal exists.
  - A user can elevate their privileges to `admin` or impersonate any member simply by executing `localStorage.setItem('useme_role', 'admin')` in the DevTools console.
- **Backend Mandate**: Implement standard OAuth2 / JWT or stateful session tokens stored in `HttpOnly; Secure; SameSite=Lax` cookies. Authenticate and authorize every API call via server-side middleware.

### 2.2 Client-Side SHA-256 Hashing & Demo Credentials
- **Current Behavior**: Passwords are verified on the client by comparing `sha256(enteredPassword) === member.passwordHash`.
- **Limitation**:
  - SHA-256 without salt or key derivation (PBKDF2, Argon2) is completely inadequate for password storage. It is trivial to reverse via rainbow tables or brute-force dictionary attacks.
  - Password hashes are stored in the local `localStorage` dump, exposing the entire team's hashes to local inspection or cross-site scripting (XSS).
  - All 180 seed accounts use well-known default passwords:
    - `aditya.sharma` (`m1`): `Useme@Admin1`
    - `rahul.sen` (`m5`): `Useme@Member1`
    - `priya.iyer` (`m3`): `Useme@Member2`
    - `vikram.mehta` (`m7`): `Useme@Member3`
    - All remaining members (`m2`, `m4`, `m6`, `m8`–`m180`): `Useme@2026`
- **Backend Mandate**: Passwords must be sent over TLS to the server and hashed using **Argon2id** or **bcrypt** ($cost \ge 12$). Password hashes must **never** be included in API responses or client-side storage.

---

## 3. Zoom Video & Attendance Integration Boundaries

### 3.1 Simulated Self-Capture via Click Timestamp
- **Current Behavior**: When a member clicks the "Join" button on a live Zoom session, the client performs two actions:
  1. Opens the meeting URL in a new browser tab via `window.open(zoomUrl, '_blank')`.
  2. Compares the client system clock (`new Date().toISOString()`) against the scheduled start time to classify the user as `present` ($\le 5$ min), `late` ($\le 15$ min), or `absent` ($> 15$ min), recording a `pendingCheckIns` entry.
- **Limitation**:
  - **Clock Skew Vulnerability**: The classification relies entirely on the local client machine's clock. A user with an inaccurate system clock or who manually alters their computer time can manipulate attendance classification.
  - **Zero Dwell-Time Verification**: The system only records the intent to join. A member can click "Join", close the Zoom window immediately without participating in the meeting, and still receive full attendance credit once confirmed by an admin.
  - **No Real Zoom API Connection**: The application does not connect to Zoom APIs or Webhooks. It does not verify whether the meeting actually occurred, whether the Zoom room was open, or whether the user logged in with their corporate email.
- **Backend Mandate**:
  - Implement a dedicated Zoom Server-to-Server OAuth integration.
  - Ingest live **Zoom Webhooks**:
    - `meeting.participant_joined`: Records true join timestamp directly from Zoom servers.
    - `meeting.participant_left`: Calculates total duration and dwell time.
    - `meeting.ended`: Reconciles final attendance statuses based on active minutes spent in call ($> 75\%$ duration = present).

---

## 4. Scoring Engine & Computation Boundaries

### 4.1 Synchronous Client-Side Evaluation
- **Current Behavior**: The scoring engine (`scoring-engine.js`, `kpi-engine.js`) recalculates KRA pillar attainment, submission quality scores, KRI penalties, engagement points, and overall composite scores synchronously on the client UI thread whenever a page loads or status changes.
- **Limitation**:
  - **UI Thread Blocking**: Recalculating scores across 180 members with 1,250 tasks involves traversing multiple object graphs, causing frame drops and input lag on lower-end mobile devices.
  - **Inconsistent Point-in-Time Telemetry**: Different users viewing the app at the same moment may observe disparate score rankings if client-side filters or cached state differ.
- **Backend Mandate**:
  - Port the scoring formulas to a server-side scoring worker service.
  - Compute scores asynchronously upon database trigger events (e.g., when a submission is approved or task status changes).
  - Materialize computed scores and rankings into a `member_performance_snapshots` table for instantaneous read queries.

---

## 5. Media Assets & File Storage Boundaries

### 5.1 Metadata-Only / Data URL Asset Mocking
- **Current Behavior**: When uploading deliverables or proofs, the application accepts a string URL or creates a mock asset object storing filename, file type, and fake size text (e.g. `"24 KB"`). If a local file is picked, it is either referenced by name or converted to a base64 data URL.
- **Limitation**:
  - No binary file storage or CDN delivery exists.
  - Storing large base64 images/videos inside `localStorage` rapidly causes storage exhaustion.
  - No MIME-type validation, file extension verification, or anti-virus scanning is performed.
- **Backend Mandate**:
  - Implement an Amazon S3 / Google Cloud Storage integration.
  - Provide a presigned upload endpoint (`POST /api/v1/assets/presign-upload`).
  - Enforce server-side MIME-type inspection, maximum file size limits (e.g., 50MB for videos, 10MB for PDFs), and anti-malware scanning before assets are linked to tasks.

---

## 6. Business Logic & Concurrency Boundaries

### 6.1 Unenforced Concurrency & Race Conditions
- **Current Behavior**: State modifications overwrite the entire `useme_data_store` JSON object.
- **Limitation**: In a production environment with multiple administrators reviewing deliverables simultaneously, concurrent writes without database-level row locking would cause catastrophic data loss (last write wins).
- **Backend Mandate**: Use PostgreSQL transactional isolation levels (`READ COMMITTED` or `REPEATABLE READ`) and row-level locks (`SELECT FOR UPDATE`) during submission approvals and member offboarding.

### 6.2 Manual Cascading Deletion Checks
- **Current Behavior**: Business rules (e.g., blocking project deletion if active tasks are linked, or checking venue conflicts) are implemented using manual JavaScript `Array.prototype.filter` loops.
- **Limitation**: Prone to orphaned records if an unhandled JavaScript exception interrupts execution.
- **Backend Mandate**: Implement relational foreign key constraints with `ON DELETE RESTRICT` for referential integrity, and database-level unique constraints across `(venue, eventDate)` and `(memberId, cycleId, pillarId)`.
