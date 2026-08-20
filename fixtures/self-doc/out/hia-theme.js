"use strict";

(() => {
  const input = document.getElementById("hia-symbol-search");
  const dataElement = document.getElementById("hia-search-data");
  const i18nElement = document.getElementById("hia-i18n-data");
  const themeElement = document.getElementById("hia-theme-data");

  if (!input || !dataElement) {
    return;
  }

  let searchData = [];

  try {
    searchData = JSON.parse(dataElement.textContent || "[]");
  } catch (_error) {
    searchData = [];
  }

  const records = searchData.map((entry) => ({
    id: entry.id,
    text: [
      entry.kind,
      entry.name,
      entry.longname,
      entry.memberof,
      entry.summary,
      ...Object.values(entry.localizedSummaries || {})
    ].join(" ").toLowerCase()
  }));

  const links = Array.from(document.querySelectorAll(".nav-group a"));
  const groups = Array.from(document.querySelectorAll(".nav-group"));
  const navigationItems = Array.from(document.querySelectorAll(".nav-tree-item"));
  const navigationBranches = Array.from(document.querySelectorAll("[data-hia-nav-branch]"));
  const articles = Array.from(document.querySelectorAll(".doclet"));

  function setVisible(element, visible) {
    element.hidden = !visible;
  }

  /**
   * 同步 search visibility，并在有查询时展开匹配项的 native disclosure ancestor。
   * Synchronizes search visibility and expands native disclosure ancestors for
   * matching entries while a query is present.
   *
   * @returns {void}
   */
  function update() {
    const query = input.value.trim().toLowerCase();
    const visibleIds = new Set(
      records
        .filter((record) => !query || record.text.includes(query))
        .map((record) => record.id)
    );

    for (const article of articles) {
      setVisible(article, visibleIds.has(article.id));
    }

    for (const link of links) {
      // <lang><zh-CN>multi-page href 的 fragment 才是稳定 topic anchor；route 文件名不参与 search identity。</zh-CN><en>Only the fragment of a multi-page href is the stable topic anchor; the route filename is not search identity.</en></lang>
      const targetId = decodeURIComponent((link.getAttribute("href") || "").split("#").pop() || "");
      setVisible(link, visibleIds.has(targetId));
    }

    // 搜索命中时展开 native disclosure ancestor，并隐藏没有可见后代的 list item。
    // On search hits, expand native disclosure ancestors and hide list items
    // without a visible descendant.
    for (const item of navigationItems) {
      const hasVisibleLink = Array.from(item.querySelectorAll("a")).some((link) => !link.hidden);
      setVisible(item, hasVisibleLink);
    }

    for (const branch of navigationBranches) {
      const hasVisibleLink = Array.from(branch.querySelectorAll("a")).some((link) => !link.hidden);

      if (query && hasVisibleLink) {
        branch.open = true;
      }
    }

    for (const group of groups) {
      const hasVisibleLink = Array.from(group.querySelectorAll("a")).some((link) => !link.hidden);
      setVisible(group, hasVisibleLink);
    }
  }

  input.addEventListener("input", update);

  let themeData = {};

  if (themeElement) {
    try {
      themeData = JSON.parse(themeElement.textContent || "{}");
    } catch (_error) {
      themeData = {};
    }
  }

  const codeFontFamilies = {
    sarasa: "\"Sarasa Mono SC\", \"Sarasa Fixed SC\", \"Noto Sans Mono CJK SC\", \"Source Han Mono SC\", \"Cascadia Code\", \"JetBrains Mono\", \"Fira Code\", monospace",
    cascadia: "\"Cascadia Code\", \"Sarasa Mono SC\", \"Sarasa Fixed SC\", \"Noto Sans Mono CJK SC\", \"Source Han Mono SC\", \"JetBrains Mono\", \"Fira Code\", monospace",
    mono: "monospace",
    system: "monospace"
  };
  const codeStorageKey = "hia-docs-code-display";
  const codeControls = document.querySelector("[data-hia-code-controls]");

  function clampNumber(value, fallback, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, number));
  }

  function normalizeCodeSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    const fontFamily = codeFontFamilies[source.fontFamily] ? source.fontFamily : "sarasa";

    return {
      fontFamily,
      fontSize: clampNumber(source.fontSize, 12, 10, 20),
      lineHeight: clampNumber(source.lineHeight, 1.55, 1.2, 2.2),
      tabSize: Math.round(clampNumber(source.tabSize, 2, 2, 8)),
      wrap: Boolean(source.wrap)
    };
  }

  function readStoredCodeSettings() {
    try {
      if (!window.localStorage) {
        return null;
      }

      const raw = window.localStorage.getItem(codeStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function writeStoredCodeSettings(settings) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(codeStorageKey, JSON.stringify(settings));
      }
    } catch (_error) {
      // Ignore storage failures; code display controls still work for the page.
    }
  }

  function clearStoredCodeSettings() {
    try {
      if (window.localStorage) {
        window.localStorage.removeItem(codeStorageKey);
      }
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  function applyCodeSettings(settings) {
    const normalized = normalizeCodeSettings(settings);
    const body = document.body;

    body.style.setProperty("--code-font-family", codeFontFamilies[normalized.fontFamily]);
    body.style.setProperty("--code-font-size", `${normalized.fontSize}px`);
    body.style.setProperty("--code-line-height", String(normalized.lineHeight));
    body.style.setProperty("--code-tab-size", String(normalized.tabSize));
    body.classList.toggle("hia-code-wrap", normalized.wrap);

    if (codeControls) {
      const fontFamilyInput = codeControls.querySelector("[data-hia-code-font-family]");
      const fontSizeInput = codeControls.querySelector("[data-hia-code-font-size]");
      const lineHeightInput = codeControls.querySelector("[data-hia-code-line-height]");
      const tabSizeInput = codeControls.querySelector("[data-hia-code-tab-size]");
      const wrapInput = codeControls.querySelector("[data-hia-code-wrap]");

      if (fontFamilyInput) {
        fontFamilyInput.value = normalized.fontFamily;
      }

      if (fontSizeInput) {
        fontSizeInput.value = String(normalized.fontSize);
      }

      if (lineHeightInput) {
        lineHeightInput.value = String(normalized.lineHeight);
      }

      if (tabSizeInput) {
        tabSizeInput.value = String(normalized.tabSize);
      }

      if (wrapInput) {
        wrapInput.checked = normalized.wrap;
      }
    }

    return normalized;
  }

  function initCodeControls() {
    if (!codeControls) {
      return;
    }

    const defaults = normalizeCodeSettings(themeData.code || {});
    const stored = readStoredCodeSettings();
    let current = applyCodeSettings(stored ? { ...defaults, ...stored } : defaults);

    function updateCodeSettings(next) {
      current = applyCodeSettings({ ...current, ...next });
      writeStoredCodeSettings(current);
    }

    const fontFamilyInput = codeControls.querySelector("[data-hia-code-font-family]");
    const fontSizeInput = codeControls.querySelector("[data-hia-code-font-size]");
    const lineHeightInput = codeControls.querySelector("[data-hia-code-line-height]");
    const tabSizeInput = codeControls.querySelector("[data-hia-code-tab-size]");
    const wrapInput = codeControls.querySelector("[data-hia-code-wrap]");
    const resetButton = codeControls.querySelector("[data-hia-code-reset]");

    if (fontFamilyInput) {
      fontFamilyInput.addEventListener("change", () => {
        updateCodeSettings({ fontFamily: fontFamilyInput.value });
      });
    }

    if (fontSizeInput) {
      fontSizeInput.addEventListener("input", () => {
        updateCodeSettings({ fontSize: fontSizeInput.value });
      });
    }

    if (lineHeightInput) {
      lineHeightInput.addEventListener("input", () => {
        updateCodeSettings({ lineHeight: lineHeightInput.value });
      });
    }

    if (tabSizeInput) {
      tabSizeInput.addEventListener("input", () => {
        updateCodeSettings({ tabSize: tabSizeInput.value });
      });
    }

    if (wrapInput) {
      wrapInput.addEventListener("change", () => {
        updateCodeSettings({ wrap: wrapInput.checked });
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        clearStoredCodeSettings();
        current = applyCodeSettings(defaults);
      });
    }
  }

  initCodeControls();

  /**
   * 应用并持久化 JTH owner 的 skin/scheme 阅读偏好；偏好不改变 URL 或 topic identity。
   * Applies and persists JTH-owned skin/scheme reading preferences; preferences
   * change neither URLs nor topic identity.
   *
   * @returns {void}
   */
  function initThemeControls() {
    // <lang><zh-CN>themeControls 是页面上唯一可见的 theme preference surface。</zh-CN><en>ThemeControls is the page's only visible theme-preference surface.</en></lang>
    const themeControls = document.querySelector("[data-hia-theme-controls]");
    if (!themeControls) {
      return;
    }

    // <lang><zh-CN>catalog 只接受 build-time 注入的 skin identity。</zh-CN><en>The catalog accepts only build-time-injected skin identities.</en></lang>
    const skinCatalog = Array.isArray(themeData.skins) ? themeData.skins.filter((value) => typeof value === "string") : [];
    // <lang><zh-CN>scheme allowlist 与中性 contract 闭集一致。</zh-CN><en>The scheme allowlist matches the neutral contract's closed set.</en></lang>
    const schemeCatalog = ["dark", "light", "system"];
    // <lang><zh-CN>固定 storage key 仅保存本地阅读偏好，不发送 telemetry。</zh-CN><en>The fixed storage key stores only a local reading preference and sends no telemetry.</en></lang>
    const storageKey = "hia-docs-theme-preference";
    // <lang><zh-CN>两个 select 分别控制 skin 与 scheme。</zh-CN><en>The two selects control skin and scheme independently.</en></lang>
    const skinSelect = themeControls.querySelector("[data-hia-skin-select]");
    const schemeSelect = themeControls.querySelector("[data-hia-scheme-select]");

    /** @returns {object|null} <lang><zh-CN>安全解析的本地偏好。</zh-CN><en>Safely parsed local preference.</en></lang> */
    function readPreference() {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(storageKey) : "";
        return raw ? JSON.parse(raw) : null;
      } catch (_error) {
        return null;
      }
    }

    /** @param {object} preference <lang><zh-CN>要保存的偏好。</zh-CN><en>Preference to store.</en></lang> */
    function writePreference(preference) {
      try {
        if (window.localStorage) {
          window.localStorage.setItem(storageKey, JSON.stringify(preference));
        }
      } catch (_error) {
        // <lang><zh-CN>存储失败不影响当前页面切换。</zh-CN><en>A storage failure does not affect switching on the current page.</en></lang>
      }
    }

    /** @param {object} candidate <lang><zh-CN>候选偏好。</zh-CN><en>Candidate preference.</en></lang> */
    function applyPreference(candidate) {
      // <lang><zh-CN>未知 skin/scheme fail closed 到 build-time selection。</zh-CN><en>An unknown skin/scheme fails closed to the build-time selection.</en></lang>
      const skinId = skinCatalog.includes(candidate && candidate.skinId) ? candidate.skinId : themeData.skinId;
      const scheme = schemeCatalog.includes(candidate && candidate.scheme) ? candidate.scheme : themeData.scheme;
      // <lang><zh-CN>先移除 catalog class，再应用一个 selected class，避免累积冲突。</zh-CN><en>Remove catalog classes before applying one selected class to prevent accumulated conflicts.</en></lang>
      for (const catalogSkin of skinCatalog) {
        document.body.classList.remove(`hia-skin-${catalogSkin}`);
      }
      document.body.classList.add(`hia-skin-${skinId}`);
      document.body.setAttribute("data-hia-skin", skinId);
      document.body.setAttribute("data-hia-scheme", scheme);
      if (skinSelect) {
        skinSelect.value = skinId;
      }
      if (schemeSelect) {
        schemeSelect.value = scheme;
      }
      return { skinId, scheme };
    }

    // <lang><zh-CN>current 是页面生命周期内唯一可变 preference state。</zh-CN><en>Current is the only mutable preference state during the page lifecycle.</en></lang>
    let current = applyPreference(readPreference() || { skinId: themeData.skinId, scheme: themeData.scheme });
    if (skinSelect) {
      skinSelect.addEventListener("change", () => {
        current = applyPreference({ ...current, skinId: skinSelect.value });
        writePreference(current);
      });
    }
    if (schemeSelect) {
      schemeSelect.addEventListener("change", () => {
        current = applyPreference({ ...current, scheme: schemeSelect.value });
        writePreference(current);
      });
    }
  }

  /**
   * 初始化每个 fetch source reader 的安全请求、完整性校验与闭集状态机。
   * Initializes safe requests, integrity verification, and the closed state
   * machine for every fetch source reader.
   *
   * @returns {void}
   */
  function initSourceReaders() {
    // <lang><zh-CN>terminalStates 与 W-P115 neutral state machine 一致。</zh-CN><en>TerminalStates matches the W-P115 neutral state machine.</en></lang>
    const terminalStates = new Set(["ready", "empty", "denied", "not-found", "integrity-error", "network-error", "aborted"]);
    // <lang><zh-CN>readerElements 只选择显式标记的 data-only surface。</zh-CN><en>ReaderElements selects only explicitly marked data-only surfaces.</en></lang>
    const readerElements = Array.from(document.querySelectorAll("[data-hia-source-reader]"));

    /** @param {string} key <lang><zh-CN>本地化 label key。</zh-CN><en>Localized label key.</en></lang> */
    function getRuntimeLabel(key) {
      const labels = themeData.labels && typeof themeData.labels === "object" ? themeData.labels : {};
      return labels[key] || key;
    }

    /** @param {ArrayBuffer} buffer <lang><zh-CN>摘要 bytes。</zh-CN><en>Digest bytes.</en></lang> */
    function bytesToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return window.btoa(binary);
    }

    for (const reader of readerElements) {
      // <lang><zh-CN>每个 reader 的 controls/output 均局部绑定，互不共享正文 state。</zh-CN><en>Each reader binds controls/output locally and shares no body state.</en></lang>
      const loadButton = reader.querySelector("[data-hia-source-load]");
      const resetButton = reader.querySelector("[data-hia-source-reset]");
      const statusElement = reader.querySelector("[data-hia-source-status]");
      const outputElement = reader.querySelector("[data-hia-source-output]");
      const outputContainer = outputElement && outputElement.closest("pre");
      if (!loadButton || !resetButton || !statusElement || !outputElement || !outputContainer) {
        continue;
      }

      // <lang><zh-CN>state 是 reader 的唯一状态事实；非法转换保持原态。</zh-CN><en>State is the reader's sole state fact; an invalid transition preserves it.</en></lang>
      let state = "idle";

      /** @param {string} nextState <lang><zh-CN>候选下一状态。</zh-CN><en>Candidate next state.</en></lang> */
      function transition(nextState) {
        const valid = (state === "idle" && nextState === "loading")
          || (state === "loading" && terminalStates.has(nextState))
          || (terminalStates.has(state) && nextState === "idle");
        if (!valid) {
          return false;
        }
        state = nextState;
        reader.setAttribute("data-hia-source-state", state);
        statusElement.setAttribute("data-hia-label", `source.state.${state}`);
        statusElement.textContent = getRuntimeLabel(`source.state.${state}`);
        loadButton.hidden = state !== "idle";
        resetButton.hidden = !terminalStates.has(state);
        outputContainer.hidden = state !== "ready";
        return true;
      }

      loadButton.addEventListener("click", async () => {
        if (!transition("loading")) {
          return;
        }
        // <lang><zh-CN>request metadata 全部来自 build-time safe profile projection。</zh-CN><en>All request metadata comes from the build-time safe profile projection.</en></lang>
        const relativeUrl = reader.getAttribute("data-hia-source-url") || "";
        const integrity = reader.getAttribute("data-hia-source-integrity") || "";
        const maxBytes = Number(reader.getAttribute("data-hia-source-max-bytes"));
        const maxLines = Number(reader.getAttribute("data-hia-source-max-lines"));
        const timeoutMs = Number(reader.getAttribute("data-hia-source-timeout-ms"));
        // <lang><zh-CN>AbortController 只实现明确 timeout，不做 retry。</zh-CN><en>AbortController implements only the explicit timeout and performs no retry.</en></lang>
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await window.fetch(relativeUrl, {
            cache: "default",
            credentials: "omit",
            mode: "same-origin",
            redirect: "error",
            signal: controller.signal
          });
          if (response.status === 401 || response.status === 403) {
            transition("denied");
            return;
          }
          if (response.status === 404) {
            transition("not-found");
            return;
          }
          if (!response.ok || response.redirected) {
            transition("network-error");
            return;
          }

          // <lang><zh-CN>先以 ArrayBuffer 执行 byte limit 与 digest，再解码为不可执行文本。</zh-CN><en>Apply the byte limit and digest to ArrayBuffer before decoding it as non-executable text.</en></lang>
          const body = await response.arrayBuffer();
          if (body.byteLength > maxBytes) {
            transition("network-error");
            return;
          }
          const separatorIndex = integrity.indexOf("-");
          const algorithm = integrity.slice(0, separatorIndex).toLowerCase();
          const expectedDigest = integrity.slice(separatorIndex + 1);
          const webAlgorithm = { sha256: "SHA-256", sha384: "SHA-384", sha512: "SHA-512" }[algorithm];
          if (!webAlgorithm || !window.crypto || !window.crypto.subtle) {
            transition("integrity-error");
            return;
          }
          const actualDigest = bytesToBase64(await window.crypto.subtle.digest(webAlgorithm, body));
          if (actualDigest !== expectedDigest) {
            transition("integrity-error");
            return;
          }
          const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
          if (text.length === 0) {
            transition("empty");
            return;
          }
          if (text.split(/\r?\n/u).length > maxLines) {
            transition("network-error");
            return;
          }
          outputElement.textContent = text;
          transition("ready");
        } catch (error) {
          transition(error && error.name === "AbortError" ? "aborted" : "network-error");
        } finally {
          window.clearTimeout(timeoutId);
        }
      });

      resetButton.addEventListener("click", () => {
        if (transition("idle")) {
          outputElement.textContent = "";
        }
      });
    }
  }

  initThemeControls();
  initSourceReaders();

  let i18nData = {};

  if (i18nElement) {
    try {
      i18nData = JSON.parse(i18nElement.textContent || "{}");
    } catch (_error) {
      i18nData = {};
    }
  }

  if (!i18nData.enabled || !Array.isArray(i18nData.locales) || !i18nData.locales.length) {
    return;
  }

  const localePageSelects = Array.from(document.querySelectorAll("[data-hia-locale-page-select]"));

  for (const select of localePageSelects) {
    select.addEventListener("change", () => {
      if (select.value) {
        window.location.href = select.value;
      }
    });
  }

  if (i18nData.runtimeSwitch === false) {
    return;
  }

  const localeControls = Array.from(document.querySelectorAll("[data-hia-locale-control]"));
  const localeSelects = Array.from(document.querySelectorAll("[data-hia-locale-select]"));
  const localizedBlocks = Array.from(document.querySelectorAll("[data-hia-locale]"));
  const storageKey = "hia-docs-locale";

  function readStoredLocale() {
    try {
      return window.localStorage ? window.localStorage.getItem(storageKey) : "";
    } catch (_error) {
      return "";
    }
  }

  function writeStoredLocale(locale) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(storageKey, locale);
      }
    } catch (_error) {
      // Ignore storage failures; language switching still works for the page.
    }
  }

  function getInitialLocale() {
    const stored = readStoredLocale();

    if (stored && i18nData.locales.includes(stored)) {
      return stored;
    }

    if (i18nData.locales.includes(i18nData.defaultLocale)) {
      return i18nData.defaultLocale;
    }

    return i18nData.locales[0];
  }

  function getLabels(locale) {
    const labels = i18nData.labels || {};
    const normalized = String(locale || "");
    const baseLocale = normalized.split("-")[0];

    return Object.assign(
      {},
      labels.en || {},
      labels[baseLocale] || {},
      labels[normalized] || {}
    );
  }

  function formatLabel(template, element) {
    return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, name) => {
      const value = element.getAttribute(`data-hia-label-${name}`);
      return value === null ? "" : value;
    });
  }

  function applyLabels(locale) {
    const labels = getLabels(locale);

    for (const element of document.querySelectorAll("[data-hia-label]")) {
      const key = element.getAttribute("data-hia-label");

      if (labels[key]) {
        element.textContent = formatLabel(labels[key], element);
      }
    }

    for (const element of document.querySelectorAll("[data-hia-label-aria]")) {
      const key = element.getAttribute("data-hia-label-aria");

      if (labels[key]) {
        element.setAttribute("aria-label", formatLabel(labels[key], element));
      }
    }

    for (const element of document.querySelectorAll("[data-hia-label-placeholder]")) {
      const key = element.getAttribute("data-hia-label-placeholder");

      if (labels[key]) {
        element.setAttribute("placeholder", formatLabel(labels[key], element));
      }
    }
  }

  function setLocale(locale) {
    if (!i18nData.locales.includes(locale)) {
      return;
    }

    document.documentElement.lang = locale;
    applyLabels(locale);

    writeStoredLocale(locale);

    for (const block of localizedBlocks) {
      setVisible(block, block.getAttribute("data-hia-locale") === locale);
    }

    for (const control of localeControls) {
      const active = control.getAttribute("data-hia-locale-control") === locale;
      control.classList.toggle("active", active);
      control.setAttribute("aria-pressed", active ? "true" : "false");
    }

    for (const select of localeSelects) {
      select.value = locale;
    }
  }

  for (const control of localeControls) {
    control.addEventListener("click", () => {
      setLocale(control.getAttribute("data-hia-locale-control"));
    });
  }

  for (const select of localeSelects) {
    select.addEventListener("change", () => {
      setLocale(select.value);
    });
  }

  setLocale(getInitialLocale());
})();
