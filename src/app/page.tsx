'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  ListChecks, 
  Loader2, 
  LayoutGrid, 
  Trash2 
} from 'lucide-react';

export default function TipStyleTodo() {
  const [lists, setLists] = useState<any[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (activeListId) {
      fetchTasks(activeListId);
    }
  }, [activeListId]);

  const fetchLists = async () => {
    const { data } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setLists(data);
      if (!activeListId) setActiveListId(data[0].id);
    }
    setLoading(false);
  };

  const fetchTasks = async (listId: string) => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
    if (data) setTasks(data);
  };

  const createNewList = async () => {
    const defaultDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', month: 'numeric', day: 'numeric', year: '2-digit' 
    }).toUpperCase().replace(',', ':');

    const { data, error } = await supabase
      .from('lists')
      .insert([{ title: defaultDate }])
      .select();

    if (!error && data) {
      setLists([data[0], ...lists]);
      setActiveListId(data[0].id);
      setTasks([]); 
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListId || !newTaskText.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ content: newTaskText.trim(), list_id: activeListId }])
      .select();

    if (!error && data) {
      setTasks([data[0], ...tasks]);
      setNewTaskText("");
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: !currentStatus })
      .eq('id', id);

    if (!error) {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_done: !currentStatus } : t));
    }
  };

  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const startEditing = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(task.id);
    setEditText(task.content);
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) {
      setEditingId(null);
      return;
    }
    const { error } = await supabase.from('tasks').update({ content: editText.trim() }).eq('id', id);
    if (!error) {
      setTasks(tasks.map(t => t.id === id ? { ...t, content: editText } : t));
      setEditingId(null);
    }
  };

  const deleteList = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this entire session?")) return;
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (!error) {
      const updatedLists = lists.filter(l => l.id !== id);
      setLists(updatedLists);
      if (activeListId === id && updatedLists.length > 0) {
        setActiveListId(updatedLists[0].id);
      }
    }
  };

  const activeTitle = lists.find(l => l.id === activeListId)?.title || "NEW SESSION";

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="mb-12">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-blue-500 font-bold tracking-widest uppercase text-sm mb-2">Active Session</h2>
            <div className="flex flex-col md:flex-row md:items-baseline gap-2">
              <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter text-white leading-none">
                OPP
              </h1>
              <span className="text-4xl md:text-5xl font-black italic tracking-tighter bg-gradient-to-r from-blue-600 via-blue-400 to-zinc-800 bg-clip-text text-transparent opacity-90 uppercase inline-block pr-4">
  2026
</span>
            </div>
            <p className="mt-4 text-zinc-500 font-black text-xl uppercase tracking-tight">{activeTitle}</p>
          </div>
          <button onClick={createNewList} className="bg-zinc-800 p-4 rounded-xl hover:bg-blue-600 transition-all mt-4">
            <LayoutGrid size={24} />
          </button>
        </div>
      </header>

      <form onSubmit={handleAddTask} className="mb-12 max-w-3xl">
        <div className="relative group">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="ADD TO YOUR PLAN..."
            className="w-full bg-zinc-900 border-2 border-zinc-800 text-white px-6 py-5 rounded-2xl font-bold text-xl focus:outline-none focus:border-blue-600 transition-all placeholder:text-zinc-700 uppercase tracking-tight"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-black p-3 rounded-xl hover:bg-blue-500 transition-colors">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </form>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : (
        <section className="space-y-4 max-w-3xl mb-24">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id, task.is_done)} 
              className={`group flex items-center gap-4 p-6 rounded-2xl border transition-all cursor-pointer ${
                task.is_done ? 'bg-zinc-950 border-zinc-900 opacity-40' : 'bg-zinc-900 border-zinc-800 hover:border-blue-500'
              }`}
            >
              {task.is_done ? <CheckCircle2 size={32} className="text-blue-500 shrink-0" /> : <Circle size={32} className="text-zinc-700 shrink-0" />}
              <div className="flex-1">
                {editingId === task.id ? (
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => saveEdit(task.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="bg-transparent border-b-2 border-blue-500 text-white font-bold text-2xl outline-none w-full py-1"
                  />
                ) : (
                  <span className={`text-2xl font-bold block transition-all ${task.is_done ? 'line-through decoration-blue-500 decoration-4 text-zinc-600' : ''}`}>
                    {task.content}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => startEditing(task, e)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-blue-400">
                  <ListChecks size={20} />
                </button>
                <button onClick={(e) => deleteTask(task.id, e)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400">
                  <Trash2 size={20} />
                </button>
              </div>
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
            <div
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className={`flex items-center justify-between p-5 rounded-xl transition-all border cursor-pointer ${activeListId === list.id ? 'bg-blue-600 border-blue-400 translate-x-2' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'}`}
            >
              <div className="flex items-center gap-6 text-left">
                <p className={`text-xs font-black uppercase w-24 ${activeListId === list.id ? 'text-white' : 'text-zinc-500'}`}>
                  {new Date(list.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                </p>
                <p className="font-black text-xl tracking-tight uppercase truncate max-w-[200px] md:max-w-md">{list.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={(e) => deleteList(list.id, e)} className={`p-2 rounded-lg transition-colors ${activeListId === list.id ? 'hover:bg-red-500 text-white' : 'hover:bg-zinc-700 text-zinc-500 hover:text-red-400'}`}>
                  <Trash2 size={18} />
                </button>
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${activeListId === list.id ? 'bg-blue-400 text-white' : 'bg-black text-zinc-500'}`}>
                  {activeListId === list.id ? 'ACTIVE' : 'SELECT'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}