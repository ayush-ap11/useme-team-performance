# Useme Team Platform — Technical Documentation: Domain Glossary

This glossary defines standard domain terms, scoring acronyms, and organizational concepts used throughout the Useme Team platform specification.

---

### Activity Type
A registered category of field outreach or peer motivation activities configured by administrators (e.g. *Social Media*, *On-Ground Visit*, *WhatsApp Group*, *Group Talk*, *Micro Event*). Each type defines an earned point value and whether verifiable proof is mandatory.

### Attendance Streak
The consecutive count of scheduled Zoom synchronization calls a member has attended with `present` or `late` status, starting from the most recent session and working backward. The streak terminates upon encountering the first `absent` record.

### Composite Score (Net Performance Score)
The final aggregated performance number on a scale of $0.0$ to $100.0$ representing a member's net achievement. Calculated via the weighted formula combining KRA attainment (40%), Outreach Engagement (20%), Motivation (20%), and Submission Quality (20%), reduced by the gross KRI Penalty.

### First-Pass Rate (First-Try Approval Rate)
The percentage of completed deliverables that achieved administrator approval on their initial review submission without ever being flagged for revisions (`reworkNeeded`). Serves as a primary metric for deliverable quality standards.

### Key Performance Indicator (KPI)
Quantifiable, positive operational milestones that accumulate points towards performance appraisal (e.g. approved deliverable completion, first-pass approval bonus, on-time milestone delivery).

### Key Result Area (KRA)
High-level strategic accountability domains across which organizational performance is evaluated. In Useme Team, KRAs are structured into five core pillars: *Growth*, *Quality*, *Timeliness*, *Skill*, and *Compliance*.

### Key Risk Indicator (KRI)
Negative operational metrics that deduct points from a member's composite score to penalize schedule slippage, excessive rework cycles, or compliance violations (e.g. overdue task penalty of $-3$ pts, repeated rework penalty of $-5$ pts per revision, compliance breach penalty of $-5$ pts).

### Miller Columns
A multi-tier horizontal column navigation paradigm used in the Team Hierarchy visualizer. Clicking an employee card in column $N$ populates their direct reports in column $N+1$, while maintaining stable visual continuity with bezier connector curves.

### Member Target Override
A customized monthly attainment point benchmark explicitly assigned by an administrator to an individual member for outreach or motivation. Supersedes both cohort Target Groups and default system fallbacks.

### Offboard Reassignment
The mandatory administrative procedure of selecting an active replacement manager to inherit all direct reports before a departing employee record can be soft-deleted (`isActive = false`).

### RAG Status (Red-Amber-Green)
A standardized executive health classification based on attainment percentages:
- **Green (On Track)**: Attainment score $\ge 85.0\%$. Operational execution meets or exceeds standards.
- **Amber (At Risk)**: Attainment score between $60.0\%$ and $84.9\%$. Deliverables or milestones require monitoring.
- **Red (Behind)**: Attainment score $< 60.0\%$. Critical milestone delays or chronic operational bottlenecks.

### Review Cycle (Appraisal Window)
A bounded calendar evaluation period (typically monthly, e.g. *Aug 2026*, or quarterly) against which deliverables, attendance, KRA objectives, and engagement points are filtered and baselined. Only one review cycle can be designated as `current` at a time.

### Rework Cycle
A status lifecycle loop triggered when an administrator rejects a submitted deliverable, transitioning the task to `reworkNeeded` with mandatory explanatory notes. Repeated rework cycles trigger KRI penalties and reduce the member's First-Pass Approval Rate.

### Self-Capture (Zoom Self-Check-in)
A client-initiated attendance recording mechanism triggered when a member clicks the "Join Call" button on a live video session. The system captures the click timestamp, evaluates latency relative to `scheduledStart`, and flags an initial attendance status awaiting administrator confirmation.

### Strategic Pillar
One of the five foundational organizational competencies defined in the KRA evaluation framework:
1. **Growth (25%)**: Platform deliverables and milestone output velocity.
2. **Quality (25%)**: Quality assurance and first-try approval standards.
3. **Timeliness (20%)**: On-time delivery and schedule adherence.
4. **Skill (15%)**: Competency mastery and verified proficiency growth.
5. **Compliance (15%)**: Process adherence and statutory standard execution.
*All pillar weights must sum to exactly 100.0%.*

### Target Group (Cohort Target)
A custom group benchmark configured by administrators assigning specific monthly point targets (e.g. $45$ pts/mo for *Field Outreach Specialists*, $35$ pts/mo for *Core Operations*) to member cohorts based on operational focus.

### Unassigned Member Shelf
An administrative staging area containing newly self-registered accounts with `isUnassigned = true`. These members have login credentials but cannot participate in tasks or hierarchy reporting until an administrator assigns them a department, manager, and functional role.

### Venue Conflict Collision
An automated scheduling alert triggered when two or more distinct events are scheduled at the identical venue on the same calendar date.
