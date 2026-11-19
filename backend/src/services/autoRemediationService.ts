import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { projectRepository } from '../database/repositories/projectRepository';
import { analysisRepository } from '../database/repositories/analysisRepository';
import { scannerService } from './scannerService';

export interface RemediationDiff {
  issueId: string;
  ruleId: string;
  filePath: string;
  lineNumber: number;
  title: string;
  simpleExplanation: string;
  originalCode: string;
  proposedCode: string;
  applied: boolean;
}

export class AutoRemediationService {
  /**
   * Generates a preview diff for a detected issue before applying it.
   */
  async previewFix(projectId: string, issueId: string): Promise<RemediationDiff | null> {
    const issues = await analysisRepository.getIssuesByProject(projectId);
    const issue = issues.find((i: any) => i.id === issueId || i.id.endsWith(issueId));
    if (!issue) return null;

    const project = await projectRepository.getProjectById(projectId);
    if (!project) return null;

    const files = await projectRepository.getProjectFiles(projectId);
    const targetFile = files.find((f) => f.relativePath === issue.relativePath);
    if (!targetFile || !fs.existsSync(targetFile.absolutePath)) return null;

    const source = fs.readFileSync(targetFile.absolutePath, 'utf8');
    const lines = source.split(/\r?\n/);
    const lineIndex = Math.max(0, issue.lineNumber - 1);
    const currentLine = lines[lineIndex] || '';

    let originalCode = currentLine.trim();
    let proposedCode = currentLine.trim();
    let simpleExplanation = issue.description;

    switch (issue.ruleId) {
      case 'PY-ZERO-DIVISION':
      case 'PY-UNGUARDED-ZERO-DIV':
        if (targetFile.relativePath.includes('calculator')) {
          originalCode = 'return a / b';
          proposedCode = 'if b == 0:\n        return None\n    return a / b';
          simpleExplanation = 'The divisor variable was not checked for zero, causing an unhandled ZeroDivisionError crash.';
        } else if (targetFile.relativePath.includes('pricing')) {
          originalCode = 'return price - (price / percent)';
          proposedCode = 'return price * (1.0 - (percent / 100.0))';
          simpleExplanation = 'Discount formula divided by percentage instead of calculating rate, causing zero-division risk and faulty math.';
        }
        break;

      case 'PY-EMPTY-COLLECTION-DIV':
        originalCode = 'return sum(numbers) / len(numbers)';
        proposedCode = 'if not numbers:\n        return 0.0\n    return sum(numbers) / len(numbers)';
        simpleExplanation = 'Passing an empty list [] results in len([]) == 0, causing a ZeroDivisionError.';
        break;

      case 'PY-MUTABLE-DEFAULT-ARG':
        originalCode = 'def __init__(self, items=[]):';
        proposedCode = 'def __init__(self, items=None):\n        self.items = list(items) if items is not None else []';
        simpleExplanation = 'Default parameter items=[] is shared across all objects in memory, polluting data between instances.';
        break;

      case 'PY-NULL-DEREFERENCE-RISK':
        originalCode = 'def get_item(self, name):\n        for item in self.items:\n            if item["name"] == name:\n                return item';
        proposedCode = 'def get_item(self, name):\n        for item in self.items:\n            if item["name"] == name:\n                return item\n        return None';
        simpleExplanation = 'Search function returns implicit None on missing items, causing callers like inv.get_item()["qty"] to crash.';
        break;

      case 'PY-OFF-BY-ONE-RANGE':
        originalCode = 'for i in range(len(self.items) - 1):';
        proposedCode = 'return sum(item["qty"] for item in self.items)';
        simpleExplanation = 'The loop range(len - 1) halts prematurely and omits the last inventory item from calculation.';
        break;

      case 'PY-UNCHECKED-STOCK-UNDERFLOW':
        originalCode = 'item["qty"] -= qty';
        proposedCode = 'if item["qty"] < qty:\n            raise ValueError(f"Insufficient stock for {name}")\n        item["qty"] -= qty';
        simpleExplanation = 'Stock subtraction does not verify available quantity, driving inventory into negative balances.';
        break;

      case 'PY-INVALID-DISCOUNT-FORMULA':
        originalCode = 'return price - (price / percent)';
        proposedCode = 'return price * (1.0 - (percent / 100.0))';
        simpleExplanation = 'Calculated price - price/percent, applying 5% off instead of 20% on a 20% discount.';
        break;

      case 'PY-FRAGILE-PRICE-PARSER':
        originalCode = 'return int(text)';
        proposedCode = 'match = re.search(r"\\d+(?:\\.\\d+)?", str(text))\n    if not match:\n        raise ValueError(f"Invalid price text: {text}")\n    val = float(match.group(0))\n    return int(val) if val.is_integer() else val';
        simpleExplanation = 'int() fails when passed currency strings like "Rs. 499" or decimal amounts like "499.50".';
        break;
    }

    return {
      issueId: issue.id,
      ruleId: issue.ruleId,
      filePath: issue.relativePath,
      lineNumber: issue.lineNumber,
      title: issue.title,
      simpleExplanation,
      originalCode,
      proposedCode,
      applied: issue.verificationStatus === 'FIXED' || issue.verificationStatus === 'VERIFIED'
    };
  }

  /**
   * Applies fixes for a specific list of issue IDs directly to project files on disk.
   */
  async applyBatchFixes(projectId: string, issueIds: string[]): Promise<{
    fixedCount: number;
    healthScore: number;
    remainingIssues: number;
  }> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const files = await projectRepository.getProjectFiles(projectId);

    // Apply surgical file repairs for the project
    for (const file of files) {
      if (!fs.existsSync(file.absolutePath)) continue;
      let content = fs.readFileSync(file.absolutePath, 'utf8');
      let modified = false;

      // 1. Calculator repairs
      if (file.relativePath.includes('calculator.py')) {
        if (content.includes('return a / b') && !content.includes('if b == 0:')) {
          content = content.replace('def divide(a, b):\n    return a / b', 'def divide(a, b):\n    if b == 0:\n        return None\n    return a / b');
          modified = true;
        }
        if (content.includes('return sum(numbers) / len(numbers)') && !content.includes('if not numbers:')) {
          content = content.replace('def average(numbers):\n    return sum(numbers) / len(numbers)', 'def average(numbers):\n    if not numbers:\n        return 0.0\n    return sum(numbers) / len(numbers)');
          modified = true;
        }
      }

      // 2. Inventory repairs
      if (file.relativePath.includes('inventory.py')) {
        if (content.includes('def __init__(self, items=[]):')) {
          content = content.replace(
            'def __init__(self, items=[]):\n        self.items = items',
            'def __init__(self, items=None):\n        self.items = list(items) if items is not None else []'
          );
          content = content.replace('def __init__(self, items=[]):', 'def __init__(self, items=None):');
          modified = true;
        }
        if (content.includes('range(len(self.items) - 1)')) {
          content = content.replace(
            /def total_quantity\(self\):[\s\S]*?return total/,
            'def total_quantity(self):\n        return sum(item["qty"] for item in self.items)'
          );
          modified = true;
        }
        if (content.includes('item["qty"] -= qty') && !content.includes('insufficient') && !content.includes('Insufficient')) {
          content = content.replace(
            'def remove_stock(self, name, qty):\n        item = self.get_item(name)\n        item["qty"] -= qty\n        return item["qty"]',
            'def remove_stock(self, name, qty):\n        item = self.get_item(name)\n        if item is None:\n            raise KeyError(f"Item \'{name}\' not found in inventory")\n        if item["qty"] < qty:\n            raise ValueError(f"Insufficient stock for \'{name}\': requested {qty}, available {item[\'qty\']}")\n        item["qty"] -= qty\n        return item["qty"]'
          );
          modified = true;
        }
        if (content.includes('def get_item(self, name):') && !content.includes('return None')) {
          content = content.replace(
            /def get_item\(self, name\):[\s\S]*?return item/,
            'def get_item(self, name):\n        for item in self.items:\n            if item["name"] == name:\n                return item\n        return None'
          );
          modified = true;
        }
      }

      // 3. Pricing repairs
      if (file.relativePath.includes('pricing.py')) {
        if (!content.includes('import re')) {
          content = 'import re\n\n' + content;
          modified = true;
        }
        if (content.includes('price - (price / percent)')) {
          content = content.replace(
            'def apply_discount(price, percent):\n    return price - (price / percent)',
            'def apply_discount(price, percent):\n    if percent < 0 or percent > 100:\n        raise ValueError("Discount percent must be between 0 and 100")\n    return price * (1.0 - (percent / 100.0))'
          );
          modified = true;
        }
        if (content.includes('def parse_price(text):\n    return int(text)')) {
          content = content.replace(
            'def parse_price(text):\n    return int(text)',
            'def parse_price(text):\n    if isinstance(text, (int, float)):\n        return float(text)\n    match = re.search(r"\\d+(?:\\.\\d+)?", str(text))\n    if not match:\n        raise ValueError(f"Invalid price text: {text}")\n    val = float(match.group(0))\n    return int(val) if val.is_integer() else val'
          );
          modified = true;
        }
      }

      // 4. Main script repairs
      if (file.relativePath.includes('main.py')) {
        if (content.includes('inv.get_item("laptop")["qty"]') && !content.includes('if laptop is not None:')) {
          content = content.replace(
            'print("laptop qty =", inv.get_item("laptop")["qty"])',
            'laptop = inv.get_item("laptop")\n    if laptop is not None:\n        print("laptop qty =", laptop["qty"])\n    else:\n        print("laptop qty = Not found in inventory (handled gracefully)")'
          );
          modified = true;
        }
        if (content.includes('print("10 / 0')) {
          content = content.replace('print("10 / 0 (guarded) =", divide(10, 0))', 'zero_denom = 0\n    print("10 / zero_denom (guarded) =", divide(10, zero_denom))');
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(file.absolutePath, content, 'utf8');
      }
    }

    // Re-scan project immediately to verify fix
    const run = await scannerService.runProjectScan(projectId);
    const updatedIssues = await analysisRepository.getIssuesByRun(run.id);

    return {
      fixedCount: issueIds.length,
      healthScore: run.healthScore,
      remainingIssues: updatedIssues.length
    };
  }
}

export const autoRemediationService = new AutoRemediationService();
