# 🔬 GhostCode — The Polyglot Code Autopsy & Autonomous Remediation Lab

> **One Platform. Any Codebase. Deep Code Intelligence.**  
> *Transform broken, legacy, and defect-ridden software into clean, verified, production-ready code.*

---

## 🌟 What is GhostCode?

**GhostCode** is an open-source, developer-first software diagnostics laboratory and autonomous code intelligence platform. It bridges the gap between modern distributed systems and critical legacy engines by combining deep AST static analysis, cross-language arithmetic parity auditing, dependency blast-radius evaluation, controlled mutation testing, and automated surgical code remediation.

Whether diagnosing subtle floating-point drift between **COBOL COMP-3** banking engines and modern **TypeScript** microservices, or catching zero-division and null-dereference crashes in **Python** and **C/C++**, GhostCode provides an end-to-end sandbox to inspect, repair, verify, and export clean codebases.

---

## 🚀 The 5-Step Unified Remediation Workflow

GhostCode guides developers through a streamlined, 5-stage visual roadmap:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. UPLOAD   │ ──> │  2. REVIEW   │ ──> │   3. FIX     │ ──> │   4. TEST    │ ──> │ 5. DOWNLOAD  │
│ ZIP / Folder │     │ AST Autopsy  │     │ Visual Diffs │     │ Live Sandbox │     │  Clean Code  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Upload (`/upload`)** — Ingest any project repository via drag-and-drop ZIP archive or local directory. Built-in Zip-Slip defenses prevent path traversal while language recognizers index the codebase.
2. **Review (`/scanner`)** — Real-time AST static scanner diagnoses issues across 5 severity levels (*Critical*, *High*, *Medium*, *Low*, *Informational*) with plain-English defect descriptions and impact forecasting.
3. **Fix (`/remediation`)** — Inspect side-by-side Red vs. Green diffs with line-by-line syntax highlighting. Apply surgical repairs individually or execute 1-click batch remediation.
4. **Test (`/execution`)** — Execute applications and automated unit test suites inside an isolated, sandboxed terminal runner. Features friendly error explanations, sanitized relative paths, and instant re-testing.
5. **Download (`/download`)** — View an animated Before vs. After health comparison ring (e.g., 32% ➔ 100%), review the complete remediation changelog, and export the clean, verified ZIP archive.

---

## 🛠️ Core Capabilities & Modules

### 1. 🔍 Deep AST Static Autopsy Engine
- Inspects Abstract Syntax Trees across polyglot codebases for logic errors, resource leaks, off-by-one boundary bugs, and unsafe type assumptions.
- Generates composite **Health Scores (0–100%)** based on defect severity weightings and code complexity metrics.

### 2. 🧮 Cross-Language Arithmetic Parity Auditing
- Solves silent financial discrepancies between legacy mainframe systems and modern cloud architectures.
- Concurrently runs identical business formulas across native **COBOL** (fixed-point packed decimal `COMP-3`), **Fortran** (`REAL*8` IEEE 754), and **TypeScript / Python** (binary64 float) to detect sub-cent fractional drift and rounding divergence.

### 3. 🕸️ AST Dependency & Blast Radius Visualizer
- Interactive graph canvas that constructs complete file and function dependency trees.
- Visualizes circular import cycles and highlights the blast radius of proposed code modifications before applying them.

### 4. 🧬 Controlled Bug Mutation Laboratory
- Evaluates test suite quality and resilience through 15+ AST mutation operators (relational boundary swaps, arithmetic inversions, null injections, and condition reversals).
- Measures test mutation survival rates with atomic rollback safeguards.

### 5. 🖥️ Sandboxed Execution & Live Terminal
- In-browser console terminal with live execution tracking for app and test processes.
- Sanitizes host-specific absolute paths to clean repository-relative paths.
- Automatically handles test fixtures and assertion evaluation.

---

## 🌐 Universal Polyglot Support (15 Languages)

GhostCode features a modular adapter architecture designed to parse and inspect codebases in 15 programming languages:

| Language | AST & Syntax Inspection | Dependency Graph | Mutation Testing | Sandboxed Execution |
|---|:---:|:---:|:---:|:---:|
| **COBOL** (`.cbl`, `.cob`) | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Native `cobc` |
| **Fortran** (`.f90`, `.f`) | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Native `gfortran` |
| **Python** (`.py`) | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Native `python3` |
| **TypeScript** (`.ts`, `.tsx`) | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Native `node` |
| **JavaScript** (`.js`, `.jsx`) | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Native `node` |
| **C / C++** (`.c`, `.cpp`, `.h`) | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Native `gcc`/`g++` |
| **Go** (`.go`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |
| **Rust** (`.rs`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |
| **Java** (`.java`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |
| **Kotlin** (`.kt`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |
| **C#** (`.cs`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |
| **Swift** (`.swift`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |
| **Ruby** (`.rb`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |
| **PHP** (`.php`) | ✅ Supported | ✅ Supported | ✅ Supported | Static / AST Analysis |

---

## 📂 Project Architecture

```
GHOST-CODE/
├── backend/                  # Node.js + Express + TypeScript Core Engine
│   ├── src/
│   │   ├── adapters/         # 15 Polyglot Language AST Analyzers
│   │   ├── api/              # REST Endpoints, Routers & Controllers
│   │   ├── database/         # SQLite Repositories & Migrations
│   │   └── services/         # Scanner, Remediation, Execution & Parity Engines
├── frontend/                 # React 18 + Vite + Tailwind CSS UI
│   ├── src/
│   │   ├── components/       # HealthRing, DiffViewer, Terminal, Stepper
│   │   ├── pages/            # Dashboard, Upload, Scanner, Execution, Download
│   │   └── services/         # Axios API Client & Authentication Layer
├── engines/                  # Native Arithmetic & Calculation Engines
│   ├── cobol/                # Native COBOL COMP-3 Fixed-Point Amortization
│   └── fortran/              # Native Fortran IEEE 754 Floating-Point Engine
├── database/                 # Embedded SQLite WAL Database (ghostcode.db)
└── scripts/                  # Build, Test & Engine Compilation Utilities
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python:** 3.10+ (for Python AST analysis and sandbox tests)
- *(Optional)* **GnuCOBOL** (`cobc`) and **GNU Fortran** (`gfortran`) for native legacy arithmetic compilation.

### 1. Clone the Repository
```bash
git clone https://github.com/devendrasingh05052005/Ghost-Code.git
cd Ghost-Code
```

### 2. Install Dependencies & Build
```bash
# Install backend dependencies & compile TypeScript
npm --prefix backend install
npm --prefix backend run build

# Install frontend dependencies & compile React client
npm --prefix frontend install
npm --prefix frontend run build
```

### 3. Start the Backend Service
```bash
# In your primary terminal (runs on http://localhost:3001)
npm --prefix backend start
```

### 4. Start the Frontend Client
```bash
# In a second terminal (runs on http://localhost:5173)
npm --prefix frontend run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🔒 Security Architecture

- **Subprocess Isolation:** Process execution uses strictly tokenized argument arrays (`spawn(binary, [args])`) rather than raw shell strings, eliminating shell-injection risks.
- **Resource Constraints:** Strict wall-clock timeouts (default 10,000 ms) and buffer caps (10 MB) protect against infinite loops, memory leaks, and fork bombs.
- **Archive Extraction Defense:** Upload extraction verifies entry paths to reject Zip-Slip directory traversal attempts (`../`).
- **100% Offline & Private:** Operates entirely locally on your host environment with zero telemetry or outbound network requirements.

---

## 📄 License

This project is licensed under the **MIT License**.
