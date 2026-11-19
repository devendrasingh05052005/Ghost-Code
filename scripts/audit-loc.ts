import * as fs from 'fs';
import * as path from 'path';

export interface FileLocReport {
  filePath: string;
  language: 'COBOL' | 'FORTRAN' | 'TypeScript' | 'Other';
  codeLines: number;
  commentLines: number;
  blankLines: number;
  totalLines: number;
  commentDensity: number;
  suspiciousRepetitions: number;
}

export interface LanguageSummary {
  language: string;
  fileCount: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  totalLines: number;
  commentDensity: number;
  targetLoc: number;
  targetMet: boolean;
}

export interface AuditReport {
  timestamp: string;
  rootPath: string;
  cobol: LanguageSummary;
  fortran: LanguageSummary;
  typescript: LanguageSummary;
  totalCodeLines: number;
  totalCommentLines: number;
  overallCommentDensity: number;
  commentDensityValid: boolean;
  totalProductionMet: boolean;
  excludedFileCount: number;
  excludedFiles: string[];
  suspiciousPatternsFound: number;
  fileReports: FileLocReport[];
}

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.vite',
  'coverage',
  '.system_generated',
  'vendor',
  'tmp',
  'temp'
]);

const COBOL_EXTS = new Set(['.cob', '.cbl']);
const FORTRAN_EXTS = new Set(['.f', '.for', '.f90', '.f95', '.f03', '.f08']);
const TS_EXTS = new Set(['.ts', '.tsx']);

function detectLanguage(ext: string): 'COBOL' | 'FORTRAN' | 'TypeScript' | 'Other' {
  if (COBOL_EXTS.has(ext)) return 'COBOL';
  if (FORTRAN_EXTS.has(ext)) return 'FORTRAN';
  if (TS_EXTS.has(ext)) return 'TypeScript';
  return 'Other';
}

function countCobolLines(lines: string[]): { code: number; comments: number; blanks: number; suspicious: number } {
  let code = 0;
  let comments = 0;
  let blanks = 0;
  let suspicious = 0;
  let lastNonEmpty = '';
  let repeatCount = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) {
      blanks++;
      continue;
    }

    if (trimmed === lastNonEmpty) {
      repeatCount++;
      if (repeatCount > 3) suspicious++;
    } else {
      lastNonEmpty = trimmed;
      repeatCount = 1;
    }

    const isFixedComment = rawLine.length >= 7 && (rawLine[6] === '*' || rawLine[6] === '/');
    const isFreeComment = trimmed.startsWith('*>');

    if (isFixedComment || isFreeComment) {
      comments++;
    } else if (trimmed.includes('*>')) {
      code++;
      comments++;
    } else {
      code++;
    }
  }

  return { code, comments, blanks, suspicious };
}

function countFortranLines(lines: string[], ext: string): { code: number; comments: number; blanks: number; suspicious: number } {
  let code = 0;
  let comments = 0;
  let blanks = 0;
  let suspicious = 0;
  let lastNonEmpty = '';
  let repeatCount = 0;
  const isFixed = ext === '.f' || ext === '.for';

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) {
      blanks++;
      continue;
    }

    if (trimmed === lastNonEmpty) {
      repeatCount++;
      if (repeatCount > 3) suspicious++;
    } else {
      lastNonEmpty = trimmed;
      repeatCount = 1;
    }

    let isComment = false;
    if (isFixed && rawLine.length > 0) {
      const firstChar = rawLine[0].toUpperCase();
      if (firstChar === 'C' || firstChar === '*' || firstChar === '!') {
        isComment = true;
      }
    }

    if (!isComment && trimmed.startsWith('!')) {
      isComment = true;
    }

    if (isComment) {
      comments++;
    } else if (trimmed.includes('!')) {
      code++;
      comments++;
    } else {
      code++;
    }
  }

  return { code, comments, blanks, suspicious };
}

function countTypeScriptLines(lines: string[]): { code: number; comments: number; blanks: number; suspicious: number } {
  let code = 0;
  let comments = 0;
  let blanks = 0;
  let suspicious = 0;
  let inBlockComment = false;
  let lastNonEmpty = '';
  let repeatCount = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) {
      blanks++;
      continue;
    }

    if (trimmed === lastNonEmpty) {
      repeatCount++;
      if (repeatCount > 3) suspicious++;
    } else {
      lastNonEmpty = trimmed;
      repeatCount = 1;
    }

    if (inBlockComment) {
      comments++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      comments++;
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    if (trimmed.startsWith('//')) {
      comments++;
      continue;
    }

    if (trimmed.includes('//') || trimmed.includes('/*')) {
      code++;
      comments++;
    } else {
      code++;
    }
  }

  return { code, comments, blanks, suspicious };
}

export function auditDirectory(rootDir: string): AuditReport {
  const excludedFiles: string[] = [];
  const fileReports: FileLocReport[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.has(entry.name)) {
          excludedFiles.push(`${fullPath}/* (directory excluded)`);
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const lang = detectLanguage(ext);

        if (lang === 'Other') {
          excludedFiles.push(fullPath);
          continue;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split(/\r?\n/);
        let counts = { code: 0, comments: 0, blanks: 0, suspicious: 0 };

        if (lang === 'COBOL') counts = countCobolLines(lines);
        else if (lang === 'FORTRAN') counts = countFortranLines(lines, ext);
        else if (lang === 'TypeScript') counts = countTypeScriptLines(lines);

        const activeLines = counts.code + counts.comments;
        const density = activeLines > 0 ? (counts.comments / activeLines) * 100 : 0;

        fileReports.push({
          filePath: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
          language: lang,
          codeLines: counts.code,
          commentLines: counts.comments,
          blankLines: counts.blanks,
          totalLines: lines.length,
          commentDensity: parseFloat(density.toFixed(2)),
          suspiciousRepetitions: counts.suspicious
        });
      }
    }
  }

  walk(rootDir);

  function summarize(lang: 'COBOL' | 'FORTRAN' | 'TypeScript', target: number): LanguageSummary {
    const reports = fileReports.filter(r => r.language === lang);
    const code = reports.reduce((acc, r) => acc + r.codeLines, 0);
    const comments = reports.reduce((acc, r) => acc + r.commentLines, 0);
    const blanks = reports.reduce((acc, r) => acc + r.blankLines, 0);
    const total = reports.reduce((acc, r) => acc + r.totalLines, 0);
    const active = code + comments;
    const density = active > 0 ? (comments / active) * 100 : 0;

    return {
      language: lang,
      fileCount: reports.length,
      codeLines: code,
      commentLines: comments,
      blankLines: blanks,
      totalLines: total,
      commentDensity: parseFloat(density.toFixed(2)),
      targetLoc: target,
      targetMet: code >= target
    };
  }

  const cobolSummary = summarize('COBOL', 15000);
  const fortranSummary = summarize('FORTRAN', 15000);
  const tsSummary = summarize('TypeScript', 20001);

  const totalCode = cobolSummary.codeLines + fortranSummary.codeLines + tsSummary.codeLines;
  const totalComments = cobolSummary.commentLines + fortranSummary.commentLines + tsSummary.commentLines;
  const totalActive = totalCode + totalComments;
  const overallDensity = totalActive > 0 ? (totalComments / totalActive) * 100 : 0;
  const suspiciousCount = fileReports.reduce((acc, r) => acc + r.suspiciousRepetitions, 0);

  return {
    timestamp: new Date().toISOString(),
    rootPath: rootDir,
    cobol: cobolSummary,
    fortran: fortranSummary,
    typescript: tsSummary,
    totalCodeLines: totalCode,
    totalCommentLines: totalComments,
    overallCommentDensity: parseFloat(overallDensity.toFixed(2)),
    commentDensityValid: overallDensity >= 3.0 && overallDensity <= 5.0,
    totalProductionMet: totalCode >= 50001 && cobolSummary.targetMet && fortranSummary.targetMet && tsSummary.targetMet,
    excludedFileCount: excludedFiles.length,
    excludedFiles,
    suspiciousPatternsFound: suspiciousCount,
    fileReports
  };
}

export function printAuditReport(report: AuditReport): void {
  console.log('================================================================================');
  console.log('                 PROJECT GHOSTCODE — SOURCE CODE AUDIT REPORT                  ');
  console.log('================================================================================');
  console.log(`Audit Timestamp: ${report.timestamp}`);
  console.log(`Audited Path:    ${report.rootPath}`);
  console.log('--------------------------------------------------------------------------------');
  console.log('LANGUAGE BREAKDOWN & TARGET VERIFICATION:');
  console.log('--------------------------------------------------------------------------------');

  const rows = [report.cobol, report.fortran, report.typescript];
  for (const r of rows) {
    const status = r.targetMet ? 'PASSED [OK]' : 'INCOMPLETE [FAIL]';
    console.log(` ${r.language.padEnd(12)} | Files: ${String(r.fileCount).padStart(4)} | Code LOC: ${String(r.codeLines).padStart(7)} / Target: ${String(r.targetLoc).padStart(6)} | Density: ${r.commentDensity.toFixed(2)}% | ${status}`);
  }

  console.log('--------------------------------------------------------------------------------');
  console.log(`TOTAL PRODUCTION CODE LOC:    ${report.totalCodeLines.toLocaleString()} / Target: 50,001+`);
  console.log(`TOTAL PRODUCTION COMMENTS:    ${report.totalCommentLines.toLocaleString()}`);
  console.log(`OVERALL COMMENT DENSITY:      ${report.overallCommentDensity.toFixed(2)}% (Target: 3.00% - 5.00%)`);
  console.log(`COMMENT DENSITY STATUS:       ${report.commentDensityValid ? 'VALID [IN RANGE 3-5%]' : 'OUT OF RANGE'}`);
  console.log(`OVERALL LOC ACCEPTANCE:       ${report.totalProductionMet ? 'ACCEPTED [PASSED]' : 'NOT YET MET'}`);
  console.log(`SUSPICIOUS REPETITIONS:       ${report.suspiciousPatternsFound}`);
  console.log(`EXCLUDED NON-PRODUCTION:     ${report.excludedFileCount} items`);
  console.log('================================================================================');
}

if (require.main === module) {
  const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const report = auditDirectory(targetDir);
  printAuditReport(report);

  const reportOutPath = path.join(targetDir, 'reports', 'loc-audit-latest.json');
  fs.mkdirSync(path.dirname(reportOutPath), { recursive: true });
  fs.writeFileSync(reportOutPath, JSON.stringify(report, null, 2), 'utf8');
}
