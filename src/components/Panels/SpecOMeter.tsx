import { useCallback, useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { analyzeSpec } from '../../api/specAnalysis';
import type { SpecIssue } from '../../types/vopl';

export function SpecOMeter() {
  const { project, isAnalyzing, setIsAnalyzing, setSpecScore, selectNode } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedRef = useRef<string>('');

  // Auto-analyze on changes with debounce
  useEffect(() => {
    const projectHash = JSON.stringify({
      nodes: project.nodes.map(n => ({ id: n.id, data: n.data })),
      edges: project.edges,
      systemContext: project.systemContext,
    });

    // Don't re-analyze if nothing changed
    if (projectHash === lastAnalyzedRef.current) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      lastAnalyzedRef.current = projectHash;
      setIsAnalyzing(true);
      try {
        const score = await analyzeSpec(project);
        setSpecScore(score);
      } finally {
        setIsAnalyzing(false);
      }
    }, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [project.nodes, project.edges, project.systemContext, setIsAnalyzing, setSpecScore]);

  const handleManualAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const score = await analyzeSpec(project);
      setSpecScore(score);
      lastAnalyzedRef.current = JSON.stringify({
        nodes: project.nodes.map(n => ({ id: n.id, data: n.data })),
        edges: project.edges,
        systemContext: project.systemContext,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [project, setIsAnalyzing, setSpecScore]);

  const handleIssueClick = useCallback((issue: SpecIssue) => {
    if (issue.nodeId) {
      selectNode(issue.nodeId);
    }
  }, [selectNode]);

  const score = project.specScore;
  const overallColor = getScoreColor(score?.overall ?? 0);
  const issueCount = score?.issues.length ?? 0;
  const errorCount = score?.issues.filter(i => i.severity === 'error').length ?? 0;
  const warningCount = score?.issues.filter(i => i.severity === 'warning').length ?? 0;

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Collapsed bar */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Score gauge */}
          <div className="flex items-center gap-2">
            <ScoreGauge score={score?.overall ?? 0} size={32} />
            <div>
              <span className={`text-lg font-bold ${overallColor}`}>
                {score?.overall ?? 0}%
              </span>
              <span className="text-xs text-gray-500 ml-1">Spec Quality</span>
            </div>
          </div>

          {/* Issue summary */}
          <div className="flex items-center gap-2 text-sm">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {issueCount === 0 && !isAnalyzing && (
              <span className="text-gray-500">No issues</span>
            )}
          </div>

          {/* Loading indicator */}
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-sm text-blue-600">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleManualAnalyze();
            }}
            disabled={isAnalyzing}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
          >
            Refresh
          </button>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && score && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <DimensionCard
              label="Completeness"
              score={score.completeness.score}
              details={score.completeness.details}
            />
            <DimensionCard
              label="Clarity"
              score={score.ambiguity.score}
              details={score.ambiguity.details}
            />
            <DimensionCard
              label="Consistency"
              score={score.consistency.score}
              details={score.consistency.details}
            />
            <DimensionCard
              label="Groundedness"
              score={score.groundedness.score}
              details={score.groundedness.details}
            />
          </div>

          {/* Issues list */}
          {score.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Issues</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {score.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-start gap-2 p-2 rounded text-sm cursor-pointer
                      ${issue.severity === 'error' ? 'bg-red-50 hover:bg-red-100' :
                        issue.severity === 'warning' ? 'bg-yellow-50 hover:bg-yellow-100' :
                        'bg-blue-50 hover:bg-blue-100'}
                    `}
                    onClick={() => handleIssueClick(issue)}
                  >
                    <span className={`
                      w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                      ${issue.severity === 'error' ? 'bg-red-500' :
                        issue.severity === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'}
                    `} />
                    <div>
                      <span className="text-gray-900">{issue.message}</span>
                      {issue.nodeId && (
                        <span className="text-xs text-gray-500 ml-1">(click to navigate)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggestions</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {score.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">→</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ScoreGaugeProps {
  score: number;
  size: number;
}

function ScoreGauge({ score, size }: ScoreGaugeProps) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColorHex(score);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

interface DimensionCardProps {
  label: string;
  score: number;
  details: string[];
}

function DimensionCard({ label, score, details }: DimensionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const color = getScoreColor(score);

  return (
    <div
      className="bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:shadow-sm"
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getScoreBgColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showDetails && details.length > 0 && (
        <ul className="mt-2 text-xs text-gray-500 space-y-1">
          {details.slice(0, 3).map((detail, i) => (
            <li key={i}>• {detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreColorHex(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  return '#dc2626';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}
