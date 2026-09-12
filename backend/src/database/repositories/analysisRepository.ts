import { queryAll, queryOne, executeRun } from '../db';
import { AnalysisRun, AnalysisIssue, Severity } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class AnalysisRepository {
  async createAnalysisRun(projectId: string, configJson?: string): Promise<AnalysisRun> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO analysis_runs (
        id, project_id, run_timestamp, duration_ms, status, health_score,
        total_issues, critical_issues, high_issues, medium_issues, low_issues,
        info_issues, config_json
      ) VALUES (?, ?, ?, 0, 'RUNNING', 100.0, 0, 0, 0, 0, 0, 0, ?)`,
      [id, projectId, now, configJson || '{}']
    );

    return {
      id,
      projectId,
      runTimestamp: now,
      durationMs: 0,
      status: 'RUNNING',
      healthScore: 100.0,
      totalIssues: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      infoIssues: 0,
      configJson
    };
  }

  async completeAnalysisRun(
    runId: string,
    durationMs: number,
    issues: AnalysisIssue[]
  ): Promise<AnalysisRun> {
    const critical = issues.filter((i) => i.severity === 'CRITICAL').length;
    const high = issues.filter((i) => i.severity === 'HIGH').length;
    const medium = issues.filter((i) => i.severity === 'MEDIUM').length;
    const low = issues.filter((i) => i.severity === 'LOW').length;
    const info = issues.filter((i) => i.severity === 'INFORMATIONAL').length;

    // Calculate actual deterministic health score
    // 100 - deductions based on severity weights
    const deductions = (critical * 15.0) + (high * 7.5) + (medium * 3.0) + (low * 1.0) + (info * 0.2);
    const healthScore = Math.max(0, Math.min(100, parseFloat((100.0 - deductions).toFixed(1))));

    await executeRun(
      `UPDATE analysis_runs SET
        status = 'COMPLETED',
        duration_ms = ?,
        health_score = ?,
        total_issues = ?,
        critical_issues = ?,
        high_issues = ?,
        medium_issues = ?,
        low_issues = ?,
        info_issues = ?
       WHERE id = ?`,
      [durationMs, healthScore, issues.length, critical, high, medium, low, info, runId]
    );

    for (const issue of issues) {
      const issueId = issue.id ? `${runId}_${issue.id}` : uuidv4();
      await executeRun(
        `INSERT OR REPLACE INTO analysis_issues (
          id, analysis_run_id, project_id, file_id, relative_path,
          line_number, column_number, end_line_number, end_column_number,
          language_id, rule_id, category, severity, confidence, title,
          description, technical_explanation, potential_impact,
          reproduction_steps, suggested_fix, verification_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          issueId,
          runId,
          issue.projectId,
          issue.fileId || null,
          issue.relativePath,
          issue.lineNumber,
          issue.columnNumber,
          issue.endLineNumber || null,
          issue.endColumnNumber || null,
          issue.languageId,
          issue.ruleId,
          issue.category,
          issue.severity,
          issue.confidence,
          issue.title,
          issue.description,
          issue.technicalExplanation || '',
          issue.potentialImpact || '',
          issue.reproductionSteps || '',
          issue.suggestedFix || '',
          issue.verificationStatus || 'UNVERIFIED',
          new Date().toISOString()
        ]
      );
    }

    const completed = await this.getAnalysisRunById(runId);
    if (!completed) throw new Error(`Run ${runId} not found`);
    return completed;
  }

  async getAnalysisRunById(id: string): Promise<AnalysisRun | null> {
    const row = await queryOne<any>(`SELECT * FROM analysis_runs WHERE id = ?`, [id]);
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      runTimestamp: row.run_timestamp,
      durationMs: row.duration_ms,
      status: row.status,
      healthScore: row.health_score,
      totalIssues: row.total_issues,
      criticalIssues: row.critical_issues,
      highIssues: row.high_issues,
      mediumIssues: row.medium_issues,
      lowIssues: row.low_issues,
      infoIssues: row.info_issues,
      configJson: row.config_json,
      errorMessage: row.error_message
    };
  }

  async getLatestRun(projectId: string): Promise<AnalysisRun | null> {
    const row = await queryOne<any>(
      `SELECT * FROM analysis_runs WHERE project_id = ? AND status = 'COMPLETED' ORDER BY run_timestamp DESC LIMIT 1`,
      [projectId]
    );
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      runTimestamp: row.run_timestamp,
      durationMs: row.duration_ms,
      status: row.status,
      healthScore: row.health_score,
      totalIssues: row.total_issues,
      criticalIssues: row.critical_issues,
      highIssues: row.high_issues,
      mediumIssues: row.medium_issues,
      lowIssues: row.low_issues,
      infoIssues: row.info_issues,
      configJson: row.config_json,
      errorMessage: row.error_message
    };
  }

  async getIssuesByProject(projectId: string): Promise<AnalysisIssue[]> {
    const rows = await queryAll<any>(
      `SELECT * FROM analysis_issues WHERE project_id = ? ORDER BY
       CASE severity
         WHEN 'CRITICAL' THEN 1
         WHEN 'HIGH' THEN 2
         WHEN 'MEDIUM' THEN 3
         WHEN 'LOW' THEN 4
         ELSE 5
       END ASC, line_number ASC`,
      [projectId]
    );

    return rows.map((r) => ({
      id: r.id,
      analysisRunId: r.analysis_run_id,
      projectId: r.project_id,
      fileId: r.file_id,
      relativePath: r.relative_path,
      lineNumber: r.line_number,
      columnNumber: r.column_number,
      endLineNumber: r.end_line_number,
      endColumnNumber: r.end_column_number,
      languageId: r.language_id,
      ruleId: r.rule_id,
      category: r.category,
      severity: r.severity,
      confidence: r.confidence,
      title: r.title,
      description: r.description,
      technicalExplanation: r.technical_explanation,
      potentialImpact: r.potential_impact,
      reproductionSteps: r.reproduction_steps,
      suggestedFix: r.suggested_fix,
      verificationStatus: r.verification_status,
      createdAt: r.created_at
    }));
  }

  async getIssuesByRun(runId: string): Promise<AnalysisIssue[]> {
    const rows = await queryAll<any>(
      `SELECT * FROM analysis_issues WHERE analysis_run_id = ? ORDER BY
       CASE severity
         WHEN 'CRITICAL' THEN 1
         WHEN 'HIGH' THEN 2
         WHEN 'MEDIUM' THEN 3
         WHEN 'LOW' THEN 4
         ELSE 5
       END ASC, line_number ASC`,
      [runId]
    );

    return rows.map((r) => ({
      id: r.id,
      analysisRunId: r.analysis_run_id,
      projectId: r.project_id,
      fileId: r.file_id,
      relativePath: r.relative_path,
      lineNumber: r.line_number,
      columnNumber: r.column_number,
      endLineNumber: r.end_line_number,
      endColumnNumber: r.end_column_number,
      languageId: r.language_id,
      ruleId: r.rule_id,
      category: r.category,
      severity: r.severity,
      confidence: r.confidence,
      title: r.title,
      description: r.description,
      technicalExplanation: r.technical_explanation,
      potentialImpact: r.potential_impact,
      reproductionSteps: r.reproduction_steps,
      suggestedFix: r.suggested_fix,
      verificationStatus: r.verification_status,
      createdAt: r.created_at
    }));
  }

  async updateIssueVerification(issueId: string, status: string): Promise<void> {
    await executeRun(`UPDATE analysis_issues SET verification_status = ? WHERE id = ?`, [status, issueId]);
  }
}

export const analysisRepository = new AnalysisRepository();
