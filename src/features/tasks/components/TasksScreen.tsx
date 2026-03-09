'use client';

import React from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Archive, CalendarDays, Check, Copy, Download, GripVertical, Plus, Settings, Trash2 } from 'lucide-react';
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

const SWIPE_REVEAL_OFFSET = 120;
const SWIPE_THRESHOLD = 72;

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

  // ? Confirm delete (tap trash ? confirm)
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const suppressNextToggleRef = React.useRef(false);
  const [editValue, setEditValue] = React.useState(task.title);
  const editInputRef = React.useRef<HTMLInputElement | null>(null);
  const [touchStartX, setTouchStartX] = React.useState(0);
  const [dragX, setDragX] = React.useState(0);
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(task.title);
    }
  }, [isEditing, task.title]);

  React.useEffect(() => {
    if (!isEditing) {
      return;
    }
    window.requestAnimationFrame(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    });
  }, [isEditing]);

  const openConfirmDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!canEdit || isDeleting) return;
    suppressNextToggleRef.current = true;
    setDragX(0);
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
    suppressNextToggleRef.current = true;
    setDragX(0);
    setIsEditing(true);
    setEditValue(task.title);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (isEditing || confirmDelete || !canEdit) {
      return;
    }
    setTouchStartX(event.touches[0].clientX);
    setIsSwiping(false);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (isEditing || confirmDelete || !canEdit) {
      return;
    }
    setIsSwiping(true);
    const diff = event.touches[0].clientX - touchStartX;
    const nextDrag = Math.max(-SWIPE_REVEAL_OFFSET, Math.min(0, diff));
    setDragX(nextDrag);
  };

  const handleTouchEnd = () => {
    if (isEditing || confirmDelete || !canEdit) {
      return;
    }
    setIsSwiping(false);
    if (dragX < -SWIPE_THRESHOLD) {
      setDragX(-SWIPE_REVEAL_OFFSET);
      return;
    }
    setDragX(0);
  };

  const handleTouchCancel = () => {
    if (isEditing || confirmDelete || !canEdit) {
      return;
    }
    setIsSwiping(false);
    setDragX(dragX < -SWIPE_THRESHOLD ? -SWIPE_REVEAL_OFFSET : 0);
  };

  React.useEffect(() => {
    if (dragX === 0) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!cardRef.current) {
        return;
      }
      if (!cardRef.current.contains(event.target as Node)) {
        setDragX(0);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [dragX]);

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

  if (confirmDelete) {
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
        <div className="col-span-full flex w-full items-center justify-between gap-3">
          <span className="text-meta font-mono tracking-wide text-text-secondary">Delete this task?</span>
          <div className="flex shrink-0 items-center gap-2">
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
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={[
        'draggable-row relative min-h-[56px] w-full max-w-full overflow-hidden rounded-xl border border-white/8 bg-white/[0.04]',
        isDragging || isActiveDrag ? 'opacity-60' : '',
        task.done ? 'opacity-80' : '',
        task.priority === 'high' ? 'border-l-2 border-l-red-500/60' : '',
      ].join(' ')}
    >
      <div
        className={[
          'pointer-events-none absolute inset-0 z-0 flex items-center justify-end pr-3 transition-opacity',
          dragX < -8 ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div className="flex w-[120px] items-center justify-end gap-2">
        <button
          type="button"
          onClick={startEdit}
          onPointerDown={(event) => event.stopPropagation()}
          disabled={!canEdit || isDeleting || isSavingEdit}
          className="pointer-events-auto min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-2 text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={openConfirmDelete}
          disabled={!canEdit || isDeleting}
          className="pointer-events-auto inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
        </div>
      </div>

      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.18s ease-out',
          touchAction: 'pan-y',
        }}
        className="relative z-10 min-h-[56px] w-full max-w-full rounded-xl bg-black/20 transition-transform will-change-transform touch-pan-y"
        onClick={() => {
          if (suppressNextToggleRef.current) {
            suppressNextToggleRef.current = false;
            return;
          }
          if (dragX !== 0) {
            setDragX(0);
            return;
          }
        }}
      >
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5">
          <label
            className="flex min-h-[44px] min-w-[44px] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggleTask(task.id, task.done)}
              aria-label={task.done ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
              className="peer sr-only"
              disabled={!canEdit}
            />
            <span
              className={[
                'inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--state-active)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black',
                task.done
                  ? 'border-[color:var(--state-active)]/55 bg-blue-500/15 text-[color:var(--state-active)]'
                  : 'border-white/15 bg-black/45 text-transparent',
                canEdit ? '' : 'opacity-60',
              ].join(' ')}
              aria-hidden="true"
            >
              <Check size={14} strokeWidth={2.5} />
            </span>
          </label>

          {isEditing ? (
            <div className="min-w-0 overflow-hidden rounded-md">
              <input
                ref={editInputRef}
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
              />
              <div className="text-meta font-mono tracking-wide text-text-secondary">
                {isSavingEdit ? 'Saving...' : 'Press Enter to save'}
              </div>
            </div>
          ) : (
            <div
              className="min-w-0"
              onClick={(event) => {
                event.stopPropagation();
                if (!canEdit || dragX !== 0) {
                  return;
                }
                setIsEditing(true);
                setEditValue(task.title);
              }}
            >
              <div
                className={[
                  'block truncate text-task font-medium leading-tight',
                  task.done ? 'line-through decoration-blue-500 decoration-4 text-text-tertiary' : 'text-text-primary',
                ].join(' ')}
              >
                {task.title}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-meta font-mono tracking-wide text-text-secondary">
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
              </div>
            </div>
          )}

          <div className="flex min-h-[36px] min-w-[36px] items-center justify-end">
            {isEditing ? (
              <button
                ref={setActivatorNodeRef}
                type="button"
                {...attributes}
                {...listeners}
                disabled={!canEdit}
                aria-label="Drag to reorder task"
                className="drag-handle inline-flex min-h-[36px] min-w-[36px] cursor-grab items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-text-secondary active:scale-95 active:cursor-grabbing touch-none select-none disabled:cursor-not-allowed disabled:opacity-40"
                style={{ touchAction: 'none' }}
                onClick={(event) => event.stopPropagation()}
              >
                <GripVertical size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
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
    duplicateActiveSession,
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
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [orderedTaskIds, setOrderedTaskIds] = React.useState<string[]>([]);
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const orderedTaskIdsRef = React.useRef<string[]>([]);
  const newTaskInputRef = React.useRef<HTMLInputElement | null>(null);
  const settingsMenuRef = React.useRef<HTMLDivElement | null>(null);
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

  React.useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!settingsMenuRef.current) {
        return;
      }
      if (!settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSettingsOpen]);

  const exportActiveSession = React.useCallback(() => {
    const position = new Map(orderedTaskIds.map((id, index) => [id, index]));
    const exportTasks = [...tasks].sort((a, b) => {
      const aPos = position.get(a.id) ?? 9999;
      const bPos = position.get(b.id) ?? 9999;
      if (aPos !== bPos) {
        return aPos - bPos;
      }
      return a.priority.localeCompare(b.priority);
    });

    const exportPayload = {
      title: activeTitle,
      exportedAt: new Date().toISOString(),
      tasks: exportTasks.map((task) => ({
        title: task.title,
        done: task.done,
        priority: task.priority,
        time: task.time ?? null,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const safeTitle = activeTitle.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'session';
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeTitle}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [activeTitle, orderedTaskIds, tasks]);

  const orderedTasks = React.useMemo(() => {
    const priorityOrder: Record<Priority, number> = { high: 0, normal: 1, low: 2 };
    const position = new Map(orderedTaskIds.map((id, index) => [id, index]));

    const byPosition =
      orderedTaskIds.length === 0
        ? [...tasks]
        : [...tasks].sort((a, b) => (position.get(a.id) ?? 9999) - (position.get(b.id) ?? 9999));

    return byPosition.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return (position.get(a.id) ?? 9999) - (position.get(b.id) ?? 9999);
    });
  }, [orderedTaskIds, tasks]);
  const orderedTaskIdList = React.useMemo(() => orderedTasks.map((task) => task.id), [orderedTasks]);

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
        setAddTaskError(
          process.env.NODE_ENV === 'development' ? `[E-TS-REORDER] ${message}` : 'Could not save task order. (E-TS-REORDER)',
        );
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

      const previous = orderedTaskIdList;
      const oldIndex = previous.indexOf(activeId);
      const newIndex = previous.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = arrayMove(previous, oldIndex, newIndex);
      setOrderedTaskIds(reordered);

      if (!activeListId) {
        console.error('[DND] Missing activeListId - cannot persist reorder');
        return;
      }

      await persistTaskOrder(activeListId, reordered);
    },
    [activeListId, orderedTaskIdList, persistTaskOrder],
  );

  const deleteTask = React.useCallback(
    async (taskId: string) => {
      try {
        await deleteTaskAction(taskId);
        await reloadActiveTasks();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not delete task';
        setAddTaskError(
          process.env.NODE_ENV === 'development' ? `[E-TS-DELETE] ${message}` : 'Could not delete task. (E-TS-DELETE)',
        );
      }
    },
    [reloadActiveTasks],
  );

  if (loading) {
    return (
      <div className="min-h-dvh bg-black text-text-primary overflow-x-hidden">
        <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-5 pb-8 pt-6">
          <LoadingMark label="Loading session..." size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black text-text-primary overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-5 pb-8 pt-6">
        <header className="mb-4.5">
          {errorMessage ? (
            <InlineNotice variant="error" className="mb-2">
              {errorMessage}
            </InlineNotice>
          ) : null}
          {isSavingOrder ? (
            <InlineNotice variant="info" className="mb-2">
              Saving order...
            </InlineNotice>
          ) : null}

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <SectionHeader>ACTIVE SESSION</SectionHeader>

              <div className="mt-0">
                <div className="flex items-end justify-center gap-1.5">
                  <OppMark size={38} />
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
                      'mt-0.5 w-full bg-transparent text-center text-title font-sans uppercase tracking-tight font-bold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
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
                      'mt-0.5 w-full text-center text-title font-sans uppercase tracking-tight font-bold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                      canEdit ? 'opacity-100 hover:text-text-accent' : 'opacity-70',
                    ].join(' ')}
                  >
                    {activeTitle}
                  </button>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1.5 text-meta font-mono tracking-wide text-text-secondary">
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

              <div className="mt-0.5 text-meta font-mono tracking-wide text-text-secondary">
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

          </div>

          {newSessionError ? (
            <InlineNotice variant="error" className="mt-2">
              New Session failed: {newSessionError}
            </InlineNotice>
          ) : null}

          {orderSavedToast ? (
            <InlineNotice variant="success" className="mt-2">
              Order saved
            </InlineNotice>
          ) : null}
        </header>

        <div className={['grid gap-3.5', isScheduleOpen ? 'md:grid-cols-[208px_1fr]' : 'md:grid-cols-1'].join(' ')}>
          {isScheduleOpen ? (
            <ScheduleRail
              currentHour={currentHour}
              scheduledCount={scheduled}
              isOpen={isScheduleOpen}
              onToggleOpen={() => setIsScheduleOpen((value) => !value)}
              dotPriorityByHour={scheduleDotPriorityByHour}
            />
          ) : null}

          <Card className={['order-1 rounded-3xl', isScheduleOpen ? 'md:order-2' : 'md:order-1'].join(' ')}>
            <div className="mb-2.5">
              <div className="flex items-center justify-between">
                <SectionHeader>WORK STACK</SectionHeader>
                <div ref={settingsMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen((value) => !value)}
                  aria-expanded={isSettingsOpen}
                  aria-label="Open session settings"
                  className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-text-tertiary hover:bg-white/5 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Settings size={14} />
                </button>

                {isSettingsOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-white/10 bg-black/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSettingsOpen(false);
                        setIsCreatingSession(true);
                        setNewSessionError(null);
                        try {
                          await createNewList();
                        } catch (error) {
                          const message = error instanceof Error ? error.message : 'Could not create session';
                          setNewSessionError(
                            process.env.NODE_ENV === 'development'
                              ? `[E-TS-NEWSESSION] ${message}`
                              : 'Could not create session. (E-TS-NEWSESSION)',
                          );
                        } finally {
                          setIsCreatingSession(false);
                        }
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/5 hover:text-text-primary"
                    >
                      <Plus size={14} />
                      <span>{isCreatingSession ? 'Creating...' : 'New Session'}</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsScheduleOpen((value) => !value);
                        setIsSettingsOpen(false);
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/5 hover:text-text-primary"
                    >
                      <CalendarDays size={14} />
                      <span>{isScheduleOpen ? 'Hide Schedule' : 'Show Schedule'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsArchivedLogsOpen((value) => !value);
                        setIsSettingsOpen(false);
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/5 hover:text-text-primary"
                    >
                      <Archive size={14} />
                      <span>{isArchivedLogsOpen ? 'Hide Archived' : 'Show Archived'}</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    <button
                      type="button"
                      onClick={async () => {
                        setIsSettingsOpen(false);
                        setNewSessionError(null);
                        try {
                          await duplicateActiveSession();
                        } catch (error) {
                          const message = error instanceof Error ? error.message : 'Could not duplicate session';
                          setNewSessionError(
                            process.env.NODE_ENV === 'development'
                              ? `[E-TS-DUPLICATE] ${message}`
                              : 'Could not duplicate session. (E-TS-DUPLICATE)',
                          );
                        }
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/5 hover:text-text-primary"
                    >
                      <Copy size={14} />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        exportActiveSession();
                        setIsSettingsOpen(false);
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/5 hover:text-text-primary"
                    >
                      <Download size={14} />
                      <span>Export</span>
                    </button>
                  </div>
                ) : null}
                </div>
              </div>

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
                    newTaskInputRef.current?.focus();
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Could not create task';
                    setAddTaskError(
                      process.env.NODE_ENV === 'development'
                        ? `[E-TS-CREATETASK] ${message}`
                        : 'Could not create task. (E-TS-CREATETASK)',
                    );
                  } finally {
                    setIsAddingTask(false);
                  }
                }}
                className="mt-1 flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 p-1"
              >
                <input type="hidden" name="list_id" value={activeListId ?? ''} />
                <input type="hidden" name="content" value={withPriorityTag(newTaskText, selectedPriority)} />
                <input type="hidden" name="priority" value={selectedPriority} />
                <Input
                  ref={newTaskInputRef}
                  value={newTaskText}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setNewTaskText(event.target.value);
                    if (addTaskError) {
                      setAddTaskError(null);
                    }
                  }}
                  placeholder="Quick add task..."
                  className="min-h-[40px] flex-1 rounded-lg bg-black/25 px-3"
                />
                <button
                  type="submit"
                  disabled={!canEdit || !newTaskText.trim() || isAddingTask}
                  className={[
                    'inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                    canEdit
                      ? 'border-[color:var(--state-active)]/25 bg-blue-500/6 text-[color:var(--state-active)]/90 hover:bg-blue-500/12'
                      : 'border-white/10 bg-white/5 text-text-tertiary',
                  ].join(' ')}
                  aria-label={isAddingTask ? 'Adding task' : 'Add task'}
                >
                  {isAddingTask ? '...' : <Plus size={16} />}
                </button>
              </form>

              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-1">
                {(['high', 'normal', 'low'] as Priority[]).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setSelectedPriority(priority)}
                    aria-pressed={selectedPriority === priority}
                    aria-label={`Set priority to ${priority}`}
                    className={[
                      'min-h-[34px] rounded-full border px-2.5 py-1 text-label font-sans uppercase tracking-widest font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
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
                <InlineNotice variant="error" className="mt-1.5">
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
              <SortableContext items={orderedTaskIdList} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {orderedTasks.length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-black/10 px-2 py-1 text-meta font-mono tracking-wide text-text-secondary">
                      No tasks yet. Use quick add above.
                    </div>
                  ) : null}

                  {orderedTasks.map((task) => (
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
              </SortableContext>
            </DndContext>
          </Card>
        </div>

        {isArchivedLogsOpen ? (
          <ArchiveLogsPanel
            lists={lists}
            activeListId={activeListId}
            listStatsById={listStatsById}
            isOpen={isArchivedLogsOpen}
            onToggleOpen={() => setIsArchivedLogsOpen((value) => !value)}
            onSelectList={handleArchiveSelect}
          />
        ) : null}
      </div>
    </div>
  );
}
