import { describe, it, expect } from 'vitest';
import { classifyStringLiteral, StringCategory } from '../string-classifier';

describe('classifyStringLiteral', () => {
  describe('UI Display strings (should NOT be flagged as magic literals)', () => {
    it('should classify button labels as UiDisplay', () => {
      expect(classifyStringLiteral('Save')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Cancel')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Delete')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Submit')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Close')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Add Item')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Remove User')).toBe(
        StringCategory.UiDisplay
      );
    });

    it('should classify status messages as UiDisplay', () => {
      expect(classifyStringLiteral('Loading')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Please wait')).toBe(
        StringCategory.UiDisplay
      );
      expect(classifyStringLiteral('Error occurred')).toBe(
        StringCategory.UiDisplay
      );
      expect(classifyStringLiteral('Success')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Warning')).toBe(StringCategory.UiDisplay);
    });

    it('should classify short UI text as UiDisplay', () => {
      expect(classifyStringLiteral('No usage')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Filter...')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Nodes')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Search')).toBe(StringCategory.UiDisplay);
      expect(classifyStringLiteral('Settings')).toBe(StringCategory.UiDisplay);
    });

    it('should classify title-case phrases as UiDisplay', () => {
      expect(classifyStringLiteral('User Profile')).toBe(
        StringCategory.UiDisplay
      );
      expect(classifyStringLiteral('Account Settings')).toBe(
        StringCategory.UiDisplay
      );
      expect(classifyStringLiteral('Dashboard Overview')).toBe(
        StringCategory.UiDisplay
      );
    });
  });

  describe('Meaningful strings (SHOULD be flagged as magic literals)', () => {
    it('should classify API endpoints as Meaningful', () => {
      expect(classifyStringLiteral('/api/users')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('/api/v1/posts')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('https://api.example.com')).toBe(
        StringCategory.Meaningful
      );
    });

    it('should classify configuration values as Meaningful', () => {
      expect(classifyStringLiteral('production')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('development')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('DATABASE_URL')).toBe(
        StringCategory.Meaningful
      );
    });

    it('should classify HTTP methods as Meaningful', () => {
      expect(classifyStringLiteral('GET')).toBe(StringCategory.Meaningful);
      expect(classifyStringLiteral('POST')).toBe(StringCategory.Meaningful);
      expect(classifyStringLiteral('DELETE')).toBe(StringCategory.Meaningful);
    });

    it('should classify error codes as Meaningful', () => {
      expect(classifyStringLiteral('AUTH_ERROR')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('VALIDATION_CODE')).toBe(
        StringCategory.Meaningful
      );
    });

    it('should classify MIME types as Meaningful', () => {
      expect(classifyStringLiteral('application/json')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('text/html')).toBe(
        StringCategory.Meaningful
      );
    });

    it('should classify camelCase identifiers as Meaningful', () => {
      expect(classifyStringLiteral('userId')).toBe(StringCategory.Meaningful);
      expect(classifyStringLiteral('accessToken')).toBe(
        StringCategory.Meaningful
      );
    });

    it('should classify all-caps constants as Meaningful', () => {
      expect(classifyStringLiteral('API_TIMEOUT')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('MAX_RETRIES')).toBe(
        StringCategory.Meaningful
      );
    });
  });

  describe('Edge cases', () => {
    it('should ignore empty strings', () => {
      expect(classifyStringLiteral('')).toBe(StringCategory.Ignore);
    });

    it('should ignore very long strings', () => {
      expect(classifyStringLiteral('a'.repeat(101))).toBe(
        StringCategory.Ignore
      );
    });

    it('should handle strings with special characters', () => {
      expect(classifyStringLiteral('user@example.com')).toBe(
        StringCategory.Meaningful
      );
      expect(classifyStringLiteral('file/path.txt')).toBe(
        StringCategory.Meaningful
      );
    });
  });
});
