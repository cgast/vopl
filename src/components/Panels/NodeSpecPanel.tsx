import { useCallback, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useProjectStore } from '../../stores/projectStore';
import type { PortDefinition, Example, VOPLNodeData } from '../../types/vopl';

export function NodeSpecPanel() {
  const { project, selectedNodeId, isPanelOpen, selectNode, updateNode, deleteNode } = useProjectStore();

  const selectedNode = useMemo(
    () => project.nodes.find((n) => n.id === selectedNodeId),
    [project.nodes, selectedNodeId]
  );

  const handleClose = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleUpdate = useCallback(
    (data: Partial<VOPLNodeData>) => {
      if (selectedNodeId) {
        updateNode(selectedNodeId, data);
      }
    },
    [selectedNodeId, updateNode]
  );

  const handleDelete = useCallback(() => {
    if (selectedNodeId && confirm('Are you sure you want to delete this node?')) {
      deleteNode(selectedNodeId);
    }
  }, [selectedNodeId, deleteNode]);

  if (!isPanelOpen || !selectedNode) {
    return null;
  }

  const nodeTypeLabels = {
    trigger: 'Trigger',
    process: 'Process',
    integration: 'Integration',
    output: 'Output',
  };

  const nodeTypeColors = {
    trigger: 'from-amber-400 to-orange-500',
    process: 'from-blue-400 to-indigo-500',
    integration: 'from-purple-400 to-violet-500',
    output: 'from-green-400 to-emerald-500',
  };

  const nodeTypeIcons = {
    trigger: '⚡',
    process: '✨',
    integration: '🔌',
    output: '📤',
  };

  return (
    <div className="w-[420px] h-full bg-white/95 backdrop-blur-sm border-l border-gray-200/80 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${nodeTypeColors[selectedNode.type]} flex items-center justify-center shadow-md`}>
            <span className="text-white text-base">
              {nodeTypeIcons[selectedNode.type]}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
              {nodeTypeLabels[selectedNode.type]}
            </span>
            <span className="font-semibold text-gray-800 text-sm leading-tight">{selectedNode.data.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete node"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {/* Name */}
        <Section title="Name">
          <input
            type="text"
            value={selectedNode.data.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors bg-gray-50/50 hover:bg-white"
            placeholder="Component name"
          />
        </Section>

        {/* Intent */}
        <Section title="Intent" description="One sentence describing this node's purpose">
          <textarea
            value={selectedNode.data.intent}
            onChange={(e) => handleUpdate({ intent: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none transition-colors bg-gray-50/50 hover:bg-white"
            rows={2}
            placeholder="What is this component's purpose?"
          />
        </Section>

        {/* Inputs */}
        <Section title="Inputs" description="Data this node receives">
          <PortList
            ports={selectedNode.data.inputs}
            onChange={(inputs) => handleUpdate({ inputs })}
            portType="input"
          />
        </Section>

        {/* Outputs */}
        <Section title="Outputs" description="Data this node produces">
          <PortList
            ports={selectedNode.data.outputs}
            onChange={(outputs) => handleUpdate({ outputs })}
            portType="output"
          />
        </Section>

        {/* Behavior */}
        <Section title="Behavior" description="Detailed description of what this node does">
          <div data-color-mode="light">
            <MDEditor
              value={selectedNode.data.behavior}
              onChange={(value) => handleUpdate({ behavior: value || '' })}
              preview="edit"
              height={200}
              textareaProps={{
                placeholder: 'Describe the behavior, conditions, error handling...',
              }}
            />
          </div>
        </Section>

        {/* Examples */}
        <Section title="Examples" description="Input/output examples to clarify behavior">
          <ExamplesTable
            examples={selectedNode.data.examples}
            onChange={(examples) => handleUpdate({ examples })}
          />
        </Section>

        {/* Constraints */}
        <Section title="Constraints" description="Technical limitations and requirements">
          <ConstraintsList
            constraints={selectedNode.data.constraints}
            onChange={(constraints) => handleUpdate({ constraints })}
          />
        </Section>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface PortListProps {
  ports: PortDefinition[];
  onChange: (ports: PortDefinition[]) => void;
  portType: 'input' | 'output';
}

function PortList({ ports, onChange, portType }: PortListProps) {
  const addPort = () => {
    onChange([
      ...ports,
      { name: '', description: '', shape: '' },
    ]);
  };

  const updatePort = (index: number, updates: Partial<PortDefinition>) => {
    const newPorts = [...ports];
    newPorts[index] = { ...newPorts[index], ...updates };
    onChange(newPorts);
  };

  const removePort = (index: number) => {
    onChange(ports.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2.5">
      {ports.map((port, index) => (
        <div key={index} className="flex gap-2 items-start p-3 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={port.name}
              onChange={(e) => updatePort(index, { name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              placeholder="Port name"
            />
            <input
              type="text"
              value={port.description}
              onChange={(e) => updatePort(index, { description: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              placeholder="Description"
            />
            <input
              type="text"
              value={port.shape}
              onChange={(e) => updatePort(index, { shape: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              placeholder="Type/shape (e.g., { id: string, name: string })"
            />
          </div>
          <button
            onClick={() => removePort(index)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove port"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={addPort}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add {portType}
      </button>
    </div>
  );
}

interface ExamplesTableProps {
  examples: Example[];
  onChange: (examples: Example[]) => void;
}

function ExamplesTable({ examples, onChange }: ExamplesTableProps) {
  const addExample = () => {
    onChange([...examples, { input: '', output: '', notes: '' }]);
  };

  const updateExample = (index: number, updates: Partial<Example>) => {
    const newExamples = [...examples];
    newExamples[index] = { ...newExamples[index], ...updates };
    onChange(newExamples);
  };

  const removeExample = (index: number) => {
    onChange(examples.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2.5">
      {examples.map((example, index) => (
        <div key={index} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Input</label>
              <textarea
                value={example.input}
                onChange={(e) => updateExample(index, { input: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none bg-white"
                rows={2}
                placeholder='{ "key": "value" }'
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Output</label>
              <textarea
                value={example.output}
                onChange={(e) => updateExample(index, { output: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm font-mono border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none bg-white"
                rows={2}
                placeholder='{ "result": "..." }'
              />
            </div>
            <button
              onClick={() => removeExample(index)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start mt-5"
              title="Remove example"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Notes</label>
            <input
              type="text"
              value={example.notes}
              onChange={(e) => updateExample(index, { notes: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              placeholder="Happy path, edge case, error scenario..."
            />
          </div>
        </div>
      ))}
      <button
        onClick={addExample}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add example
      </button>
    </div>
  );
}

interface ConstraintsListProps {
  constraints: string[];
  onChange: (constraints: string[]) => void;
}

function ConstraintsList({ constraints, onChange }: ConstraintsListProps) {
  const addConstraint = () => {
    onChange([...constraints, '']);
  };

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...constraints];
    newConstraints[index] = value;
    onChange(newConstraints);
  };

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2.5">
      {constraints.map((constraint, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="text"
            value={constraint}
            onChange={(e) => updateConstraint(index, e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 bg-gray-50/50 hover:bg-white transition-colors"
            placeholder="Technical constraint or requirement"
          />
          <button
            onClick={() => removeConstraint(index)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove constraint"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={addConstraint}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add constraint
      </button>
    </div>
  );
}
