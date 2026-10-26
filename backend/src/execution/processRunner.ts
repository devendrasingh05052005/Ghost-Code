import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

export interface ProcessRunOptions {
  executable: string;
  args: string[];
  workingDirectory?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  stdinInput?: string;
}

export interface ProcessRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  peakMemoryBytes: number;
}

export class ProcessRunner {
  static async run(options: ProcessRunOptions): Promise<ProcessRunResult> {
    const startTime = Date.now();
    const timeout = options.timeoutMs || config.security.maxExecutionTimeoutMs;
    const cwd = options.workingDirectory || config.sandboxDir;

    if (!fs.existsSync(cwd)) {
      fs.mkdirSync(cwd, { recursive: true });
    }

    const mergedEnv = {
      ...process.env,
      COB_MAIN_DIR: config.toolchains.cobol.binary ? path.dirname(path.dirname(config.toolchains.cobol.binary)) + '\\' : '',
      COB_CONFIG_DIR: config.toolchains.cobol.configDir,
      COB_COPY_DIR: config.toolchains.cobol.copyDir,
      COB_CFLAGS: `-I"${config.toolchains.cobol.includeDir}"`,
      COB_LDFLAGS: `-L"${config.toolchains.cobol.libDir}"`,
      PATH: `${path.dirname(config.toolchains.cobol.binary)};C:\\Strawberry\\c\\bin;${process.env.PATH}`,
      ...(options.env || {})
    };

    return new Promise((resolve) => {
      let stdoutData = '';
      let stderrData = '';
      let timedOut = false;
      let peakMemory = 0;

      const child: ChildProcess = spawn(options.executable, options.args, {
        cwd,
        env: mergedEnv,
        windowsHide: true,
        shell: false
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore kill errors
        }
      }, timeout);

      if (options.stdinInput && child.stdin) {
        child.stdin.write(options.stdinInput);
        child.stdin.end();
      }

      if (child.stdout) {
        child.stdout.on('data', (chunk: Buffer) => {
          if (stdoutData.length < config.security.maxBufferBytes) {
            stdoutData += chunk.toString('utf8');
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (chunk: Buffer) => {
          if (stderrData.length < config.security.maxBufferBytes) {
            stderrData += chunk.toString('utf8');
          }
        });
      }

      child.on('error', (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        resolve({
          exitCode: -1,
          stdout: stdoutData,
          stderr: stderrData ? `${stderrData}\nProcess error: ${err.message}` : `Process error: ${err.message}`,
          durationMs,
          timedOut,
          peakMemoryBytes: peakMemory
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        resolve({
          exitCode: code,
          stdout: stdoutData,
          stderr: stderrData,
          durationMs,
          timedOut,
          peakMemoryBytes: peakMemory
        });
      });
    });
  }
}
