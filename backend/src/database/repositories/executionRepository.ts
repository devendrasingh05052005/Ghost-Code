import { queryAll, queryOne, executeRun } from '../db';
import { ExecutionRun, ExecutionEvent, PerformanceMetric } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class ExecutionRepository {
  async createExecutionRun(run: Omit<ExecutionRun, 'id' | 'startTime' | 'durationMs' | 'status' | 'peakMemoryBytes'>): Promise<ExecutionRun> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO execution_runs (
        id, project_id, target_file, language_id, command_line,
        working_directory, start_time, duration_ms, status, peak_memory_bytes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'RUNNING', 0)`,
      [id, run.projectId, run.targetFile, run.languageId, run.commandLine, run.workingDirectory, now]
    );

    return {
      ...run,
      id,
      startTime: now,
      durationMs: 0,
      status: 'RUNNING',
      peakMemoryBytes: 0
    };
  }

  async completeExecutionRun(
    id: string,
    durationMs: number,
    exitCode: number,
    stdout: string,
    stderr: string,
    status: 'COMPLETED' | 'TIMED_OUT' | 'CRASHED',
    peakMemoryBytes: number
  ): Promise<ExecutionRun> {
    await executeRun(
      `UPDATE execution_runs SET
        duration_ms = ?,
        exit_code = ?,
        stdout_output = ?,
        stderr_output = ?,
        status = ?,
        peak_memory_bytes = ?
       WHERE id = ?`,
      [durationMs, exitCode, stdout, stderr, status, peakMemoryBytes, id]
    );

    const run = await this.getExecutionRunById(id);
    if (!run) throw new Error(`Execution run ${id} not found`);
    return run;
  }

  async addExecutionEvents(events: Omit<ExecutionEvent, 'id'>[]): Promise<void> {
    for (const e of events) {
      const id = uuidv4();
      await executeRun(
        `INSERT INTO execution_events (
          id, execution_run_id, sequence_order, event_type,
          timestamp_offset_ms, function_name, file_path, line_number,
          variable_name, old_value, new_value, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, e.executionRunId, e.sequenceOrder, e.eventType,
          e.timestampOffsetMs, e.functionName || null, e.filePath || null,
          e.lineNumber || null, e.variableName || null, e.oldValue || null,
          e.newValue || null, e.payloadJson || null
        ]
      );
    }
  }

  async getExecutionRunById(id: string): Promise<ExecutionRun | null> {
    const r = await queryOne<any>(`SELECT * FROM execution_runs WHERE id = ?`, [id]);
    if (!r) return null;
    return {
      id: r.id,
      projectId: r.project_id,
      targetFile: r.target_file,
      languageId: r.language_id,
      commandLine: r.command_line,
      workingDirectory: r.working_directory,
      startTime: r.start_time,
      durationMs: r.duration_ms,
      exitCode: r.exit_code,
      stdoutOutput: r.stdout_output,
      stderrOutput: r.stderr_output,
      status: r.status,
      peakMemoryBytes: r.peak_memory_bytes
    };
  }

  async getExecutionEvents(runId: string): Promise<ExecutionEvent[]> {
    const rows = await queryAll<any>(
      `SELECT * FROM execution_events WHERE execution_run_id = ? ORDER BY sequence_order ASC`,
      [runId]
    );

    return rows.map((r) => ({
      id: r.id,
      executionRunId: r.execution_run_id,
      sequenceOrder: r.sequence_order,
      eventType: r.event_type,
      timestampOffsetMs: r.timestamp_offset_ms,
      functionName: r.function_name,
      filePath: r.file_path,
      lineNumber: r.line_number,
      variableName: r.variable_name,
      oldValue: r.old_value,
      newValue: r.new_value,
      payloadJson: r.payload_json
    }));
  }

  async recordPerformanceMetrics(metrics: Omit<PerformanceMetric, 'id'>[]): Promise<void> {
    for (const m of metrics) {
      const id = uuidv4();
      await executeRun(
        `INSERT INTO performance_metrics (
          id, project_id, execution_run_id, file_path, function_name,
          invocation_count, total_duration_ms, avg_duration_ms, max_duration_ms,
          memory_delta_bytes, bottleneck_score, is_bottleneck
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, m.projectId, m.executionRunId || null, m.filePath, m.functionName,
          m.invocationCount, m.totalDurationMs, m.avgDurationMs, m.maxDurationMs,
          m.memoryDeltaBytes, m.bottleneckScore, m.isBottleneck ? 1 : 0
        ]
      );
    }
  }

  async getPerformanceMetrics(projectId: string): Promise<PerformanceMetric[]> {
    const rows = await queryAll<any>(
      `SELECT * FROM performance_metrics WHERE project_id = ? ORDER BY bottleneck_score DESC`,
      [projectId]
    );

    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      executionRunId: r.execution_run_id,
      filePath: r.file_path,
      functionName: r.function_name,
      invocationCount: r.invocation_count,
      totalDurationMs: r.total_duration_ms,
      avgDurationMs: r.avg_duration_ms,
      maxDurationMs: r.max_duration_ms,
      memoryDeltaBytes: r.memory_delta_bytes,
      bottleneckScore: r.bottleneck_score,
      isBottleneck: Boolean(r.is_bottleneck)
    }));
  }
}

export const executionRepository = new ExecutionRepository();
