'use client';

import React from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { OppMark } from '@/components/OppMark';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import InlineNotice from '@/components/ui/InlineNotice';
import LoadingMark from '@/components/ui/LoadingMark';
import SectionHeader from '@/components/ui/SectionHeader';
import ArchiveLogsPanel from './ArchiveLogsPanel';
import ScheduleRail from './ScheduleRail';
import StatsCards from './StatsCards';
import { selectScheduleDotPriorityByHour } from '../lib/scheduleDots';

import { createTaskAction, deleteTaskAction, reorderTaskPositionsAction } from '../actions';
import { useTasksFeature } from '../useTasksFeature';

type Priority = 'high' | 'normal' | 'low';

type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  taggedPriority?: Priority;
  time?: string;
  scheduledFor?: Date;
  section?: string;
};

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

function extractTaggedPriority(content: string): Priority | undefined {
  const lower = content.toLowerCase();
  if (/(?:^|\s)#high\b/.test(lower) || /(?:^|\s)#p1\b/.test(lower) || /\bp1\b/.test(lower)) {
    return 'high';
  }
  if (/(?:^|\s)#normal\b/.test(lower)) {
    return 'normal';
  }
  if (/(?:^|\s)#low\b/.test(lower)) {
    return 'low';
  }
  return undefined;
}

function withPriorityTag(content: string, priority: Priority): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return trimmed;
  }

  const hasExplicitPriority = /#high|#low|#normal|#p1|\bp1\b/i.test(trimmed);
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

type SortableTaskCardProps = {
  task: Task;
  canEdit: boolean;
  isActiveDrag: boolean;
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => Promise<void> | void;
  onSaveTask: (taskId: string, nextText: string) => Promise<void> | void;
};

function SortableTaskCard({
  task,
  canEdit,
  isActiveDrag,
  onToggleTask,
  onDeleteTask,
  onSaveTask,
}: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // ✅ Confirm delete (tap trash → confirm)
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(task.title);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(task.title);
    }
  }, [isEditing, task.title]);

  const openConfirmDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!canEdit || isDeleting) return;
    setConfirmDelete(true);
  };

  const cancelConfirmDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmDelete(false);
  };

  const confirmAndDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!canEdit || isDeleting) return;

    setIsDeleting(true);
    try {
      await Promise.resolve(onDeleteTask(task.id));
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const startEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!canEdit || isDeleting || isSavingEdit) return;
    setIsEditing(true);
    setIsExpanded(true);
    setEditValue(task.title);
  };

  const saveEdit = async () => {
    const next = editValue.trim();
    if (!next) {
      setIsEditing(false);
      setEditValue(task.title);
      return;
    }
    if (next === task.title) {
      setIsEditing(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      await Promise.resolve(onSaveTask(task.id, next));
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={[
        'draggable-row relative box-border grid w-full max-w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 sm:px-4 sm:py-3',
        isDragging || isActiveDrag ? 'opacity-60' : '',
        task.done ? 'opacity-80' : '',
      ].join(' ')}
    >
      <label className="flex min-h-[48px] min-w-[48px] items-center justify-center p-1">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggleTask(task.id, task.done)}
          aria-label={task.done ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
          className="h-6 w-6 accent-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          disabled={!canEdit}
        />
      </label>

      {isEditing ? (
        <div className="min-w-0 basis-0 flex-1 overflow-hidden rounded-md">
          <input
            value={editValue}
            disabled={!canEdit || isSavingEdit}
            onChange={(event) => setEditValue(event.target.value)}
            onBlur={() => {
              void saveEdit();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void saveEdit();
              }
              if (event.key === 'Escape') {
                setIsEditing(false);
                setEditValue(task.title);
              }
            }}
            className="min-h-[44px] w-full bg-transparent text-task font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            autoFocus
          />
          <div className="text-meta font-mono tracking-wide text-text-secondary">
            {isSavingEdit ? 'Saving...' : 'Press Enter to save'}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="min-w-0 basis-0 flex-1 overflow-hidden rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse task details' : 'Expand task details'}
        >
          <div
            className={[
              'block',
              isExpanded ? 'whitespace-normal break-words' : 'truncate',
              task.done ? 'line-through text-text-tertiary' : '',
            ].join(' ')}
          >
            {task.title}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta font-mono tracking-wide text-text-secondary">
            <span>{task.time ? `@ ${formatDisplayTime(task.time)}` : '-'}</span>
            <span className="text-text-tertiary">|</span>
            <span
              className={
                task.priority === 'high'
                  ? 'text-[color:var(--priority-high)]'
                  : task.priority === 'normal'
                    ? 'text-[color:var(--priority-normal)]'
                    : 'text-[color:var(--priority-low)]'
              }
            >
              {task.priority.toUpperCase()}
            </span>
            {task.done ? (
              <>
                <span className="text-text-tertiary">|</span>
                <span className="text-[color:var(--state-completed)]">COMPLETED</span>
              </>
            ) : null}
          </div>
        </button>
      )}

      {confirmDelete ? (
        <div className="absolute right-3 top-1/2 z-10 flex max-w-[calc(100%-5rem)] shrink-0 -translate-y-1/2 items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/80 px-2 py-1">
          <button
            type="button"
            onClick={cancelConfirmDelete}
            disabled={isDeleting}
            className="min-h-[40px] shrink-0 whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-3 text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <Button
            variant="danger"
            onClick={confirmAndDelete}
            disabled={isDeleting}
            className="min-h-[40px] shrink-0 whitespace-nowrap rounded-lg px-3"
          >
            {isDeleting ? '...' : 'Delete'}
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-end gap-1">
          <button
            type="button"
            onClick={startEdit}
            disabled={!canEdit || isDeleting || isSavingEdit}
            className="min-h-[42px] min-w-[42px] rounded-lg border border-white/10 bg-white/5 px-2 text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[44px] sm:min-w-[44px]"
            aria-label="Edit task"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={openConfirmDelete}
            disabled={!canEdit || isDeleting}
            className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-text-tertiary hover:bg-white/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[44px] sm:min-w-[44px]"
            aria-label="Delete task"
          >
            <Trash2 size={14} />
          </button>
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            disabled={!canEdit}
            aria-label="Drag to reorder task"
            className="drag-handle inline-flex min-h-[42px] min-w-[42px] cursor-grab items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-text-secondary active:scale-95 active:cursor-grabbing touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[44px] sm:min-w-[44px]"
            style={{ touchAction: 'none' }}
          >
            <GripVertical size={14} />
          </button>
        </div>
      )}
    </div>
  );
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
    errorMessage,
    loading,
    activeTitle,
    reloadActiveTasks,
    createNewList,
    saveTaskEdit,
    toggleTask,
    saveTitleEdit,
  } = useTasksFeature();
  const [isLocked, setIsLocked] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState<Priority>('normal');
  const [addTaskError, setAddTaskError] = React.useState<string | null>(null);
  const [orderSavedToast, setOrderSavedToast] = React.useState(false);
  const [newSessionError, setNewSessionError] = React.useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = React.useState(false);
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [isArchivedLogsOpen, setIsArchivedLogsOpen] = React.useState(false);
  const [orderedTaskIds, setOrderedTaskIds] = React.useState<string[]>([]);
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const orderedTaskIdsRef = React.useRef<string[]>([]);
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const tasks: Task[] = React.useMemo(
    () =>
      taskRows.map((task) => ({
        id: task.id,
        title: task.content,
        done: task.is_done,
        priority: task.priority ?? extractPriority(task.content),
        taggedPriority: task.tagged_priority ?? extractTaggedPriority(task.content),
        time: task.scheduled_time ? task.scheduled_time.slice(0, 5) : extractTime(task.content),
        scheduledFor: task.scheduled_for ? new Date(`${task.scheduled_for}T00:00:00`) : extractTargetDate(task.content),
      })),
    [taskRows],
  );

  React.useEffect(() => {
    const nextOrderedIds = tasks.map((task) => task.id);
    orderedTaskIdsRef.current = nextOrderedIds;
    setOrderedTaskIds(nextOrderedIds);
  }, [tasks]);

  React.useEffect(() => {
    orderedTaskIdsRef.current = orderedTaskIds;
  }, [orderedTaskIds]);

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
  const scheduleDotPriorityByHour = React.useMemo(() => selectScheduleDotPriorityByHour(timed), [timed]);

  const groups: { label: string; items: Task[] }[] = [
    { label: 'HIGH PRIORITY', items: orderedTasks.filter((task) => task.priority === 'high') },
    { label: 'NORMAL', items: orderedTasks.filter((task) => task.priority === 'normal') },
    { label: 'LOW', items: orderedTasks.filter((task) => task.priority === 'low') },
  ].filter((group) => group.items.length > 0);

  const canEdit = !isLocked;
  const currentHour = new Date().getHours();
  const sessionStatus = total === 0 ? 'ACTIVE' : done === total ? 'COMPLETE' : 'IN PROGRESS';

  const persistTaskOrder = React.useCallback(
    async (listId: string, orderedIds: string[]) => {
      if (!listId || orderedIds.length === 0) {
        return;
      }

      try {
        setIsSavingOrder(true);
        await reorderTaskPositionsAction(listId, orderedIds);
        setOrderSavedToast(true);
        window.setTimeout(() => {
          setOrderSavedToast(false);
        }, 1400);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not save task order';
        setAddTaskError(process.env.NODE_ENV === 'development' ? message : 'Could not save task order');
        await reloadActiveTasks();
      } finally {
        setIsSavingOrder(false);
      }
    },
    [reloadActiveTasks],
  );

  const handleArchiveSelect = React.useCallback(
    (listId: string) => {
      setIsLocked(false);
      setNewTaskText('');
      setSelectedPriority('normal');
      setNewSessionError(null);
      setActiveDragId(null);
      selectList(listId);
    },
    [selectList, setNewTaskText],
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);

      if (!over) {
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) {
        return;
      }

      const previous = orderedTaskIdsRef.current;
      const oldIndex = previous.indexOf(activeId);
      const newIndex = previous.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = arrayMove(previous, oldIndex, newIndex);
      orderedTaskIdsRef.current = reordered;
      setOrderedTaskIds(reordered);

      if (!activeListId) {
        console.error('[DND] Missing activeListId - cannot persist reorder');
        return;
      }

      await persistTaskOrder(activeListId, reordered);
    },
    [activeListId, persistTaskOrder],
  );

  const deleteTask = React.useCallback(
    async (taskId: string) => {
      try {
        await deleteTaskAction(taskId);
        await reloadActiveTasks();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not delete task';
        setAddTaskError(process.env.NODE_ENV === 'development' ? message : 'Could not delete task');
      }
    },
    [reloadActiveTasks],
  );

  if (loading) {
    return (
      <div className="min-h-dvh bg-black text-text-primary overflow-x-hidden">
        <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-5 pb-10 pt-8">
          <LoadingMark label="Loading session..." size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black text-text-primary overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-5 pb-10 pt-8">
        <header className="mb-8">
          {errorMessage ? (
            <InlineNotice variant="error" className="mb-4">
              {errorMessage}
            </InlineNotice>
          ) : null}
          {isSavingOrder ? (
            <InlineNotice variant="info" className="mb-4">
              Saving order...
            </InlineNotice>
          ) : null}

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <SectionHeader>ACTIVE SESSION</SectionHeader>

              <div className="mt-2">
                <div className="flex items-end justify-center gap-3">
                  <OppMark size={48} />
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
                      'mt-2 w-full bg-transparent text-center text-title font-sans uppercase tracking-tight font-bold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
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
                      'mt-2 w-full text-center text-title font-sans uppercase tracking-tight font-bold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                      canEdit ? 'opacity-100 hover:text-text-accent' : 'opacity-70',
                    ].join(' ')}
                  >
                    {activeTitle}
                  </button>
                )}
              </div>

              <div className="mt-2 flex flex-col items-center gap-2">
                <div className="flex flex-wrap items-center justify-center gap-3 text-meta font-mono tracking-wide text-text-secondary">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{getTodayLabel()}</div>

                  <button
                    type="button"
                    onClick={() => setIsLocked((value) => !value)}
                    aria-pressed={!isLocked}
                    aria-label={isLocked ? 'Unlock session editing' : 'Lock session editing'}
                    className={[
                      'rounded-full border px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                      isLocked ? 'border-white/10 bg-white/5 text-text-secondary' : 'border-blue-500/40 bg-blue-500/10 text-text-accent',
                    ].join(' ')}
                  >
                    {isLocked ? 'LOCKED' : 'UNLOCKED'}
                  </button>
                </div>

                <div
                  className={[
                    'rounded-full border px-3 py-1 text-label font-sans uppercase tracking-widest font-semibold',
                    sessionStatus === 'COMPLETE'
                      ? 'border-[color:var(--state-completed)]/50 text-[color:var(--state-completed)] bg-emerald-500/10'
                      : sessionStatus === 'IN PROGRESS'
                        ? 'border-[color:var(--state-active)]/50 text-[color:var(--state-active)] bg-blue-500/10'
                        : 'border-[color:var(--state-active)]/40 text-[color:var(--state-active)]/90 bg-blue-500/5',
                  ].join(' ')}
                >
                  {sessionStatus}
                </div>
              </div>

              <div className="mt-2 text-meta font-mono tracking-wide text-text-secondary">
                {total} tasks | {high} high priority | {scheduled} scheduled
              </div>

              <StatsCards
                pct={pct}
                done={done}
                total={total}
                weightedPct={weightedPct}
                pointsDone={pointsDone}
                pointsTotal={pointsTotal}
                scheduled={scheduled}
              />
            </div>

            <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:w-[260px] lg:justify-end">
              <Button
                variant="primary"
                onClick={async () => {
                  setIsCreatingSession(true);
                  setNewSessionError(null);
                  try {
                    await createNewList();
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Could not create session';
                    setNewSessionError(process.env.NODE_ENV === 'development' ? message : 'Could not create session');
                  } finally {
                    setIsCreatingSession(false);
                  }
                }}
                disabled={isCreatingSession}
                className="w-full sm:w-auto"
              >
                {isCreatingSession ? 'Creating...' : 'New Session'}
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto">
                Duplicate
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto">
                Export
              </Button>
            </div>
          </div>

          {newSessionError ? (
            <InlineNotice variant="error" className="mt-4">
              New Session failed: {newSessionError}
            </InlineNotice>
          ) : null}

          {orderSavedToast ? (
            <InlineNotice variant="success" className="mt-4">
              Order saved
            </InlineNotice>
          ) : null}
        </header>

        <div className="grid gap-5 md:grid-cols-[208px_1fr]">
          <ScheduleRail
            currentHour={currentHour}
            scheduledCount={scheduled}
            isOpen={isScheduleOpen}
            onToggleOpen={() => setIsScheduleOpen((value) => !value)}
            dotPriorityByHour={scheduleDotPriorityByHour}
          />

          <Card className="order-1 rounded-3xl md:order-2">
            <div className="mb-4">
              <SectionHeader>WORK STACK</SectionHeader>

              <form
                action={async (formData) => {
                  if (!activeListId || !newTaskText.trim()) {
                    return;
                  }

                  try {
                    setIsAddingTask(true);
                    setAddTaskError(null);
                    formData.set('list_id', activeListId);
                    formData.set('content', withPriorityTag(newTaskText, selectedPriority));
                    await createTaskAction(formData);
                    setNewTaskText('');
                    await reloadActiveTasks();
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Could not create task';
                    setAddTaskError(process.env.NODE_ENV === 'development' ? message : 'Could not create task');
                  } finally {
                    setIsAddingTask(false);
                  }
                }}
                className="mt-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center"
              >
                <input type="hidden" name="list_id" value={activeListId ?? ''} />
                <input type="hidden" name="content" value={withPriorityTag(newTaskText, selectedPriority)} />
                <input type="hidden" name="priority" value={selectedPriority} />
                <Input
                  value={newTaskText}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setNewTaskText(event.target.value);
                    if (addTaskError) {
                      setAddTaskError(null);
                    }
                  }}
                  placeholder="Add task..."
                  className="min-h-[48px] flex-1"
                />
                <button
                  type="submit"
                  disabled={!canEdit || !newTaskText.trim() || isAddingTask}
                  className={[
                    'min-h-[44px] w-full rounded-xl px-4 py-2 text-label font-sans uppercase tracking-widest font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto',
                    canEdit ? 'bg-white text-black hover:opacity-90' : 'bg-white/20 text-text-tertiary',
                  ].join(' ')}
                >
                  {isAddingTask ? 'Adding...' : 'Add'}
                </button>
              </form>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(['high', 'normal', 'low'] as Priority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setSelectedPriority(priority)}
                    aria-pressed={selectedPriority === priority}
                    aria-label={`Set priority to ${priority}`}
                    className={[
                      'rounded-full border px-3 py-1 text-label font-sans uppercase tracking-widest font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                      selectedPriority === priority
                        ? priority === 'high'
                          ? 'border-[color:var(--priority-high)]/60 text-[color:var(--priority-high)] bg-red-500/10'
                          : priority === 'low'
                            ? 'border-[color:var(--priority-low)]/60 text-[color:var(--priority-low)] bg-white/10'
                            : 'border-[color:var(--priority-normal)]/60 text-[color:var(--priority-normal)] bg-blue-500/10'
                        : 'border-white/10 text-text-tertiary hover:text-text-secondary',
                    ].join(' ')}
                  >
                    {priority}
                  </button>
                ))}
              </div>

              {addTaskError ? (
                <InlineNotice variant="error" className="mt-3">
                  {addTaskError}
                </InlineNotice>
              ) : null}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={(event) => {
                void handleDragEnd(event);
              }}
            >
              <SortableContext items={orderedTaskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {groups.length === 0 ? (
                    <Card tone="muted" className="text-task font-medium text-text-secondary">
                      No tasks yet. Add your first item above.
                    </Card>
                  ) : null}

                  {groups.map((group) => (
                    <section key={group.label}>
                      <SectionHeader className="mb-2">{group.label}</SectionHeader>

                      <div className="space-y-2">
                        {group.items.map((task) => (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            canEdit={canEdit}
                            isActiveDrag={activeDragId === task.id}
                            onToggleTask={(taskId, currentStatus) => {
                              void toggleTask(taskId, currentStatus);
                            }}
                            onDeleteTask={deleteTask}
                            onSaveTask={(taskId, nextText) => {
                              void saveTaskEdit(taskId, nextText);
                            }}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </Card>
        </div>

        <ArchiveLogsPanel
          lists={lists}
          activeListId={activeListId}
          listStatsById={listStatsById}
          isOpen={isArchivedLogsOpen}
          onToggleOpen={() => setIsArchivedLogsOpen((value) => !value)}
          onSelectList={handleArchiveSelect}
        />
      </div>
    </div>
  );
}
