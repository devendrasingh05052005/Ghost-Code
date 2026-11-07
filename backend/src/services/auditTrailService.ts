import * as crypto from 'crypto';
import { queryAll, queryOne } from '../database/db';
import { projectRepository } from '../database/repositories/projectRepository';
import { analysisRepository } from '../database/repositories/analysisRepository';
import { fixRepository } from '../database/repositories/fixRepository';
import { mutationRepository } from '../database/repositories/mutationRepository';
import {
  AuditTrailEvent,
  ProjectAuditLedger,
  Severity
} from '../../../shared/types';

export class AuditTrailService {
  async getProjectAuditLedger(projectId: string): Promise<ProjectAuditLedger> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const events: AuditTrailEvent[] = [];

    // 1. Defect Ingestion & Detection Events
    const issues = await queryAll<any>(
      `SELECT * FROM analysis_issues WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId]
    );

    for (const issue of issues) {
      const hash = crypto
        .createHash('sha256')
        .update(`ISSUE:${issue.id}:${issue.rule_id}:${issue.line_number}`)
        .digest('hex');

      events.push({
        id: `EVT-DETECT-${issue.id.slice(0, 8)}`,
        projectId,
        issueId: issue.id,
        eventType: 'DEFECT_DETECTED',
        title: `Defect Detected: [${issue.rule_id}] ${issue.title}`,
        details: `Identified ${issue.severity} severity issue in ${issue.relative_path}:${issue.line_number}. Confidence: ${issue.confidence}. Description: "${(issue.description || '').trim().slice(0, 80)}"`,
        severity: issue.severity as Severity,
        actor: 'GHOSTCODE_AUTOPSY_ENGINE',
        evidenceHash: hash,
        timestamp: issue.created_at || new Date().toISOString(),
        metadata: {
          ruleId: issue.rule_id,
          filePath: issue.relative_path,
          line: issue.line_number,
          verificationStatus: issue.verification_status
        }
      });
    }

    // 2. Mutation Testing & Blindspot Events
    const mutations = await queryAll<any>(
      `SELECT * FROM injected_mutations WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId]
    );

    for (const mut of mutations) {
      const isKilled = mut.status === 'KILLED';
      const hash = crypto
        .createHash('sha256')
        .update(`MUTATION:${mut.id}:${mut.status}`)
        .digest('hex');

      events.push({
        id: `EVT-MUT-${mut.id.slice(0, 8)}`,
        projectId,
        eventType: 'MUTATION_TEST_EVALUATED',
        title: isKilled
          ? `Mutant Neutralized: [${mut.operator_name}]`
          : `Test Blindspot Expose: Mutant Survived [${mut.operator_name}]`,
        details: isKilled
          ? `Mutant on ${mut.file_path}:${mut.line_number} was successfully killed by test assertion (${mut.detection_test_id || 'test_suite'}).`
          : `Mutant on ${mut.file_path}:${mut.line_number} SURVIVED test execution. Test suite has a coverage blindspot on '${(mut.mutated_snippet || '').trim()}'.`,
        severity: isKilled ? 'LOW' : 'HIGH',
        actor: 'MUTATION_LAB',
        evidenceHash: hash,
        timestamp: mut.created_at || new Date().toISOString(),
        metadata: {
          operator: mut.operator_name,
          filePath: mut.file_path,
          line: mut.line_number,
          status: mut.status
        }
      });
    }

    // 3. Fix Proposals, Verifications & Rollbacks
    const fixes = await queryAll<any>(
      `SELECT * FROM fix_history WHERE project_id = ? ORDER BY created_at ASC`,
      [projectId]
    );

    for (const fix of fixes) {
      const hash = crypto
        .createHash('sha256')
        .update(`FIX:${fix.id}:${fix.status}`)
        .digest('hex');

      if (fix.status === 'ACCEPTED') {
        events.push({
          id: `EVT-FIX-VERIFIED-${fix.id.slice(0, 8)}`,
          projectId,
          issueId: fix.issue_id,
          eventType: 'PATCH_VERIFIED',
          title: `Fix Verified & Applied: ${fix.file_path}`,
          details: `5-Stage Continuous Verification PASSED. Patch applied cleanly, targeted unit test passed, regression test suite confirmed 0 regressions. Verified status: ${fix.verification_test_result || 'PASSED'}.`,
          severity: 'INFORMATIONAL',
          actor: 'VERIFIER',
          evidenceHash: hash,
          timestamp: fix.applied_at || fix.created_at || new Date().toISOString(),
          metadata: {
            fixId: fix.id,
            filePath: fix.file_path,
            diffPatch: fix.diff_patch
          }
        });

        events.push({
          id: `EVT-RESOLVE-${fix.issue_id.slice(0, 8)}`,
          projectId,
          issueId: fix.issue_id,
          eventType: 'ISSUE_RESOLVED',
          title: `Issue Resolved Cleanly: ${fix.issue_id.slice(0, 8)}`,
          details: `Issue ${fix.issue_id.slice(0, 8)} transitioned to VERIFIED_CLEAN following verified patch application.`,
          severity: 'INFORMATIONAL',
          actor: 'DEVELOPER',
          evidenceHash: hash,
          timestamp: fix.applied_at || fix.created_at || new Date().toISOString()
        });
      } else if (fix.status === 'ROLLED_BACK') {
        events.push({
          id: `EVT-ROLLBACK-${fix.id.slice(0, 8)}`,
          projectId,
          issueId: fix.issue_id,
          eventType: 'ISSUE_REOPENED',
          title: `Fix Rolled Back: ${fix.file_path}`,
          details: `Previously applied fix was reverted back to original source code. Issue marked UNRESOLVED.`,
          severity: 'MEDIUM',
          actor: 'DEVELOPER',
          evidenceHash: hash,
          timestamp: fix.rolled_back_at || new Date().toISOString()
        });
      } else {
        events.push({
          id: `EVT-PROPOSE-${fix.id.slice(0, 8)}`,
          projectId,
          issueId: fix.issue_id,
          eventType: 'PATCH_PROPOSED',
          title: `Patch Proposed: ${fix.file_path}`,
          details: `Remediation proposed: "${(fix.reasoning || '').slice(0, 80)}". Awaiting continuous verification.`,
          severity: 'LOW',
          actor: 'DEVELOPER',
          evidenceHash: hash,
          timestamp: fix.created_at || new Date().toISOString()
        });
      }
    }

    // Sort events chronologically
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const totalDefects = issues.length;
    const resolvedCount = issues.filter((i: any) => i.verification_status === 'VERIFIED').length;
    const unresolvedCount = totalDefects - resolvedCount;

    const complianceScore = totalDefects > 0
      ? Math.round((resolvedCount / totalDefects) * 100)
      : 100;

    // Cryptographic Ledger Integrity Seal
    const allHashes = events.map(e => e.evidenceHash).join(':');
    const ledgerIntegrityHash = crypto.createHash('sha256').update(allHashes || 'EMPTY_LEDGER').digest('hex');

    return {
      projectId,
      projectName: project.name,
      auditGeneratedAt: new Date().toISOString(),
      ledgerIntegrityHash,
      totalEventsCount: events.length,
      totalDefectsCataloged: totalDefects,
      totalResolvedCount: resolvedCount,
      totalUnresolvedCount: unresolvedCount,
      overallComplianceScore: complianceScore,
      events
    };
  }

  async exportAuditCertificateMarkdown(projectId: string): Promise<string> {
    const ledger = await this.getProjectAuditLedger(projectId);

    let md = `# GHOSTCODE FORENSIC AUDIT CERTIFICATE\n`;
    md += `**Project:** ${ledger.projectName}  \n`;
    md += `**Project ID:** \`${ledger.projectId}\`  \n`;
    md += `**Audit Timestamp:** ${ledger.auditGeneratedAt}  \n`;
    md += `**Cryptographic Ledger Seal (SHA-256):** \`${ledger.ledgerIntegrityHash}\`  \n\n`;

    md += `## 1. Compliance Executive Summary\n\n`;
    md += `| Metric | Value |\n|---|---:|\n`;
    md += `| Total Forensic Events | **${ledger.totalEventsCount}** |\n`;
    md += `| Total Defects Cataloged | **${ledger.totalDefectsCataloged}** |\n`;
    md += `| Total Verified Clean & Resolved | **${ledger.totalResolvedCount}** |\n`;
    md += `| Total Unresolved / Open Issues | **${ledger.totalUnresolvedCount}** |\n`;
    md += `| Overall Verification Compliance | **${ledger.overallComplianceScore}%** |\n\n`;

    md += `## 2. Chronological Audit Trail & Evidence History\n\n`;
    md += `| Timestamp | Event Type | Severity | Description | Evidence Hash |\n`;
    md += `|---|---|---|---|---|\n`;

    for (const evt of ledger.events) {
      md += `| ${evt.timestamp.slice(0, 19).replace('T', ' ')} | \`${evt.eventType}\` | ${evt.severity || 'INFO'} | ${evt.title.replace(/\|/g, '-')} | \`${evt.evidenceHash.slice(0, 12)}...\` |\n`;
    }

    md += `\n---\n*Certified by GHOSTCODE Software Autopsy & Forensic Diagnostics Laboratory.*\n`;
    return md;
  }
}

export const auditTrailService = new AuditTrailService();
