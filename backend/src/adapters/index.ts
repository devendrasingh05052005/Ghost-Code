import { ILanguageAdapter } from './core/languageAdapter';
import { CobolAdapter } from './languages/cobolAdapter';
import { FortranAdapter } from './languages/fortranAdapter';
import { TypeScriptAdapter } from './languages/typescriptAdapter';
import { JavaScriptAdapter } from './languages/javascriptAdapter';
import { PythonAdapter } from './languages/pythonAdapter';
import { CAdapter } from './languages/cAdapter';
import { CppAdapter } from './languages/cppAdapter';
import { JavaAdapter } from './languages/javaAdapter';
import { CSharpAdapter } from './languages/csharpAdapter';
import { GoAdapter } from './languages/goAdapter';
import { RustAdapter } from './languages/rustAdapter';
import { PhpAdapter } from './languages/phpAdapter';
import { RubyAdapter } from './languages/rubyAdapter';
import { SwiftAdapter } from './languages/swiftAdapter';
import { KotlinAdapter } from './languages/kotlinAdapter';

const adapters: Map<string, ILanguageAdapter> = new Map();

function registerAdapters() {
  const list: ILanguageAdapter[] = [
    new CobolAdapter(),
    new FortranAdapter(),
    new TypeScriptAdapter(),
    new JavaScriptAdapter(),
    new PythonAdapter(),
    new CAdapter(),
    new CppAdapter(),
    new JavaAdapter(),
    new CSharpAdapter(),
    new GoAdapter(),
    new RustAdapter(),
    new PhpAdapter(),
    new RubyAdapter(),
    new SwiftAdapter(),
    new KotlinAdapter()
  ];

  for (const a of list) {
    adapters.set(a.languageId, a);
  }
}

registerAdapters();

export function getAdapter(languageId: string): ILanguageAdapter | undefined {
  return adapters.get(languageId.toLowerCase());
}

export function getAllAdapters(): ILanguageAdapter[] {
  return Array.from(adapters.values());
}

export function detectAdapter(filePath: string, content: string): ILanguageAdapter | undefined {
  for (const adapter of adapters.values()) {
    if (adapter.detect(filePath, content)) {
      return adapter;
    }
  }
  return undefined;
}
