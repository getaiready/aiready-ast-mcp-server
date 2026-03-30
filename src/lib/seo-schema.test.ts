import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebSiteSchema,
  aiMetaTags,
  PLATFORM_BASE_URL,
} from './seo-schema';

describe('platform seo-schema', () => {
  it('should generate valid organization schema', () => {
    const schema: any = generateOrganizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.url).toBe('https://getaiready.dev');
    expect(schema.logo.url).toContain('logo-transparent-bg.png');
  });

  it('should generate valid software application schema', () => {
    const schema: any = generateSoftwareApplicationSchema();
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toBe('AIReady Platform');
    expect(schema['@id']).toBe(`${PLATFORM_BASE_URL}/#software`);
  });

  it('should generate valid website schema', () => {
    const schema: any = generateWebSiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema.url).toBe(PLATFORM_BASE_URL);
  });

  it('should have comprehensive AI meta tags', () => {
    expect(aiMetaTags.chatgpt).toBeDefined();
    expect(aiMetaTags.perplexity).toBeDefined();
    expect(aiMetaTags.general).toBeDefined();
    expect(aiMetaTags.general['ai:summary']).toBeDefined();
    expect(aiMetaTags.general['ai:pricing']).toBeDefined();
  });
});
