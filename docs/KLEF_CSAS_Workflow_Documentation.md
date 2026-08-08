---
title: "KLEF CSAS — Course Section Allocation System"
subtitle: "Detailed Module Workflow Documentation"
date: "2026"
---

# 1. Document Purpose

This document explains, module by module, how the KLEF Course Section
Allocation System (CSAS) works — who does what, in what order, under what
rules, and what the system does automatically at each step. It is written
for anyone who needs to understand the workflow without reading source code:
department coordinators, the timetable admin, academic administration, and
anyone onboarding a new department.

The system is organized into three modules, used in sequence by different
people:

1. **Module 1 — Course Master / Course Definition**: departments define the
   courses they teach.
2. **Module 2 — Course Selection & Demand**: departments tell the system how
   many of their students want each available course.
3. **Module 3 — Section Allocation & Live Calculation**: the Timetable Admin
   turns all of that submitted demand into an actual, validated, finalized
   section plan.

---

# 2. System-Wide Concepts

## 2.1 Departments are independent — not a hierarchy

A common misunderstanding this system deliberately avoids: **CSE-1, CSE-2,
CSE-3, and CSE-4 are not "sections" of one CSE department**, and **HTE, HTR,
HTI are not sub-programs under CSE, AIDS, or ECE.** Every one of the
following is its own, independent, first-class department in the system,
with its own login and its own data:

> CSE-1 · CSE-2 · CSE-3 · CSE-4 · ECE · CSIT · AIDS · HTE · HTR · HTI

This matters throughout the whole workflow: whenever the system shows
demand, totals, or an allocation matrix broken down "by department," it
always shows these ten (or however many exist — departments are managed
dynamically, not hardcoded) as separate rows. CSE-1's numbers are never
merged into a generic "CSE" total.

## 2.2 One login per department, covering two modules

Historically a system like this might have a separate "course owner" login
for defining courses and a separate "department" login for submitting
demand. **This system does not do that.** Each department has exactly one
login, and that one login has access to both Module 1 (define this
department's own courses) and Module 2 (submit this department's demand for
any course visible to it). The person signing in as CSE-1 does both jobs.

## 2.3 Three roles

| Role | Who | Scope |
|---|---|---|
| **Super Admin** | Academic administration | Owns shared master data (departments, categories, regulations, semesters, course types) and has unrestricted visibility into the full course catalog. Does **not** touch Module 2 or Module 3. |
| **Department User** | One person/office per department | Module 1 + Module 2, scoped to their one department only. Cannot see or act on another department's courses or demand except in the read-only sense of "does this course exist and is it offered to me." |
| **Timetable Admin** | Timetabling office | Module 3 only: consolidated view of all demand, and full control of allocation groups (configure, validate, finalize, reopen). |

Every action a user takes is checked against their role and — for a
Department User — their specific department, on the server, on every
request. A department cannot make itself see or edit another department's
data by manipulating the page; the server independently re-checks who is
asking before doing anything.

## 2.4 The end-to-end flow at a glance

```
 ┌────────────────────┐
 │  MODULE 1           │   A department (e.g. CSIT) defines a course.
 │  Course Definition   │   "Offered By" = CSIT (fixed, not editable).
 │                      │   "Offered To" = any other departments CSIT picks.
 └─────────┬────────────┘
           │
           ▼
 ┌────────────────────┐
 │  MODULE 2            │   CSIT itself, and every department it offered
 │  Course Selection    │   the course to, each independently:
 │  & Demand            │     - see the course in their own list
 │                      │     - enter a student count
 │                      │     - Save Draft, or Submit (locks it)
 └─────────┬────────────┘
           │  (only SUBMITTED demand moves forward)
           ▼
 ┌────────────────────┐
 │  MODULE 3            │   Timetable Admin:
 │  Section Allocation  │     - sees every department's submitted count for
 │                      │       this course, side by side, never merged
 │                      │     - the system computes required sections,
 │                      │       a default 50:50 cluster split, and a live
 │                      │       allocation matrix
 │                      │     - configures capacity / clusters / specialization
 │                      │     - validates (8 checks) and Finalizes
 └────────────────────┘
```

---

# 3. Module 1 — Course Master / Course Definition

## 3.1 Purpose

Module 1 is where a course comes into existence. Every course in the system
— regardless of who later requests it — starts here, created by the
department that teaches it.

## 3.2 Who uses it

Every Department User (via `/department/courses`), for their own
department's courses only. The Super Admin has a parallel, unrestricted view
(`/courses`) for full catalog administration and bulk CSV import, but the
day-to-day act of "our department is adding a new elective" happens through
the department's own login.

## 3.3 Preconditions

- The department is logged in.
- The shared master data this course will reference already exists:
  Regulation, Semester, Course Category, Course Type. (These are Super
  Admin-managed and are expected to exist before a department starts adding
  courses against them; if a needed Course Type is missing, a department
  user can add one on the fly from within the course form.)

## 3.4 Screen: Course Definition

![Course Definition — a department's own course list](screenshots/09-dept-course-definition-light.png)

![Add Course — Offered By is locked to the logged-in department](screenshots/10-dept-course-form-light.png)

## 3.5 Step-by-step workflow

1. The department opens **Course Definition** and clicks **Add Course**.
2. They fill in:
   - **Regulation** and **Semester** (dropdowns, from shared master data)
   - **Course Code** and **Course Name**
   - **Course Category** (e.g. PCC, PEC-1…5, OE-1/2, AUC, BSC, ESC)
   - **L / T / P / S** (lecture/tutorial/practical/self-study hours),
     **Contact Hours**, **Credits**
   - **Course Type** (Theory, Lab, Theory cum Lab, Project, Mandatory
     Non-Credit Course — extensible, not a fixed list)
   - **Course Coordinator Name** and **Coordinator Employee ID**
3. **Offered By Department** is shown on the form but is **not editable** —
   it is pre-filled with, and locked to, the department that is logged in.
   This is enforced by the server, not just disabled in the UI: even a
   crafted request that tries to submit a different department ID here is
   silently corrected back to the session's own department before the
   course is saved.
4. **Offered To Departments** is a checkbox grid of every other active
   department. The department picks zero or more. (Their own department is
   excluded from this list — it's implied automatically, since "offered by"
   already means they can see it.)
5. On save, the system checks the course code is unique across the whole
   catalog (not just within the department) and creates the course with
   `status: Active`.
6. The course now immediately appears:
   - In this department's own **Course Definition** list (editable, with
     Edit / Archive actions).
   - In **Module 2's "Course Selection & Demand"** list for this department
     itself *and* for every department it was offered to.

## 3.6 Editing and archiving

- A department can **edit** only courses it created (`offeredByDepartment`
  matches its own department ID — checked server-side on every edit
  request, including attempts to reassign ownership, which are rejected).
  Ownership of a course, once created, cannot be transferred by editing.
- **Archive** is a soft delete: the course's status becomes `Archived`. It
  disappears from active selection everywhere (Module 2 will no longer offer
  it), but the record itself — and any demand history tied to it — is kept,
  not deleted. This preserves the academic record for audit purposes.
- A Super Admin can also **Activate/Deactivate** a course (toggle between
  Active and Inactive) — a lighter-weight, reversible pause distinct from
  archiving.

## 3.7 Super Admin's parallel capability

The Super Admin's `/courses` page is the same underlying data with no
department restriction: they can create a course for any department, edit
any course (including reassigning departments), and — uniquely — bulk-import
courses from a CSV file, with a downloadable sample template, full
row-by-row validation before import, and a downloadable CSV of any rows that
failed validation so they can be corrected and re-uploaded.

---

# 4. Module 2 — Course Selection & Demand

## 4.1 Purpose

Module 2 turns "a course exists and is offered to us" into a concrete
number: how many students from this department actually want to take it,
this regulation, this semester. That number is what Module 3 will eventually
turn into sections.

## 4.2 Who uses it

Every Department User, through the same login used for Module 1, via
**Course Selection & Demand** (`/department/demand`).

## 4.3 Visibility rule

A department sees a course in this list if, and only if:

```
offeredByDepartment == this department       (they created it themselves)
                    OR
this department ∈ offeredToDepartments        (someone else offered it to them)
```

This is evaluated on the server for every request — a department cannot see
demand-entry screens for courses that were never made visible to them.

## 4.4 Screen: Course Selection & Demand

![Course Selection & Demand — every course visible to this department](screenshots/11-dept-demand-list-light.png)

![Single-course demand entry — one Student Count field](screenshots/12-dept-demand-entry-light.png)

## 4.5 Step-by-step workflow

1. The department opens **Course Selection & Demand**. They see every
   visible course with its current status: **Not Started**, **Draft**,
   **Submitted**, or **Reopened**, plus filters for category, regulation,
   semester, and status.
2. For a course that's **Not Started**, they click **Enter Demand**, which
   opens a single-field form: **Student Count**.
3. They can:
   - **Save Draft** — the number is stored, the course moves to **Draft**
     status, and it remains editable.
   - **Submit** — the same save happens, and the record is locked
     (**Submitted** status). A submit with a student count of zero is
     rejected — a department must enter an actual number before submitting.
4. Once **Submitted**, the entry becomes read-only for that department. It
   also now appears in `/department/submitted`, a filtered read-only list of
   everything this department has locked in.
5. If something needs to change after submission (a correction, a change in
   projected enrollment), the department cannot edit it themselves — they
   need the **Timetable Admin** to **Reopen** it (done from Module 3's
   Consolidated Demand screen). Reopening flips the status back to
   **Reopened**, which is editable again exactly like a draft; the
   department then edits and re-submits.
6. Duplicate demand for the same course, department, regulation, and
   semester is structurally impossible — the database enforces uniqueness
   on that combination, so there is never more than one live demand number
   per department per course.

## 4.6 What Module 2 deliberately does *not* do

- It does not let a department create a new course. All courses come from
  Module 1; Module 2 only ever shows courses that already exist.
- It does not ask for a breakdown *within* a department (no "how many of
  your students are in section A vs. section B"). Because every department
  in this system (including CSE-1, CSE-2, HTE, HTR, …) is already the
  smallest unit that matters for this workflow, one number per department
  per course is the complete picture.

---

# 5. Module 3 — Section Allocation & Live Calculation

## 5.1 Purpose

Module 3 is where all of the individually-submitted department demand for a
course gets turned into an actual plan: how many sections are needed, how
those sections are split into two clusters, which department's students
land in which cluster, and — ultimately — a locked, audited record of
exactly how many students are in which section.

## 5.2 Who uses it

Only the Timetable Admin. Department Users have no access to Module 3 at
all; Super Admin can view but the workflow described here — configuring and
finalizing an allocation — is exclusive to the Timetable Admin role.

## 5.3 Where the input comes from

Module 3 only ever looks at demand records with status **Submitted**.
Drafts and reopened-but-not-yet-resubmitted records are invisible to it —
they are, by definition, not final yet.

## 5.4 Grouping rule (how courses become "allocation groups")

This is the single most important rule in Module 3, and it is enforced
structurally, not just by convention:

> **One allocation group per course.** If the same course is offered by one
> department and taken up by several others, all of their submitted demand
> for that *exact course* combines into one group with one combined total.
> If two different courses happen to sit in the same category (for example,
> two different PEC-4 electives — "Cloud Computing" and "Data Mining" are
> both PEC-4), they are **never** combined. Each gets its own group, its own
> total, its own section count, its own cluster split, and its own
> finalization.

Grouping by category alone would be wrong — a student count for "Cloud
Computing" and a student count for "Data Mining" describe two different
classes that need two different timetable slots, even though administratively
they're filed under the same elective category.

## 5.5 Consolidated Demand — the admin's first view

Before diving into an individual allocation group, the Timetable Admin can
open **Consolidated Demand**: a read-only report of every submitted demand
record, grouped by course and then by department, with each department's
number shown separately (never pre-summed into a single "the department"
figure) and a **Reopen** action next to any department row that needs to be
sent back for correction.

![Consolidated Demand — grouped by course, then by department](screenshots/15-admin-consolidated-demand-light.png)

## 5.6 The Allocation Dashboard

**Allocation Dashboard** lists one row per course that has at least one
submitted demand record: category, code, name, regulation, semester, the
list of participating departments, total students, current section
capacity, required sections, and the current Cluster 1 / Cluster 2 split.
Clicking a row opens that course's allocation detail screen.

![Allocation Dashboard — one row per course with submitted demand](screenshots/16-admin-allocation-dashboard-light.png)

## 5.7 Allocation detail — the live calculation engine

This is a single screen with several coordinated panels, all driven by the
same underlying numbers, updating together as configuration changes.

![Allocation detail — capacity/cluster/specialization config, live calculation, and the section matrix, side by side](screenshots/17-admin-allocation-detail-light.png)

### 5.7.1 Section Capacity, Clusters & Specialization Mapping

- **Section Capacity** — how many students fit in one section. Defaults to
  60, but is fully editable per allocation group. Changing it immediately
  recalculates required sections and — because the old matrix layout no
  longer applies — clears any manual matrix overrides that were made under
  the previous capacity (they were computed for a section count that no
  longer exists, so keeping them would silently misallocate students).
- **Cluster 1 Sections** — how many of the required sections belong to
  Cluster 1 (the rest go to Cluster 2). Defaults to a balanced 50:50 split,
  with a one-click **Reset to 50:50**. Also fully editable, with the same
  override-clearing behavior when changed.
- **Specialization → Cluster mapping** — a free-text label per participating
  department (not a fixed list, not a department name — just a label the
  Timetable Admin chooses, e.g. "Core," "Advanced," "Track A") mapped to
  Cluster 1 or Cluster 2. A department left **Unassigned** is deliberately
  **not** defaulted into Cluster 1 — instead its students are spread evenly
  across *every* section. Defaulting unassigned departments into one cluster
  would guarantee that cluster overflows capacity before the admin has even
  had a chance to configure the mapping; spreading them avoids that trap.

### 5.7.2 Live Calculation panel

Shown as a fully transparent, step-by-step derivation, not just a final
number:

- **A. Input Demand** — every participating department and its submitted
  count.
- **B. Department Totals** — the same numbers, one line per department.
- **C. Grand Total** — the literal sum, shown as an equation
  (`180 + 175 + 160 + 170 + 120 + 100 = 905`).
- **D. Section Calculation** — `grandTotal ÷ sectionCapacity`, then
  `CEILING(...)` to get the required whole number of sections.
- **E. Cluster Calculation** — how many sections in Cluster 1 vs. Cluster 2,
  and what percentage of the total that represents.
- **F. Ratio Calculation** — each department's share of the grand total, as
  a percentage.
- **Section Utilization** — a table of every section with its capacity,
  current allocation, remaining seats, and utilization percentage, with any
  over-capacity section highlighted.

### 5.7.3 Section Allocation Matrix

A Department × Section grid. Each cell shows how many of that department's
students land in that section, computed by evenly spreading the
department's demand across its assigned cluster's section range (or across
all sections, if unassigned). Before finalization, any cell can be manually
edited — the admin can hand-adjust the automatic split — and an
over-capacity section is highlighted so it's impossible to miss.

### 5.7.4 Live Validation

Eight checks run continuously and must **all** pass before Finalize is
enabled:

1. Student totals match (allocated total equals submitted demand total)
2. Capacity valid (no section exceeds its capacity)
3. No missing allocation (every department's demand is fully placed)
4. No duplicate allocation (no department is over-allocated)
5. Cluster totals match (no student allocated outside their department's
   assigned cluster range)
6. Course verified
7. Category verified
8. Submitted demand is present (nothing to allocate isn't a valid state to
   finalize)

Any failing check is shown with a specific, actionable detail (e.g. exactly
which department is under-allocated and by how much), not just a generic
"invalid" message.

### 5.7.5 Finalize and Reopen

- **Finalize** is only enabled once all 8 validation checks pass. Finalizing
  takes a snapshot of the entire live matrix — every department, every
  section, every cell — writes it as the permanent record, stamps who
  finalized it and when, and writes an entry to the **Audit Log**. A
  finalized group becomes fully read-only.
- **Reopen** (also logged to the Audit Log, with who and when) puts a
  finalized group back into an editable state if something needs to change.
  It will need to pass validation and be finalized again before it's
  considered locked once more.

### 5.7.6 Reports

Six CSV exports available from the allocation detail screen, for handing off
to downstream timetabling: course-wise, category-wise, department-wise,
allocation detail (per-department specialization/cluster/allocation),
section-wise, and cluster summary.

---

# 6. Roles & Permissions Summary

| Capability | Super Admin | Department User | Timetable Admin |
|---|:---:|:---:|:---:|
| Manage departments, categories, regulations, semesters, course types | ✅ | — | — |
| View/edit/import the full course catalog | ✅ | Own department's courses only | — |
| Define a course (Module 1) | ✅ (any department) | ✅ (own department only) | — |
| Submit course demand (Module 2) | — | ✅ (own department only) | — |
| View consolidated demand (all departments) | — | — | ✅ (read-only) |
| Reopen a submitted demand record | — | — | ✅ |
| Configure / finalize / reopen an allocation group (Module 3) | — | — | ✅ |

---

# 7. Appendix

## 7.1 Demo credentials

All demo accounts share the password `Password123!`.

| Role | Email |
|---|---|
| Super Admin | ramesh.babu@kluniversity.in |
| Timetable Admin | lakshmi.priya@kluniversity.in |
| Department (CSE-1 … CSE-4, ECE, CSIT, AIDS, HTE, HTR, HTI) | hod.\<code\>@kluniversity.in, e.g. hod.cse1@kluniversity.in |

## 7.2 Glossary

- **Allocation group** — the Module 3 unit of work: one specific course's
  combined, submitted demand, tracked from draft calculation through to a
  finalized section plan.
- **Cluster** — one of two halves the required sections are split into
  (Cluster 1 / Cluster 2), used to keep related specializations' students
  together within a contiguous range of sections.
- **Specialization** — a free-text label the Timetable Admin assigns to a
  department within one allocation group, used only to decide which cluster
  that department's students belong to.
- **Section** — one physical/timetable class instance of a course, with a
  fixed capacity.
- **Offered By / Offered To** — the two department-reference fields on a
  course: who created and teaches it, and who else it's made visible to for
  Module 2 demand entry.
