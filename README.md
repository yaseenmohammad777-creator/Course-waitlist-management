# Course Waitlist Management Service

A focused Node.js implementation of enrollment, dropping, and FIFO waitlist promotion for **one course offering**. It uses in-memory storage and a command-line interface (CLI), with no third-party dependencies.

## Features

- Enroll eligible learners while seats are available.
- Waitlist eligible learners when the course is full, without duplicates.
- On a successful drop, promote the earliest **currently eligible** waitlisted learner.
- Skip and retain temporarily ineligible waitlisted learners in their original relative order.
- Validate requests, prerequisites, and configuration with clear result statuses.
- Enforce capacity and membership invariants.

## Requirements

- Node.js 18 or newer
- No third-party packages or database

## Quick Start

From the project root in **Windows PowerShell**, run the tests:

```powershell
npm.cmd test
```

Start the interactive CLI:

```powershell
npm.cmd start
```

In shells without PowerShell script restrictions, use `npm test` and `npm start`.

The CLI starts with offering `ENG-201`, capacity **2**, prerequisite `ENG-101`, and four learner records. `ada`, `grace`, and `linus` satisfy the prerequisite; `turing` does not.

### Example CLI Session

Enter these commands after starting the CLI:

```text
enroll ada
enroll grace
enroll linus
show
drop ada
show
enroll turing
record turing ENG-101
enroll turing
show
quit
```

Ada and Grace take the available seats. Linus joins the waitlist and is automatically promoted when Ada drops. Turing initially fails the prerequisite check. After `record turing ENG-101`, Turing becomes eligible and can join the waitlist while the offering remains full.

Other commands include `record <learnerId> [completedCourseId,...]`, `help`, `quit`, and `exit`. The `record` command **replaces** a learner's completed-course list; it does not append to it.

## Service API

`EnrollmentService` accepts a `courseId`, a positive integer `capacity`, an array of `prerequisites`, and `learnerRecords` keyed by learner ID, with arrays of completed course IDs.

| Method | Purpose |
| --- | --- |
| `enroll(learnerId)` | Enroll or waitlist an eligible learner; return a clear status for invalid or duplicate requests. |
| `drop(learnerId)` | Drop an enrolled learner and attempt waitlist promotion. |
| `updateLearnerRecord(learnerId, completedCourses)` | Replace a learner's completed courses while protecting enrolled learners' prerequisite eligibility. |
| `getSnapshot()` | Return copies of the current enrollment and waitlist arrays plus capacity information. |

Mutating methods return structured status and message fields. See [DESIGN.md](DESIGN.md) for invariants and design decisions, and [AI-USE.md](AI-USE.md) for the AI-assistance and verification record.

## Design Assumptions and Limitations

- A learner must have a record and satisfy **all** prerequisites before enrolling or joining the waitlist.
- Duplicate requests do not create duplicate enrollments or waitlist entries.
- On a successful drop, the service scans the waitlist in FIFO order, promotes the first eligible learner, and retains skipped ineligible learners in their original relative order.
- An enrolled learner's record cannot be changed to remove a required prerequisite.
- **Promotion is triggered by a successful drop, not by a learner-record update.** If a seat is already vacant and a waitlisted learner later becomes eligible, updating the record alone does not fill the seat. This is a known limitation.
- State is stored only in memory and resets when the process exits.
- Synchronous methods run without interleaving in a single Node.js process, but the prototype has no cross-process locking, durable transactions, authentication, frontend, catalog, or multi-offering support.

## Project Structure

```text
course-waitlist-management/
├── src/
│   ├── enrollment-service.js
│   └── cli.js
├── test/
│   └── enrollment-service.test.js
├── evidence/
│   ├── TEST-OUTPUT.txt
│   ├── SCENARIO-A-INPUT.txt
│   ├── SCENARIO-A-OUTPUT.txt
│   ├── SCENARIO-B-INPUT.txt
│   └── SCENARIO-B-OUTPUT.txt
├── README.md
├── DESIGN.md
├── AI-USE.md
├── Test-results.md
├── package.json
└── .gitignore
```

## Testing and Verification

The service was checked with Node.js automated tests and two recorded manual CLI scenarios.

### Test Execution Summary

| Test Category | Recorded Result |
| --- | --- |
| Automated tests | **PASS: 8/8** (0 failures, 0 skipped) |
| Manual Scenario A | **PASS** |
| Manual Scenario B | **PASS** |

### Run Automated Tests

```powershell
npm.cmd test
```

### Run the Application

```powershell
npm.cmd start
```

Enter `help` for the command list and `quit` to exit.

### Manual Verification

**Scenario A: Enrollment and validation**

- Successful enrollment and capacity enforcement
- Waitlist creation and automatic FIFO promotion
- Prerequisite rejection and record update
- Duplicate enrollment and waitlist prevention
- Invalid requests, unknown learners, and repeated drops

**Scenario B: Waitlist eligibility changes**

- Temporary ineligibility while waitlisted
- Skipping and retaining an ineligible learner
- Promotion of the next eligible learner
- Later promotion after prerequisite eligibility is restored

### Test Evidence

The [Test Execution Report](Test-results.md) summarizes the recorded results. The supporting inputs and outputs are available below:

- [Automated Test Output](evidence/TEST-OUTPUT.txt)
- [Scenario A Input](evidence/SCENARIO-A-INPUT.txt)
- [Scenario A Output](evidence/SCENARIO-A-OUTPUT.txt)
- [Scenario B Input](evidence/SCENARIO-B-INPUT.txt)
- [Scenario B Output](evidence/SCENARIO-B-OUTPUT.txt)

The recorded automated run completed with **8 tests passed and 0 failed**. The two documented CLI sequences produced their expected results. These scenarios demonstrate the bounded service behavior; they are not a claim of production readiness or exhaustive testing.
