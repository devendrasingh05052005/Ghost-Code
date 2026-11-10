import { Router } from 'express';
import multer from 'multer';
import {
  ProjectController,
  ScannerController,
  MutationController,
  DependencyController,
  ExecutionController,
  TestController,
  FixController,
  CrossLangController,
  ReportController,
  SettingsController,
  AuthController
} from '../controllers';

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = Router();

// Authentication
router.post('/auth/login', AuthController.login);

// Projects
router.get('/projects', ProjectController.list);
router.post('/projects', ProjectController.create);
router.post('/projects/upload', upload.single('file'), ProjectController.uploadZip);
router.get('/projects/:id', ProjectController.getById);
router.delete('/projects/:id', ProjectController.delete);
router.get('/projects/:id/download-zip', ProjectController.downloadZip);
router.get('/projects/:id/files', ProjectController.getFiles);
router.get('/projects/:id/file-content', ProjectController.getFileContent);

// Scanner (Module 1)
router.post('/projects/:id/scan', ScannerController.scan);
router.get('/projects/:id/scan/latest', ScannerController.getLatest);

// Bug Injection Lab (Module 2)
router.post('/projects/:id/mutate', MutationController.mutate);
router.post('/projects/:id/mutation-lab/evaluate', MutationController.evaluate);
router.get('/projects/mutations/:runId', MutationController.getMutations);
router.post('/projects/mutations/:mutationId/rollback', MutationController.rollback);

// Dependency Explorer & Blast Radius Impact (Module 3 & Pillar 1)
router.get('/projects/:id/dependencies', DependencyController.getGraph);
router.get('/projects/:id/impact-analysis', DependencyController.getImpactAnalysis);

// Execution Lab & Performance (Modules 4 & 5)
router.post('/projects/:id/trace', ExecutionController.trace);
router.get('/projects/:id/performance', ExecutionController.getPerformance);
router.post('/projects/:id/run-live', ExecutionController.runLive);

// Test Center (Module 6)
router.post('/projects/:id/tests/generate', TestController.generate);
router.get('/projects/:id/tests', TestController.listSuites);
router.post('/tests/:suiteId/run', TestController.runSuite);

// Fix Verification Lab (Module 7 & Pillar 3 Continuous Fix Verification)
router.get('/projects/:id/fixes', FixController.list);
router.get('/projects/:id/fixes/diffs', FixController.previewDiffs);
router.post('/projects/:id/fixes/batch-apply', FixController.batchApply);
router.post('/projects/:id/fixes', FixController.propose);
router.post('/fixes/:fixId/apply', FixController.apply);
router.post('/fixes/:fixId/verify-pipeline', FixController.verifyPipeline);
router.post('/fixes/:fixId/rollback', FixController.rollback);

// Cross-Language Logic Verification (Advanced Feature & Pillar 4)
router.post('/cross-language/banking', CrossLangController.compareBanking);
router.post('/cross-language/scenarios', CrossLangController.runScenario);

// Reports & Dashboard & Evidence-Based Audit Trail (Module 8 & Pillar 5)
router.post('/projects/:id/reports', ReportController.generate);
router.get('/projects/:id/reports', ReportController.list);
router.get('/projects/:id/audit-trail', ReportController.getAuditTrail);
router.get('/projects/:id/audit-trail/export', ReportController.exportAuditTrail);
router.get('/dashboard/stats', ReportController.getDashboard);

// Settings & Capabilities
router.get('/settings/capabilities', SettingsController.getCapabilities);

export default router;
