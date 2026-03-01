import test from 'node:test';
import assert from 'node:assert/strict';

import { selectScheduleDotPriorityByHour } from './scheduleDots.ts';

test('selectScheduleDotPriorityByHour chooses highest priority per hour', () => {
  const byHour = selectScheduleDotPriorityByHour([
    { time: '17:00', taggedPriority: 'low' },
    { time: '17:30', taggedPriority: 'normal' },
    { time: '17:45', taggedPriority: 'high' },
    { time: '18:00', taggedPriority: 'low' },
  ]);

  assert.equal(byHour[17], 'high');
  assert.equal(byHour[18], 'low');
});

test('selectScheduleDotPriorityByHour ignores untagged tasks', () => {
  const byHour = selectScheduleDotPriorityByHour([
    { time: '17:00' },
    { time: '18:00', taggedPriority: 'normal' },
  ]);

  assert.equal(byHour[17], undefined);
  assert.equal(byHour[18], 'normal');
});
