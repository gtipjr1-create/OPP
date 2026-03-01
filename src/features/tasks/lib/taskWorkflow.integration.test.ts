import test from 'node:test';
import assert from 'node:assert/strict';

import type { TaskRow } from '@/types/domain';

import {
  applyCreateToStats,
  applyDeleteToStats,
  applyDeleteToTasks,
  applyToggleToStats,
  applyToggleToTasks,
  type WorkflowStats,
} from './taskWorkflow.ts';

function makeTask(id: string, done: boolean, createdAt = '2026-03-01T10:00:00.000Z'): TaskRow {
  return {
    id,
    list_id: 'list-1',
    content: `Task ${id}`,
    is_done: done,
    position: 1,
    created_at: createdAt,
  };
}

test('workflow integration: create -> toggle -> delete keeps task list and stats consistent', () => {
  let tasks: TaskRow[] = [];
  let stats: WorkflowStats | undefined;

  const createdA = makeTask('a', false, '2026-03-01T10:00:00.000Z');
  tasks = [createdA, ...tasks];
  stats = applyCreateToStats(stats, createdA);

  assert.equal(tasks.length, 1);
  assert.deepEqual(stats, {
    totalTasks: 1,
    completedTasks: 0,
    completionPct: 0,
    modifiedAt: '2026-03-01T10:00:00.000Z',
  });

  const createdB = makeTask('b', false, '2026-03-01T10:05:00.000Z');
  tasks = [createdB, ...tasks];
  stats = applyCreateToStats(stats, createdB);

  assert.equal(tasks.length, 2);
  assert.deepEqual(stats, {
    totalTasks: 2,
    completedTasks: 0,
    completionPct: 0,
    modifiedAt: '2026-03-01T10:05:00.000Z',
  });

  tasks = applyToggleToTasks(tasks, 'a', true);
  stats = applyToggleToStats(stats, true, '2026-03-01T10:06:00.000Z');

  assert.equal(tasks.find((task) => task.id === 'a')?.is_done, true);
  assert.deepEqual(stats, {
    totalTasks: 2,
    completedTasks: 1,
    completionPct: 50,
    modifiedAt: '2026-03-01T10:06:00.000Z',
  });

  const taskB = tasks.find((task) => task.id === 'b');
  assert.ok(taskB);
  tasks = applyDeleteToTasks(tasks, 'b');
  stats = applyDeleteToStats(stats, taskB.is_done, '2026-03-01T10:07:00.000Z');

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, 'a');
  assert.deepEqual(stats, {
    totalTasks: 1,
    completedTasks: 1,
    completionPct: 100,
    modifiedAt: '2026-03-01T10:07:00.000Z',
  });
});
