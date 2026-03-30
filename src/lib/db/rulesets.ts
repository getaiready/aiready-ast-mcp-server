import {
  getItem,
  putItem,
  updateItem,
  PK,
  SK,
  buildUpdateExpression,
} from './helpers';
import type { CustomRuleset } from './types';

/**
 * Retrieves the custom ruleset for a team.
 * Returns null if no custom ruleset is defined.
 */
export async function getRuleset(
  teamId: string
): Promise<CustomRuleset | null> {
  return getItem<CustomRuleset>({ PK: PK.team(teamId), SK: SK.ruleset });
}

/**
 * Updates or creates a custom ruleset for a team.
 */
export async function updateRuleset(
  teamId: string,
  ruleset: Partial<CustomRuleset>
): Promise<void> {
  const existing = await getRuleset(teamId);
  const now = new Date().toISOString();

  if (!existing) {
    const newItem = {
      id: 'RULESET#DEFAULT',
      teamId,
      overrides: ruleset.overrides || {},
      customPolicies: ruleset.customPolicies || [],
      enforcement: ruleset.enforcement || 'advisory',
      createdAt: now,
      updatedAt: now,
    };
    await putItem({ PK: PK.team(teamId), SK: SK.ruleset, ...newItem });
    return;
  }

  const update = buildUpdateExpression(ruleset);
  if (!update) return;
  await updateItem(
    { PK: PK.team(teamId), SK: SK.ruleset },
    update.expression,
    update.values,
    update.names
  );
}
