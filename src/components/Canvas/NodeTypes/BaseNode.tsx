import { Handle, Position } from '@xyflow/react';
import { useProjectStore } from '../../../stores/projectStore';
import type { VOPLNodeData, VOPLNodeType, PortDefinition } from '../../../types/vopl';

interface BaseNodeProps {
  id: string;
  data: VOPLNodeData;
  selected?: boolean;
  nodeType: VOPLNodeType;
}

const typeConfig: Record<VOPLNodeType, {
  icon: string;
  label: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  headerBg: string;
  accentColor: string;
}> = {
  trigger: {
    icon: '⚡',
    label: 'TRIGGER',
    bgColor: 'bg-gradient-to-b from-amber-50 to-orange-50',
    borderColor: 'border-amber-400',
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    headerBg: 'bg-amber-50/80',
    accentColor: '#f59e0b',
  },
  process: {
    icon: '✨',
    label: 'PROCESS',
    bgColor: 'bg-gradient-to-b from-blue-50 to-indigo-50',
    borderColor: 'border-blue-400',
    iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    headerBg: 'bg-blue-50/80',
    accentColor: '#3b82f6',
  },
  integration: {
    icon: '🔌',
    label: 'INTEGRATION',
    bgColor: 'bg-gradient-to-b from-purple-50 to-violet-50',
    borderColor: 'border-purple-400',
    iconBg: 'bg-gradient-to-br from-purple-400 to-violet-500',
    headerBg: 'bg-purple-50/80',
    accentColor: '#8b5cf6',
  },
  output: {
    icon: '📤',
    label: 'OUTPUT',
    bgColor: 'bg-gradient-to-b from-green-50 to-emerald-50',
    borderColor: 'border-green-400',
    iconBg: 'bg-gradient-to-br from-green-400 to-emerald-500',
    headerBg: 'bg-green-50/80',
    accentColor: '#22c55e',
  },
};

export function BaseNode({ id, data, selected, nodeType }: BaseNodeProps) {
  const { selectNode } = useProjectStore();
  const config = typeConfig[nodeType];

  // Calculate a simple completeness indicator based on filled fields
  const completeness = calculateCompleteness(data);
  const completenessColor = completeness < 50 ? 'bg-red-500' : completeness < 80 ? 'bg-yellow-500' : 'bg-green-500';

  const inputs = data.inputs as PortDefinition[];
  const outputs = data.outputs as PortDefinition[];

  return (
    <div
      className={`
        min-w-[200px] max-w-[240px] rounded-xl border-2
        ${config.bgColor} ${config.borderColor}
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-xl' : 'shadow-lg hover:shadow-xl'}
        transition-all duration-200 cursor-pointer backdrop-blur-sm
      `}
      onDoubleClick={() => selectNode(id)}
    >
      {/* Input handles */}
      {inputs.map((input: PortDefinition, index: number) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={input.name}
          className="!bg-slate-600 !border-white"
          style={{
            top: `${30 + index * 25}%`,
            backgroundColor: config.accentColor,
          }}
          title={`${input.name}: ${input.shape}`}
        />
      ))}

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-[10px] border-b ${config.borderColor} ${config.headerBg}`}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm shadow-sm ${config.iconBg}`}>
          {config.icon}
        </span>
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">
          {config.label}
        </span>
        {/* Completeness indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${completenessColor} shadow-sm`}
            title={`${completeness}% complete`}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        <div className="font-semibold text-gray-800 text-sm truncate leading-tight" title={String(data.name)}>
          {String(data.name)}
        </div>
        <div className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed" title={String(data.intent || '')}>
          {String(data.intent) || 'Describe what triggers this flow...'}
        </div>
      </div>

      {/* Output handles */}
      {outputs.map((output: PortDefinition, index: number) => (
        <Handle
          key={`output-${output.name}`}
          type="source"
          position={Position.Right}
          id={output.name}
          className="!bg-slate-600 !border-white"
          style={{
            top: `${30 + index * 25}%`,
            backgroundColor: config.accentColor,
          }}
          title={`${output.name}: ${output.shape}`}
        />
      ))}
    </div>
  );
}

function calculateCompleteness(data: VOPLNodeData): number {
  let score = 0;
  let total = 0;

  const name = String(data.name || '');
  const intent = String(data.intent || '');
  const behavior = String(data.behavior || '');
  const inputs = data.inputs as PortDefinition[];
  const outputs = data.outputs as PortDefinition[];
  const examples = data.examples as Array<{ input: string; output: string; notes: string }>;

  // Name (10%)
  total += 10;
  if (name && !name.startsWith('New ')) score += 10;

  // Intent (20%)
  total += 20;
  if (intent && intent.length > 20 && !intent.startsWith('Describe')) score += 20;

  // Inputs defined with shapes (15%)
  total += 15;
  if (inputs.length > 0) {
    const definedInputs = inputs.filter((i: PortDefinition) => i.shape && i.shape !== 'unknown');
    score += (definedInputs.length / inputs.length) * 15;
  } else if (outputs.length > 0) {
    // Trigger nodes might not have inputs
    score += 15;
  }

  // Outputs defined with shapes (15%)
  total += 15;
  if (outputs.length > 0) {
    const definedOutputs = outputs.filter((o: PortDefinition) => o.shape && o.shape !== 'unknown');
    score += (definedOutputs.length / outputs.length) * 15;
  } else {
    // Output nodes might not have outputs
    score += 15;
  }

  // Behavior (25%)
  total += 25;
  if (behavior && behavior.length > 50) {
    score += Math.min(25, (behavior.length / 200) * 25);
  }

  // Examples (15%)
  total += 15;
  if (examples.length > 0) {
    const goodExamples = examples.filter((e) =>
      e.input !== '{}' && e.output !== '{}' && e.notes
    );
    score += (goodExamples.length / Math.max(examples.length, 2)) * 15;
  }

  return Math.round((score / total) * 100);
}
