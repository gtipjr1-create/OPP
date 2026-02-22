'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createList,
  createTask,
  formatDefaultListTitle,
  listLists,
  listTasksForLists,
  listTasks,
  removeList,
  removeTask,
  renameList,
  renameTask,
  setTaskDone,
} from './service';
import type { ListRow, TaskRow } from './types';

type ListStats = {
  totalTasks: number;
  completedTasks: number;
  completionPct: number;
  modifiedAt: string;
};

function buildStatsMap(lists: ListRow[], allTasks: TaskRow[]): Record<string, ListStats> {
  const tasksByListId = new Map<string, TaskRow[]>();
  for (const task of allTasks) {
    const bucket = tasksByListId.get(task.list_id);
    if (bucket) {
      bucket.push(task);
    } else {
      tasksByListId.set(task.list_id, [task]);
    }
  }

  const stats: Record<string, ListStats> = {};
  for (const list of lists) {
    const tasks = tasksByListId.get(list.id) ?? [];
    const total = tasks.length;
    const completed = tasks.filter((task) => task.is_done).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const newestTaskDate = tasks
      .map((task) => task.created_at)
      .sort((a, b) => (a > b ? -1 : 1))[0];

    stats[list.id] = {
      totalTasks: total,
      completedTasks: completed,
      completionPct,
      modifiedAt: newestTaskDate ?? list.created_at,
    };
  }

  return stats;
}

export function useTasksFeature() {
  const [lists, setLists] = useState<ListRow[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleEdit, setTitleEdit] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [listStatsById, setListStatsById] = useState<Record<string, ListStats>>({});

  useEffect(() => {
    let cancelled = false;

    listLists()
      .then(async (data) => {
        if (cancelled) {
          return;
        }

        setErrorMessage(null);
        setLists(data);
        const tasksForLists = await listTasksForLists(data.map((list) => list.id));
        if (!cancelled) {
          setListStatsById(buildStatsMap(data, tasksForLists));
        }
        if (data.length > 0) {
          setActiveListId((previous) => previous ?? data[0].id);
          setTitleEdit(data[0].title);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to load sessions.';
        setErrorMessage(message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeListId) {
      return;
    }

    let cancelled = false;

    listTasks(activeListId)
      .then((data) => {
        if (!cancelled) {
          setErrorMessage(null);
          setTasks(data);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to load tasks.';
        setErrorMessage(message);
      });

    return () => {
      cancelled = true;
    };
  }, [activeListId]);

  const selectList = useCallback(
    (listId: string) => {
      const selected = lists.find((list) => list.id === listId);
      setActiveListId(listId);
      setEditingTaskId(null);
      setIsEditingTitle(false);
      if (selected) {
        setTitleEdit(selected.title);
      }
      setErrorMessage(null);
    },
    [lists],
  );

  const createNewList = useCallback(async () => {
    const nextTitle = formatDefaultListTitle();

    try {
      const created = await createList(nextTitle);
      setLists((previous) => [created, ...previous]);
      setListStatsById((previous) => ({
        ...previous,
        [created.id]: {
          totalTasks: 0,
          completedTasks: 0,
          completionPct: 0,
          modifiedAt: created.created_at,
        },
      }));
      setActiveListId(created.id);
      setTasks([]);
      setEditingTaskId(null);
      setIsEditingTitle(false);
      setTitleEdit(created.title);
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session.';
      setErrorMessage(message);
    }
  }, []);

  const addTask = useCallback(async (contentOverride?: string) => {
    if (!activeListId) {
      return;
    }

    const content = (contentOverride ?? newTaskText).trim();
    if (!content) {
      return;
    }

    try {
      const created = await createTask(activeListId, content);
      setTasks((previous) => [created, ...previous]);
      setListStatsById((previous) => {
        const current = previous[activeListId] ?? {
          totalTasks: 0,
          completedTasks: 0,
          completionPct: 0,
          modifiedAt: created.created_at,
        };
        const nextTotal = current.totalTasks + 1;
        const nextCompleted = current.completedTasks + (created.is_done ? 1 : 0);
        return {
          ...previous,
          [activeListId]: {
            totalTasks: nextTotal,
            completedTasks: nextCompleted,
            completionPct: nextTotal > 0 ? Math.round((nextCompleted / nextTotal) * 100) : 0,
            modifiedAt: created.created_at,
          },
        };
      });
      setNewTaskText('');
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add task.';
      setErrorMessage(message);
    }
  }, [activeListId, newTaskText]);

  const toggleTask = useCallback(async (taskId: string, currentStatus: boolean) => {
    if (!activeListId) {
      return;
    }

    try {
      await setTaskDone(taskId, !currentStatus);
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId ? { ...task, is_done: !currentStatus } : task,
        ),
      );
      setListStatsById((previous) => {
        const current = previous[activeListId];
        if (!current) {
          return previous;
        }
        const nextCompleted = current.completedTasks + (!currentStatus ? 1 : -1);
        return {
          ...previous,
          [activeListId]: {
            ...current,
            completedTasks: nextCompleted,
            completionPct:
              current.totalTasks > 0 ? Math.round((nextCompleted / current.totalTasks) * 100) : 0,
            modifiedAt: new Date().toISOString(),
          },
        };
      });
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle task.';
      setErrorMessage(message);
    }
  }, [activeListId]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!activeListId) {
      return;
    }

    try {
      const taskToDelete = tasks.find((task) => task.id === taskId);
      await removeTask(taskId);
      setTasks((previous) => previous.filter((task) => task.id !== taskId));
      if (taskToDelete) {
        setListStatsById((previous) => {
          const current = previous[activeListId];
          if (!current) {
            return previous;
          }
          const nextTotal = Math.max(0, current.totalTasks - 1);
          const nextCompleted =
            current.completedTasks - (taskToDelete.is_done ? 1 : 0);
          return {
            ...previous,
            [activeListId]: {
              ...current,
              totalTasks: nextTotal,
              completedTasks: Math.max(0, nextCompleted),
              completionPct:
                nextTotal > 0 ? Math.round((Math.max(0, nextCompleted) / nextTotal) * 100) : 0,
              modifiedAt: new Date().toISOString(),
            },
          };
        });
      }
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task.';
      setErrorMessage(message);
    }
  }, [activeListId, tasks]);

  const saveTaskEdit = useCallback(async (taskId: string, nextText: string) => {
    const content = nextText.trim();
    if (!content) {
      setEditingTaskId(null);
      return;
    }

    try {
      await renameTask(taskId, content);
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId ? { ...task, content } : task,
        ),
      );
      setEditingTaskId(null);
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save task.';
      setErrorMessage(message);
    }
  }, []);

  const saveTitleEdit = useCallback(async () => {
    if (!activeListId) {
      setIsEditingTitle(false);
      return;
    }

    const title = titleEdit.trim();
    if (!title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await renameList(activeListId, title);
      setLists((previous) =>
        previous.map((list) =>
          list.id === activeListId ? { ...list, title } : list,
        ),
      );
      setIsEditingTitle(false);
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename session.';
      setErrorMessage(message);
    }
  }, [activeListId, titleEdit]);

  const deleteList = useCallback(
    async (listId: string) => {
      try {
        await removeList(listId);
        setLists((previous) => {
          const updated = previous.filter((list) => list.id !== listId);
          if (activeListId === listId) {
            const nextActiveId = updated[0]?.id ?? null;
            setActiveListId(nextActiveId);
            setTasks([]);
            setEditingTaskId(null);
            setIsEditingTitle(false);
            setTitleEdit(updated[0]?.title ?? '');
          }
          return updated;
        });
        setListStatsById((previous) => {
          const next = { ...previous };
          delete next[listId];
          return next;
        });
        setErrorMessage(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete session.';
        setErrorMessage(message);
      }
    },
    [activeListId],
  );

  const activeTitle = useMemo(
    () => lists.find((list) => list.id === activeListId)?.title ?? 'NEW SESSION',
    [activeListId, lists],
  );

  return {
    lists,
    activeListId,
    selectList,
    tasks,
    loading,
    newTaskText,
    setNewTaskText,
    editingTaskId,
    setEditingTaskId,
    isEditingTitle,
    setIsEditingTitle,
    titleEdit,
    setTitleEdit,
    listStatsById,
    errorMessage,
    activeTitle,
    createNewList,
    addTask,
    toggleTask,
    deleteTask,
    saveTaskEdit,
    saveTitleEdit,
    deleteList,
  };
}
