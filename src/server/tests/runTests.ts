import { runSecurityTestSuite } from './securityTests.ts';

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
  console.log(`SUMMARY: ${report.passedTests}/${report.totalTests} tests passed (${Math.round((report.passedTests / report.totalTests) * 100)}%)`);
  console.log('----------------------------------------------------');

  if (report.failedTests > 0) {
    process.exit(1);
  } else {
    console.log('ALL SECURITY & DUPLICATE PREVENTIONS ENFORCED PROPERLY.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
