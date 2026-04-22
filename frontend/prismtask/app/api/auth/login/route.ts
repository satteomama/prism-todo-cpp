import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SESSION_COOKIE } from '@/lib/auth';

interface User {
  id: number;
  email: string;
  password: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const EIGHT_HOURS_SECONDS = 60 * 60 * 8;

function readUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    return Array.isArray(parsed) ? (parsed as User[]) : [];
  } catch {
    return [];
  }
}

// POST /api/auth/login — validate credentials and set session cookie.
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password } = (payload ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const users = readUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, email: user.email });
  response.cookies.set(SESSION_COOKIE, user.email, {
    httpOnly: true,
    sameSite: 'lax', // mitigates CSRF on state-changing routes (spec R-02)
    path: '/',
    maxAge: EIGHT_HOURS_SECONDS,
  });

  return response;
}

// DELETE /api/auth/login — clear session cookie (log out).
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  // Overwrite with an immediately-expiring cookie so every cookie jar
  // (including those that ignore bare `delete`) clears the session.
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
