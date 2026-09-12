import { queryAll, queryOne, executeRun } from '../db';
import { Project, ProjectFile, ProjectLanguageSummary } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class ProjectRepository {
  async createProject(name: string, rootPath: string, description?: string): Promise<Project> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT INTO projects (id, name, description, root_path, created_at, updated_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, name, description || '', rootPath, now, now]
    );

    return {
      id,
      name,
      description,
      rootPath,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
  }

  async getProjectById(id: string): Promise<Project | null> {
    const row = await queryOne<any>(`SELECT * FROM projects WHERE id = ?`, [id]);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      rootPath: row.root_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: Boolean(row.is_active),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  async getAllProjects(): Promise<Project[]> {
    const rows = await queryAll<any>(`SELECT * FROM projects ORDER BY updated_at DESC`);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      rootPath: row.root_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: Boolean(row.is_active),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  async addProjectFile(file: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectFile> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await executeRun(
      `INSERT OR REPLACE INTO project_files (
        id, project_id, relative_path, absolute_path, language_id,
        file_size, loc, hash, is_vendor, is_test, is_generated, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, file.projectId, file.relativePath, file.absolutePath, file.languageId,
        file.fileSize, file.loc, file.hash, file.isVendor ? 1 : 0, file.isTest ? 1 : 0,
        file.isGenerated ? 1 : 0, now, now
      ]
    );

    return {
      ...file,
      id,
      createdAt: now,
      updatedAt: now
    };
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const rows = await queryAll<any>(`SELECT * FROM project_files WHERE project_id = ? ORDER BY relative_path ASC`, [projectId]);
    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      relativePath: r.relative_path,
      absolutePath: r.absolute_path,
      languageId: r.language_id,
      fileSize: r.file_size,
      loc: r.loc,
      hash: r.hash,
      isVendor: Boolean(r.is_vendor),
      isTest: Boolean(r.is_test),
      isGenerated: Boolean(r.is_generated),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  async setProjectLanguages(projectId: string, summaries: Omit<ProjectLanguageSummary, 'id' | 'projectId'>[]): Promise<void> {
    await executeRun(`DELETE FROM project_languages WHERE project_id = ?`, [projectId]);
    for (const s of summaries) {
      const id = uuidv4();
      await executeRun(
        `INSERT INTO project_languages (id, project_id, language_id, file_count, loc_count, detected_frameworks, detected_manifests)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, projectId, s.languageId, s.fileCount, s.locCount, JSON.stringify(s.detectedFrameworks), JSON.stringify(s.detectedManifests)]
      );
    }
  }

  async getProjectLanguages(projectId: string): Promise<ProjectLanguageSummary[]> {
    const rows = await queryAll<any>(`SELECT * FROM project_languages WHERE project_id = ?`, [projectId]);
    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      languageId: r.language_id,
      fileCount: r.file_count,
      locCount: r.loc_count,
      detectedFrameworks: JSON.parse(r.detected_frameworks || '[]'),
      detectedManifests: JSON.parse(r.detected_manifests || '[]')
    }));
  }
  async deleteProject(projectId: string): Promise<void> {
    await executeRun(`DELETE FROM analysis_issues WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM analysis_runs WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM project_files WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM project_languages WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM generated_reports WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM dependency_nodes WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM dependency_edges WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM injected_mutations WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM mutation_runs WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM test_suites WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM projects WHERE id = ?`, [projectId]);
  }
}

export const projectRepository = new ProjectRepository();
