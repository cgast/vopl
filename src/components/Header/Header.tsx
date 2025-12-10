import { useCallback, useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import type { VOPLProject } from '../../types/vopl';

export function Header() {
  const {
    project,
    setProjectName,
    toggleSystemContext,
    resetProject,
    loadExampleProject,
    loadProject,
  } = useProjectStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  const handleNameSubmit = useCallback(() => {
    if (editName.trim()) {
      setProjectName(editName.trim());
    }
    setIsEditing(false);
  }, [editName, setProjectName]);

  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify(project, null, 2);
    downloadFile(data, `${project.name.replace(/\s+/g, '-')}.vopl.json`, 'application/json');
    setShowExportMenu(false);
  }, [project]);

  const handleExportMarkdown = useCallback(() => {
    const markdown = generateMarkdown(project);
    downloadFile(markdown, `${project.name.replace(/\s+/g, '-')}.spec.md`, 'text/markdown');
    setShowExportMenu(false);
  }, [project]);

  const handleCopyPrompt = useCallback(() => {
    const prompt = generatePrompt(project);
    navigator.clipboard.writeText(prompt);
    setShowExportMenu(false);
    alert('Prompt copied to clipboard!');
  }, [project]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          const imported = JSON.parse(text) as VOPLProject;
          loadProject(imported);
        } catch {
          alert('Invalid VOPL file format');
        }
      }
    };
    input.click();
    setShowSettingsMenu(false);
  }, [loadProject]);

  const handleNewProject = useCallback(() => {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      resetProject();
    }
    setShowSettingsMenu(false);
  }, [resetProject]);

  const handleLoadExample = useCallback(() => {
    if (confirm('Load the example project? Current project will be replaced.')) {
      loadExampleProject();
    }
    setShowSettingsMenu(false);
  }, [loadExampleProject]);

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      {/* Left: Logo and project name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <span className="font-semibold text-gray-900">VOPL</span>
        </div>

        <span className="text-gray-300">|</span>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            className="px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditName(project.name);
              setIsEditing(true);
            }}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
          >
            {project.name}
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSystemContext}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          System Context
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                >
                  Export as JSON
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as Markdown
                </button>
                <button
                  onClick={handleCopyPrompt}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg"
                >
                  Copy as LLM Prompt
                </button>
              </div>
            </>
          )}
        </div>

        {/* Settings dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showSettingsMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSettingsMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <button
                  onClick={handleNewProject}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                >
                  New Project
                </button>
                <button
                  onClick={handleImport}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Import Project
                </button>
                <button
                  onClick={handleLoadExample}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg"
                >
                  Load Example
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateMarkdown(project: VOPLProject): string {
  let md = `# ${project.name}\n\n`;

  // System Context
  md += `## System Context\n\n`;
  md += `### Environment\n${project.systemContext.environment || '(not specified)'}\n\n`;
  md += `### Constraints\n${project.systemContext.constraints || '(not specified)'}\n\n`;
  md += `### Infrastructure\n${project.systemContext.infrastructure || '(not specified)'}\n\n`;
  md += `### External Dependencies\n${project.systemContext.dependencies || '(not specified)'}\n\n`;
  md += `### Security Requirements\n${project.systemContext.security || '(not specified)'}\n\n`;
  md += `### Non-Functional Requirements\n${project.systemContext.nonFunctional || '(not specified)'}\n\n`;

  // Data Flow
  md += `## Data Flow\n\n`;
  project.edges.forEach((edge) => {
    const source = project.nodes.find(n => n.id === edge.source);
    const target = project.nodes.find(n => n.id === edge.target);
    md += `- ${source?.data.name || edge.source} → ${target?.data.name || edge.target}${edge.label ? ` (${edge.label})` : ''}\n`;
  });
  md += `\n`;

  // Nodes
  md += `## Components\n\n`;
  project.nodes.forEach((node) => {
    md += `### ${node.data.name} (${node.type})\n\n`;
    md += `**Intent:** ${node.data.intent || '(not specified)'}\n\n`;

    if (node.data.inputs.length > 0) {
      md += `**Inputs:**\n`;
      node.data.inputs.forEach(i => {
        md += `- \`${i.name}\`: ${i.description} (${i.shape || 'untyped'})\n`;
      });
      md += `\n`;
    }

    if (node.data.outputs.length > 0) {
      md += `**Outputs:**\n`;
      node.data.outputs.forEach(o => {
        md += `- \`${o.name}\`: ${o.description} (${o.shape || 'untyped'})\n`;
      });
      md += `\n`;
    }

    md += `**Behavior:**\n${node.data.behavior || '(not specified)'}\n\n`;

    if (node.data.examples.length > 0) {
      md += `**Examples:**\n\n`;
      md += `| Input | Output | Notes |\n`;
      md += `|-------|--------|-------|\n`;
      node.data.examples.forEach(e => {
        md += `| ${e.input} | ${e.output} | ${e.notes} |\n`;
      });
      md += `\n`;
    }

    if (node.data.constraints.length > 0) {
      md += `**Constraints:**\n`;
      node.data.constraints.forEach(c => {
        md += `- ${c}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

function generatePrompt(project: VOPLProject): string {
  const markdown = generateMarkdown(project);

  return `You are an expert software engineer. Implement the following system specification.

${markdown}

Please implement this system following best practices. Create production-ready code with proper error handling, logging, and tests.`;
}
