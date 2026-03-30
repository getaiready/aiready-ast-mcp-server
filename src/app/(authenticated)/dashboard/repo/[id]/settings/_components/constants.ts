import { ToolName, AIReadyConfig } from '@aiready/core/client';

export const ALIAS_MAP: Record<string, string> = {
  patterns: ToolName.PatternDetect,
  duplicates: ToolName.PatternDetect,
  context: ToolName.ContextAnalyzer,
  fragmentation: ToolName.ContextAnalyzer,
  consistency: ToolName.NamingConsistency,
  'ai-signal': ToolName.AiSignalClarity,
  grounding: ToolName.AgentGrounding,
  testability: ToolName.TestabilityIndex,
  'deps-health': ToolName.DependencyHealth,
  'change-amp': ToolName.ChangeAmplification,
  contract: ToolName.ContractEnforcement,
  'contract-enforcement': ToolName.ContractEnforcement,
};

export const DEFAULT_SETTINGS: AIReadyConfig = {
  threshold: 70,
  scan: {
    tools: [
      ToolName.PatternDetect,
      ToolName.ContextAnalyzer,
      ToolName.NamingConsistency,
      ToolName.ChangeAmplification,
      ToolName.AiSignalClarity,
      ToolName.AgentGrounding,
      ToolName.TestabilityIndex,
      ToolName.DocDrift,
      ToolName.DependencyHealth,
      ToolName.ContractEnforcement,
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  },
  tools: {
    [ToolName.PatternDetect]: {
      minSimilarity: 0.8,
      minLines: 5,
      approx: true,
      minSharedTokens: 10,
      maxCandidatesPerBlock: 100,
    },
    [ToolName.ContextAnalyzer]: {
      maxDepth: 5,
      minCohesion: 0.6,
      maxFragmentation: 0.4,
      includeNodeModules: false,
      focus: 'all',
    },
    [ToolName.NamingConsistency]: {
      disableChecks: [],
    },
    [ToolName.AiSignalClarity]: {
      checkMagicLiterals: true,
      checkBooleanTraps: true,
      checkAmbiguousNames: true,
      checkUndocumentedExports: true,
      checkImplicitSideEffects: true,
      checkDeepCallbacks: true,
    },
    [ToolName.AgentGrounding]: { maxRecommendedDepth: 4 },
    [ToolName.TestabilityIndex]: { minCoverageRatio: 0.5 },
    [ToolName.DocDrift]: { staleMonths: 6 },
    [ToolName.DependencyHealth]: { trainingCutoffYear: 2024 },
    [ToolName.ContractEnforcement]: { minChainDepth: 3 },
  },
  scoring: {},
};

export const ALL_TOOLS = [
  {
    id: ToolName.PatternDetect,
    name: 'Pattern Detection',
    description: 'Finds semantic duplicates and logic clones.',
  },
  {
    id: ToolName.ContextAnalyzer,
    name: 'Context Analyzer',
    description: 'Analyzes dependency fragmentation and context costs.',
  },
  {
    id: ToolName.NamingConsistency,
    name: 'Naming Consistency',
    description: 'Enforces standard naming conventions and clarity.',
  },
  {
    id: ToolName.ChangeAmplification,
    name: 'Change Amplification',
    description: 'Detects code that causes excessive downstream changes.',
  },
  {
    id: ToolName.AiSignalClarity,
    name: 'AI Signal Clarity',
    description: 'Measures how easy it is for AI to reason about the code.',
  },
  {
    id: ToolName.AgentGrounding,
    name: 'Agent Grounding',
    description: 'Verifies if business concepts are correctly implemented.',
  },
  {
    id: ToolName.TestabilityIndex,
    name: 'Testability Index',
    description: 'Evaluates how easy it is to write unit tests for the code.',
  },
  {
    id: ToolName.DocDrift,
    name: 'Document Drift',
    description: 'Checks if documentation matches actual implementation.',
  },
  {
    id: ToolName.DependencyHealth,
    name: 'Dependency Health',
    description: 'Analyzes external dependency risks and bloat.',
  },
  {
    id: ToolName.ContractEnforcement,
    name: 'Contract Enforcement',
    description:
      'Detects defensive coding patterns that indicate missing structural contracts.',
  },
];
