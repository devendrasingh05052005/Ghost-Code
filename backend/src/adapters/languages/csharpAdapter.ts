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
  LanguageCapabilityRecord
} from '../../../../shared/types';
import * as path from 'path';

export class CSharpAdapter implements ILanguageAdapter {
  readonly languageId = 'csharp';
  readonly displayName = 'C#';
  readonly fileExtensions = ['.cs'];
  readonly defaultManifests = ['.csproj', '.sln'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /using\s+System;/.test(content) || /namespace\s+[A-Za-z0-9_.]+/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'csharp',
      displayName: 'C#',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (.NET SDK not detected on host); static analysis active'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    let openBraces = 0;
    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      for (const char of lines[i]) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
      }
    }

    if (openBraces !== 0) {
      diagnostics.push({
        line: lines.length,
        column: 1,
        message: `Mismatched braces in C# source (${openBraces > 0 ? 'unclosed {' : 'extra }'})`,
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

      if (trimmed.startsWith('//')) continue;

      if (/\/\s*0(?![.\d])/.test(trimmed)) {
        issues.push({
          id: `CS-DIV0-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('/') + 1,
          languageId: 'csharp',
          ruleId: 'CS-DIV-BY-ZERO',
          category: 'PRECISION',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'Integer Division by Zero (DivideByZeroException)',
          description: 'Division by literal 0 throws System.DivideByZeroException.',
          suggestedFix: 'Guard denominator against zero before division.',
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
    const fileNodeId = `cs:${filePath}`;

    nodes.push({
      id: fileNodeId,
      projectId: context.projectId,
      nodeType: 'FILE',
      name: path.basename(filePath),
      qualifiedName: fileNodeId,
      filePath
    });

    const lines = source.split(/\r?\n/);
    for (const line of lines) {
      const match = line.trim().match(/^using\s+([A-Za-z0-9_.]+);/);
      if (match) {
        const ns = match[1];
        const targetId = `cs:ns:${ns}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: ns,
          qualifiedName: targetId,
          filePath: ns
        });
        edges.push({
          id: `using:${fileNodeId}->${targetId}`,
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
          operatorName: 'CS_EQUALITY_INVERT',
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
      name: `NUnit Test Harness for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'csharp',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'Null Reference Safety Test',
          category: 'BOUNDARY',
          inputParameters: '{"arg": null}',
          expectedOutput: 'ArgumentNullException handled',
          timeoutMs: 5000
        }
      ]
    };
  }
}
