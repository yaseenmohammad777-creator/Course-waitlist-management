# Course Waitlist Management Service

A focused Node.js implementation of enrollment, dropping, and FIFO waitlist promotion for **one course offering**. It uses an in-memory store and a small command-line interface (CLI), with no external dependencies.

## Features

- Enroll eligible learners while seats are available.
- Waitlist eligible learners when the offering is full, without duplicates.
- On a successful drop, promote the earliest **currently eligible** waitlisted learner.
- Skip and retain temporarily ineligible waitlisted learners in their relative order.
- Validate requests, prerequisites, and configuration; return clear status objects.
- Protect capacity and membership invariants.

## Requirements

- Node.js 18 or newer
- No third-party packages or database

## Quick start

From the project root in **Windows PowerShell**:

```powershell
npm.cmd test
npm.cmd start
```

On shells where npm scripts are not restricted, use `npm test` and `npm start`.

The CLI starts with offering `ENG-201`, capacity **2**, prerequisite `ENG-101`, and four learner records: `ada`, `grace`, and `linus` satisfy the prerequisite; `turing` does not.

### Example CLI session

Enter these commands after `npm.cmd start`:

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

The first two learners take the available seats; Linus joins the waitlist and is promoted when Ada drops. Turing is initially ineligible; after updating the record, Turing can request enrollment and will be waitlisted if the offering remains full.

Other commands: `record <learnerId> [completedCourseId,...]`, `help`, `quit` (or `exit`). The `record` command replaces a learner's completed-course list; it does not append to it.

## Service API

`EnrollmentService` takes `courseId`, a positive integer `capacity`, an array of `prerequisites`, and `learnerRecords` keyed by learner ID with arrays of completed course IDs.

| Method | Purpose |
| --- | --- |
| `enroll(learnerId)` | Enroll or waitlist an eligible learner; reject invalid or duplicate requests. |
| `drop(learnerId)` | Drop an enrolled learner and attempt waitlist promotion. |
| `updateLearnerRecord(learnerId, completedCourses)` | Replace a learner's completed courses, subject to enrolled-learner prerequisite protection. |
| `getSnapshot()` | Return copies of the current enrolled and waitlist arrays and capacity information. |

Mutating methods return structured status and message fields. See [DESIGN.md](DESIGN.md) for invariants and design decisions, and [AI-USE.md](AI-USE.md) for the AI-assistance and verification record.

## Design assumptions and limitations

- A learner must have a record and satisfy **all** prerequisites to enroll or join the waitlist.
- Duplicate requests do not create duplicate enrollments or queue entries.
- On a successful drop, the service scans the waitlist in FIFO order, promotes the first eligible learner, and retains skipped ineligible learners in their existing relative order.
- Changing an enrolled learner's record cannot remove a required prerequisite.
- **Promotion is triggered by a successful drop, not by updating a learner record.** If an empty seat exists and a waitlisted learner later becomes eligible, that update alone will not fill the seat. This is a known limitation of the bounded implementation.
- Data is stored only in memory and is reset on process exit.
- Synchronous single-process methods do not interleave during execution, but there is no cross-process locking, durable transaction, authentication, frontend, catalog, or multi-offering support.

 ## Project Structure
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
└── package.json

## Verification
Testing and Verification
The application was verified through automated tests and manual command-line scenarios.

Test Results
Test Category	Result
Automated Tests	PASS: 8/8
Manual Scenario A	PASS
Manual Scenario B	PASS
Run Automated Tests
npm.cmd test
Run the Application
npm.cmd start
Test Evidence
Detailed test execution results are available in TEST-RESULTS.md.

The evidence includes:
Automated test execution output
Enrollment and capacity validation
Duplicate enrollment prevention
Prerequisite validation
FIFO waitlist promotion
Waitlist eligibility changes
Invalid and repeated withdrawal handling


## Test Evidence

Detailed execution results are available in Test-results.md.

The evidence includes automated test output and manual scenarios covering enrollment, capacity, duplicate prevention, prerequisite validation, FIFO promotion, and waitlist eligibility changes.
