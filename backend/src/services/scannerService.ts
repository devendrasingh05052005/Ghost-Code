import * as fs from 'fs';
import { projectRepository } from '../database/repositories/projectRepository';
import { analysisRepository } from '../database/repositories/analysisRepository';
import { getAdapter } from '../adapters';
import { AnalysisIssue, AnalysisRun } from '../../../shared/types';
import { ProjectScanContext } from '../adapters/core/languageAdapter';

export class ScannerService {
  async runProjectScan(projectId: string): Promise<AnalysisRun> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const run = await analysisRepository.createAnalysisRun(projectId);
    const files = await projectRepository.getProjectFiles(projectId);
    const startTime = Date.now();
    const collectedIssues: AnalysisIssue[] = [];

    const context: ProjectScanContext = {
      projectId,
      projectRoot: project.rootPath,
      files: files.map((f) => ({
        relativePath: f.relativePath,
        absolutePath: f.absolutePath,
        languageId: f.languageId
      }))
    };

    for (const file of files) {
      if (file.isVendor) continue;

      const adapter = getAdapter(file.languageId);
      if (!adapter) continue;

      if (!fs.existsSync(file.absolutePath)) continue;
      const content = fs.readFileSync(file.absolutePath, 'utf8');

      // 1. Syntax analysis
      const syntaxErrors = await adapter.parseSyntax(content, file.relativePath);
      for (const se of syntaxErrors) {
        collectedIssues.push({
          id: `SYNTAX-${file.id}-${se.line}-${se.column}`,
          analysisRunId: run.id,
          projectId,
          fileId: file.id,
          relativePath: file.relativePath,
          lineNumber: se.line,
          columnNumber: se.column,
          languageId: file.languageId,
          ruleId: 'SYNTAX-PARSE-ERROR',
          category: 'SYNTAX',
          severity: se.severity,
          confidence: 'CONFIRMED',
          title: `Syntax Diagnostic in ${file.relativePath}`,
          description: se.message,
          technicalExplanation: 'The code parser failed to resolve the grammatical production rule at this token.',
          suggestedFix: 'Correct syntax formatting according to language grammar standard.',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // 2. Static semantic analysis
      const staticIssues = await adapter.analyzeStatic(content, file.relativePath, context);
      for (const si of staticIssues) {
        collectedIssues.push({
          ...si,
          analysisRunId: run.id,
          projectId,
          fileId: file.id
        });
      }
    }

    const durationMs = Date.now() - startTime;
    return analysisRepository.completeAnalysisRun(run.id, durationMs, collectedIssues);
  }
}

export const scannerService = new ScannerService();
