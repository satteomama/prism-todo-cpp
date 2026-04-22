import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE = 'prismtask_user';

/**
 * Returns the email stored in the session cookie, or null if absent.
 */
export function getSessionEmail(req: NextRequest): string | null {
  const value = req.cookies.get(SESSION_COOKIE)?.value;
  return value && value.length > 0 ? value : null;
}

/**
 * Returns a 401 JSON response when the request has no session cookie,
 * or null when the caller is authenticated. Task routes use this to
 * short-circuit before touching the filesystem (spec §4.2.3 Security).
 */
export function requireAuth(req: NextRequest): NextResponse | null {
  if (getSessionEmail(req) === null) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return null;
}
