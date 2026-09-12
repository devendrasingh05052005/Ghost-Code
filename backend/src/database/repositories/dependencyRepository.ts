import { queryAll, executeRun } from '../db';
import { DependencyNode, DependencyEdge, DependencyGraphData } from '../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class DependencyRepository {
  async saveGraph(
    projectId: string,
    nodes: Omit<DependencyNode, 'id' | 'projectId'>[],
    edges: Omit<DependencyEdge, 'id' | 'projectId'>[]
  ): Promise<DependencyGraphData> {
    await executeRun(`DELETE FROM dependency_edges WHERE project_id = ?`, [projectId]);
    await executeRun(`DELETE FROM dependency_nodes WHERE project_id = ?`, [projectId]);

    const nodeMap = new Map<string, string>();
    const savedNodes: DependencyNode[] = [];

    for (const n of nodes) {
      const id = uuidv4();
      nodeMap.set(n.qualifiedName, id);
      await executeRun(
        `INSERT INTO dependency_nodes (id, project_id, node_type, name, qualified_name, file_path, line_start, line_end, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, projectId, n.nodeType, n.name, n.qualifiedName, n.filePath, n.lineStart || null, n.lineEnd || null, JSON.stringify(n.metadata || {})]
      );
      savedNodes.push({ ...n, id, projectId });
    }

    const savedEdges: DependencyEdge[] = [];
    let circularCount = 0;

    for (const e of edges) {
      const sourceId = nodeMap.get(e.sourceNodeId) || e.sourceNodeId;
      const targetId = nodeMap.get(e.targetNodeId) || e.targetNodeId;

      if (!sourceId || !targetId) continue;

      const edgeId = uuidv4();
      if (e.isCircular) circularCount++;

      await executeRun(
        `INSERT INTO dependency_edges (id, project_id, source_node_id, target_node_id, edge_type, is_circular, confidence, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [edgeId, projectId, sourceId, targetId, e.edgeType, e.isCircular ? 1 : 0, e.confidence, e.weight]
      );

      savedEdges.push({
        id: edgeId,
        projectId,
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        edgeType: e.edgeType,
        isCircular: e.isCircular,
        confidence: e.confidence,
        weight: e.weight
      });
    }

    return {
      nodes: savedNodes,
      edges: savedEdges,
      circularCount
    };
  }

  async getGraph(projectId: string): Promise<DependencyGraphData> {
    const rawNodes = await queryAll<any>(`SELECT * FROM dependency_nodes WHERE project_id = ?`, [projectId]);
    const rawEdges = await queryAll<any>(`SELECT * FROM dependency_edges WHERE project_id = ?`, [projectId]);

    const nodes: DependencyNode[] = rawNodes.map((n) => ({
      id: n.id,
      projectId: n.project_id,
      nodeType: n.node_type,
      name: n.name,
      qualifiedName: n.qualified_name,
      filePath: n.file_path,
      lineStart: n.line_start,
      lineEnd: n.line_end,
      metadata: n.metadata_json ? JSON.parse(n.metadata_json) : undefined
    }));

    let circularCount = 0;
    const edges: DependencyEdge[] = rawEdges.map((e) => {
      const isCirc = Boolean(e.is_circular);
      if (isCirc) circularCount++;
      return {
        id: e.id,
        projectId: e.project_id,
        sourceNodeId: e.source_node_id,
        targetNodeId: e.target_node_id,
        edgeType: e.edge_type,
        isCircular: isCirc,
        confidence: e.confidence,
        weight: e.weight
      };
    });

    return { nodes, edges, circularCount };
  }
}

export const dependencyRepository = new DependencyRepository();
