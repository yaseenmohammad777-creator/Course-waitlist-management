'use strict';

function normalizeId(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return value.trim();
}

function normalizeCourseList(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const courses = [];
  for (const item of value) {
    const courseId = normalizeId(item);
    if (courseId === null) {
      return null;
    }
    courses.push(courseId);
  }
  return [...new Set(courses)];
}

class EnrollmentService {
  #courseId;
  #capacity;
  #prerequisites;
  #learnerRecords;
  #enrolled;
  #waitlist;

  constructor({ courseId, capacity, prerequisites = [], learnerRecords = {} }) {
    const normalizedCourseId = normalizeId(courseId);
    const normalizedPrerequisites = normalizeCourseList(prerequisites);

    if (normalizedCourseId === null) {
      throw new TypeError('courseId must be a non-empty string');
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new TypeError('capacity must be a positive integer');
    }
    if (normalizedPrerequisites === null) {
      throw new TypeError('prerequisites must be an array of non-empty course IDs');
    }
    if (
      learnerRecords === null ||
      typeof learnerRecords !== 'object' ||
      Array.isArray(learnerRecords)
    ) {
      throw new TypeError('learnerRecords must be an object keyed by learner ID');
    }

    this.#courseId = normalizedCourseId;
    this.#capacity = capacity;
    this.#prerequisites = new Set(normalizedPrerequisites);
    this.#learnerRecords = new Map();
    this.#enrolled = new Set();
    this.#waitlist = [];

    for (const [learnerId, completedCourses] of Object.entries(learnerRecords)) {
      const normalizedLearnerId = normalizeId(learnerId);
      const normalizedCompletedCourses = normalizeCourseList(completedCourses);
      if (normalizedLearnerId === null || normalizedCompletedCourses === null) {
        throw new TypeError('learnerRecords must contain valid learner IDs and course lists');
      }
      this.#learnerRecords.set(normalizedLearnerId, new Set(normalizedCompletedCourses));
    }
  }

  updateLearnerRecord(learnerId, completedCourses) {
    const normalizedLearnerId = normalizeId(learnerId);
    const normalizedCompletedCourses = normalizeCourseList(completedCourses);

    if (normalizedLearnerId === null || normalizedCompletedCourses === null) {
      return {
        status: 'invalid_request',
        message: 'Provide a learner ID and an array of completed course IDs.'
      };
    }

    const completed = new Set(normalizedCompletedCourses);
    if (
      this.#enrolled.has(normalizedLearnerId) &&
      !this.#isEligibleWith(completed)
    ) {
      return {
        status: 'prerequisite_violation',
        learnerId: normalizedLearnerId,
        message: 'An enrolled learner cannot lose a required prerequisite.'
      };
    }

    this.#learnerRecords.set(normalizedLearnerId, completed);
    this.#assertInvariants();
    return {
      status: 'learner_record_updated',
      learnerId: normalizedLearnerId,
      message: 'Learner record updated.'
    };
  }

  enroll(learnerId) {
    const normalizedLearnerId = normalizeId(learnerId);
    if (normalizedLearnerId === null) {
      return {
        status: 'invalid_request',
        message: 'Provide a non-empty learner ID.'
      };
    }

    if (!this.#learnerRecords.has(normalizedLearnerId)) {
      return {
        status: 'unknown_learner',
        learnerId: normalizedLearnerId,
        message: 'Add a learner record before requesting enrollment.'
      };
    }
    if (this.#enrolled.has(normalizedLearnerId)) {
      return {
        status: 'already_enrolled',
        learnerId: normalizedLearnerId,
        message: 'Learner is already enrolled.'
      };
    }
    if (this.#waitlist.includes(normalizedLearnerId)) {
      return {
        status: 'already_waitlisted',
        learnerId: normalizedLearnerId,
        position: this.#waitlist.indexOf(normalizedLearnerId) + 1,
        message: 'Learner is already on the waitlist.'
      };
    }
    if (!this.#isEligible(normalizedLearnerId)) {
      return {
        status: 'prerequisite_not_met',
        learnerId: normalizedLearnerId,
        message: 'Learner has not completed all required prerequisites.'
      };
    }

    if (this.#enrolled.size < this.#capacity) {
      this.#enrolled.add(normalizedLearnerId);
      this.#assertInvariants();
      return {
        status: 'enrolled',
        learnerId: normalizedLearnerId,
        seatsRemaining: this.#capacity - this.#enrolled.size,
        message: 'Enrollment successful.'
      };
    }

    this.#waitlist.push(normalizedLearnerId);
    this.#assertInvariants();
    return {
      status: 'waitlisted',
      learnerId: normalizedLearnerId,
      position: this.#waitlist.length,
      message: 'Course is full; learner added to the waitlist.'
    };
  }

  drop(learnerId) {
    const normalizedLearnerId = normalizeId(learnerId);
    if (normalizedLearnerId === null) {
      return {
        status: 'invalid_request',
        message: 'Provide a non-empty learner ID.'
      };
    }
    if (!this.#enrolled.has(normalizedLearnerId)) {
      return {
        status: 'not_enrolled',
        learnerId: normalizedLearnerId,
        message: 'Learner is not enrolled; no state was changed.'
      };
    }

    this.#enrolled.delete(normalizedLearnerId);
    const promotedLearnerId = this.#promoteNextEligible();
    this.#assertInvariants();
    return {
      status: 'dropped',
      learnerId: normalizedLearnerId,
      promotedLearnerId,
      seatsRemaining: this.#capacity - this.#enrolled.size,
      message: promotedLearnerId === null
        ? 'Enrollment dropped; no eligible learner was waiting.'
        : `Enrollment dropped; ${promotedLearnerId} was promoted.`
    };
  }

  getSnapshot() {
    return {
      courseId: this.#courseId,
      capacity: this.#capacity,
      seatsRemaining: this.#capacity - this.#enrolled.size,
      enrolled: [...this.#enrolled],
      waitlist: [...this.#waitlist]
    };
  }

  #isEligible(learnerId) {
    return this.#isEligibleWith(this.#learnerRecords.get(learnerId));
  }

  #isEligibleWith(completedCourses) {
    if (!completedCourses) {
      return false;
    }
    for (const prerequisite of this.#prerequisites) {
      if (!completedCourses.has(prerequisite)) {
        return false;
      }
    }
    return true;
  }

  #promoteNextEligible() {
    const index = this.#waitlist.findIndex((learnerId) => this.#isEligible(learnerId));
    if (index === -1) {
      return null;
    }

    const [learnerId] = this.#waitlist.splice(index, 1);
    this.#enrolled.add(learnerId);
    return learnerId;
  }

  #assertInvariants() {
    if (this.#enrolled.size > this.#capacity) {
      throw new Error('Enrollment capacity invariant violated.');
    }

    const waitlisted = new Set(this.#waitlist);
    if (waitlisted.size !== this.#waitlist.length) {
      throw new Error('Waitlist uniqueness invariant violated.');
    }
    for (const learnerId of this.#enrolled) {
      if (waitlisted.has(learnerId)) {
        throw new Error('Enrollment and waitlist membership invariant violated.');
      }
    }
  }
}

module.exports = { EnrollmentService };
