"use client";

import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, ListChecks } from 'lucide-react';

export default function TipStyleTodo() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Finish Tip Style 2026 Setup", completed: true },
    { id: 2, text: "Configure Supabase Backend", completed: false },
  ]);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Function to toggle completion
  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Function to add a new task (simple prompt for now)
  const addNewTask = () => {
    const text = window.prompt("Enter new task:"); // Added 'window.' for clarity
    if (text !== null && text.trim() !== "") {
      setTasks([...tasks, { id: Date.now(), text: text.trim(), completed: false }]);
    }
  };
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      {/* Header Section */}
      <header className="mb-12">
        <h2 className="text-blue-500 font-bold tracking-widest uppercase text-sm mb-2">
          To Do : {today}
        </h2>
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4">
          TIP STYLE <span className="text-gray-500">2026</span>
        </h1>
        <div className="flex items-center gap-4 bg-zinc-900 w-fit px-4 py-2 rounded-full border border-zinc-800">
          <ListChecks size={20} className="text-blue-400" />
          <span className="font-bold text-lg">
            {completedCount} / {totalTasks} TASKS DONE
          </span>
        </div>
      </header>

      {/* Action Button */}
      <button 
        onClick={addNewTask}
        className="flex items-center gap-2 bg-white text-black px-6 py-4 rounded-xl font-black hover:bg-blue-400 transition-colors mb-12 uppercase tracking-tight"
      >
        <Plus size={24} strokeWidth={3} />
        New Task
      </button>

      {/* Task List */}
      <section className="space-y-4 max-w-3xl">
        {tasks.map((task) => (
          <div 
            key={task.id}
            className={`flex items-center gap-4 p-6 rounded-2xl border transition-all cursor-pointer ${
              task.completed 
                ? 'bg-zinc-950 border-zinc-900 opacity-40' 
                : 'bg-zinc-900 border-zinc-800 hover:border-blue-500'
            }`}
            onClick={() => toggleTask(task.id)}
          >
            <div className="focus:outline-none">
              {task.completed ? (
                <CheckCircle2 size={32} className="text-blue-500" />
              ) : (
                <Circle size={32} className="text-zinc-700" />
              )}
            </div>
            <span className={`text-2xl font-bold ${task.completed ? 'line-through decoration-blue-500 decoration-4' : ''}`}>
              {task.text}
            </span>
          </div>
        ))}
      </section>

      {/* History Row (Footer) */}
      <footer className="mt-20 border-t border-zinc-800 pt-8">
        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">Completed History</h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <div className="min-w-[200px] bg-zinc-900 p-4 rounded-xl border border-zinc-800 cursor-pointer">
            <p className="text-xs text-zinc-500 font-bold uppercase">Feb 13, 2026</p>
            <p className="font-black text-lg">WORKOUT PLAN</p>
          </div>
        </div>
      </footer>
    </main>
  );
}