export type DotPriority = 'high' | 'normal' | 'low';

type ScheduledTaskLike = {
  time?: string;
  taggedPriority?: DotPriority;
};

export function selectScheduleDotPriorityByHour(tasks: ScheduledTaskLike[]): Record<number, DotPriority | undefined> {
  const byHour: Record<number, DotPriority | undefined> = {};

  for (const task of tasks) {
    if (!task.time || !task.taggedPriority) continue;

    const hour = Number(task.time.split(':')[0]);
    const current = byHour[hour];

    if (current === 'high') continue;
    if (task.taggedPriority === 'high') {
      byHour[hour] = 'high';
      continue;
    }
    if (task.taggedPriority === 'normal') {
      byHour[hour] = current === 'low' ? 'normal' : current ?? 'normal';
      continue;
    }
    if (task.taggedPriority === 'low' && !current) {
      byHour[hour] = 'low';
    }
  }

  return byHour;
}
