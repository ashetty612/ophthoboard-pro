import { describe, it, expect } from 'vitest';
import { buildRelevantContext } from '@/lib/ai-context';

describe('ai-context-smoke', () => {
  it('returns GCA/trial material for an older adult vision-loss prompt', () => {
    const ctx = buildRelevantContext(
      '72-year-old with sudden monocular vision loss, jaw claudication, and headache'
    );
    expect(ctx.length).toBeGreaterThan(0);
    expect(ctx.toLowerCase()).toMatch(/gca|giant cell|temporal arteritis|aion/);
  });
  it('returns empty string for gibberish', () => {
    expect(buildRelevantContext('asdf qwer zxcv')).toBe('');
  });
  it('surfaces ONTT for optic neuritis', () => {
    const ctx = buildRelevantContext('young woman with painful vision loss and RAPD, suspect optic neuritis');
    expect(ctx.toLowerCase()).toContain('ontt');
  });
});
