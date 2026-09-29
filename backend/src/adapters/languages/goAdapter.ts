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

export class GoAdapter implements ILanguageAdapter {
  readonly languageId = 'go';
  readonly displayName = 'Go';
  readonly fileExtensions = ['.go'];
  readonly defaultManifests = ['go.mod', 'go.sum'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /package\s+[a-z0-9_]+/.test(content) && /func\s+[a-zA-Z0-9_]+\s*\(/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'go',
      displayName: 'Go',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (go binary not detected); static analysis active'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    if (!/package\s+[a-z0-9_]+/.test(source)) {
      diagnostics.push({ line: 1, column: 1, message: 'Go file missing package declaration', severity: 'CRITICAL' });
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

      // Rule 1: Ignored error return value (e.g., "val, _ :=")
      if (/,\s*_\s*:?=\s*[a-zA-Z0-9_.]+\(/.test(trimmed)) {
        issues.push({
          id: `GO-ERR-IGN-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: 1,
          languageId: 'go',
          ruleId: 'GO-IGNORED-ERROR',
          category: 'LOGIC',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Unchecked Error Return Value via Blank Identifier (_)',
          description: 'Function call ignores error return value by assigning it to blank identifier "_".',
          technicalExplanation: 'In idiomatic Go, ignoring error returns hides file I/O failures, network disconnects, or invalid inputs.',
          suggestedFix: 'Check error value explicitly: "if err != nil { return err }".',
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
    const fileNodeId = `go:${filePath}`;

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
      const match = line.trim().match(/^import\s+['"](.*)['"]/);
      if (match) {
        const pkg = match[1];
        const targetId = `go:pkg:${pkg}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: pkg,
          qualifiedName: targetId,
          filePath: pkg
        });
        edges.push({
          id: `imp:${fileNodeId}->${targetId}`,
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

      if (line.includes(' != nil')) {
        const mutated = line.replace(' != nil', ' == nil');
        mutations.push({
          operatorName: 'GO_NIL_CHECK_INVERT',
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
      name: `Go Test Suite for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'go',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'Nil Pointer Dereference Guard',
          category: 'BOUNDARY',
          inputParameters: '{"ptr": nil}',
          expectedOutput: 'panic avoided',
          timeoutMs: 5000
        }
      ]
    };
  }
}
