import { queryAll, queryOne, executeRun } from '../db';
import { MutationRun, InjectedMutation } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class MutationRepository {
  async createMutationRun(projectId: string, configJson?: string): Promise<MutationRun> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO mutation_runs (id, project_id, run_timestamp, status, total_mutations, killed_mutations, survived_mutations, timed_out_mutations, mutation_score, config_json)
       VALUES (?, ?, ?, 'RUNNING', 0, 0, 0, 0, 0.0, ?)`,
      [id, projectId, now, configJson || '{}']
    );

    return {
      id,
      projectId,
      runTimestamp: now,
      status: 'RUNNING',
      totalMutations: 0,
      killedMutations: 0,
      survivedMutations: 0,
      timedOutMutations: 0,
      mutationScore: 0.0,
      configJson
    };
  }

  async recordMutation(mutation: Omit<InjectedMutation, 'id' | 'createdAt'>): Promise<InjectedMutation> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO injected_mutations (
        id, mutation_run_id, project_id, file_id, file_path, line_number,
        operator_name, original_snippet, mutated_snippet, isolated_copy_path,
        status, detection_test_id, diff_unified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, mutation.mutationRunId, mutation.projectId, mutation.fileId || null,
        mutation.filePath, mutation.lineNumber, mutation.operatorName,
        mutation.originalSnippet, mutation.mutatedSnippet, mutation.isolatedCopyPath,
        mutation.status, mutation.detectionTestId || null, mutation.diffUnified || '', now
      ]
    );

    return { ...mutation, id, createdAt: now };
  }

  async updateMutationStatus(id: string, status: 'INJECTED' | 'ROLLED_BACK' | 'KILLED' | 'SURVIVED' | 'TIMED_OUT', testId?: string): Promise<void> {
    await executeRun(
      `UPDATE injected_mutations SET status = ?, detection_test_id = ? WHERE id = ?`,
      [status, testId || null, id]
    );
  }

  async completeMutationRun(runId: string): Promise<MutationRun> {
    const mutations = await this.getMutationsByRun(runId);
    const total = mutations.length;
    const killed = mutations.filter((m) => m.status === 'KILLED').length;
    const survived = mutations.filter((m) => m.status === 'SURVIVED').length;
    const score = total > 0 ? parseFloat(((killed / total) * 100).toFixed(1)) : 0.0;

    await executeRun(
      `UPDATE mutation_runs SET status = 'COMPLETED', total_mutations = ?, killed_mutations = ?, survived_mutations = ?, mutation_score = ? WHERE id = ?`,
      [total, killed, survived, score, runId]
    );

    const run = await this.getMutationRunById(runId);
    if (!run) throw new Error(`Mutation run ${runId} not found`);
    return run;
  }

  async getMutationRunById(id: string): Promise<MutationRun | null> {
    const row = await queryOne<any>(`SELECT * FROM mutation_runs WHERE id = ?`, [id]);
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      runTimestamp: row.run_timestamp,
      status: row.status,
      totalMutations: row.total_mutations,
      killedMutations: row.killed_mutations,
      survivedMutations: row.survived_mutations,
      timedOutMutations: row.timed_out_mutations,
      mutationScore: row.mutation_score,
      configJson: row.config_json
    };
  }

  async getMutationsByRun(runId: string): Promise<InjectedMutation[]> {
    const rows = await queryAll<any>(`SELECT * FROM injected_mutations WHERE mutation_run_id = ? ORDER BY line_number ASC`, [runId]);
    return rows.map((r) => ({
      id: r.id,
      mutationRunId: r.mutation_run_id,
      projectId: r.project_id,
      fileId: r.file_id,
      filePath: r.file_path,
      lineNumber: r.line_number,
      operatorName: r.operator_name,
      originalSnippet: r.original_snippet,
      mutatedSnippet: r.mutated_snippet,
      isolatedCopyPath: r.isolated_copy_path,
      status: r.status,
      detectionTestId: r.detection_test_id,
      diffUnified: r.diff_unified,
      createdAt: r.created_at
    }));
  }
}

export const mutationRepository = new MutationRepository();
