/* Idea Hub v2.1 appearance control — public, client-side only.
   Stores appearance preference only, never account data or credentials. */
(() => {
  'use strict';
  const KEY = 'quotecraft-ideahub-theme';
  const VALUES = new Set(['system', 'light', 'dark']);
  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  let selected = 'system';
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