import fs from 'fs';
import path from 'path';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
}

// Resolves to <project-root>/data/tasks.json at runtime
const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

export function readTasks(): Task[] {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export function writeTasks(tasks: Task[]): void {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

export function nextId(tasks: Task[]): number {
  return tasks.length === 0 ? 1 : Math.max(...tasks.map((t) => t.id)) + 1;
}
