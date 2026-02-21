'use client';

import React from 'react';

import { APP_CONFIG } from '@/config/app';

import { useTasksFeature } from '../useTasksFeature';

type Priority = 'high' | 'normal' | 'low';

type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  time?: string;
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
  return `${weekday} • ${date}`;
}

function extractTime(content: string): string | undefined {
  const match = content.match(/@([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

function extractPriority(content: string): Priority {
  const lower = content.toLowerCase();
  if (lower.includes('#high')) {
    return 'high';
  }
  if (lower.includes('#low')) {
    return 'low';
  }
  return 'normal';
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
    errorMessage,
    activeTitle,
    createNewList,
    addTask,
    toggleTask,
    saveTitleEdit,
  } = useTasksFeature();
  const [isLocked, setIsLocked] = React.useState(false);

  const tasks: Task[] = React.useMemo(
    () =>
      taskRows.map((task) => ({
        id: task.id,
        title: task.content,
        done: task.is_done,
        priority: extractPriority(task.content),
        time: extractTime(task.content),
      })),
    [taskRows],
  );

  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const high = tasks.filter((task) => task.priority === 'high').length;
  const scheduled = tasks.filter((task) => Boolean(task.time)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const weights: Record<Priority, number> = { high: 3, normal: 2, low: 1 };
  const pointsTotal = tasks.reduce((acc, task) => acc + weights[task.priority], 0);
  const pointsDone = tasks.reduce((acc, task) => acc + (task.done ? weights[task.priority] : 0), 0);
  const weightedPct = pointsTotal ? Math.round((pointsDone / pointsTotal) * 100) : 0;

  const timed = tasks
    .filter((task) => task.time)
    .slice()
    .sort((a, b) => (a.time! > b.time! ? 1 : -1));

  const groups: { label: string; items: Task[] }[] = [
    { label: 'HIGH PRIORITY', items: tasks.filter((task) => task.priority === 'high') },
    { label: 'NORMAL', items: tasks.filter((task) => task.priority === 'normal') },
    { label: 'LOW', items: tasks.filter((task) => task.priority === 'low') },
  ].filter((group) => group.items.length > 0);

  const canEdit = !isLocked;

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.25em] text-blue-500/90">
                ACTIVE SESSION
              </div>

              <div className="mt-2">
                <div className="flex items-end gap-3">
                  <h1 className="text-5xl font-extrabold tracking-tight">{APP_CONFIG.shortName}</h1>
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
                      'mt-2 w-full bg-transparent text-2xl font-bold tracking-tight outline-none',
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
                      'mt-2 text-left text-2xl font-bold tracking-tight',
                      canEdit ? 'opacity-100 hover:text-blue-300' : 'opacity-70',
                    ].join(' ')}
                  >
                    {activeTitle}
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {getTodayLabel()}
                </div>

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

                <div className="text-white/60">•</div>

                <div className="text-white/70">
                  {total} tasks • {high} high priority • {scheduled} scheduled
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs font-semibold tracking-[0.2em] text-white/50">
                    COMPLETION
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{pct}%</div>
                    <div className="text-sm text-white/60">
                      {done}/{total}
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-blue-500/80"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs font-semibold tracking-[0.2em] text-white/50">
                    WEIGHTED
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{weightedPct}%</div>
                    <div className="text-sm text-white/60">
                      {pointsDone}/{pointsTotal}
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-blue-500/80"
                      style={{ width: `${weightedPct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs font-semibold tracking-[0.2em] text-white/50">
                    SCHEDULED
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{scheduled}</div>
                    <div className="text-sm text-white/60">items</div>
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    Only tasks with a time appear on the rail.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  void createNewList();
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
              >
                New Session
              </button>
              <button
                type="button"
                disabled
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold opacity-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                disabled
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold opacity-50"
              >
                Export
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-xs font-semibold tracking-[0.25em] text-white/50">
              SCHEDULE
            </div>

            <div className="space-y-2">
              {hours.map((hour) => {
                const label = formatHour(hour);
                const slotTasks = timed.filter((task) => {
                  const taskHour = Number(task.time!.split(':')[0]);
                  return taskHour === hour;
                });

                return (
                  <div key={hour} className="flex items-start gap-3">
                    <div className="w-12 shrink-0 pt-1 text-xs text-white/45">
                      {label}
                    </div>

                    <div className="min-h-[22px] flex-1 border-l border-white/10 pl-3">
                      {slotTasks.length === 0 ? (
                        <div className="h-5" />
                      ) : (
                        <div className="space-y-2">
                          {slotTasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className={task.done ? 'line-through text-white/45' : ''}>
                                  {task.title}
                                </div>
                                <div className="text-xs text-white/45">{task.time}</div>
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
              <div className="text-xs font-semibold tracking-[0.25em] text-white/50">
                WORK STACK
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <input
                  value={newTaskText}
                  disabled={!canEdit}
                  onChange={(event) => setNewTaskText(event.target.value)}
                  placeholder="Add task...  (use @18:00, #high)"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-white/30"
                />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    void addTask();
                  }}
                  className={[
                    'rounded-xl px-4 py-2 text-sm font-semibold',
                    canEdit ? 'bg-white text-black hover:opacity-90' : 'bg-white/20 text-white/50',
                  ].join(' ')}
                >
                  Add
                </button>
              </div>
              {errorMessage ? (
                <p className="mt-3 text-sm text-red-300">{errorMessage}</p>
              ) : null}
            </div>

            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.label}>
                  <div className="mb-2 text-xs font-semibold tracking-[0.25em] text-white/50">
                    {group.label}
                  </div>

                  <div className="space-y-2">
                    {group.items.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {
                            void toggleTask(task.id, task.done);
                          }}
                          className="h-5 w-5 accent-blue-500"
                        />

                        <div className="flex-1">
                          <div className={task.done ? 'line-through text-white/45' : ''}>
                            {task.title}
                          </div>
                          <div className="mt-1 text-xs text-white/45">
                            {task.time ? `@ ${task.time}` : '-'}
                            <span className="mx-2">•</span>
                            {task.priority.toUpperCase()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                          >
                            ↓
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

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold tracking-[0.25em] text-white/50">
              ARCHIVED LOGS
            </div>
            <div className="text-xs text-white/45">{lists.length} total sessions</div>
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
                onClick={() => selectList(list.id)}
                className={[
                  'block w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left',
                  activeListId === list.id ? 'text-white border-blue-500/60' : 'hover:bg-black/50',
                ].join(' ')}
              >
                {new Date(list.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                - {list.title}
              </button>
            ))}
            {lists.length === 0 ? (
              <div>No archived sessions yet.</div>
            ) : null}
            {lists.length > 6 ? (
              <div className="text-xs text-white/35">Showing latest 6 sessions.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
