import { runSecurityTestSuite } from './securityTests.ts';
import { runSupabaseSecurityAudit } from './supabaseSecurityTests.ts';

async function main() {
  console.log('====================================================');
  console.log('RUNNING STUDENT ACADEMIC DIARY SECURITY TEST SUITE');
  console.log('====================================================\n');

  const report = await runSecurityTestSuite();

  report.results.forEach((r) => {
    const symbol = r.passed ? '✓ PASSED' : '✗ FAILED';
    console.log(`[${symbol}] ${r.id}: ${r.name}`);
    console.log(`   Expected: ${r.expectedStatus} | Actual: ${r.actualStatus}`);
    if (r.details) {
      console.log(`   Details: ${r.details}`);
    }
  });

  console.log('\n----------------------------------------------------');
  console.log(`DIARY TEST SUMMARY: ${report.passedTests}/${report.totalTests} tests passed (${Math.round((report.passedTests / report.totalTests) * 100)}%)`);
  console.log('----------------------------------------------------\n');

  console.log('====================================================');
  console.log('RUNNING SUPABASE RLS & DATABASE SECURITY AUDIT');
  console.log('====================================================\n');

  const supaAudit = runSupabaseSecurityAudit();

  supaAudit.checks.forEach((c) => {
    const symbol = c.passed ? '✓ PASSED' : '✗ FAILED';
    console.log(`[${symbol}] ${c.id}: ${c.name}`);
    console.log(`   Requirement: ${c.requirement}`);
    console.log(`   Details: ${c.details}`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`SUPABASE AUDIT SUMMARY: ${supaAudit.passed}/${supaAudit.total} checks passed (${Math.round((supaAudit.passed / supaAudit.total) * 100)}%)`);
  console.log('----------------------------------------------------');

  if (report.failedTests > 0 || supaAudit.failed > 0) {
    process.exit(1);
  } else {
    console.log('\nALL 35 SECURITY ASSERTIONS & RLS POLICIES VERIFIED SUCCESSFULLY.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
