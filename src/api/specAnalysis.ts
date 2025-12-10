import Anthropic from '@anthropic-ai/sdk';
import type { VOPLProject, SpecScore, SpecIssue } from '../types/vopl';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function buildAnalysisPrompt(project: VOPLProject): string {
  const systemContextStr = `
## System Context

**Environment:** ${project.systemContext.environment || '(not specified)'}

**Constraints:** ${project.systemContext.constraints || '(not specified)'}

**Infrastructure:** ${project.systemContext.infrastructure || '(not specified)'}

**External Dependencies:** ${project.systemContext.dependencies || '(not specified)'}

**Security Requirements:** ${project.systemContext.security || '(not specified)'}

**Non-Functional Requirements:** ${project.systemContext.nonFunctional || '(not specified)'}
`;

  const nodesStr = project.nodes.map((node) => `
### ${node.data.name} (${node.type})
**ID:** ${node.id}
**Intent:** ${node.data.intent || '(not specified)'}

**Inputs:**
${node.data.inputs.length > 0
  ? node.data.inputs.map(i => `- \`${i.name}\`: ${i.description} (${i.shape || 'untyped'})`).join('\n')
  : '(none)'}

**Outputs:**
${node.data.outputs.length > 0
  ? node.data.outputs.map(o => `- \`${o.name}\`: ${o.description} (${o.shape || 'untyped'})`).join('\n')
  : '(none)'}

**Behavior:**
${node.data.behavior || '(not specified)'}

**Examples:**
${node.data.examples.length > 0
  ? node.data.examples.map(e => `- Input: ${e.input}, Output: ${e.output}, Notes: ${e.notes}`).join('\n')
  : '(none)'}

**Constraints:**
${node.data.constraints.length > 0
  ? node.data.constraints.map(c => `- ${c}`).join('\n')
  : '(none)'}
`).join('\n---\n');

  const edgesStr = project.edges.map((edge) => {
    const sourceNode = project.nodes.find(n => n.id === edge.source);
    const targetNode = project.nodes.find(n => n.id === edge.target);
    return `- ${sourceNode?.data.name || edge.source}.${edge.sourceHandle || 'output'} → ${targetNode?.data.name || edge.target}.${edge.targetHandle || 'input'}${edge.label ? ` [${edge.label}]` : ''}`;
  }).join('\n');

  return `You are evaluating a software specification for completeness, clarity, and implementability.

Given the following VOPL (Vibe-Oriented Programming Language) specification, analyze it across four dimensions and provide a score from 0-100 for each.

${systemContextStr}

## Component Graph

**Nodes:** ${project.nodes.length}
**Edges:** ${project.edges.length}

**Connections:**
${edgesStr || '(no connections)'}

## Node Specifications
${nodesStr || '(no nodes defined)'}

---

Evaluate the specification and respond with JSON only (no markdown code blocks, just raw JSON):

{
  "overall": <weighted average 0-100>,
  "completeness": {
    "score": <0-100>,
    "details": ["list of missing elements or issues"]
  },
  "ambiguity": {
    "score": <0-100 where 100 means NO ambiguity>,
    "details": ["list of ambiguous elements with suggestions"]
  },
  "consistency": {
    "score": <0-100>,
    "details": ["list of conflicts or mismatches between nodes"]
  },
  "groundedness": {
    "score": <0-100>,
    "details": ["list of technical concerns or unrealistic elements"]
  },
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "dimension": "completeness" | "ambiguity" | "consistency" | "groundedness",
      "nodeId": "<node id if applicable or null>",
      "field": "<field name if applicable or null>",
      "message": "<specific issue description>"
    }
  ],
  "suggestions": ["top 3-5 actionable improvements to increase the score"]
}

Scoring guidelines:
- **Completeness**: Are all nodes specified? Do all edges have defined data shapes? Are inputs/outputs matched? Is system context filled in?
- **Ambiguity** (inverted - 100 = clear, 0 = ambiguous): Could behavior descriptions be interpreted multiple ways? Are edge cases covered?
- **Consistency**: Do connected nodes agree on data shapes? Are there contradictions in the spec?
- **Groundedness**: Are technical constraints realistic? Do integrations make sense? Is behavior implementable?

Be critical but constructive. The goal is to help the user improve their specification until any LLM would produce identical implementations.`;
}

export async function analyzeSpec(project: VOPLProject): Promise<SpecScore> {
  // If no API key, return a mock score with helpful feedback
  if (!ANTHROPIC_API_KEY) {
    return getMockScore(project);
  }

  try {
    const client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true, // For prototype purposes
    });

    const prompt = buildAnalysisPrompt(project);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = JSON.parse(content.text);

    return {
      overall: result.overall,
      completeness: {
        score: result.completeness.score,
        details: result.completeness.details || [],
      },
      ambiguity: {
        score: result.ambiguity.score,
        details: result.ambiguity.details || [],
      },
      consistency: {
        score: result.consistency.score,
        details: result.consistency.details || [],
      },
      groundedness: {
        score: result.groundedness.score,
        details: result.groundedness.details || [],
      },
      issues: (result.issues || []).map((issue: any) => ({
        severity: issue.severity || 'warning',
        dimension: issue.dimension || 'completeness',
        nodeId: issue.nodeId || undefined,
        field: issue.field || undefined,
        message: issue.message || 'Unknown issue',
      })),
      suggestions: result.suggestions || [],
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Spec analysis failed:', error);
    // Return mock score on error
    return getMockScore(project);
  }
}

function getMockScore(project: VOPLProject): SpecScore {
  // Calculate a basic score based on what's filled in
  const issues: SpecIssue[] = [];
  let completenessScore = 0;
  let ambiguityScore = 50;
  let consistencyScore = 80;
  let groundednessScore = 60;

  // System context completeness
  const contextFields = Object.values(project.systemContext);
  const filledContext = contextFields.filter(v => v && v.length > 10).length;
  completenessScore += (filledContext / contextFields.length) * 20;

  if (filledContext < 3) {
    issues.push({
      severity: 'warning',
      dimension: 'completeness',
      message: 'System context is incomplete. Fill in environment, infrastructure, and dependencies.',
    });
  }

  // Node completeness
  if (project.nodes.length === 0) {
    completenessScore = 10;
    issues.push({
      severity: 'error',
      dimension: 'completeness',
      message: 'No nodes defined. Add at least one trigger and one output node.',
    });
  } else {
    const nodeScores = project.nodes.map((node) => {
      let score = 0;
      if (node.data.name && !node.data.name.startsWith('New ')) score += 10;
      if (node.data.intent && node.data.intent.length > 20) score += 20;
      if (node.data.behavior && node.data.behavior.length > 50) score += 30;
      if (node.data.inputs.some(i => i.shape && i.shape !== 'unknown')) score += 15;
      if (node.data.outputs.some(o => o.shape && o.shape !== 'unknown')) score += 15;
      if (node.data.examples.length > 0) score += 10;

      if (node.data.intent.length < 20 || node.data.intent.startsWith('Describe')) {
        issues.push({
          severity: 'warning',
          dimension: 'ambiguity',
          nodeId: node.id,
          field: 'intent',
          message: `"${node.data.name}" needs a clearer intent description.`,
        });
      }

      return score;
    });

    completenessScore += (nodeScores.reduce((a, b) => a + b, 0) / (project.nodes.length * 100)) * 80;
  }

  // Edge consistency check
  if (project.edges.length > 0) {
    const unconnectedNodes = project.nodes.filter((node) => {
      const hasIncoming = project.edges.some(e => e.target === node.id);
      const hasOutgoing = project.edges.some(e => e.source === node.id);
      return !hasIncoming && !hasOutgoing;
    });

    if (unconnectedNodes.length > 0) {
      consistencyScore -= unconnectedNodes.length * 10;
      unconnectedNodes.forEach((node) => {
        issues.push({
          severity: 'warning',
          dimension: 'consistency',
          nodeId: node.id,
          message: `"${node.data.name}" is not connected to any other node.`,
        });
      });
    }
  }

  // Check for trigger and output nodes
  const hasTrigger = project.nodes.some(n => n.type === 'trigger');
  const hasOutput = project.nodes.some(n => n.type === 'output');

  if (!hasTrigger && project.nodes.length > 0) {
    issues.push({
      severity: 'info',
      dimension: 'completeness',
      message: 'Consider adding a Trigger node to define how the flow starts.',
    });
  }

  if (!hasOutput && project.nodes.length > 0) {
    issues.push({
      severity: 'info',
      dimension: 'completeness',
      message: 'Consider adding an Output node to define the flow result.',
    });
  }

  const suggestions = [
    'Add detailed behavior descriptions with error handling to each node.',
    'Define explicit data shapes (types) for all inputs and outputs.',
    'Include examples for edge cases, not just happy paths.',
    'Fill in the System Context to provide implementation context.',
    'Ensure all nodes are connected in the data flow.',
  ].slice(0, 3);

  const overall = Math.round(
    completenessScore * 0.35 +
    ambiguityScore * 0.25 +
    consistencyScore * 0.25 +
    groundednessScore * 0.15
  );

  return {
    overall,
    completeness: { score: Math.round(completenessScore), details: [] },
    ambiguity: { score: ambiguityScore, details: [] },
    consistency: { score: consistencyScore, details: [] },
    groundedness: { score: groundednessScore, details: [] },
    issues,
    suggestions,
    lastUpdated: Date.now(),
  };
}
