# VOPL – Vibe-Oriented Programming Language Prototype

A visual specification editor for intent-based programming, where you define *what* software should do rather than *how* to implement it.

## The Idea

This prototype explores a concept articulated by Stephen Ramsay in [If You're Going to Vibe Code, Why Not Do It in C?](https://stephenramsay.net/posts/vibe-coding.html): if AI is increasingly writing our code, perhaps we need new tools optimized for human-AI collaboration rather than human-compiler interaction.

Traditional programming languages were designed for humans to express ideas to machines. But in the age of vibe coding, we're really expressing ideas to *another intelligence* that then writes the machine code. VOPL asks: what if we built tools specifically for that workflow?

This prototype implements a **visual specification editor** where you:

1. Build a graph of components describing your system
2. Specify each component's behavior in semi-structured markdown
3. Receive real-time AI feedback on specification quality
4. Refine until ambiguity approaches zero

The hypothesis: at 100% spec quality, any LLM would produce identical implementations.

## Core Features

### Graph Canvas
A ReactFlow-based canvas for building system architecture visually. Four node types represent different concerns:

- **Trigger** – Entry points (HTTP endpoints, cron jobs, event listeners)
- **Process** – Business logic, transformations, decisions
- **Integration** – External services, databases, APIs
- **Output** – Results, responses, side effects

Nodes connect via edges that represent data flow, with support for conditional branching.

### Node Specification Panel
Each node contains a structured specification:

- **Intent** – One sentence describing the node's purpose
- **Inputs/Outputs** – Port definitions with types and descriptions
- **Behavior** – Prose description of what the node does
- **Examples** – Input/output pairs demonstrating expected behavior
- **Constraints** – Technical limitations and requirements

### System Context
Global configuration for system-wide concerns: environment, infrastructure, dependencies, security requirements, and non-functional requirements.

### Spec-o-Meter
The core innovation – an AI-powered specification quality analyzer that scores your spec across four dimensions:

| Dimension | What it measures |
|-----------|------------------|
| **Completeness** | Are all nodes specified? Do edges have defined data shapes? |
| **Clarity** | Are descriptions precise? Could behavior be interpreted multiple ways? |
| **Consistency** | Do connected nodes agree on data shapes? Are there contradictions? |
| **Groundedness** | Are constraints realistic? Is the behavior implementable? |

Clickable issues navigate directly to problematic nodes. Suggestions guide improvement.

### Export Options
- **JSON** – Full project state for saving/sharing
- **Markdown** – Human-readable specification document
- **LLM Prompt** – Ready-to-paste prompt for code generation

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click "Load Example" to see a pre-built User Registration API specification.

### Enable AI Analysis

Create a `.env` file:

```
VITE_ANTHROPIC_API_KEY=your-api-key-here
```

Without an API key, the Spec-o-Meter falls back to mock scoring.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Graph Editor | ReactFlow v12 |
| Styling | Tailwind CSS v4 |
| State | Zustand with localStorage persistence |
| AI | Anthropic Claude API |
| Build | Vite |

## Project Structure

```
src/
├── components/
│   ├── Canvas/           # ReactFlow canvas and custom node types
│   ├── Panels/           # NodeSpecPanel, SystemContextPanel, SpecOMeter
│   └── Header/           # Project controls and export
├── stores/
│   └── projectStore.ts   # Zustand store with persistence
├── api/
│   └── specAnalysis.ts   # Claude API integration
└── types/
    └── vopl.ts           # TypeScript interfaces
```

## Example Project

The included example demonstrates a User Registration API:

```
[HTTP POST /register] → [Validate Input] → [Hash Password] → [Store User] → [Return Response]
```

Each node has partial specifications showing the intended format and level of detail.

## Status

This is an experimental prototype exploring the VOPL concept. It demonstrates the core loop – build, specify, analyze, refine – but is not production-ready.

Current limitations:
- Frontend-only API calls (would need backend proxy for production)
- No collaborative editing
- No version history
- Limited to single-page workflows

## Background Reading

- [If You're Going to Vibe Code, Why Not Do It in C?](https://stephenramsay.net/posts/vibe-coding.html) – Stephen Ramsay's essay introducing the VOPL concept
- [Structure and Interpretation of Computer Programs](https://web.mit.edu/6.001/6.037/sicp.pdf) – The source of "programs must be written for people to read"

## License

MIT
