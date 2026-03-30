import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebSiteSchema,
} from '../seo-schema';

describe('SEO Schema Utilities', () => {
  it('should generate organization schema', () => {
    const schema = generateOrganizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('AIReady');
  });

  it('should generate software application schema', () => {
    const schema = generateSoftwareApplicationSchema();
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toBe('AIReady Platform');
  });

  it('should generate website schema', () => {
    const schema = generateWebSiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema.url).toContain('platform.getaiready.dev');
  });
});
