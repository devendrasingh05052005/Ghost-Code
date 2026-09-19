import {
  ILanguageAdapter,
  ProjectScanContext,
  SyntaxDiagnostic,
  MutationCandidate
} from '../core/languageAdapter';
import {
  AnalysisIssue,
  DependencyNode,
  DependencyEdge,
  TestSuite,
  ExecutionEvent,
  LanguageCapabilityRecord
} from '../../../../shared/types';
import { ProcessRunner } from '../../execution/processRunner';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../../config';

export class CAdapter implements ILanguageAdapter {
  languageId: string = 'c';
  displayName: string = 'C';
  readonly fileExtensions: string[] = ['.c', '.h'];
  readonly defaultManifests: string[] = ['Makefile', 'CMakeLists.txt'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /#include\s+<stdio\.h>/.test(content) || /int\s+main\s*\(/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'c',
      displayName: 'C',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'SUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'SUPPORTED',
      toolchainDetected: true,
      binary: 'C:\\Strawberry\\c\\bin\\gcc.exe',
      version: 'GCC 13.2.0',
      notes: 'Native MinGW GCC available for compilation & execution'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    let openBraces = 0;
    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
      }
    }

    if (openBraces !== 0) {
      diagnostics.push({
        line: lines.length,
        column: 1,
        message: `Mismatched curly braces in C source (${openBraces > 0 ? 'unclosed {' : 'extra }'})`,
        severity: 'CRITICAL'
      });
    }

    return diagnostics;
  }

  async analyzeStatic(source: string, filePath: string, context: ProjectScanContext): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      // Rule 1: strcpy / gets buffer overflow vulnerability
      if (/\b(?:gets|strcpy|strcat|sprintf)\s*\(/.test(trimmed)) {
        const funcName = trimmed.match(/\b(gets|strcpy|strcat|sprintf)\b/)![1];
        issues.push({
          id: `C-BUF-OVR-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf(funcName) + 1,
          languageId: 'c',
          ruleId: 'C-UNSAFE-STRING-FUNCTION',
          category: 'SECURITY',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: `Dangerous Unbounded Buffer Copy (${funcName})`,
          description: `Function "${funcName}" does not perform buffer boundary checks, causing stack/heap buffer overflows.`,
          technicalExplanation: 'Unchecked memory copy functions allow unbounded writes past buffer margins, leading to arbitrary code execution (CWE-120).',
          potentialImpact: 'Remote code execution, memory corruption, and segmentation faults.',
          suggestedFix: `Replace ${funcName} with bounded equivalent (fgets, strncpy, snprintf).`,
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 2: Division by zero
      if (/\/\s*0(?![.\d])/.test(trimmed)) {
        issues.push({
          id: `C-DIV0-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('/') + 1,
          languageId: 'c',
          ruleId: 'C-DIV-BY-ZERO',
          category: 'PRECISION',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'Division by Constant Zero (SIGFPE)',
          description: 'Integer division by zero causes hardware trap and immediate SIGFPE process termination.',
          suggestedFix: 'Verify denominator variable is nonzero before division.',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }
    }

    return issues;
  }

  async extractDependencies(source: string, filePath: string, context: ProjectScanContext): Promise<{ nodes: DependencyNode[]; edges: DependencyEdge[] }> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const lines = source.split(/\r?\n/);

    const fileNodeId = `c:${filePath}`;
    nodes.push({
      id: fileNodeId,
      projectId: context.projectId,
      nodeType: 'FILE',
      name: path.basename(filePath),
      qualifiedName: fileNodeId,
      filePath
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const incMatch = line.match(/^#include\s+[<"](.*)[>"]/);
      if (incMatch) {
        const header = incMatch[1];
        const targetId = `c:include:${header}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: header,
          qualifiedName: targetId,
          filePath: header
        });
        edges.push({
          id: `inc:${fileNodeId}->${targetId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: targetId,
          edgeType: 'IMPORTS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }
    }

    return { nodes, edges };
  }

  async generateMutations(source: string, filePath: string): Promise<MutationCandidate[]> {
    const mutations: MutationCandidate[] = [];
    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      if (line.includes(' == ')) {
        const mutated = line.replace(' == ', ' != ');
        mutations.push({
          operatorName: 'C_EQUALITY_INVERT',
          lineNumber: lineNum,
          originalSnippet: line,
          mutatedSnippet: mutated,
          diffUnified: `@@ -${lineNum},1 +${lineNum},1 @@\n-${line}\n+${mutated}`
        });
      }
    }

    return mutations;
  }

  async generateTests(source: string, filePath: string, issues: AnalysisIssue[]): Promise<TestSuite> {
    return {
      id: '',
      projectId: '',
      name: `C Diagnostic Test Harness for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'c',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'Buffer Overflow Bounds Check',
          category: 'BOUNDARY',
          inputParameters: '{"buffer_len": 256, "input_len": 512}',
          expectedOutput: 'BOUNDS_ERROR_SAFE_REJECT',
          timeoutMs: 5000
        }
      ]
    };
  }

  async traceExecution(source: string, filePath: string, inputs: unknown): Promise<{ events: ExecutionEvent[]; output: string; exitCode: number }> {
    const events: ExecutionEvent[] = [];
    const tempDir = path.join(config.sandboxDir, `c_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const sourceFile = path.join(tempDir, 'main.c');
    const exeFile = path.join(tempDir, 'main.exe');
    fs.writeFileSync(sourceFile, source, 'utf8');

    const compileResult = await ProcessRunner.run({
      executable: 'C:\\Strawberry\\c\\bin\\gcc.exe',
      args: ['-o', exeFile, sourceFile],
      workingDirectory: tempDir
    });

    if (compileResult.exitCode !== 0) {
      return {
        events: [],
        output: compileResult.stderr || 'C compilation error',
        exitCode: compileResult.exitCode || 1
      };
    }

    const runResult = await ProcessRunner.run({
      executable: exeFile,
      args: [],
      workingDirectory: tempDir,
      stdinInput: typeof inputs === 'string' ? inputs : JSON.stringify(inputs)
    });

    events.push({
      id: '',
      executionRunId: '',
      sequenceOrder: 1,
      eventType: 'STDOUT',
      timestampOffsetMs: runResult.durationMs,
      payloadJson: JSON.stringify({ stdout: runResult.stdout })
    });

    return {
      events,
      output: runResult.stdout || runResult.stderr,
      exitCode: runResult.exitCode || 0
    };
  }
}
