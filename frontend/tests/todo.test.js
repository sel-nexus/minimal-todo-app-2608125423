const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, 'index.html contains the inline application script');

function createElement() {
  const listeners = new Map();
  return {
    children: [],
    dataset: {},
    attributes: {},
    className: '',
    textContent: '',
    innerHTML: '',
    hidden: false,
    value: '',
    checked: false,
    type: '',
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
    dispatch(name, event = {}) {
      const callback = listeners.get(name);
      assert.ok(callback, `listener registered for ${name}`);
      callback(event);
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    append(...elements) {
      this.children.push(...elements);
    },
    replaceChildren(...elements) {
      this.children = [...elements];
      this.innerHTML = '';
    }
  };
}

function createApp() {
  const elements = new Map();
  for (const id of ['todo-form', 'todo-input', 'empty-state', 'todo-list', 'list-footer', 'task-count']) {
    elements.set(id, createElement());
  }
  const document = {
    getElementById(id) {
      const element = elements.get(id);
      assert.ok(element, `element #${id} exists`);
      return element;
    },
    createElement() {
      return createElement();
    }
  };
  const context = vm.createContext({ document });
  vm.runInContext(`${script[1]}\nglobalThis.__todoTestHooks = { toggleTodo, deleteTodo };`, context);
  return { elements, document, context };
}

function renderedItems(app) {
  return app.elements.get('todo-list').children;
}

test('initial render exposes the exact empty state and an empty list', () => {
  const app = createApp();
  assert.match(html, /<p id="empty-state" data-testid="empty-state">No tasks yet\.<\/p>/);
  assert.equal(app.elements.get('empty-state').hidden, false);
  assert.equal(renderedItems(app).length, 0);
  assert.equal(app.elements.get('list-footer').hidden, true);
});

test('adding trims titles, assigns sequential IDs, preserves order, and clears input', () => {
  const app = createApp();
  const input = app.elements.get('todo-input');
  input.value = '  Buy oat milk  ';
  app.elements.get('todo-form').dispatch('submit', { preventDefault() {} });
  assert.equal(input.value, '');
  input.value = 'Call Sam';
  app.elements.get('todo-form').dispatch('submit', { preventDefault() {} });

  const items = renderedItems(app);
  assert.deepEqual(items.map((item) => item.dataset.testid), ['todo-item-1', 'todo-item-2']);
  assert.equal(items[0].children[1].textContent, 'Buy oat milk');
  assert.equal(items[1].children[1].textContent, 'Call Sam');
  assert.equal(items[0].children[0].dataset.testid, 'todo-checkbox-1');
  assert.equal(items[0].children[1].dataset.testid, 'todo-title-1');
  assert.equal(items[0].children[2].dataset.testid, 'todo-delete-1');
  assert.equal(app.elements.get('empty-state').hidden, true);
  assert.equal(app.elements.get('task-count').textContent, '2 tasks');
});

test('blank and whitespace-only submissions do not create tasks or clear the input', () => {
  const app = createApp();
  const input = app.elements.get('todo-input');
  for (const value of ['', '   \t  ']) {
    input.value = value;
    app.elements.get('todo-form').dispatch('submit', { preventDefault() {} });
    assert.equal(renderedItems(app).length, 0);
    assert.equal(input.value, value);
  }
  assert.equal(app.elements.get('empty-state').hidden, false);
});

test('checkbox toggles only its task and updates completion styling in both directions', () => {
  const app = createApp();
  const input = app.elements.get('todo-input');
  for (const title of ['First', 'Second']) {
    input.value = title;
    app.elements.get('todo-form').dispatch('submit', { preventDefault() {} });
  }

  renderedItems(app)[0].children[0].dispatch('change');
  let items = renderedItems(app);
  assert.equal(items[0].children[0].checked, true);
  assert.equal(items[0].children[1].className, 'todo-title completed');
  assert.equal(items[1].children[0].checked, false);
  assert.equal(items[1].children[1].className, 'todo-title');

  items[0].children[0].dispatch('change');
  items = renderedItems(app);
  assert.equal(items[0].children[0].checked, false);
  assert.equal(items[0].children[1].className, 'todo-title');
});

test('deleting one task preserves the other and deleting the last restores empty state', () => {
  const app = createApp();
  const input = app.elements.get('todo-input');
  for (const title of ['Keep', 'Remove']) {
    input.value = title;
    app.elements.get('todo-form').dispatch('submit', { preventDefault() {} });
  }

  renderedItems(app)[1].children[2].dispatch('click');
  assert.deepEqual(renderedItems(app).map((item) => item.dataset.testid), ['todo-item-1']);
  assert.equal(renderedItems(app)[0].children[1].textContent, 'Keep');
  renderedItems(app)[0].children[2].dispatch('click');
  assert.equal(renderedItems(app).length, 0);
  assert.equal(app.elements.get('empty-state').hidden, false);
  assert.match(html, /<p id="empty-state" data-testid="empty-state">No tasks yet\.<\/p>/);
});

test('unknown task IDs do not mutate the list when toggled or deleted', () => {
  const app = createApp();
  const input = app.elements.get('todo-input');
  input.value = 'Existing';
  app.elements.get('todo-form').dispatch('submit', { preventDefault() {} });
  const originalItem = renderedItems(app)[0];
  const originalCheckbox = originalItem.children[0];
  const originalTitle = originalItem.children[1];
  const originalDeleteButton = originalItem.children[2];

  app.context.__todoTestHooks.toggleTodo(999);
  assert.equal(renderedItems(app).length, 1);
  assert.equal(renderedItems(app)[0], originalItem);
  assert.equal(originalCheckbox.checked, false);
  assert.equal(originalTitle.className, 'todo-title');

  app.context.__todoTestHooks.deleteTodo(999);
  assert.equal(renderedItems(app).length, 1);
  assert.equal(renderedItems(app)[0], originalItem);
  assert.equal(renderedItems(app)[0].children[2], originalDeleteButton);
  assert.equal(originalTitle.textContent, 'Existing');
});

test('page contract is self-contained and exposes required semantic selectors', () => {
  assert.match(html, /<h1>Todo App<\/h1>/);
  assert.match(html, /id="todo-input" data-testid="todo-input" type="text"/);
  assert.match(html, /id="add-button" data-testid="add-button" type="submit">Add<\/button>/);
  assert.match(html, /id="empty-state" data-testid="empty-state"/);
  assert.match(html, /<ul id="todo-list" data-testid="todo-list"/);
  assert.doesNotMatch(html, /<script\s+src=/i);
  assert.doesNotMatch(html, /<link[^>]+stylesheet/i);
});
