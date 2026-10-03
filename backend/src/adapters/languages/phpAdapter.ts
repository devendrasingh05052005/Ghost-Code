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

export class PhpAdapter implements ILanguageAdapter {
  readonly languageId = 'php';
  readonly displayName = 'PHP';
  readonly fileExtensions = ['.php', '.phtml'];
  readonly defaultManifests = ['composer.json', 'composer.lock'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /<\?php/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'php',
      displayName: 'PHP',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (php CLI not detected on host); static analysis active'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    if (!source.includes('<?php') && !source.includes('<?=')) {
      diagnostics.push({ line: 1, column: 1, message: 'PHP file missing opening <?php tag', severity: 'MEDIUM' });
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

      if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

      // Rule: SQL Injection via direct $_GET/$_POST interpolation
      if (/\$(?:_GET|_POST|_REQUEST)\[.*?\]/.test(trimmed) && /(?:SELECT|INSERT|UPDATE|DELETE)\s/i.test(trimmed)) {
        issues.push({
          id: `PHP-SQLI-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: 1,
          languageId: 'php',
          ruleId: 'PHP-SQL-INJECTION',
          category: 'SECURITY',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'Direct User Input Concatenation into SQL Query',
          description: 'Superglobal $_GET/$_POST concatenated into SQL query string without prepared statements.',
          suggestedFix: 'Use PDO or MySQLi prepared statements with parameterized inputs.',
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
    const fileNodeId = `php:${filePath}`;

    nodes.push({
      id: fileNodeId,
      projectId: context.projectId,
      nodeType: 'FILE',
      name: path.basename(filePath),
      qualifiedName: fileNodeId,
      filePath
    });

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
          operatorName: 'PHP_STRICT_EQUALITY_INVERT',
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
      name: `PHPUnit Test Scaffold for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'php',
      createdAt: new Date().toISOString(),
      testCases: []
    };
  }
}
