import React, { useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ghostApi, ApiProject } from '../services/api';
import { GitFork, AlertTriangle, RefreshCw, Code2, ShieldAlert, Activity, CheckCircle, ArrowRight } from 'lucide-react';

interface DependencyPageProps {
  selectedProject: ApiProject | null;
  onNavigate: (page: any) => void;
}

export const DependencyPage: React.FC<DependencyPageProps> = ({ selectedProject, onNavigate }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [circularCount, setCircularCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Impact Intelligence (Blast Radius) State
  const [impactLoading, setImpactLoading] = useState<boolean>(false);
  const [blastRadius, setBlastRadius] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'impact'>('impact');

  useEffect(() => {
    if (selectedProject) {
      loadGraph();
      loadImpactAnalysis('');
    }
  }, [selectedProject]);

  const loadGraph = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const res = await ghostApi.getDependencies(selectedProject.id);
      if (res.data.success && res.data.data) {
        const rawNodes = res.data.data.nodes;
        const rawEdges = res.data.data.edges;
        setCircularCount(res.data.data.circularCount || 0);

        const flowNodes: Node[] = rawNodes.map((n: any, idx: number) => {
          const row = Math.floor(idx / 5);
          const col = idx % 5;
          return {
            id: n.id,
            data: { label: `${n.nodeType}: ${n.name}`, raw: n },
            position: { x: col * 220 + 50, y: row * 120 + 50 },
            style: {
              background: n.nodeType === 'FILE' ? '#1e293b' : n.nodeType === 'MODULE' ? '#0f766e' : '#0369a1',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace',
              width: 180,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            }
          };
        });

        const flowEdges: Edge[] = rawEdges.map((e: any) => ({
          id: e.id,
          source: e.sourceNodeId,
          target: e.targetNodeId,
          animated: Boolean(e.isCircular),
          label: e.edgeType,
          style: {
            stroke: e.isCircular ? '#f43f5e' : '#06b6d4',
            strokeWidth: e.isCircular ? 2.5 : 1.5
          }
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadImpactAnalysis = async (target: string) => {
    if (!selectedProject) return;
    setImpactLoading(true);
    try {
      const res = await ghostApi.getImpactAnalysis(selectedProject.id, target);
      if (res.data.success) {
        setBlastRadius(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching impact analysis:', err);
    } finally {
      setImpactLoading(false);
    }
  };

  const onNodesChange = (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds));

  const onNodeClick = (_: any, node: Node) => {
    const raw = (node.data as any).raw;
    setSelectedNode(raw);
    loadImpactAnalysis(raw?.filePath || raw?.name || '');
  };

  if (!selectedProject) {
    return (
      <div className="p-12 text-center text-slate-400">
        <GitFork className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Please select an active project to view the Dependency Explorer.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-charcoal-950 overflow-hidden font-sans">
      {/* Top Toolbar */}
      <div className="h-12 bg-charcoal-900 border-b border-charcoal-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">
            Project Impact Intelligence & Dependency Graph
          </h3>

          {circularCount > 0 && (
            <span className="flex items-center space-x-1 text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{circularCount} Circular Cycles Detected</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              loadGraph();
              loadImpactAnalysis(selectedNode ? (selectedNode.filePath || selectedNode.name) : '');
            }}
            className="p-1.5 rounded bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 transition-colors cursor-pointer"
            title="Reload Graph"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Flow Canvas with Side Impact Intelligence Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#1e293b" gap={20} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Project Impact Intelligence & Node Inspector Drawer */}
        <div className="w-96 bg-charcoal-900 border-l border-charcoal-800 flex flex-col justify-between shrink-0 font-mono text-xs z-10 shadow-2xl overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Drawer Header Tabs */}
            <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('impact')}
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors ${activeTab === 'impact' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Impact Intelligence
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors ${activeTab === 'details' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Node Details
                </button>
              </div>
            </div>

            {activeTab === 'impact' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Target Under Analysis</span>
                  <span className="text-xs text-cyan-400 font-bold truncate max-w-[150px]">
                    {blastRadius ? blastRadius.targetSymbolOrFile : 'Project Root'}
                  </span>
                </div>

                {/* Blast Radius Risk Badge & Gauge */}
                {blastRadius && (
                  <div className="p-3.5 rounded-lg bg-charcoal-950 border border-charcoal-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <ShieldAlert className={`w-4 h-4 ${blastRadius.riskCategory === 'CRITICAL' ? 'text-rose-400' : blastRadius.riskCategory === 'HIGH' ? 'text-amber-400' : blastRadius.riskCategory === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'}`} />
                        <span className="text-xs font-bold text-white uppercase">Blast Radius Risk</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${blastRadius.riskCategory === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : blastRadius.riskCategory === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : blastRadius.riskCategory === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                        {blastRadius.riskCategory} ({blastRadius.blastRadiusScore}/100)
                      </span>
                    </div>

                    <div className="w-full bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${blastRadius.riskCategory === 'CRITICAL' ? 'bg-rose-500' : blastRadius.riskCategory === 'HIGH' ? 'bg-amber-500' : blastRadius.riskCategory === 'MEDIUM' ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        style={{ width: `${blastRadius.blastRadiusScore}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {blastRadius.summary}
                    </p>
                  </div>
                )}

                {/* Impact Metrics Summary */}
                {blastRadius && (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded bg-charcoal-950 border border-charcoal-800">
                      <span className="text-xs text-slate-500 uppercase">Direct Dependents</span>
                      <p className="text-sm font-bold text-cyan-400 mt-0.5">{blastRadius.directDependentsCount}</p>
                    </div>
                    <div className="p-2.5 rounded bg-charcoal-950 border border-charcoal-800">
                      <span className="text-xs text-slate-500 uppercase">Transitive Ripple</span>
                      <p className="text-sm font-bold text-amber-400 mt-0.5">{blastRadius.transitiveDependentsCount}</p>
                    </div>
                  </div>
                )}

                {/* Ripple Effect Cascade Tree */}
                {blastRadius && blastRadius.affectedNodes && blastRadius.affectedNodes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Downstream Affected Modules ({blastRadius.affectedNodes.length})</span>
                    </span>
                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                      {blastRadius.affectedNodes.map((node: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-charcoal-950 border border-charcoal-800 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="text-slate-500">L{node.depth}</span>
                            <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="text-slate-200 font-semibold truncate">{node.name}</span>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold shrink-0 ${node.impactType === 'DIRECT' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                            {node.impactType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Test Suites to Rerun */}
                {blastRadius && blastRadius.recommendedTestsToRerun && (
                  <div className="p-3 rounded bg-charcoal-950 border border-charcoal-800 space-y-1.5">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Recommended Tests to Rerun</span>
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {blastRadius.recommendedTestsToRerun.slice(0, 3).map((test: string, idx: number) => (
                        <li key={idx} className="truncate">{test}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && selectedNode && (
              <div className="space-y-3.5">
                <div>
                  <span className="text-xs text-slate-500 uppercase">Component Name</span>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">{selectedNode.name}</p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase">Construct Type</span>
                  <p className="text-xs text-cyan-400 mt-0.5 font-bold">{selectedNode.nodeType}</p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase">File Location</span>
                  <p className="text-xs text-slate-300 mt-0.5 break-all">{selectedNode.filePath}</p>
                </div>

                {selectedNode.lineStart && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Line Span</span>
                    <p className="text-xs text-slate-300 mt-0.5">Lines {selectedNode.lineStart} - {selectedNode.lineEnd || 'EOF'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-charcoal-800">
            <button
              onClick={() => onNavigate('workspace')}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Jump to Source in Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
