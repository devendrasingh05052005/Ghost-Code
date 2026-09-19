import { CAdapter } from './cAdapter';
import { LanguageCapabilityRecord } from '../../../../shared/types';
import * as path from 'path';

export class CppAdapter extends CAdapter {
  override readonly languageId = 'cpp';
  override readonly displayName = 'C++';
  override readonly fileExtensions = ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'];
  override readonly defaultManifests = ['CMakeLists.txt', 'Makefile'];

  override detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /#include\s+<iostream>/.test(content) || /std::cout/.test(content) || /class\s+[A-Za-z0-9_]+\s*\{/.test(content);
  }

  override getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'cpp',
      displayName: 'C++',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'SUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'PARTIAL',
      profiling: 'SUPPORTED',
      toolchainDetected: true,
      binary: 'C:\\Strawberry\\c\\bin\\g++.exe',
      version: 'G++ 13.2.0',
      notes: 'Native MinGW G++ available for compilation & execution'
    };
  }
}
