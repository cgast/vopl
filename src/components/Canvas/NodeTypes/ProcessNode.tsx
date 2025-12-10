import { BaseNode } from './BaseNode';
import type { VOPLNodeData } from '../../../types/vopl';

interface NodeProps {
  id: string;
  data: VOPLNodeData;
  selected?: boolean;
}

export function ProcessNode(props: NodeProps) {
  return <BaseNode {...props} nodeType="process" />;
}
