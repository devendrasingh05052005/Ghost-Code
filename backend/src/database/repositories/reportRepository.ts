import { queryAll, queryOne, executeRun } from '../db';
import { DashboardStats, AnalysisRun } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class ReportRepository {
  async saveReport(
    projectId: string,
    analysisRunId: string,
    title: string,
    healthScore: number,
    markdown: string,
    reportJson: Record<string, unknown>
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO generated_reports (id, project_id, analysis_run_id, report_title, health_score, summary_markdown, report_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, analysisRunId, title, healthScore, markdown, JSON.stringify(reportJson), now]
    );

    return id;
  }

  async getReportsByProject(projectId: string): Promise<any[]> {
    return queryAll<any>(
      `SELECT * FROM generated_reports WHERE project_id = ? ORDER BY created_at DESC`,
      [projectId]
    );
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const projCountRow = await queryOne<any>(`SELECT COUNT(*) as count FROM projects WHERE is_active = 1`);
    const fileCountRow = await queryOne<any>(`SELECT COUNT(*) as count FROM project_files`);
    const issuesRow = await queryOne<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high
      FROM analysis_issues
    `);

    const testsRow = await queryOne<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed
      FROM test_results
    `);

    const mutationRow = await queryOne<any>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'KILLED' THEN 1 ELSE 0 END) as killed
      FROM injected_mutations
    `);

    const langDistRows = await queryAll<any>(`
      SELECT language_id, COUNT(*) as count, SUM(loc) as loc
      FROM project_files
      GROUP BY language_id
      ORDER BY loc DESC
    `);

    const recentRunsRows = await queryAll<any>(`
      SELECT * FROM analysis_runs
      ORDER BY run_timestamp DESC
      LIMIT 5
    `);

    const totalTests = testsRow?.total || 0;
    const passedTests = testsRow?.passed || 0;
    const testSuccessRate = totalTests > 0 ? parseFloat(((passedTests / totalTests) * 100).toFixed(1)) : 100.0;

    const totalMut = mutationRow?.total || 0;
    const killedMut = mutationRow?.killed || 0;
    const mutationRate = totalMut > 0 ? parseFloat(((killedMut / totalMut) * 100).toFixed(1)) : 0.0;

    const recentAnalyses: AnalysisRun[] = recentRunsRows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      runTimestamp: r.run_timestamp,
      durationMs: r.duration_ms,
      status: r.status,
      healthScore: r.health_score,
      totalIssues: r.total_issues,
      criticalIssues: r.critical_issues,
      highIssues: r.high_issues,
      mediumIssues: r.medium_issues,
      lowIssues: r.low_issues,
      infoIssues: r.info_issues,
      configJson: r.config_json,
      errorMessage: r.error_message
    }));

    return {
      projectCount: projCountRow?.count || 0,
      totalFilesAnalyzed: fileCountRow?.count || 0,
      totalIssuesDetected: issuesRow?.total || 0,
      criticalIssues: issuesRow?.critical || 0,
      highIssues: issuesRow?.high || 0,
      testSuccessRate,
      mutationDetectionRate: mutationRate,
      languageDistribution: langDistRows.map((l) => ({
        languageId: l.language_id,
        count: l.count,
        loc: l.loc || 0
      })),
      recentAnalyses
    };
  }
}

export const reportRepository = new ReportRepository();
