import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from '@xyflow/react';
import type {
  VOPLProject,
  VOPLNode,
  VOPLEdge,
  VOPLNodeType,
  VOPLNodeData,
  SystemContext,
  SpecScore,
} from '../types/vopl';
import { defaultNodeData, defaultSystemContext } from '../types/vopl';

interface ProjectState {
  // Project data
  project: VOPLProject;

  // UI state
  selectedNodeId: string | null;
  isPanelOpen: boolean;
  isSystemContextOpen: boolean;
  isAnalyzing: boolean;

  // Project actions
  setProjectName: (name: string) => void;
  setSystemContext: (context: SystemContext) => void;
  updateSystemContextField: (field: keyof SystemContext, value: string) => void;

  // Node actions
  addNode: (type: VOPLNodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<VOPLNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  onNodesChange: (changes: NodeChange<VOPLNode>[]) => void;

  // Edge actions
  addEdge: (connection: Connection) => void;
  updateEdge: (edgeId: string, data: Partial<VOPLEdge['data']>) => void;
  deleteEdge: (edgeId: string) => void;
  onEdgesChange: (changes: EdgeChange<VOPLEdge>[]) => void;

  // UI actions
  selectNode: (nodeId: string | null) => void;
  togglePanel: () => void;
  toggleSystemContext: () => void;

  // Spec analysis
  setSpecScore: (score: SpecScore) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;

  // Project management
  resetProject: () => void;
  loadProject: (project: VOPLProject) => void;
  loadExampleProject: () => void;
}

const createEmptyProject = (): VOPLProject => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  systemContext: { ...defaultSystemContext },
  nodes: [],
  edges: [],
  lastModified: Date.now(),
});

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: createEmptyProject(),
      selectedNodeId: null,
      isPanelOpen: false,
      isSystemContextOpen: false,
      isAnalyzing: false,

      setProjectName: (name) => set((state) => ({
        project: { ...state.project, name, lastModified: Date.now() }
      })),

      setSystemContext: (context) => set((state) => ({
        project: { ...state.project, systemContext: context, lastModified: Date.now() }
      })),

      updateSystemContextField: (field, value) => set((state) => ({
        project: {
          ...state.project,
          systemContext: { ...state.project.systemContext, [field]: value },
          lastModified: Date.now()
        }
      })),

      addNode: (type, position) => {
        const newNode: VOPLNode = {
          id: crypto.randomUUID(),
          type,
          position,
          data: {
            ...defaultNodeData[type],
            name: defaultNodeData[type].name || 'New Node',
            intent: defaultNodeData[type].intent || '',
            inputs: [...(defaultNodeData[type].inputs || [])],
            outputs: [...(defaultNodeData[type].outputs || [])],
            behavior: defaultNodeData[type].behavior || '',
            examples: [...(defaultNodeData[type].examples || [])],
            constraints: [...(defaultNodeData[type].constraints || [])],
          },
        };

        set((state) => ({
          project: {
            ...state.project,
            nodes: [...state.project.nodes, newNode],
            lastModified: Date.now()
          },
          selectedNodeId: newNode.id,
          isPanelOpen: true,
        }));
      },

      updateNode: (nodeId, data) => set((state) => ({
        project: {
          ...state.project,
          nodes: state.project.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          lastModified: Date.now()
        }
      })),

      deleteNode: (nodeId) => set((state) => ({
        project: {
          ...state.project,
          nodes: state.project.nodes.filter((node) => node.id !== nodeId),
          edges: state.project.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          lastModified: Date.now()
        },
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isPanelOpen: state.selectedNodeId === nodeId ? false : state.isPanelOpen,
      })),

      onNodesChange: (changes) => set((state) => ({
        project: {
          ...state.project,
          nodes: applyNodeChanges(changes, state.project.nodes) as VOPLNode[],
          lastModified: Date.now()
        }
      })),

      addEdge: (connection) => set((state) => {
        const newEdge: VOPLEdge = {
          id: crypto.randomUUID(),
          source: connection.source!,
          target: connection.target!,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
        };
        return {
          project: {
            ...state.project,
            edges: addEdge(newEdge, state.project.edges),
            lastModified: Date.now()
          }
        };
      }),

      updateEdge: (edgeId, data) => set((state) => ({
        project: {
          ...state.project,
          edges: state.project.edges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, data: { ...edge.data, ...data } }
              : edge
          ),
          lastModified: Date.now()
        }
      })),

      deleteEdge: (edgeId) => set((state) => ({
        project: {
          ...state.project,
          edges: state.project.edges.filter((edge) => edge.id !== edgeId),
          lastModified: Date.now()
        }
      })),

      onEdgesChange: (changes) => set((state) => ({
        project: {
          ...state.project,
          edges: applyEdgeChanges(changes, state.project.edges) as VOPLEdge[],
          lastModified: Date.now()
        }
      })),

      selectNode: (nodeId) => set({
        selectedNodeId: nodeId,
        isPanelOpen: nodeId !== null,
      }),

      togglePanel: () => set((state) => ({
        isPanelOpen: !state.isPanelOpen
      })),

      toggleSystemContext: () => set((state) => ({
        isSystemContextOpen: !state.isSystemContextOpen
      })),

      setSpecScore: (score) => set((state) => ({
        project: { ...state.project, specScore: score, lastModified: Date.now() }
      })),

      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

      resetProject: () => set({
        project: createEmptyProject(),
        selectedNodeId: null,
        isPanelOpen: false,
        isSystemContextOpen: false,
      }),

      loadProject: (project) => set({
        project,
        selectedNodeId: null,
        isPanelOpen: false,
        isSystemContextOpen: false,
      }),

      loadExampleProject: () => {
        const exampleProject: VOPLProject = {
          id: crypto.randomUUID(),
          name: 'User Registration API',
          systemContext: {
            environment: 'Node.js 20.x runtime on Linux server',
            constraints: 'Max 100MB memory, 10s request timeout',
            infrastructure: 'PostgreSQL database for user storage, Redis for session cache',
            dependencies: '- PostgreSQL: Users table with id, email, password_hash, created_at\n- bcrypt for password hashing\n- Express.js web framework',
            security: '- HTTPS only\n- Password hashing with bcrypt (cost factor 12)\n- Input sanitization against SQL injection\n- Rate limiting: 10 requests per minute per IP',
            nonFunctional: '- Response time < 500ms for 95th percentile\n- 99.9% availability target',
          },
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              position: { x: 100, y: 200 },
              data: {
                name: 'POST /register',
                intent: 'Handle incoming user registration requests via HTTP POST',
                inputs: [],
                outputs: [{ name: 'body', description: 'Request body with user details', shape: '{ email: string, password: string }' }],
                behavior: '## Trigger Type\nHTTP POST endpoint at `/api/register`\n\n## Request Format\n- Content-Type: application/json\n- Body must contain email and password fields\n\n## Initial Validation\n- Reject if Content-Type is not application/json\n- Reject if body is missing or malformed JSON',
                examples: [
                  { input: '{}', output: '{ "email": "user@example.com", "password": "SecurePass123!" }', notes: 'Valid registration request' },
                  { input: '{}', output: '400 Bad Request', notes: 'Missing body' }
                ],
                constraints: ['Must support JSON body up to 10KB'],
              },
            },
            {
              id: 'process-1',
              type: 'process',
              position: { x: 350, y: 100 },
              data: {
                name: 'Validate Input',
                intent: 'Validate email format and password strength',
                inputs: [{ name: 'body', description: 'Request body', shape: '{ email: string, password: string }' }],
                outputs: [
                  { name: 'valid', description: 'Validated user data', shape: '{ email: string, password: string }' },
                  { name: 'error', description: 'Validation error', shape: '{ code: string, message: string }' }
                ],
                behavior: '## Email Validation\n- Must be valid email format (RFC 5322)\n- Max 254 characters\n- Normalize to lowercase\n\n## Password Validation\n- Minimum 8 characters\n- At least one uppercase letter\n- At least one lowercase letter\n- At least one number\n- At least one special character (!@#$%^&*)\n\n## Error Handling\n- Return specific error codes: INVALID_EMAIL, WEAK_PASSWORD\n- Include helpful message for user',
                examples: [
                  { input: '{ "email": "USER@Example.com", "password": "SecurePass123!" }', output: '{ "email": "user@example.com", "password": "SecurePass123!" }', notes: 'Valid - email normalized' },
                  { input: '{ "email": "invalid", "password": "weak" }', output: '{ "code": "INVALID_EMAIL", "message": "Please enter a valid email address" }', notes: 'Invalid email format' }
                ],
                constraints: ['Validation must complete within 50ms'],
              },
            },
            {
              id: 'process-2',
              type: 'process',
              position: { x: 600, y: 100 },
              data: {
                name: 'Hash Password',
                intent: 'Securely hash the user password using bcrypt',
                inputs: [{ name: 'valid', description: 'Validated user data', shape: '{ email: string, password: string }' }],
                outputs: [{ name: 'user', description: 'User with hashed password', shape: '{ email: string, passwordHash: string }' }],
                behavior: '## Algorithm\n- Use bcrypt with cost factor 12\n- Generate unique salt for each password\n\n## Output\n- Replace plaintext password with hash\n- Never log or store plaintext password',
                examples: [
                  { input: '{ "email": "user@example.com", "password": "SecurePass123!" }', output: '{ "email": "user@example.com", "passwordHash": "$2b$12$..." }', notes: 'Password hashed successfully' }
                ],
                constraints: ['Must use bcrypt (not MD5, SHA1, etc.)', 'Cost factor must be at least 12'],
              },
            },
            {
              id: 'integration-1',
              type: 'integration',
              position: { x: 850, y: 100 },
              data: {
                name: 'Store User',
                intent: 'Insert new user record into PostgreSQL database',
                inputs: [{ name: 'user', description: 'User with hashed password', shape: '{ email: string, passwordHash: string }' }],
                outputs: [
                  { name: 'created', description: 'Created user record', shape: '{ id: string, email: string, createdAt: Date }' },
                  { name: 'error', description: 'Database error', shape: '{ code: string, message: string }' }
                ],
                behavior: '## Database Operation\n- INSERT into users table\n- Generate UUID for user id\n- Set created_at to current timestamp\n\n## Conflict Handling\n- If email already exists, return DUPLICATE_EMAIL error\n- Use UNIQUE constraint on email column\n\n## Transaction\n- Single INSERT, no transaction needed',
                examples: [
                  { input: '{ "email": "user@example.com", "passwordHash": "$2b$12$..." }', output: '{ "id": "uuid-123", "email": "user@example.com", "createdAt": "2024-01-15T10:30:00Z" }', notes: 'User created successfully' },
                  { input: '{ "email": "existing@example.com", "passwordHash": "$2b$12$..." }', output: '{ "code": "DUPLICATE_EMAIL", "message": "An account with this email already exists" }', notes: 'Email already registered' }
                ],
                constraints: ['Must use parameterized queries to prevent SQL injection'],
              },
            },
            {
              id: 'output-1',
              type: 'output',
              position: { x: 1100, y: 200 },
              data: {
                name: 'Return Response',
                intent: 'Send appropriate HTTP response based on result',
                inputs: [
                  { name: 'created', description: 'Successfully created user', shape: '{ id: string, email: string, createdAt: Date }' },
                  { name: 'error', description: 'Any error from previous steps', shape: '{ code: string, message: string }' }
                ],
                outputs: [],
                behavior: '## Success Response (201 Created)\n```json\n{\n  "success": true,\n  "user": { "id": "...", "email": "..." }\n}\n```\n\n## Error Responses\n- 400 Bad Request: Validation errors (INVALID_EMAIL, WEAK_PASSWORD)\n- 409 Conflict: DUPLICATE_EMAIL\n- 500 Internal Server Error: Unexpected errors\n\n## Headers\n- Content-Type: application/json\n- No sensitive data in response',
                examples: [
                  { input: '{ "id": "uuid-123", "email": "user@example.com" }', output: '201: { "success": true, "user": { "id": "uuid-123", "email": "user@example.com" } }', notes: 'Success response' },
                  { input: '{ "code": "WEAK_PASSWORD", "message": "..." }', output: '400: { "success": false, "error": { "code": "WEAK_PASSWORD", "message": "..." } }', notes: 'Validation error' }
                ],
                constraints: ['Never expose password hash in response', 'Must include CORS headers for browser clients'],
              },
            },
          ],
          edges: [
            { id: 'e1', source: 'trigger-1', target: 'process-1', sourceHandle: 'body', targetHandle: 'body' },
            { id: 'e2', source: 'process-1', target: 'process-2', sourceHandle: 'valid', targetHandle: 'valid', label: 'valid' },
            { id: 'e3', source: 'process-1', target: 'output-1', sourceHandle: 'error', targetHandle: 'error', label: 'invalid' },
            { id: 'e4', source: 'process-2', target: 'integration-1', sourceHandle: 'user', targetHandle: 'user' },
            { id: 'e5', source: 'integration-1', target: 'output-1', sourceHandle: 'created', targetHandle: 'created', label: 'success' },
            { id: 'e6', source: 'integration-1', target: 'output-1', sourceHandle: 'error', targetHandle: 'error', label: 'error' },
          ],
          lastModified: Date.now(),
        };

        set({
          project: exampleProject,
          selectedNodeId: null,
          isPanelOpen: false,
          isSystemContextOpen: false,
        });
      },
    }),
    {
      name: 'vopl-project',
      partialize: (state) => ({ project: state.project }),
    }
  )
);
