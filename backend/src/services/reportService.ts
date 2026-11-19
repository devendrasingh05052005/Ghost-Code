import { projectRepository } from '../database/repositories/projectRepository';
import { analysisRepository } from '../database/repositories/analysisRepository';
import { dependencyRepository } from '../database/repositories/dependencyRepository';
import { mutationRepository } from '../database/repositories/mutationRepository';
import { testRepository } from '../database/repositories/testRepository';
import { fixRepository } from '../database/repositories/fixRepository';
import { reportRepository } from '../database/repositories/reportRepository';

export class ReportService {
  async generateProjectHealthReport(projectId: string): Promise<string> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const latestRun = await analysisRepository.getLatestRun(projectId);
    if (!latestRun) throw new Error('No completed analysis run found. Please run a scan first.');

    const issues = await analysisRepository.getIssuesByRun(latestRun.id);
    const files = await projectRepository.getProjectFiles(projectId);
    const languages = await projectRepository.getProjectLanguages(projectId);
    const depGraph = await dependencyRepository.getGraph(projectId);
    const fixes = await fixRepository.getFixesByProject(projectId);

    const title = `Code Autopsy & Health Audit — ${project.name}`;

    const markdown = `
# ${title}
**Generated:** ${new Date().toISOString()}  
**Target Root:** \`${project.rootPath}\`  
**Overall Code Health Score:** **${latestRun.healthScore.toFixed(1)} / 100**

---

## 1. EXECUTIVE SUMMARY
Project **${project.name}** was inspected across **${files.length}** source files spanning **${languages.length}** detected programming languages. The Autopsy Engine identified **${latestRun.totalIssues}** total findings (**${latestRun.criticalIssues}** Critical, **${latestRun.highIssues}** High, **${latestRun.mediumIssues}** Medium, **${latestRun.lowIssues}** Low).

## 2. LANGUAGE DISTRIBUTION
| Language | File Count | Production LOC | Detected Frameworks |
|---|---:|---:|---|
${languages.map((l) => `| ${l.languageId.toUpperCase()} | ${l.fileCount} | ${l.locCount.toLocaleString()} | ${l.detectedFrameworks.join(', ') || 'Standard Toolchain'} |`).join('\n')}

## 3. DEPENDENCY & COUPLING HEALTH
- **Total Dependency Graph Nodes:** ${depGraph.nodes.length}
- **Total Relational Edges:** ${depGraph.edges.length}
- **Circular Dependencies Detected:** ${depGraph.circularCount} ${depGraph.circularCount > 0 ? '[HIGH ARCHITECTURAL RISK]' : '[HEALTHY - Acyclic]'}

## 4. CRITICAL FINDINGS REQUIRING REMEDIATION
${issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').slice(0, 10).map((i) => `
### [${i.severity}] ${i.title}
- **Location:** \`${i.relativePath}\` (Line ${i.lineNumber})
- **Rule ID:** \`${i.ruleId}\`
- **Description:** ${i.description}
- **Impact:** ${i.potentialImpact}
- **Suggested Fix:** \`${i.suggestedFix}\`
`).join('\n')}

## 5. FIX VERIFICATION AUDIT
- **Total Proposed Fixes:** ${fixes.length}
- **Accepted & Verified Fixes:** ${fixes.filter((f) => f.status === 'ACCEPTED').length}
- **Rejected / Rolled Back Fixes:** ${fixes.filter((f) => f.status === 'REJECTED' || f.status === 'ROLLED_BACK').length}
    `.trim();

    const reportJson = {
      projectId,
      analysisRunId: latestRun.id,
      healthScore: latestRun.healthScore,
      totalIssues: latestRun.totalIssues,
      criticalIssues: latestRun.criticalIssues,
      highIssues: latestRun.highIssues,
      fileCount: files.length,
      languages,
      circularDependencies: depGraph.circularCount,
      fixesCount: fixes.length
    };

    return reportRepository.saveReport(projectId, latestRun.id, title, latestRun.healthScore, markdown, reportJson);
  }
}

export const reportService = new ReportService();
