# GHOSTCODE SYSTEM ARCHITECTURE SPECIFICATION
## "One Platform. Any Codebase. Deep Code Intelligence."

---

## 1. ARCHITECTURAL OVERVIEW

GHOSTCODE is architected as a high-performance, modular software diagnostics platform operating on a local-first paradigm. It separates orchestration and universal intelligence (TypeScript) from specialized native execution engines (COBOL and FORTRAN) while maintaining strict sandboxing for scanned codebases.

```
+-----------------------------------------------------------------------------------+
|                           GHOSTCODE REACT FRONTEND                                 |
|  - Monaco Editor  - React Flow Dependency Graph  - Recharts Performance Timeline  |
|  - 14 Dedicated Intelligence & Autopsy Views     - Diagnostic Diff Verification   |
+-----------------------------------------------------------------------------------+
                                      ▲ (REST / WebSocket / Server-Sent Events)
                                      ▼
+-----------------------------------------------------------------------------------+
|                     NODE.JS / TYPESCRIPT BACKEND ORCHESTRATOR                     |
|  - REST API & Job Scheduler                      - Universal Ingestion Engine     |
|  - 15 Universal Language Adapters                - Execution Sandbox & Process Mgr|
|  - AST Parsers & Static Diagnostic Engine        - SQLite Relational Persistence  |
+-----------------------------------------------------------------------------------+
         │                                 │                               │
         ▼ (Native CLI / JSON Pipe)        ▼ (Native CLI / JSON Pipe)      ▼ (In-Process AST)
+------------------------+      +------------------------+      +-------------------------+
|      COBOL ENGINE      |      |     FORTRAN ENGINE     |      |    TYPESCRIPT ENGINE    |
| - Transaction Auditing |      | - Numerical Stability  |      | - AST Pattern Matching  |
| - Fixed-Point Precision|      | - Matrix Decomposition |      | - Dependency Extraction |
| - Business Rule Audit  |      | - ULP & IEEE Error Trap|      | - Mutation Operators    |
| - Financial Ledgers    |      | - Scientific Simulation|      | - Cross-Language Parity |
+------------------------+      +------------------------+      +-------------------------+
```

---

## 2. INTER-ENGINE COMMUNICATION INTERFACES

The TypeScript backend orchestrates COBOL and FORTRAN native executables via a structured JSON-over-CLI protocol with isolated process pipes:

### A. Backend to Native COBOL Interface
- **Executable:** Compiled native GnuCOBOL binaries (`gc_analyzer.exe`, `gc_transactor.exe`, `gc_mutator.exe`).
- **Invocation:** Argument-array based execution (`child_process.spawn`) with timeouts, memory limits, and strict temp file sandboxing.
- **Input:** Standardized JSON payload via command line argument or sandboxed stdin file:
  ```json
  {
    "action": "ANALYZE_TRANSACTION",
    "sourceFile": "path/to/source.cob",
    "params": { "strictPrecision": true, "auditLedger": true }
  }
  ```
- **Output:** Standardized JSON diagnostic response emitted to stdout:
  ```json
  {
    "status": "SUCCESS",
    "issues": [
      {
        "code": "COB-PREC-001",
        "severity": "HIGH",
        "line": 42,
        "message": "Potential decimal truncation in COMP-3 arithmetic calculation",
        "impact": "Loss of fractional currency precision"
      }
    ]
  }
  ```

### B. Backend to Native FORTRAN Interface
- **Executable:** Compiled native GNU Fortran binaries (`ftn_numerical.exe`, `ftn_precision.exe`, `ftn_matrix.exe`).
- **Invocation:** Argument-array based execution with IEEE floating point trapping.
- **Input/Output:** Structured JSON exchange for condition number calculation, matrix verification, Runge-Kutta simulation, and IEEE error checks.

---

## 3. UNIVERSAL LANGUAGE ADAPTER CONTRACT

Every scanned language implements the `ILanguageAdapter` contract in TypeScript:

```typescript
export interface ILanguageAdapter {
  readonly languageId: string;
  readonly displayName: string;
  readonly fileExtensions: string[];
  readonly defaultManifests: string[];
  
  detect(filePath: string, content: string): boolean;
  getCapabilities(): LanguageCapabilities;
  
  parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]>;
  analyzeStatic(source: string, filePath: string, projectContext: ProjectContext): Promise<AnalysisIssue[]>;
  extractDependencies(source: string, filePath: string): Promise<DependencyNodeGraph>;
  generateMutations(source: string, filePath: string): Promise<MutationCandidate[]>;
  generateTests(source: string, filePath: string, issues: AnalysisIssue[]): Promise<GeneratedTestSuite>;
  traceExecution?(source: string, filePath: string, inputs: unknown): Promise<ExecutionTraceResult>;
}
```

Capabilities are reported honestly via `LanguageCapabilities`:
- `Supported`: Fully functional locally.
- `Partial`: Static inspection available; native execution requires local runtime.
- `Unsupported`: Operation not valid for this language paradigm.
- `ToolchainMissing`: Requires compiler/runtime that is not detected on host.

---

## 4. DATABASE RELATIONAL SCHEMA (SQLITE)

The database schema manages 17 normalized relational tables:
1. `projects`: Master project metadata, source root, detected languages.
2. `project_files`: File paths, language IDs, file size, hash, is_test, is_vendor.
3. `project_languages`: Discovered languages with file count, LOC count, detected frameworks.
4. `language_capabilities`: Host capability records for each language adapter.
5. `analysis_runs`: Scans with configuration, triggers, duration, status, health score.
6. `analysis_issues`: Individual detected issues with line, column, severity, rule ID, description, fix.
7. `dependency_nodes`: Extracted functions, classes, modules, and files.
8. `dependency_edges`: Call, import, inheritance, and usage relationships with circular flags.
9. `mutation_runs`: Mutation test executions, operator configs, score.
10. `injected_mutations`: Mutant records, operator name, original code, mutated code, killed status.
11. `execution_runs`: Traced runs, command line, environment, exit code, duration, memory.
12. `execution_events`: Timeline events, function entry/exit, variable transitions.
13. `test_suites`: Generated or detected test suites.
14. `test_cases`: Test cases with inputs, expected outputs, execution status.
15. `test_results`: Execution results per test case, error details, duration.
16. `fix_history`: Proposed fixes, diffs, approval status, verification results, rollbacks.
17. `performance_metrics`: Memory profiles, CPU samples, bottleneck hotspots.
18. `generated_reports`: Exported audit reports with health scores and executive summaries.

---

## 5. SECURITY & SANDBOX ARCHITECTURE

1. **Path Traversal Prevention:** Absolute path canonicalization and verification against project root directory.
2. **Untrusted Code Execution:** Scanned code execution runs in temporary, isolated directories with strict time limits (default 5,000ms), memory limits, and stdout/stderr capture caps (10MB max).
3. **Command Injection Prevention:** Direct shell string execution (`exec`) is forbidden. All child processes are spawned via fixed executable paths with argument arrays (`spawn`).
4. **Offline Local Privacy:** Zero network calls, zero external telemetries, complete local autonomy.
