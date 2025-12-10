import { useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';

export function SystemContextPanel() {
  const { project, isSystemContextOpen, toggleSystemContext, updateSystemContextField } = useProjectStore();

  const handleClose = useCallback(() => {
    toggleSystemContext();
  }, [toggleSystemContext]);

  if (!isSystemContextOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Context</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Define the global context for your system. This information applies to all components
            and helps ensure consistent implementation.
          </p>

          <ContextField
            label="Environment"
            description="Runtime environment and platform (e.g., Node.js / Browser / Edge)"
            value={project.systemContext.environment}
            onChange={(value) => updateSystemContextField('environment', value)}
            placeholder="e.g., Node.js 20.x on Linux, Browser (Chrome 120+), AWS Lambda"
          />

          <ContextField
            label="Constraints"
            description="Resource limitations and boundaries"
            value={project.systemContext.constraints}
            onChange={(value) => updateSystemContextField('constraints', value)}
            placeholder="e.g., Max 512MB memory, 30s timeout, 10MB payload limit"
            multiline
          />

          <ContextField
            label="Infrastructure"
            description="State management, databases, and scaling approach"
            value={project.systemContext.infrastructure}
            onChange={(value) => updateSystemContextField('infrastructure', value)}
            placeholder="e.g., PostgreSQL for persistence, Redis for caching, horizontal scaling via Kubernetes"
            multiline
          />

          <ContextField
            label="External Dependencies"
            description="APIs, services, and databases with connection details shape"
            value={project.systemContext.dependencies}
            onChange={(value) => updateSystemContextField('dependencies', value)}
            placeholder="e.g., - Stripe API (payment processing)&#10;- SendGrid (email)&#10;- PostgreSQL (users, orders tables)"
            multiline
          />

          <ContextField
            label="Security Requirements"
            description="Authentication, encryption, and data handling policies"
            value={project.systemContext.security}
            onChange={(value) => updateSystemContextField('security', value)}
            placeholder="e.g., - JWT-based auth&#10;- AES-256 for data at rest&#10;- TLS 1.3 in transit&#10;- PII must be encrypted"
            multiline
          />

          <ContextField
            label="Non-Functional Requirements"
            description="Performance, availability, and quality targets"
            value={project.systemContext.nonFunctional}
            onChange={(value) => updateSystemContextField('nonFunctional', value)}
            placeholder="e.g., - P95 latency < 200ms&#10;- 99.9% uptime SLA&#10;- Support 1000 concurrent users"
            multiline
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface ContextFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

function ContextField({ label, description, value, onChange, placeholder, multiline }: ContextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-1">{label}</label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={4}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
