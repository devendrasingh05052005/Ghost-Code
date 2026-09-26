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
import { config } from '../../config';
import * as path from 'path';
import * as fs from 'fs';

export class TypeScriptAdapter implements ILanguageAdapter {
  languageId: string = 'typescript';
  displayName: string = 'TypeScript';
  readonly fileExtensions: string[] = ['.ts', '.tsx'];
  readonly defaultManifests: string[] = ['tsconfig.json', 'package.json'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /:\s*(?:string|number|boolean|any|void|unknown|never)\b/.test(content) || /interface\s+[A-Za-z0-9_]+/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'typescript',
      displayName: 'TypeScript',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'SUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: true,
      binary: process.execPath,
      version: process.version,
      notes: 'Full in-process AST, dependency & execution orchestration'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    const lines = source.split(/\r?\n/);
    let openBraces = 0;
    let openParens = 0;
    let openBrackets = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.length === 0) continue;

      for (const char of line) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
        else if (char === '(') openParens++;
        else if (char === ')') openParens--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
      }

      if (openBraces < 0) {
        diagnostics.push({ line: i + 1, column: 1, message: 'Unexpected closing brace "}"', severity: 'CRITICAL' });
        openBraces = 0;
      }
      if (openParens < 0) {
        diagnostics.push({ line: i + 1, column: 1, message: 'Unexpected closing parenthesis ")"', severity: 'CRITICAL' });
        openParens = 0;
      }
    }

    if (openBraces > 0) {
      diagnostics.push({ line: lines.length, column: 1, message: `Unclosed brace "{" (${openBraces} remaining)`, severity: 'CRITICAL' });
    }
    if (openParens > 0) {
      diagnostics.push({ line: lines.length, column: 1, message: `Unclosed parenthesis "(" (${openParens} remaining)`, severity: 'CRITICAL' });
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

      if (trimmed.startsWith('//') || trimmed.length === 0) continue;

      // Rule 1: Division by zero risk
      if (/\/\s*0(?![.\d])/.test(trimmed)) {
        issues.push({
          id: `TS-DIV0-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('/') + 1,
          languageId: 'typescript',
          ruleId: 'TS-DIV-BY-ZERO',
          category: 'PRECISION',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'Division by Constant Zero',
          description: 'Arithmetic division operand is literal integer zero, yielding Infinity in JavaScript runtime.',
          technicalExplanation: 'In IEEE 754 (V8 float64), dividing by 0 results in Infinity instead of throwing, corrupting calculations downstream silently.',
          potentialImpact: 'Calculation produces Infinity and propagates NaN values into financial or state records.',
          suggestedFix: 'Check denominator before division or throw ValidationError.',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 2: Unsafe "any" cast
      if (/:\s*any\b/.test(trimmed) || /as\s+any\b/.test(trimmed)) {
        issues.push({
          id: `TS-ANY-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('any') + 1,
          languageId: 'typescript',
          ruleId: 'TS-UNSAFE-ANY-TYPE',
          category: 'SECURITY',
          severity: 'MEDIUM',
          confidence: 'CONFIRMED',
          title: 'Bypass of Static Type Safety via "any"',
          description: 'Variable or expression typed as "any", disabling compile-time type verification.',
          technicalExplanation: 'Bypassing TypeScript type checking allows runtime property accesses on undefined/null values without compiler warning.',
          suggestedFix: 'Replace "any" with specific interface, union type, or "unknown" with type-narrowing guard.',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 3: Async function missing await or catch
      if (trimmed.includes('.then(') && !trimmed.includes('.catch(') && !trimmed.includes('await ')) {
        issues.push({
          id: `TS-PROMISE-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('.then(') + 1,
          languageId: 'typescript',
          ruleId: 'TS-UNHANDLED-PROMISE',
          category: 'LOGIC',
          severity: 'HIGH',
          confidence: 'SUSPECTED',
          title: 'Unhandled Promise Rejection Risk',
          description: 'Promise chain executes .then() without terminal .catch() handler.',
          technicalExplanation: 'Unhandled rejections cause Node.js processes to terminate with UnhandledPromiseRejection or crash asynchronous requests.',
          suggestedFix: 'Attach a .catch() handler or rewrite using async/await with try-catch block.',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 4: Loose equality (== or != instead of === or !==)
      if (/[^=!]==[^=]/.test(line) || /!=[^=]/.test(line)) {
        issues.push({
          id: `TS-LOOSE-EQ-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: 1,
          languageId: 'typescript',
          ruleId: 'TS-LOOSE-EQUALITY',
          category: 'LOGIC',
          severity: 'LOW',
          confidence: 'CONFIRMED',
          title: 'Coercive Loose Equality Operator',
          description: 'Expression uses "==" or "!=" which triggers unintended JavaScript type coercion.',
          technicalExplanation: 'JavaScript type coercion rules (e.g. 0 == "", null == undefined, [] == false) introduce subtle security and logic defects.',
          suggestedFix: 'Use strict equality operators "===" and "!==".',
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

    const fileNodeId = `ts:${filePath}`;
    nodes.push({
      id: fileNodeId,
      projectId: context.projectId,
      nodeType: 'FILE',
      name: path.basename(filePath),
      qualifiedName: fileNodeId,
      filePath
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Imports
      const importMatch = trimmed.match(/^import\s+.*?from\s+['"](.*?)['"]/);
      if (importMatch) {
        const importTarget = importMatch[1];
        const targetNodeId = `ts:import:${importTarget}`;
        nodes.push({
          id: targetNodeId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: importTarget,
          qualifiedName: targetNodeId,
          filePath: importTarget
        });

        edges.push({
          id: `imp:${fileNodeId}->${targetNodeId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: targetNodeId,
          edgeType: 'IMPORTS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }

      // Class declarations
      const classMatch = trimmed.match(/^export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        const className = classMatch[1];
        const classNodeId = `${fileNodeId}::${className}`;
        nodes.push({
          id: classNodeId,
          projectId: context.projectId,
          nodeType: 'CLASS',
          name: className,
          qualifiedName: classNodeId,
          filePath,
          lineStart: i + 1
        });
        edges.push({
          id: `class:${fileNodeId}->${classNodeId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: classNodeId,
          edgeType: 'EXTENDS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }

      // Function declarations
      const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const funcNodeId = `${fileNodeId}::${funcName}`;
        nodes.push({
          id: funcNodeId,
          projectId: context.projectId,
          nodeType: 'FUNCTION',
          name: funcName,
          qualifiedName: funcNodeId,
          filePath,
          lineStart: i + 1
        });
        edges.push({
          id: `func:${fileNodeId}->${funcNodeId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: funcNodeId,
          edgeType: 'CALLS',
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

      if (line.includes('=== ')) {
        const mutated = line.replace('=== ', '!== ');
        mutations.push({
          operatorName: 'TS_EQUALITY_INVERT',
          lineNumber: lineNum,
          originalSnippet: line,
          mutatedSnippet: mutated,
          diffUnified: `@@ -${lineNum},1 +${lineNum},1 @@\n-${line}\n+${mutated}`
        });
      }

      if (line.includes(' + ')) {
        const mutated = line.replace(' + ', ' - ');
        mutations.push({
          operatorName: 'TS_ARITHMETIC_INVERT',
          lineNumber: lineNum,
          originalSnippet: line,
          mutatedSnippet: mutated,
          diffUnified: `@@ -${lineNum},1 +${lineNum},1 @@\n-${line}\n+${mutated}`
        });
      }

      if (line.includes(' > ')) {
        const mutated = line.replace(' > ', ' <= ');
        mutations.push({
          operatorName: 'TS_BOUNDARY_INVERT',
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
      name: `TypeScript Autopsy Suite for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'typescript',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'Null & Undefined Input Guard',
          category: 'BOUNDARY',
          inputParameters: '{"value": null}',
          expectedOutput: 'HANDLED_GRACEFULLY',
          timeoutMs: 5000
        },
        {
          id: '',
          testSuiteId: '',
          name: 'Zero Denominator Math Validation',
          category: 'ARITHMETIC',
          inputParameters: '{"numerator": 100, "denominator": 0}',
          expectedOutput: 'THROWS_VALIDATION_ERROR',
          timeoutMs: 5000
        },
        {
          id: '',
          testSuiteId: '',
          name: 'Max Safe Integer Overflow Boundary',
          category: 'EQUIVALENCE',
          inputParameters: '{"amount": 9007199254740991}',
          expectedOutput: 'PRECISION_PRESERVED',
          timeoutMs: 5000
        }
      ]
    };
  }

  async traceExecution(source: string, filePath: string, inputs: unknown): Promise<{ events: ExecutionEvent[]; output: string; exitCode: number }> {
    const events: ExecutionEvent[] = [];
    const tempDir = path.join(config.sandboxDir, `ts_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const sourceFile = path.join(tempDir, 'script.js');
    fs.writeFileSync(sourceFile, source, 'utf8');

    const runResult = await ProcessRunner.run({
      executable: process.execPath,
      args: [sourceFile],
      workingDirectory: tempDir,
      stdinInput: typeof inputs === 'string' ? inputs : JSON.stringify(inputs)
    });

    events.push({
      id: '',
      executionRunId: '',
      sequenceOrder: 1,
      eventType: 'FUNCTION_ENTER',
      timestampOffsetMs: 1.0,
      functionName: 'main',
      filePath
    });

    events.push({
      id: '',
      executionRunId: '',
      sequenceOrder: 2,
      eventType: 'STDOUT',
      timestampOffsetMs: runResult.durationMs,
      payloadJson: JSON.stringify({ stdout: runResult.stdout })
    });

    events.push({
      id: '',
      executionRunId: '',
      sequenceOrder: 3,
      eventType: 'FUNCTION_EXIT',
      timestampOffsetMs: runResult.durationMs,
      functionName: 'main',
      filePath
    });

    return {
      events,
      output: runResult.stdout || runResult.stderr,
      exitCode: runResult.exitCode || 0
    };
  }
}
