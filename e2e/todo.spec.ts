import { test, expect } from '@playwright/test';

test.describe('Todo App task lifecycle', () => {
  test('adds tasks by button and Enter with trimmed titles and sequential IDs', async ({ page }) => {
    const browserMessages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') browserMessages.push(message.text());
    });
    page.on('pageerror', (error) => browserMessages.push(error.message));
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Todo App', exact: true })).toBeVisible();
    await expect(page.getByTestId('empty-state')).toHaveText('No tasks yet.');
    await expect(page.getByTestId('todo-list')).toBeEmpty();

    await page.getByTestId('todo-input').fill('  Buy oat milk  ');
    await page.getByTestId('add-button').click();
    await expect(page.getByTestId('todo-input')).toHaveValue('');
    await expect(page.getByTestId('todo-title-1')).toHaveText('Buy oat milk');
    await expect(page.getByTestId('empty-state')).toBeHidden();

    await page.getByTestId('todo-input').fill('Call Sam');
    await page.getByTestId('todo-input').press('Enter');
    await expect(page.getByTestId('todo-input')).toHaveValue('');
    await expect(page.getByTestId('todo-list').locator('li')).toHaveCount(2);
    await expect(page.getByTestId('todo-item-1')).toBeVisible();
    await expect(page.getByTestId('todo-item-2')).toBeVisible();
    await expect(page.getByTestId('todo-list').locator('li').nth(0)).toContainText('Buy oat milk');
    await expect(page.getByTestId('todo-list').locator('li').nth(1)).toContainText('Call Sam');
    expect(browserMessages).toEqual([]);
  });

  test('opens index.html directly from disk and completes a core task interaction', async ({ page }) => {
    const browserMessages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') browserMessages.push(message.text());
    });
    page.on('pageerror', (error) => browserMessages.push(error.message));

    const { pathToFileURL } = await import('node:url');
    const { resolve } = await import('node:path');
    const indexFileUrl = pathToFileURL(resolve(process.cwd(), 'index.html')).href;
    await page.goto(indexFileUrl);

    await expect(page.getByRole('heading', { name: 'Todo App', exact: true })).toBeVisible();
    await expect(page.getByTestId('empty-state')).toHaveText('No tasks yet.');
    await page.getByTestId('todo-input').fill('Direct file task');
    await page.getByTestId('add-button').click();
    await expect(page.getByTestId('todo-title-1')).toHaveText('Direct file task');
    await page.getByTestId('todo-checkbox-1').check();
    await expect(page.getByTestId('todo-checkbox-1')).toBeChecked();
    expect(browserMessages).toEqual([]);
  });

  test('rejects blank input through both submission methods', async ({ page }) => {
    const browserMessages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') browserMessages.push(message.text());
    });
    page.on('pageerror', (error) => browserMessages.push(error.message));
    await page.goto('/');
    const input = page.getByTestId('todo-input');
    await input.fill('   ');
    await page.getByTestId('add-button').click();
    await expect(page.getByTestId('todo-list')).toBeEmpty();
    await expect(page.getByTestId('empty-state')).toHaveText('No tasks yet.');

    await input.fill('\t  ');
    await input.press('Enter');
    await expect(page.getByTestId('todo-list')).toBeEmpty();
    await expect(page.getByTestId('empty-state')).toBeVisible();
    expect(browserMessages).toEqual([]);
  });

  test('supports the task lifecycle on a mobile viewport', async ({ page }) => {
    const browserMessages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') browserMessages.push(message.text());
    });
    page.on('pageerror', (error) => browserMessages.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Todo App', exact: true })).toBeVisible();
    await page.getByTestId('todo-input').fill('Mobile task');
    await page.getByTestId('add-button').click();
    await expect(page.getByTestId('todo-title-1')).toHaveText('Mobile task');
    await page.screenshot({ path: 'test-results/todo-mobile.png', fullPage: true });
    expect(browserMessages).toEqual([]);
  });

  test('toggles one task, reopens it, and deletes tasks individually', async ({ page }) => {
    const browserMessages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') browserMessages.push(message.text());
    });
    page.on('pageerror', (error) => browserMessages.push(error.message));
    await page.goto('/');

    for (const title of ['First task', 'Second task']) {
      await page.getByTestId('todo-input').fill(title);
      await page.getByTestId('add-button').click();
    }

    await page.getByTestId('todo-checkbox-1').check();
    await expect(page.getByTestId('todo-checkbox-1')).toBeChecked();
    await expect(page.getByTestId('todo-title-1')).toHaveCSS('text-decoration-line', 'line-through');
    await expect(page.getByTestId('todo-checkbox-2')).not.toBeChecked();
    await page.getByTestId('todo-checkbox-1').uncheck();
    await expect(page.getByTestId('todo-title-1')).not.toHaveCSS('text-decoration-line', 'line-through');

    await page.getByTestId('todo-delete-1').click();
    await expect(page.getByTestId('todo-item-1')).toHaveCount(0);
    await expect(page.getByTestId('todo-title-2')).toHaveText('Second task');
    await page.getByTestId('todo-delete-2').click();
    await expect(page.getByTestId('todo-list')).toBeEmpty();
    await expect(page.getByTestId('empty-state')).toHaveText('No tasks yet.');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    expect(browserMessages).toEqual([]);
  });
});
