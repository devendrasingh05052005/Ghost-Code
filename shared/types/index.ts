export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type IssueCategory = 'SYNTAX' | 'LOGIC' | 'PRECISION' | 'SECURITY' | 'DEAD_CODE' | 'BOUNDARY' | 'RESOURCE';
export type Confidence = 'CONFIRMED' | 'SUSPECTED' | 'HEURISTIC';
export type VerificationStatus = 'UNVERIFIED' | 'FIXED' | 'VERIFIED' | 'DISMISSED';

export interface Project {
  id: string;
  name: string;
  description?: string;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  relativePath: string;
  absolutePath: string;
  languageId: string;
  fileSize: number;
  loc: number;
  hash: string;
  isVendor: boolean;
  isTest: boolean;
  isGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLanguageSummary {
  id: string;
  projectId: string;
  languageId: string;
  fileCount: number;
  locCount: number;
  detectedFrameworks: string[];
  detectedManifests: string[];
}

export type CapabilityStatus = 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED' | 'TOOLCHAIN_MISSING';

export interface LanguageCapabilityRecord {
  languageId: string;
  displayName: string;
  syntaxParsing: CapabilityStatus;
  staticAnalysis: CapabilityStatus;
  dependencyGraph: CapabilityStatus;
  executionTracing: CapabilityStatus;
  bugInjection: CapabilityStatus;
  testGeneration: CapabilityStatus;
  profiling: CapabilityStatus;
  toolchainDetected: boolean;
  toolchainBinary?: string;
  toolchainVersion?: string;
  toolchainNotes?: string;
  binary?: string;
  version?: string;
  notes?: string;
}

export interface AnalysisRun {
  id: string;
  projectId: string;
  runTimestamp: string;
  durationMs: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  healthScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  infoIssues: number;
  configJson?: string;
  errorMessage?: string;
}

export interface AnalysisIssue {
  id: string;
  analysisRunId: string;
  projectId: string;
  fileId?: string;
  relativePath: string;
  lineNumber: number;
  columnNumber: number;
  endLineNumber?: number;
  endColumnNumber?: number;
  languageId: string;
  ruleId: string;
  category: IssueCategory;
  severity: Severity;
  confidence: Confidence;
  title: string;
  description: string;
  technicalExplanation?: string;
  potentialImpact?: string;
  reproductionSteps?: string;
  suggestedFix?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export type NodeType = 'FILE' | 'MODULE' | 'CLASS' | 'FUNCTION' | 'VARIABLE' | 'INTERFACE';
export type EdgeType = 'CALLS' | 'IMPORTS' | 'EXTENDS' | 'USES' | 'INSTANTIATES';

export interface DependencyNode {
  id: string;
  projectId: string;
  nodeType: NodeType;
  name: string;
  qualifiedName: string;
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  metadata?: Record<string, unknown>;
}

export interface DependencyEdge {
  id: string;
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  isCircular: boolean;
  confidence: 'VERIFIED' | 'INFERRED';
  weight: number;
}

export interface DependencyGraphData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  circularCount: number;
}

export interface MutationRun {
  id: string;
  projectId: string;
  runTimestamp: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalMutations: number;
  killedMutations: number;
  survivedMutations: number;
  timedOutMutations: number;
  mutationScore: number;
  configJson?: string;
}

export interface InjectedMutation {
  id: string;
  mutationRunId: string;
  projectId: string;
  fileId?: string;
  filePath: string;
  lineNumber: number;
  operatorName: string;
  originalSnippet: string;
  mutatedSnippet: string;
  isolatedCopyPath: string;
  status: 'INJECTED' | 'ROLLED_BACK' | 'KILLED' | 'SURVIVED' | 'TIMED_OUT';
  detectionTestId?: string;
  diffUnified?: string;
  createdAt: string;
}

export interface ExecutionRun {
  id: string;
  projectId: string;
  targetFile: string;
  languageId: string;
  commandLine: string;
  workingDirectory: string;
  startTime: string;
  durationMs: number;
  exitCode?: number;
  stdoutOutput?: string;
  stderrOutput?: string;
  status: 'RUNNING' | 'COMPLETED' | 'TIMED_OUT' | 'CRASHED';
  peakMemoryBytes: number;
}

export interface ExecutionEvent {
  id: string;
  executionRunId: string;
  sequenceOrder: number;
  eventType: 'FUNCTION_ENTER' | 'FUNCTION_EXIT' | 'VARIABLE_CHANGE' | 'EXCEPTION' | 'STDOUT';
  timestampOffsetMs: number;
  functionName?: string;
  filePath?: string;
  lineNumber?: number;
  variableName?: string;
  oldValue?: string;
  newValue?: string;
  payloadJson?: string;
}

export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  suiteType: 'AUTOMATIC_SYNTHESIZED' | 'REPRODUCER' | 'REGRESSION' | 'MANUAL';
  targetFile: string;
  languageId: string;
  createdAt: string;
  testCases?: TestCase[];
}

export interface TestCase {
  id: string;
  testSuiteId: string;
  name: string;
  category: 'BOUNDARY' | 'ARITHMETIC' | 'EQUIVALENCE' | 'ERROR_HANDLING';
  inputParameters: string;
  expectedOutput?: string;
  timeoutMs: number;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  executionRunId?: string;
  runTimestamp: string;
  passed: boolean;
  actualOutput?: string;
  errorMessage?: string;
  durationMs: number;
}

export interface FixHistoryRecord {
  id: string;
  issueId: string;
  projectId: string;
  filePath: string;
  originalCode: string;
  proposedCode: string;
  diffPatch: string;
  reasoning: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'ROLLED_BACK';
  verificationTestResult?: 'PASSED' | 'FAILED' | 'UNTESTED';
  createdAt: string;
  appliedAt?: string;
  rolledBackAt?: string;
}

export interface PerformanceMetric {
  id: string;
  projectId: string;
  executionRunId?: string;
  filePath: string;
  functionName: string;
  invocationCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  memoryDeltaBytes: number;
  bottleneckScore: number;
  isBottleneck: boolean;
}

export interface CrossLanguageVerificationScenario {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, unknown>;
  cobolResult?: unknown;
  fortranResult?: unknown;
  typescriptResult?: unknown;
  discrepancies: string[];
  passed: boolean;
}

export interface DashboardStats {
  projectCount: number;
  totalFilesAnalyzed: number;
  totalIssuesDetected: number;
  criticalIssues: number;
  highIssues: number;
  testSuccessRate: number;
  mutationDetectionRate: number;
  languageDistribution: { languageId: string; count: number; loc: number }[];
  recentAnalyses: AnalysisRun[];
}

// ============================================================================
// 5 CORE PILLARS ENHANCED INTERFACES
// ============================================================================

// 1. Project Impact Intelligence (Blast Radius Analysis)
export interface ImpactNode {
  id: string;
  name: string;
  filePath: string;
  nodeType: NodeType;
  depth: number;
  impactType: 'DIRECT' | 'INDIRECT_2ND' | 'INDIRECT_3RD' | 'API_SURFACE';
  riskScore: number;
  callCount?: number;
}

export interface BlastRadiusAnalysis {
  targetSymbolOrFile: string;
  projectId: string;
  directDependentsCount: number;
  transitiveDependentsCount: number;
  totalAffectedModules: number;
  blastRadiusScore: number; // 0 - 100
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedNodes: ImpactNode[];
  affectedServices: string[];
  circularPathInvolved: boolean;
  recommendedTestsToRerun: string[];
  summary: string;
}

// 2. Mutation Testing Laboratory (Scientific Test Quality & Mutation Score)
export interface MutationOperatorSummary {
  operatorName: string;
  totalInjected: number;
  killed: number;
  survived: number;
  timedOut: number;
  effectivenessRate: number;
}

export interface MutationLabEvaluation {
  mutationRunId: string;
  projectId: string;
  mutationScore: number; // (killed + timedOut) / total * 100
  testQualityRating: 'EXCELLENT' | 'ADEQUATE' | 'FRAGILE' | 'DEFICIENT';
  totalMutants: number;
  killedCount: number;
  survivedCount: number;
  timedOutCount: number;
  compileErrorCount: number;
  operators: MutationOperatorSummary[];
  blindspots: {
    filePath: string;
    lineNumber: number;
    mutatedSnippet: string;
    operatorName: string;
    whySurvived: string;
  }[];
  verdict: string;
}

// 3. Continuous Fix Verification Pipeline
export type FixVerificationStage =
  | 'STAGE_1_DEFECT_CONFIRMED'
  | 'STAGE_2_PATCH_SYNTHESIZED'
  | 'STAGE_3_UNIT_TEST_PASSED'
  | 'STAGE_4_REGRESSION_SUITE_PASSED'
  | 'STAGE_5_EVIDENCE_CERTIFIED';

export interface ContinuousFixEvidence {
  fixId: string;
  issueId: string;
  currentStage: FixVerificationStage;
  isFullyCertified: boolean;
  prePatchFileHash: string;
  postPatchFileHash: string;
  baselineTestOutcome: { passed: boolean; output: string };
  isolatedUnitTestOutcome: { passed: boolean; durationMs: number; output: string };
  regressionSuiteOutcome: {
    totalTestsRun: number;
    passed: number;
    failed: number;
    durationMs: number;
    regressionsFound: number;
  };
  evidenceChecksum: string;
  timestamp: string;
  auditSignature: string;
}

// 4. Cross-Language Logic Verification
export type CrossLangScenarioType = 'LOAN_AMORTIZATION' | 'POLYNOMIAL_STABILITY' | 'CURRENCY_ROUNDING';

export interface BitLevelFloatRepresentation {
  value: number;
  rawHex: string;
  signBit: string;
  exponentBits: string;
  mantissaBits: string;
  decimalSignificantDigits: string;
}

export interface MultiScenarioParityResult {
  scenarioType: CrossLangScenarioType;
  scenarioTitle: string;
  description: string;
  inputs: Record<string, unknown>;
  cobol: {
    value: number | string;
    formatted: string;
    precision: string;
    representationNotes: string;
  };
  fortran: {
    value: number | string;
    formatted: string;
    precision: string;
    bitLevel?: BitLevelFloatRepresentation;
  };
  typescript: {
    value: number | string;
    formatted: string;
    precision: string;
    bitLevel?: BitLevelFloatRepresentation;
  };
  maxAbsoluteDifference: number;
  ulpDistance?: number;
  withinTolerance: boolean;
  regulatoryRiskFound: boolean;
  discrepancies: string[];
  semanticAnalysis: string;
}

// 5. Evidence-Based Audit Trail
export interface AuditTrailEvent {
  id: string;
  projectId: string;
  issueId?: string;
  eventType:
    | 'DEFECT_DETECTED'
    | 'MUTATION_TEST_EVALUATED'
    | 'TEST_SUITE_EXECUTED'
    | 'PATCH_PROPOSED'
    | 'PATCH_VERIFIED'
    | 'REGRESSION_RUN'
    | 'ISSUE_RESOLVED'
    | 'ISSUE_REOPENED';
  title: string;
  details: string;
  severity?: Severity;
  actor: 'GHOSTCODE_AUTOPSY_ENGINE' | 'MUTATION_LAB' | 'VERIFIER' | 'DEVELOPER';
  evidenceHash: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectAuditLedger {
  projectId: string;
  projectName: string;
  auditGeneratedAt: string;
  ledgerIntegrityHash: string;
  totalEventsCount: number;
  totalDefectsCataloged: number;
  totalResolvedCount: number;
  totalUnresolvedCount: number;
  overallComplianceScore: number;
  events: AuditTrailEvent[];
}
