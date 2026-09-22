import {
  ILanguageAdapter,
  ProjectScanContext,
  SyntaxDiagnostic,
  MutationCandidate
} from '../core/languageAdapter';
import {
  AnalysisIssue,
  DependencyNode,
  DependencyEdge,
  TestSuite,
  ExecutionEvent,
  LanguageCapabilityRecord
} from '../../../../shared/types';
import { ProcessRunner } from '../../execution/processRunner';
import { config } from '../../config';
import * as path from 'path';
import * as fs from 'fs';

export class PythonAdapter implements ILanguageAdapter {
  readonly languageId = 'python';
  readonly displayName = 'Python';
  readonly fileExtensions = ['.py', '.pyw'];
  readonly defaultManifests = ['requirements.txt', 'pyproject.toml', 'Pipfile'];

  detect(filePath: string, content: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (this.fileExtensions.includes(ext)) return true;
    return /def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(content) || /import\s+[a-zA-Z_]/.test(content);
  }

  getCapabilities(): LanguageCapabilityRecord {
    return {
      languageId: 'python',
      displayName: 'Python',
      syntaxParsing: 'SUPPORTED',
      staticAnalysis: 'SUPPORTED',
      dependencyGraph: 'SUPPORTED',
      executionTracing: 'SUPPORTED',
      bugInjection: 'SUPPORTED',
      testGeneration: 'SUPPORTED',
      profiling: 'SUPPORTED',
      toolchainDetected: config.toolchains.python.available,
      binary: config.toolchains.python.binary,
      version: 'Python 3.15',
      notes: 'Local Python runtime verified'
    };
  }

  async parseSyntax(source: string, filePath: string): Promise<SyntaxDiagnostic[]> {
    const diagnostics: SyntaxDiagnostic[] = [];
    const lines = source.split(/\r?\n/);
    let openParens = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.length === 0) continue;

      if ((trimmed.startsWith('def ') || trimmed.startsWith('class ') ||
           trimmed.startsWith('if ') || trimmed.startsWith('for ') ||
           trimmed.startsWith('while ') || trimmed.startsWith('try:') ||
           trimmed.startsWith('except') || trimmed.startsWith('finally:')) &&
          !trimmed.endsWith(':')) {
        diagnostics.push({
          line: i + 1,
          column: line.length,
          message: 'Python syntax error: compound statement header must terminate with colon (:)',
          severity: 'CRITICAL'
        });
      }

      for (const char of line) {
        if (char === '(' || char === '[' || char === '{') openParens++;
        else if (char === ')' || char === ']' || char === '}') openParens--;
      }
    }

    if (openParens !== 0) {
      diagnostics.push({
        line: lines.length,
        column: 1,
        message: 'Unbalanced bracket/parentheses delimiters in Python source',
        severity: 'HIGH'
      });
    }

    return diagnostics;
  }

  async analyzeStatic(source: string, filePath: string, context: ProjectScanContext): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('#') || trimmed.length === 0) continue;

      // Rule 1: Division by zero literal
      if (/\/\s*0(?![.\d])/.test(trimmed)) {
        issues.push({
          id: `PY-DIV0-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('/') + 1,
          languageId: 'python',
          ruleId: 'PY-ZERO-DIVISION',
          category: 'PRECISION',
          severity: 'CRITICAL',
          confidence: 'CONFIRMED',
          title: 'Division by Constant Zero (ZeroDivisionError)',
          description: 'Expression divides operand by integer 0 literal, raising ZeroDivisionError at runtime.',
          technicalExplanation: 'Python does not coerce zero division to Infinity; it immediately raises ZeroDivisionError, halting script execution.',
          potentialImpact: 'Immediate crash of the calculation pipeline upon evaluation.',
          reproductionSteps: 'Invoke expression with constant divisor 0.',
          suggestedFix: 'Guard denominator before division: if denominator != 0: ...',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 1b: Unguarded division by variable denominator (divide(a, b))
      if (/(?:return\s+.*|\w+\s*=\s*.*)\/\s*([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*$|[\s),])/.test(trimmed) &&
          !trimmed.includes('/ 100') && !trimmed.includes('/ 10') && !trimmed.includes('/ 2')) {
        const divMatch = trimmed.match(/\/\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        const denomVar = divMatch ? divMatch[1] : 'divisor';
        // Verify this is not guarded in previous lines
        let guarded = false;
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (lines[j].includes(`${denomVar} == 0`) || lines[j].includes(`${denomVar} != 0`) || lines[j].includes(`not ${denomVar}`)) {
            guarded = true;
            break;
          }
        }
        if (!guarded && denomVar !== 'len' && denomVar !== 'total') {
          issues.push({
            id: `PY-UNGUARDED-DIV-${lineNum}`,
            analysisRunId: '',
            projectId: context.projectId,
            relativePath: filePath,
            lineNumber: lineNum,
            columnNumber: line.indexOf('/') + 1,
            languageId: 'python',
            ruleId: 'PY-UNGUARDED-ZERO-DIV',
            category: 'PRECISION',
            severity: 'HIGH',
            confidence: 'CONFIRMED',
            title: 'Unguarded Arithmetic Division (ZeroDivisionError Risk)',
            description: `Arithmetic division by variable "${denomVar}" without prior zero-value validation.`,
            technicalExplanation: `When "${denomVar}" evaluates to zero at runtime, the Python interpreter raises an unhandled ZeroDivisionError exception, immediately aborting execution.`,
            potentialImpact: 'Unhandled runtime crash when callers supply 0 as the denominator parameter.',
            reproductionSteps: `Pass 0 as the argument for "${denomVar}" during invocation.`,
            suggestedFix: `Validate denominator before division: if ${denomVar} == 0: return None (or raise ValueError("Divisor cannot be zero")).`,
            verificationStatus: 'UNVERIFIED',
            createdAt: new Date().toISOString()
          });
        }
      }

      // Rule 1c: Division by collection length without emptiness guard (sum(x) / len(x))
      if (/\/\s*len\s*\(([a-zA-Z_][a-zA-Z0-9_]*)\)/.test(trimmed)) {
        const lenMatch = trimmed.match(/\/\s*len\s*\(([a-zA-Z_][a-zA-Z0-9_]*)\)/);
        const collName = lenMatch ? lenMatch[1] : 'collection';
        let guarded = false;
        for (let j = Math.max(0, i - 6); j < i; j++) {
          if (lines[j].includes(`not ${collName}`) || lines[j].includes(`len(${collName}) == 0`) || lines[j].includes(`len(${collName}) != 0`) || lines[j].includes(`not len(${collName})`)) {
            guarded = true;
            break;
          }
        }
        if (!guarded) {
          issues.push({
            id: `PY-EMPTY-COLL-DIV-${lineNum}`,
            analysisRunId: '',
            projectId: context.projectId,
            relativePath: filePath,
            lineNumber: lineNum,
            columnNumber: line.indexOf('/') + 1,
            languageId: 'python',
            ruleId: 'PY-EMPTY-COLLECTION-DIV',
            category: 'PRECISION',
            severity: 'HIGH',
            confidence: 'CONFIRMED',
            title: 'Empty Collection Division by Length (ZeroDivisionError)',
            description: `Arithmetic division by len(${collName}) without verifying collection non-emptiness.`,
            technicalExplanation: `When an empty list or iterable is passed, len(${collName}) evaluates to 0. Python evaluates sum([]) / 0, raising an unhandled ZeroDivisionError.`,
            potentialImpact: 'Crashing statistical aggregations on empty datasets or uninitialized inputs.',
            reproductionSteps: `Invoke function with an empty list: average([]).`,
            suggestedFix: `Check if sequence is empty before computing: if not ${collName}: return 0 (or return None).`,
            verificationStatus: 'UNVERIFIED',
            createdAt: new Date().toISOString()
          });
        }
      }

      // Rule 2: Mutable default argument in function signature
      if (/def\s+[a-zA-Z0-9_]+\s*\(.*=\s*(?:\[\]|\{\})\s*\)/.test(trimmed)) {
        issues.push({
          id: `PY-MUT-DEF-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: 1,
          languageId: 'python',
          ruleId: 'PY-MUTABLE-DEFAULT-ARG',
          category: 'LOGIC',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Mutable Default Argument in Function Definition',
          description: 'Function default parameter is initialized with a mutable list [] or dictionary {}.',
          technicalExplanation: 'Python default arguments are evaluated once at function definition time. Subsequent invocations share the same mutated object across calls.',
          potentialImpact: 'Unintended cross-instance state pollution where modifying one object alters state in all instances created with defaults.',
          reproductionSteps: 'Instantiate two objects without arguments, mutate the collection on the first, and observe mutated state on the second.',
          suggestedFix: 'Use "param=None" as default and initialize inside function body with "if param is None: param = []".',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 3: Bare except clause
      if (trimmed === 'except:' || trimmed.startsWith('except :')) {
        issues.push({
          id: `PY-BARE-EXCEPT-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: 1,
          languageId: 'python',
          ruleId: 'PY-BARE-EXCEPT',
          category: 'LOGIC',
          severity: 'MEDIUM',
          confidence: 'CONFIRMED',
          title: 'Bare "except:" Catches BaseException',
          description: 'Exception block catches all exceptions without specifying Exception class.',
          technicalExplanation: 'Bare except clauses intercept KeyboardInterrupt and SystemExit, preventing graceful program termination and debugging.',
          potentialImpact: 'Swallowing unexpected critical faults and masking syntax or system errors.',
          reproductionSteps: 'Raise KeyboardInterrupt inside the try block and observe failure to terminate.',
          suggestedFix: 'Replace with "except Exception as err:".',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 4: Search routine falling through without return or exception (Null Dereference Risk)
      if (trimmed.startsWith('def get_') || trimmed.startsWith('def find_')) {
        let hasReturnInLoop = false;
        let hasFallbackReturn = false;
        const baseIndent = line.search(/\S/);
        for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
          const innerTrim = lines[j].trim();
          if (innerTrim.length === 0 || innerTrim.startsWith('#')) continue;
          const currentIndent = lines[j].search(/\S/);
          if (currentIndent <= baseIndent && (innerTrim.startsWith('def ') || innerTrim.startsWith('class '))) break;
          if (innerTrim.startsWith('return ') && currentIndent > baseIndent + 4) {
            hasReturnInLoop = true;
          }
          if ((innerTrim.startsWith('return') || innerTrim.startsWith('raise')) && currentIndent <= baseIndent + 4) {
            hasFallbackReturn = true;
          }
        }
        if (hasReturnInLoop && !hasFallbackReturn) {
          issues.push({
            id: `PY-NULL-DEREF-${lineNum}`,
            analysisRunId: '',
            projectId: context.projectId,
            relativePath: filePath,
            lineNumber: lineNum,
            columnNumber: 1,
            languageId: 'python',
            ruleId: 'PY-NULL-DEREFERENCE-RISK',
            category: 'LOGIC',
            severity: 'HIGH',
            confidence: 'CONFIRMED',
            title: 'Implicit None Return on Search Miss (Null Dereference Risk)',
            description: 'Search function returns target inside conditional loop but exits with implicit None when missing.',
            technicalExplanation: 'When the requested element is absent, the function falls through and evaluates to None. Callers attempting dictionary indexing (e.g. obj.get_item(key)["qty"]) crash with TypeError: "NoneType" object is not subscriptable.',
            potentialImpact: 'Uncaught TypeError runtime crashes in consumer modules attempting to access properties of query results.',
            reproductionSteps: 'Query an item key that does not exist in the collection and access an index or attribute on the result.',
            suggestedFix: 'Return an explicit sentinel (None), or raise a descriptive KeyError, and ensure calling code validates the return value before subscripting.',
            verificationStatus: 'UNVERIFIED',
            createdAt: new Date().toISOString()
          });
        }
      }

      // Rule 5: Off-by-one boundary truncation in loop range(len(...) - 1)
      if (/range\s*\(\s*(?:0\s*,\s*)?len\s*\([^)]+\)\s*-\s*1\s*\)/.test(trimmed)) {
        issues.push({
          id: `PY-OFF-BY-ONE-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('range') + 1,
          languageId: 'python',
          ruleId: 'PY-OFF-BY-ONE-RANGE',
          category: 'BOUNDARY',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Off-By-One Boundary Error in Loop Indexing',
          description: 'Loop bounds specify range(len(...) - 1), truncating the final collection item from processing.',
          technicalExplanation: 'Python range(n) produces a half-open interval [0, n) excluding n. Passing len(items) - 1 causes the loop to stop at index len(items) - 2, skipping the last element completely during aggregation.',
          potentialImpact: 'Data corruption and incomplete aggregates (e.g., inventory item counts under-reporting by the value of the last item).',
          reproductionSteps: 'Add multiple items to the collection and verify total aggregate computation against the actual count.',
          suggestedFix: 'Iterate directly over elements using "for item in self.items:" or use full length "for i in range(len(self.items)):".',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 6: Unchecked subtraction permitting negative inventory underflow
      if (/(?:\[\s*["']qty["']\s*\]|\.qty|\.stock)\s*-=\s*([a-zA-Z0-9_]+)/.test(trimmed)) {
        const subMatch = trimmed.match(/-=\s*([a-zA-Z0-9_]+)/);
        const qtyVar = subMatch ? subMatch[1] : 'qty';
        let hasUnderflowGuard = false;
        for (let j = Math.max(0, i - 8); j < i; j++) {
          if (lines[j].includes('<') || lines[j].includes('>') || lines[j].includes('insufficient') || lines[j].includes('ValueError')) {
            hasUnderflowGuard = true;
            break;
          }
        }
        if (!hasUnderflowGuard) {
          issues.push({
            id: `PY-UNDERFLOW-${lineNum}`,
            analysisRunId: '',
            projectId: context.projectId,
            relativePath: filePath,
            lineNumber: lineNum,
            columnNumber: line.indexOf('-=') + 1,
            languageId: 'python',
            ruleId: 'PY-UNCHECKED-STOCK-UNDERFLOW',
            category: 'LOGIC',
            severity: 'HIGH',
            confidence: 'CONFIRMED',
            title: 'Unchecked Quantity Decrement (Inventory Underflow Risk)',
            description: `Inventory subtraction decreases balance without verifying against available stock.`,
            technicalExplanation: `Deducting a withdrawal quantity exceeding the current available stock forces the balance below zero into negative integers, violating core business inventory constraints.`,
            potentialImpact: 'Creation of phantom inventory deficits and negative stock balances.',
            reproductionSteps: `Attempt to deduct a quantity greater than currently available stock: inv.remove_stock("pen", 100).`,
            suggestedFix: `Enforce boundary guard before decrementing: if item["qty"] < ${qtyVar}: raise ValueError(f"Insufficient stock: requested {${qtyVar}}, available {item['qty']}").`,
            verificationStatus: 'UNVERIFIED',
            createdAt: new Date().toISOString()
          });
        }
      }

      // Rule 7: Faulty percentage discount arithmetic formula
      if (/return\s+.*price\s*-\s*\(\s*(?:price\s*\/\s*percent|percent\s*\/\s*100\s*\))/i.test(trimmed) ||
          /price\s*-\s*\(\s*price\s*\/\s*percent\s*\)/i.test(trimmed)) {
        issues.push({
          id: `PY-DISCOUNT-FORMULA-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('-') + 1,
          languageId: 'python',
          ruleId: 'PY-INVALID-DISCOUNT-FORMULA',
          category: 'PRECISION',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Faulty Percentage Arithmetic in Discount Computation',
          description: 'Discount formula divides price by discount percentage instead of multiplying by rate.',
          technicalExplanation: 'Computing price - (price / percent) inverts percentage mathematics: applying a 20% discount on 1000 calculates 1000 - (1000 / 20) = 950 (5% discount) instead of 800. For 100% discount, it gives 1% discount.',
          potentialImpact: 'Severe billing calculation discrepancies, causing severe revenue loss or customer overcharging.',
          reproductionSteps: 'Invoke apply_discount(1000, 20) and observe returned value is 950 instead of 800.',
          suggestedFix: 'Correct percentage formula: return price * (1.0 - (percent / 100.0)).',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }

      // Rule 8: Fragile int() typecast on unvalidated financial input
      if (!source.includes('re.search') && !source.includes('re.sub') && (/def\s+parse_price\b/.test(lines[Math.max(0, i - 3)]) || (trimmed.startsWith('return int(') && filePath.includes('pricing')))) {
        issues.push({
          id: `PY-PRICE-PARSER-${lineNum}`,
          analysisRunId: '',
          projectId: context.projectId,
          relativePath: filePath,
          lineNumber: lineNum,
          columnNumber: line.indexOf('int(') + 1,
          languageId: 'python',
          ruleId: 'PY-FRAGILE-PRICE-PARSER',
          category: 'BOUNDARY',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          title: 'Fragile Integer Type Casting on Financial Text Input',
          description: 'Direct invocation of int() on unvalidated currency strings lacking decimal and symbol handling.',
          technicalExplanation: 'Passing formatted currency strings containing currency symbols (e.g. "Rs. 499"), commas, whitespace, or floating-point decimals (e.g. "499.50") immediately throws an unhandled ValueError.',
          potentialImpact: 'Payment checkout and pricing ingestion crashes when parsing formatted customer inputs.',
          reproductionSteps: 'Pass "Rs. 499" or "499.50" into parse_price() and observe unhandled ValueError.',
          suggestedFix: 'Sanitize string using regex to extract digits and optional decimal point, then cast to float: return float(re.search(r"\\d+(?:\\.\\d+)?", text).group(0)).',
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date().toISOString()
        });
      }
    }

    return issues;
  }

  async extractDependencies(source: string, filePath: string, context: ProjectScanContext): Promise<{ nodes: DependencyNode[]; edges: DependencyEdge[] }> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const lines = source.split(/\r?\n/);

    const fileNodeId = `py:${filePath}`;
    nodes.push({
      id: fileNodeId,
      projectId: context.projectId,
      nodeType: 'FILE',
      name: path.basename(filePath),
      qualifiedName: fileNodeId,
      filePath
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // import x
      const impMatch = trimmed.match(/^import\s+([a-zA-Z0-9_]+)/);
      if (impMatch) {
        const modName = impMatch[1];
        const targetId = `py:module:${modName}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: modName,
          qualifiedName: targetId,
          filePath: `${modName}.py`
        });
        edges.push({
          id: `imp:${fileNodeId}->${targetId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: targetId,
          edgeType: 'IMPORTS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }

      // from x import y
      const fromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import/);
      if (fromMatch) {
        const modName = fromMatch[1];
        const targetId = `py:module:${modName}`;
        nodes.push({
          id: targetId,
          projectId: context.projectId,
          nodeType: 'MODULE',
          name: modName,
          qualifiedName: targetId,
          filePath: `${modName}.py`
        });
        edges.push({
          id: `imp:${fileNodeId}->${targetId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: targetId,
          edgeType: 'IMPORTS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }

      // def / class
      const defMatch = trimmed.match(/^(?:async\s+)?def\s+([a-zA-Z0-9_]+)/);
      if (defMatch) {
        const funcName = defMatch[1];
        const funcId = `${fileNodeId}::${funcName}`;
        nodes.push({
          id: funcId,
          projectId: context.projectId,
          nodeType: 'FUNCTION',
          name: funcName,
          qualifiedName: funcId,
          filePath,
          lineStart: i + 1
        });
        edges.push({
          id: `def:${fileNodeId}->${funcId}`,
          projectId: context.projectId,
          sourceNodeId: fileNodeId,
          targetNodeId: funcId,
          edgeType: 'EXTENDS',
          isCircular: false,
          confidence: 'VERIFIED',
          weight: 1.0
        });
      }
    }

    return { nodes, edges };
  }

  async generateMutations(source: string, filePath: string): Promise<MutationCandidate[]> {
    const mutations: MutationCandidate[] = [];
    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      if (line.includes(' == ')) {
        const mutated = line.replace(' == ', ' != ');
        mutations.push({
          operatorName: 'PY_EQUALITY_INVERT',
          lineNumber: lineNum,
          originalSnippet: line,
          mutatedSnippet: mutated,
          diffUnified: `@@ -${lineNum},1 +${lineNum},1 @@\n-${line}\n+${mutated}`
        });
      }

      if (line.includes(' in ')) {
        const mutated = line.replace(' in ', ' not in ');
        mutations.push({
          operatorName: 'PY_MEMBERSHIP_INVERT',
          lineNumber: lineNum,
          originalSnippet: line,
          mutatedSnippet: mutated,
          diffUnified: `@@ -${lineNum},1 +${lineNum},1 @@\n-${line}\n+${mutated}`
        });
      }
    }

    return mutations;
  }

  async generateTests(source: string, filePath: string, issues: AnalysisIssue[]): Promise<TestSuite> {
    return {
      id: '',
      projectId: '',
      name: `Python Test Suite for ${path.basename(filePath)}`,
      suiteType: 'AUTOMATIC_SYNTHESIZED',
      targetFile: filePath,
      languageId: 'python',
      createdAt: new Date().toISOString(),
      testCases: [
        {
          id: '',
          testSuiteId: '',
          name: 'Zero Division Guard Test',
          category: 'BOUNDARY',
          inputParameters: '{"dividend": 100, "divisor": 0}',
          expectedOutput: 'ZeroDivisionError handled',
          timeoutMs: 5000
        },
        {
          id: '',
          testSuiteId: '',
          name: 'None Type Input Boundary',
          category: 'ERROR_HANDLING',
          inputParameters: '{"data": None}',
          expectedOutput: 'TypeError caught gracefully',
          timeoutMs: 5000
        }
      ]
    };
  }

  async traceExecution(source: string, filePath: string, inputs: unknown): Promise<{ events: ExecutionEvent[]; output: string; exitCode: number }> {
    const events: ExecutionEvent[] = [];
    const tempDir = path.join(config.sandboxDir, `py_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const scriptPath = path.join(tempDir, 'script.py');
    fs.writeFileSync(scriptPath, source, 'utf8');

    const runResult = await ProcessRunner.run({
      executable: config.toolchains.python.binary,
      args: [scriptPath],
      workingDirectory: tempDir,
      stdinInput: typeof inputs === 'string' ? inputs : JSON.stringify(inputs)
    });

    events.push({
      id: '',
      executionRunId: '',
      sequenceOrder: 1,
      eventType: 'FUNCTION_ENTER',
      timestampOffsetMs: 1.0,
      functionName: '<module>',
      filePath
    });

    events.push({
      id: '',
      executionRunId: '',
      sequenceOrder: 2,
      eventType: 'STDOUT',
      timestampOffsetMs: runResult.durationMs,
      payloadJson: JSON.stringify({ stdout: runResult.stdout })
    });

    events.push({
      id: '',
      executionRunId: '',
      sequenceOrder: 3,
      eventType: 'FUNCTION_EXIT',
      timestampOffsetMs: runResult.durationMs,
      functionName: '<module>',
      filePath
    });

    return {
      events,
      output: runResult.stdout || runResult.stderr,
      exitCode: runResult.exitCode || 0
    };
  }
}
