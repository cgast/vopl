import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type ReactFlowInstance,
  type Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '../../stores/projectStore';
import { nodeTypes } from './NodeTypes';
import { edgeTypes } from './EdgeTypes';
import type { VOPLNodeType, VOPLNode, VOPLEdge } from '../../types/vopl';

const nodeTypeColors: Record<VOPLNodeType, string> = {
  trigger: '#fbbf24',
  process: '#3b82f6',
  integration: '#a855f7',
  output: '#22c55e',
};

export function Canvas() {
  const {
    project,
    onNodesChange,
    onEdgesChange,
    addEdge,
    addNode,
    selectNode,
    deleteNode,
    deleteEdge,
  } = useProjectStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      addEdge(connection);
    },
    [addEdge]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/vopl-node') as VOPLNodeType;
      if (!type || !reactFlowInstance.current || !reactFlowWrapper.current) {
        return;
      }

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(type, position);
    },
    [addNode]
  );

  const handleAddNode = useCallback(
    (type: VOPLNodeType) => {
      // Add node at center of visible area
      if (reactFlowInstance.current) {
        const { x, y, zoom } = reactFlowInstance.current.getViewport();
        const centerX = (-x + 400) / zoom;
        const centerY = (-y + 300) / zoom;
        addNode(type, { x: centerX, y: centerY });
      } else {
        addNode(type, { x: 200, y: 200 });
      }
    },
    [addNode]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete selected nodes/edges
        const selectedNodes = project.nodes.filter((n) => n.selected);
        const selectedEdges = project.edges.filter((e) => e.selected);

        selectedNodes.forEach((node) => deleteNode(node.id));
        selectedEdges.forEach((edge) => deleteEdge(edge.id));
      }
    },
    [project.nodes, project.edges, deleteNode, deleteEdge]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow<VOPLNode, VOPLEdge>
        nodes={project.nodes}
        edges={project.edges}
        onNodesChange={onNodesChange as any}
        onEdgesChange={onEdgesChange as any}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={(instance) => {
          reactFlowInstance.current = instance as any;
        }}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={null} // Handle delete ourselves
        className="bg-gray-50"
      >
        <Background color="#e2e8f0" gap={15} />
        <Controls className="!bg-white !border-gray-200 !shadow-md" />
        <MiniMap
          nodeColor={(node) => nodeTypeColors[(node.type as VOPLNodeType) || 'process'] || '#888'}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white !border-gray-200 !shadow-md"
        />

        {/* Node toolbar */}
        <Panel position="top-left" className="flex gap-2 m-4">
          <NodeToolbarButton
            type="trigger"
            label="Trigger"
            icon="⚡"
            onClick={() => handleAddNode('trigger')}
          />
          <NodeToolbarButton
            type="process"
            label="Process"
            icon="⚙️"
            onClick={() => handleAddNode('process')}
          />
          <NodeToolbarButton
            type="integration"
            label="Integration"
            icon="🔌"
            onClick={() => handleAddNode('integration')}
          />
          <NodeToolbarButton
            type="output"
            label="Output"
            icon="📤"
            onClick={() => handleAddNode('output')}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
}

interface NodeToolbarButtonProps {
  type: VOPLNodeType;
  label: string;
  icon: string;
  onClick: () => void;
}

function NodeToolbarButton({ type, label, icon, onClick }: NodeToolbarButtonProps) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/vopl-node', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const bgColors: Record<VOPLNodeType, string> = {
    trigger: 'bg-amber-100 hover:bg-amber-200 border-amber-300',
    process: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
    integration: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
    output: 'bg-green-100 hover:bg-green-200 border-green-300',
  };

  return (
    <button
      onClick={onClick}
      onDragStart={onDragStart}
      draggable
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 shadow-sm
        text-sm font-medium text-gray-700 cursor-grab active:cursor-grabbing
        transition-colors ${bgColors[type]}
      `}
      title={`Add ${label} node (or drag to canvas)`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
