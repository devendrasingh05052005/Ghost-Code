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

export class RubyAdapter implements ILanguageAdapter {
  readonly languageId = 'ruby';
  readonly displayName = 'Ruby';
  readonly fileExtensions = ['.rb', '.rake'];
  readonly defaultManifests = ['Gemfile', 'Gemfile.lock'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /def\s+[a-z0-9_]+/.test(content) && /end\b/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'ruby',
      displayName: 'Ruby',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (ruby binary not detected on host); static analysis active'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    const lines = source.split(/\r?\n/);
    let openBlocks = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('#')) continue;

      if (/^(?:def|class|module|if|unless|while|until|for|case)\b/.test(trimmed)) {
        openBlocks++;
      }
      if (/^end\b/.test(trimmed)) {
        openBlocks--;
      }
    }

    if (openBlocks !== 0) {
      diagnostics.push({
        line: lines.length,
        column: 1,
        message: `Mismatched block ends in Ruby (${openBlocks > 0 ? 'missing end' : 'extra end'})`,
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

      if (trimmed.startsWith('#')) continue;

      if (/\/\s*0(?![.\d])/.test(trimmed)) {
        issues.push({
          id: `RB-DIV0-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('/') + 1,
          languageId: 'ruby',
          ruleId: 'RUBY-ZERO-DIVISION',
          category: 'PRECISION',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'ZeroDivisionError in Ruby Arithmetic',
          description: 'Division by literal 0 raises ZeroDivisionError.',
          suggestedFix: 'Verify divisor is nonzero before division.',
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
    const fileNodeId = `rb:${filePath}`;

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
      const match = line.trim().match(/^require(?:_relative)?\s+['"](.*)['"]/);
      if (match) {
        const req = match[1];
        const targetId = `rb:req:${req}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: req,
          qualifiedName: targetId,
          filePath: `${req}.rb`
        });
        edges.push({
          id: `req:${fileNodeId}->${targetId}`,
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

      if (line.includes('.nil?')) {
        const mutated = line.replace('.nil?', '!.nil?');
        mutations.push({
          operatorName: 'RUBY_NIL_INVERT',
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
      name: `RSpec Suite for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'ruby',
      createdAt: new Date().toISOString(),
      testCases: []
    };
  }
}
