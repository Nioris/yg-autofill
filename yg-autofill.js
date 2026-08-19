/*
 * YG Autofill v12.0
 * Помощник для заполнения карточки игры в консоли Яндекс Игр из JSON.
 *
 * Copyright 2026 Rodrik LTD and Aleksandr Krasnokutskiy
 * Licensed under the Apache License, Version 2.0.
 * See LICENSE and NOTICE in the repository root.
 *
 * Использование: вставьте весь файл в консоль Chrome/Chromium
 * на странице черновика приложения в консоли Яндекс Игр.
 */

;(function () {
'use strict';

const VERSION = '12.0';

try {
  if (typeof window.__YGAF_CLEANUP__ === 'function') window.__YGAF_CLEANUP__();
} catch (_) {}

const LANG_NAMES = {
  ru:'Русский', en:'Английский', es:'Испанский', pt:'Португальский', tr:'Турецкий',
  de:'Немецкий', fr:'Французский', it:'Итальянский', ja:'Японский', ko:'Корейский',
  zh:'Китайский', ar:'Арабский', hi:'Хинди', id:'Индонезийский',
};

const FLAGS = {
  ru:'🇷🇺', en:'🇬🇧', es:'🇪🇸', pt:'🇧🇷', tr:'🇹🇷', de:'🇩🇪', fr:'🇫🇷',
  it:'🇮🇹', ja:'🇯🇵', ko:'🇰🇷', zh:'🇨🇳', ar:'🇸🇦', hi:'🇮🇳', id:'🇮🇩',
};

const CORE_FIELDS = [
  {
    key: 'title',
    label: 'Название игры',
    labelAliases: ['Название игры', 'Название'],
    prefer: 'INPUT',
    legacyPrefix: 'title',
    maxLength: 50,
    selectors: [
      'input[aria-label="Название игры"]',
      'input[aria-label="Название"]',
      'input[name="title"]',
      'input[name$=".title"]',
      'input[name$="[title]"]',
      '[data-testid*="title"] input',
      'input[id^="title"]',
    ],
  },
  {
    key: 'seo_description',
    label: 'Описание для поисковых систем',
    labelAliases: ['Описание для поисковых систем', 'Описание для SEO'],
    prefer: 'TEXTAREA',
    legacyPrefix: 'seo-description',
    maxLength: 160,
    selectors: [
      'textarea[aria-label="Описание для поисковых систем"]',
      'textarea[aria-label="Описание для SEO"]',
      'textarea[name="seo_description"]',
      'textarea[name="seoDescription"]',
      'textarea[name="seo-description"]',
      'textarea[name$=".seo_description"]',
      'textarea[name$=".seoDescription"]',
      '[data-testid*="seo"] textarea',
      'textarea[id^="seo-description"]',
    ],
  },
  {
    key: 'about',
    label: 'Описание игры',
    labelAliases: ['Описание игры', 'Об игре'],
    prefer: 'TEXTAREA',
    legacyPrefix: 'description',
    maxLength: 1000,
    selectors: [
      'textarea[aria-label="Описание игры"]',
      'textarea[aria-label="Об игре"]',
      'textarea[name="about"]',
      'textarea[name="description"]',
      'textarea[name$=".about"]',
      'textarea[name$=".description"]',
      '[data-testid*="description"] textarea',
      'textarea[id^="description"]',
    ],
  },
  {
    key: 'subtitle',
    alternativeKeys: ['short_description'],
    label: 'Короткое описание',
    labelAliases: ['Короткое описание'],
    prefer: 'TEXTAREA',
    legacyPrefix: 'short-description',
    maxLength: 70,
    selectors: [
      'textarea[aria-label="Короткое описание"]',
      'textarea[name="subtitle"]',
      'textarea[name="short_description"]',
      'textarea[name="short-description"]',
      'textarea[name$=".subtitle"]',
      'textarea[name$=".short_description"]',
      'textarea[name$=".short-description"]',
      '[data-testid*="short-description"] textarea',
      'textarea[id^="short-description"]',
    ],
  },
  {
    key: 'how_to_play',
    label: 'Как играть',
    labelAliases: ['Как играть'],
    prefer: 'TEXTAREA',
    legacyPrefix: 'instruction',
    maxLength: 1000,
    selectors: [
      'textarea[aria-label="Как играть"]',
      'textarea[name="how_to_play"]',
      'textarea[name="howToPlay"]',
      'textarea[name="instruction"]',
      'textarea[name$=".how_to_play"]',
      'textarea[name$=".howToPlay"]',
      'textarea[name$=".instruction"]',
      '[data-testid*="instruction"] textarea',
      'textarea[id^="instruction"]',
    ],
  },
];

const KEYWORDS_FIELD = {
  key: 'keywords',
  label: 'Ключевые слова',
  labelAliases: ['Ключевые слова'],
  prefer: 'TEXTAREA',
  legacyPrefix: 'keywords',
  maxLength: 100,
  format: 'csv',
  selectors: [
    'textarea[aria-label="Ключевые слова"]',
    'textarea[name="keywords"]',
    '[data-qa="keywords"] textarea',
    'textarea[id^="keywords"]',
  ],
};

const SUGGEST_FIELDS = {
  categories: {
    optionKey: 'categories',
    key: 'category',
    alternativeKeys: ['categories'],
    label: 'Категории',
    itemLabel: 'Категория',
    rootSelectors: ['[data-qa="categories"]'],
    inputSelectors: [
      'input[placeholder="Категории"]',
      'input[aria-label="Категории"]',
      'input[name="categories"]',
    ],
  },
  tags: {
    optionKey: 'tags',
    key: 'tags',
    label: 'Теги',
    itemLabel: 'Тег',
    rootSelectors: ['[data-qa="tags"]'],
    inputSelectors: [
      'input[placeholder="Теги"]',
      'input[aria-label="Теги"]',
      'input[name="tags"]',
    ],
  },
};

const CONTROL_SELECTOR = 'input:not([type="hidden"]):not([type="file"]), textarea, [contenteditable="true"]';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const norm = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = value => norm(value).toLocaleLowerCase('ru-RU');
const APP_ID = location.pathname.match(/\/(?:application|app)\/(\d+)(?:\/|$)/i)?.[1] || null;

// ─────────────────────────────────────────────────────────────────────────────
// Журнал программы
// ─────────────────────────────────────────────────────────────────────────────

const LOG_LIMIT = 1500;
const LOG_ENTRIES = [];
let logOutput = null;
let logToggleButton = null;
let logIssueCount = 0;
let logVisible = false;

function timestamp() {
  return new Date().toISOString().slice(11, 23);
}

function formatLogPart(value) {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  }
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  try { return JSON.stringify(value); }
  catch (_) { return String(value); }
}

function renderLogEntry(entry) {
  if (!logOutput) return;
  const line = document.createElement('div');
  line.textContent = entry.text;
  line.style.cssText = 'padding:1px 0;border-bottom:1px solid #ffffff08;white-space:pre-wrap;overflow-wrap:anywhere';
  if (entry.level === 'ERROR') line.style.color = '#ff8f8f';
  else if (entry.level === 'WARN') line.style.color = '#ffd27a';
  else if (entry.level === 'OK') line.style.color = '#8be39b';
  else if (entry.level === 'DEBUG') line.style.color = '#9ba3b8';
  else line.style.color = '#d8d8e2';
  logOutput.appendChild(line);
  logOutput.scrollTop = logOutput.scrollHeight;
}

function updateLogButton() {
  if (!logToggleButton) return;
  const suffix = logIssueCount ? ` (${logIssueCount})` : '';
  logToggleButton.textContent = `${logVisible ? 'Скрыть' : 'Показать'} лог${suffix}`;
}

function setLogVisible(visible) {
  logVisible = !!visible;
  if (logOutput?.parentElement) logOutput.parentElement.style.display = logVisible ? 'block' : 'none';
  updateLogButton();
}

function emit(level, ...parts) {
  const body = parts.map(formatLogPart).join(' ');
  const entry = { level, text: `[${timestamp()}] ${level.padEnd(5)} ${body}` };
  LOG_ENTRIES.push(entry);
  if (LOG_ENTRIES.length > LOG_LIMIT) LOG_ENTRIES.splice(0, LOG_ENTRIES.length - LOG_LIMIT);

  const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';
  console[method]('[YG]', ...parts);
  renderLogEntry(entry);

  if (level === 'WARN' || level === 'ERROR') {
    logIssueCount++;
    updateLogButton();
  }
  if (level === 'ERROR' && logOutput) setLogVisible(true);
  return entry;
}

const info = (...parts) => emit('INFO', ...parts);
const debug = (...parts) => emit('DEBUG', ...parts);
const okLog = (...parts) => emit('OK', ...parts);
const warnLog = (...parts) => emit('WARN', ...parts);
const errorLog = (...parts) => emit('ERROR', ...parts);

function logText() {
  return LOG_ENTRIES.map(entry => entry.text).join('\n');
}

async function copyLog() {
  const text = logText();
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) {}
    area.remove();
    return copied;
  }
}

function downloadLog() {
  const blob = new Blob([logText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = url;
  link.download = `yg-autofill-${APP_ID || 'unknown'}-${stamp}.log.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Поиск и заполнение обычных полей
// ─────────────────────────────────────────────────────────────────────────────

function isVisible(el) {
  if (!el || !el.isConnected || el.closest('#_ygaf')) return false;
  const style = getComputedStyle(el);
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && style.opacity !== '0'
    && el.getClientRects().length > 0;
}

function usableControl(el) {
  return !!el && isVisible(el) && !el.disabled && !el.readOnly;
}

function controlsInside(root) {
  const found = [];
  if (root?.matches?.(CONTROL_SELECTOR) && usableControl(root)) found.push(root);
  for (const el of root?.querySelectorAll?.(CONTROL_SELECTOR) || []) {
    if (usableControl(el)) found.push(el);
  }
  return [...new Set(found)];
}

function firstVisible(selectors, root = document) {
  for (const selector of selectors || []) {
    let elements = [];
    try { elements = [...root.querySelectorAll(selector)]; }
    catch (error) { warnLog('Некорректный селектор:', selector, error.message); }
    const element = elements.find(usableControl);
    if (element) return element;
  }
  return null;
}

function exactTextElements(text) {
  const target = norm(text);
  const result = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (norm(node.nodeValue) !== target) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest('#_ygaf') || !isVisible(parent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = walker.nextNode())) result.push(node.parentElement);
  return [...new Set(result)];
}

function findControlByLabel(labelText, preferredTag) {
  const labelElements = exactTextElements(labelText);

  for (const labelEl of labelElements) {
    const htmlLabel = labelEl.closest('label');
    if (htmlLabel?.htmlFor) {
      const linked = document.getElementById(htmlLabel.htmlFor);
      if (usableControl(linked)) return linked;
    }

    let container = labelEl;
    for (let depth = 0; container && depth < 9; depth++, container = container.parentElement) {
      const controls = controlsInside(container);
      if (!controls.length) continue;
      const preferred = controls.filter(el => el.tagName === preferredTag);
      if (preferred.length === 1) return preferred[0];
      if (controls.length === 1) return controls[0];
      if (preferred.length) return preferred[0];
    }

    const labelRect = labelEl.getBoundingClientRect();
    const candidates = [...document.querySelectorAll(CONTROL_SELECTOR)]
      .filter(usableControl)
      .filter(el => el.tagName === preferredTag)
      .map(el => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.top >= labelRect.top - 8 && rect.top - labelRect.bottom < 260)
      .filter(({ rect }) => rect.right >= labelRect.left && rect.left <= labelRect.right + 900)
      .sort((a, b) => (a.rect.top - labelRect.bottom) - (b.rect.top - labelRect.bottom));
    if (candidates[0]) return candidates[0].el;
  }

  return null;
}

function describeElement(el) {
  if (!el) return 'не найдено';
  const attrs = [
    el.tagName.toLowerCase(),
    el.id ? `#${el.id}` : '',
    el.name ? `[name="${el.name}"]` : '',
    el.getAttribute('data-qa') ? `[data-qa="${el.getAttribute('data-qa')}"]` : '',
    el.getAttribute('data-testid') ? `[data-testid="${el.getAttribute('data-testid')}"]` : '',
    el.getAttribute('placeholder') ? `[placeholder="${el.getAttribute('placeholder')}"]` : '',
  ].filter(Boolean).join('');
  return attrs || el.tagName.toLowerCase();
}

function findField(meta) {
  if (APP_ID && meta.legacyPrefix) {
    const legacy = document.getElementById(meta.legacyPrefix + APP_ID);
    if (usableControl(legacy)) return legacy;
  }

  const direct = firstVisible(meta.selectors);
  if (direct) return direct;

  for (const label of meta.labelAliases || [meta.label]) {
    const byLabel = findControlByLabel(label, meta.prefer);
    if (byLabel) return byLabel;
  }

  return null;
}

function normalizeList(value) {
  const raw = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(/[\n,;]+/) : []);
  const result = [];
  const seen = new Set();
  for (const item of raw) {
    const clean = norm(item);
    const key = lower(clean);
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function rawValueFor(data, meta) {
  const keys = [meta.key, ...(meta.alternativeKeys || [])];
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function valueFor(data, meta) {
  const raw = rawValueFor(data, meta);
  if (meta.format === 'csv') return normalizeList(raw).join(', ');
  if (Array.isArray(raw)) return raw.join(', ');
  return String(raw ?? '');
}

function listFor(data, meta) {
  return normalizeList(rawValueFor(data, meta));
}

function detectFieldLimit(el, fallback) {
  const nativeLimit = Number(el?.maxLength);
  if (Number.isFinite(nativeLimit) && nativeLimit > 0) return nativeLimit;

  const wrapper = el?.closest?.('[data-qa]') || el?.closest?.('[class*="field-module__field"]');
  if (wrapper) {
    const counters = [...wrapper.querySelectorAll('.form-length-tip__length, [class*="length-tip"] [class*="length"]')];
    for (const counter of counters) {
      const match = norm(counter.textContent).match(/\/(\d+)$/);
      if (match) return Number(match[1]);
    }
  }

  return Number(fallback) || null;
}

function truncateToLimit(value, limit) {
  const original = String(value ?? '');
  const max = Number(limit);

  if (!Number.isFinite(max) || max <= 0 || original.length <= max) {
    return {
      value: original,
      truncated: false,
      originalLength: original.length,
      finalLength: original.length,
      removed: 0,
      limit: Number.isFinite(max) && max > 0 ? max : null,
    };
  }

  let shortened = original.slice(0, max);

  // Не оставляем на конце половину Unicode-символа, например половину эмодзи.
  if (shortened.length) {
    const lastCode = shortened.charCodeAt(shortened.length - 1);
    if (lastCode >= 0xD800 && lastCode <= 0xDBFF) shortened = shortened.slice(0, -1);
  }

  return {
    value: shortened,
    truncated: true,
    originalLength: original.length,
    finalLength: shortened.length,
    removed: original.length - shortened.length,
    limit: max,
  };
}

function pluralRu(number, one, few, many) {
  const value = Math.abs(Number(number)) % 100;
  const last = value % 10;
  if (value > 10 && value < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

function truncationLabel(item, includeContext = false) {
  const prefix = includeContext && item.context ? `${item.context} → ` : '';
  const word = pluralRu(item.removed, 'символ', 'символа', 'символов');
  return `${prefix}${item.label}: ${item.originalLength}→${item.finalLength} (срезано ${item.removed} ${word})`;
}

function setNativeInputValue(el, value) {
  const proto = el.tagName === 'TEXTAREA'
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}

function dispatchInput(el, value) {
  try {
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      composed: true,
      inputType: 'insertText',
      data: value,
    }));
  } catch (_) {
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }
  el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

async function setTextField(el, value) {
  const text = String(value ?? '');
  if (!text) return { ok: false, actual: '', reason: 'пустое значение' };

  try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (_) {}

  for (let attempt = 1; attempt <= 2; attempt++) {
    try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }

    if (el.isContentEditable) el.textContent = text;
    else setNativeInputValue(el, text);

    dispatchInput(el, text);
    if (typeof el.blur === 'function') el.blur();
    await wait(180);

    const actual = String(el.isContentEditable ? el.textContent : el.value);
    if (actual === text) {
      if (el.tagName === 'TEXTAREA') {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
      return { ok: true, actual };
    }

    debug(`Попытка ${attempt}/2: интерфейс вернул другое значение`, {
      element: describeElement(el),
      expectedLength: text.length,
      actualLength: actual.length,
    });
  }

  const actual = String(el.isContentEditable ? el.textContent : el.value);
  return { ok: false, actual, reason: 'значение сброшено интерфейсом' };
}

async function waitForField(meta, timeout = 5000) {
  const started = Date.now();
  do {
    const field = findField(meta);
    if (field) return field;
    await wait(150);
  } while (Date.now() - started < timeout);
  return null;
}

function createResult() {
  return {
    filled: 0,
    expected: 0,
    missing: [],
    missingData: [],
    truncated: [],
    rejected: [],
    selectionErrors: [],
  };
}

function hasProblems(result) {
  return !!(
    result.missing.length
    || result.missingData.length
    || result.rejected.length
    || result.selectionErrors.length
  );
}

function hasAdjustments(result) {
  return !!result.truncated.length;
}

function mergeResult(target, source) {
  target.filled += source.filled;
  target.expected += source.expected;
  for (const key of ['missing', 'missingData', 'truncated', 'rejected', 'selectionErrors']) {
    target[key].push(...source[key]);
  }
  return target;
}

async function fillTextFields(data, metas, onProgress = () => {}, context = '') {
  const result = createResult();

  for (let index = 0; index < metas.length; index++) {
    const meta = metas[index];
    const value = valueFor(data, meta);
    if (!value) {
      debug(`${meta.label}: в JSON нет значения — пропуск`);
      continue;
    }

    result.expected++;
    onProgress(index + 1, metas.length, meta.label);

    const field = await waitForField(meta);
    if (!field) {
      result.missing.push(meta.label);
      errorLog(`${meta.label}: поле страницы не найдено`);
      continue;
    }

    const limit = detectFieldLimit(field, meta.maxLength);
    const prepared = truncateToLimit(value, limit);
    info(`${meta.label}: ${describeElement(field)}; длина ${prepared.originalLength}${limit ? `/${limit}` : ''}`);

    if (prepared.truncated) {
      const word = pluralRu(prepared.removed, 'символ', 'символа', 'символов');
      warnLog(`${meta.label}: превышен лимит ${prepared.originalLength}/${limit}; обрезаю с конца на ${prepared.removed} ${word}, итоговая длина ${prepared.finalLength}`);
    }

    try {
      const saved = await setTextField(field, prepared.value);
      if (saved.ok) {
        result.filled++;
        if (prepared.truncated) {
          const detail = {
            context,
            label: meta.label,
            originalLength: prepared.originalLength,
            finalLength: prepared.finalLength,
            removed: prepared.removed,
            limit: prepared.limit,
          };
          result.truncated.push(detail);
          okLog(`${meta.label}: заполнено после обрезки ${prepared.originalLength}→${prepared.finalLength}`);
        } else {
          okLog(`${meta.label}: заполнено`);
        }
      } else {
        result.rejected.push(meta.label);
        errorLog(`${meta.label}: ${saved.reason}; фактическая длина ${saved.actual.length}`);
      }
    } catch (error) {
      result.rejected.push(meta.label);
      errorLog(`${meta.label}: исключение при заполнении`, error);
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Категории и теги — это не обычные input, а поля с вариантами Яндекса.
// Скрипт выбирает только точное совпадение из открывшегося списка.
// ─────────────────────────────────────────────────────────────────────────────

function findSuggestedRoot(meta) {
  for (const selector of meta.rootSelectors || []) {
    const root = [...document.querySelectorAll(selector)].find(el => isVisible(el));
    if (root) return root;
  }

  for (const labelEl of exactTextElements(meta.label)) {
    const root = labelEl.closest('[data-qa], [class*="field-module__field"], .label-wrapper');
    if (root && isVisible(root)) return root;
  }

  return null;
}

function findSuggestedInput(meta, root = findSuggestedRoot(meta)) {
  if (!root) return null;
  const direct = firstVisible(meta.inputSelectors, root);
  if (direct) return direct;
  return [...root.querySelectorAll('input:not([type="hidden"])')].find(usableControl) || null;
}

function selectedWrapper(root) {
  return root?.querySelector('[data-qa="form-suggested-items-input-selected-wrapper"], [data-qa*="selected-wrapper"], [class*="items_wrapper"]') || null;
}

function cleanChipText(value) {
  return norm(value).replace(/[×✕✖]\s*$/u, '').trim();
}

function selectedItemTexts(root) {
  const wrapper = selectedWrapper(root);
  if (!wrapper) return [];
  const values = [];

  for (const child of wrapper.children) {
    const text = cleanChipText(child.textContent);
    if (text) values.push(text);
  }

  if (!values.length) {
    for (const el of wrapper.querySelectorAll('span, div, button')) {
      if (el.children.length) continue;
      const text = cleanChipText(el.textContent);
      if (text) values.push(text);
    }
  }

  return normalizeList(values);
}

function isSuggestedItemSelected(root, item) {
  const target = lower(item);
  return selectedItemTexts(root).some(value => lower(value) === target);
}

function visiblePopupRoots() {
  const selectors = [
    '[role="listbox"]',
    '.g-popup',
    '[class*="popup"]',
    '[class*="select-list"]',
    '[data-floating-ui-portal]',
  ];
  const roots = [];
  for (const selector of selectors) {
    for (const el of document.querySelectorAll(selector)) {
      if (el.closest('#_ygaf') || !isVisible(el) || el.getAttribute('aria-hidden') === 'true') continue;
      roots.push(el);
    }
  }
  return [...new Set(roots)];
}

function clickableOptionFor(el, popupRoot) {
  const clickable = el.closest('[role="option"], li, button, [data-qa*="item"], [class*="option"], [class*="item"]');
  if (clickable && popupRoot.contains(clickable)) return clickable;
  return el;
}

function popupOptionSnapshot(limit = 30) {
  const values = [];
  for (const root of visiblePopupRoots()) {
    const candidates = root.querySelectorAll('[role="option"], li, button, [data-qa*="item"], [class*="option"], [class*="item"], span, div');
    for (const el of candidates) {
      if (!isVisible(el)) continue;
      const text = norm(el.textContent);
      if (!text || text.length > 100 || text.includes('\n')) continue;
      if (el.children.length && !el.matches('[role="option"], li, button')) continue;
      values.push(text);
      if (values.length >= limit) return normalizeList(values);
    }
  }
  return normalizeList(values);
}

function findExactPopupOption(item) {
  const target = lower(item);
  const matches = [];

  for (const root of visiblePopupRoots()) {
    const candidates = root.querySelectorAll('[role="option"], li, button, [data-qa*="item"], [class*="option"], [class*="item"], span, div');
    for (const el of candidates) {
      if (!isVisible(el) || lower(el.textContent) !== target) continue;
      const clickable = clickableOptionFor(el, root);
      if (!isVisible(clickable)) continue;
      matches.push(clickable);
    }
  }

  return [...new Set(matches)].sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0] || null;
}

async function waitForExactPopupOption(item, timeout = 3500) {
  const started = Date.now();
  do {
    const option = findExactPopupOption(item);
    if (option) return option;
    await wait(100);
  } while (Date.now() - started < timeout);
  return null;
}

function fireMouseClick(el) {
  try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) {}
  const eventInit = { bubbles: true, cancelable: true, composed: true, view: window };
  try { el.dispatchEvent(new PointerEvent('pointerdown', eventInit)); } catch (_) {}
  el.dispatchEvent(new MouseEvent('mousedown', eventInit));
  try { el.dispatchEvent(new PointerEvent('pointerup', eventInit)); } catch (_) {}
  el.dispatchEvent(new MouseEvent('mouseup', eventInit));
  el.dispatchEvent(new MouseEvent('click', eventInit));
}

async function closeSuggestedPopup(input) {
  try {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true }));
  } catch (_) {}
  try { input.blur(); } catch (_) {}
  await wait(100);
}

async function selectSuggestedItem(meta, item) {
  let root = findSuggestedRoot(meta);
  let input = findSuggestedInput(meta, root);

  if (!root || !input) {
    return { ok: false, reason: 'поле или строка поиска не найдены', available: [] };
  }

  if (isSuggestedItemSelected(root, item)) {
    return { ok: true, already: true };
  }

  try { root.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (_) {}

  const opener = input.closest('[role="button"]');
  try { opener?.click(); } catch (_) {}
  try { input.click(); input.focus(); } catch (_) {}

  setNativeInputValue(input, '');
  dispatchInput(input, '');
  await wait(80);
  setNativeInputValue(input, item);
  dispatchInput(input, item);
  try {
    input.dispatchEvent(new KeyboardEvent('keyup', {
      key: item.slice(-1) || 'Unidentified',
      bubbles: true,
      composed: true,
    }));
  } catch (_) {}

  const option = await waitForExactPopupOption(item);
  if (!option) {
    const available = popupOptionSnapshot();
    await closeSuggestedPopup(input);
    return {
      ok: false,
      reason: `точный вариант «${item}» не найден в списке Яндекса`,
      available,
    };
  }

  const beforeCount = selectedItemTexts(root).length;
  fireMouseClick(option);

  const started = Date.now();
  do {
    root = findSuggestedRoot(meta) || root;
    if (isSuggestedItemSelected(root, item) || selectedItemTexts(root).length > beforeCount) {
      input = findSuggestedInput(meta, root) || input;
      if (input && input.value) {
        setNativeInputValue(input, '');
        dispatchInput(input, '');
      }
      return { ok: true, already: false };
    }
    await wait(100);
  } while (Date.now() - started < 2500);

  await closeSuggestedPopup(input);
  return {
    ok: false,
    reason: `после клика интерфейс не подтвердил выбор «${item}»`,
    available: popupOptionSnapshot(),
  };
}

async function fillSuggestedField(data, meta, statusEl) {
  const values = listFor(data, meta);
  const detail = { ok: false, selected: 0, total: values.length, failed: [], already: 0 };

  if (!values.length) {
    detail.reason = 'в JSON нет значений';
    return detail;
  }

  const root = findSuggestedRoot(meta);
  const input = findSuggestedInput(meta, root);
  if (!root || !input) {
    detail.reason = 'поле страницы не найдено';
    return detail;
  }

  info(`${meta.label}: найдено ${describeElement(input)}; значений в JSON: ${values.length}`);

  for (let index = 0; index < values.length; index++) {
    const item = values[index];
    statusEl.textContent = `${meta.label}: ${index + 1}/${values.length} — ${item}`;
    info(`${meta.itemLabel} ${index + 1}/${values.length}: выбираю «${item}»`);

    try {
      const selected = await selectSuggestedItem(meta, item);
      if (selected.ok) {
        detail.selected++;
        if (selected.already) {
          detail.already++;
          info(`${meta.itemLabel} «${item}»: уже выбрано`);
        } else {
          okLog(`${meta.itemLabel} «${item}»: выбрано`);
        }
      } else {
        detail.failed.push(item);
        errorLog(`${meta.itemLabel} «${item}»: ${selected.reason}`);
        if (selected.available?.length) {
          debug(`Видимые варианты (${selected.available.length}): ${selected.available.join(' | ')}`);
        }
      }
    } catch (error) {
      detail.failed.push(item);
      errorLog(`${meta.itemLabel} «${item}»: исключение`, error);
    }
  }

  detail.ok = detail.failed.length === 0 && detail.selected === detail.total;
  return detail;
}

// ─────────────────────────────────────────────────────────────────────────────
// Языки
// ─────────────────────────────────────────────────────────────────────────────

function tabsRoot() {
  return document.querySelector('[data-testid="application-draft-languages"]')
    || document.querySelector('.lang-selector__tabs, .gc-adaptive-tabs')
    || document;
}

function findLanguageTab(ruName) {
  const roots = [tabsRoot(), document];
  const selectors = ['[role="tab"]', '.gc-adaptive-tabs__tab', '.gc-adaptive-tabs__tab-container', 'button'];

  for (const root of roots) {
    for (const selector of selectors) {
      const candidates = [...root.querySelectorAll(selector)]
        .filter(isVisible)
        .filter(el => norm(el.textContent).startsWith(ruName));
      if (candidates.length) {
        const el = candidates[0];
        return el.closest('[role="tab"], .gc-adaptive-tabs__tab-container') || el;
      }
    }
  }
  return null;
}

function hasLangTab(ruName) {
  return !!findLanguageTab(ruName);
}

function findPlusButton() {
  const root = tabsRoot();

  const byHint = [...root.querySelectorAll('button')].find(btn => {
    if (!isVisible(btn)) return false;
    const hint = norm(`${btn.getAttribute('aria-label') || ''} ${btn.title || ''} ${btn.textContent || ''}`).toLowerCase();
    return hint === '+' || hint.includes('добавить язык') || hint.includes('add language');
  });
  if (byHint) return byHint;

  const selectButton = root.querySelector('.g-select button');
  if (isVisible(selectButton)) return selectButton;

  const iconOnly = [...root.querySelectorAll('button')].find(btn =>
    isVisible(btn) && btn.querySelector('svg') && !norm(btn.textContent)
  );
  return iconOnly || null;
}

function findInVisiblePopups(text) {
  const target = lower(text);
  for (const popup of visiblePopupRoots()) {
    for (const el of popup.querySelectorAll('[role="option"], li, button, div, span')) {
      if (!isVisible(el) || lower(el.textContent) !== target) continue;
      return clickableOptionFor(el, popup);
    }
  }
  return null;
}

async function addLanguage(ruName) {
  info(`Язык ${ruName}: добавляю вкладку`);
  const plusButton = findPlusButton();
  if (!plusButton) {
    errorLog('Кнопка добавления языка не найдена');
    return false;
  }

  plusButton.click();
  await wait(500);

  let item = findInVisiblePopups(ruName);
  if (!item) {
    const popupInput = [...document.querySelectorAll('.g-popup input, [role="listbox"] input, [class*="popup"] input')]
      .find(usableControl);
    if (popupInput) {
      setNativeInputValue(popupInput, ruName);
      dispatchInput(popupInput, ruName);
      await wait(350);
      item = findInVisiblePopups(ruName);
    }
  }

  if (!item) {
    errorLog(`Язык ${ruName}: не найден в списке`);
    document.body.click();
    return false;
  }

  fireMouseClick(item);
  await wait(700);
  return true;
}

async function clickLangTab(ruName) {
  let tab = findLanguageTab(ruName);
  if (tab) {
    (tab.querySelector('button, [role="tab"]') || tab).click();
    await wait(700);
    return true;
  }

  const moreButton = [...tabsRoot().querySelectorAll('button, [role="tab"]')]
    .find(el => isVisible(el) && /^\+\d+$/.test(norm(el.textContent)));
  if (moreButton) {
    moreButton.click();
    await wait(450);
    const item = findInVisiblePopups(ruName);
    if (item) {
      fireMouseClick(item);
      await wait(700);
      return true;
    }
  }

  return false;
}

function resultText(result) {
  const parts = [`заполнено ${result.filled}/${result.expected}`];
  if (result.truncated.length) parts.push(`обрезано: ${result.truncated.map(item => truncationLabel(item)).join(', ')}`);
  if (result.missing.length) parts.push(`не найдены поля: ${result.missing.join(', ')}`);
  if (result.missingData.length) parts.push(`нет данных: ${result.missingData.join(', ')}`);
  if (result.rejected.length) parts.push(`сброшены: ${result.rejected.join(', ')}`);
  if (result.selectionErrors.length) parts.push(`ошибки выбора: ${result.selectionErrors.join('; ')}`);
  return parts.join('; ');
}

async function fillLanguage(code, data, statusEl) {
  const ruName = LANG_NAMES[code];
  if (!ruName) throw new Error(`Неизвестный код языка: ${code}`);

  info(`Язык ${code}/${ruName}: начало`);

  if (!hasLangTab(ruName)) {
    statusEl.textContent = `${FLAGS[code] || ''} ${ruName} — добавляю язык...`;
    const added = await addLanguage(ruName);
    if (!added) throw new Error(`${ruName}: язык не удалось добавить`);
  }

  statusEl.textContent = `${FLAGS[code] || ''} ${ruName} — переключаю вкладку...`;
  const switched = await clickLangTab(ruName);
  if (!switched) throw new Error(`${ruName}: вкладка языка не найдена`);

  await wait(350);
  const result = await fillTextFields(data, CORE_FIELDS, (current, total, label) => {
    statusEl.textContent = `${FLAGS[code] || ''} ${ruName} — ${current}/${total}: ${label}`;
  }, ruName);

  if (hasProblems(result) || hasAdjustments(result)) warnLog(`${ruName}: ${resultText(result)}`);
  else okLog(`${ruName}: ${resultText(result)}`);
  return result;
}

function selectedOptions() {
  return {
    categories: !!optionInputs.categories?.checked,
    tags: !!optionInputs.tags?.checked,
    keywords: !!optionInputs.keywords?.checked,
  };
}

async function fillGlobalFields(data, sourceCode, options, statusEl) {
  const result = createResult();
  const sourceName = LANG_NAMES[sourceCode] || sourceCode;
  info(`Дополнительные поля: источник данных ${sourceName} (${sourceCode})`);

  for (const key of ['categories', 'tags']) {
    if (!options[key]) continue;
    const meta = SUGGEST_FIELDS[key];
    result.expected++;
    const values = listFor(data, meta);

    if (!values.length) {
      result.missingData.push(meta.label);
      errorLog(`${meta.label}: в JSON нет значений`);
      continue;
    }

    statusEl.textContent = `Дополнительно — ${meta.label}`;
    const detail = await fillSuggestedField(data, meta, statusEl);
    if (detail.ok) {
      result.filled++;
      okLog(`${meta.label}: выбрано ${detail.selected}/${detail.total}${detail.already ? `; уже было ${detail.already}` : ''}`);
    } else if (detail.reason === 'поле страницы не найдено') {
      result.missing.push(meta.label);
      errorLog(`${meta.label}: поле страницы не найдено`);
    } else if (detail.reason === 'в JSON нет значений') {
      result.missingData.push(meta.label);
      errorLog(`${meta.label}: в JSON нет значений`);
    } else {
      const failed = detail.failed.length ? detail.failed.join(', ') : detail.reason || 'неизвестная ошибка';
      result.selectionErrors.push(`${meta.label}: ${failed}`);
      errorLog(`${meta.label}: выбрано ${detail.selected}/${detail.total}; ошибки: ${failed}`);
    }
  }

  if (options.keywords) {
    statusEl.textContent = 'Дополнительно — Ключевые слова';
    const keywordValue = valueFor(data, KEYWORDS_FIELD);
    if (!keywordValue) {
      result.expected++;
      result.missingData.push(KEYWORDS_FIELD.label);
      errorLog('Ключевые слова: в JSON нет значений');
    } else {
      const keywordResult = await fillTextFields(
        data,
        [KEYWORDS_FIELD],
        () => {},
        `Дополнительные поля (${sourceName})`,
      );
      mergeResult(result, keywordResult);
    }
  }

  if (hasProblems(result) || hasAdjustments(result)) warnLog(`Дополнительные поля: ${resultText(result)}`);
  else if (result.expected) okLog(`Дополнительные поля: ${resultText(result)}`);
  return result;
}

async function fillAll(langs, statusEl) {
  const codes = Object.keys(langs);
  if (!codes.length) throw new Error('Нет загруженных JSON-файлов');

  const options = selectedOptions();
  const total = createResult();
  const problems = [];

  info('='.repeat(72));
  info(`СТАРТ v${VERSION}: языков ${codes.length}; дополнительные поля`, options);

  for (let index = 0; index < codes.length; index++) {
    const code = codes[index];
    const ruName = LANG_NAMES[code] || code;
    statusEl.textContent = `[${index + 1}/${codes.length}] ${FLAGS[code] || ''} ${ruName}`;

    try {
      const result = await fillLanguage(code, langs[code], statusEl);
      mergeResult(total, result);
      if (hasProblems(result)) problems.push(`${ruName}: ${resultText(result)}`);
    } catch (error) {
      problems.push(`${ruName}: ${error.message}`);
      errorLog(`${ruName}: аварийная ошибка`, error);
    }
  }

  if (options.categories || options.tags || options.keywords) {
    const sourceCode = langs.ru ? 'ru' : codes[0];
    try {
      const globalResult = await fillGlobalFields(langs[sourceCode], sourceCode, options, statusEl);
      mergeResult(total, globalResult);
      if (hasProblems(globalResult)) problems.push(`Дополнительные поля: ${resultText(globalResult)}`);
    } catch (error) {
      problems.push(`Дополнительные поля: ${error.message}`);
      errorLog('Дополнительные поля: аварийная ошибка', error);
    }
  }

  const finalLines = [
    `Заполнено ${total.filled}/${total.expected}.`,
    `Ошибок: ${problems.length}.`,
    `Обрезано полей: ${total.truncated.length}.`,
  ];

  if (total.truncated.length) {
    finalLines.push('ОБРЕЗАНО ПРИ ЗАПОЛНЕНИИ:');
    for (const item of total.truncated) finalLines.push(`— ${truncationLabel(item, true)}`);
  }

  if (problems.length) {
    finalLines.push('ОШИБКИ:');
    for (const problem of problems) finalLines.push(`— ${problem}`);
    statusEl.textContent = `⚠️ Заполнено ${total.filled}/${total.expected}; ошибок: ${problems.length}; обрезано полей: ${total.truncated.length}.`;
    warnLog('ИТОГ С ОШИБКАМИ:\n' + finalLines.join('\n'));
    setLogVisible(true);
  } else if (total.truncated.length) {
    statusEl.textContent = `✅ Готово: заполнено ${total.filled}/${total.expected}; обрезано полей: ${total.truncated.length}.`;
    warnLog('ИТОГ С АВТООБРЕЗКОЙ:\n' + finalLines.join('\n'));
    setLogVisible(true);
  } else {
    statusEl.textContent = `✅ Готово: заполнено ${total.filled}/${total.expected}`;
    okLog(`ИТОГ: заполнено ${total.filled}/${total.expected}; ошибок нет; обрезаний нет`);
  }

  info('='.repeat(72));
  return total;
}

// ─────────────────────────────────────────────────────────────────────────────
// Проверка JSON
// ─────────────────────────────────────────────────────────────────────────────

function validateData(data, fileName) {
  const textRows = [...CORE_FIELDS, KEYWORDS_FIELD].map(meta => {
    const value = valueFor(data, meta);
    const length = value.length;
    const limit = Number(meta.maxLength) || null;
    return {
      поле: meta.label,
      есть: !!value,
      длина: length,
      лимит: limit ?? '—',
      результат: !value ? 'нет значения' : (!limit || length <= limit ? 'OK' : `будет обрезано на ${length - limit}`),
    };
  });

  const listRows = Object.values(SUGGEST_FIELDS).map(meta => {
    const values = listFor(data, meta);
    return {
      поле: meta.label,
      есть: values.length > 0,
      элементов: values.length,
      значения: values.join(' | '),
    };
  });

  console.groupCollapsed(`[YG] Проверка ${fileName}`);
  console.table(textRows);
  console.table(listRows);
  console.groupEnd();

  info(`JSON ${fileName}: язык=${data.lang || 'не указан'}, текстовых полей с данными ${textRows.filter(row => row.есть).length}/${textRows.length}`);

  for (const row of textRows) {
    if (String(row.результат).startsWith('будет обрезано')) {
      const removed = row.длина - row.лимит;
      const word = pluralRu(removed, 'символ', 'символа', 'символов');
      warnLog(`JSON ${fileName}: ${row.поле} — ${row.длина}/${row.лимит}; при заполнении будет срезано ${removed} ${word}`);
    } else if (!row.есть) {
      warnLog(`JSON ${fileName}: ${row.поле} отсутствует или пусто`);
    } else {
      debug(`JSON ${fileName}: ${row.поле} ${row.длина}/${row.лимит} — OK`);
    }
  }

  for (const row of listRows) {
    if (!row.есть) warnLog(`JSON ${fileName}: ${row.поле} отсутствуют или пусты`);
    else debug(`JSON ${fileName}: ${row.поле} — ${row.элементов} знач.`);
  }

  return { textRows, listRows };
}

function readFileText(file) {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error(`Не удалось прочитать ${file.name}`));
    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Интерфейс панели
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('_ygaf')?.remove();
let langs = {};
const optionInputs = {};

const panel = document.createElement('div');
panel.id = '_ygaf';
panel.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;background:#1a1a2e;color:#eee;padding:14px 16px;border-radius:12px;font:13px system-ui;box-shadow:0 4px 24px #000a;min-width:290px;max-width:440px;border:1px solid #333';

const header = document.createElement('div');
header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';
header.innerHTML = `<b style="color:#ffd700">⚡ YG Autofill v${VERSION}</b>`;
const closeButton = document.createElement('button');
closeButton.textContent = '✕';
closeButton.title = 'Закрыть';
closeButton.style.cssText = 'background:none;border:none;color:#aaa;cursor:pointer;font-size:15px';
header.appendChild(closeButton);
panel.appendChild(header);

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.multiple = true;
fileInput.accept = '.json,application/json';
fileInput.style.display = 'none';

const loadButton = document.createElement('button');
loadButton.textContent = '📂 Загрузить store-listing-*.json';
loadButton.style.cssText = 'padding:8px 14px;border-radius:7px;border:1px solid #555;background:#2a2a4a;color:#fff;cursor:pointer;font-size:12px;font-weight:600;width:100%;margin-bottom:8px';
loadButton.onclick = () => fileInput.click();
panel.appendChild(fileInput);
panel.appendChild(loadButton);

const optionsBox = document.createElement('div');
optionsBox.style.cssText = 'border:1px solid #3a3a52;border-radius:8px;padding:8px 9px;margin-bottom:8px;background:#151526';
const optionsTitle = document.createElement('div');
optionsTitle.textContent = 'Дополнительно заполнять:';
optionsTitle.style.cssText = 'font-size:11px;color:#bbb;margin-bottom:6px;font-weight:600';
optionsBox.appendChild(optionsTitle);

function addOptionCheckbox(key, label) {
  const row = document.createElement('label');
  row.style.cssText = 'display:flex;align-items:center;gap:7px;cursor:pointer;font-size:12px;padding:2px 0;user-select:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = false;
  input.style.cssText = 'margin:0;accent-color:#ffd700';
  const text = document.createElement('span');
  text.textContent = label;
  row.append(input, text);
  optionsBox.appendChild(row);
  optionInputs[key] = input;
}

addOptionCheckbox('categories', 'Категории');
addOptionCheckbox('tags', 'Теги');
addOptionCheckbox('keywords', 'Ключевые слова');

const optionsHint = document.createElement('div');
optionsHint.textContent = 'Категории и теги выбираются только при точном совпадении с вариантом Яндекса. Тексты длиннее лимита автоматически обрезаются с конца; все обрезания перечисляются в итоговом логе. Дополнительные поля заполняются один раз из ru JSON (или из первого файла).';
optionsHint.style.cssText = 'font-size:10px;color:#85859a;line-height:1.35;margin-top:5px';
optionsBox.appendChild(optionsHint);
panel.appendChild(optionsBox);

const goButton = document.createElement('button');
goButton.textContent = '▶ Заполнить все языки';
goButton.style.cssText = 'padding:8px 14px;border-radius:7px;border:1px solid #ffd700;background:#3a3a1a;color:#ffd700;cursor:pointer;font-size:13px;font-weight:700;width:100%;margin-bottom:8px;display:none';
panel.appendChild(goButton);

const checkButton = document.createElement('button');
checkButton.textContent = '🔎 Проверить поля страницы';
checkButton.style.cssText = 'padding:6px 10px;border-radius:7px;border:1px solid #555;background:#252535;color:#bbb;cursor:pointer;font-size:11px;width:100%;margin-bottom:8px';
panel.appendChild(checkButton);

const langRow = document.createElement('div');
langRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px';
panel.appendChild(langRow);

const status = document.createElement('div');
status.style.cssText = 'font-size:11px;color:#aaa;line-height:1.4;white-space:normal;margin-bottom:8px';
status.textContent = 'Выбери JSON-файлы игры';
panel.appendChild(status);

const logButtons = document.createElement('div');
logButtons.style.cssText = 'display:grid;grid-template-columns:1fr auto auto auto;gap:5px;align-items:center';

logToggleButton = document.createElement('button');
logToggleButton.style.cssText = 'padding:5px 7px;border-radius:6px;border:1px solid #555;background:#222235;color:#ccc;cursor:pointer;font-size:10px;text-align:left';
logToggleButton.onclick = () => setLogVisible(!logVisible);
logButtons.appendChild(logToggleButton);

const copyLogButton = document.createElement('button');
copyLogButton.textContent = 'Копировать';
copyLogButton.title = 'Копировать журнал';
copyLogButton.style.cssText = 'padding:5px 7px;border-radius:6px;border:1px solid #555;background:#222235;color:#ccc;cursor:pointer;font-size:10px';
copyLogButton.onclick = async () => {
  const copied = await copyLog();
  status.textContent = copied ? 'Журнал скопирован в буфер обмена' : 'Не удалось скопировать журнал';
};
logButtons.appendChild(copyLogButton);

const saveLogButton = document.createElement('button');
saveLogButton.textContent = 'Скачать';
saveLogButton.title = 'Скачать журнал как TXT';
saveLogButton.style.cssText = copyLogButton.style.cssText;
saveLogButton.onclick = downloadLog;
logButtons.appendChild(saveLogButton);

const clearLogButton = document.createElement('button');
clearLogButton.textContent = 'Очистить';
clearLogButton.title = 'Очистить журнал';
clearLogButton.style.cssText = copyLogButton.style.cssText;
clearLogButton.onclick = () => {
  LOG_ENTRIES.length = 0;
  logIssueCount = 0;
  if (logOutput) logOutput.innerHTML = '';
  updateLogButton();
  info('Журнал очищен');
};
logButtons.appendChild(clearLogButton);
panel.appendChild(logButtons);

const logContainer = document.createElement('div');
logContainer.style.cssText = 'display:none;margin-top:7px;border:1px solid #3d3d55;border-radius:7px;background:#0e0e18;padding:6px';
logOutput = document.createElement('div');
logOutput.style.cssText = 'height:230px;overflow:auto;font:10px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace;text-align:left';
logContainer.appendChild(logOutput);
panel.appendChild(logContainer);

for (const entry of LOG_ENTRIES) renderLogEntry(entry);
setLogVisible(false);

function setBusy(button, busy, busyText, normalText) {
  button.disabled = busy;
  button.style.opacity = busy ? '0.5' : '1';
  button.textContent = busy ? busyText : normalText;
}

function buildUI(loadErrors = 0) {
  langRow.innerHTML = '';
  for (const code of Object.keys(langs)) {
    const button = document.createElement('button');
    button.textContent = `${FLAGS[code] || ''}${code.toUpperCase()}`;
    button.style.cssText = 'padding:3px 7px;border-radius:5px;border:1px solid #555;background:#333;color:#fff;cursor:pointer;font-size:11px';
    button.onclick = async () => {
      button.disabled = true;
      button.style.background = '#553';
      info(`Ручное заполнение языка ${code}`);
      try {
        const result = await fillLanguage(code, langs[code], status);
        const clean = !hasProblems(result) && !hasAdjustments(result) && result.filled === result.expected;
        const adjusted = !hasProblems(result) && hasAdjustments(result) && result.filled === result.expected;
        button.style.background = clean ? '#2a5' : adjusted ? '#a66a20' : '#a33';
        status.textContent = `${LANG_NAMES[code]}: ${resultText(result)}`;
        if (!clean) setLogVisible(true);
      } catch (error) {
        button.style.background = '#a33';
        status.textContent = `❌ ${error.message}`;
        errorLog(`Ручное заполнение ${code}:`, error);
        setLogVisible(true);
      } finally {
        button.disabled = false;
        button.style.borderColor = button.style.background;
      }
    };
    langRow.appendChild(button);
  }

  const count = Object.keys(langs).length;
  goButton.style.display = count ? 'block' : 'none';
  status.textContent = `Загружено языков: ${count}${loadErrors ? `; ошибок файлов: ${loadErrors}` : ''}`;
  loadButton.textContent = '📂 Выбрать другие JSON';
}

fileInput.onchange = async () => {
  langs = {};
  const files = [...fileInput.files].filter(file => file.name.toLowerCase().endsWith('.json'));
  if (!files.length) {
    status.textContent = '⚠️ Выбери JSON-файлы';
    warnLog('Файлы не выбраны или среди них нет JSON');
    setLogVisible(true);
    return;
  }

  info(`Загрузка файлов: ${files.map(file => file.name).join(', ')}`);
  status.textContent = `Читаю файлов: ${files.length}...`;
  let errors = 0;

  for (const file of files) {
    try {
      const parsed = JSON.parse(await readFileText(file));
      const fromName = file.name.match(/store-listing-([a-z]{2,3})(?:\s*\(\d+\))?\.json$/i)?.[1]?.toLowerCase();
      const code = String(parsed.lang || fromName || '').toLowerCase();
      if (!code) throw new Error('нет поля lang и кода языка в имени');
      if (langs[code]) warnLog(`${file.name}: язык ${code} уже был загружен; данные заменены последним файлом`);
      langs[code] = parsed;
      okLog(`${file.name} → ${code}: «${parsed.title || ''}»`);
      validateData(parsed, file.name);
    } catch (error) {
      errors++;
      errorLog(`${file.name}: ошибка чтения JSON`, error);
    }
  }

  buildUI(errors);
  if (errors) setLogVisible(true);
};

checkButton.onclick = () => {
  info('Проверка полей текущей страницы');
  const textReport = [...CORE_FIELDS, KEYWORDS_FIELD].map(meta => {
    const el = findField(meta);
    return {
      тип: 'текст',
      поле: meta.label,
      найдено: !!el,
      элемент: describeElement(el),
      лимит: el ? (detectFieldLimit(el, meta.maxLength) || '—') : '—',
      сейчас: el ? String(el.value ?? el.textContent ?? '').length : '—',
    };
  });

  const suggestReport = Object.values(SUGGEST_FIELDS).map(meta => {
    const root = findSuggestedRoot(meta);
    const input = findSuggestedInput(meta, root);
    return {
      тип: 'список',
      поле: meta.label,
      найдено: !!(root && input),
      элемент: describeElement(input),
      выбрано: root ? selectedItemTexts(root).length : '—',
    };
  });

  const report = [...textReport, ...suggestReport];
  console.table(report);
  for (const row of report) {
    const message = `${row.поле}: ${row.найдено ? `найдено ${row.элемент}` : 'НЕ НАЙДЕНО'}`;
    if (row.найдено) info(message);
    else errorLog(message);
  }

  const found = report.filter(row => row.найдено).length;
  status.textContent = `Поля страницы: найдено ${found}/${report.length}. Подробности — в логе.`;
  if (found < report.length) setLogVisible(true);
};

goButton.onclick = async () => {
  setBusy(goButton, true, '⏳ Работаю...', '▶ Заполнить все языки');
  try {
    await fillAll(langs, status);
  } catch (error) {
    status.textContent = `❌ ${error.message}`;
    errorLog('Аварийное завершение', error);
    setLogVisible(true);
  } finally {
    setBusy(goButton, false, '⏳ Работаю...', '▶ Заполнить все языки');
  }
};

function cleanup() {
  try { panel.remove(); } catch (_) {}
  if (window.__YGAF_CLEANUP__ === cleanup) delete window.__YGAF_CLEANUP__;
}

closeButton.onclick = cleanup;
window.__YGAF_CLEANUP__ = cleanup;
window.__YGAF_LOG__ = () => logText();

document.body.appendChild(panel);

info(`YG Autofill v${VERSION} загружен`);
info(`URL: ${location.href}`);
info(`App ID: ${APP_ID || 'не найден; поля будут искаться по селекторам и подписям'}`);
info('Тексты длиннее лимита будут автоматически обрезаны с конца; итоговый лог перечислит каждое обрезание.');
info('Журнал программы доступен в панели; console браузера также продолжает получать сообщения [YG].');

})();
