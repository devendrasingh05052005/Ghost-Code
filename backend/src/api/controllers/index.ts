import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { projectRepository } from '../../database/repositories/projectRepository';
import { analysisRepository } from '../../database/repositories/analysisRepository';
import { dependencyRepository } from '../../database/repositories/dependencyRepository';
import { mutationRepository } from '../../database/repositories/mutationRepository';
import { testRepository } from '../../database/repositories/testRepository';
import { fixRepository } from '../../database/repositories/fixRepository';
import { reportRepository } from '../../database/repositories/reportRepository';
import { executionRepository } from '../../database/repositories/executionRepository';
import { ingestionService } from '../../services/ingestionService';
import { scannerService } from '../../services/scannerService';
import { mutationService } from '../../services/mutationService';
import { dependencyService } from '../../services/dependencyService';
import { executionService } from '../../services/executionService';
import { testGeneratorService } from '../../services/testGeneratorService';
import { fixVerificationService } from '../../services/fixVerificationService';
import { crossLanguageService } from '../../services/crossLanguageService';
import { reportService } from '../../services/reportService';
import { auditTrailService } from '../../services/auditTrailService';
import { autoRemediationService } from '../../services/autoRemediationService';
import { getAllAdapters } from '../../adapters';

export class ProjectController {
  static async list(req: Request, res: Response) {
    try {
      const projects = await projectRepository.getAllProjects();
      res.json({ success: true, data: projects });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const project = await projectRepository.getProjectById(req.params.id);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      const languages = await projectRepository.getProjectLanguages(project.id);
      res.json({ success: true, data: { ...project, languages } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, folderPath, description } = req.body;
      if (!name || !folderPath) {
        return res.status(400).json({ success: false, error: 'name and folderPath are required' });
      }
      const project = await ingestionService.importProjectFolder(folderPath, name);
      // Run automatic autopsy scan immediately on ingestion
      await scannerService.runProjectScan(project.id);
      res.json({ success: true, data: project });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async uploadZip(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No ZIP file uploaded' });
      }
      const project = await ingestionService.extractZipAndImport(req.file.buffer, req.file.originalname);
      // Run automatic autopsy scan immediately on upload
      await scannerService.runProjectScan(project.id);
      res.json({ success: true, data: project });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await projectRepository.deleteProject(req.params.id);
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async downloadZip(req: Request, res: Response) {
    try {
      const project = await projectRepository.getProjectById(req.params.id);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!fs.existsSync(project.rootPath)) {
        return res.status(404).json({ success: false, error: 'Project directory not found on disk' });
      }

      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      
      const addDirClean = (dirPath: string, zipPath: string = '') => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === '__pycache__' || entry.name === '.git' || entry.name === '.pytest_cache') continue;
          const fullPath = path.join(dirPath, entry.name);
          const relZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            addDirClean(fullPath, relZipPath);
          } else {
            zip.addFile(relZipPath, fs.readFileSync(fullPath));
          }
        }
      };
      addDirClean(project.rootPath);

      const zipBuffer = zip.toBuffer();
      const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_remediated.zip"`);
      res.setHeader('Content-Length', zipBuffer.length);
      res.send(zipBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getFiles(req: Request, res: Response) {
    try {
      const files = await projectRepository.getProjectFiles(req.params.id);
      res.json({ success: true, data: files });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getFileContent(req: Request, res: Response) {
    try {
      const files = await projectRepository.getProjectFiles(req.params.id);
      const relativePath = req.query.path as string;
      const file = files.find((f) => f.relativePath === relativePath);
      if (!file) return res.status(404).json({ success: false, error: 'File not found' });

      if (!fs.existsSync(file.absolutePath)) {
        return res.status(404).json({ success: false, error: 'Physical file not found' });
      }
      const content = fs.readFileSync(file.absolutePath, 'utf8');
      res.json({ success: true, data: { file, content } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class ScannerController {
  static async scan(req: Request, res: Response) {
    try {
      const run = await scannerService.runProjectScan(req.params.id);
      res.json({ success: true, data: run });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getLatest(req: Request, res: Response) {
    try {
      const run = await analysisRepository.getLatestRun(req.params.id);
      if (!run) return res.json({ success: true, data: null });
      const issues = await analysisRepository.getIssuesByRun(run.id);
      res.json({ success: true, data: { run, issues } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class MutationController {
  static async mutate(req: Request, res: Response) {
    try {
      const count = parseInt(req.body.count || '20', 10);
      const run = await mutationService.runMutationTesting(req.params.id, count);
      res.json({ success: true, data: run });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async evaluate(req: Request, res: Response) {
    try {
      const count = parseInt(req.body.count || '25', 10);
      const evalResult = await mutationService.evaluateMutationTestSuite(req.params.id, count);
      res.json({ success: true, data: evalResult });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getMutations(req: Request, res: Response) {
    try {
      const mutations = await mutationRepository.getMutationsByRun(req.params.runId);
      res.json({ success: true, data: mutations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async rollback(req: Request, res: Response) {
    try {
      await mutationService.rollbackMutation(req.params.mutationId);
      res.json({ success: true, message: 'Mutation rolled back' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class DependencyController {
  static async getGraph(req: Request, res: Response) {
    try {
      let graph = await dependencyRepository.getGraph(req.params.id);
      if (graph.nodes.length === 0) {
        graph = await dependencyService.analyzeProjectDependencies(req.params.id);
      }
      res.json({ success: true, data: graph });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getImpactAnalysis(req: Request, res: Response) {
    try {
      const target = (req.query.target as string) || '';
      const analysis = await dependencyService.calculateBlastRadius(req.params.id, target);
      res.json({ success: true, data: analysis });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class ExecutionController {
  static async trace(req: Request, res: Response) {
    try {
      const { relativePath, inputs } = req.body;
      const result = await executionService.executeAndTraceFile(req.params.id, relativePath, inputs);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPerformance(req: Request, res: Response) {
    try {
      const metrics = await executionRepository.getPerformanceMetrics(req.params.id);
      res.json({ success: true, data: metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async runLive(req: Request, res: Response) {
    try {
      const project = await projectRepository.getProjectById(req.params.id);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      const { commandType } = req.body;
      const { exec } = require('child_process');

      let cmd = 'python main.py';
      if (commandType === 'test') {
        cmd = 'python tests/test_app.py';
      }

      let execCwd = project.rootPath;
      if (fs.existsSync(path.join(project.rootPath, 'clean_shop'))) {
        execCwd = path.join(project.rootPath, 'clean_shop');
      } else if (fs.existsSync(path.join(project.rootPath, 'buggy_shop'))) {
        execCwd = path.join(project.rootPath, 'buggy_shop');
      }

      exec(cmd, { cwd: execCwd, timeout: 10000 }, (error: any, stdout: string, stderr: string) => {
        res.json({
          success: true,
          data: {
            command: cmd,
            cwd: execCwd,
            exitCode: error ? error.code || 1 : 0,
            stdout: stdout || '',
            stderr: stderr || '',
            output: (stdout + '\n' + (stderr ? 'ERRORS:\n' + stderr : '')).trim()
          }
        });
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class TestController {
  static async generate(req: Request, res: Response) {
    try {
      const { relativePath } = req.body;
      const suite = await testGeneratorService.generateTestsForFile(req.params.id, relativePath);
      res.json({ success: true, data: suite });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async listSuites(req: Request, res: Response) {
    try {
      const suites = await testRepository.getTestSuites(req.params.id);
      res.json({ success: true, data: suites });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async runSuite(req: Request, res: Response) {
    try {
      const results = await testGeneratorService.runTestSuite(req.params.suiteId);
      res.json({ success: true, data: results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class FixController {
  static async previewDiffs(req: Request, res: Response) {
    try {
      const issues = await analysisRepository.getIssuesByProject(req.params.id);
      const diffs = [];
      for (const issue of issues) {
        const d = await autoRemediationService.previewFix(req.params.id, issue.id);
        if (d) diffs.push(d);
      }
      res.json({ success: true, data: diffs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async batchApply(req: Request, res: Response) {
    try {
      const { issueIds } = req.body;
      const result = await autoRemediationService.applyBatchFixes(req.params.id, issueIds || []);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const fixes = await fixRepository.getFixesByProject(req.params.id);
      res.json({ success: true, data: fixes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async propose(req: Request, res: Response) {
    try {
      const { issueId, filePath, originalCode, proposedCode, reasoning } = req.body;
      const fix = await fixVerificationService.proposeFix(
        issueId,
        req.params.id,
        filePath,
        originalCode,
        proposedCode,
        reasoning
      );
      res.json({ success: true, data: fix });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async apply(req: Request, res: Response) {
    try {
      const result = await fixVerificationService.applyAndVerifyFix(req.params.fixId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async verifyPipeline(req: Request, res: Response) {
    try {
      const evidence = await fixVerificationService.verifyContinuousFixPipeline(req.params.fixId);
      res.json({ success: true, data: evidence });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async rollback(req: Request, res: Response) {
    try {
      await fixVerificationService.rollbackFix(req.params.fixId);
      res.json({ success: true, message: 'Fix rolled back successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class CrossLangController {
  static async compareBanking(req: Request, res: Response) {
    try {
      const principal = parseFloat(req.body.principal || '250000.00');
      const rate = parseFloat(req.body.rate || '5.25');
      const months = parseInt(req.body.months || '360', 10);
      const tolerance = parseFloat(req.body.tolerance || '0.01');

      const result = await crossLanguageService.runBankingCalculationComparison(
        principal,
        rate,
        months,
        tolerance
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async runScenario(req: Request, res: Response) {
    try {
      const { scenarioType, customInputs } = req.body;
      const result = await crossLanguageService.runMultiScenarioParity(
        scenarioType || 'LOAN_AMORTIZATION',
        customInputs
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class ReportController {
  static async generate(req: Request, res: Response) {
    try {
      const reportId = await reportService.generateProjectHealthReport(req.params.id);
      res.json({ success: true, data: { reportId } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const reports = await reportRepository.getReportsByProject(req.params.id);
      res.json({ success: true, data: reports });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getDashboard(req: Request, res: Response) {
    try {
      const stats = await reportRepository.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAuditTrail(req: Request, res: Response) {
    try {
      const ledger = await auditTrailService.getProjectAuditLedger(req.params.id);
      res.json({ success: true, data: ledger });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async exportAuditTrail(req: Request, res: Response) {
    try {
      const md = await auditTrailService.exportAuditCertificateMarkdown(req.params.id);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="audit-certificate-${req.params.id}.md"`);
      res.send(md);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class SettingsController {
  static async getCapabilities(req: Request, res: Response) {
    try {
      const adapters = getAllAdapters();
      const capabilities = adapters.map((a) => a.getCapabilities());
      res.json({ success: true, data: capabilities });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const validUsers = ['admin', 'admin@ghostcode.lab', 'lead_engineer'];
      const validPass = ['admin', 'admin123', 'ghostcode'];

      if (validUsers.includes((username || '').toLowerCase().trim()) && validPass.includes((password || '').trim())) {
        res.json({
          success: true,
          data: {
            token: 'ghostcode_sec_token_' + Date.now(),
            user: {
              username: 'admin',
              role: 'SUPER_ADMIN_AUTOPSY_LEAD',
              name: 'GHOSTCODE Lead Admin',
              avatar: 'admin'
            }
          }
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid admin credentials. Hint: Username "admin", Password "admin123"'
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

