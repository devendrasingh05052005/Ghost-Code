import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import AdmZip from 'adm-zip';
import { projectRepository } from '../database/repositories/projectRepository';
import { Project, ProjectFile, ProjectLanguageSummary } from '../../../shared/types';
import { config } from '../config';

const VENDOR_PATTERNS = [
  'node_modules', 'vendor', '.git', '.svn', 'dist', 'build', 'out',
  'target', 'bin', 'obj', '.idea', '.vscode', '__pycache__', '.pytest_cache'
];

const TEST_PATTERNS = [
  'test', 'tests', 'spec', '__tests__', 'test_', '_test', '.test.', '.spec.'
];

export class IngestionService {
  async importProjectFolder(folderPath: string, projectName?: string): Promise<Project> {
    const resolvedPath = path.resolve(folderPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Target directory does not exist: ${resolvedPath}`);
    }

    const name = projectName || path.basename(resolvedPath);
    const project = await projectRepository.createProject(name, resolvedPath);
    await this.scanAndIndexProject(project.id, resolvedPath);
    return project;
  }

  async extractZipAndImport(zipBuffer: Buffer, originalFilename: string): Promise<Project> {
    const projectName = path.basename(originalFilename, path.extname(originalFilename));
    const targetDir = path.join(config.uploadsDir, `${projectName}_${Date.now()}`);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      const entryName = entry.entryName;
      // Prevent Zip Slip / Path Traversal
      if (entryName.includes('..') || path.isAbsolute(entryName)) {
        continue;
      }
      const targetFilePath = path.join(targetDir, entryName);
      if (entry.isDirectory) {
        fs.mkdirSync(targetFilePath, { recursive: true });
      } else {
        const parentDir = path.dirname(targetFilePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(targetFilePath, entry.getData());
      }
    }

    return this.importProjectFolder(targetDir, projectName);
  }

  async scanAndIndexProject(projectId: string, rootDir: string): Promise<void> {
    const filesToIndex: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const languageCounts: Record<string, { files: number; loc: number }> = {};
    const detectedManifests: Set<string> = new Set();
    const detectedFrameworks: Set<string> = new Set();

    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

        const isVendor = VENDOR_PATTERNS.some((vp) =>
          relativePath.split('/').some((part) => part.toLowerCase() === vp.toLowerCase())
        );

        if (entry.isDirectory()) {
          if (!isVendor) {
            walk(fullPath);
          }
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        const baseName = entry.name.toLowerCase();

        this.checkManifestsAndFrameworks(baseName, detectedManifests, detectedFrameworks);

        const languageId = this.detectLanguageId(ext, baseName);
        if (!languageId) continue;

        const isTest = TEST_PATTERNS.some((tp) => relativePath.toLowerCase().includes(tp));
        const stat = fs.statSync(fullPath);

        let loc = 0;
        let hash = '';
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          loc = content.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
          hash = crypto.createHash('sha256').update(content).digest('hex');
        } catch {
          // Binary or unreadable
          hash = crypto.createHash('sha256').update(String(stat.mtimeMs)).digest('hex');
        }

        filesToIndex.push({
          projectId,
          relativePath,
          absolutePath: fullPath,
          languageId,
          fileSize: stat.size,
          loc,
          hash,
          isVendor,
          isTest,
          isGenerated: relativePath.includes('.min.') || relativePath.includes('.bundle.')
        });

        if (!isVendor) {
          if (!languageCounts[languageId]) {
            languageCounts[languageId] = { files: 0, loc: 0 };
          }
          languageCounts[languageId].files++;
          languageCounts[languageId].loc += loc;
        }
      }
    };

    walk(rootDir);

    for (const f of filesToIndex) {
      await projectRepository.addProjectFile(f);
    }

    const summaries: Omit<ProjectLanguageSummary, 'id' | 'projectId'>[] = Object.keys(languageCounts).map((langId) => ({
      languageId: langId,
      fileCount: languageCounts[langId].files,
      locCount: languageCounts[langId].loc,
      detectedFrameworks: Array.from(detectedFrameworks),
      detectedManifests: Array.from(detectedManifests)
    }));

    await projectRepository.setProjectLanguages(projectId, summaries);
  }

  private detectLanguageId(ext: string, baseName: string): string | null {
    switch (ext) {
      case '.cob':
      case '.cbl':
      case '.cpy':
        return 'cobol';
      case '.f':
      case '.for':
      case '.f90':
      case '.f95':
      case '.f03':
      case '.f08':
        return 'fortran';
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
      case '.mjs':
      case '.cjs':
        return 'javascript';
      case '.py':
      case '.pyw':
        return 'python';
      case '.c':
      case '.h':
        return 'c';
      case '.cpp':
      case '.cc':
      case '.cxx':
      case '.hpp':
      case '.hxx':
        return 'cpp';
      case '.java':
        return 'java';
      case '.cs':
        return 'csharp';
      case '.go':
        return 'go';
      case '.rs':
        return 'rust';
      case '.php':
        return 'php';
      case '.rb':
        return 'ruby';
      case '.swift':
        return 'swift';
      case '.kt':
      case '.kts':
        return 'kotlin';
      default:
        return null;
    }
  }

  private checkManifestsAndFrameworks(
    baseName: string,
    manifests: Set<string>,
    frameworks: Set<string>
  ) {
    if (baseName === 'package.json') {
      manifests.add('package.json');
      frameworks.add('Node.js');
    } else if (baseName === 'tsconfig.json') {
      manifests.add('tsconfig.json');
      frameworks.add('TypeScript');
    } else if (baseName === 'requirements.txt' || baseName === 'pyproject.toml') {
      manifests.add(baseName);
      frameworks.add('Python Pip/Poetry');
    } else if (baseName === 'pom.xml') {
      manifests.add('pom.xml');
      frameworks.add('Maven');
    } else if (baseName === 'build.gradle' || baseName === 'build.gradle.kts') {
      manifests.add(baseName);
      frameworks.add('Gradle');
    } else if (baseName === 'cargo.toml') {
      manifests.add('Cargo.toml');
      frameworks.add('Cargo/Rust');
    } else if (baseName === 'go.mod') {
      manifests.add('go.mod');
      frameworks.add('Go Modules');
    } else if (baseName === 'cmakelists.txt') {
      manifests.add('CMakeLists.txt');
      frameworks.add('CMake');
    } else if (baseName === 'makefile') {
      manifests.add('Makefile');
      frameworks.add('GNU Make');
    }
  }
}

export const ingestionService = new IngestionService();
