import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

export interface ApiProject {
  id: string;
  name: string;
  description?: string;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  languages?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export const ghostApi = {
  // Projects
  getProjects: () => api.get<ApiResponse<ApiProject[]>>('/projects'),
  getProject: (id: string) => api.get<ApiResponse<ApiProject>>(`/projects/${id}`),
  createProject: (name: string, folderPath: string, description?: string) =>
    api.post<ApiResponse<ApiProject>>('/projects', { name, folderPath, description }),
  uploadZip: (formData: FormData) =>
    api.post<ApiResponse<ApiProject>>('/projects/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteProject: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/projects/${id}`),
  downloadProjectZipUrl: (id: string) => `/api/projects/${id}/download-zip`,
  getProjectFiles: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/files`),
  getFileContent: (id: string, path: string) =>
    api.get<ApiResponse<{ file: any; content: string }>>(`/projects/${id}/file-content?path=${encodeURIComponent(path)}`),

  // Scanner (Module 1)
  runScan: (id: string) => api.post<ApiResponse<any>>(`/projects/${id}/scan`),
  getLatestScan: (id: string) => api.get<ApiResponse<any>>(`/projects/${id}/scan/latest`),

  // Bug Injection (Module 2)
  injectMutations: (id: string, count: number = 20) =>
    api.post<ApiResponse<any>>(`/projects/${id}/mutate`, { count }),
  evaluateMutationLab: (id: string, count: number = 25) =>
    api.post<ApiResponse<any>>(`/projects/${id}/mutation-lab/evaluate`, { count }),
  getMutations: (runId: string) => api.get<ApiResponse<any[]>>(`/projects/mutations/${runId}`),
  rollbackMutation: (mutationId: string) =>
    api.post<ApiResponse<any>>(`/projects/mutations/${mutationId}/rollback`),

  // Dependencies & Impact Intelligence (Module 3 & Pillar 1)
  getDependencies: (id: string) => api.get<ApiResponse<any>>(`/projects/${id}/dependencies`),
  getImpactAnalysis: (id: string, target: string = '') =>
    api.get<ApiResponse<any>>(`/projects/${id}/impact-analysis?target=${encodeURIComponent(target)}`),

  // Execution & Performance (Modules 4 & 5)
  traceExecution: (id: string, relativePath: string, inputs: any = {}) =>
    api.post<ApiResponse<any>>(`/projects/${id}/trace`, { relativePath, inputs }),
  getPerformance: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/performance`),
  runLive: (id: string, commandType: 'app' | 'test' = 'app') =>
    api.post<ApiResponse<any>>(`/projects/${id}/run-live`, { commandType }),

  // Testing (Module 6)
  generateTests: (id: string, relativePath: string) =>
    api.post<ApiResponse<any>>(`/projects/${id}/tests/generate`, { relativePath }),
  getTestSuites: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/tests`),
  runTestSuite: (suiteId: string) => api.post<ApiResponse<any[]>>(`/tests/${suiteId}/run`),

  // Fix Verification & Continuous Fix Verification (Module 7 & Pillar 3)
  getFixes: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/fixes`),
  getFixDiffs: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/fixes/diffs`),
  batchApplyFixes: (id: string, issueIds: string[]) =>
    api.post<ApiResponse<any>>(`/projects/${id}/fixes/batch-apply`, { issueIds }),
  proposeFix: (id: string, data: any) => api.post<ApiResponse<any>>(`/projects/${id}/fixes`, data),
  applyFix: (fixId: string) => api.post<ApiResponse<any>>(`/fixes/${fixId}/apply`),
  verifyContinuousFixPipeline: (fixId: string) => api.post<ApiResponse<any>>(`/fixes/${fixId}/verify-pipeline`),
  rollbackFix: (fixId: string) => api.post<ApiResponse<any>>(`/fixes/${fixId}/rollback`),

  // Cross-Language Multi-Scenario (Advanced & Pillar 4)
  compareBanking: (params: { principal: number; rate: number; months: number; tolerance: number }) =>
    api.post<ApiResponse<any>>('/cross-language/banking', params),
  runCrossLangScenario: (scenarioType: string, customInputs?: any) =>
    api.post<ApiResponse<any>>('/cross-language/scenarios', { scenarioType, customInputs }),

  // Reports, Audit Trail & Dashboard (Module 8 & Pillar 5)
  generateReport: (id: string) => api.post<ApiResponse<{ reportId: string }>>(`/projects/${id}/reports`),
  getReports: (id: string) => api.get<ApiResponse<any[]>>(`/projects/${id}/reports`),
  getAuditTrail: (id: string) => api.get<ApiResponse<any>>(`/projects/${id}/audit-trail`),
  exportAuditTrailUrl: (id: string) => `/api/projects/${id}/audit-trail/export`,
  getDashboardStats: () => api.get<ApiResponse<any>>('/dashboard/stats'),

  // Authentication
  login: (credentials: { username: string; password: string }) =>
    api.post<ApiResponse<any>>('/auth/login', credentials),

  // Settings
  getCapabilities: () => api.get<ApiResponse<any[]>>('/settings/capabilities')
};
