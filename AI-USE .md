# AI-Assisted Engineering: Development and Verification Record

## 1. Project objective

This assessment covers enrollment, dropping, and FIFO waitlist promotion for a **single course offering**. The implementation must validate prerequisites, enforce capacity, prevent duplicate membership, handle invalid requests, and provide focused tests and design documentation. Because no starter application was supplied, the assignment's permitted in-memory service/CLI fallback was used.

## 2. Prompt record and requirements

### Recorded initial AI prompt

> Read the attached PDF and understand the requirement.

The assignment PDF was provided as context. **This is the initial prompt recorded in the project notes.** Any additional prompts actually used in the VS Code assistant should be appended verbatim, in chronological order, before submission.

### Engineering requirements used to guide and review the solution

The following is a **requirements breakdown**, not a verbatim transcript of additional AI prompts:

- **Enrollment:** Validate learner IDs and records; require all configured prerequisites; enroll eligible learners when capacity remains; otherwise waitlist them.
- **Duplicates:** Do not create duplicate enrollment or waitlist membership, and preserve an existing waitlist position.
- **Dropping and promotion:** On a successful drop, remove the enrolled learner and promote the earliest currently eligible waitlisted learner. Skip but retain temporarily ineligible learners in their original relative order.
- **Integrity:** Never exceed capacity; never have a learner in both enrolled and waitlisted collections; reject invalid requests without corrupting state.
- **Verification:** Test normal enrollment, full capacity, duplicate requests, FIFO promotion, prerequisite failures, invalid and repeated drops, and waitlist eligibility changes.
- **Scope:** Keep one offering, no frontend or database, and document concurrency and persistence limitations.

## 3. AI contribution summary

AI assistance helped interpret the assignment and structure a minimal Node.js solution. The resulting design uses an in-memory service, a command-line demonstration interface, focused tests, and written documentation. The implementation checks prerequisites before enrollment and again during promotion, returns explicit operation statuses, and checks key state invariants.

## 4. Engineering decisions and resulting files

| Decision | Rationale | Files |
| --- | --- | --- |
| Use a synchronous in-memory service for one offering | Fits the assessment's fallback and avoids unnecessary infrastructure | `src/enrollment-service.js`, `src/cli.js` |
| Store enrolled IDs in a `Set`, learner records in a `Map`, and waitlist IDs in an array | Supports uniqueness, keyed lookup, and ordered FIFO scanning | `src/enrollment-service.js` |
| Recheck eligibility during promotion and retain skipped learners | Enforces prerequisites without discarding a waiting learner's position | `src/enrollment-service.js`, `test/enrollment-service.test.js`, `DESIGN.md` |
| Support learner-record updates while waitlisted, but protect enrolled learners' prerequisites | Allows eligibility to change without invalidating current enrollments | `src/enrollment-service.js`, `test/enrollment-service.test.js` |
| Keep frontend, persistence, multiple offerings, authentication, and distributed locking outside scope | Avoids features not required for this bounded exercise | `README.md`, `DESIGN.md` |

The first four rows describe implemented choices or refinements; the last is an intentional scope exclusion, not necessarily a rejected AI suggestion. If an actual AI suggestion was rejected, record the original suggestion and why it was rejected.

## 5. Implementation and verification

### Components

- `src/enrollment-service.js`: business rules, state management, prerequisite checks, promotion, and invariants.
- `src/cli.js`: interactive demonstration commands.
- `test/enrollment-service.test.js`: automated scenarios using Node.js's built-in test runner.
- `README.md`: setup, commands, behavior, and limitations.
- `DESIGN.md`: service boundary, invariants, concurrency approach, and tradeoffs.

### Recorded execution evidence

The earlier project record states that **8 automated tests passed** using `npm.cmd test` in Windows PowerShell. It also records a CLI smoke test using `node .\src\cli.js` with these commands:

```text
enroll ada
enroll grace
enroll linus
drop ada
show
quit
```

The tests exercise available and full capacity, duplicate requests, FIFO promotion, prerequisites, invalid and repeated drops, skip-and-retain behavior, and invalid configuration. These are **reported historical results**, not a claim that the updated submission has been rerun or independently executed here.

For the final submission, rerun:

```powershell
npm.cmd test
npm.cmd start
```

Save the actual test output (including test count and failures) and check the CLI state transitions against expected results. Add the execution date and any corrections made after review.

### Independent review evidence to complete

Document checks only after performing them:

- [ ] Confirm that `enroll()` validates ID, record, duplicates, prerequisites, and capacity in the expected order.
- [ ] Confirm that `drop()` removes only enrolled learners and calls waitlist promotion.
- [ ] Confirm that `findIndex()` selects the earliest currently eligible learner and that `splice()` retains skipped entries.
- [ ] Confirm capacity, waitlist uniqueness, and disjoint-membership invariants.
- [ ] Confirm that returned snapshots cannot be used to mutate internal membership.
- [ ] Run the automated suite and a manual CLI smoke test; save actual output.

## 6. Limitations and follow-up risks

- **Volatile state:** Enrollment and learner records are lost when the process exits.
- **Single offering:** No multi-course or multi-term registration.
- **Concurrency:** Synchronous methods run without `await` in one Node.js process; there is no cross-process coordination or durable transaction.
- **Promotion trigger:** Promotion occurs after a successful drop. If a seat is vacant and a waitlisted learner becomes eligible after a record update, that update alone does not trigger promotion.
- **No production integrations:** No authentication, external identity, database, frontend, or deployment workflow.

## 7. Summary

AI was used to assist requirements interpretation and implementation. The project remains intentionally scoped to one offering, with explicit business rules and focused verification. Submission evidence should distinguish the AI contribution from independently performed review and testing; only completed checks and actual prompts should be reported as such.
