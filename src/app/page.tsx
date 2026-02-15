"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, ListChecks, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TipStyleTodo() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });

  // 1. Fetch tasks from Supabase on load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) setTasks(data);
    setLoading(false);
  };

  // 2. Add new task to Supabase
  const addNewTask = async () => {
    const text = window.prompt("Enter new task:");
    if (text?.trim()) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ content: text.trim(), is_done: false }])
        .select();
      
      if (data) setTasks([...tasks, ...data]);
    }
  };

  // 3. Toggle completion in Supabase
  const toggleTask = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: !currentState })
      .eq('id', id);

    if (!error) {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_done: !currentState } : t));
    }
  };

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.is_done).length;

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="mb-12">
        <h2 className="text-blue-500 font-bold tracking-widest uppercase text-sm mb-2">
          To Do : {today}
        </h2>
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4">
          TIP STYLE <span className="text-gray-500">2026</span>
        </h1>
        <div className="flex items-center gap-4 bg-zinc-900 w-fit px-4 py-2 rounded-full border border-zinc-800">
          <ListChecks size={20} className="text-blue-400" />
          <span className="font-bold text-lg uppercase">
            {completedCount} / {totalTasks} TASKS DONE
          </span>
        </div>
      </header>

      <button 
        onClick={addNewTask}
        className="flex items-center gap-2 bg-white text-black px-6 py-4 rounded-xl font-black hover:bg-blue-400 transition-colors mb-12 uppercase tracking-tight"
      >
        <Plus size={24} strokeWidth={3} />
        New Task
      </button>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="animate-spin" /> Loading your day...
        </div>
      ) : (
        <section className="space-y-4 max-w-3xl">
          {tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => toggleTask(task.id, task.is_done)}
              className={`flex items-center gap-4 p-6 rounded-2xl border transition-all cursor-pointer ${
                task.is_done 
                  ? 'bg-zinc-950 border-zinc-900 opacity-40' 
                  : 'bg-zinc-900 border-zinc-800 hover:border-blue-500'
              }`}
            >
              <div>
                {task.is_done ? (
                  <CheckCircle2 size={32} className="text-blue-500" />
                ) : (
                  <Circle size={32} className="text-zinc-700" />
                )}
              </div>
              <span className={`text-2xl font-bold ${task.is_done ? 'line-through decoration-blue-500 decoration-4' : ''}`}>
                {task.content}
              </span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}