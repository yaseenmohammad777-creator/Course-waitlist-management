# Design specification

## Service boundary and data model

`EnrollmentService` owns one configured course offering. Its constructor receives a course ID, positive integer capacity, required prerequisite course IDs, and learner records mapping learner IDs to completed course IDs. It has no network, persistence, or framework dependencies. The CLI is a local demonstration adapter; tests call the service directly.

The service keeps:

- Enrolled learner IDs in an insertion-ordered set.
- Waitlisted learner IDs in a FIFO array.
- A completed-course set for each learner ID.
- The offering's prerequisite set and capacity.

The synchronous methods are `updateLearnerRecord`, `enroll`, `drop`, and `getSnapshot`. Mutating methods return explicit status results for invalid requests, unknown learners, prerequisite failures, duplicates, and successful operations. Invalid or repeated drops leave state unchanged.

## Invariants

1. Enrolled count never exceeds configured capacity.
2. A learner appears at most once in the waitlist.
3. A learner cannot be both enrolled and waitlisted.
4. An ineligible learner is never newly enrolled, added to the waitlist, or promoted.
5. A duplicate enrollment request does not change membership or queue order.
6. A drop only changes state when the learner is enrolled.

The service checks structural invariants after every successful state mutation. Snapshot arrays are copies, so callers cannot mutate internal membership state through read results.

## Enrollment and capacity

The service validates the learner ID and requires a learner record. It rejects duplicates before changing state. Eligibility requires every configured prerequisite to appear in the learner's completed-course record. If the learner is eligible and a seat is available, the learner is enrolled; otherwise, the learner is appended to the waitlist. If full and already waiting, repeat requests return `already_waitlisted` with the current position.

## Drop and waitlist promotion

A drop for a non-enrolled learner returns `not_enrolled` without changing state. A valid drop frees one seat and scans the waitlist from the front. It removes and promotes the first learner who currently satisfies all prerequisites. Ineligible entries encountered during the scan remain in their prior relative order, so they are skipped rather than discarded. If none are eligible, the seat remains open.

Learner records can be updated while a learner is waiting. The update is rejected if it would make an enrolled learner fail a required prerequisite. The next drop re-evaluates all waitlisted learners against the then-current records.

## Concurrency and persistence

The implementation is synchronous and single-process. In one Node.js event loop, each method executes without an `await`, so method calls do not interleave during a state transition. This is not a cross-process locking or durable transaction guarantee. There is no database in scope. A persistent implementation must atomically validate eligibility and capacity, perform the enrollment/drop, and promote the next eligible learner; it should use a transaction or an equivalent per-offering lock and add a focused concurrency test.

## Tradeoffs and limitations

The supplied workspace had no course-registration starter project, so the assignment's minimal in-memory service/CLI fallback is used. A single offering is configured once, and learner records are maintained in memory. There is no authentication, persistence, catalog, or multi-offering support. The waitlist retains ineligible learners by design; an administrator or upstream process can update records, and promotions re-check eligibility at the time a seat opens.
