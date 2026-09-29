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

export class JavaAdapter implements ILanguageAdapter {
  readonly languageId = 'java';
  readonly displayName = 'Java';
  readonly fileExtensions = ['.java'];
  readonly defaultManifests = ['pom.xml', 'build.gradle'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /public\s+class\s+[A-Za-z0-9_]+/.test(content) || /package\s+[a-z0-9_.]+;/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'java',
      displayName: 'Java',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'UNSUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'UNSUPPORTED',
      toolchainDetected: false,
      toolchainNotes: 'Toolchain missing (JDK not detected on host); static analysis active'
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
        message: `Mismatched braces in Java source (${openBraces > 0 ? 'unclosed {' : 'extra }'})`,
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

      // Rule 1: Reference comparison instead of .equals()
      if (/[A-Za-z0-9_]+\s*==\s*"(.*?)"/.test(trimmed) || /"(.*?)"\s*==\s*[A-Za-z0-9_]+/.test(trimmed)) {
        issues.push({
          id: `JAVA-STR-EQ-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('==') + 1,
          languageId: 'java',
          ruleId: 'JAVA-STRING-REFERENCE-COMPARE',
          category: 'LOGIC',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'String Reference Comparison Using "=="',
          description: 'Strings compared via "==" checks memory reference identity rather than string content value.',
          technicalExplanation: 'In Java, "==" compares object memory addresses. Non-interned Strings with identical contents will evaluate to false.',
          suggestedFix: 'Use string1.equals(string2) or Objects.equals(s1, s2).',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 2: Division by zero
      if (/\/\s*0(?![.\d])/.test(trimmed)) {
        issues.push({
          id: `JAVA-DIV0-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('/') + 1,
          languageId: 'java',
          ruleId: 'JAVA-DIV-BY-ZERO',
          category: 'PRECISION',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'Integer Division by Zero (ArithmeticException)',
          description: 'Expression divides operand by integer 0 literal, throwing java.lang.ArithmeticException.',
          suggestedFix: 'Verify denominator is non-zero before division.',
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

    const fileNodeId = `java:${filePath}`;
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
      const importMatch = line.match(/^import\s+([a-zA-Z0-9_.]+);/);
      if (importMatch) {
        const imp = importMatch[1];
        const targetId = `java:import:${imp}`;
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

      if (line.includes('.equals(')) {
        const mutated = line.replace('.equals(', '!.equals(');
        mutations.push({
          operatorName: 'JAVA_EQUALS_INVERT',
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
      name: `JUnit Test Scaffold for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'java',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'NullPointerException Boundary Test',
          category: 'BOUNDARY',
          inputParameters: '{"obj": null}',
          expectedOutput: 'NullPointerException avoided',
          timeoutMs: 5000
        }
      ]
    };
  }
}
