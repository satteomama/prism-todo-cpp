import { NextRequest, NextResponse } from 'next/server';
import { readTasks, writeTasks, nextId, Task } from '@/lib/taskStore';
import { requireAuth } from '@/lib/auth';

const VALID_PRIORITIES = ['High', 'Medium', 'Low'] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (VALID_PRIORITIES as readonly string[]).includes(value);
}

// GET /api/tasks — return all tasks, optional ?priority=High filter
export async function GET(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  const tasks = readTasks();
  const priority = req.nextUrl.searchParams.get('priority');

  if (priority !== null && !isPriority(priority)) {
    return NextResponse.json(
      { error: 'priority must be High, Medium, or Low' },
      { status: 400 }
    );
  }

  const result = priority ? tasks.filter((t) => t.priority === priority) : tasks;

  return NextResponse.json(result);
}

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    title,
    description = '',
    priority = 'Low',
    dueDate = '',
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  if (!isPriority(priority)) {
    return NextResponse.json(
      { error: 'priority must be High, Medium, or Low' },
      { status: 400 }
    );
  }

  const tasks = readTasks();

  const newTask: Task = {
    id: nextId(tasks),
    title: title.trim(),
    description: typeof description === 'string' ? description : '',
    priority,
    completed: false,
    dueDate: typeof dueDate === 'string' ? dueDate : '',
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  writeTasks(tasks);

  return NextResponse.json(newTask, { status: 201 });
}
