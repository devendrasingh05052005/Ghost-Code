import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

sqlite3.verbose();

let dbInstance: sqlite3.Database | null = null;

export function getDatabase(): sqlite3.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new sqlite3.Database(config.databasePath, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite database:', err.message);
      throw err;
    }
  });

  dbInstance.run('PRAGMA foreign_keys = ON;');
  dbInstance.run('PRAGMA journal_mode = WAL;');
  dbInstance.run('PRAGMA synchronous = NORMAL;');

  return dbInstance;
}

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    if (!fs.existsSync(config.schemaPath)) {
      return reject(new Error(`Schema file not found at ${config.schemaPath}`));
    }

    const schemaSql = fs.readFileSync(config.schemaPath, 'utf8');
    db.exec(schemaSql, (err) => {
      if (err) {
        console.error('Error executing database schema migration:', err);
        return reject(err);
      }
      seedLanguageCapabilities(db)
        .then(() => resolve())
        .catch(reject);
    });
  });
}

function seedLanguageCapabilities(db: sqlite3.Database): Promise<void> {
  const capabilities = [
    {
      id: 'cobol',
      name: 'COBOL',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'SUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: config.toolchains.cobol.available ? 1 : 0,
      binary: config.toolchains.cobol.binary,
      version: 'GnuCOBOL 3.2.0',
      notes: 'Native compiler & execution verified locally'
    },
    {
      id: 'fortran',
      name: 'FORTRAN',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'SUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: config.toolchains.fortran.available ? 1 : 0,
      binary: config.toolchains.fortran.binary,
      version: 'GNU Fortran 13.2.0',
      notes: 'Native numerical compiler & execution verified locally'
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'SUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: 1,
      binary: process.execPath,
      version: process.version,
      notes: 'Full in-process AST, dependency & execution orchestration'
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'SUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: 1,
      binary: process.execPath,
      version: process.version,
      notes: 'Full in-process AST, dependency & execution orchestration'
    },
    {
      id: 'python',
      name: 'Python',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'SUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: config.toolchains.python.available ? 1 : 0,
      binary: config.toolchains.python.binary,
      version: 'Python 3.15',
      notes: 'Static analysis and AST inspection supported'
    },
    {
      id: 'c',
      name: 'C',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'SUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'SUPPORTED',
      toolchainDetected: 1,
      binary: 'C:\\Strawberry\\c\\bin\\gcc.exe',
      version: 'GCC 13.2.0',
      notes: 'MinGW GCC available for compilation & execution'
    },
    {
      id: 'cpp',
      name: 'C++',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'SUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'SUPPORTED',
      toolchainDetected: 1,
      binary: 'C:\\Strawberry\\c\\bin\\g++.exe',
      version: 'G++ 13.2.0',
      notes: 'MinGW G++ available for compilation & execution'
    },
    {
      id: 'java',
      name: 'Java',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (JDK not detected on host); static analysis active'
    },
    {
      id: 'csharp',
      name: 'C#',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (.NET SDK not detected on host); static analysis active'
    },
    {
      id: 'go',
      name: 'Go',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (go binary not detected); static analysis active'
    },
    {
      id: 'rust',
      name: 'Rust',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (rustc not detected); static analysis active'
    },
    {
      id: 'php',
      name: 'PHP',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (php binary not detected); static analysis active'
    },
    {
      id: 'ruby',
      name: 'Ruby',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (ruby binary not detected); static analysis active'
    },
    {
      id: 'swift',
      name: 'Swift',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (swift toolchain not detected); static analysis active'
    },
    {
      id: 'kotlin',
      name: 'Kotlin',
      syntax: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      depGraph: 'SUPPORTED',
      trace: 'UNSUPPORTED',
      mutation: 'SUPPORTED',
      testGen: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: 0,
      binary: null,
      version: null,
      notes: 'Toolchain missing (kotlinc not detected); static analysis active'
    }
  ];

  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO language_capabilities (
        language_id, display_name, syntax_parsing, static_analysis,
        dependency_graph, execution_tracing, bug_injection, test_generation,
        profiling, toolchain_detected, toolchain_binary, toolchain_version, toolchain_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.serialize(() => {
      for (const cap of capabilities) {
        stmt.run(
          cap.id, cap.name, cap.syntax, cap.staticAnalysis,
          cap.depGraph, cap.trace, cap.mutation, cap.testGen,
          cap.profiling, cap.toolchainDetected, cap.binary, cap.version, cap.notes
        );
      }
      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve((row as T) || null);
    });
  });
}

export function executeRun(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
