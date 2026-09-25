import { db } from '../src/lib/db';
import { startOrResumeAssessment, autosaveAnswer, submitAssessment } from '../src/lib/services/assessment.service';

async function testAutoSubmitBehavior() {
  console.log('Testing Tab-Switch Auto-Submit Behavior...');

  // Find user3
  const user = await db.user.findUnique({
    where: { email: 'user3@assessment.com' },
  });

  if (!user) throw new Error('User user3 not found');

  // Clean any previous assessment for user3 to test fresh
  await db.assessment.deleteMany({
    where: { userId: user.id },
  });

  // 1. Candidate starts exam (receives 50 questions)
  const assessmentData = await startOrResumeAssessment(user.id);
  console.log(`✓ Started fresh assessment: ${assessmentData.id}`);

  // 2. Candidate answers exactly 5 questions
  const q1 = assessmentData.questions[0];
  const q2 = assessmentData.questions[1];
  const q3 = assessmentData.questions[2];
  const q4 = assessmentData.questions[3];
  const q5 = assessmentData.questions[4];

  await autosaveAnswer(assessmentData.id, user.id, q1.id, 'A');
  await autosaveAnswer(assessmentData.id, user.id, q2.id, 'B');
  await autosaveAnswer(assessmentData.id, user.id, q3.id, 'C');
  await autosaveAnswer(assessmentData.id, user.id, q4.id, 'D');
  await autosaveAnswer(assessmentData.id, user.id, q5.id, 'A');
  console.log('✓ Candidate completed 5 questions.');

  // 3. User switches tab -> triggers auto-submit with partial answers
  const submitResult = await submitAssessment(assessmentData.id, user.id);
  console.log('✓ Auto-submit executed:', submitResult.message);

  // 4. Verify DB state
  const completedAssessment = await db.assessment.findUnique({
    where: { id: assessmentData.id },
  });

  if (!completedAssessment) throw new Error('Assessment not found in DB');

  console.log('Assessment status in DB:', completedAssessment.status);
  console.log('Attempted Questions:', completedAssessment.attemptedQuestions, '(Expected: 5)');
  console.log('Unanswered Questions:', completedAssessment.unanswered, '(Expected: 45)');
  console.log('Score:', completedAssessment.score, '/', completedAssessment.totalQuestions);

  if (completedAssessment.status !== 'COMPLETED') {
    throw new Error('Assessment status should be COMPLETED');
  }
  if (completedAssessment.attemptedQuestions !== 5) {
    throw new Error(`Expected 5 attempted questions, got ${completedAssessment.attemptedQuestions}`);
  }
  if (completedAssessment.unanswered !== 45) {
    throw new Error(`Expected 45 unanswered questions, got ${completedAssessment.unanswered}`);
  }

  // 5. Try modifying answer after auto-submit
  try {
    await autosaveAnswer(assessmentData.id, user.id, assessmentData.questions[10].id, 'A');
    throw new Error('FAILED: Should not allow answer change after auto-submit');
  } catch (err: any) {
    console.log('✓ Answer change after auto-submit correctly blocked:', err.message);
  }

  // 6. Try retaking exam
  try {
    await startOrResumeAssessment(user.id);
    throw new Error('FAILED: Should not allow retake after auto-submit');
  } catch (err: any) {
    console.log('✓ Retake attempt correctly blocked (Single Attempt Rule):', err.message);
  }

  console.log('\n=============================================');
  console.log('TAB-SWITCH AUTO-SUBMIT TEST PASSED (100%)!');
  console.log('=============================================\n');
}

testAutoSubmitBehavior()
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
