# Git Workflow Standard

This document defines the standard Git workflow to be followed for every task or feature.

## Workflow Steps

1. **Start from the `main` branch**
   - All new work must begin from the `main` branch.
   - Update `main` to the latest version first:
     ```bash
     git checkout main
     git pull origin main
     ```

2. **Create a task-related feature branch**
   - The new branch name must be descriptive and related to the task (short, kebab-case).
   - Format: `feature/<task-name>`
   - Example:
     ```bash
     git checkout -b feature/login-page-ui
     ```

3. **Work on the new branch**
   - Make only the changes relevant to that specific feature/task on this branch.

4. **Commit and push the changes**
   ```bash
   git add .
   git commit -m "feat: login page ui implementation"
   git push origin feature/login-page-ui
   ```

5. **Merge into the `main` branch**
   - Open a Pull Request or merge directly, depending on the team's process:
     ```bash
     git checkout main
     git pull origin main
     git merge feature/login-page-ui
     git push origin main
     ```

6. **Create a new branch from `main` again**
   - To start the next task, repeat steps 1–2.
   - The new branch name should relate to the new task.
   - Never commit directly to `main` or an old branch — always follow this cycle: new feature branch → code → commit/push → merge → repeat.

## Branch Naming Convention

| Type      | Format                  | Example                        |
|-----------|--------------------------|---------------------------------|
| Feature   | `feature/<task-name>`    | `feature/user-authentication`   |
| Bugfix    | `bugfix/<task-name>`     | `bugfix/fix-login-error`        |
| Hotfix    | `hotfix/<task-name>`     | `hotfix/payment-crash`          |

## Quick Reference (Cheat Sheet)

```bash
# 1. Update main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/<task-name>

# 3. Work + commit
git add .
git commit -m "feat: <short description>"

# 4. Push branch
git push origin feature/<task-name>

# 5. Merge to main
git checkout main
git pull origin main
git merge feature/<task-name>
git push origin main

# 6. Delete old branch (optional, cleanup)
git branch -d feature/<task-name>
git push origin --delete feature/<task-name>

# 7. Repeat from step 1 for next task
```

---

## Reusable Prompt (To Automate This Workflow)

Provide this setup prompt once — at the start of the conversation, or in your system/project instructions — to Claude or any assistant:

> "For this conversation/project, follow the standard Git workflow defined in `git.md`. Whenever I type just the single word **`commit`** — with no extra description — automatically execute the full sequence below without asking me for a task name or a commit message:
>
> 1. Pull the latest changes from the `main` branch.
> 2. If a new task/feature is starting, inspect the code changes (diff) to understand what was done, and create a related feature branch (format: `feature/<task-name>`), generating the branch name yourself from the actual changes.
> 3. Stage all pending changes on the current feature branch.
> 4. Analyze the staged diff and generate a clear, conventional commit message yourself that accurately describes what changed (e.g., `feat: add login page validation`, `fix: resolve chat widget scroll bug`) — do not ask me to supply it.
> 5. Commit the changes with that generated message.
> 6. Push the branch to the remote.
> 7. Merge the feature branch into `main` and push `main`.
> 8. Immediately after merging, create the next feature branch from `main` so it's ready for the next task — never commit directly to `main` or an old feature branch."

### Trigger Keyword

- Typing **`commit`** alone → triggers the entire workflow automatically (pull → branch → stage → auto-generate message → commit → push → merge → next branch). No task description or commit message needs to be typed manually — both the branch name and commit message are inferred from the actual code changes.
- Typing **`commit <extra note>`** is optional and only used if you want to add context; it is not required.

Example:
```
commit
```
Claude will inspect the changed files, figure out the branch name and commit message on its own (e.g., branch `feature/login-page-validation`, message `feat: add validation checks to login page`), then commit, push, merge into `main`, and prepare the next clean branch — all in one step.
