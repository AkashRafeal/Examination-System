import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export interface RawCandidateRow {
  name: string;
  email?: string;
}

export interface GeneratedCandidateCredential {
  name: string;
  username: string;
  email: string;
  plainPassword: string;
  status: 'CREATED' | 'ALREADY_EXISTS' | 'ERROR';
  errorMessage?: string;
}

export interface ImportRosterResult {
  totalProcessed: number;
  totalCreated: number;
  totalSkipped: number;
  credentials: GeneratedCandidateCredential[];
  csvContent: string;
  batchId: string;
  batchName: string;
}

/**
 * Generates a clean, normalized base username from a full name.
 * E.g., "Alex Johnson Jr." -> "alex.johnson"
 */
export function generateBaseUsername(name: string): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (cleaned.length === 0) {
    return 'candidate';
  }
  if (cleaned.length === 1) {
    return cleaned[0];
  }
  return `${cleaned[0]}.${cleaned[1]}`;
}

/**
 * Generates candidate password as first name in lowercase + "@123".
 * E.g., "Saanvi Bose" -> "saanvi@123", "Ananya Singh" -> "ananya@123"
 */
export function generateCandidatePassword(name: string): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const firstName = cleaned.length > 0 ? cleaned[0] : 'user';
  return `${firstName}@123`;
}

/**
 * Generates a secure, memorable 8-10 character random password.
 * Format: Prefix + Symbol + 4 Digits (e.g. Exam!4829, Pass#7391)
 */
export function generateSecurePassword(): string {
  const prefixes = ['Exam', 'Pass', 'Test', 'Cert', 'Grad', 'Eval', 'User', 'Hero'];
  const symbols = ['!', '@', '#', '$', '*', '?'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const digits = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
  return `${prefix}${symbol}${digits}`;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV buffer into a list of candidate names.
 */
export function parseCandidateWorkbook(buffer: Buffer): RawCandidateRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The uploaded Excel document does not contain any sheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('The uploaded document is empty or does not contain valid tabular rows.');
  }

  const candidateRows: RawCandidateRow[] = [];

  for (const row of jsonData) {
    // Tolerant column header matching for Candidate Name
    let nameVal = '';
    let emailVal = '';

    for (const [key, val] of Object.entries(row)) {
      const normalizedKey = key.trim().toLowerCase().replace(/[^a-z]/g, '');

      if (
        ['name', 'fullname', 'candidatename', 'studentname', 'username', 'user'].includes(
          normalizedKey
        ) &&
        typeof val === 'string' &&
        val.trim()
      ) {
        nameVal = val.trim();
      }

      if (
        ['email', 'emailaddress', 'mail', 'candidateemail'].includes(normalizedKey) &&
        typeof val === 'string' &&
        val.trim()
      ) {
        emailVal = val.trim().toLowerCase();
      }
    }

    // Fallback: If no header matched 'name', check first non-empty column
    if (!nameVal) {
      const firstEntry = Object.values(row).find(
        (v) => typeof v === 'string' && v.trim().length > 1
      );
      if (firstEntry && typeof firstEntry === 'string') {
        nameVal = firstEntry.trim();
      }
    }

    if (nameVal) {
      candidateRows.push({
        name: nameVal,
        email: emailVal || undefined,
      });
    }
  }

  if (candidateRows.length === 0) {
    throw new Error(
      'Could not detect candidate names in the uploaded document. Please ensure a column named "Name" or "Candidate Name" exists.'
    );
  }

  return candidateRows;
}

/**
 * Imports candidates, generates usernames/passwords, persists in DB,
 * and compiles the credentials CSV for the administrator.
 */
export async function importCandidatesFromBuffer(buffer: Buffer, originalFileName: string = 'candidates'): Promise<ImportRosterResult> {
  const rawCandidates = parseCandidateWorkbook(buffer);

  // Fetch existing users to avoid username/email collisions
  const existingUsers = await db.user.findMany({
    select: { email: true },
  });
  const existingEmails = new Set(existingUsers.map((u: { email: string }) => u.email.toLowerCase()));

  const credentials: GeneratedCandidateCredential[] = [];
  const assignedUsernames = new Set<string>();

  // Helper to ensure guaranteed uniqueness
  const getUniqueUsername = (base: string): string => {
    let candidateUsername = base;
    let counter = 1;

    while (
      assignedUsernames.has(candidateUsername) ||
      existingEmails.has(candidateUsername) ||
      existingEmails.has(`${candidateUsername}@assessment.com`)
    ) {
      counter++;
      candidateUsername = `${base}${counter}`;
    }

    assignedUsernames.add(candidateUsername);
    return candidateUsername;
  };

  // Strip extension for a friendly batch name
  const batchName = originalFileName.replace(/\.[^.]+$/, '');

  // Create a UserBatch record for this import session
  const userBatch = await db.userBatch.create({
    data: {
      fileName: originalFileName,
      batchName,
      totalCandidates: 0, // Will be updated after processing
    },
  });

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const raw of rawCandidates) {
    try {
      const baseUsername = generateBaseUsername(raw.name);
      let username = getUniqueUsername(baseUsername);

      // Candidate email defaults to username@assessment.com or their provided email
      let email = raw.email ? raw.email.toLowerCase() : `${username}@assessment.com`;

      // If provided email already exists, skip
      if (existingEmails.has(email)) {
        credentials.push({
          name: raw.name,
          username,
          email,
          plainPassword: '(Already Exists)',
          status: 'ALREADY_EXISTS',
          errorMessage: `An account with email/username "${email}" already exists.`,
        });
        totalSkipped++;
        continue;
      }

      const plainPassword = generateCandidatePassword(raw.name);
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      // Create candidate user linked to the batch
      await db.user.create({
        data: {
          name: raw.name,
          email,
          passwordHash,
          role: 'USER',
          isActive: true,
          batchId: userBatch.id,
        },
      });

      existingEmails.add(email);

      credentials.push({
        name: raw.name,
        username,
        email,
        plainPassword,
        status: 'CREATED',
      });
      totalCreated++;
    } catch (err: any) {
      credentials.push({
        name: raw.name,
        username: 'error',
        email: 'error',
        plainPassword: 'N/A',
        status: 'ERROR',
        errorMessage: err.message || 'Failed to create user record',
      });
      totalSkipped++;
    }
  }

  // Build CSV content string
  const csvLines: string[] = [];
  csvLines.push('Candidate Name,Username,Login Email,Temporary Password,Status,Creation Date');

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  for (const cred of credentials) {
    const escapedName = `"${cred.name.replace(/"/g, '""')}"`;
    const escapedUsername = `"${cred.username.replace(/"/g, '""')}"`;
    const escapedEmail = `"${cred.email.replace(/"/g, '""')}"`;
    const escapedPassword = `"${cred.plainPassword.replace(/"/g, '""')}"`;
    const escapedStatus = `"${cred.status}"`;

    csvLines.push(
      `${escapedName},${escapedUsername},${escapedEmail},${escapedPassword},${escapedStatus},"${nowStr}"`
    );
  }

  const csvContent = csvLines.join('\r\n');

  // Update batch with actual created count
  await db.userBatch.update({
    where: { id: userBatch.id },
    data: { totalCandidates: totalCreated },
  });

  return {
    totalProcessed: rawCandidates.length,
    totalCreated,
    totalSkipped,
    credentials,
    csvContent,
    batchId: userBatch.id,
    batchName,
  };
}

/**
 * Generates a clean CSV sample template for administrators.
 */
export function generateSampleCandidateTemplate(): string {
  return [
    'Candidate Name,Email (Optional)',
    'John Smith,john.smith@example.com',
    'Sarah Connor,',
    'Michael Chang,',
    'Emily Watson,emily.watson@university.edu',
  ].join('\r\n');
}
