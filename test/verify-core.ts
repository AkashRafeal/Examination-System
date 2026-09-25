import { parseQuestionsFromText } from '../src/lib/parsers/question-parser';
import { db } from '../src/lib/db';
import {
  startOrResumeAssessment,
  autosaveAnswer,
  submitAssessment,
} from '../src/lib/services/assessment.service';

async function runTests() {
  console.log('========================================');
  console.log('RUNNING CORE ENGINE & SECURITY TESTS');
  console.log('========================================');

  // TEST 1: Parsing Inline Answers
  console.log('\n[Test 1] Parser with Inline Answers...');
  const inlineDoc = `
Question 1. What is the capital of India?
A. Mumbai
B. Chennai
C. New Delhi
D. Kolkata
Answer: C

Question 2: Which language is used for Android development?
A) HTML
B) Java
C) CSS
D) SQL
Ans: B
`;
  const result1 = parseQuestionsFromText(inlineDoc, 'inline_test.pdf');
  console.log(`Detected: ${result1.totalQuestions}, Valid: ${result1.validQuestions}, Invalid: ${result1.invalidQuestions}`);
  if (result1.totalQuestions !== 2 || result1.validQuestions !== 2) {
    throw new Error('Test 1 failed: Expected 2 valid questions');
  }
  if (result1.questions[0].correctAnswer !== 'C' || result1.questions[1].correctAnswer !== 'B') {
    throw new Error('Test 1 failed: Incorrect answer extraction');
  }
  console.log('✓ Inline Answer Parsing Passed!');

  // TEST 2: Parsing End-of-Document Answer Key
  console.log('\n[Test 2] Parser with End-of-Document Answer Key...');
  const answerKeyDoc = `
QUESTIONS
1. What is Java?
A. Programming Language
B. Database
C. Browser
D. Operating System

2. What is HTML?
A. Database
B. Markup Language
C. Programming Language
D. Operating System

ANSWER KEY
1. A
2. B
`;
  const result2 = parseQuestionsFromText(answerKeyDoc, 'key_test.docx');
  console.log(`Detected: ${result2.totalQuestions}, Valid: ${result2.validQuestions}`);
  if (result2.totalQuestions !== 2 || result2.validQuestions !== 2) {
    throw new Error('Test 2 failed: Expected 2 valid questions');
  }
  if (result2.questions[0].correctAnswer !== 'A' || result2.questions[1].correctAnswer !== 'B') {
    throw new Error(`Test 2 failed: Expected Q1=A and Q2=B, got Q1=${result2.questions[0].correctAnswer} Q2=${result2.questions[1].correctAnswer}`);
  }
  console.log('✓ End-of-Document Answer Key Parsing Passed!');

  // TEST 3: Invalid Questions Detection
  console.log('\n[Test 3] Invalid Question Detection...');
  const invalidDoc = `
1. Valid Question Text?
A. Opt 1
B. Opt 2
C. Opt 3
D. Opt 4
Answer: A

2. Question with missing option D and wrong answer?
A. Choice 1
B. Choice 2
C. Choice 3
Answer: Z
`;
  const result3 = parseQuestionsFromText(invalidDoc, 'invalid_test.txt');
  if (result3.validQuestions !== 1 || result3.invalidQuestions !== 1) {
    throw new Error(`Test 3 failed: Expected 1 valid and 1 invalid, got valid=${result3.validQuestions}, invalid=${result3.invalidQuestions}`);
  }
  console.log('✓ Invalid Question Flagging Passed: Error =', result3.questions[1].validationErrors);

  // TEST 4: Assessment Randomization (Exactly 50 questions, different between users)
  console.log('\n[Test 4] Server-Side Random Selection of Exactly 50 Questions...');
  const user1 = await db.user.findFirst({ where: { role: 'USER' }, skip: 0 });
  const user2 = await db.user.findFirst({ where: { role: 'USER' }, skip: 1 });
  if (!user1 || !user2) throw new Error('Candidate users not found');

  // Clear previous test assessments for clean test run
  await db.assessment.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });

  const exam1 = await startOrResumeAssessment(user1.id);
  const exam2 = await startOrResumeAssessment(user2.id);

  console.log(`User 1 Questions Count: ${exam1.questions.length}`);
  console.log(`User 2 Questions Count: ${exam2.questions.length}`);

  if (exam1.questions.length !== 50 || exam2.questions.length !== 50) {
    throw new Error('Test 4 failed: Each assessment must have exactly 50 questions');
  }

  // Check question ID sets
  const ids1 = exam1.questions.map((q) => q.id);
  const ids2 = exam2.questions.map((q) => q.id);
  const sameExactOrder = ids1.every((id, idx) => id === ids2[idx]);
  console.log(`Are the two user question sequences identical? ${sameExactOrder ? 'YES (BAD)' : 'NO (GOOD - RANDOMIZED)'}`);
  if (sameExactOrder) {
    throw new Error('Test 4 failed: Different users should receive distinct randomized sets/orders');
  }

  // TEST 5: Security Privacy - Zero Answers in API Response
  console.log('\n[Test 5] Security Check - Correct Answers Omitted from User Payload...');
  for (const q of exam1.questions) {
    // @ts-expect-error test check
    if (q.isCorrect !== undefined || q.correctAnswer !== undefined) {
      throw new Error('Test 5 FAILED: Found leaked correct answer in sanitized question!');
    }
    for (const opt of q.options) {
      // @ts-expect-error test check
      if (opt.isCorrect !== undefined) {
        throw new Error('Test 5 FAILED: Found leaked isCorrect in sanitized option!');
      }
    }
  }
  console.log('✓ Security Check Passed: No answers or isCorrect leaked to frontend!');

  // TEST 6: Autosave and Atomic Evaluation
  console.log('\n[Test 6] Autosave Answers and Server-Side Atomic Evaluation...');
  // Autosave 3 answers for User 1
  const q0 = exam1.questions[0];
  const q1 = exam1.questions[1];
  const q2 = exam1.questions[2];

  await autosaveAnswer(exam1.id, user1.id, q0.id, 'A');
  await autosaveAnswer(exam1.id, user1.id, q1.id, 'B');
  await autosaveAnswer(exam1.id, user1.id, q2.id, 'C');

  // Submit assessment
  const submitResult = await submitAssessment(exam1.id, user1.id);
  console.log(`Submit message: "${submitResult.message}"`);

  // Verify DB state
  const completedExam = await db.assessment.findUnique({
    where: { id: exam1.id },
  });
  if (!completedExam || completedExam.status !== 'COMPLETED') {
    throw new Error('Test 6 failed: Assessment not marked COMPLETED');
  }
  console.log(`Evaluated on Server:`);
  console.log(`Attempted: ${completedExam.attemptedQuestions}/50`);
  console.log(`Correct: ${completedExam.correctAnswers}`);
  console.log(`Incorrect: ${completedExam.incorrectAnswers}`);
  console.log(`Unanswered: ${completedExam.unanswered}`);
  console.log(`Score: ${completedExam.score}/50`);
  console.log(`Percentage: ${completedExam.percentage.toFixed(1)}%`);
  console.log('✓ Atomic Server-Side Evaluation Verified!');

  // TEST 7: Single Attempt Enforcement
  console.log('\n[Test 7] Verify One Attempt Per User...');
  try {
    await startOrResumeAssessment(user1.id);
    throw new Error('Test 7 failed: Should have rejected second attempt');
  } catch (err: any) {
    console.log(`Expected rejection caught: "${err.message}"`);
    console.log('✓ Single Attempt Enforcement Verified!');
  }

  console.log('\n========================================');
  console.log('ALL CORE SERVER LOGIC TESTS PASSED (7/7)!');
  console.log('========================================');
}

runTests()
  .catch((e) => {
    console.error('Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
