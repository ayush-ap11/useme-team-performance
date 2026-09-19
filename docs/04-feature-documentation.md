# Useme Team Platform — Technical Documentation: Feature Specifications & Business Logic

This document details the functional specifications, input parameters, business logic, mathematical formulas, and presentation layer outputs for all fifteen features of the Useme Team platform.

---

## Table of Features
1. [Executive & Member Dashboard](#1-executive--member-dashboard)
2. [Team Hierarchy & Organization Visualizer](#2-team-hierarchy--organization-visualizer)
3. [Skill Mapping & Competency Matrix](#3-skill-mapping--competency-matrix)
4. [Tasks Management & Deliverable Lifecycle](#4-tasks-management--deliverable-lifecycle)
5. [Submissions Review Queue](#5-submissions-review-queue)
6. [Projects & Strategic Programs](#6-projects--strategic-programs)
7. [Events & Venue Coordination](#7-events--venue-coordination)
8. [Ranking & Performance Leaderboard](#8-ranking--performance-leaderboard)
9. [Automated Performance Insights](#9-automated-performance-insights)
10. [KRA & KPI Performance Appraisal](#10-kra--kpi-performance-appraisal)
11. [Engagement, Motivation & Zoom Syncs](#11-engagement-motivation--zoom-syncs)
12. [Resources & Asset Hub](#12-resources--asset-hub)
13. [Executive Reports & Export Engine](#13-executive-reports--export-engine)
14. [Global Search & Command Palette](#14-global-search--command-palette)
15. [Authentication, Profile & Password Management](#15-authentication-profile--password-management)

---

## 1. Executive & Member Dashboard

### 1.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Serves as the primary operational command center. For Administrators, it delivers high-level operational metrics, review bottlenecks, and organization-wide activity tickers. For Team Members, it delivers a personalized daily checklist, personal performance rankings, active deliverables, and live video sync banners.

### 1.2 User Inputs & Action Triggers
- **Review Cycle Selector**: Dropdown to filter metrics by historical or active review cycle (`Aug 2026`, etc.).
- **Quick Action Buttons (Admin Only)**: Triggers creation modals for New Task, New Project, Add Team Member, and Export Report.
- **One-Click Deliverable Action (Member Only)**: Member triggers direct status advance or deliverable upload from the dashboard task list.

### 1.3 Processing Logic & Authoritative Formulas
The dashboard aggregates real-time performance indicators using the centralized scoring engine:

```javascript
// Overall Score Formula (Authoritative Single Source)
const OVERALL_WEIGHTS = { KRA: 0.40, ENGAGEMENT: 0.20, MOTIVATION: 0.20, QUALITY: 0.20 };

function getOverallScore(memberId, cycle) {
  const kra = getKRAScore(memberId, cycle).overall;
  const eng = getEngagementScore(memberId, cycle);
  const mot = getMotivationScore(memberId, cycle);
  const quality = getSubmissionQualityScore(memberId, cycle);
  const penalty = getKRIPenalty(memberId, cycle);
  
  const raw = (kra * OVERALL_WEIGHTS.KRA) +
              (eng * OVERALL_WEIGHTS.ENGAGEMENT) +
              (mot * OVERALL_WEIGHTS.MOTIVATION) +
              (quality * OVERALL_WEIGHTS.QUALITY) - penalty;
              
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}
```

```javascript
// Organization Attainment Donut Calculation
function calculateOrgAttainment(members, cycle) {
  if (!members || members.length === 0) return 85.0;
  const total = members.reduce((sum, m) => sum + getOverallScore(m.id, cycle), 0);
  return Math.round((total / members.length) * 10) / 10;
}
```

### 1.4 Output & Presentation
- **Admin View**:
  - Stat Cards: Total Active Members, Team Attainment Donut (SVG circular progress), Active Projects, Outstanding Review Queue count.
  - Quick Action Tiles: Instant creation shortcuts.
  - Review Queue Strip: Deliverables awaiting approval.
  - Live Activity Feed: Last 10-20 actions with timestamps.
- **Member View**:
  - My Scores: Composite Score, Current Rank badge, Active Tasks count, Approved Activities count.
  - Live Zoom Call Banner: Displays active meeting link with immediate "Join Call" button.
  - My Tasks Widget: Focused list of personal tasks with due dates and status badges.

### 1.5 Relevant Source Files
- Markup: [`dashboard.html`](useme-team-performance/dashboard.html)
- Controller: [`js/dashboard-home.js`](useme-team-performance/js/dashboard-home.js)
- Styling: [`css/dashboard.css`](useme-team-performance/css/dashboard.css), [`css/command-palette.css`](useme-team-performance/css/command-palette.css)

---

## 2. Team Hierarchy & Organization Visualizer

### 2.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Interactive, multi-column (Miller columns) organizational hierarchy browser that models executive-to-specialist reporting lines, direct report distributions, department management, and workforce onboarding/offboarding.

### 2.2 User Inputs & Action Triggers
- **Card Navigation**: Click an employee card to expand direct reports in the adjacent column; click avatar/badge to collapse.
- **Onboard Member (Admin Only)**: Form inputs: Full Name, Username, Corporate Email, Initial Temporary Password (min 4 chars), Role, Department, Reports To, Band, Location, Start Date, Primary Skill Category, Initial Proficiency.
- **Assign Unassigned Member (Admin Only)**: Click member in "Unassigned Shelf"; specify department, manager, and role.
- **Edit Member (Admin Only)**: Modify department, manager, band, location, phone.
- **Offboard Member (Admin Only)**: Mandatory dropdown to select a new manager to inherit active direct reports.
- **Department CRUD (Admin Only)**: Manage department names, color hex codes, and display ordering.

### 2.3 Processing Logic & Validation Rules
```javascript
// Circular Loop Reporting Validation
function checkCircularLoop(targetMgrId, memberId, members) {
  if (!targetMgrId || !memberId) return false;
  if (targetMgrId === memberId) return true;
  let curr = members.find(m => m.id === targetMgrId);
  while (curr) {
    if (curr.reportsTo === memberId) return true; // Cycle detected
    curr = members.find(m => m.id === curr.reportsTo);
  }
  return false;
}

// Member Offboard Logic with Direct Report Reassignment
function offboardMember(memberId, reassignReportsTo, members) {
  const m = members.find(x => x.id === memberId);
  const directReports = members.filter(x => x.reportsTo === memberId && x.isActive !== false);
  
  if (directReports.length > 0) {
    if (!reassignReportsTo || reassignReportsTo === memberId) {
      throw new Error("Cannot offboard: direct reports must be reassigned to a valid new manager.");
    }
    const newMgr = members.find(x => x.id === reassignReportsTo && x.isActive !== false);
    if (!newMgr) throw new Error("Target manager not found or inactive.");
    directReports.forEach(r => { r.reportsTo = newMgr.id; });
  }
  
  m.isActive = false;
  m.offboardedAt = new Date().toISOString();
  m.reportsTo = null;
  return m;
}
```

### 2.4 Output & Presentation
- **Miller Columns**: Multi-tier horizontal columns with SVG bezier curves dynamically connecting managers to subordinates.
- **Member Detail Panel**: Slide-over drawer detailing contact information, reporting chain, active deliverables, and quick actions.
- **Department Manager Modal**: Tabular editor with live color pickers and conflict checks.

### 2.5 Relevant Source Files
- Markup: [`hierarchy.html`](useme-team-performance/hierarchy.html)
- Controllers: [`js/hierarchy.js`](useme-team-performance/js/hierarchy.js), [`js/hierarchy-render.js`](useme-team-performance/js/hierarchy-render.js), [`js/hierarchy-connectors.js`](useme-team-performance/js/hierarchy-connectors.js), [`js/hierarchy-panel.js`](useme-team-performance/js/hierarchy-panel.js), [`js/new-member-modal.js`](useme-team-performance/js/new-member-modal.js)
- Styling: [`css/hierarchy.css`](useme-team-performance/css/hierarchy.css), [`css/hierarchy-card.css`](useme-team-performance/css/hierarchy-card.css), [`css/hierarchy-panel.css`](useme-team-performance/css/hierarchy-panel.css)

---

## 3. Skill Mapping & Competency Matrix

### 3.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Workforce competency directory enabling skill taxonomy management, talent discovery, gap analysis, and self-service proficiency upgrades.

### 3.2 User Inputs & Action Triggers
- **Skill Search & Filter**: Search by keyword, filter by category (`dev`, `data`, `finance`, etc.), or filter by minimum proficiency level.
- **Member Self-Declaration**: Member selects a skill category and chooses a new proficiency level (`Beginner`, `Intermediate`, `Advanced`, `Expert`).
- **Admin Verification**: Administrator selects any member and updates/verifies their level.
- **Category CRUD (Admin Only)**: Add category (name, description), update category, delete category (blocked if active members assigned).

### 3.3 Processing Logic & Validation Rules
```javascript
// Proficiency Upgrade Logic
function upgradeSkillProficiency(memberId, categoryId, newLevel, currentUser) {
  const isAdmin = currentUser.role === 'admin';
  // Non-admins can only modify their OWN records
  const targetId = isAdmin ? (memberId || currentUser.id) : currentUser.id;
  
  let rec = skillProficiencies.find(p => p.memberId === targetId && p.categoryId === categoryId);
  if (rec) {
    rec.level = newLevel;
    rec.lastUpdated = new Date().toISOString();
    rec.updatedBy = currentUser.id;
  } else {
    rec = {
      id: `sp-${targetId}-${categoryId}`,
      memberId: targetId,
      categoryId,
      level: newLevel,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.id
    };
    skillProficiencies.push(rec);
  }
  
  const m = members.find(x => x.id === targetId);
  if (m && (m.skillCategory === categoryId || !m.skillCategory)) {
    m.proficiency = newLevel;
    m.verified = isAdmin; // Only admin updates grant verified status
  }
  return rec;
}
```

### 3.4 Output & Presentation
- **Category Overview Cards**: Displays category name, description, and active member headcounts.
- **Member Skill Directory**: Card grid displaying member avatars, verified badges, proficiency tags, and current composite score.

### 3.5 Relevant Source Files
- Markup: [`skill-mapping.html`](useme-team-performance/skill-mapping.html)
- Controllers: [`js/skill-mapping.js`](useme-team-performance/js/skill-mapping.js), [`js/skill-search.js`](useme-team-performance/js/skill-search.js)
- Styling: [`css/skill-mapping.css`](useme-team-performance/css/skill-mapping.css), [`css/skill-search.css`](useme-team-performance/css/skill-search.css)

---

## 4. Tasks Management & Deliverable Lifecycle

### 4.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Operational task tracking system with finite-state machine (FSM) status transitions, multi-member assignment, deliverable proof attachments, and audit trails.

### 4.2 User Inputs & Action Triggers
- **Create Task (Admin Only)**: Title (min 3 chars), Description, Assigned Members (multi-select), Linked Skill, Due Date, Project ID (optional), Event ID (optional), Reference Resources, Initial Assets.
- **Advance Status (Member)**: Assigned member transitions task: `notStarted` $\to$ `inProgress` $\to$ `testing` $\to$ `awaitingFeedback`.
- **Submit Deliverable for Review (Member)**: Uploads file or URL proof; clicks "Submit for Review".
- **Delete / Archive Task (Admin Only)**: Blocked if deliverable is currently awaiting review. Soft-archives if status history or assets exist.

### 4.3 Task Finite State Machine (FSM) Logic
```
          ┌────────────────────────────────────────┐
          │               notStarted               │
          └───────────────────┬────────────────────┘
                              │ Member / Admin
                              ▼
          ┌────────────────────────────────────────┐
          │               inProgress               │◄─────────────────┐
          └─────────┬────────────────────┬─────────┘                  │
                    │                    │                            │ Admin
      Member / Admin│                    │ Member (Submit)            │ Reopen
                    ▼                    │                            │
          ┌───────────────────┐          │                            │
          │      testing      │          │                            │
          └─────────┬─────────┘          │                            │
                    │ Member (Submit)    │                            │
                    ▼                    ▼                            │
          ┌────────────────────────────────────────┐                  │
          │            awaitingFeedback            │                  │
          └─────────┬────────────────────┬─────────┘                  │
                    │ Admin              │ Admin                      │
                    │ Approve            │ Request Rework             │
                    ▼                    ▼                            │
          ┌───────────────────┐┌───────────────────┐                  │
          │     completed     ││   reworkNeeded    ├──────────────────┘
          └───────────────────┘└───────────────────┘ (Member updates deliverables)
```

```javascript
// Task Scoring Breakdown Formula
function calculateTaskScore(task) {
  if (!task || task.status === 'cancelled') return { kpiPoints: 0, kriPenalty: 0 };
  let kpiPoints = 0, kriPenalty = 0;
  const isCompleted = task.status === 'completed';
  const history = task.statusHistory || [];
  
  if (isCompleted) {
    kpiPoints += 10; // BASE_APPROVAL_POINTS
    const reworks = history.filter(h => h.status === 'reworkNeeded').length;
    if (reworks === 0) {
      kpiPoints += 5; // FIRST_TRY_APPROVAL_BONUS
    } else {
      kriPenalty += reworks * 3; // REWORK_PENALTY_PER_CYCLE
    }
    
    // On-Time vs Late Check
    if (task.dueDate) {
      const doneEntry = [...history].reverse().find(h => h.status === 'completed');
      const compDate = doneEntry ? new Date(doneEntry.timestamp.replace(' ', 'T')) : new Date();
      const dueDate = new Date(task.dueDate + 'T23:59:59');
      if (compDate <= dueDate) {
        kpiPoints += 5; // ON_TIME_BONUS
      } else {
        const lateDays = Math.max(1, Math.ceil((compDate.getTime() - dueDate.getTime()) / (86400000)));
        const latePenalty = Math.min(lateDays * 2, 10); // MAX_LATE_PENALTY = 10
        kriPenalty += latePenalty;
      }
    }
  }
  return { kpiPoints, kriPenalty };
}
```

### 4.4 Output & Presentation
- **Task Table Grid**: Title, Project link, Assignee Avatar Stack, Status Badge, Due Date, Skill Chip, Admin Actions (Edit/Delete).
- **Task Detail Modal**: Complete task specifications, expandable deliverable proof chips, and interactive status transition buttons.

### 4.5 Relevant Source Files
- Markup: [`tasks.html`](useme-team-performance/tasks.html)
- Controllers: [`js/tasks.js`](useme-team-performance/js/tasks.js), [`js/new-task-modal.js`](useme-team-performance/js/new-task-modal.js), [`js/task-detail-modal.js`](useme-team-performance/js/task-detail-modal.js), [`js/task-asset-field.js`](useme-team-performance/js/task-asset-field.js)
- Styling: [`css/tasks.css`](useme-team-performance/css/tasks.css), [`css/task-modal.css`](useme-team-performance/css/task-modal.css)

---

## 5. Submissions Review Queue

### 5.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Review gateway for completed task deliverables. Administrators review proofs and either approve or mandate revisions with rework notes. Members track submission review progress.

### 5.2 User Inputs & Action Triggers
- **Tab Switching**: Filter submissions by queue: `Pending Review`, `Approved`, or `Needs Rework`.
- **Approve Deliverable (Admin Only)**: Instant approval button. Sets task status `completed`.
- **Send Back for Rework (Admin Only)**: Opens inline revision drawer. Mandates entering non-empty rework instructions.
- **Remove from Review Queue (Admin Only)**: Reverts deliverable to `inProgress`.

### 5.3 Processing Logic & Quality Formula
```javascript
// Submission Quality Score Calculation (Directly from scoring-engine.js)
function getSubmissionQualityScore(memberId, cycle) {
  const tasks = ds.getTasks();
  const memTasks = (!memberId || memberId === 'all')
    ? tasks.filter(t => t.status !== 'cancelled')
    : tasks.filter(t => (t.assignedTo || []).includes(memberId) && t.status !== 'cancelled');
    
  const comp = memTasks.filter(t => t.status === 'completed');
  if (comp.length === 0) return 86.5; // Baseline fallback
  
  // First-Pass Approval: Completed tasks that NEVER entered reworkNeeded
  const firstPass = comp.filter(t => 
    !(t.statusHistory || []).some(h => h.status === 'reworkNeeded')
  ).length;
  const passRate = (firstPass / comp.length) * 100;
  
  // Evaluated Quality Ratings (out of 5)
  const rated = comp.filter(t => typeof (t.qualityRating || t.rating) === 'number');
  const avgR = rated.length > 0 
    ? (rated.reduce((acc, t) => acc + (t.qualityRating || t.rating), 0) / rated.length) 
    : 4.3;
    
  // 60% First-Pass Rate + 40% Normalized Rating
  return Math.round(((passRate * 0.6) + ((avgR / 5) * 100 * 0.4)) * 10) / 10;
}
```

### 5.4 Output & Presentation
- **Submission Cards**: Card listing deliverable title, primary submitter name/avatar, project title, due date, proof asset chips (clickable URLs / file names), and review action buttons.
- **Rework Drawer**: Expandable text area requiring specific revision guidance.

### 5.5 Relevant Source Files
- Markup: [`submissions.html`](useme-team-performance/submissions.html)
- Controller: [`js/submissions.js`](useme-team-performance/js/submissions.js)
- Styling: [`css/submissions.css`](useme-team-performance/css/submissions.css)

---

## 6. Projects & Strategic Programs

### 6.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Groups deliverables into strategic programs. Tracks aggregate percentage completion, target delivery dates, and core project team members.

### 6.2 User Inputs & Action Triggers
- **Create / Edit Project (Admin Only)**: Project Name, Description, Status (`active`, `onHold`, `completed`), Start Date, Target Date, Member Assignments (multi-select).
- **Delete Project (Admin Only)**: Validates against active tasks. Blocks deletion if incomplete tasks are linked.

### 6.3 Processing Logic & Progress Derivation
```javascript
// Dynamic Progress Calculation from Linked Tasks
function getProjectProgress(project, allTasks) {
  const linked = allTasks.filter(t => 
    t.isArchived !== true &&
    ((project.linkedTaskIds || []).includes(t.id) || t.projectId === project.id)
  );
  if (linked.length === 0) return project.progress || 0;
  const completed = linked.filter(t => t.status === 'completed').length;
  return Math.round((completed / linked.length) * 100);
}
```

### 6.4 Output & Presentation
- **Project Cards**: Circular icon badge, title, status pill, progress track with coral accent fill, start/target dates, team avatars, and linked tasks count.
- **Project Detail Modal**: Complete program description and linked task roster.

### 6.5 Relevant Source Files
- Markup: [`projects.html`](useme-team-performance/projects.html)
- Controllers: [`js/projects.js`](useme-team-performance/js/projects.js), [`js/project-modal.js`](useme-team-performance/js/project-modal.js)
- Styling: [`css/projects.css`](useme-team-performance/css/projects.css), [`css/project-modal.css`](useme-team-performance/css/project-modal.css)

---

## 7. Events & Venue Coordination

### 7.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Coordinates physical summits, expos, and client demos. Schedules venues, assigns staff roles, and automatically detects venue booking collisions.

### 7.2 User Inputs & Action Triggers
- **Create / Edit Event (Admin Only)**: Event Name, Description, Venue, Date, Status (`upcoming`, `completed`, `cancelled`), Staff Assignments (Member ID + Role at Event).
- **Delete Event (Admin Only)**: Blocked if incomplete preparation tasks are linked.

### 7.3 Processing Logic & Venue Conflict Algorithm
```javascript
// Venue Conflict Collision Detection Algorithm
function checkEventVenueConflict(eventId, venue, eventDate, allEvents) {
  if (!venue || !eventDate) return null;
  const cleanVenue = venue.trim().toLowerCase();
  
  const conflict = allEvents.find(e => 
    e.id !== eventId &&
    e.status !== 'cancelled' &&
    (e.venue || '').trim().toLowerCase() === cleanVenue &&
    e.eventDate === eventDate
  );
  return conflict || null;
}
```

### 7.4 Output & Presentation
- **Event Cards**: Date badge, Event title, Venue badge, Crew count, Status badge. Renders a prominent amber/red conflict warning if another event shares the venue on the same date.
- **Event Modal**: Crew roster and conflict warning indicators.

### 7.5 Relevant Source Files
- Markup: [`events.html`](useme-team-performance/events.html)
- Controllers: [`js/events.js`](useme-team-performance/js/events.js), [`js/event-modal.js`](useme-team-performance/js/event-modal.js)
- Styling: [`css/events.css`](useme-team-performance/css/events.css), [`css/event-modal.css`](useme-team-performance/css/event-modal.css)

---

## 8. Ranking & Performance Leaderboard

### 8.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Transparent, gamified performance leaderboard ranking all active members (#1 to #180). Strictly read-only.

### 8.2 User Inputs & Action Triggers
- **Filters**: All, Top Performers ($\ge 85$), Needs Support ($< 60$), Department Filter, Member Name Search.

### 8.3 Processing Logic & Ranking Algorithm
```javascript
// Leaderboard Sorting & Rank Assignment
function recalculateAllRanks(members, cycle) {
  const scored = members.map(m => ({
    member: m,
    score: getOverallScore(m.id, cycle)
  }));
  
  // Sort descending by calculated score
  scored.sort((a, b) => b.score - a.score);
  
  scored.forEach((item, idx) => {
    item.member.rank = `#${idx + 1}`;
    item.member.compositeScore = item.score;
  });
  return scored;
}
```

### 8.4 Output & Presentation
- **Leaderboard Table**: Rank badge (#1, #2, etc.), Member Avatar & Name, Role & Department, Composite Performance Score, KRA Attainment %, Engagement %, Motivation %, Quality Score, Active Tasks count.
- **Own-Row Highlight (Member)**: Team member's own row is highlighted in distinctive coral accent border with pastel peach tint (`.rank-row.my-row`).

### 8.5 Relevant Source Files
- Markup: [`ranking.html`](useme-team-performance/ranking.html)
- Controller: [`js/ranking.js`](useme-team-performance/js/ranking.js)
- Styling: [`css/ranking.css`](useme-team-performance/css/ranking.css)

---

## 9. Automated Performance Insights

### 9.1 Purpose & Role Visibility
- **Role**: **`admin` only.** Non-admins are automatically redirected to `dashboard.html`.
- **Purpose**: Autonomous risk radar continuously scanning deliverables, review queues, projects, and attendance telemetry to detect anomalies before failure occurs.

### 9.2 User Inputs & Action Triggers
- **Re-analyze Button**: Manually triggers deterministic rules re-evaluation.

### 9.3 Processing Logic — 6 Deterministic Rules (Literal Source Code)
```javascript
// Rule 1: Stuck Tasks (Active deliverables stagnant for >= 4 days)
tasks.forEach(t => {
  if (['completed', 'cancelled'].includes(t.status)) return;
  const history = t.statusHistory || [];
  if (history.length > 0) {
    const lastEntry = history[history.length - 1];
    const lastDate = new Date(lastEntry.timestamp.replace(' ', 'T') + ':00Z');
    const diffDays = Math.floor((now - lastDate) / 86400000);
    if (diffDays >= 4) {
      insights.push({
        type: 'Stuck Task',
        severity: diffDays > 5 ? 'high' : 'medium',
        headline: `Stalled Deliverable: ${t.title}`,
        explanation: `In "${t.status}" status for ${diffDays} days without milestone progress.`
      });
    }
  }
});

// Rule 2: Quality Pattern (Rework Cluster: >= 2 active tasks in reworkNeeded)
const reworkMap = new Map();
tasks.forEach(t => {
  if (t.status === 'reworkNeeded') {
    (t.assignedTo || []).forEach(mid => reworkMap.set(mid, (reworkMap.get(mid) || 0) + 1));
  }
});
reworkMap.forEach((count, mid) => {
  if (count >= 2) {
    const mem = members.find(m => m.id === mid);
    insights.push({
      type: 'Quality Pattern',
      severity: 'high',
      headline: `Rework Cluster: ${mem.name}`,
      explanation: `${mem.name} currently has ${count} active deliverables flagged for rework.`
    });
  }
});

// Rule 3: Category Bottleneck (>= 3 active tasks blocked in review/rework per category)
categories.forEach(cat => {
  const blocked = tasks.filter(t => 
    t.linkedSkill === cat.id && ['reworkNeeded', 'testing', 'awaitingFeedback'].includes(t.status)
  );
  if (blocked.length >= 3) {
    insights.push({
      type: 'Domain Bottleneck',
      severity: 'medium',
      headline: `Capacity Bottleneck: ${cat.name}`,
      explanation: `${blocked.length} tasks in ${cat.name} are blocked in review or rework queues.`
    });
  }
});

// Rule 4: At-Risk Projects (Target due in <= 20 days with < 50% deliverables done)
projects.forEach(p => {
  if (p.status === 'completed') return;
  const linked = tasks.filter(t => (p.linkedTaskIds || []).includes(t.id) || t.projectId === p.id);
  const done = linked.filter(t => t.status === 'completed').length;
  const pct = linked.length > 0 ? (done / linked.length) * 100 : 0;
  const daysUntil = Math.floor((new Date(p.targetDate + 'T00:00:00Z') - now) / 86400000);
  if (pct < 50 && daysUntil <= 20 && daysUntil >= 0) {
    insights.push({
      type: 'Timeline Risk',
      severity: 'high',
      headline: `Project at Risk: ${p.name}`,
      explanation: `Due in ${daysUntil} days with only ${Math.round(pct)}% deliverables complete.`
    });
  }
});

// Rule 5: Low Engagement (Approved activities < 50% of team average in cycle)
const allApproved = [...engSubs, ...motSubs].filter(s => s.status === 'approved' && inCurrentCycle(s.date));
const avgActs = members.length > 0 ? (allApproved.length / members.length) : 1;
const threshold = Math.max(1, Math.floor(avgActs * 0.5));
members.forEach(mem => {
  const memActs = allApproved.filter(s => s.memberId === mem.id).length;
  if (memActs < threshold) {
    insights.push({
      type: 'Engagement Risk',
      severity: 'medium',
      headline: `Low Activity: ${mem.name}`,
      explanation: `${mem.name} has logged only ${memActs} approved activities (threshold: ${threshold}).`
    });
  }
});

// Rule 6: Repeated Zoom Absence (>= 2 recorded absences in current review cycle)
const cycleZoom = zoomSessions.filter(z => inCurrentCycle(z.date));
members.forEach(mem => {
  const absences = cycleZoom.filter(z => (z.attendance?.[mem.id] || 'absent') === 'absent').length;
  if (absences >= 2) {
    insights.push({
      type: 'Motivation Anomaly',
      severity: 'high',
      headline: `Repeated Sync Absence: ${mem.name}`,
      explanation: `${mem.name} was absent in ${absences} of ${cycleZoom.length} scheduled Zoom calls.`
    });
  }
});
```

### 9.4 Output & Presentation
- **Insight Cards Grid**: Severity badges (`HIGH` red, `MEDIUM` orange), category tags, concise headlines, root-cause explanations, and one-click contextual drilldown buttons.

### 9.5 Relevant Source Files
- Markup: [`insights.html`](useme-team-performance/insights.html)
- Controller: [`js/insights.js`](useme-team-performance/js/insights.js)
- Styling: [`css/insights.css`](useme-team-performance/css/insights.css)

---

## 10. KRA & KPI Performance Appraisal

### 10.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Strategic organizational appraisal layer evaluating 5 weighted pillars, RAG status classifications, per-member score overrides, and 6-month historical trends.

### 10.2 User Inputs & Action Triggers
- **Member Selector (Admin Only)**: Combobox to evaluate organization aggregate or specific member.
- **Review Cycle Selector**: Switch between historical evaluation cycles.
- **Manage Pillars Modal (Admin Only)**: Modify pillar names, target descriptions, and weights (weights **must sum to 100%**).
- **Edit Score Modal (Admin Only)**: Input pillar attainment score ($0..100$) and justification notes for a member.

### 10.3 Processing Logic & Pillar Formulas
```javascript
// Red-Amber-Green (RAG) Threshold Classification
const RAG_THRESHOLDS = { GREEN: 85, AMBER: 60 };

function getRAG(score) {
  const s = Number(score) || 0;
  if (s >= RAG_THRESHOLDS.GREEN) return { cls: 'rag-green', label: 'On Track', color: 'var(--color-green)' };
  if (s >= RAG_THRESHOLDS.AMBER) return { cls: 'rag-amber', label: 'At Risk', color: 'var(--color-orange)' };
  return { cls: 'rag-red', label: 'Behind', color: 'var(--color-red)' };
}

// 5 KRA Strategic Pillar Formulas
function calculateRawPillars(memberId, cycle) {
  const tasks = ds.getTasks().filter(t => (t.assignedTo || []).includes(memberId) && t.status !== 'cancelled');
  const comp = tasks.filter(t => t.status === 'completed');
  
  // 1. Growth: Output Velocity (Completion %)
  const growth = tasks.length > 0 ? Math.min(100, Math.round((comp.length / tasks.length) * 100)) : 88;
  
  // 2. Quality: First-pass rate (60%) + Quality Rating (40%)
  const quality = getSubmissionQualityScore(memberId, cycle);
  
  // 3. Timeliness: On-time delivery percentage
  const onTime = comp.filter(t => 
    !t.dueDate || 
    new Date((t.statusHistory?.slice().reverse().find(h => h.status === 'completed')?.timestamp || '').replace(' ', 'T')) <= new Date(t.dueDate + 'T23:59:59')
  ).length;
  const timeliness = comp.length > 0 ? Math.round((onTime / comp.length) * 100) : 85;
  
  // 4. Skill: Average evaluated competency level
  const profs = ds.getMemberProficiencies({ memberId });
  const lvlMap = { Expert: 95, Advanced: 85, Intermediate: 75, Beginner: 65, L4: 95, L3: 85, L2: 75, L1: 65 };
  const skill = profs.length > 0 
    ? Math.round(profs.reduce((acc, p) => acc + (lvlMap[p.level] || 75), 0) / profs.length) 
    : 82;
    
  // 5. Compliance: Deduction of 5 points per overdue incomplete deliverable
  const overdue = tasks.filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate + 'T23:59:59') < new Date()).length;
  const compliance = Math.max(50, 100 - (overdue * 5));
  
  return { growth, quality, timeliness, skill, compliance };
}
```

```javascript
// Key Risk Indicator (KRI) Penalty Formula
function getKRIPenalty(memberId, cycle) {
  if (!memberId || memberId === 'all') return 0;
  const tasks = ds.getTasks().filter(t => (t.assignedTo || []).includes(memberId) && t.status !== 'cancelled');
  const now = new Date();
  
  return tasks.reduce((pen, t) => {
    let p = pen;
    // Overdue Penalty: +3 pts
    if (t.dueDate && t.status !== 'completed' && new Date(t.dueDate + 'T23:59:59') < now) p += 3;
    // Repeated Rework Penalty: +5 pts per revision cycle beyond the first
    const reworks = (t.statusHistory || []).filter(h => h.status === 'reworkNeeded').length;
    if (reworks > 1) p += 5 * (reworks - 1);
    // Explicit Compliance Breach: +5 pts
    if (t.complianceFlag) p += 5;
    return p;
  }, 0);
}
```

### 10.4 Output & Presentation
- **KRA Summary Card**: Total attainment donut, top performing pillar, priority focus area, and RAG status badge.
- **Pillar Cards Grid**: Five cards detailing pillar name, percentage weight, score, attainment bar, RAG badge, and "Edit Score" modal trigger for Admin.
- **Historical Trend Chart**: Multi-line SVG chart displaying 6-month fluctuating trends comparing Org average vs Member actuals.

### 10.5 Relevant Source Files
- Markup: [`kra.html`](useme-team-performance/kra.html)
- Controllers: [`js/kra.js`](useme-team-performance/js/kra.js), [`js/kra-combobox.js`](useme-team-performance/js/kra-combobox.js), [`js/scoring-engine.js`](useme-team-performance/js/scoring-engine.js)
- Styling: [`css/kra.css`](useme-team-performance/css/kra.css)

---

## 11. Engagement, Motivation & Zoom Syncs

### 11.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Dual-tab module managing gamified outreach engagement and peer motivation. Incorporates configurable point targets, live Zoom meeting integration with self-capture attendance, and workshop logs.

### 11.2 User Inputs & Action Triggers
- **Log Outreach Activity (Member Only)**: Activity Type (social, onGround, whatsapp, etc.), Title, Date, Proof Format (`url` or `file`), Proof Value (URL or filename).
- **Log Motivation Activity (Member Only)**: Program Type (`groupTalk`, `microEvent`), Title, Date, Proof URL/File.
- **Join Call / Self-Check-in (Member Only)**: Clicks `#btnJoinZoomCall`. Simultaneously redirects to the Zoom URL in a new tab and captures check-in timestamp.
- **Admin Attendance Override**: Admin marks member `present`, `late`, or `absent` on any session.
- **Admin Targets Panel**: Create target groups, assign member cohorts, or set personal target overrides.

### 11.3 Processing Logic & Scoring Formulas
```javascript
// Configurable Target Resolution Order (scoring-targets.js)
function resolveTarget(memberId, category = 'engagement') {
  if (!memberId || memberId === 'all') return 40; // DEFAULT_FALLBACK_TARGET
  
  // 1. Personal Member Target Override
  const override = ds.getMemberTargetOverride(memberId, category);
  if (override !== null && !isNaN(Number(override)) && Number(override) > 0) {
    return Number(override);
  }
  
  // 2. Cohort Target Group
  const groups = ds.getTargetGroups() || [];
  const match = groups.find(g => Array.isArray(g.memberIds) && g.memberIds.includes(memberId));
  if (match && !isNaN(Number(match.targetPoints)) && Number(match.targetPoints) > 0) {
    return Number(match.targetPoints);
  }
  
  // 3. Fallback Default
  return 40;
}
```

```javascript
// Engagement Attainment Formula
function getEngagementScore(memberId, cycle) {
  const subs = ds.getEngagementSubmissions();
  const actTypes = ds.getActivityTypes('outreach');
  const typePts = Object.fromEntries(actTypes.map(t => [t.id, t.pointValue]));
  
  const calcPts = (mId) => subs
    .filter(s => s.memberId === mId && s.status === 'approved')
    .reduce((acc, s) => acc + (typePts[s.type] !== undefined ? typePts[s.type] : 2), 0);
    
  if (memberId && memberId !== 'all') {
    const target = resolveTarget(memberId, 'engagement');
    return Math.min(100, Math.round((calcPts(memberId) / target) * 100));
  }
  const mems = ds.getMembers();
  const total = mems.reduce((acc, m) => acc + getEngagementScore(m.id, cycle), 0);
  return mems.length ? Math.round(total / mems.length) : 80;
}
```

```javascript
// Motivation Attainment Formula (Zoom + Talks)
function getMotivationScore(memberId, cycle) {
  const sessions = ds.getZoomSessions();
  const talks = ds.getMotivationSubmissions();
  const actTypes = ds.getActivityTypes('motivation');
  const typePts = Object.fromEntries(actTypes.map(t => [t.id, t.pointValue]));
  
  const calcPts = (mId) => {
    // Zoom Attendance: Present = 3 pts, Late = 1 pt, Absent = 0 pts
    const zPts = sessions.reduce((acc, s) => {
      const a = s.attendanceRecords?.[mId]?.status || s.attendance?.[mId] || 'absent';
      return acc + (a === 'present' ? 3 : (a === 'late' ? 1 : 0));
    }, 0);
    // Talks / Micro-events (approved)
    const tPts = talks
      .filter(t => t.memberId === mId && t.status === 'approved')
      .reduce((acc, t) => acc + (typePts[t.type] ?? 4), 0);
    return zPts + tPts;
  };
  
  if (memberId && memberId !== 'all') {
    const target = resolveTarget(memberId, 'motivation');
    return Math.min(100, Math.round((calcPts(memberId) / target) * 100));
  }
  const mems = ds.getMembers();
  const total = mems.reduce((acc, m) => acc + getMotivationScore(m.id, cycle), 0);
  return mems.length ? Math.round(total / mems.length) : 85;
}
```

```javascript
// Zoom Self-Capture Latency Status Window
function evaluateSelfCaptureStatus(captureTime, scheduledStart) {
  const startMs = new Date(scheduledStart).getTime();
  const capMs = new Date(captureTime).getTime();
  const diffMinutes = (capMs - startMs) / 60000;
  
  if (diffMinutes <= 5) return 'present';
  if (diffMinutes <= 15) return 'late';
  return 'absent';
}

// Attendance Streak Calculation
function calculateAttendanceStreak(memberId, zoomSessions) {
  let streak = 0;
  for (let i = 0; i < zoomSessions.length; i++) {
    const att = zoomSessions[i].attendance?.[memberId];
    if (att === 'present' || att === 'late') streak++;
    else break; // Streak broken on first absence
  }
  return streak;
}
```

### 11.4 Output & Presentation
- **Outreach Tab**: Combined Outreach Index score card, Channel breakdown cards with sparkline trends, Activity Submission Table with approval/rework actions.
- **Motivation Tab**: Combined Motivation Index card, Live Zoom Call Card with Join button and check-in confirmation (`"Checked In at 10:02 AM ✓"`), Attendance Roster table with self-capture indicators, Growth & Leadership Program cards (8 cards), and Talks & Micro-Events log table (18+ rows).

### 11.5 Relevant Source Files
- Markup: [`engagement-motivation.html`](useme-team-performance/engagement-motivation.html)
- Controllers: [`js/engagement.js`](useme-team-performance/js/engagement.js), [`js/zoom-self-capture.js`](useme-team-performance/js/zoom-self-capture.js), [`js/targets-panel.js`](useme-team-performance/js/targets-panel.js), [`js/scoring-targets.js`](useme-team-performance/js/scoring-targets.js)
- Styling: [`css/engagement.css`](useme-team-performance/css/engagement.css)

---

## 12. Resources & Asset Hub

### 12.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Consolidated asset library aggregating all files, proofs, blueprints, and links uploaded across tasks, projects, outreach submissions, and motivation talks.

### 12.2 User Inputs & Action Triggers
- **Search & Filtering**: Search by filename; filter by type (`all`, `document`, `image`, `link`, `code`); filter by uploader department.
- **Delete Asset (Admin Only)**: Administrator can delete/unlink any asset, triggering cross-entity cleanup.

### 12.3 Processing Logic & Cross-Entity Asset Aggregation
```javascript
// Cross-Entity Asset Normalization
function aggregateAllResources(ds) {
  const assets = [];
  
  // 1. Task Assets
  ds.getTasks().forEach(t => {
    (t.assets || []).forEach((a, idx) => {
      assets.push({
        refType: 'task',
        taskId: t.id,
        assetIndex: idx,
        name: typeof a === 'string' ? a : a.name,
        url: typeof a === 'string' ? `/assets/proofs/${a}` : (a.url || '#'),
        uploadedBy: typeof a === 'object' ? a.uploadedBy : 'Assigned Member',
        contextTitle: t.title,
        type: detectAssetType(a)
      });
    });
  });
  
  // 2. Engagement Proofs
  ds.getEngagementSubmissions().forEach(s => {
    if (s.proofValue) {
      assets.push({
        refType: 'engagement',
        submissionId: s.id,
        name: s.proofValue.split('/').pop() || s.proofValue,
        url: s.proofValue,
        uploadedBy: s.memberId,
        contextTitle: s.title,
        type: s.proofType === 'url' ? 'link' : 'image'
      });
    }
  });
  
  // 3. Motivation Proofs & 4. Project Documents (Normalized similarly)
  return assets;
}
```

### 12.4 Output & Presentation
- **Asset Grid**: Card layout with media type icons, file size tags, context badges, and download/open actions.

### 12.5 Relevant Source Files
- Markup: [`resources.html`](useme-team-performance/resources.html)
- Controller: [`js/resources.js`](useme-team-performance/js/resources.js)
- Styling: [`css/resources.css`](useme-team-performance/css/resources.css)

---

## 13. Executive Reports & Export Engine

### 13.1 Purpose & Role Visibility
- **Role**: **`admin` only.** Non-admins are redirected to `dashboard.html`.
- **Purpose**: Generates executive workforce telemetry reports across variable evaluation periods (`week`, `month`, `quarter`, `all`). Supports multi-section CSV report generation.

### 13.2 User Inputs & Action Triggers
- **Period Filter**: Select period (`week`, `month`, `quarter`, `all`).
- **Export CSV Button**: Compiles and downloads the complete multi-section performance CSV file.

### 13.3 Processing Logic & Period Filtering
```javascript
// Period Date Range Resolution
function getDateRange(period) {
  const now = new Date();
  const end = new Date(now.getTime());
  const start = new Date(now.getTime());
  if (period === 'week') start.setDate(now.getDate() - 7);
  else if (period === 'month') start.setDate(now.getDate() - 30);
  else if (period === 'quarter') start.setDate(now.getDate() - 90);
  else start.setDate(now.getDate() - 180);
  return { start, end };
}

// Multi-Section CSV Export Structure
// Section 1: Team Members Performance Scorecard (Period Filtered)
// Section 2: Operational Tasks & Deliverables (Period Filtered)
// Section 3: Engagement & Motivation Activities (Period Filtered)
```

### 13.4 Output & Presentation
- **KPI Summary Grid**: Completed Deliverables count, Average Composite Score, Overdue Deliverables, Rework Rate %, Skill Gap Alerts.
- **Dynamic Charts**: Deliverables Completed per Week (SVG bar chart) and Rework Rate Trend (SVG area curve).
- **CSV Download**: Direct browser download of `useme-team-report-[period]-[timestamp].csv`.

### 13.5 Relevant Source Files
- Markup: [`reports.html`](useme-team-performance/reports.html)
- Controllers: [`js/reports.js`](useme-team-performance/js/reports.js), [`js/reports-data.js`](useme-team-performance/js/reports-data.js), [`js/reports-export.js`](useme-team-performance/js/reports-export.js)
- Styling: [`css/reports.css`](useme-team-performance/css/reports.css)

---

## 14. Global Search & Command Palette

### 14.1 Purpose & Role Visibility
- **Role**: Both `admin` and `member`.
- **Purpose**: Fast keyboard-driven command palette (`Ctrl+K` / `Cmd+K`) indexing members, tasks, projects, events, and skill categories across the platform.

### 14.2 User Inputs & Action Triggers
- **Shortcut / Click**: Press `Ctrl+K` or click search box in the top navigation bar.
- **Query Input**: Type alphanumeric text; navigate results with Arrow Up/Down; select with Enter.

### 14.3 Processing Logic & Indexing
- Scans `DataStore.getMembers()`, `DataStore.getTasks()`, `DataStore.getProjects()`, `DataStore.getEvents()`, and `DataStore.getSkillCategories()`.
- Filters results by substring matching across title, name, description, and tags.
- Directs user to the target page or opens contextual detail modal.

### 14.4 Relevant Source Files
- Controllers: [`js/command-palette.js`](useme-team-performance/js/command-palette.js), [`js/nav.js`](useme-team-performance/js/nav.js)
- Styling: [`css/command-palette.css`](useme-team-performance/css/command-palette.css), [`css/nav.css`](useme-team-performance/css/nav.css)

---

## 15. Authentication, Profile & Password Management

### 15.1 Purpose & Role Visibility
- **Role**: Public / Logged-in user.
- **Purpose**: Authenticates credentials, protects session tokens, manages self-service password updates, and provides administrative password resets.

### 15.2 User Inputs & Action Triggers
- **Login Form (`index.html`)**: Username or Email, Password, Role Toggle (Admin vs Team Member).
- **Self-Service Change Password (`profile.html` / `password-modal.js`)**: Current Password, New Password ($\ge 4$ chars), Confirm New Password.
- **Admin Password Reset**: Administrator selects member, enters new password without requiring current password.

### 15.3 Processing Logic & Security Rules
```javascript
// Authentication Flow (js/data-store.js)
function authenticate(identifier, password, requestedRole) {
  if (!identifier || !password) return null;
  const cleanId = identifier.toLowerCase().trim();
  const enteredHash = sha256(password); // To be replaced with Argon2id on backend
  
  const member = members.find(m => 
    m.isActive !== false &&
    ((m.username && m.username.toLowerCase() === cleanId) ||
     (m.email && m.email.toLowerCase() === cleanId))
  );
  if (!member) return null;
  if (member.passwordHash !== enteredHash) return null;
  
  const isAdm = member.id === 'm1' || member.department === 'Executive';
  const inherentRole = isAdm ? 'admin' : 'member';
  if (requestedRole === 'admin' && inherentRole !== 'admin') {
    return null; // Privilege escalation blocked
  }
  
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    email: member.email,
    role: (requestedRole === 'admin' && inherentRole === 'admin') ? 'admin' : inherentRole,
    department: member.department,
    avatar: member.avatar
  };
}
```

### 15.4 Relevant Source Files
- Markup: [`index.html`](useme-team-performance/index.html), [`profile.html`](useme-team-performance/profile.html)
- Controllers: [`js/login.js`](useme-team-performance/js/login.js), [`js/password-modal.js`](useme-team-performance/js/password-modal.js), [`js/profile.js`](useme-team-performance/js/profile.js)
- Styling: [`css/login.css`](useme-team-performance/css/login.css), [`css/profile.css`](useme-team-performance/css/profile.css)
