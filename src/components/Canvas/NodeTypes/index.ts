import { TriggerNode } from './TriggerNode';
import { ProcessNode } from './ProcessNode';
import { IntegrationNode } from './IntegrationNode';
import { OutputNode } from './OutputNode';

export const nodeTypes = {
  trigger: TriggerNode,
  process: ProcessNode,
  integration: IntegrationNode,
  output: OutputNode,
};

export { TriggerNode, ProcessNode, IntegrationNode, OutputNode };
