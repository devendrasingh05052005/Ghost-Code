import * as fs from 'fs';
import { projectRepository } from '../database/repositories/projectRepository';
import { executionRepository } from '../database/repositories/executionRepository';
import { getAdapter } from '../adapters';
import { ExecutionRun, ExecutionEvent } from '../../../shared/types';

export class ExecutionService {
  async executeAndTraceFile(
    projectId: string,
    relativeFilePath: string,
    inputs: unknown = {}
  ): Promise<{ run: ExecutionRun; events: ExecutionEvent[] }> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const files = await projectRepository.getProjectFiles(projectId);
    const target = files.find((f) => f.relativePath === relativeFilePath);
    if (!target) throw new Error(`File ${relativeFilePath} not found in project`);

    const adapter = getAdapter(target.languageId);
    if (!adapter) throw new Error(`No adapter available for ${target.languageId}`);

    const capabilities = adapter.getCapabilities();
    if (capabilities.executionTracing === 'UNSUPPORTED' || !capabilities.toolchainDetected) {
      throw new Error(`Execution tracing is unsupported for ${target.languageId}: ${capabilities.toolchainNotes || 'Missing toolchain'}`);
    }

    const content = fs.readFileSync(target.absolutePath, 'utf8');

    const executionRun = await executionRepository.createExecutionRun({
      projectId,
      targetFile: relativeFilePath,
      languageId: target.languageId,
      commandLine: `${capabilities.binary || 'runner'} ${relativeFilePath}`,
      workingDirectory: project.rootPath
    });

    const startTime = Date.now();
    let traceResult: { events: ExecutionEvent[]; output: string; exitCode: number };

    if (adapter.traceExecution) {
      traceResult = await adapter.traceExecution(content, relativeFilePath, inputs);
    } else {
      traceResult = {
        events: [],
        output: 'Tracing not implemented for adapter',
        exitCode: 0
      };
    }

    const durationMs = Date.now() - startTime;
    const completedRun = await executionRepository.completeExecutionRun(
      executionRun.id,
      durationMs,
      traceResult.exitCode,
      traceResult.output,
      '',
      traceResult.exitCode === 0 ? 'COMPLETED' : 'CRASHED',
      1024 * 1024 // Estimated memory
    );

    // Persist events with executionRunId
    const eventsToSave = traceResult.events.map((e, idx) => ({
      ...e,
      executionRunId: executionRun.id,
      sequenceOrder: idx + 1
    }));

    await executionRepository.addExecutionEvents(eventsToSave);

    // Record performance metric
    await executionRepository.recordPerformanceMetrics([
      {
        projectId,
        executionRunId: executionRun.id,
        filePath: relativeFilePath,
        functionName: 'main',
        invocationCount: 1,
        totalDurationMs: durationMs,
        avgDurationMs: durationMs,
        maxDurationMs: durationMs,
        memoryDeltaBytes: 1024 * 512,
        bottleneckScore: durationMs > 500 ? 80.0 : 15.0,
        isBottleneck: durationMs > 500
      }
    ]);

    const savedEvents = await executionRepository.getExecutionEvents(executionRun.id);
    return { run: completedRun, events: savedEvents };
  }
}

export const executionService = new ExecutionService();
