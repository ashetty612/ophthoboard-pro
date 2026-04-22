import { describe, it, expect } from 'vitest';
import { getFatalFlawsForCase } from '@/lib/fatal-flaws';

describe('getFatalFlawsForCase', () => {
  it('returns the HLA-B27 flaw for anterior uveitis', () => {
    const flaws = getFatalFlawsForCase(
      'Anterior uveitis, HLA-B27 associated',
      '24M with unilateral red painful eye',
      []
    );
    const ids = flaws.map((f) => f.id);
    expect(ids).toContain('as-hlab27-uveitis');
  });

  it('returns the open-globe flaw for open globe rupture', () => {
    const flaws = getFatalFlawsForCase(
      'Open globe rupture',
      'Trauma patient',
      []
    );
    expect(flaws.some((f) => f.id === 'as-open-globe')).toBe(true);
  });

  it('returns no fatal flaws for a benign cataract case', () => {
    const flaws = getFatalFlawsForCase('Cataract', 'Elderly with gradual vision loss', []);
    expect(flaws).toEqual([]);
  });

  it('returns multiple flaws when multiple triggers present, deduplicated', () => {
    const flaws = getFatalFlawsForCase(
      'CRAO with suspected GCA and new flashes/floaters',
      'Older adult',
      []
    );
    const ids = flaws.map((f) => f.id);
    expect(ids).toContain('ps-crao-gca');
    expect(ids).toContain('ps-flashes-floaters-rd');
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });

  it('returns [] for empty inputs', () => {
    expect(getFatalFlawsForCase('', '', [])).toEqual([]);
  });

  it('is case-insensitive', () => {
    const upper = getFatalFlawsForCase('LEUKOCORIA', '', []);
    const lower = getFatalFlawsForCase('leukocoria', '', []);
    expect(upper.map((f) => f.id)).toEqual(lower.map((f) => f.id));
    expect(upper.length).toBeGreaterThan(0);
  });

  it('matches triggers in the keywords list', () => {
    const flaws = getFatalFlawsForCase('', '', ['tamsulosin']);
    expect(flaws.some((f) => f.id === 'opt-ifis')).toBe(true);
  });

  it('a single trigger keyword appearing twice yields only one flaw', () => {
    const flaws = getFatalFlawsForCase('hypopyon hypopyon hypopyon', 'hypopyon', ['hypopyon']);
    const ids = flaws.map((f) => f.id);
    expect(ids.filter((id) => id === 'as-hypopyon-endo').length).toBe(1);
  });
});
