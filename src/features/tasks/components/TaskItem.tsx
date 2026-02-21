'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ListChecks, Trash2 } from 'lucide-react';

import type { TaskRow } from '../types';

interface TaskItemProps {
  task: TaskRow;
  toggleTask: (id: string, status: boolean) => void;
  deleteTask: (id: string) => void;
  startEditing: (taskId: string, event: React.MouseEvent) => void;
  saveEdit: (id: string, newText: string) => void;
  isEditing: boolean;
}

const SWIPE_THRESHOLD = 70;

export default function TaskItem({
  task,
  toggleTask,
  deleteTask,
  startEditing,
  saveEdit,
  isEditing,
}: TaskItemProps) {
  const [touchStartX, setTouchStartX] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (isEditing) {
      return;
    }

    const diff = event.touches[0].clientX - touchStartX;
    if (diff < 0) {
      setDragX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragX < -SWIPE_THRESHOLD) {
      setIsExiting(true);
      return;
    }

    setDragX(0);
  };

  const revealOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);

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
          <div
            className="absolute inset-0 flex items-center justify-end pr-6 bg-red-600 rounded-2xl"
            style={{ opacity: revealOpacity }}
          >
            <Trash2 className="text-white" size={24} />
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
            className={`relative z-10 flex items-center gap-4 p-6 rounded-2xl border cursor-pointer ${
              task.is_done
                ? 'bg-zinc-950 border-zinc-900 opacity-40'
                : 'bg-zinc-900 border-zinc-800 hover:border-blue-500'
            }`}
            onClick={() => !isEditing && toggleTask(task.id, task.is_done)}
          >
            {task.is_done ? (
              <CheckCircle2 size={32} className="text-blue-500 shrink-0" />
            ) : (
              <Circle size={32} className="text-zinc-700 shrink-0" />
            )}

            <div className="flex-1">
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
                  className="w-full py-1 text-2xl font-bold text-white bg-transparent border-b-2 border-blue-500 outline-none"
                />
              ) : (
                <span
                  className={`block text-2xl font-bold transition-all ${
                    task.is_done ? 'line-through decoration-blue-500 decoration-4 text-zinc-600' : ''
                  }`}
                >
                  {task.content}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
              <button
                onClick={(event) => startEditing(task.id, event)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-blue-400"
              >
                <ListChecks size={20} />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  deleteTask(task.id);
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
