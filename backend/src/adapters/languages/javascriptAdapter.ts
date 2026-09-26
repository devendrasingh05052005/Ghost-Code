import { TypeScriptAdapter } from './typescriptAdapter';
import { LanguageCapabilityRecord } from '../../../../shared/types';

export class JavaScriptAdapter extends TypeScriptAdapter {
  override readonly languageId = 'javascript';
  override readonly displayName = 'JavaScript';
  override readonly fileExtensions = ['.js', '.jsx', '.mjs', '.cjs'];
  override readonly defaultManifests = ['package.json'];

  override detect(filePath: string, content: string): boolean {
    const ext = filePath.toLowerCase();
    return this.fileExtensions.some((e) => ext.endsWith(e));
  }

  override getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'javascript',
      displayName: 'JavaScript',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'SUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: true,
      binary: process.execPath,
      version: process.version,
      notes: 'Native V8 execution & in-process AST orchestration'
    };
  }
}
