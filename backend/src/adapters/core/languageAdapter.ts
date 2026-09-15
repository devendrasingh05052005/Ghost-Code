import {
  AnalysisIssue,
  DependencyNode,
  DependencyEdge,
  InjectedMutation,
  TestSuite,
  ExecutionEvent,
  LanguageCapabilityRecord
} from '../../../../shared/types';

export interface ProjectScanContext {
  projectId: string;
  projectRoot: string;
  files: { relativePath: string; absolutePath: string; languageId: string }[];
}

export interface SyntaxDiagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MutationCandidate {
  operatorName: string;
  lineNumber: number;
  originalSnippet: string;
  mutatedSnippet: string;
  diffUnified: string;
}

export interface ILanguageAdapter {
  readonly languageId: string;
  readonly displayName: string;
  readonly fileExtensions: string[];
  readonly defaultManifests: string[];

  detect(filePath: string, content: string): boolean;
  getCapabilities(): LanguageCapabilityRecord;

  parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]>;
  analyzeStatic(source: string, filePath: string, context: ProjectScanContext): Promise<AnalysisIssue[]>;
  extractDependencies(source: string, filePath: string, context: ProjectScanContext): Promise<{ nodes: DependencyNode[]; edges: DependencyEdge[] }>;
  generateMutations(source: string, filePath: string): Promise<MutationCandidate[]>;
  generateTests(source: string, filePath: string, issues: AnalysisIssue[]): Promise<TestSuite>;
  traceExecution?(source: string, filePath: string, inputs: unknown): Promise<{ events: ExecutionEvent[]; output: string; exitCode: number }>;
}
