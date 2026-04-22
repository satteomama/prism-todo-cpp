# PrismTask

> A task manager you actually want to open every day.

PrismTask is a full-stack [Next.js](https://nextjs.org) + TypeScript web application
that pairs a clean CRUD task workflow with a glass-morphism login screen and an
animated, parallax-driven shard background. Built by **Prism Partners** for
CEN3101 at the University of Florida, Spring 2026.

Team: Yibo Mao · Matthew Sama · Jiantong Yao · Zaichen Hao

> **Note on the repository name.** This repository is named `prism-todo-cpp`
> for historical reasons (an earlier project scaffold). The current
> submission is the Next.js/TypeScript application under
> [`frontend/prismtask`](./frontend/prismtask).

---

## Quick start

```bash
git clone https://github.com/Felix772/prism-todo-cpp.git
cd prism-todo-cpp/frontend/prismtask
npm install
npm run dev
```

Then open <http://localhost:3000>.

**Demo credentials** (pre-seeded):

| Field    | Value                   |
| -------- | ----------------------- |
| Email    | `demo@prismtask.com`    |
| Password | `password123`           |

Session lifetime is 8 hours (HTTP-only cookie). No API keys or external
services are required.

---

## Repository layout

```
prism-todo-cpp/
├── .github/                    # CI workflow, PR + issue templates
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/ci.yml
├── docs/                       # Supplementary documentation
├── frontend/prismtask/         # The Next.js application (all active code)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/login/route.ts        # POST / DELETE session cookie
│   │   │   ├── tasks/route.ts             # GET list, POST create
│   │   │   └── tasks/[id]/route.ts        # PATCH / DELETE one task
│   │   ├── tasks/page.tsx                 # Task dashboard
│   │   ├── page.tsx                       # Login page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── auth.ts                        # Session-cookie helper
│   │   └── taskStore.ts                   # Data access (atomic writes)
│   ├── data/                              # Local JSON persistence (git-ignored)
│   │   ├── tasks.json
│   │   └── users.json
│   ├── .env.example                       # Env template for future features
│   ├── package.json
│   └── tsconfig.json
├── LICENSE
└── README.md
```

The layered architecture (Presentation → API → Data Access → Persistence) is
described in **Section 1.4** of the submission report (`PrismTask.docx`).

---

## First-run data setup

`data/tasks.json` and `data/users.json` are created automatically on the
first API call. If you start from an empty working tree, you can seed the
demo account manually:

```bash
mkdir -p data
echo '[]' > data/tasks.json
echo '[{"id":1,"email":"demo@prismtask.com","password":"password123"}]' > data/users.json
```

These files live inside `frontend/prismtask/data/` and are git-ignored (spec
§4.1 R-04) so real user data never lands in the repository.

---

## Available scripts

From inside `frontend/prismtask/`:

| Command              | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Start dev server at <http://localhost:3000>.      |
| `npm run build`      | Production build (runs the T-01 TypeScript pass). |
| `npm start`          | Serve the production build.                       |
| `npm run lint`       | ESLint on the whole project.                      |
| `npm run typecheck`  | `tsc --noEmit` — strict type check, no output.    |

---

## REST API reference

All task routes require the `prismtask_user` session cookie set by
`POST /api/auth/login`. Routes called without the cookie return **401**.

| Method | Path                       | Purpose                                   | Success    |
| ------ | -------------------------- | ----------------------------------------- | ---------- |
| POST   | `/api/auth/login`          | Log in; sets session cookie.              | 200        |
| DELETE | `/api/auth/login`          | Log out; clears session cookie.           | 200        |
| GET    | `/api/tasks`               | List tasks. Optional `?priority=High`.    | 200        |
| POST   | `/api/tasks`               | Create a task.                            | 201        |
| PATCH  | `/api/tasks/{id}`          | Update any field on a task.               | 200        |
| DELETE | `/api/tasks/{id}`          | Delete a task.                            | 200        |

Error responses:

- **400** — missing / malformed body, invalid `priority` value.
- **401** — missing or invalid session cookie.
- **404** — task id does not exist (also returned for non-numeric ids).

### Task object

```ts
interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate: string;      // YYYY-MM-DD or ISO-8601, empty string if unset
  createdAt: string;    // ISO-8601, server-generated
}
```

`id` and `createdAt` are server-owned and cannot be overwritten through
`PATCH`.

### Example: log in, create, filter, complete, delete

```bash
# Log in — saves the session cookie into ./cookies.txt
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@prismtask.com","password":"password123"}'

# Create a task (authenticated)
curl -b cookies.txt -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write report","priority":"High","dueDate":"2026-04-20"}'

# List only High-priority tasks
curl -b cookies.txt 'http://localhost:3000/api/tasks?priority=High'

# Toggle completion on task 1
curl -b cookies.txt -X PATCH http://localhost:3000/api/tasks/1 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

# Delete task 1
curl -b cookies.txt -X DELETE http://localhost:3000/api/tasks/1

# Log out
curl -b cookies.txt -X DELETE http://localhost:3000/api/auth/login
```

---

## Architecture at a glance

| Layer             | Implementation                                                     |
| ----------------- | ------------------------------------------------------------------ |
| Presentation      | React 19 + Next.js 16 App Router, Tailwind CSS utility classes     |
| Application / API | Next.js Route Handlers under `app/api/…`                           |
| Data Access       | `lib/taskStore.ts` — `readTasks()` / `writeTasks()` / `nextId()`   |
| Persistence       | Local JSON files (`data/tasks.json`, `data/users.json`)            |
| Auth              | HTTP-only, `SameSite=Lax`, 8-hour `prismtask_user` session cookie  |

Writes to `tasks.json` are atomic — the store writes to `tasks.json.tmp`
and renames into place, so a crash mid-write cannot produce a half-written
JSON file (spec §4.2.4 Reliability).

---

## Known shortcuts / tech debt

These are accepted trade-offs for the classroom demo, tracked in §4.1 of
the submission report:

- **Plain-text passwords** in `users.json` (R-01). Must be replaced with
  bcrypt before any non-classroom deployment.
- **JSON files, not a database** (R-05). The `taskStore` interface is the
  single swap point for Prisma + PostgreSQL.
- **No write-lock** on `tasks.json` (R-03). Single-user demo never observes
  concurrent writes.
- **No CSRF token** on state-changing routes (R-02). Cookie is `HttpOnly`
  + `SameSite=Lax`, which mitigates but does not eliminate CSRF.

See §4.1 of `PrismTask.docx` for the full risk register.

---

## Tooling

- **Language** — TypeScript 5.x (strict mode)
- **Framework** — Next.js 16 (App Router)
- **UI** — React 19, Tailwind CSS 4
- **Lint** — ESLint 9 (`eslint-config-next`)
- **Runtime** — Node.js 18.17+ / npm 9+

Verified on macOS 14, Ubuntu 22.04, and Windows 11.

---

## License

See [LICENSE](./LICENSE).
