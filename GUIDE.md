# PrismTask — How to run and how to push

A complete walkthrough for running the app locally and pushing your changes
to GitHub. Works on macOS, Linux, and Windows (PowerShell or WSL).

---

## Part 1 — Running the program

### 1.1 Prerequisites

You need these installed once per machine:

| Tool    | Version | Check with          |
| ------- | ------- | ------------------- |
| Node.js | 18.17+  | `node --version`    |
| npm     | 9+      | `npm --version`     |
| Git     | any     | `git --version`     |

If you're missing any, install from:
- Node + npm: <https://nodejs.org> (the LTS installer includes npm)
- Git: <https://git-scm.com/downloads>

### 1.2 First-time setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/Felix772/prism-todo-cpp.git
cd prism-todo-cpp/frontend/prismtask
npm install
```

`npm install` reads `package-lock.json` and pulls down exact dependency
versions. First run takes 30–60 seconds; subsequent runs are instant.

### 1.3 Seed the demo data (only if `data/` is empty)

The repo ships `data/users.json` pre-seeded with the demo account, and
`data/tasks.json` as an empty array. If for any reason those files are
missing, recreate them:

```bash
mkdir -p data
echo '[]' > data/tasks.json
echo '[{"id":1,"email":"demo@prismtask.com","password":"password123"}]' > data/users.json
```

On Windows PowerShell the `echo` syntax is slightly different — use:

```powershell
mkdir -Force data | Out-Null
Set-Content data/tasks.json '[]'
Set-Content data/users.json '[{"id":1,"email":"demo@prismtask.com","password":"password123"}]'
```

### 1.4 Start the dev server

```bash
npm run dev
```

You'll see output like:

```
▲ Next.js 16.2.1
- Local:   http://localhost:3000
✓ Ready in 812ms
```

Open <http://localhost:3000> in your browser. You should see the login
screen with the animated shard background.

### 1.5 Log in

Use the pre-seeded demo account:

- **Email:** `demo@prismtask.com`
- **Password:** `password123`

Press **Enter** or click **Login**. You'll be redirected to `/tasks`.

### 1.6 Exercise the full workflow

From the task dashboard you can:

1. **Create a task** — type a title, pick High / Medium / Low, optionally
   set a due date, click **Save Task**.
2. **Filter by priority** — click one of `All / High / Medium / Low` in
   the filter row. The list refetches with `?priority=…` on the query
   string.
3. **Edit a task** — click **Edit** on any row; change fields; click
   **Save**. `id` and `createdAt` are preserved automatically.
4. **Toggle complete** — click the circle on the left of any row.
5. **Delete a task** — click the **✕** on the right.
6. **Log out** — click **Log out** at the top-right; the session cookie
   is cleared and you're sent back to `/`.

All changes persist to `data/tasks.json` immediately (atomic write —
tmp-file + rename).

### 1.7 Quick API smoke test (optional)

If you want to confirm the REST API works independently of the UI:

```bash
# Log in and save the session cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@prismtask.com","password":"password123"}'

# Create a task
curl -b cookies.txt -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write report","priority":"High"}'

# List High-priority tasks
curl -b cookies.txt 'http://localhost:3000/api/tasks?priority=High'
```

### 1.8 Production build (to test the optimised bundle)

```bash
npm run build    # produces .next/
npm start        # serves the built bundle at http://localhost:3000
```

### 1.9 Useful commands

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start dev server with hot reload.             |
| `npm run build`     | Production build + strict TypeScript pass.    |
| `npm start`         | Serve the production build.                   |
| `npm run lint`      | ESLint (must pass — CI gate).                 |
| `npm run typecheck` | `tsc --noEmit` — strict type check.           |

### 1.10 Troubleshooting

- **"Port 3000 is in use"** — another process has the port. Either stop
  it, or run `npm run dev -- -p 3001` to use port 3001 instead.
- **Login returns 401** — check `data/users.json` exists and contains the
  demo account (see §1.3 above).
- **`GET /api/tasks` returns 401** — that's expected when you're not
  logged in. Log in first (the UI does this automatically; `curl`
  callers need to pass the `prismtask_user` cookie).
- **"Failed to fetch Google Fonts" during `npm run build`** — you're on
  an offline / restricted network. The current code doesn't use Google
  Fonts, so if you see this you're probably on an older checkout; pull
  the latest `main`.
- **Animations are too busy** — enable "Reduce motion" in your OS
  settings. PrismTask honours `prefers-reduced-motion` and freezes the
  shard animations automatically.

---

## Part 2 — Pushing your changes to GitHub

### 2.1 One-time setup

Configure Git with your name and GitHub email (only required once per
machine):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

If you haven't authenticated with GitHub before, the easiest path is the
GitHub CLI:

```bash
# macOS:       brew install gh
# Ubuntu:      sudo apt install gh
# Windows:     winget install --id GitHub.cli

gh auth login   # pick HTTPS, then the browser flow
```

Alternatively set up an SSH key — see
<https://docs.github.com/en/authentication/connecting-to-github-with-ssh>.

### 2.2 The everyday workflow

The team uses a **trunk-based** workflow with short-lived feature branches
(spec §2.1). Every change lands on `main` via a reviewed pull request.

**1. Make sure you're on `main` and up to date:**

```bash
git checkout main
git pull origin main
```

**2. Create a feature branch** with a descriptive name:

```bash
git checkout -b feature/<short-description>
# examples:
#   feature/task-edit
#   feature/priority-filter
#   fix/session-cookie-expiry
```

**3. Make your changes**, test locally, then stage and commit using
**Conventional Commits** (spec §2.1.2):

```bash
git add <files>           # stage specific files (preferred)
# or:
git add -A                # stage everything

git commit -m "feat: add priority filter UI to task dashboard"
```

Commit-type prefixes:

| Prefix       | Use for                                        |
| ------------ | ---------------------------------------------- |
| `feat:`      | New user-visible feature                       |
| `fix:`       | Bug fix                                        |
| `refactor:`  | Code change that doesn't add or fix behaviour  |
| `docs:`      | README, comments, this guide                   |
| `test:`      | Adding / updating tests                        |
| `chore:`     | Tooling, CI, dependencies                      |

One logical change per commit — don't mix a refactor and a feature in one
commit. Smaller commits are easier to review and easier to revert.

**4. Push the branch to GitHub:**

```bash
git push -u origin feature/<short-description>
```

The `-u` flag sets the upstream so future `git push` / `git pull` from
this branch "just work" with no extra arguments.

**5. Open a pull request:**

Either in the browser at
<https://github.com/Felix772/prism-todo-cpp/pulls>, or from the CLI:

```bash
gh pr create --base main --fill
```

The **PR template** (`.github/PULL_REQUEST_TEMPLATE.md`) will auto-fill.
Answer every section — especially the "How was this tested?" checklist.

**6. Wait for CI and review:**

CI runs `npm run lint`, `npm run typecheck`, and `npm run build` on every
push. A green check appears next to your PR when they all pass. If CI
fails, open the **Details** link to see which step broke.

Per spec §2.1.1, `main` is protected and requires **at least one
reviewer approval** before merge.

**7. Address review comments:**

Make the changes locally, then:

```bash
git add <files>
git commit -m "refactor: rename loadTasks to refreshTasks per review"
git push
```

The new commits attach to the same PR automatically.

**8. Merge:**

When the PR is approved and CI is green, click **Squash and merge** on
GitHub (spec §2.1.1 — feature branches are squash-merged into `main`).
Squashing collapses your commit history into a single clean commit on
`main`.

**9. Clean up:**

```bash
git checkout main
git pull origin main
git branch -d feature/<short-description>      # delete local branch
git push origin --delete feature/<short-description>   # delete remote branch
```

### 2.3 Hotfix workflow

For urgent fixes that must skip the normal queue (spec §2.1.1):

```bash
git checkout main
git pull origin main
git checkout -b hotfix/<short-description>
# ... fix, commit, push ...
gh pr create --base main --title "hotfix: <description>"
```

Hotfix PRs need only **one approver** and are fast-tracked.

### 2.4 Common situations

**"Your branch is behind `main`"** — someone else merged while you were
working. Rebase your branch on top of the new `main`:

```bash
git checkout main
git pull origin main
git checkout feature/<your-branch>
git rebase main
# resolve any conflicts, then:
git push --force-with-lease
```

Always use `--force-with-lease` instead of `--force` — it refuses to push
if the remote has moved unexpectedly, which protects teammates' work.

**"I committed to `main` by accident"** — move the commit to a branch:

```bash
git branch feature/accidental-commit     # mark current state as a branch
git reset --hard origin/main             # rewind local main
git checkout feature/accidental-commit   # switch to the branch
git push -u origin feature/accidental-commit
```

**"I need to undo my last commit before pushing"**:

```bash
git reset --soft HEAD~1   # keep changes staged
# or:
git reset --hard HEAD~1   # throw changes away — careful!
```

**"I committed the wrong file"** — remove it from the last commit (only
safe if you haven't pushed yet):

```bash
git restore --staged <file>
git commit --amend --no-edit
```

### 2.5 What NOT to commit

- `node_modules/` — regenerated by `npm install`.
- `.next/` — regenerated by `npm run build`.
- `tsconfig.tsbuildinfo` — TypeScript incremental-build cache.
- `next-env.d.ts` — auto-generated by Next.js on build.
- `.env.local` or any real `.env` file — these hold secrets.
- Real user data in `data/tasks.json` or `data/users.json` — the
  `.gitignore` protects against this, but double-check with
  `git status` before committing.

The `.gitignore` already excludes all of the above. If `git status` shows
any of them as untracked, something's wrong — stop and investigate before
committing.

### 2.6 Quick reference card

```bash
# start a feature
git checkout main && git pull
git checkout -b feature/my-change

# commit
git add -A
git commit -m "feat: clear description of the change"

# push and open PR
git push -u origin feature/my-change
gh pr create --base main --fill

# after merge, clean up
git checkout main && git pull
git branch -d feature/my-change
```

---

## Questions?

- Spec details — see `PrismTask.docx` (submitted separately).
- Architecture deep-dive — README §"Architecture at a glance" and spec §1.4.
- Known issues / tech debt — README §"Known shortcuts / tech debt" and
  spec §4.1 risk register.
