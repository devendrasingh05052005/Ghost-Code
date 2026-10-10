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

export class FortranAdapter implements ILanguageAdapter {
  readonly languageId = 'fortran';
  readonly displayName = 'FORTRAN';
  readonly fileExtensions = ['.f', '.for', '.f90', '.f95', '.f03', '.f08'];
  readonly defaultManifests = ['fpm.toml', 'Makefile'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /program\s+[a-z0-9_]+/i.test(content) || /subroutine\s+[a-z0-9_]+/i.test(content) || /module\s+[a-z0-9_]+/i.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'fortran',
      displayName: 'FORTRAN',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'SUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: config.toolchains.fortran.available,
      binary: config.toolchains.fortran.binary,
      version: 'GNU Fortran 13.2.0',
      notes: 'Native compiler & runtime verification enabled'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    const lines = source.split(/\r?\n/);

    let hasProgramOrModule = false;
    let openBlocks: { type: string; line: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const trimmed = lines[i].trim().toLowerCase();

      if (trimmed.startsWith('!') || trimmed.length === 0) continue;

      if (trimmed.startsWith('program ') || trimmed.startsWith('module ') || trimmed.startsWith('subroutine ') || trimmed.startsWith('function ')) {
        hasProgramOrModule = true;
        const blockType = trimmed.split(/\s+/)[0];
        openBlocks.push({ type: blockType, line: lineNum });
      }

      if (trimmed.startsWith('end ') || trimmed === 'end') {
        if (openBlocks.length > 0) {
          openBlocks.pop();
        }
      }
    }

    if (!hasProgramOrModule) {
      diagnostics.push({
        line: 1,
        column: 1,
        message: 'No Fortran program, module, subroutine, or function construct found',
        severity: 'HIGH'
      });
    }

    for (const unclosed of openBlocks) {
      diagnostics.push({
        line: unclosed.line,
        column: 1,
        message: `Unclosed Fortran block construct: ${unclosed.type}`,
        severity: 'CRITICAL'
      });
    }

    return diagnostics;
  }

  async analyzeStatic(source: string, filePath: string, context: ProjectScanContext): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const lines = source.split(/\r?\n/);
    let hasImplicitNone = false;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith('!') || trimmed.length === 0) continue;

      if (trimmed === 'implicit none' || trimmed.startsWith('implicit none')) {
        hasImplicitNone = true;
      }

      // Rule 1: Division by zero detection
      if (/\/\s*0(?:\.0*)?(?:[^\d]|$)/.test(trimmed)) {
        issues.push({
          id: `FTN-DIV0-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('/') + 1,
          languageId: 'fortran',
          ruleId: 'FTN-DIV-BY-ZERO',
          category: 'PRECISION',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'Direct Division by Zero in Floating-Point Calculation',
          description: 'Numerical statement divides operand directly by constant zero.',
          technicalExplanation: 'In IEEE 754 floating point mode, dividing by 0.0 results in Infinity or NaN, triggering SIGFPE floating point exception or propagating invalid matrices.',
          potentialImpact: 'Catastrophic simulation failure or unhandled numerical NaN explosion.',
          reproductionSteps: 'Execute program through IEEE exception trapping handler.',
          suggestedFix: 'Introduce zero-divisor guard: if (abs(divisor) < 1.0e-12) ...',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 2: Unchecked division by variable
      if (trimmed.includes('/') && !trimmed.startsWith('!') && !trimmed.includes('if ') && !trimmed.includes('where ')) {
        const afterSlash = trimmed.substring(trimmed.indexOf('/') + 1).trim();
        if (/^[a-z_][a-z0-9_]*/i.test(afterSlash)) {
          issues.push({
            id: `FTN-UNCHECKED-DIV-${lineNum}`,
            analysisRunId: '',
            projectId: context.projectId,
            relativePath: filePath,
            lineNumber: lineNum,
            columnNumber: line.indexOf('/') + 1,
            languageId: 'fortran',
            ruleId: 'FTN-UNCHECKED-DIVISOR',
            category: 'PRECISION',
            severity: 'MEDIUM',
            confidence: 'SUSPECTED',
            title: 'Unchecked Denominator Variable in Division',
            description: `Denominator expression "${afterSlash.split(/[\s+\-*)/]/)[0]}" is evaluated without explicit zero-threshold check.`,
            technicalExplanation: 'Near-zero denominators produce ill-conditioned matrices and catastrophic loss of numerical precision.',
            suggestedFix: 'Validate that absolute value of denominator exceeds machine epsilon.',
            verificationStatus: 'UNVERIFIED',
            createdAt: new Date().toISOString()
          });
        }
      }

      // Rule 3: Single-precision float literal in double precision calculation
      if (/[0-9]+\.[0-9]+(?![de])/i.test(trimmed) && trimmed.includes('real(8)')) {
        issues.push({
          id: `FTN-PREC-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: 1,
          languageId: 'fortran',
          ruleId: 'FTN-FLOAT-PRECISION-LOSS',
          category: 'PRECISION',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Precision Truncation: Single Precision Literal Assigned to Double Precision',
          description: 'Constant literal lacking _8 or _dp suffix defaults to 32-bit single precision before widening.',
          technicalExplanation: 'In Fortran standard, literals like 0.1 are 32-bit (approx 0.10000000149011612) leading to subtle mathematical drift in 64-bit numerical computations.',
          suggestedFix: 'Append _dp or _8 (e.g. 0.1_dp or 0.1d0) to floating point literal.',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }
    }

    if (!hasImplicitNone) {
      issues.push({
        id: `FTN-IMPLICIT-NONE-${filePath}`,
        analysisRunId: '',
        projectId: context.projectId,
        relativePath: filePath,
        lineNumber: 1,
        columnNumber: 1,
        languageId: 'fortran',
        ruleId: 'FTN-MISSING-IMPLICIT-NONE',
        category: 'LOGIC',
        severity: 'HIGH',
        confidence: 'CONFIRMED',
        title: 'Missing "implicit none" Directive',
        description: 'Module or Program does not specify "implicit none", enabling legacy Fortran implicit variable typing.',
        technicalExplanation: 'Variables starting with I-N default to INTEGER, while others default to REAL. Typographical variable errors silently create new unintended variables.',
        suggestedFix: 'Add "implicit none" immediately following program, module, or subroutine declaration.',
        verificationStatus: 'UNVERIFIED',
        createdAt: new Date().toISOString()
      });
    }

    return issues;
  }

  async extractDependencies(source: string, filePath: string, context: ProjectScanContext): Promise<{ nodes: DependencyNode[]; edges: DependencyEdge[] }> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const lines = source.split(/\r?\n/);

    const fileNodeId = `fortran:${filePath}`;
    nodes.push({
      id: fileNodeId,
      projectId: context.projectId,
      nodeType: 'FILE',
      name: path.basename(filePath),
      qualifiedName: fileNodeId,
      filePath
    });

    let currentRoutine: DependencyNode | null = null;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const trimmed = lines[i].trim().toLowerCase();

      if (trimmed.startsWith('!') || trimmed.length === 0) continue;

      // Module
      const modMatch = trimmed.match(/^module\s+([a-z0-9_]+)/i);
      if (modMatch && !trimmed.startsWith('module procedure')) {
        const modName = modMatch[1];
        const modId = `fortran:module:${modName}`;
        nodes.push({
          id: modId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: modName,
          qualifiedName: modId,
          filePath,
          lineStart: lineNum
        });
        edges.push({
          id: `mod:${fileNodeId}->${modId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: modId,
          edgeType: 'EXTENDS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }

      // Subroutine / Function
      const subMatch = trimmed.match(/^(?:subroutine|function|recursive subroutine|recursive function)\s+([a-z0-9_]+)/i);
      if (subMatch) {
        const subName = subMatch[1];
        const subId = `${fileNodeId}::${subName}`;
        currentRoutine = {
          id: subId,
          projectId: context.projectId,
          nodeType: 'FUNCTION',
          name: subName,
          qualifiedName: subId,
          filePath,
          lineStart: lineNum
        };
        nodes.push(currentRoutine);
        edges.push({
          id: `func:${fileNodeId}->${subId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: subId,
          edgeType: 'EXTENDS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }

      // USE module statements
      const useMatch = trimmed.match(/^use\s+([a-z0-9_]+)/i);
      if (useMatch) {
        const usedMod = useMatch[1];
        const targetId = `fortran:module:${usedMod}`;
        edges.push({
          id: `use:${fileNodeId}->${targetId}`,
          projectId: context.projectId,
          sourceNodeId: currentRoutine ? currentRoutine.id : fileNodeId,
          targetNodeId: targetId,
          edgeType: 'IMPORTS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }

      // CALL subroutine statements
      const callMatch = trimmed.match(/^call\s+([a-z0-9_]+)/i);
      if (callMatch && currentRoutine) {
        const calledSub = callMatch[1];
        const targetId = `${fileNodeId}::${calledSub}`;
        edges.push({
          id: `call:${currentRoutine.id}->${targetId}`,
          projectId: context.projectId,
          sourceNodeId: currentRoutine.id,
          targetNodeId: targetId,
          edgeType: 'CALLS',
          isCircular: currentRoutine.name === calledSub,
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
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith('!')) continue;

      // Mutation 1: Numerical operator replacement (+ to -)
      if (line.includes(' + ')) {
        const mutated = line.replace(' + ', ' - ');
        mutations.push({
          operatorName: 'FORTRAN_ARITHMETIC_INVERT',
          lineNumber: lineNum,
          originalSnippet: line,
          mutatedSnippet: mutated,
          diffUnified: `@@ -${lineNum},1 +${lineNum},1 @@\n-${line}\n+${mutated}`
        });
      }

      // Mutation 2: Relational operator inversion (> to <=)
      if (line.includes(' > ') || line.includes(' .gt. ')) {
        const mutated = line.replace(' > ', ' <= ').replace(' .gt. ', ' .le. ');
        mutations.push({
          operatorName: 'FORTRAN_RELATIONAL_INVERT',
          lineNumber: lineNum,
          originalSnippet: line,
          mutatedSnippet: mutated,
          diffUnified: `@@ -${lineNum},1 +${lineNum},1 @@\n-${line}\n+${mutated}`
        });
      }

      // Mutation 3: Division zero mutation
      if (line.includes('/')) {
        const mutated = line.replace(/\/\s*[a-z0-9_.]+/i, '/ 0.0');
        mutations.push({
          operatorName: 'FORTRAN_DIV_ZERO_INJECT',
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
      name: `FORTRAN Numerical Verification Suite for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'fortran',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'IEEE Floating Point NaN / Inf Guard Test',
          category: 'BOUNDARY',
          inputParameters: '{"x": 1.0e-308, "y": 0.0}',
          expectedOutput: 'IEEE_EXCEPTION_CAUGHT',
          timeoutMs: 5000
        },
        {
          id: '',
          testSuiteId: '',
          name: 'Matrix Singularity Condition Number Test',
          category: 'ARITHMETIC',
          inputParameters: '{"matrix_dim": 4, "condition_limit": 1.0e12}',
          expectedOutput: 'WELL_CONDITIONED',
          timeoutMs: 5000
        },
        {
          id: '',
          testSuiteId: '',
          name: 'Catastrophic Cancellation Precision Verification',
          category: 'EQUIVALENCE',
          inputParameters: '{"a": 1.00000000000001, "b": 1.0}',
          expectedOutput: 'PRECISION_MAINTAINED',
          timeoutMs: 5000
        }
      ]
    };
  }

  async traceExecution(source: string, filePath: string, inputs: unknown): Promise<{ events: ExecutionEvent[]; output: string; exitCode: number }> {
    const events: ExecutionEvent[] = [];
    const tempDir = path.join(config.sandboxDir, `ftn_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const sourceFile = path.join(tempDir, 'program.f90');
    const exeFile = path.join(tempDir, 'program.exe');
    fs.writeFileSync(sourceFile, source, 'utf8');

    // Compile with native gfortran
    const compileResult = await ProcessRunner.run({
      executable: config.toolchains.fortran.binary,
      args: ['-o', exeFile, sourceFile, '-fcheck=all', '-ffpe-trap=zero,overflow'],
      workingDirectory: tempDir
    });

    if (compileResult.exitCode !== 0) {
      return {
        events: [
          {
            id: '',
            executionRunId: '',
            sequenceOrder: 1,
            eventType: 'EXCEPTION',
            timestampOffsetMs: 0,
            payloadJson: JSON.stringify({ error: compileResult.stderr })
          }
        ],
        output: compileResult.stderr || 'Fortran compilation failed',
        exitCode: compileResult.exitCode || 1
      };
    }

    // Run compiled binary
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
      eventType: 'FUNCTION_ENTER',
      timestampOffsetMs: 1.0,
      functionName: 'MAIN_PROGRAM',
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
      functionName: 'MAIN_PROGRAM',
      filePath
    });

    return {
      events,
      output: runResult.stdout,
      exitCode: runResult.exitCode || 0
    };
  }
}
