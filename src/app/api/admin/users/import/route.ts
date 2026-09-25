import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { importCandidatesFromBuffer } from '@/lib/services/user-import.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Please select an Excel or CSV file to upload.' }, { status: 400 });
    }

    // Verify file extension
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');

    if (!isExcel) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a Microsoft Excel (.xlsx, .xls) or .csv spreadsheet.' },
        { status: 400 }
      );
    }

    // Check size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await importCandidatesFromBuffer(buffer, file.name);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.totalProcessed} candidates. Created ${result.totalCreated} new accounts.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error importing candidate roster:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process candidate spreadsheet.' },
      { status: 400 }
    );
  }
}
