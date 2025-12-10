import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { Position } from '@xyflow/react';

interface DataEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  label?: string;
  data?: {
    dataShape?: string;
  };
  selected?: boolean;
}

export function DataEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  selected,
}: DataEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#94a3b8',
          strokeWidth: selected ? 2 : 1.5,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-600 shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      {data?.dataShape && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 20}px)`,
              pointerEvents: 'all',
            }}
            className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500 font-mono"
          >
            {data.dataShape}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
