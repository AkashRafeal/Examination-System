import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Public self-registration is permanently disabled.
  // Candidate accounts must be provisioned exclusively by the examination administrator via Excel/CSV.
  return NextResponse.json(
    {
      error:
        'Public self-registration is disabled. Candidate accounts must be provisioned exclusively by the examination administrator.',
    },
    { status: 403 }
  );
}
