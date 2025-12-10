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
}> = {
  trigger: {
    icon: '⚡',
    label: 'Trigger',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    iconBg: 'bg-amber-400',
  },
  process: {
    icon: '⚙️',
    label: 'Process',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    iconBg: 'bg-blue-400',
  },
  integration: {
    icon: '🔌',
    label: 'Integration',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-400',
    iconBg: 'bg-purple-400',
  },
  output: {
    icon: '📤',
    label: 'Output',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    iconBg: 'bg-green-400',
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
        min-w-[180px] max-w-[220px] rounded-lg border-2 shadow-md
        ${config.bgColor} ${config.borderColor}
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
        transition-shadow cursor-pointer
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
          className="!w-3 !h-3 !bg-gray-600 !border-2 !border-white"
          style={{ top: `${30 + index * 25}%` }}
          title={`${input.name}: ${input.shape}`}
        />
      ))}

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${config.borderColor}`}>
        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-sm ${config.iconBg}`}>
          {config.icon}
        </span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {config.label}
        </span>
        {/* Completeness indicator */}
        <div className="ml-auto flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${completenessColor}`} title={`${completeness}% complete`} />
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <div className="font-semibold text-gray-900 text-sm truncate" title={String(data.name)}>
          {String(data.name)}
        </div>
        <div className="text-xs text-gray-600 mt-1 line-clamp-2" title={String(data.intent || '')}>
          {String(data.intent) || 'No intent specified...'}
        </div>
      </div>

      {/* Output handles */}
      {outputs.map((output: PortDefinition, index: number) => (
        <Handle
          key={`output-${output.name}`}
          type="source"
          position={Position.Right}
          id={output.name}
          className="!w-3 !h-3 !bg-gray-600 !border-2 !border-white"
          style={{ top: `${30 + index * 25}%` }}
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
