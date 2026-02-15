"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, ListChecks, Loader2, LayoutGrid, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TipStyleTodo() {
  const [lists, setLists] = useState<any[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (activeListId) {
      fetchTasks(activeListId);
    }
  }, [activeListId]);

  const fetchLists = async () => {
    const { data } = await supabase.from('lists').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setLists(data);
      setActiveListId(data[0].id);
    }
    setLoading(false);
  };

  const fetchTasks = async (listId: string) => {
    const { data } = await supabase.from('tasks').select('*').eq('list_id', listId).order('created_at', { ascending: true });
    if (data) setTasks(data);
  };

  const createNewList = async () => {
    const defaultDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', month: 'numeric', day: 'numeric', year: '2-digit' 
    }).toUpperCase().replace(',', ':');

    const title = window.prompt("Enter List Name:", defaultDate);
    
    if (title?.trim()) {
      const { data } = await supabase.from('lists').insert([{ title: title.toUpperCase() }]).select();
      if (data) {
        setLists([data[0], ...lists]);
        setActiveListId(data[0].id);
        setTasks([]); 
      }
    }
  };

  const addNewTask = async () => {
    if (!activeListId) return;
    const text = window.prompt("Enter new task:");
    if (text?.trim()) {
      const { data } = await supabase.from('tasks').insert([{ content: text.trim(), list_id: activeListId }]).select();
      if (data) setTasks([...tasks, ...data]);
    }
  };

  const toggleTask = async (id: string, currentState: boolean) => {
    const { error } = await supabase.from('tasks').update({ is_done: !currentState }).eq('id', id);
    if (!error) setTasks(tasks.map(t => t.id === id ? { ...t, is_done: !currentState } : t));
  };

  const deleteList = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this log?")) {
      const { error } = await supabase.from('lists').delete().eq('id', id);
      if (!error) {
        const updatedLists = lists.filter(l => l.id !== id);
        setLists(updatedLists);
        if (activeListId === id) {
          if (updatedLists.length > 0) setActiveListId(updatedLists[0].id);
          else { setActiveListId(null); setTasks([]); }
        }
      }
    }
  };

  const activeTitle = lists.find(l => l.id === activeListId)?.title || "TIP STYLE 2026";

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="mb-12">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-blue-500 font-bold tracking-widest uppercase text-sm mb-2">Active Session</h2>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4">{activeTitle}</h1>
          </div>
          <button onClick={createNewList} className="bg-zinc-800 p-4 rounded-xl hover:bg-blue-600 transition-all">
            <LayoutGrid size={24} />
          </button>
        </div>
      </header>

      <button onClick={addNewTask} className="flex items-center gap-2 bg-white text-black px-6 py-4 rounded-xl font-black hover:bg-blue-400 transition-colors mb-12 uppercase tracking-tight">
        <Plus size={24} strokeWidth={3} /> Add Task
      </button>

      {loading ? <Loader2 className="animate-spin text-blue-500" /> : (
        <section className="space-y-4 max-w-3xl">
          {tasks.map((task) => (
            <div key={task.id} onClick={() => toggleTask(task.id, task.is_done)} className={`flex items-center gap-4 p-6 rounded-2xl border transition-all cursor-pointer ${task.is_done ? 'bg-zinc-950 border-zinc-900 opacity-40' : 'bg-zinc-900 border-zinc-800 hover:border-blue-500'}`}>
              {task.is_done ? <CheckCircle2 size={32} className="text-blue-500" /> : <Circle size={32} className="text-zinc-700" />}
              <span className={`text-2xl font-bold ${task.is_done ? 'line-through decoration-blue-500 decoration-4' : ''}`}>{task.content}</span>
            </div>
          ))}
        </section>
      )}

      <footer className="mt-20 border-t border-zinc-800 pt-12 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">ARCHIVED LOGS</h3>
          <span className="text-zinc-700 text-xs font-bold uppercase">{lists.length} TOTAL SESSIONS</span>
        </div>

        <div className="grid gap-2">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className={`flex items-center justify-between p-5 rounded-xl transition-all border ${activeListId === list.id ? 'bg-blue-600 border-blue-400 translate-x-2' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'}`}
            >
              <div className="flex items-center gap-6 text-left">
                <p className={`text-xs font-black uppercase w-24 ${activeListId === list.id ? 'text-white' : 'text-zinc-500'}`}>
                  {new Date(list.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                </p>
                <p className="font-black text-xl tracking-tight uppercase truncate max-w-[200px] md:max-w-md">{list.title}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => deleteList(list.id, e)}
                  className={`p-2 rounded-lg transition-colors ${activeListId === list.id ? 'hover:bg-red-500 text-white' : 'hover:bg-zinc-700 text-zinc-500 hover:text-red-400'}`}
                >
                  <Trash2 size={18} />
                </button>
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${activeListId === list.id ? 'bg-blue-400 text-white' : 'bg-black text-zinc-500'}`}>
                  {activeListId === list.id ? 'ACTIVE' : 'SELECT'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </footer>
    </main>
  );
}