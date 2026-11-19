const path = require('path');
const fs = require('fs');
const { initializeDatabase, executeRun } = require('../backend/dist/backend/src/database/db');
const { ingestionService } = require('../backend/dist/backend/src/services/ingestionService');
const { scannerService } = require('../backend/dist/backend/src/services/scannerService');
const { reportService } = require('../backend/dist/backend/src/services/reportService');
const { projectRepository } = require('../backend/dist/backend/src/database/repositories/projectRepository');
const { analysisRepository } = require('../backend/dist/backend/src/database/repositories/analysisRepository');

async function seedDemoProjects() {
  console.log('================================================================================');
  console.log('             PROJECT GHOSTCODE — SEEDING DEMONSTRATION PROJECTS                ');
  console.log('================================================================================');

  await initializeDatabase();
  console.log('✓ SQLite database schema and capability tables initialized.');

  // Clean old demo projects
  await executeRun('DELETE FROM analysis_runs');
  await executeRun('DELETE FROM analysis_issues');
  await executeRun('DELETE FROM project_files');
  await executeRun('DELETE FROM project_languages');
  await executeRun('DELETE FROM generated_reports');
  await executeRun('DELETE FROM projects');
  console.log('✓ Existing project tables purged for fresh demonstration seeding.');

  const demoFolders = [
    {
      name: 'COBOL Financial & Loan Core',
      relPath: 'examples/cobol',
      description: 'Production-grade commercial banking ledger and loan amortization suite in COBOL.'
    },
    {
      name: 'FORTRAN Numerical & Orbital Dynamics',
      relPath: 'examples/fortran',
      description: 'High-performance scientific linear algebra solver and Runge-Kutta orbital simulation.'
    },
    {
      name: 'TypeScript Microservice Suite',
      relPath: 'examples/typescript',
      description: 'Distributed enterprise microservice pipeline with AST validation and async workflows.'
    },
    {
      name: 'Python Statistics & Analytics',
      relPath: 'examples/python',
      description: 'Numerical statistics, variance calculation, and financial CAGR growth models.'
    },
    {
      name: 'C++ Geometry & Math Subsystem',
      relPath: 'examples/cpp',
      description: '3D coordinate distance geometry and aspect scale calculations with bounds guards.'
    },
    {
      name: 'Java Payment Gateway Service',
      relPath: 'examples/java',
      description: 'Enterprise transaction processor with BigDecimal precision and currency validation.'
    }
  ];

  const rootDir = path.resolve(__dirname, '..');
  const seededProjects = [];

  for (const item of demoFolders) {
    const absPath = path.join(rootDir, item.relPath);
    if (!fs.existsSync(absPath)) {
      console.warn(`! Directory ${item.relPath} does not exist, skipping.`);
      continue;
    }

    console.log(`\n--- Ingesting ${item.name} (${item.relPath}) ---`);
    try {
      const project = await ingestionService.importProjectFolder(absPath, item.name);
      const files = await projectRepository.getProjectFiles(project.id);
      const langs = await projectRepository.getProjectLanguages(project.id);
      const primaryLang = langs.length > 0 ? langs[0].languageId : 'unknown';
      const totalLoc = files.reduce((acc, f) => acc + f.loc, 0);

      console.log(`✓ Project registered: ID=${project.id}, Lang=${primaryLang}, Files=${files.length}, TotalLOC=${totalLoc}`);

      console.log(`  Running Autopsy Scanner on ${item.name}...`);
      const scanRun = await scannerService.runProjectScan(project.id);
      const issues = await analysisRepository.getIssuesByRun(scanRun.id);
      console.log(`  ✓ Scan completed: RunID=${scanRun.id}, Issues=${issues.length}, Score=${scanRun.healthScore}/100`);

      console.log(`  Generating Code Health Report...`);
      const reportId = await reportService.generateProjectHealthReport(project.id);
      console.log(`  ✓ Health Report generated: ID=${reportId}`);

      seededProjects.push({
        id: project.id,
        name: project.name,
        lang: primaryLang,
        files: files.length,
        loc: totalLoc,
        findings: issues.length,
        score: scanRun.healthScore
      });
    } catch (err) {
      console.error(`✗ Error seeding ${item.name}:`, err.message);
    }
  }

  console.log('\n================================================================================');
  console.log('SEEDED DEMONSTRATION PROJECTS SUMMARY:');
  console.log('--------------------------------------------------------------------------------');
  console.log(' PROJECT NAME                        | LANG       | FILES | LOC   | ISSUES | SCORE');
  console.log('--------------------------------------------------------------------------------');
  for (const p of seededProjects) {
    console.log(` ${p.name.padEnd(35)} | ${p.lang.padEnd(10)} | ${String(p.files).padStart(5)} | ${String(p.loc).padStart(5)} | ${String(p.findings).padStart(6)} | ${p.score}/100`);
  }
  console.log('================================================================================');
  console.log('Demo projects seeded and analyzed. Dashboard is primed with live diagnostic data.\n');
}

seedDemoProjects().then(() => process.exit(0)).catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
