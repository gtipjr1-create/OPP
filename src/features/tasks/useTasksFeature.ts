'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { reportClientError } from '@/lib/telemetry';

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
import {
  applyCreateToStats,
  applyDeleteToStats,
  applyDeleteToTasks,
  applyToggleToStats,
  applyToggleToTasks,
} from './lib/taskWorkflow';

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

function errorMessageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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

  const handleClientFailure = useCallback(
    (event: string, fallbackMessage: string, error: unknown, context?: Record<string, unknown>) => {
      const message = errorMessageFrom(error, fallbackMessage);
      reportClientError(event, error, context);
      setErrorMessage(message);
      return message;
    },
    [],
  );

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
        handleClientFailure('tasks.bootstrap.list_lists_failed', 'Failed to load sessions.', error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [handleClientFailure]);

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
        handleClientFailure('tasks.bootstrap.list_tasks_failed', 'Failed to load tasks.', error, {
          activeListId,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeListId, handleClientFailure]);

  const reloadActiveTasks = useCallback(async () => {
    if (!activeListId) {
      return;
    }

    try {
      const data = await listTasks(activeListId);
      setTasks(data);
      setErrorMessage(null);
    } catch (error) {
      handleClientFailure('tasks.reload_active_tasks_failed', 'Failed to load tasks.', error, { activeListId });
    }
  }, [activeListId, handleClientFailure]);

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
      const message = handleClientFailure('tasks.create_session_failed', 'Failed to create session.', error);
      throw error instanceof Error ? error : new Error(message);
    }
  }, [handleClientFailure]);

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
        return {
          ...previous,
          [activeListId]: applyCreateToStats(previous[activeListId], created),
        };
      });
      setNewTaskText('');
      setErrorMessage(null);
    } catch (error) {
      handleClientFailure('tasks.add_failed', 'Failed to add task.', error, { activeListId });
    }
  }, [activeListId, handleClientFailure, newTaskText]);

  const toggleTask = useCallback(async (taskId: string, currentStatus: boolean) => {
    if (!activeListId) {
      return;
    }

    try {
      await setTaskDone(taskId, !currentStatus);
      setTasks((previous) => applyToggleToTasks(previous, taskId, !currentStatus));
      setListStatsById((previous) => {
        const current = previous[activeListId];
        if (!current) {
          return previous;
        }
        return {
          ...previous,
          [activeListId]: applyToggleToStats(current, !currentStatus, new Date().toISOString()),
        };
      });
      setErrorMessage(null);
    } catch (error) {
      handleClientFailure('tasks.toggle_failed', 'Failed to toggle task.', error, {
        activeListId,
        taskId,
        nextStatus: !currentStatus,
      });
    }
  }, [activeListId, handleClientFailure]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!activeListId) {
      return;
    }

    try {
      const taskToDelete = tasks.find((task) => task.id === taskId);
      await removeTask(taskId);
      setTasks((previous) => applyDeleteToTasks(previous, taskId));
      if (taskToDelete) {
        setListStatsById((previous) => {
          const current = previous[activeListId];
          if (!current) {
            return previous;
          }
          return {
            ...previous,
            [activeListId]: applyDeleteToStats(current, taskToDelete.is_done, new Date().toISOString()),
          };
        });
      }
      setErrorMessage(null);
    } catch (error) {
      handleClientFailure('tasks.delete_failed', 'Failed to delete task.', error, { activeListId, taskId });
    }
  }, [activeListId, handleClientFailure, tasks]);

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
      handleClientFailure('tasks.rename_failed', 'Failed to save task.', error, { taskId });
    }
  }, [handleClientFailure]);

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
      handleClientFailure('sessions.rename_failed', 'Failed to rename session.', error, { activeListId });
    }
  }, [activeListId, handleClientFailure, titleEdit]);

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
        handleClientFailure('sessions.delete_failed', 'Failed to delete session.', error, { listId });
      }
    },
    [activeListId, handleClientFailure],
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
    reloadActiveTasks,
    createNewList,
    addTask,
    toggleTask,
    deleteTask,
    saveTaskEdit,
    saveTitleEdit,
    deleteList,
  };
}
