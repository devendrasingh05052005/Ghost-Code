-- GHOSTCODE Master Database Schema (SQLite 3)
-- Normalized relational schema for code intelligence, mutations, traces, and metrics

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    root_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS project_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    absolute_path TEXT NOT NULL,
    language_id TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    loc INTEGER DEFAULT 0,
    hash TEXT NOT NULL,
    is_vendor INTEGER DEFAULT 0,
    is_test INTEGER DEFAULT 0,
    is_generated INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, relative_path)
);

CREATE INDEX IF NOT EXISTS idx_project_files_proj ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_lang ON project_files(language_id);

CREATE TABLE IF NOT EXISTS project_languages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    language_id TEXT NOT NULL,
    file_count INTEGER DEFAULT 0,
    loc_count INTEGER DEFAULT 0,
    detected_frameworks TEXT,
    detected_manifests TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, language_id)
);

CREATE TABLE IF NOT EXISTS language_capabilities (
    language_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    syntax_parsing TEXT NOT NULL,
    static_analysis TEXT NOT NULL,
    dependency_graph TEXT NOT NULL,
    execution_tracing TEXT NOT NULL,
    bug_injection TEXT NOT NULL,
    test_generation TEXT NOT NULL,
    profiling TEXT NOT NULL,
    toolchain_detected INTEGER DEFAULT 0,
    toolchain_binary TEXT,
    toolchain_version TEXT,
    toolchain_notes TEXT
);

CREATE TABLE IF NOT EXISTS analysis_runs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    run_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL, -- PENDING, RUNNING, COMPLETED, FAILED
    health_score REAL DEFAULT 100.0,
    total_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    high_issues INTEGER DEFAULT 0,
    medium_issues INTEGER DEFAULT 0,
    low_issues INTEGER DEFAULT 0,
    info_issues INTEGER DEFAULT 0,
    config_json TEXT,
    error_message TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_proj ON analysis_runs(project_id);

CREATE TABLE IF NOT EXISTS analysis_issues (
    id TEXT PRIMARY KEY,
    analysis_run_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    file_id TEXT,
    relative_path TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    column_number INTEGER DEFAULT 1,
    end_line_number INTEGER,
    end_column_number INTEGER,
    language_id TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    category TEXT NOT NULL, -- SYNTAX, LOGIC, PRECISION, SECURITY, DEAD_CODE, BOUNDARY, RESOURCE
    severity TEXT NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL
    confidence TEXT NOT NULL, -- CONFIRMED, SUSPECTED, HEURISTIC
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    technical_explanation TEXT,
    potential_impact TEXT,
    reproduction_steps TEXT,
    suggested_fix TEXT,
    verification_status TEXT DEFAULT 'UNVERIFIED', -- UNVERIFIED, FIXED, VERIFIED, DISMISSED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(analysis_run_id) REFERENCES analysis_runs(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(file_id) REFERENCES project_files(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_issues_run ON analysis_issues(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON analysis_issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_file ON analysis_issues(file_id);

CREATE TABLE IF NOT EXISTS dependency_nodes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    node_type TEXT NOT NULL, -- FILE, MODULE, CLASS, FUNCTION, VARIABLE, INTERFACE
    name TEXT NOT NULL,
    qualified_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    metadata_json TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dep_nodes_proj ON dependency_nodes(project_id);

CREATE TABLE IF NOT EXISTS dependency_edges (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    edge_type TEXT NOT NULL, -- CALLS, IMPORTS, EXTENDS, USES, INSTANTIATES
    is_circular INTEGER DEFAULT 0,
    confidence TEXT DEFAULT 'VERIFIED', -- VERIFIED, INFERRED
    weight REAL DEFAULT 1.0,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(source_node_id) REFERENCES dependency_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY(target_node_id) REFERENCES dependency_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dep_edges_proj ON dependency_edges(project_id);

CREATE TABLE IF NOT EXISTS mutation_runs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    run_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL, -- RUNNING, COMPLETED, FAILED
    total_mutations INTEGER DEFAULT 0,
    killed_mutations INTEGER DEFAULT 0,
    survived_mutations INTEGER DEFAULT 0,
    timed_out_mutations INTEGER DEFAULT 0,
    mutation_score REAL DEFAULT 0.0,
    config_json TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS injected_mutations (
    id TEXT PRIMARY KEY,
    mutation_run_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    file_id TEXT,
    file_path TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    operator_name TEXT NOT NULL, -- ARITHMETIC_REPLACE, COMPARISON_INVERT, BOUNDARY_OFF_BY_ONE, etc.
    original_snippet TEXT NOT NULL,
    mutated_snippet TEXT NOT NULL,
    isolated_copy_path TEXT NOT NULL,
    status TEXT NOT NULL, -- INJECTED, ROLLED_BACK, KILLED, SURVIVED
    detection_test_id TEXT,
    diff_unified TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(mutation_run_id) REFERENCES mutation_runs(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mutations_run ON injected_mutations(mutation_run_id);

CREATE TABLE IF NOT EXISTS execution_runs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    target_file TEXT NOT NULL,
    language_id TEXT NOT NULL,
    command_line TEXT NOT NULL,
    working_directory TEXT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER DEFAULT 0,
    exit_code INTEGER,
    stdout_output TEXT,
    stderr_output TEXT,
    status TEXT NOT NULL, -- RUNNING, COMPLETED, TIMED_OUT, CRASHED
    peak_memory_bytes INTEGER DEFAULT 0,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS execution_events (
    id TEXT PRIMARY KEY,
    execution_run_id TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    event_type TEXT NOT NULL, -- FUNCTION_ENTER, FUNCTION_EXIT, VARIABLE_CHANGE, EXCEPTION, STDOUT
    timestamp_offset_ms REAL NOT NULL,
    function_name TEXT,
    file_path TEXT,
    line_number INTEGER,
    variable_name TEXT,
    old_value TEXT,
    new_value TEXT,
    payload_json TEXT,
    FOREIGN KEY(execution_run_id) REFERENCES execution_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exec_events_run ON execution_events(execution_run_id, sequence_order);

CREATE TABLE IF NOT EXISTS test_suites (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    suite_type TEXT NOT NULL, -- AUTOMATIC_SYNTHESIZED, REPRODUCER, REGRESSION, MANUAL
    target_file TEXT NOT NULL,
    language_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY,
    test_suite_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- BOUNDARY, ARITHMETIC, EQUIVALENCE, ERROR_HANDLING
    input_parameters TEXT NOT NULL,
    expected_output TEXT,
    timeout_ms INTEGER DEFAULT 5000,
    FOREIGN KEY(test_suite_id) REFERENCES test_suites(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_results (
    id TEXT PRIMARY KEY,
    test_case_id TEXT NOT NULL,
    execution_run_id TEXT,
    run_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    passed INTEGER NOT NULL,
    actual_output TEXT,
    error_message TEXT,
    duration_ms REAL DEFAULT 0.0,
    FOREIGN KEY(test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    FOREIGN KEY(execution_run_id) REFERENCES execution_runs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fix_history (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    original_code TEXT NOT NULL,
    proposed_code TEXT NOT NULL,
    diff_patch TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    status TEXT NOT NULL, -- PROPOSED, ACCEPTED, REJECTED, ROLLED_BACK
    verification_test_result TEXT, -- PASSED, FAILED, UNTESTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    applied_at DATETIME,
    rolled_back_at DATETIME,
    FOREIGN KEY(issue_id) REFERENCES analysis_issues(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    execution_run_id TEXT,
    file_path TEXT NOT NULL,
    function_name TEXT NOT NULL,
    invocation_count INTEGER DEFAULT 1,
    total_duration_ms REAL DEFAULT 0.0,
    avg_duration_ms REAL DEFAULT 0.0,
    max_duration_ms REAL DEFAULT 0.0,
    memory_delta_bytes INTEGER DEFAULT 0,
    bottleneck_score REAL DEFAULT 0.0,
    is_bottleneck INTEGER DEFAULT 0,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(execution_run_id) REFERENCES execution_runs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS generated_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    analysis_run_id TEXT NOT NULL,
    report_title TEXT NOT NULL,
    health_score REAL NOT NULL,
    summary_markdown TEXT NOT NULL,
    report_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(analysis_run_id) REFERENCES analysis_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS application_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
