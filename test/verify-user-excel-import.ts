import * as XLSX from 'xlsx';
import { db } from '../src/lib/db';
import { importCandidatesFromBuffer } from '../src/lib/services/user-import.service';
import bcrypt from 'bcryptjs';

async function testCandidateExcelImportAndLogin() {
  console.log('==================================================');
  console.log('TESTING EXCEL CANDIDATE IMPORT & CREDENTIALS FLOW');
  console.log('==================================================\n');

  // 1. Create a simulated Excel workbook with candidate names
  const testCandidates = [
    { 'Candidate Name': 'Eleanor Vance', 'Email (Optional)': '' },
    { 'Candidate Name': 'Marcus Holloway', 'Email (Optional)': '' },
    { 'Candidate Name': 'Eleanor Vance', 'Email (Optional)': '' }, // Duplicate test
    { 'Candidate Name': 'Dr. Robert Neville', 'Email (Optional)': 'robert.neville@sci.org' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(testCandidates);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  console.log('[Test 1] Importing Excel Buffer...');
  const importResult = await importCandidatesFromBuffer(excelBuffer);

  console.log(`Total Processed: ${importResult.totalProcessed}`);
  console.log(`Total Created: ${importResult.totalCreated}`);
  console.log(`Total Skipped: ${importResult.totalSkipped}`);

  if (importResult.totalCreated < 3) {
    throw new Error(`Expected at least 3 created accounts, got ${importResult.totalCreated}`);
  }

  console.log('\n[Test 2] Verifying Generated Credentials:');
  for (const cred of importResult.credentials) {
    console.log(`- ${cred.name} -> Username: "${cred.username}", Email: "${cred.email}", Password: "${cred.plainPassword}", Status: ${cred.status}`);
  }

  // 2. Verify CSV content format
  console.log('\n[Test 3] Verifying Generated CSV Content:');
  console.log(importResult.csvContent.split('\r\n').slice(0, 4).join('\n'));

  if (!importResult.csvContent.includes('Candidate Name,Username,Login Email,Temporary Password')) {
    throw new Error('CSV header mismatch');
  }

  // 3. Test Database Integrity
  console.log('\n[Test 4] Verifying User Record in Database:');
  const createdUser = await db.user.findFirst({
    where: { name: 'Eleanor Vance' },
  });

  if (!createdUser) throw new Error('Candidate Eleanor Vance not found in DB');
  console.log(`✓ User saved in DB: ID ${createdUser.id}, Email ${createdUser.email}, Role ${createdUser.role}`);

  // 4. Test Password Verification
  const eleanorCred = importResult.credentials.find((c) => c.name === 'Eleanor Vance' && c.status === 'CREATED');
  if (!eleanorCred) throw new Error('Eleanor Vance credential record not found');

  const isPasswordValid = await bcrypt.compare(eleanorCred.plainPassword, createdUser.passwordHash);
  if (!isPasswordValid) throw new Error('Bcrypt password verification failed for generated password');
  console.log('✓ Plaintext password matches stored Bcrypt hash in DB!');

  // 5. Test Username and Email Login Flexibility
  console.log('\n[Test 5] Testing Username vs Email Login resolution:');
  // Exact email search
  const foundByEmail = await db.user.findUnique({
    where: { email: eleanorCred.email },
  });
  if (!foundByEmail) throw new Error('Login resolution by full email failed');
  console.log('✓ Found user by full email:', foundByEmail.email);

  // Username search (email startsWith `${username}@`)
  const foundByUsername = await db.user.findFirst({
    where: {
      OR: [
        { email: { startsWith: `${eleanorCred.username}@`, mode: 'insensitive' } },
        { email: { equals: eleanorCred.username, mode: 'insensitive' } },
      ],
    },
  });
  if (!foundByUsername) throw new Error('Login resolution by username failed');
  console.log('✓ Found user by username prefix:', eleanorCred.username);

  console.log('\n==================================================');
  console.log('ALL EXCEL IMPORT & CREDENTIAL TESTS PASSED (100%)!');
  console.log('==================================================\n');
}

testCandidateExcelImportAndLogin()
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
