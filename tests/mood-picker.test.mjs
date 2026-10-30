import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync('idea-hub/idea-hub-theme.js', 'utf8');
const desktop = readFileSync('idea-hub/idea-hub-v2.css', 'utf8');
const mobile = readFileSync('idea-hub/mobile/idea-hub-mobile-theme.css', 'utf8');

function page(path, saved = {}) {
  const ids = new Map(), storage = { ...saved };
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.events = {}; this.attributes = {}; this.dataset = {}; this.style = {}; this.value = ''; }
    set id(v) { this._id = v; ids.set(v, this); }
    get id() { return this._id; }
    append(...items) { this.children.push(...items); }
    addEventListener(name, fn) { this.events[name] = fn; }
    dispatchEvent(event) { this.events[event.type]?.(event); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    insertAdjacentElement(_position, item) { this.next = item; }
  }
  const header = new Element('header'), nav = new Element('nav');
  const document = {
    readyState: 'complete',
    documentElement: new Element('html'),
    createElement: name => new Element(name),
    getElementById: id => ids.get(id) || null,
    querySelector: selector => selector === 'header.top, .app-shell > header.header' ? header : selector === '.top nav' ? nav : null
  };
  const window = {
    location: { pathname: path },
    matchMedia: () => ({ matches: true, addEventListener() {} }), // Simulate an OS set to dark.
    localStorage: { getItem: key => storage[key] ?? null, setItem: (key, value) => { storage[key] = value; } }
  };
  class Event { constructor(type) { this.type = type; } }
  runInNewContext(script, { document, window, Event });
  const bar = ids.get('idea-moods');
  assert.ok(bar, 'Mood bar should be visible directly after header');
  return { document, storage, buttons: bar.children[1].children, appearance: ids.get('idea-theme') };
}

test('three named choices and Ocean Mint light default', () => {
  const view = page('/idea-hub/');
  assert.deepEqual(view.buttons.map(button => button.children[1].textContent), ['Ocean Mint', 'Sunset Pop', 'Berry Glow']);
  assert.equal(view.document.documentElement.dataset.effectiveTheme, 'light');
  assert.equal(view.document.documentElement.dataset.mood, 'mint');
});

test('click selects a mood and restores original optional dark picker', () => {
  const view = page('/idea-hub/');
  view.buttons[1].events.click();
  assert.equal(view.document.documentElement.dataset.mood, 'sunset');
  assert.equal(view.buttons[1].getAttribute('aria-pressed'), 'true');
  view.appearance.value = 'dark';
  view.appearance.events.change();
  assert.equal(view.document.documentElement.dataset.effectiveTheme, 'dark');
  view.buttons[2].events.click();
  assert.equal(view.document.documentElement.dataset.effectiveTheme, 'light');
  assert.equal(view.document.documentElement.dataset.mood, 'violet');
  assert.equal(page('/idea-hub/', view.storage).document.documentElement.dataset.mood, 'violet');
  assert.equal(page('/idea-hub/terms.html', view.storage).document.documentElement.dataset.mood, 'mint');
});

test('forum, all four policies and mobile load the shared script', () => {
  for (const page of ['index', 'privacy', 'terms', 'guidelines', 'safety']) {
    assert.match(readFileSync('idea-hub/' + page + '.html', 'utf8'), /idea-hub-theme\.js/);
  }
  assert.match(readFileSync('idea-hub/mobile/index.html', 'utf8'), /\.\.\/idea-hub-theme\.js/);
  assert.equal(page('/idea-hub/mobile/').buttons.length, 3);
});

test('desktop and mobile each define the same three swatch colors and page themes', () => {
  for (const css of [desktop, mobile]) {
    for (const name of ['mint', 'sunset', 'violet']) assert.ok(css.includes('data-mood="' + name + '"'));
    for (const color of ['#55d9bd', '#6e92f7', '#fa8e91', '#ec9e3c', '#9e77ee', '#ed7cb1']) assert.ok(css.includes(color));
  }
});
