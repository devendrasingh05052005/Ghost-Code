# GHOSTCODE REST API DOCUMENTATION
## Endpoints, Request Schemas & Response Payloads

Base URL: `http://localhost:3001/api`

---

## 1. Projects & Ingestion

### `GET /projects`
Returns a list of all ingested projects ordered by latest update.
- **Response:** `200 OK`
```json
[
  {
    "id": "dea37360-66b0-42f9-a7f0-1e941c8eb5d7",
    "name": "COBOL Financial & Loan Core",
    "description": "Commercial banking ledger and loan amortization suite in COBOL.",
    "rootPath": "C:\\Users\\temp3\\Desktop\\GHOST-CODE\\examples\\cobol",
    "createdAt": "2026-11-19T02:20:00.000Z",
    "updatedAt": "2026-11-19T02:20:00.000Z",
    "isActive": true
  }
]
```

### `POST /projects`
Ingest an existing local directory into GHOSTCODE.
- **Request Body:**
```json
{
  "name": "My TypeScript Service",
  "folderPath": "C:\\Projects\\my-service",
  "description": "Optional project description"
}
```
- **Response:** `201 Created`

### `POST /projects/upload`
Upload a ZIP archive of a project. Automatically extracted with path traversal protection.
- **Content-Type:** `multipart/form-data`
- **Field:** `file` (ZIP binary, up to 50 MB)
- **Response:** `201 Created`

### `GET /projects/:id`
Retrieve details of a single project, including primary language and file count.
- **Response:** `200 OK`

### `GET /projects/:id/files`
List all indexed files within a project.
- **Response:** `200 OK`
```json
[
  {
    "id": "file-uuid",
    "projectId": "proj-uuid",
    "relativePath": "core_banking.cob",
    "absolutePath": "C:\\path\\core_banking.cob",
    "languageId": "cobol",
    "fileSize": 1845,
    "loc": 58,
    "hash": "a1b2c3...",
    "isVendor": false,
    "isTest": false
  }
]
```

### `GET /projects/:id/file-content?path=relative/file.ts`
Retrieve the raw source text of a specific project file for editor display.
- **Query Params:** `path` (relative file path)
- **Response:** `200 OK`
```json
{
  "path": "relative/file.ts",
  "content": "...source code..."
}
```

---

## 2. Autopsy Scanner (Module 1)

### `POST /projects/:id/scan`
Triggers a full AST and static rule-based diagnostic autopsy scan.
- **Response:** `200 OK`
```json
{
  "id": "run-uuid",
  "projectId": "proj-uuid",
  "status": "COMPLETED",
  "healthScore": 85,
  "criticalCount": 0,
  "highCount": 1,
  "mediumCount": 2,
  "lowCount": 2,
  "infoCount": 0,
  "durationMs": 142
}
```

### `GET /projects/:id/scan/latest`
Retrieve the latest scan run and its full list of identified diagnostic issues.
- **Response:** `200 OK`
```json
{
  "run": { ... },
  "issues": [
    {
      "id": "issue-uuid",
      "runId": "run-uuid",
      "fileId": "file-uuid",
      "ruleId": "COB-NUM-001",
      "severity": "HIGH",
      "confidence": "CONFIRMED",
      "title": "Potential Division by Zero Risk",
      "description": "COMPUTE statement contains division where denominator variable may be zero.",
      "lineNumber": 48,
      "columnNumber": 16,
      "snippet": "COMPUTE WS-AVERAGE = WS-TOTAL / WS-COUNT",
      "suggestedFix": "Guard with IF WS-COUNT > 0 check before COMPUTE statement."
    }
  ]
}
```

---

## 3. Bug Injection Engine (Module 2)

### `POST /projects/:id/mutate`
Injects controlled syntax mutations into the project's source files.
- **Request Body:**
```json
{
  "operators": ["RELATIONAL_OPERATOR_REPLACEMENT", "ARITHMETIC_OPERATOR_INVERSION"],
  "targetFiles": ["src/service.ts"],
  "maxMutations": 10
}
```
- **Response:** `200 OK`

### `GET /projects/mutations/:runId`
Retrieve mutation details, diffs, and execution results for a mutation run.
- **Response:** `200 OK`

### `POST /projects/mutations/:mutationId/rollback`
Atomically rolls back an injected mutation, restoring the original source file.
- **Response:** `200 OK`
```json
{
  "status": "ROLLED_BACK",
  "mutationId": "mutation-uuid"
}
```

---

## 4. Dependency Graph Explorer (Module 3)

### `GET /projects/:id/dependencies`
Generates a full directed dependency graph formatted for React Flow rendering.
- **Response:** `200 OK`
```json
{
  "nodes": [
    { "id": "node-1", "label": "core_banking.cob", "type": "module" }
  ],
  "edges": [
    { "id": "e1-2", "source": "node-1", "target": "node-2", "type": "import" }
  ],
  "hasCycles": false,
  "cycles": []
}
```

---

## 5. Execution Lab & Performance Inspector (Modules 4 & 5)

### `POST /projects/:id/trace`
Executes an instrumented file within a sandboxed child process and captures execution trace timeline.
- **Request Body:**
```json
{
  "filePath": "core_banking.cob",
  "args": [],
  "env": {}
}
```
- **Response:** `200 OK`
```json
{
  "runId": "exec-uuid",
  "status": "COMPLETED",
  "exitCode": 0,
  "durationMs": 86,
  "stdout": "...",
  "stderr": "",
  "events": [
    { "step": 1, "line": 28, "event": "VARIABLE_SET", "variable": "WS-BALANCE", "value": "1500000.50" }
  ]
}
```

### `GET /projects/:id/performance`
Retrieves execution durations, memory/CPU consumption records, and identified loop bottlenecks.
- **Response:** `200 OK`

---

## 6. Test Center (Module 6)

### `POST /projects/:id/tests/generate`
Automatically synthesizes boundary and regression test cases for a file or function.
- **Request Body:**
```json
{
  "filePath": "src/math.ts",
  "targetSymbol": "calculateStats"
}
```
- **Response:** `200 OK`

### `POST /tests/:suiteId/run`
Executes a generated test suite within the execution sandbox and records test results.
- **Response:** `200 OK`
```json
{
  "suiteId": "suite-uuid",
  "totalTests": 8,
  "passed": 8,
  "failed": 0,
  "durationMs": 124
}
```

---

## 7. Bug Fix and Verification Lab (Module 7)

### `GET /projects/:id/fixes`
List all proposed and verified code fixes.

### `POST /projects/:id/fixes`
Propose a patch or automated remediation for an identified issue.
- **Request Body:**
```json
{
  "issueId": "issue-uuid",
  "filePath": "src/math.ts",
  "patchContent": "...",
  "description": "Add zero-denominator guard"
}
```

### `POST /fixes/:fixId/apply`
Applies the proposed patch to the source file and re-executes tests to verify regression safety.

### `POST /fixes/:fixId/rollback`
Reverts the applied fix back to original pre-patch source state.

---

## 8. Cross-Language Logic Verification (Advanced Feature)

### `POST /cross-language/banking`
Concurrently executes native COBOL (GnuCOBOL), native FORTRAN (gfortran), and TypeScript (V8) loan amortization calculations and compares numerical precision.
- **Request Body:**
```json
{
  "principal": 250000,
  "ratePercent": 5.25,
  "termMonths": 360,
  "tolerance": 0.01
}
```
- **Response:** `200 OK`
```json
{
  "scenarioName": "Standard Amortized Loan Monthly Payment Calculation",
  "inputs": { "principal": 250000, "ratePercent": 5.25, "termMonths": 360 },
  "cobol": {
    "value": 1380.51,
    "formatted": "$1380.51",
    "status": "SUCCESS",
    "precision": "PIC 9(9)V99 COMP-3 (Exact Decimal)"
  },
  "fortran": {
    "value": 1380.51,
    "formatted": "$1380.51",
    "status": "SUCCESS",
    "precision": "REAL(KIND=8) (IEEE 754 Double Precision)"
  },
  "typescript": {
    "value": 1380.51,
    "formatted": "$1380.51",
    "status": "SUCCESS",
    "precision": "Number (IEEE 754 64-bit Binary Float)"
  },
  "maxAbsoluteDifference": 0,
  "withinTolerance": true,
  "discrepancies": [],
  "semanticAnalysis": "All three language engines produced mathematically compliant results within the configured monetary tolerance ($0.01)."
}
```

---

## 9. Reports & Dashboard (Module 8)

### `GET /dashboard/stats`
Telemetry metrics across all projects: total projects, total indexed files, total LOC, open critical issues, and language distribution.

### `POST /projects/:id/reports`
Generates a comprehensive Code Health Report in SQLite, JSON, and Markdown format.

### `GET /settings/capabilities`
Lists all 15 language adapters, their supported capabilities, and host toolchain detection status.
