import { NextRequest, NextResponse } from 'next/server';
import { readTasks, writeTasks, nextId, Task } from '@/lib/taskStore';

// GET /api/tasks — return all tasks, optional ?priority=High filter
export async function GET(req: NextRequest) {
  const tasks = readTasks();
  const priority = req.nextUrl.searchParams.get('priority');

  const result = priority
    ? tasks.filter((t) => t.priority === priority)
    : tasks;

  return NextResponse.json(result);
}

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { title, description = '', priority = 'Low', dueDate = '' } = body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  if (!['High', 'Medium', 'Low'].includes(priority)) {
    return NextResponse.json(
      { error: 'priority must be High, Medium, or Low' },
      { status: 400 }
    );
  }

  const tasks = readTasks();

  const newTask: Task = {
    id: nextId(tasks),
    title: title.trim(),
    description,
    priority,
    completed: false,
    dueDate,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  writeTasks(tasks);

  return NextResponse.json(newTask, { status: 201 });
}
