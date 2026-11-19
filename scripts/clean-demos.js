const { getDatabase } = require('../backend/dist/backend/src/database/db');
const db = getDatabase();

db.serialize(() => {
  const filter = "WHERE root_path LIKE '%examples%' OR name = 'test_project'";
  db.run(`DELETE FROM analysis_issues WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM analysis_runs WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM project_files WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM project_languages WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM generated_reports WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM dependency_nodes WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM dependency_edges WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM injected_mutations WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM mutation_runs WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM test_suites WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM fix_history WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM execution_runs WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM performance_metrics WHERE project_id IN (SELECT id FROM projects ${filter})`);
  db.run(`DELETE FROM projects ${filter}`, function(err) {
    if (err) console.error('Error:', err);
    else console.log('✓ Successfully purged default demo projects. Deleted count:', this.changes);
  });
});
