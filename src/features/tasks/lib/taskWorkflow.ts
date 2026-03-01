import type { TaskRow } from '@/types/domain';

export type WorkflowStats = {
  totalTasks: number;
  completedTasks: number;
  completionPct: number;
  modifiedAt: string;
};

export function createEmptyStats(modifiedAt: string): WorkflowStats {
  return {
    totalTasks: 0,
    completedTasks: 0,
    completionPct: 0,
    modifiedAt,
  };
}

export function applyCreateToStats(
  current: WorkflowStats | undefined,
  created: Pick<TaskRow, 'is_done' | 'created_at'>,
): WorkflowStats {
  const base = current ?? createEmptyStats(created.created_at);
  const totalTasks = base.totalTasks + 1;
  const completedTasks = base.completedTasks + (created.is_done ? 1 : 0);
  return {
    totalTasks,
    completedTasks,
    completionPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    modifiedAt: created.created_at,
  };
}

export function applyToggleToStats(current: WorkflowStats, becameDone: boolean, modifiedAt: string): WorkflowStats {
  const completedTasks = current.completedTasks + (becameDone ? 1 : -1);
  return {
    ...current,
    completedTasks,
    completionPct: current.totalTasks > 0 ? Math.round((completedTasks / current.totalTasks) * 100) : 0,
    modifiedAt,
  };
}

export function applyDeleteToStats(current: WorkflowStats, wasDone: boolean, modifiedAt: string): WorkflowStats {
  const totalTasks = Math.max(0, current.totalTasks - 1);
  const completedTasks = Math.max(0, current.completedTasks - (wasDone ? 1 : 0));
  return {
    ...current,
    totalTasks,
    completedTasks,
    completionPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    modifiedAt,
  };
}

export function applyToggleToTasks(tasks: TaskRow[], taskId: string, nextDone: boolean): TaskRow[] {
  return tasks.map((task) => (task.id === taskId ? { ...task, is_done: nextDone } : task));
}

export function applyDeleteToTasks(tasks: TaskRow[], taskId: string): TaskRow[] {
  return tasks.filter((task) => task.id !== taskId);
}
