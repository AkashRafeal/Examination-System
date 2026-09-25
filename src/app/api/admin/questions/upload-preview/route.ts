import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import {
  extractTextFromBuffer,
  parseQuestionsFromText,
} from '@/lib/parsers/question-parser';
import { annotateDuplicates } from '@/lib/parsers/validator';

const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '20', 10);
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    // Validate extension
    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');
    const isDocx = lowerName.endsWith('.docx');

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: 'Only .pdf and .docx files are supported.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const extractedText = await extractTextFromBuffer(
      buffer,
      isPdf ? 'pdf' : 'docx'
    );

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from the document. The file may be empty or scanned images without OCR.' },
        { status: 400 }
      );
    }

    // Parse questions
    const parseResult = parseQuestionsFromText(extractedText, fileName);

    if (parseResult.questions.length === 0) {
      return NextResponse.json(
        {
          error:
            'Could not identify any questions in this document. Please check that questions follow standard numbering and option formats (e.g. 1. Question... A. Option...).',
          extractedSnippet: extractedText.slice(0, 1000),
        },
        { status: 422 }
      );
    }

    // Annotate possible duplicates from the DB
    await annotateDuplicates(parseResult.questions);

    return NextResponse.json({
      success: true,
      data: parseResult,
    });
  } catch (error: any) {
    console.error('Document upload/preview error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing the document.' },
      { status: 500 }
    );
  }
}
