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

export class SwiftAdapter implements ILanguageAdapter {
  readonly languageId = 'swift';
  readonly displayName = 'Swift';
  readonly fileExtensions = ['.swift'];
  readonly defaultManifests = ['Package.swift'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /import\s+Foundation/.test(content) || /func\s+[a-zA-Z0-9_]+\s*\(.*?\)\s*(?:->\s*[A-Za-z0-9_]+)?\s*\{/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'swift',
      displayName: 'Swift',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (swift CLI not detected on host); static analysis active'
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
        message: `Mismatched braces in Swift source (${openBraces > 0 ? 'unclosed {' : 'extra }'})`,
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

      // Rule: Force unwrapping operator (!) on optionals
      if (/[A-Za-z0-9_]+!\s*(?:\.|\)|,|;|$)/.test(trimmed) && !trimmed.includes('!=') && !trimmed.includes('!')) {
        issues.push({
          id: `SWIFT-FORCE-UNWRAP-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('!') + 1,
          languageId: 'swift',
          ruleId: 'SWIFT-FORCE-UNWRAP',
          category: 'SECURITY',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Unsafe Force Unwrapping of Optional (!)',
          description: 'Force unwrapping an optional variable causes runtime fatalError crash if value is nil.',
          suggestedFix: 'Use optional binding (if let or guard let) or nil-coalescing operator (??).',
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
    const fileNodeId = `swift:${filePath}`;

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
      const match = line.trim().match(/^import\s+([A-Za-z0-9_]+)/);
      if (match) {
        const mod = match[1];
        const targetId = `swift:mod:${mod}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: mod,
          qualifiedName: targetId,
          filePath: mod
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

      if (line.includes(' == nil')) {
        const mutated = line.replace(' == nil', ' != nil');
        mutations.push({
          operatorName: 'SWIFT_NIL_INVERT',
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
      name: `XCTest Harness for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'swift',
      createdAt: new Date().toISOString(),
      testCases: []
    };
  }
}
