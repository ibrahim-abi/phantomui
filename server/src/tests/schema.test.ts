/**
 * Unit tests for snapshot Zod schema validation.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UiSnapshotSchema, validateSnapshot } from '../schema/snapshot.schema.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const validSnapshot = {
  url:       'https://example.com/login',
  timestamp: new Date().toISOString(),
  elements: [
    {
      id:       'email',
      role:     'input',
      action:   null,
      label:    'Email address',
      context:  null,
      required: true,
      state:    null,
      selector: '#email',
      source:   'manual',
    },
  ],
  meta: {
    manualCount: 1,
    autoCount:   0,
    sdkVersion:  '0.1.0',
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('UiSnapshotSchema', () => {
  test('validates a correct snapshot', () => {
    const result = UiSnapshotSchema.safeParse(validSnapshot);
    assert.equal(result.success, true);
  });

  test('rejects snapshot missing timestamp', () => {
    const bad = { ...validSnapshot, timestamp: undefined };
    const result = UiSnapshotSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  test('rejects snapshot missing elements array', () => {
    const bad = { ...validSnapshot, elements: undefined };
    const result = UiSnapshotSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  test('rejects invalid role enum value', () => {
    const bad = {
      ...validSnapshot,
      elements: [{ ...validSnapshot.elements[0], role: 'button' }],
    };
    const result = UiSnapshotSchema.safeParse(bad);
    assert.equal(result.success, false);
  });

  test('accepts null url', () => {
    const snap = { ...validSnapshot, url: null };
    const result = UiSnapshotSchema.safeParse(snap);
    assert.equal(result.success, true);
  });
});

describe('validateSnapshot()', () => {
  test('returns parsed snapshot on valid input', () => {
    const parsed = validateSnapshot(validSnapshot);
    assert.equal(parsed.url, validSnapshot.url);
    assert.equal(parsed.elements.length, 1);
  });

  test('throws descriptive error on invalid input', () => {
    assert.throws(
      () => validateSnapshot({ url: null, elements: [] }),
      (err: Error) => {
        assert.ok(err.message.includes('Invalid UI snapshot'));
        return true;
      },
    );
  });
});
