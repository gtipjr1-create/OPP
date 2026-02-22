'use client';

import React from 'react';
import { GripVertical } from 'lucide-react';

import { APP_CONFIG } from '@/config/app';

import { createTaskAction } from '../actions';
import { useTasksFeature } from '../useTasksFeature';

type Priority = 'high' | 'normal' | 'low';

type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  time?: string;
  scheduledFor?: Date;
  section?: string;
};

const hours = Array.from({ length: 17 }, (_, i) => i + 6);

function formatHour(hour: number) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hr = ((hour + 11) % 12) + 1;
  return `${hr}${ampm}`;
}

function getTodayLabel() {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });
  const date = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${weekday} | ${date}`;
}

function extractTime(content: string): string | undefined {
  const match = content.match(/\b(?:@|at\s+)?([1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (!match) {
    return undefined;
  }

  const rawHour = Number(match[1]);
  const minutes = match[2] ?? '00';
  const meridiem = match[3].toLowerCase();

  let hour24 = rawHour % 12;
  if (meridiem === 'pm') {
    hour24 += 12;
  }

  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}

function formatDisplayTime(time24: string): string {
  const [hourText, minuteText] = time24.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

function extractPriority(content: string): Priority {
  const lower = content.toLowerCase();
  if (lower.includes('#high') || lower.includes('#p1') || /\bp1\b/.test(lower)) {
    return 'high';
  }
  if (lower.includes('#low')) {
    return 'low';
  }
  return 'normal';
}

function withPriorityTag(content: string, priority: Priority): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return trimmed;
  }

  const hasExplicitPriority = /#high|#low/i.test(trimmed);
  if (priority === 'normal' || hasExplicitPriority) {
    return trimmed;
  }

  return `${trimmed} #${priority}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function extractTargetDate(content: string, now = new Date()): Date | undefined {
  const lower = content.toLowerCase();
  const today = startOfDay(now);

  if (/\btoday\b/.test(lower)) {
    return today;
  }

  if (/\btomorrow\b/.test(lower)) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  }

  const weekdayMatch = lower.match(
    /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/,
  );
  if (weekdayMatch) {
    const dayMap: Record<string, number> = {
      sun: 0,
      sunday: 0,
      mon: 1,
      monday: 1,
      tue: 2,
      tues: 2,
      tuesday: 2,
      wed: 3,
      wednesday: 3,
      thu: 4,
      thurs: 4,
      thursday: 4,
      fri: 5,
      friday: 5,
      sat: 6,
      saturday: 6,
    };
    const targetDay = dayMap[weekdayMatch[1]];
    if (targetDay !== undefined) {
      const currentDay = today.getDay();
      const delta = (targetDay - currentDay + 7) % 7;
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + delta);
    }
  }

  const dateMatch = lower.match(
    /\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])(?:[\/-](\d{2,4}))?\b/,
  );
  if (dateMatch) {
    const month = Number(dateMatch[1]) - 1;
    const day = Number(dateMatch[2]);
    const yearText = dateMatch[3];
    const year = yearText
      ? yearText.length === 2
        ? 2000 + Number(yearText)
        : Number(yearText)
      : today.getFullYear();
    return new Date(year, month, day);
  }

  return undefined;
}

function formatModifiedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TasksScreen() {
  const {
    lists,
    activeListId,
    selectList,
    tasks: taskRows,
    newTaskText,
    setNewTaskText,
    isEditingTitle,
    setIsEditingTitle,
    titleEdit,
    setTitleEdit,
    listStatsById,
    activeTitle,
    reloadActiveTasks,
    createNewList,
    toggleTask,
    saveTitleEdit,
  } = useTasksFeature();
  const [isLocked, setIsLocked] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState<Priority>('normal');
  const [addTaskError, setAddTaskError] = React.useState<string | null>(null);
  const [orderedTaskIds, setOrderedTaskIds] = React.useState<string[]>([]);
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);

  const storageKey = React.useMemo(
    () => (activeListId ? `opp_task_order_${activeListId}` : null),
    [activeListId],
  );

  const tasks: Task[] = React.useMemo(
    () =>
      taskRows.map((task) => ({
        id: task.id,
        title: task.content,
        done: task.is_done,
        priority: extractPriority(task.content),
        time: extractTime(task.content),
        scheduledFor: extractTargetDate(task.content),
      })),
    [taskRows],
  );

  React.useEffect(() => {
    if (!storageKey) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setOrderedTaskIds(parsed);
      }
    } catch {
      // Ignore malformed client storage and continue with fresh ordering.
    }
  }, [storageKey]);

  React.useEffect(() => {
    setOrderedTaskIds((previous) => {
      const availableIds = new Set(tasks.map((task) => task.id));
      const kept = previous.filter((id) => availableIds.has(id));
      const appended = tasks.map((task) => task.id).filter((id) => !kept.includes(id));
      return [...kept, ...appended];
    });
  }, [tasks]);

  React.useEffect(() => {
    if (!storageKey) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(orderedTaskIds));
  }, [orderedTaskIds, storageKey]);

  const orderedTasks = React.useMemo(() => {
    if (orderedTaskIds.length === 0) {
      return tasks;
    }

    const position = new Map(orderedTaskIds.map((id, index) => [id, index]));
    return [...tasks].sort((a, b) => (position.get(a.id) ?? 9999) - (position.get(b.id) ?? 9999));
  }, [orderedTaskIds, tasks]);

  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const high = tasks.filter((task) => task.priority === 'high').length;
  const today = React.useMemo(() => new Date(), []);
  const scheduledTasks = tasks.filter(
    (task) => task.time && (!task.scheduledFor || isSameDay(task.scheduledFor, today)),
  );
  const scheduled = scheduledTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const weights: Record<Priority, number> = { high: 3, normal: 2, low: 1 };
  const pointsTotal = tasks.reduce((acc, task) => acc + weights[task.priority], 0);
  const pointsDone = tasks.reduce((acc, task) => acc + (task.done ? weights[task.priority] : 0), 0);
  const weightedPct = pointsTotal ? Math.round((pointsDone / pointsTotal) * 100) : 0;

  const timed = scheduledTasks
    .slice()
    .sort((a, b) => (a.time! > b.time! ? 1 : -1));

  const sortWithinPriority = (input: Task[]) =>
    [...input].sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      if (a.time && b.time) {
        return a.time > b.time ? 1 : -1;
      }
      if (a.time && !b.time) {
        return -1;
      }
      if (!a.time && b.time) {
        return 1;
      }
      return a.title.localeCompare(b.title);
    });

  const groups: { label: string; items: Task[] }[] = [
    { label: 'HIGH PRIORITY', items: sortWithinPriority(orderedTasks.filter((task) => task.priority === 'high')) },
    { label: 'NORMAL', items: sortWithinPriority(orderedTasks.filter((task) => task.priority === 'normal')) },
    { label: 'LOW', items: sortWithinPriority(orderedTasks.filter((task) => task.priority === 'low')) },
  ].filter((group) => group.items.length > 0);

  const canEdit = !isLocked;
  const currentHour = new Date().getHours();
  const sessionStatus = total === 0 ? 'ACTIVE' : done === total ? 'COMPLETE' : 'IN PROGRESS';

  const moveTask = React.useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }
    setOrderedTaskIds((previous) => {
      const next = [...previous];
      const sourceIndex = next.indexOf(sourceId);
      const targetIndex = next.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return previous;
      }
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }, []);

  const moveTaskFromTouchPoint = React.useCallback(
    (sourceId: string, clientX: number, clientY: number) => {
      const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const taskCard = element?.closest('[data-task-id]') as HTMLElement | null;
      const targetId = taskCard?.dataset.taskId;
      if (targetId) {
        moveTask(sourceId, targetId);
      }
    },
    [moveTask],
  );

  const handleArchiveSelect = React.useCallback(
    (listId: string) => {
      setIsLocked(false);
      setNewTaskText('');
      setSelectedPriority('normal');
      setDraggedTaskId(null);
      selectList(listId);
    },
    [selectList, setNewTaskText],
  );

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-[0.25em] text-blue-500/90">ACTIVE SESSION</div>

              <div className="mt-3">
                <div className="flex items-end gap-3">
                  <h1 className="text-6xl font-extrabold tracking-tight md:text-7xl">{APP_CONFIG.shortName}</h1>
                  <span className="mb-1 text-2xl font-black text-blue-400/90">{APP_CONFIG.yearMark}</span>
                </div>
                {isEditingTitle ? (
                  <input
                    value={titleEdit}
                    disabled={!canEdit}
                    onChange={(event) => setTitleEdit(event.target.value)}
                    onBlur={() => {
                      void saveTitleEdit();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void saveTitleEdit();
                      }
                    }}
                    className={[
                      'mt-3 w-full bg-transparent text-2xl font-bold tracking-tight outline-none md:text-3xl',
                      canEdit ? 'opacity-100' : 'opacity-70',
                    ].join(' ')}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setIsEditingTitle(true);
                      setTitleEdit(activeTitle);
                    }}
                    className={[
                      'mt-3 text-left text-2xl font-bold tracking-tight md:text-3xl',
                      canEdit ? 'opacity-100 hover:text-blue-300' : 'opacity-70',
                    ].join(' ')}
                  >
                    {activeTitle}
                  </button>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{getTodayLabel()}</div>

                <button
                  type="button"
                  onClick={() => setIsLocked((value) => !value)}
                  className={[
                    'rounded-full border px-3 py-1',
                    isLocked
                      ? 'border-white/10 bg-white/5 text-white/70'
                      : 'border-blue-500/40 bg-blue-500/10 text-blue-200',
                  ].join(' ')}
                >
                  {isLocked ? 'LOCKED' : 'UNLOCKED'}
                </button>

                <div
                  className={[
                    'rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
                    sessionStatus === 'COMPLETE'
                      ? 'border-[color:var(--state-completed)]/50 text-[color:var(--state-completed)] bg-emerald-500/10'
                      : sessionStatus === 'IN PROGRESS'
                        ? 'border-[color:var(--state-active)]/50 text-[color:var(--state-active)] bg-blue-500/10'
                        : 'border-[color:var(--state-active)]/40 text-[color:var(--state-active)]/90 bg-blue-500/5',
                  ].join(' ')}
                >
                  {sessionStatus}
                </div>

                <div className="text-white/80">{total} tasks | {high} high priority | {scheduled} scheduled</div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs font-semibold tracking-[0.2em] text-white/50">COMPLETION</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{pct}%</div>
                    <div className="text-sm text-white/60">{done}/{total}</div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-[999px] bg-white/8">
                    <div className="h-2 rounded-full bg-blue-500/80" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs font-semibold tracking-[0.2em] text-white/50">WEIGHTED</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{weightedPct}%</div>
                    <div className="text-sm text-white/60">{pointsDone}/{pointsTotal}</div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-[999px] bg-white/8">
                    <div className="h-2 rounded-full bg-blue-500/80" style={{ width: `${weightedPct}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs font-semibold tracking-[0.2em] text-white/50">SCHEDULED</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{scheduled}</div>
                    <div className="text-sm text-white/60">items</div>
                  </div>
                  <div className="mt-2 text-sm text-white/60">Only tasks with a time appear on the rail.</div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-2 lg:w-[260px] lg:justify-end">
              <button
                type="button"
                onClick={() => {
                  void createNewList();
                }}
                className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                New Session
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/20 bg-transparent px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white"
              >
                Duplicate
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-white/55 hover:bg-white/5 hover:text-white/80"
              >
                Export
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-[208px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-xs font-semibold tracking-[0.25em] text-white/50">SCHEDULE</div>

            <div className="space-y-2">
              {hours.map((hour) => {
                const label = formatHour(hour);
                const isCurrentHour = hour === currentHour;
                const slotTasks = timed.filter((task) => Number(task.time!.split(':')[0]) === hour);

                return (
                  <div key={hour} className="flex items-start gap-3">
                    <div className="w-11 shrink-0 pt-1 text-xs text-white/75">{label}</div>

                    <div
                      className={[
                        'min-h-[22px] flex-1 border-l pl-3',
                        isCurrentHour ? 'border-[color:var(--state-active)]/85' : 'border-white/20',
                      ].join(' ')}
                    >
                      {slotTasks.length === 0 ? (
                        <div className="flex h-5 items-center">
                          {isCurrentHour ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--state-active)]" />
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slotTasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className={task.done ? 'line-through text-white/45' : ''}>{task.title}</div>
                                <div className="text-xs text-white/45">{formatDisplayTime(task.time!)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4">
              <div className="text-xs font-semibold tracking-[0.25em] text-white/50">WORK STACK</div>

              <form
                action={async (formData) => {
                  if (!activeListId || !newTaskText.trim()) {
                    return;
                  }

                  try {
                    setAddTaskError(null);
                    formData.set('list_id', activeListId);
                    formData.set('content', withPriorityTag(newTaskText, selectedPriority));
                    await createTaskAction(formData);
                    setNewTaskText('');
                    await reloadActiveTasks();
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Could not create task';
                    setAddTaskError(
                      process.env.NODE_ENV === 'development' ? message : 'Could not create task',
                    );
                  }
                }}
                className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <input type="hidden" name="list_id" value={activeListId ?? ''} />
                <input
                  type="hidden"
                  name="content"
                  value={withPriorityTag(newTaskText, selectedPriority)}
                />
                <input
                  value={newTaskText}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setNewTaskText(event.target.value);
                    if (addTaskError) {
                      setAddTaskError(null);
                    }
                  }}
                  placeholder="Add task...  (use @6pm or @6:30pm, #high)"
                  className="min-h-[48px] flex-1 bg-transparent text-base outline-none placeholder:text-white/40"
                />
                <button
                  type="submit"
                  disabled={!canEdit || !newTaskText.trim()}
                  className={[
                    'min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold',
                    canEdit ? 'bg-white text-black hover:opacity-90' : 'bg-white/20 text-white/50',
                  ].join(' ')}
                >
                  Add
                </button>
              </form>
              <div className="mt-2 flex items-center gap-2">
                {(['high', 'normal', 'low'] as Priority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setSelectedPriority(priority)}
                    className={[
                      'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                      selectedPriority === priority
                        ? priority === 'high'
                          ? 'border-[color:var(--priority-high)]/60 text-[color:var(--priority-high)] bg-red-500/10'
                          : priority === 'low'
                            ? 'border-[color:var(--priority-low)]/60 text-[color:var(--priority-low)] bg-white/10'
                            : 'border-[color:var(--priority-normal)]/60 text-[color:var(--priority-normal)] bg-blue-500/10'
                        : 'border-white/10 text-white/45 hover:text-white/70',
                    ].join(' ')}
                  >
                    {priority}
                  </button>
                ))}
              </div>
              {addTaskError ? <p className="mt-3 text-sm text-red-300">{addTaskError}</p> : null}
            </div>

            <div className="space-y-5">
              {groups.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/55">
                  No tasks yet. Add your first item above.
                </div>
              ) : null}

              {groups.map((group) => (
                <section key={group.label}>
                  <div className="mb-2 text-xs font-semibold tracking-[0.25em] text-white/50">{group.label}</div>

                  <div className="space-y-2">
                    {group.items.map((task) => (
                      <div
                        key={task.id}
                        data-task-id={task.id}
                        className={[
                          'flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3',
                          draggedTaskId === task.id ? 'opacity-60' : '',
                          task.done ? 'opacity-80' : '',
                        ].join(' ')}
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={() => {
                          if (draggedTaskId) {
                            moveTask(draggedTaskId, task.id);
                          }
                        }}
                      >
                        <label className="flex min-h-[48px] min-w-[48px] items-center justify-center p-1">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => {
                              void toggleTask(task.id, task.done);
                            }}
                            className="h-6 w-6 accent-blue-500"
                          />
                        </label>

                        <div className="flex-1">
                          <div className={task.done ? 'line-through text-white/45' : ''}>{task.title}</div>
                          <div className="mt-2 text-xs text-white/55">
                            {task.time ? `@ ${formatDisplayTime(task.time)}` : '-'}
                            <span className="mx-2">|</span>
                            <span
                              className={[
                                task.priority === 'high'
                                  ? 'text-[color:var(--priority-high)]'
                                  : task.priority === 'normal'
                                    ? 'text-[color:var(--priority-normal)]'
                                    : 'text-[color:var(--priority-low)]',
                              ].join(' ')}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                            {task.done ? (
                              <>
                                <span className="mx-2">|</span>
                                <span className="text-[color:var(--state-completed)]">COMPLETED</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            draggable
                            onDragStart={() => {
                              setDraggedTaskId(task.id);
                            }}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                            }}
                            onTouchStart={(event) => {
                              event.preventDefault();
                              setDraggedTaskId(task.id);
                            }}
                            onTouchMove={(event) => {
                              event.preventDefault();
                              const touch = event.touches[0];
                              if (touch) {
                                moveTaskFromTouchPoint(task.id, touch.clientX, touch.clientY);
                              }
                            }}
                            onTouchEnd={() => {
                              setDraggedTaskId(null);
                            }}
                            aria-label="Drag to reorder task"
                            className="cursor-grab rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/45 hover:bg-white/10 hover:text-white/70 active:cursor-grabbing touch-none select-none"
                          >
                            <GripVertical size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </main>
        </div>

        <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold tracking-[0.25em] text-white/50">ARCHIVED LOGS</div>
            <div className="text-xs text-[color:var(--state-archived)]">{lists.length} total sessions</div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <input
              placeholder="Search history..."
              className="flex-1 bg-transparent text-base outline-none placeholder:text-white/30"
            />
          </div>

          <div className="mt-4 space-y-2 text-sm text-white/45">
            {lists.slice(0, 6).map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => handleArchiveSelect(list.id)}
                className={[
                  'block w-full rounded-xl border bg-black/30 px-3 py-2.5 text-left transition-colors',
                  activeListId === list.id
                    ? 'border-[color:var(--state-active)]/80 bg-blue-500/10 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.25)]'
                    : 'border-white/10 text-[color:var(--state-archived)] hover:bg-black/50',
                ].join(' ')}
              >
                <div className="truncate font-medium text-white/95">{list.title}</div>
                <div className="mt-1 text-xs text-white/60">
                  {(() => {
                    const stats = listStatsById[list.id];
                    if (!stats) {
                      return `${new Date(list.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })} | --% | -- tasks | updated ${formatModifiedDate(list.created_at)}`;
                    }
                    return `${stats.completionPct}% complete | ${stats.totalTasks} tasks | updated ${formatModifiedDate(stats.modifiedAt)}`;
                  })()}
                </div>
              </button>
            ))}
            {lists.length === 0 ? <div>No archived sessions yet.</div> : null}
            {lists.length > 6 ? (
              <div className="text-xs text-white/35">Showing latest 6 sessions.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

