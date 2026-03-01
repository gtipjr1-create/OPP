import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractDateFromContent,
  extractPriorityFromContent,
  extractTaggedPriorityFromContent,
  extractTimeFromContent,
  parseTaskSemantics,
} from './taskSemantics.ts';

test('extractPriorityFromContent resolves high/low/normal defaults', () => {
  assert.equal(extractPriorityFromContent('Do thing #high'), 'high');
  assert.equal(extractPriorityFromContent('Do thing #low'), 'low');
  assert.equal(extractPriorityFromContent('Do thing #p1'), 'high');
  assert.equal(extractPriorityFromContent('Do thing'), 'normal');
});

test('extractTaggedPriorityFromContent only returns explicit tags', () => {
  assert.equal(extractTaggedPriorityFromContent('Do thing #high'), 'high');
  assert.equal(extractTaggedPriorityFromContent('Do thing #normal'), 'normal');
  assert.equal(extractTaggedPriorityFromContent('Do thing #low'), 'low');
  assert.equal(extractTaggedPriorityFromContent('Do thing'), undefined);
});

test('extractTimeFromContent parses am/pm times', () => {
  assert.equal(extractTimeFromContent('Task @6pm'), '18:00');
  assert.equal(extractTimeFromContent('Task at 6:30 pm'), '18:30');
  assert.equal(extractTimeFromContent('Task no time'), undefined);
});

test('extractDateFromContent parses relative and absolute dates', () => {
  const now = new Date('2026-03-01T09:00:00Z');

  assert.equal(extractDateFromContent('Task today', now), '2026-03-01');
  assert.equal(extractDateFromContent('Task tomorrow', now), '2026-03-02');
  assert.equal(extractDateFromContent('Task 3/15/26', now), '2026-03-15');
});

test('parseTaskSemantics returns canonical semantic object', () => {
  const now = new Date('2026-03-01T09:00:00Z');
  const result = parseTaskSemantics('Mobility @5pm #high tomorrow', 'normal', now);

  assert.deepEqual(result, {
    priority: 'high',
    taggedPriority: 'high',
    scheduledTime: '17:00',
    scheduledFor: '2026-03-02',
  });
});
