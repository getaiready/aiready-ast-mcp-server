import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS } from '../src/tool-definitions.js';

const EXPECTED_TOOL_NAMES = [
  'resolve_definition',
  'find_references',
  'find_implementations',
  'get_file_structure',
  'grep_search',
  'search_code',
  'get_symbol_docs',
  'build_symbol_index',
  'get_call_hierarchy',
  'check_symbol_grounding',
  'hygiene_audit',
  'metabolism_audit',
  'codebase_audit',
];

describe('TOOL_DEFINITIONS', () => {
  it('declares exactly the expected set of tools', () => {
    const names = TOOL_DEFINITIONS.map((tool) => tool.name);
    expect(names).toEqual(EXPECTED_TOOL_NAMES);
  });

  it.each(EXPECTED_TOOL_NAMES)('%s sets all four annotation hints', (name) => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === name);
    expect(tool).toBeDefined();
    expect(typeof tool!.annotations.readOnlyHint).toBe('boolean');
    expect(typeof tool!.annotations.destructiveHint).toBe('boolean');
    expect(typeof tool!.annotations.idempotentHint).toBe('boolean');
    expect(typeof tool!.annotations.openWorldHint).toBe('boolean');
  });

  it.each(EXPECTED_TOOL_NAMES)(
    '%s has an inputSchema whose required fields are all declared properties',
    (name) => {
      const tool = TOOL_DEFINITIONS.find((t) => t.name === name);
      const { properties, required } = tool!.inputSchema as {
        properties: Record<string, unknown>;
        required: readonly string[];
      };
      for (const field of required) {
        expect(properties).toHaveProperty(field);
      }
    }
  );
});
