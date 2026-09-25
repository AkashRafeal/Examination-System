import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

interface AssessmentData {
  status: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  startedAt: Date;
  submittedAt: Date | null;
}

interface UserWithAssessments {
  id: string;
  name: string;
  email: string;
  assessments: AssessmentData[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required.' }, { status: 400 });
    }

    // Fetch batch info
    const batch = await db.userBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
    }

    // Fetch all users in the batch with their latest assessment
    const users = await db.user.findMany({
      where: { batchId },
      orderBy: { name: 'asc' },
      include: {
        assessments: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            status: true,
            score: true,
            percentage: true,
            correctAnswers: true,
            incorrectAnswers: true,
            unanswered: true,
            startedAt: true,
            submittedAt: true,
          },
        },
      },
    }) as UserWithAssessments[];

    // Build rows
    const rows = users.map((user: UserWithAssessments, idx: number) => {
      const assessment: AssessmentData | undefined = user.assessments[0];
      const status = assessment ? assessment.status : 'NOT_STARTED';
      const score = assessment ? assessment.score : '-';
      const percentage = assessment ? `${assessment.percentage.toFixed(1)}%` : '-';
      const correct = assessment ? assessment.correctAnswers : '-';
      const incorrect = assessment ? assessment.incorrectAnswers : '-';
      const unanswered = assessment ? assessment.unanswered : '-';
      const startedAt = assessment?.startedAt
        ? new Date(assessment.startedAt).toLocaleString('en-IN')
        : '-';
      const submittedAt = assessment?.submittedAt
        ? new Date(assessment.submittedAt).toLocaleString('en-IN')
        : '-';

      return {
        '#': idx + 1,
        'Candidate Name': user.name,
        'Login Email': user.email,
        'Status': status,
        'Score (/50)': score,
        'Percentage': percentage,
        'Correct Answers': correct,
        'Incorrect Answers': incorrect,
        'Unanswered': unanswered,
        'Started At': startedAt,
        'Submitted At': submittedAt,
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // #
      { wch: 28 },  // Candidate Name
      { wch: 32 },  // Login Email
      { wch: 14 },  // Status
      { wch: 12 },  // Score
      { wch: 12 },  // Percentage
      { wch: 16 },  // Correct
      { wch: 18 },  // Incorrect
      { wch: 12 },  // Unanswered
      { wch: 22 },  // Started At
      { wch: 22 },  // Submitted At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Exam Results');

    // Add a summary sheet
    const completedUsers = users.filter((u: UserWithAssessments) => u.assessments[0]?.status === 'COMPLETED');
    const notStarted = users.filter((u: UserWithAssessments) => u.assessments.length === 0).length;
    const completedAssessments = completedUsers.map((u: UserWithAssessments) => u.assessments[0]!);

    const avgScore =
      completedAssessments.length > 0
        ? (
            completedAssessments.reduce((s: number, a: AssessmentData) => s + a.score, 0) /
            completedAssessments.length
          ).toFixed(1)
        : 'N/A';

    const avgPct =
      completedAssessments.length > 0
        ? (
            completedAssessments.reduce((s: number, a: AssessmentData) => s + a.percentage, 0) /
            completedAssessments.length
          ).toFixed(1) + '%'
        : 'N/A';

    const summaryData = [
      { 'Field': 'Batch Name', 'Value': batch.batchName },
      { 'Field': 'Source File', 'Value': batch.fileName },
      { 'Field': 'Total Candidates', 'Value': users.length },
      { 'Field': 'Tests Completed', 'Value': completedUsers.length },
      { 'Field': 'Tests Not Started', 'Value': notStarted },
      { 'Field': 'Average Score (/50)', 'Value': avgScore },
      { 'Field': 'Average Percentage', 'Value': avgPct },
      { 'Field': 'Generated On', 'Value': new Date().toLocaleString('en-IN') },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Generate buffer and convert to ArrayBuffer for NextResponse BodyInit compatibility
    const xlsxRaw = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    // Build a safe filename
    const safeFileName = `Exam_Results_${batch.batchName.replace(/[^a-zA-Z0-9_\-]/g, '_')}.xlsx`;

    return new NextResponse(xlsxRaw, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('[export-excel] Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
