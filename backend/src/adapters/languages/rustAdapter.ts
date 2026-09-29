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

export class RustAdapter implements ILanguageAdapter {
  readonly languageId = 'rust';
  readonly displayName = 'Rust';
  readonly fileExtensions = ['.rs'];
  readonly defaultManifests = ['Cargo.toml', 'Cargo.lock'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /fn\s+[a-z0-9_]+\s*\(/.test(content) && (/let\s+mut\s+/.test(content) || /impl\s+[A-Za-z0-9_]+/.test(content));
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'rust',
      displayName: 'Rust',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (rustc not detected on host); static analysis active'
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
        message: `Mismatched braces in Rust source (${openBraces > 0 ? 'unclosed {' : 'extra }'})`,
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

      // Rule 1: .unwrap() usage (causes panic on Err / None)
      if (/\.unwrap\(\)/.test(trimmed)) {
        issues.push({
          id: `RS-UNWRAP-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('.unwrap()') + 1,
          languageId: 'rust',
          ruleId: 'RUST-UNCHECKED-UNWRAP',
          category: 'SECURITY',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Unchecked .unwrap() Call on Result or Option',
          description: 'Calling .unwrap() triggers an immediate thread panic if the value is Err or None.',
          technicalExplanation: 'Production Rust services should handle recoverable errors via "match", "if let", or the "?" operator.',
          suggestedFix: 'Replace .unwrap() with "?" or .expect("meaningful context") or error-matching.',
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
    const fileNodeId = `rs:${filePath}`;

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
      const match = line.trim().match(/^use\s+([a-zA-Z0-9_:]+);/);
      if (match) {
        const crate = match[1];
        const targetId = `rs:crate:${crate}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: crate,
          qualifiedName: targetId,
          filePath: crate
        });
        edges.push({
          id: `use:${fileNodeId}->${targetId}`,
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

      if (line.includes('.is_some()')) {
        const mutated = line.replace('.is_some()', '.is_none()');
        mutations.push({
          operatorName: 'RUST_OPTION_INVERT',
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
      name: `Rust Integration Tests for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'rust',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'None / Err Panic Protection Test',
          category: 'BOUNDARY',
          inputParameters: '{"option": None}',
          expectedOutput: 'panic averted',
          timeoutMs: 5000
        }
      ]
    };
  }
}
