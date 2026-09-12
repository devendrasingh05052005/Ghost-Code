import { queryAll, queryOne, executeRun } from '../db';
import { FixHistoryRecord } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class FixRepository {
  async proposeFix(fix: Omit<FixHistoryRecord, 'id' | 'createdAt' | 'status'>): Promise<FixHistoryRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO fix_history (
        id, issue_id, project_id, file_path, original_code,
        proposed_code, diff_patch, reasoning, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED', ?)`,
      [
        id, fix.issueId, fix.projectId, fix.filePath, fix.originalCode,
        fix.proposedCode, fix.diffPatch, fix.reasoning, now
      ]
    );

    return {
      ...fix,
      id,
      status: 'PROPOSED',
      createdAt: now
    };
  }

  async applyFix(id: string, testResult?: 'PASSED' | 'FAILED' | 'UNTESTED'): Promise<void> {
    const now = new Date().toISOString();
    await executeRun(
      `UPDATE fix_history SET status = 'ACCEPTED', applied_at = ?, verification_test_result = ? WHERE id = ?`,
      [now, testResult || 'UNTESTED', id]
    );
  }

  async rejectFix(id: string): Promise<void> {
    await executeRun(`UPDATE fix_history SET status = 'REJECTED' WHERE id = ?`, [id]);
  }

  async rollbackFix(id: string): Promise<void> {
    const now = new Date().toISOString();
    await executeRun(
      `UPDATE fix_history SET status = 'ROLLED_BACK', rolled_back_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  async getFixesByProject(projectId: string): Promise<FixHistoryRecord[]> {
    const rows = await queryAll<any>(
      `SELECT * FROM fix_history WHERE project_id = ? ORDER BY created_at DESC`,
      [projectId]
    );

    return rows.map((r) => ({
      id: r.id,
      issueId: r.issue_id,
      projectId: r.project_id,
      filePath: r.file_path,
      originalCode: r.original_code,
      proposedCode: r.proposed_code,
      diffPatch: r.diff_patch,
      reasoning: r.reasoning,
      status: r.status,
      verificationTestResult: r.verification_test_result,
      createdAt: r.created_at,
      appliedAt: r.applied_at,
      rolledBackAt: r.rolled_back_at
    }));
  }

  async getFixById(id: string): Promise<FixHistoryRecord | null> {
    const r = await queryOne<any>(`SELECT * FROM fix_history WHERE id = ?`, [id]);
    if (!r) return null;
    return {
      id: r.id,
      issueId: r.issue_id,
      projectId: r.project_id,
      filePath: r.file_path,
      originalCode: r.original_code,
      proposedCode: r.proposed_code,
      diffPatch: r.diff_patch,
      reasoning: r.reasoning,
      status: r.status,
      verificationTestResult: r.verification_test_result,
      createdAt: r.created_at,
      appliedAt: r.applied_at,
      rolledBackAt: r.rolled_back_at
    };
  }
}

export const fixRepository = new FixRepository();
