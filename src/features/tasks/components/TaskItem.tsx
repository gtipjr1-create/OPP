'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, GripVertical, Trash2 } from 'lucide-react';

import type { TaskRow } from '../types';

interface TaskItemProps {
  task: TaskRow;
  toggleTask: (id: string, status: boolean) => void;
  deleteTask: (id: string) => void;
  startEditing: (taskId: string, event: React.MouseEvent) => void;
  saveEdit: (id: string, newText: string) => void;
  isEditing: boolean;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_REVEAL_OFFSET = 116;

function formatDisplayTime(timeText?: string | null): string {
  if (!timeText) {
    return '-';
  }

  const normalized = timeText.slice(0, 5);
  const [hourText, minuteText] = normalized.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return normalized;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

export default function TaskItem({
  task,
  toggleTask,
  deleteTask,
  startEditing,
  saveEdit,
  isEditing,
}: TaskItemProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (isEditing || confirmDelete) {
      return;
    }

    const diff = event.touches[0].clientX - touchStartX;
    const nextDrag = Math.max(-SWIPE_REVEAL_OFFSET, Math.min(0, diff));
    setDragX(nextDrag);
  };

  const handleTouchEnd = () => {
    if (dragX < -SWIPE_THRESHOLD) {
      setDragX(-SWIPE_REVEAL_OFFSET);
      return;
    }

    setDragX(0);
  };

  const openDeleteConfirm = (event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmDelete(true);
  };

  const cancelDeleteConfirm = (event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmDelete(false);
    setDragX(0);
  };

  const confirmDeleteNow = (event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmDelete(false);
    setIsExiting(true); // triggers exit animation; delete runs on animation complete
  };

  useEffect(() => {
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

  if (confirmDelete) {
    return (
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            layout
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ x: '-110%', opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.28, ease: 'easeIn' }}
            onAnimationComplete={() => {
              if (isExiting) {
                deleteTask(task.id);
              }
            }}
            className="relative mb-4 overflow-hidden rounded-2xl group"
          >
            <div className="relative z-10 rounded-2xl border border-white/10 bg-black p-6">
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-meta font-mono tracking-wide text-text-secondary">
                  Delete this task?
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={cancelDeleteConfirm}
                    className="min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-3 text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteNow}
                    className="min-h-[44px] rounded-lg bg-red-500/20 px-3 text-label font-sans uppercase tracking-widest font-semibold text-red-200 hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          ref={cardRef}
          layout
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ x: '-110%', opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.28, ease: 'easeIn' }}
          onAnimationComplete={() => {
            if (isExiting) {
              deleteTask(task.id);
            }
          }}
          className="relative mb-4 overflow-hidden rounded-2xl group"
        >
          <div className="absolute inset-y-0 right-0 z-0 flex items-center gap-2 pr-3">
            <button
              onClick={(event) => startEditing(task.id, event)}
              className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-2 text-label font-sans uppercase tracking-widest font-semibold text-text-secondary hover:bg-white/10 hover:text-text-accent"
            >
              Edit
            </button>
            <button
              onClick={openDeleteConfirm}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30"
              aria-label="Delete task"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateX(${dragX}px)`,
              transition: dragX === 0 ? 'transform 0.2s ease' : 'none',
              touchAction: 'pan-y',
            }}
            className={`relative z-10 rounded-2xl border cursor-pointer ${
              task.is_done
                ? 'bg-zinc-950 border-zinc-900 opacity-40'
                : 'bg-zinc-900 border-zinc-800 hover:border-blue-500'
            } ${(task.priority ?? 'normal') === 'high' ? 'border-l-2 border-l-red-500/60' : ''}`}
            onClick={() => {
              if (dragX !== 0) {
                setDragX(0);
                return;
              }
              if (!isEditing) {
                toggleTask(task.id, task.is_done);
              }
            }}
          >
            <div className="flex w-full items-start gap-3 p-4">
              {task.is_done ? (
                <CheckCircle2 size={40} className="shrink-0 text-text-accent" />
              ) : (
                <Circle size={40} className="shrink-0 text-text-tertiary" />
              )}

              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    defaultValue={task.content}
                    autoFocus
                    onBlur={(event) => saveEdit(task.id, event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        saveEdit(task.id, event.currentTarget.value);
                      }
                    }}
                    onClick={(event) => event.stopPropagation()}
                    className="min-w-0 w-full border-b-2 border-blue-500 bg-transparent py-1 text-task font-medium text-text-primary outline-none"
                  />
                ) : (
                  <span
                    className={`block truncate text-task font-medium ${
                      task.is_done ? 'line-through decoration-blue-500 decoration-4 text-text-tertiary' : ''
                    }`}
                  >
                    {task.content}
                  </span>
                )}

                <div className="mt-1 flex items-center gap-2 text-meta font-mono tracking-wide text-text-secondary">
                  <span>{task.scheduled_time ? `@ ${formatDisplayTime(task.scheduled_time)}` : '-'}</span>
                  <span className="text-text-tertiary">|</span>
                  <span
                    className={
                      task.priority === 'high'
                        ? 'text-[color:var(--priority-high)]'
                        : task.priority === 'low'
                          ? 'text-[color:var(--priority-low)]'
                          : 'text-[color:var(--priority-normal)]'
                    }
                  >
                    {(task.priority ?? 'normal').toUpperCase()}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-text-tertiary hover:bg-white/5"
                    aria-label="Drag task"
                  >
                    <GripVertical size={18} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
