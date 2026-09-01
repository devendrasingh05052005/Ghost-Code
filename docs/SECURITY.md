# GHOSTCODE SECURITY ARCHITECTURE & THREAT MODEL
## Security Principles, Defenses & Process Sandboxing

GHOSTCODE is designed to inspect, execute, and mutate user-supplied source code locally. Because user-supplied code may contain bugs, infinite loops, or malicious payloads, strict defense-in-depth isolation controls are enforced across the entire system.

---

## 1. Process Execution Sandboxing (`processRunner.ts`)

### A. Non-Shell Execution (Command Injection Immunity)
- **Principle:** Never execute commands via raw shell string interpolation (e.g., `exec("cobc " + filename)`).
- **Enforcement:** All child processes are spawned directly via `child_process.spawn(binary, argArray, options)` using explicit argument arrays.
- **Benefit:** Shell metacharacters (`;`, `&`, `|`, `` ` ``, `$`, `>`, `<`) cannot break out into arbitrary system commands.

### B. Execution Timeouts (Infinite Loop Prevention)
- **Default Limit:** 8,000 milliseconds (8.0 seconds).
- **Enforcement:** A hard execution timer triggers `child.kill('SIGTERM')` followed by `child.kill('SIGKILL')` if the process does not terminate within 250ms of SIGTERM.
- **Benefit:** Infinite `WHILE` loops, recursive explosions, or hanging compiler invocations are forcibly terminated.

### C. Output Buffer Caps (Memory Exhaustion Prevention)
- **Default Limit:** 10 MB maximum combined `stdout` and `stderr`.
- **Enforcement:** Stream listeners count byte chunks. If the cumulative output exceeds 10 MB, the subprocess is killed immediately with an `ERR_BUFFER_OVERFLOW` event.
- **Benefit:** Malicious programs attempting to fill RAM or disk with infinite output logs cannot crash the server.

### D. Isolated Working Directories
- **Principle:** Subprocesses run in dedicated sandbox directories under `tmp/sandboxes/`.
- **Enforcement:** Each compilation or execution receives a freshly generated temporary directory with restricted permissions. Artifacts are cleaned up following execution.

---

## 2. Universal File Ingestion & Zip-Slip Protection

### A. Zip-Slip Path Traversal Defense
- **Threat:** Malicious ZIP archives containing paths such as `../../../../Windows/System32/evil.dll` or `../../backend/dist/server.js`.
- **Enforcement:** In `ingestionService.extractZipAndImport()`:
```ts
const targetPath = path.resolve(destDir, entry.entryName);
if (!targetPath.startsWith(destDir + path.sep)) {
  throw new SecurityError(`Illegal path traversal detected in archive entry: ${entry.entryName}`);
}
```
- **Benefit:** Files can only be extracted inside the designated isolated upload folder.

### B. Upload Size & Extension Controls
- **Maximum Upload Size:** 50 MB per archive.
- **Extension Whitelist:** Only recognized programming languages and manifest files are extracted:
  `.cob`, `.cbl`, `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08`, `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.go`, `.rs`, `.php`, `.rb`, `.swift`, `.kt`, `.json`, `.txt`, `.md`, `.zip`.
- All binary executables (`.exe`, `.dll`, `.so`, `.sh`, `.bat`, `.cmd`) inside uploaded archives are stripped or ignored during analysis.

---

## 3. Atomic Bug Mutation & Rollback Integrity

### A. Rollback Pre-State Persistence
- Before injecting any mutation, the engine captures an SHA-256 hash and full backup copy of the original target file in SQLite (`mutations` table).
- When rollback is triggered, the engine verifies the hash of the restored file against the original pre-mutation state to guarantee exact restoration.

---

## 4. SQLite Relational Integrity & WAL Mode

- **Foreign Keys Enabled:** `PRAGMA foreign_keys = ON;` is enforced on every database connection.
- **WAL Mode:** Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) provides crash resistance and concurrent read/write transactions without database locking.
- **Parameterized SQL:** Every query utilizes parameterized statement binding (`?`), eliminating SQL injection vulnerabilities.

---

## 5. Offline & Privacy Guarantee

- **Zero Cloud APIs:** GHOSTCODE makes zero outgoing network calls to external LLMs, cloud analytics, or hosted tracking services.
- **Local Isolation:** All static analysis, compilation, and execution happens exclusively on the local workstation. User intellectual property and proprietary source code never leave the local environment.
