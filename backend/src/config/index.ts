import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export interface AppConfig {
  port: number;
  env: string;
  dataDir: string;
  databasePath: string;
  schemaPath: string;
  uploadsDir: string;
  sandboxDir: string;
  reportsDir: string;
  toolchains: {
    cobol: {
      binary: string;
      configDir: string;
      copyDir: string;
      includeDir: string;
      libDir: string;
      available: boolean;
    };
    fortran: {
      binary: string;
      available: boolean;
    };
    python: {
      binary: string;
      available: boolean;
    };
    node: {
      binary: string;
      available: boolean;
    };
  };
  security: {
    maxExecutionTimeoutMs: number;
    maxBufferBytes: number;
    maxUploadBytes: number;
    allowedUploadExtensions: string[];
  };
}

function findProjectRoot(startDir: string): string {
  let curr = startDir;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'database', 'schema.sql'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(startDir, '../../..');
}

const ROOT_DIR = findProjectRoot(__dirname);

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  dataDir: path.join(ROOT_DIR, 'database'),
  databasePath: path.join(ROOT_DIR, 'database', 'ghostcode.db'),
  schemaPath: path.join(ROOT_DIR, 'database', 'schema.sql'),
  uploadsDir: path.join(ROOT_DIR, 'tmp', 'uploads'),
  sandboxDir: path.join(ROOT_DIR, 'tmp', 'sandboxes'),
  reportsDir: path.join(ROOT_DIR, 'reports'),
  toolchains: {
    cobol: {
      binary: process.env.COBC_PATH || 'C:\\Users\\temp3\\tools\\bin\\cobc.exe',
      configDir: process.env.COB_CONFIG_DIR || 'C:\\Users\\temp3\\tools\\config',
      copyDir: process.env.COB_COPY_DIR || 'C:\\Users\\temp3\\tools\\copy',
      includeDir: process.env.COB_INCLUDE_DIR || 'C:\\Users\\temp3\\tools\\include',
      libDir: process.env.COB_LIB_DIR || 'C:\\Users\\temp3\\tools\\lib',
      available: true
    },
    fortran: {
      binary: process.env.GFORTRAN_PATH || 'C:\\Strawberry\\c\\bin\\gfortran.exe',
      available: true
    },
    python: {
      binary: process.env.PYTHON_PATH || 'C:\\Python315\\python.exe',
      available: true
    },
    node: {
      binary: process.execPath,
      available: true
    }
  },
  security: {
    maxExecutionTimeoutMs: 8000,
    maxBufferBytes: 10 * 1024 * 1024,
    maxUploadBytes: 50 * 1024 * 1024,
    allowedUploadExtensions: [
      '.cob', '.cbl', '.f', '.for', '.f90', '.f95', '.f03', '.f08',
      '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.c', '.cpp',
      '.h', '.hpp', '.cs', '.go', '.rs', '.php', '.rb', '.swift',
      '.kt', '.json', '.txt', '.md', '.zip'
    ]
  }
};
