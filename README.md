# Minimal Todo App

A small, single-page task list for capturing and tracking ephemeral tasks in one browser session. It is also a deterministic browser-test fixture with stable selectors and sequential task IDs.

## Run

Open `index.html` directly in a modern browser. No server, installation, build step, framework, or external dependency is required. Tasks are held in memory and intentionally reset when the page reloads.

## Behavior

- Add a trimmed, non-empty task with the **Add** button or Enter.
- Tasks appear in creation order with sequential IDs.
- Toggle completion to mark a task done or reopen it.
- Delete tasks individually; the exact empty state returns when the list is empty.

## Verification

Run the dependency-free unit/behavior tests with Node.js:

```sh
node --test frontend/tests/todo.test.js
```

The Playwright browser suite is in `e2e/todo.spec.ts`; it covers the task lifecycle, direct-file opening, mobile interaction, and browser console cleanliness. The test runner and browser are provisioned in the development sandbox; the application itself has no runtime dependencies.
