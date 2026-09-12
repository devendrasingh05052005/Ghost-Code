import { queryAll, queryOne, executeRun } from '../db';
import { TestSuite, TestCase, TestResult } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class TestRepository {
  async createTestSuite(suite: Omit<TestSuite, 'id' | 'createdAt'>): Promise<TestSuite> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO test_suites (id, project_id, name, suite_type, target_file, language_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, suite.projectId, suite.name, suite.suiteType, suite.targetFile, suite.languageId, now]
    );

    const savedCases: TestCase[] = [];
    if (suite.testCases && suite.testCases.length > 0) {
      for (const tc of suite.testCases) {
        const caseId = uuidv4();
        await executeRun(
          `INSERT INTO test_cases (id, test_suite_id, name, category, input_parameters, expected_output, timeout_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [caseId, id, tc.name, tc.category, tc.inputParameters, tc.expectedOutput || null, tc.timeoutMs || 5000]
        );
        savedCases.push({ ...tc, id: caseId, testSuiteId: id });
      }
    }

    return { ...suite, id, createdAt: now, testCases: savedCases };
  }

  async getTestSuites(projectId: string): Promise<TestSuite[]> {
    const rows = await queryAll<any>(
      `SELECT * FROM test_suites WHERE project_id = ? ORDER BY created_at DESC`,
      [projectId]
    );

    const suites: TestSuite[] = [];
    for (const r of rows) {
      const cases = await this.getTestCases(r.id);
      suites.push({
        id: r.id,
        projectId: r.project_id,
        name: r.name,
        suiteType: r.suite_type,
        targetFile: r.target_file,
        languageId: r.language_id,
        createdAt: r.created_at,
        testCases: cases
      });
    }

    return suites;
  }

  async getTestCases(suiteId: string): Promise<TestCase[]> {
    const rows = await queryAll<any>(
      `SELECT * FROM test_cases WHERE test_suite_id = ?`,
      [suiteId]
    );

    return rows.map((r) => ({
      id: r.id,
      testSuiteId: r.test_suite_id,
      name: r.name,
      category: r.category,
      inputParameters: r.input_parameters,
      expectedOutput: r.expected_output,
      timeoutMs: r.timeout_ms
    }));
  }

  async recordTestResult(result: Omit<TestResult, 'id' | 'runTimestamp'>): Promise<TestResult> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO test_results (id, test_case_id, execution_run_id, run_timestamp, passed, actual_output, error_message, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, result.testCaseId, result.executionRunId || null, now,
        result.passed ? 1 : 0, result.actualOutput || null,
        result.errorMessage || null, result.durationMs
      ]
    );

    return { ...result, id, runTimestamp: now };
  }

  async getLatestResults(suiteId: string): Promise<TestResult[]> {
    const rows = await queryAll<any>(
      `SELECT tr.* FROM test_results tr
       JOIN test_cases tc ON tr.test_case_id = tc.id
       WHERE tc.test_suite_id = ?
       ORDER BY tr.run_timestamp DESC`,
      [suiteId]
    );

    return rows.map((r) => ({
      id: r.id,
      testCaseId: r.test_case_id,
      executionRunId: r.execution_run_id,
      runTimestamp: r.run_timestamp,
      passed: Boolean(r.passed),
      actualOutput: r.actual_output,
      errorMessage: r.error_message,
      durationMs: r.duration_ms
    }));
  }
}

export const testRepository = new TestRepository();
