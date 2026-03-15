import type {
  ScanOptions,
  Issue,
  IssueType,
  DocDriftRisk,
} from '@aiready/core';

/**
 * Options for documentation drift analysis
 */
export interface DocDriftOptions extends ScanOptions {
  /** Maximum commit distance to check for drift */
  maxCommits?: number;
  /** Consider comments older than this many months as outdated */
  staleMonths?: number;
}

/**
 * Documentation drift specific issue
 */
export interface DocDriftIssue extends Issue {
  /** Type identifier for doc-drift issues */
  type: IssueType.DocDrift;
}

/**
 * Comprehensive report for doc-drift analysis
 */
export interface DocDriftReport {
  /** High-level summary of the drift status */
  summary: {
    /** Total number of files checked */
    filesAnalyzed: number;
    /** Total number of exported functions/classes checked */
    functionsAnalyzed: number;
    /** Final doc-drift score (0-100) */
    score: number;
    /** Qualitative rating (minimal to severe) */
    rating: DocDriftRisk['rating'];
  };
  /** List of detected drift points */
  issues: DocDriftIssue[];
  /** Detailed counts for the three drift dimensions */
  rawData: {
    /** Number of exports without JSDoc/comments */
    uncommentedExports: number;
    /** Total number of exports in the analyzed set */
    totalExports: number;
    /** Number of comments considered stale/outdated */
    outdatedComments: number;
    /** Count of complex functions without sufficient documentation */
    undocumentedComplexity: number;
  };
  /** AI-generated remediation advice */
  recommendations: string[];
}
