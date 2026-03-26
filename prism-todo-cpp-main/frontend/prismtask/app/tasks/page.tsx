'use client';

import { useState, useEffect, useCallback } from 'react';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string;
  createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: 'rgba(255,60,60,0.85)',
  Medium: 'rgba(255,180,0,0.85)',
  Low: 'rgba(0,210,150,0.85)',
};

const PRIORITY_BADGE: Record<string, string> = {
  High: 'bg-red-500/30 text-red-300 border border-red-500/40',
  Medium: 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40',
  Low: 'bg-green-500/30 text-green-300 border border-green-500/40',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveFlash, setSaveFlash] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreate() {
    if (!title.trim()) return;
    setSubmitting(true);
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, dueDate }),
    });
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setDueDate('');
    setSubmitting(false);

    // Flash to simulate "save" confirmation
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);

    loadTasks();
  }

  async function handleToggle(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    loadTasks();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold text-center mb-1">PrismTask</h1>
      <div className="h-[2px] w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 mb-8 rounded" />

      {/* Create Task Form */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 border border-white/10">
        <h2 className="text-lg font-semibold mb-4 text-cyan-300">Create a Task</h2>

        <input
          className="w-full mb-3 px-4 py-2 rounded-lg bg-white/20 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="w-full mb-3 px-4 py-2 rounded-lg bg-white/20 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-3 mb-4">
          {/* Priority selector */}
          <div className="flex gap-2 flex-1">
            {(['High', 'Medium', 'Low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition border ${
                  priority === p
                    ? 'border-white/60 scale-105'
                    : 'border-white/10 opacity-50'
                }`}
                style={{
                  background: priority === p ? PRIORITY_COLORS[p] : 'transparent',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Due date */}
          <input
            type="date"
            className="px-3 py-2 rounded-lg bg-white/20 text-sm outline-none focus:ring-2 focus:ring-cyan-400"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting || !title.trim()}
          className={`w-full py-2 rounded-lg font-semibold transition ${
            saveFlash
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white hover:opacity-90'
          } disabled:opacity-40`}
        >
          {saveFlash ? '✓ Saved!' : submitting ? 'Saving…' : 'Save Task'}
        </button>
      </div>

      {/* Reload button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-cyan-300">
          Tasks{' '}
          <span className="text-white/40 text-sm font-normal">
            ({tasks.length} stored in tasks.json)
          </span>
        </h2>
        <button
          onClick={loadTasks}
          className="text-sm px-4 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition"
        >
          ↺ Reload
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <p className="text-white/40 text-center py-10">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-white/40 text-center py-10">No tasks yet. Create one above!</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-4 bg-white/10 border border-white/10 rounded-xl px-5 py-4 transition hover:bg-white/15"
              style={{
                borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}`,
              }}
            >
              {/* Complete toggle */}
              <button
                onClick={() => handleToggle(task)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition ${
                  task.completed
                    ? 'bg-cyan-400 border-cyan-400'
                    : 'border-white/40 hover:border-cyan-400'
                }`}
              />

              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold ${
                    task.completed ? 'line-through text-white/40' : ''
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-sm text-white/50 mt-0.5">{task.description}</p>
                )}
                <div className="flex gap-2 mt-2 items-center flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-white/40">Due: {task.dueDate}</span>
                  )}
                  {task.completed && (
                    <span className="text-xs text-cyan-400">✓ Complete</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="text-white/20 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                title="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
