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

export class KotlinAdapter implements ILanguageAdapter {
  readonly languageId = 'kotlin';
  readonly displayName = 'Kotlin';
  readonly fileExtensions = ['.kt', '.kts'];
  readonly defaultManifests = ['build.gradle.kts'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /fun\s+[a-zA-Z0-9_]+\s*\(/.test(content) && (/val\s+/.test(content) || /var\s+/.test(content));
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'kotlin',
      displayName: 'Kotlin',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (kotlinc not detected on host); static analysis active'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    let openBraces = 0;
    const lines = source.split(/\r?\n/);

    for (const line of lines) {
      for (const char of line) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
      }
    }

    if (openBraces !== 0) {
      diagnostics.push({
        line: lines.length,
        column: 1,
        message: `Mismatched braces in Kotlin source (${openBraces > 0 ? 'unclosed {' : 'extra }'})`,
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

      // Rule: Not-null assertion operator (!!)
      if (/[A-Za-z0-9_]+!!/.test(trimmed)) {
        issues.push({
          id: `KT-NOT-NULL-ASSERT-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('!!') + 1,
          languageId: 'kotlin',
          ruleId: 'KOTLIN-NOT-NULL-ASSERTION',
          category: 'SECURITY',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Unsafe Not-Null Assertion Operator (!!)',
          description: 'Using "!!" converts any nullable reference to non-null and throws KotlinNullPointerException if null.',
          suggestedFix: 'Use safe call operator (?.) or Elvis operator (?:).',
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
    const fileNodeId = `kt:${filePath}`;

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
      const match = line.trim().match(/^import\s+([a-zA-Z0-9_.]+)/);
      if (match) {
        const imp = match[1];
        const targetId = `kt:imp:${imp}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: imp,
          qualifiedName: targetId,
          filePath: imp
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

      if (line.includes(' ?: ')) {
        const mutated = line.replace(' ?: ', ' !! ');
        mutations.push({
          operatorName: 'KOTLIN_ELVIS_INVERT',
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
      name: `Kotlin Test Suite for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'kotlin',
      createdAt: new Date().toISOString(),
      testCases: []
    };
  }
}
