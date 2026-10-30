/* Idea Hub v2.1 appearance control — public, client-side only.
   Stores appearance preference only, never account data or credentials. */
(() => {
  'use strict';
  const KEY = 'quotecraft-ideahub-theme';
  const VALUES = new Set(['system', 'light', 'dark']);
  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  let selected = 'light';
  try {
    const stored = window.localStorage.getItem(KEY);
    if (VALUES.has(stored)) selected = stored;
  } catch (_) { /* private browsing may disable storage */ }

  function apply() {
    const actual = selected === 'system' ? (dark.matches ? 'dark' : 'light') : selected;
    document.documentElement.dataset.effectiveTheme = actual;
    document.documentElement.dataset.theme = selected;
    document.documentElement.style.colorScheme = actual;
  }
  apply();
  const updateOnSystemChange = () => { if (selected === 'system') apply(); };
  if (typeof dark.addEventListener === 'function') dark.addEventListener('change', updateOnSystemChange);
  else if (typeof dark.addListener === 'function') dark.addListener(updateOnSystemChange);

  function addPicker() {
    if (document.getElementById('idea-theme')) return;
    const target = document.querySelector('.header-actions') || document.querySelector('.top nav') || document.querySelector('header.top');
    if (!target) return;
    const label = document.createElement('label');
    label.className = 'idea-theme-control';
    label.setAttribute('for', 'idea-theme');
    const caption = document.createElement('span');
    caption.textContent = 'Appearance';
    const chooser = document.createElement('select');
    chooser.id = 'idea-theme';
    chooser.setAttribute('aria-label', 'Idea Hub appearance');
    [['system','System'],['light','Light'],['dark','Dark']].forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      chooser.append(option);
    });
    chooser.value = selected;
    chooser.addEventListener('change', () => {
      if (!VALUES.has(chooser.value)) return;
      selected = chooser.value;
      try { window.localStorage.setItem(KEY, selected); } catch (_) { /* still works for current session */ }
      apply();
    });
    label.append(caption, chooser);
    target.append(label);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPicker, {once:true});
  else addPicker();
})();
/* Compact, per-page colour moods. No network calls or account storage. */
(() => {
  'use strict';
  const palettes = [
    ['mint', 'Ocean Mint'],
    ['sunset', 'Sunset Pop'],
    ['violet', 'Berry Glow']
  ];
  const allowed = new Set(palettes.map(([id]) => id));
  const key = 'quotecraft-ideahub-mood-v1:' + window.location.pathname.replace(/index\.html$/, '');
  let mood = 'mint';
  try {
    const saved = window.localStorage.getItem(key);
    if (allowed.has(saved)) mood = saved;
  } catch (_) { /* Browsers may block preference storage. */ }
  document.documentElement.dataset.mood = mood;

  function buildMoodBar() {
    if (document.getElementById('idea-moods')) return;
    const header = document.querySelector('header.top, .app-shell > header.header, body > nav');
    if (!header) return;
    const bar = document.createElement('section');
    bar.id = 'idea-moods';
    bar.className = 'idea-mood-bar';
    bar.setAttribute('aria-label', 'Choose your color mood');
    const title = document.createElement('strong');
    title.textContent = 'Choose your color mood';
    const group = document.createElement('div');
    group.className = 'idea-mood-buttons';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Color mood');
    const buttons = [];
    for (const [id, label] of palettes) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'idea-mood-choice';
      button.dataset.moodOption = id;
      button.setAttribute('aria-pressed', String(mood === id));
      const swatch = document.createElement('span');
      swatch.className = 'idea-mood-swatch';
      swatch.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.textContent = label;
      button.append(swatch, name);
      button.addEventListener('click', () => {
        mood = id;
        document.documentElement.dataset.mood = mood;
        try { window.localStorage.setItem(key, mood); } catch (_) { /* Selection still works. */ }
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        // A colour choice is a light palette; the existing dark option stays available.
        const appearance = document.getElementById('idea-theme');
        if (appearance && appearance.value !== 'light') {
          appearance.value = 'light';
          appearance.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      buttons.push(button);
      group.append(button);
    }
    bar.append(title, group);
    header.insertAdjacentElement('afterend', bar);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', buildMoodBar, { once: true });
  else buildMoodBar();
})();
