import type { Node, Edge } from '@xyflow/react';

export type VOPLNodeType = 'trigger' | 'process' | 'integration' | 'output';

export interface PortDefinition {
  name: string;
  description: string;
  shape: string; // TypeScript-like type notation or JSON schema
}

export interface Example {
  input: string;  // JSON string
  output: string; // JSON string
  notes: string;
}

export interface VOPLNodeData extends Record<string, unknown> {
  name: string;
  intent: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  behavior: string;
  examples: Example[];
  constraints: string[];
  completeness?: number; // 0-100 individual node completeness
}

export type VOPLNode = Node<VOPLNodeData, VOPLNodeType>;

export interface VOPLEdgeData extends Record<string, unknown> {
  dataShape?: string; // type of data being passed
}

export type VOPLEdge = Edge<VOPLEdgeData>;

export interface SystemContext {
  environment: string;
  constraints: string;
  infrastructure: string;
  dependencies: string;
  security: string;
  nonFunctional: string;
}

export interface SpecIssue {
  severity: 'error' | 'warning' | 'info';
  dimension: 'completeness' | 'ambiguity' | 'consistency' | 'groundedness';
  nodeId?: string;
  edgeId?: string;
  field?: string;
  message: string;
}

export interface DimensionScore {
  score: number;
  details: string[];
}

export interface SpecScore {
  overall: number;
  completeness: DimensionScore;
  ambiguity: DimensionScore;
  consistency: DimensionScore;
  groundedness: DimensionScore;
  issues: SpecIssue[];
  suggestions: string[];
  lastUpdated: number;
}

export interface VOPLProject {
  id: string;
  name: string;
  systemContext: SystemContext;
  nodes: VOPLNode[];
  edges: VOPLEdge[];
  specScore?: SpecScore;
  lastModified: number;
}

// Default templates for new nodes
export const defaultNodeData: Record<VOPLNodeType, VOPLNodeData> = {
  trigger: {
    name: 'New Trigger',
    intent: 'Describe what triggers this flow...',
    inputs: [],
    outputs: [{ name: 'payload', description: 'Output data from trigger', shape: 'unknown' }],
    behavior: `## Trigger Type\n[HTTP endpoint / Cron schedule / Event listener / Manual trigger]\n\n## Details\nDescribe the trigger conditions...`,
    examples: [{ input: '{}', output: '{}', notes: 'Example scenario' }],
    constraints: [],
  },
  process: {
    name: 'New Process',
    intent: 'Describe the processing logic...',
    inputs: [{ name: 'input', description: 'Input data to process', shape: 'unknown' }],
    outputs: [{ name: 'result', description: 'Processed output', shape: 'unknown' }],
    behavior: `## Logic\nDescribe what this process does...\n\n## Error Handling\nHow should errors be handled?`,
    examples: [{ input: '{}', output: '{}', notes: 'Example transformation' }],
    constraints: [],
  },
  integration: {
    name: 'New Integration',
    intent: 'Describe the external service interaction...',
    inputs: [{ name: 'request', description: 'Data to send to service', shape: 'unknown' }],
    outputs: [{ name: 'response', description: 'Response from service', shape: 'unknown' }],
    behavior: `## Service\n[Database / API / Cache / Message Queue / etc.]\n\n## Operation\nDescribe the operation (read/write/call)...\n\n## Configuration\nConnection details shape...`,
    examples: [{ input: '{}', output: '{}', notes: 'Example interaction' }],
    constraints: [],
  },
  output: {
    name: 'New Output',
    intent: 'Describe the output/response...',
    inputs: [{ name: 'data', description: 'Data to output', shape: 'unknown' }],
    outputs: [],
    behavior: `## Output Type\n[HTTP response / File / Notification / etc.]\n\n## Format\nDescribe the output format...`,
    examples: [{ input: '{}', output: '{}', notes: 'Example output' }],
    constraints: [],
  },
};

export const defaultSystemContext: SystemContext = {
  environment: '',
  constraints: '',
  infrastructure: '',
  dependencies: '',
  security: '',
  nonFunctional: '',
};
