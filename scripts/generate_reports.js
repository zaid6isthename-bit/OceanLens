const fs = require('fs');
const path = require('path');

const coverageSummaryPath = path.resolve(process.cwd(), 'coverage', 'coverage-summary.json');
const reportDir = path.resolve(process.cwd(), 'reports');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

function writeCoverageSummary() {
  if (!fs.existsSync(coverageSummaryPath)) {
    fs.writeFileSync(path.join(reportDir, 'coverage-summary.md'), '# Coverage summary not found\n');
    console.log('No coverage summary found at', coverageSummaryPath);
    process.exitCode = 0;
    return;
  }

  const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  let md = '# Coverage Summary\n\n';
  for (const [file, data] of Object.entries(summary)) {
    md += `## ${file}\n`;
    const totals = data.total || data;
    md += `- Lines: ${totals.lines.pct}% (${totals.lines.covered}/${totals.lines.total})\n`;
    md += `- Statements: ${totals.statements.pct}% (${totals.statements.covered}/${totals.statements.total})\n`;
    md += `- Functions: ${totals.functions.pct}% (${totals.functions.covered}/${totals.functions.total})\n`;
    md += `- Branches: ${totals.branches.pct}% (${totals.branches.covered}/${totals.branches.total})\n\n`;
  }
  fs.writeFileSync(path.join(reportDir, 'coverage-summary.md'), md);
  console.log('Wrote coverage summary to reports/coverage-summary.md');
}

function writeArchitectureValidation() {
  const checks = [
    'prisma/schema.prisma',
    'lib/providerManager.ts',
    'pages/api/search.ts',
    'lib/supabase.ts',
    'lib/redis.ts'
  ];
  let md = '# Architecture Validation Report\n\n';
  for (const p of checks) {
    const exists = fs.existsSync(path.resolve(process.cwd(), p));
    md += `- ${p}: ${exists ? 'FOUND' : 'MISSING'}\n`;
  }
  md += '\n> Note: This is a lightweight validation — run deeper static analysis for full validation.\n';
  fs.writeFileSync(path.join(reportDir, 'architecture-validation.md'), md);
  console.log('Wrote architecture validation to reports/architecture-validation.md');
}

writeCoverageSummary();
writeArchitectureValidation();
