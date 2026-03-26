import { NextRequest, NextResponse } from 'next/server';
import { readTasks, writeTasks } from '@/lib/taskStore';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/tasks/[id] — toggle completed, or update fields
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === taskId);

  if (index === -1) {
    return NextResponse.json({ error: 'task not found' }, { status: 404 });
  }

  const body = await req.json();

  // Allow toggling completed or updating any field
  tasks[index] = { ...tasks[index], ...body, id: taskId };
  writeTasks(tasks);

  return NextResponse.json(tasks[index]);
}

// DELETE /api/tasks/[id] — remove a task
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
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
