/**
 * Score utility functions for AI readiness scoring
 * Provides color, background, glow, and label helpers for score display
 */

/**
 * Get the Tailwind color class for a score
 */
export function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-slate-400';
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

/**
 * Get the Tailwind background/border class for a score
 */
export function scoreBg(score: number | null | undefined): string {
  if (score == null) return 'bg-slate-800/50 border-slate-700';
  if (score >= 75) return 'bg-emerald-900/30 border-emerald-500/30';
  if (score >= 50) return 'bg-amber-900/30 border-amber-500/30';
  return 'bg-red-900/30 border-red-500/30';
}

/**
 * Get the display label for a score
 */
export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return 'Not analyzed';
  if (score >= 75) return 'AI-Ready';
  if (score >= 50) return 'Needs Improvement';
  return 'Critical Issues';
}

/**
 * Get the Tailwind shadow glow class for a score
 */
export function scoreGlow(score: number | null | undefined): string {
  if (score == null) return '';
  if (score >= 75) return 'shadow-emerald-500/20';
  if (score >= 50) return 'shadow-amber-500/20';
  return 'shadow-red-500/20';
}

import { getRatingSlug } from '@aiready/core/client';

/**
 * Get rating from score (for use with ScoreBar component)
 */
export function getScoreRating(
  score: number | null | undefined
): 'excellent' | 'good' | 'fair' | 'needs-work' | 'critical' {
  if (score == null) return 'critical';
  // Use core implementation to resolve duplication
  return getRatingSlug(score) as any;
}
