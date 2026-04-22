'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string;
  createdAt: string;
}

type Priority = 'High' | 'Medium' | 'Low';
type Filter = 'All' | Priority;

const PRIORITY_COLORS: Record<Priority, string> = {
  High: 'rgba(255,60,60,0.85)',
  Medium: 'rgba(255,180,0,0.85)',
  Low: 'rgba(0,210,150,0.85)',
};

const PRIORITY_BADGE: Record<Priority, string> = {
  High: 'bg-red-500/30 text-red-300 border border-red-500/40',
  Medium: 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40',
  Low: 'bg-green-500/30 text-green-300 border border-green-500/40',
};

export default function TasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveFlash, setSaveFlash] = useState(false);

  // Create-form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter state — 'All' means no query param; other values hit ?priority=.
  const [filter, setFilter] = useState<Filter>('All');

  // Inline-edit state — null when no row is being edited.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    description: string;
    priority: Priority;
    dueDate: string;
  }>({ title: '', description: '', priority: 'Medium', dueDate: '' });

  const loadTasks = useCallback(
    async (current: Filter = filter) => {
      setLoading(true);
      setLoadError('');
      try {
        const url = current === 'All' ? '/api/tasks' : `/api/tasks?priority=${current}`;
        const res = await fetch(url);
        if (res.status === 401) {
          // Session expired or never set — back to login.
          router.replace('/');
          return;
        }
        if (!res.ok) {
          setLoadError('Could not load tasks.');
          setTasks([]);
          return;
        }
        const data = (await res.json()) as Task[];
        setTasks(data);
      } catch {
        setLoadError('Could not reach server.');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [filter, router]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreate() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, dueDate }),
      });
      if (res.status === 401) {
        router.replace('/');
        return;
      }
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1200);
      await loadTasks();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (res.status === 401) {
      router.replace('/');
      return;
    }
    loadTasks();
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      router.replace('/');
      return;
    }
    loadTasks();
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditDraft({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueDate: task.dueDate ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(task: Task) {
    if (!editDraft.title.trim()) return;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editDraft.title,
        description: editDraft.description,
        priority: editDraft.priority,
        dueDate: editDraft.dueDate,
      }),
    });
    if (res.status === 401) {
      router.replace('/');
      return;
    }
    setEditingId(null);
    loadTasks();
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } finally {
      router.replace('/');
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-extrabold">PrismTask</h1>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition"
          aria-label="Log out"
        >
          Log out
        </button>
      </header>
      <div className="h-[2px] w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 mb-8 rounded" />

      {/* Create Task Form */}
      <section
        aria-labelledby="create-heading"
        className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 border border-white/10"
      >
        <h2 id="create-heading" className="text-lg font-semibold mb-4 text-cyan-300">
          Create a Task
        </h2>

        <label htmlFor="new-title" className="sr-only">
          Title
        </label>
        <input
          id="new-title"
          className="w-full mb-3 px-4 py-2 rounded-lg bg-white/20 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="new-desc" className="sr-only">
          Description
        </label>
        <input
          id="new-desc"
          className="w-full mb-3 px-4 py-2 rounded-lg bg-white/20 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-3 mb-4" role="group" aria-label="Priority">
          <div className="flex gap-2 flex-1">
            {(['High', 'Medium', 'Low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                aria-pressed={priority === p}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition border ${
                  priority === p ? 'border-white/60 scale-105' : 'border-white/10 opacity-50'
                }`}
                style={{
                  background: priority === p ? PRIORITY_COLORS[p] : 'transparent',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <label htmlFor="new-due" className="sr-only">
            Due date
          </label>
          <input
            id="new-due"
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
      </section>

      {/* Filter + Reload */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-cyan-300">
          Tasks{' '}
          <span className="text-white/40 text-sm font-normal">
            ({tasks.length}
            {filter !== 'All' ? ` · ${filter}` : ''})
          </span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by priority">
          {(['All', 'High', 'Medium', 'Low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                filter === f
                  ? 'border-white/60 bg-white/15'
                  : 'border-white/20 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => loadTasks()}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition"
          >
            ↺ Reload
          </button>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <p className="text-white/40 text-center py-10">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-red-400 text-center py-10">
          {loadError}
        </p>
      ) : tasks.length === 0 ? (
        <p className="text-white/40 text-center py-10">
          {filter === 'All'
            ? 'No tasks yet. Create one above!'
            : `No ${filter} priority tasks.`}
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const isEditing = editingId === task.id;
            return (
              <li
                key={task.id}
                className="flex items-start gap-4 bg-white/10 border border-white/10 rounded-xl px-5 py-4 transition hover:bg-white/15"
                style={{ borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}` }}
              >
                <button
                  onClick={() => handleToggle(task)}
                  aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  aria-pressed={task.completed}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition ${
                    task.completed
                      ? 'bg-cyan-400 border-cyan-400'
                      : 'border-white/40 hover:border-cyan-400'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        className="w-full px-3 py-1.5 rounded-lg bg-white/20 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                        value={editDraft.title}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, title: e.target.value })
                        }
                        aria-label="Edit title"
                      />
                      <input
                        className="w-full px-3 py-1.5 rounded-lg bg-white/20 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Description"
                        value={editDraft.description}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, description: e.target.value })
                        }
                        aria-label="Edit description"
                      />
                      <div className="flex gap-2 flex-wrap items-center">
                        {(['High', 'Medium', 'Low'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setEditDraft({ ...editDraft, priority: p })}
                            aria-pressed={editDraft.priority === p}
                            className={`text-xs px-2 py-1 rounded-lg font-semibold border transition ${
                              editDraft.priority === p
                                ? 'border-white/60'
                                : 'border-white/10 opacity-60'
                            }`}
                            style={{
                              background:
                                editDraft.priority === p ? PRIORITY_COLORS[p] : 'transparent',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                        <input
                          type="date"
                          className="px-2 py-1 text-xs rounded-lg bg-white/20 outline-none focus:ring-2 focus:ring-cyan-400"
                          value={editDraft.dueDate}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, dueDate: e.target.value })
                          }
                          aria-label="Edit due date"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveEdit(task)}
                          disabled={!editDraft.title.trim()}
                          className="text-xs px-3 py-1 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 disabled:opacity-40 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs px-3 py-1 rounded-lg border border-white/20 hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                    <button
                      onClick={() => startEdit(task)}
                      className="text-white/40 hover:text-cyan-400 transition text-sm"
                      aria-label={`Edit ${task.title}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-white/20 hover:text-red-400 transition text-lg leading-none"
                      aria-label={`Delete ${task.title}`}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
