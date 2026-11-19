'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { EnrollmentService } = require('../src/enrollment-service');

function createService(options = {}) {
  return new EnrollmentService({
    courseId: 'ENG-201',
    capacity: 2,
    prerequisites: ['ENG-101'],
    learnerRecords: {
      ada: ['ENG-101'],
      grace: ['ENG-101'],
      linus: ['ENG-101'],
      turing: [],
      margaret: ['ENG-101']
    },
    ...options
  });
}

test('enrolls eligible learners while capacity remains', () => {
  const service = createService();

  assert.equal(service.enroll('ada').status, 'enrolled');
  assert.equal(service.enroll('grace').status, 'enrolled');
  assert.deepEqual(service.getSnapshot(), {
    courseId: 'ENG-201',
    capacity: 2,
    seatsRemaining: 0,
    enrolled: ['ada', 'grace'],
    waitlist: []
  });
});

test('queues eligible learners once when full and rejects duplicate enrollment', () => {
  const service = createService();
  service.enroll('ada');
  service.enroll('grace');

  assert.equal(service.enroll('linus').status, 'waitlisted');
  assert.equal(service.enroll('linus').status, 'already_waitlisted');
  assert.deepEqual(service.getSnapshot().waitlist, ['linus']);
});

test('dropping an enrolled learner promotes the earliest eligible waitlisted learner', () => {
  const service = createService();
  service.enroll('ada');
  service.enroll('grace');
  service.enroll('linus');
  service.enroll('margaret');

  const result = service.drop('ada');

  assert.equal(result.status, 'dropped');
  assert.equal(result.promotedLearnerId, 'linus');
  assert.deepEqual(service.getSnapshot().enrolled, ['grace', 'linus']);
  assert.deepEqual(service.getSnapshot().waitlist, ['margaret']);
});

test('skips and retains an ineligible waitlisted learner during promotion', () => {
  const service = createService();
  service.enroll('ada');
  service.enroll('grace');
  service.enroll('linus');
  service.enroll('margaret');
  service.updateLearnerRecord('linus', []);

  const result = service.drop('ada');

  assert.equal(result.promotedLearnerId, 'margaret');
  assert.deepEqual(service.getSnapshot().enrolled, ['grace', 'margaret']);
  assert.deepEqual(service.getSnapshot().waitlist, ['linus']);
  assert.equal(service.updateLearnerRecord('linus', ['ENG-101']).status, 'learner_record_updated');
  assert.equal(service.drop('grace').promotedLearnerId, 'linus');
});

test('does not enroll or waitlist a learner missing a prerequisite', () => {
  const service = createService();

  assert.equal(service.enroll('turing').status, 'prerequisite_not_met');
  assert.deepEqual(service.getSnapshot().enrolled, []);
  assert.deepEqual(service.getSnapshot().waitlist, []);
});

test('reports invalid, unknown, and duplicate drop requests without changing state', () => {
  const service = createService();
  service.enroll('ada');
  const before = service.getSnapshot();

  assert.equal(service.enroll('   ').status, 'invalid_request');
  assert.equal(service.enroll('ada').status, 'already_enrolled');
  assert.equal(service.enroll('unknown').status, 'unknown_learner');
  assert.equal(service.drop('   ').status, 'invalid_request');
  assert.equal(service.drop('grace').status, 'not_enrolled');
  assert.deepEqual(service.getSnapshot(), before);
  assert.equal(service.drop('ada').status, 'dropped');
  assert.equal(service.drop('ada').status, 'not_enrolled');
  assert.deepEqual(service.getSnapshot().enrolled, []);
  assert.equal(service.getSnapshot().seatsRemaining, 2);
});

test('does not let an enrolled learner lose a required prerequisite', () => {
  const service = createService();
  service.enroll('ada');

  assert.equal(service.updateLearnerRecord('ada', []).status, 'prerequisite_violation');
  assert.deepEqual(service.getSnapshot().enrolled, ['ada']);
});

test('validates offering configuration', () => {
  assert.throws(() => createService({ capacity: 0 }), /capacity/);
  assert.throws(() => createService({ prerequisites: 'ENG-101' }), /prerequisites/);
});
