'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createList,
  createTask,
  formatDefaultListTitle,
  listLists,
  listTasks,
  removeList,
  removeTask,
  renameList,
  renameTask,
  setTaskDone,
} from './service';
import type { ListRow, TaskRow } from './types';

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

  useEffect(() => {
    let cancelled = false;

    listLists()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setErrorMessage(null);
        setLists(data);
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

  const addTask = useCallback(async () => {
    if (!activeListId) {
      return;
    }

    const content = newTaskText.trim();
    if (!content) {
      return;
    }

    try {
      const created = await createTask(activeListId, content);
      setTasks((previous) => [created, ...previous]);
      setNewTaskText('');
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add task.';
      setErrorMessage(message);
    }
  }, [activeListId, newTaskText]);

  const toggleTask = useCallback(async (taskId: string, currentStatus: boolean) => {
    try {
      await setTaskDone(taskId, !currentStatus);
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId ? { ...task, is_done: !currentStatus } : task,
        ),
      );
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle task.';
      setErrorMessage(message);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await removeTask(taskId);
      setTasks((previous) => previous.filter((task) => task.id !== taskId));
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task.';
      setErrorMessage(message);
    }
  }, []);

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
