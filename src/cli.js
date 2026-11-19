'use strict';

const readline = require('node:readline');
const { EnrollmentService } = require('./enrollment-service');

const service = new EnrollmentService({
  courseId: 'ENG-201',
  capacity: 2,
  prerequisites: ['ENG-101'],
  learnerRecords: {
    ada: ['ENG-101'],
    grace: ['ENG-101'],
    linus: ['ENG-101'],
    turing: []
  }
});

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'registration> '
});

function printHelp() {
  console.log([
    'Commands:',
    '  record <learnerId> [completedCourseId,...]',
    '  enroll <learnerId>',
    '  drop <learnerId>',
    '  show',
    '  help',
    '  quit'
  ].join('\n'));
}

console.log('Course registration demo for ENG-201 (capacity 2; prerequisite ENG-101).');
console.log('Seeded learners: ada, grace, linus (eligible), turing (missing prerequisite).');
printHelp();
prompt.prompt();

prompt.on('line', (line) => {
  const [command, learnerId, courseList = ''] = line.trim().split(/\s+/, 3);
  let result;

  switch (command) {
    case 'record':
      result = service.updateLearnerRecord(
        learnerId,
        courseList === '' ? [] : courseList.split(',')
      );
      console.log(result);
      break;
    case 'enroll':
      console.log(service.enroll(learnerId));
      break;
    case 'drop':
      console.log(service.drop(learnerId));
      break;
    case 'show':
      console.log(service.getSnapshot());
      break;
    case 'help':
      printHelp();
      break;
    case 'quit':
    case 'exit':
      prompt.close();
      return;
    case undefined:
    case '':
      break;
    default:
      console.log('Unknown command. Enter "help" to see available commands.');
  }

  prompt.prompt();
});

prompt.on('close', () => {
  console.log('Session ended. In-memory state has not been persisted.');
});
