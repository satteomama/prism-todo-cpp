import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface User {
  id: number;
  email: string;
  password: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function readUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const users = readUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Set a simple session cookie so /tasks knows who is logged in
  const response = NextResponse.json({ success: true, email: user.email });
  response.cookies.set('prismtask_user', user.email, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return response;
}

// POST /api/auth/logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('prismtask_user');
  return response;
}
