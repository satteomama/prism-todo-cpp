import { NextRequest, NextResponse } from 'next/server';
import { readTasks, writeTasks, Task } from '@/lib/taskStore';
import { requireAuth } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

const VALID_PRIORITIES = ['High', 'Medium', 'Low'] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (VALID_PRIORITIES as readonly string[]).includes(value);
}

// PATCH /api/tasks/[id] — toggle completed or update any field
export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const taskId = Number.parseInt(id, 10);

  // Unknown / non-numeric ids map to 404, matching spec test T-04.
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 });
  }

  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === taskId);

  if (index === -1) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch = (body ?? {}) as Partial<Task>;

  // Validate any supplied fields; reject bad types rather than silently accept.
  if (patch.title !== undefined) {
    if (typeof patch.title !== 'string' || patch.title.trim() === '') {
      return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 });
    }
    patch.title = patch.title.trim();
  }
  if (patch.priority !== undefined && !isPriority(patch.priority)) {
    return NextResponse.json(
      { error: 'priority must be High, Medium, or Low' },
      { status: 400 }
    );
  }
  if (patch.completed !== undefined && typeof patch.completed !== 'boolean') {
    return NextResponse.json({ error: 'completed must be boolean' }, { status: 400 });
  }
  if (patch.description !== undefined && typeof patch.description !== 'string') {
    return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
  }
  if (patch.dueDate !== undefined && typeof patch.dueDate !== 'string') {
    return NextResponse.json({ error: 'dueDate must be a string' }, { status: 400 });
  }

  // id, createdAt are server-owned and must never be overwritten by a PATCH.
  tasks[index] = {
    ...tasks[index],
    ...patch,
    id: taskId,
    createdAt: tasks[index].createdAt,
  };
  writeTasks(tasks);

  return NextResponse.json(tasks[index]);
}

// DELETE /api/tasks/[id] — remove a task
export async function DELETE(req: NextRequest, { params }: Params) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const taskId = Number.parseInt(id, 10);

  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 });
  }

  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === taskId);

  if (index === -1) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 });
  }

  const [removed] = tasks.splice(index, 1);
  writeTasks(tasks);

  return NextResponse.json(removed);
}
