import fs from 'fs';
import path from 'path';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string; // YYYY-MM-DD or ISO-8601, empty string if none
  createdAt: string; // ISO-8601 timestamp
}

// Resolves to <project-root>/data/tasks.json at runtime.
const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

function ensureFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

export function readTasks(): Task[] {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

/**
 * Atomic write: serialise to a sibling .tmp file, then rename into place.
 * A crash mid-write leaves the original file untouched, so readers never
 * observe a half-written JSON document (spec §4.2.4 Reliability).
 */
export function writeTasks(tasks: Task[]): void {
  ensureFile();
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(tasks, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATA_FILE);
}

export function nextId(tasks: Task[]): number {
  return tasks.length === 0 ? 1 : Math.max(...tasks.map((t) => t.id)) + 1;
}
