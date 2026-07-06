import { CodeView, parsePatchFiles } from "https://esm.sh/@pierre/diffs@$diffs_version?bundle";
import * as Diffs from "https://esm.sh/@pierre/diffs@$diffs_version?bundle";

// Custom "Atelier" theme — warm paper canvas with jewel-tone syntax. Authored as a
// standard Shiki / VS Code theme JSON; CodeView references it by name (gdiff-atelier).
const atelierTheme = {
  name: "gdiff-atelier",
  type: "light",
  colors: {
    "editor.background": "#f7f4ec",
    "editor.foreground": "#2c2823",
    "editorLineNumber.foreground": "#bcb3a1",
    "editorLineNumber.activeForeground": "#8c8475",
    "editor.selectionBackground": "#e2dac9",
    "editorCursor.foreground": "#0e7c6b",
    "diffEditor.insertedTextBackground": "rgba(77,124,15,0.16)",
    "diffEditor.removedTextBackground": "rgba(168,50,74,0.16)",
    "diffEditor.insertedLineBackground": "rgba(77,124,15,0.10)",
    "diffEditor.removedLineBackground": "rgba(168,50,74,0.10)"
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#a59b88", fontStyle: "italic" } },
    { scope: ["keyword", "keyword.control", "storage", "storage.type", "storage.modifier"], settings: { foreground: "#a8324a" } },
    { scope: ["keyword.operator"], settings: { foreground: "#9a5b00" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#4d7c0f" } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: "#9a5b00" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#b45309" } },
    { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"], settings: { foreground: "#0e7c6b" } },
    { scope: ["variable", "variable.other", "meta.definition.variable"], settings: { foreground: "#2c2823" } },
    { scope: ["variable.parameter"], settings: { foreground: "#6f5b3e" } },
    { scope: ["entity.other.attribute-name", "support.type.property-name", "meta.object-literal.key"], settings: { foreground: "#0b6557" } },
    { scope: ["entity.name.tag"], settings: { foreground: "#a8324a" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#6f6757" } },
    { scope: ["markup.heading", "markup.bold"], settings: { foreground: "#a8324a", fontStyle: "bold" } },
    { scope: ["markup.inserted"], settings: { foreground: "#4d7c0f" } },
    { scope: ["markup.deleted"], settings: { foreground: "#a8324a" } },
    { scope: ["string.regexp"], settings: { foreground: "#0e7c6b" } }
  ]
};

// Dark sibling — warm "Noir". Same jewel-tone family, lifted for a dark canvas.
const noirTheme = {
  name: "gdiff-noir",
  type: "dark",
  colors: {
    "editor.background": "#161310",
    "editor.foreground": "#ece4d6",
    "editorLineNumber.foreground": "#5f574a",
    "editorLineNumber.activeForeground": "#9a8f7d",
    "editor.selectionBackground": "#322b22",
    "editorCursor.foreground": "#5bbfae",
    "diffEditor.insertedTextBackground": "rgba(140,179,90,0.18)",
    "diffEditor.removedTextBackground": "rgba(224,107,134,0.18)",
    "diffEditor.insertedLineBackground": "rgba(140,179,90,0.10)",
    "diffEditor.removedLineBackground": "rgba(224,107,134,0.10)"
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#7d7464", fontStyle: "italic" } },
    { scope: ["keyword", "keyword.control", "storage", "storage.type", "storage.modifier"], settings: { foreground: "#e06b86" } },
    { scope: ["keyword.operator"], settings: { foreground: "#d99b5a" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#8cb35a" } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: "#d99b5a" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#e0954a" } },
    { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"], settings: { foreground: "#5bbfae" } },
    { scope: ["variable", "variable.other", "meta.definition.variable"], settings: { foreground: "#ece4d6" } },
    { scope: ["variable.parameter"], settings: { foreground: "#c9b48f" } },
    { scope: ["entity.other.attribute-name", "support.type.property-name", "meta.object-literal.key"], settings: { foreground: "#5bbfae" } },
    { scope: ["entity.name.tag"], settings: { foreground: "#e06b86" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#9a8f7d" } },
    { scope: ["markup.heading", "markup.bold"], settings: { foreground: "#e06b86", fontStyle: "bold" } },
    { scope: ["markup.inserted"], settings: { foreground: "#8cb35a" } },
    { scope: ["markup.deleted"], settings: { foreground: "#e06b86" } },
    { scope: ["string.regexp"], settings: { foreground: "#5bbfae" } }
  ]
};

let themeName = "$diffs_theme";
let customThemesReady = false;
try {
  if (typeof Diffs.registerCustomTheme === "function") {
    // 2nd arg is an async loader the highlighter calls to resolve the theme by name.
    await Diffs.registerCustomTheme("gdiff-atelier", async () => atelierTheme);
    await Diffs.registerCustomTheme("gdiff-noir", async () => noirTheme);
    customThemesReady = true;
  } else if (themeName === "gdiff-atelier") {
    themeName = "pierre-light";
  }
} catch (error) {
  if (themeName === "gdiff-atelier") themeName = "pierre-light";
}

// atob yields a Latin-1 byte string; reinterpret those bytes as UTF-8 so multibyte
// characters in the diff (em-dashes, accents, emoji) render correctly instead of mojibake.
function decodeBase64Utf8(raw) {
  const binary = atob(String(raw || "").replace(/\\s/g, ""));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}
const patchPayloads = {
  compact: decodeBase64Utf8(document.getElementById("patch-data").textContent),
  more: decodeBase64Utf8(document.getElementById("patch-more-data").textContent),
  full: decodeBase64Utf8(document.getElementById("patch-full-data").textContent)
};
const CONTEXT_LINES = 3;
let baseItems = [];
const comments = new Map();
const reviewContextId = "$review_context_id";
const repoStorageId = "$repo_storage_id";
const diffArgsStorageId = "$diff_args_storage_id";
const commentStorageScope = repoStorageId || location.pathname;
const viewStorageScope = commentStorageScope + ":" + (diffArgsStorageId || reviewContextId);
const storageKey = "gdiff-review-comments:v2:" + commentStorageScope;
const legacyStoragePrefix = "gdiff-review-comments:v2:" + commentStorageScope + ":";
const viewStorageKey = "gdiff-view-style:" + viewStorageScope;
const viewedStorageKey = "gdiff-viewed-files:v2:" + viewStorageScope;
const collapsedDirsStorageKey = "gdiff-collapsed-dirs:" + viewStorageScope;
const sidebarStorageKey = "gdiff-sidebar-collapsed:" + viewStorageScope;
const unreviewedStorageKey = "gdiff-unreviewed-only:" + viewStorageScope;
const themeStorageKey = "gdiff-theme-mode:" + viewStorageScope;
const gitAddStorageKey = "gdiff-gitadd-files:" + viewStorageScope;
let gitAddSelected = new Set(JSON.parse(localStorage.getItem(gitAddStorageKey) || "[]"));
let diffStyle = localStorage.getItem(viewStorageKey) === "unified" ? "unified" : "split";
const expandedItemModes = new Map();
let collapsedDirs = new Set(JSON.parse(localStorage.getItem(collapsedDirsStorageKey) || "[]"));
let sidebarCollapsed = localStorage.getItem(sidebarStorageKey) === "1";
let showUnreviewedOnly = localStorage.getItem(unreviewedStorageKey) === "1";
let darkMode = localStorage.getItem(themeStorageKey) === "dark";
let fileFilter = "";
let activeItemId = null;
let itemVersionSeed = 0;
let currentTarget = null;
let lastLineTarget = null;

// Config injected from gdiff env (GDIFF_TOKEN_HOOKS / GDIFF_ITEM_METRICS).
const tokenHooksEnabled = "$token_hooks" === "1";
const itemMetrics = $item_metrics;

// Untracked (never-added) files — not part of any git diff. Listed so the
// reviewer can flag them to be \`git add\`ed via the copied prompt.
const untrackedFiles = $untracked_json;

let tokenTipEl = null;
function showTokenTip(props, event) {
  if (!props) return;
  const text = props.tokenText || props.text || "";
  if (!text) return;
  const line = props.lineNumber != null ? props.lineNumber : (props.line != null ? props.line : "");
  if (!tokenTipEl) {
    tokenTipEl = document.createElement("div");
    tokenTipEl.className = "gdiff-token-tip";
    document.body.appendChild(tokenTipEl);
  }
  tokenTipEl.textContent = line !== "" ? text + "  ·  line " + line : text;
  const ev = event || props.event;
  const x = ev && ev.clientX != null ? ev.clientX : 16;
  const y = ev && ev.clientY != null ? ev.clientY : 24;
  tokenTipEl.style.left = Math.min(x + 12, window.innerWidth - 260) + "px";
  tokenTipEl.style.top = Math.max(8, y - 34) + "px";
  tokenTipEl.style.display = "block";
}
function hideTokenTip() {
  if (tokenTipEl) tokenTipEl.style.display = "none";
}

function lineSide(side) {
  return side === "deletions" ? "old" : "new";
}

function annotationSide(side) {
  return side === "old" ? "deletions" : "additions";
}

function commentId(target) {
  if (target.kind === "file") return [target.itemId, "file"].join(":");
  return [target.itemId, target.side, target.startLine + "-" + target.endLine].join(":");
}

function itemIdForFile(fileDiff, patchIndex, fileIndex) {
  return patchIndex + ":" + fileIndex + ":" + fileDiff.name;
}

function stableStringify(value) {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const diffHashCache = new Map();
let patchTextByFile = null;
function stablePatchValue(value) {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stablePatchValue);
  const skip = new Set(["annotations", "collapsed", "metadata", "version"]);
  const out = {};
  Object.keys(value).sort().forEach(key => {
    if (skip.has(key) || typeof value[key] === "function") return;
    out[key] = stablePatchValue(value[key]);
  });
  return out;
}

function patchTextForFile(fileDiff) {
  if (!patchTextByFile) patchTextByFile = parsePatchTextByFile(patchPayloads.compact);
  return patchTextByFile.get(fileDiff.name) || "";
}

function diffHashForFile(itemId, fileDiff) {
  if (diffHashCache.has(itemId)) return diffHashCache.get(itemId);
  const source = patchTextForFile(fileDiff) || stableStringify(stablePatchValue(fileDiff));
  const hash = hashString(source);
  diffHashCache.set(itemId, hash);
  return hash;
}

function loadViewedFiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(viewedStorageKey) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return new Map();
    return new Map(Object.entries(stored).filter(([, entry]) =>
      entry && typeof entry === "object" && typeof entry.diffHash === "string"
    ));
  } catch {
    return new Map();
  }
}

let viewedFiles = loadViewedFiles();

function isFileViewed(item) {
  if (!item) return false;
  const entry = viewedFiles.get(item.reviewKey);
  return Boolean(entry && entry.diffHash === item.diffHash);
}

function pruneViewedFiles(items) {
  const validKeys = new Set(items.map(item => item.reviewKey));
  let changed = false;
  for (const key of viewedFiles.keys()) {
    if (validKeys.has(key)) continue;
    viewedFiles.delete(key);
    changed = true;
  }
  if (changed) saveViewedFiles();
}

function saveViewedFiles() {
  localStorage.setItem(viewedStorageKey, JSON.stringify(Object.fromEntries(viewedFiles)));
}

function saveCollapsedDirs() {
  localStorage.setItem(collapsedDirsStorageKey, JSON.stringify(Array.from(collapsedDirs)));
}

function syncSidebarCollapsed() {
  document.querySelector(".app-shell").classList.toggle("is-sidebar-collapsed", sidebarCollapsed);
  document.body.classList.toggle("is-sidebar-collapsed", sidebarCollapsed);
  document.getElementById("sidebar-toggle-top").setAttribute("aria-pressed", sidebarCollapsed ? "true" : "false");
}

function setSidebarCollapsed(collapsed) {
  sidebarCollapsed = collapsed;
  localStorage.setItem(sidebarStorageKey, sidebarCollapsed ? "1" : "0");
  syncSidebarCollapsed();
}

function parseItems(mode) {
  const items = parsePatchFiles(patchPayloads[mode], "gdiff-" + mode).flatMap((patch, patchIndex) =>
    patch.files.map((fileDiff, fileIndex) => {
      const itemId = itemIdForFile(fileDiff, patchIndex, fileIndex);
      const item = {
        id: itemId,
        type: "diff",
        fileDiff,
        reviewKey: itemId,
        diffHash: mode === "compact" ? diffHashForFile(itemId, fileDiff) : "",
        annotations: [],
        version: itemVersionSeed
      };
      if (isFileViewed(item)) item.collapsed = true;
      item.annotations = annotationsForItem(item);
      return item;
    })
  );
  if (mode === "compact") pruneViewedFiles(items);
  return items;
}

function itemsForCurrentContext() {
  const compactItems = parseItems("compact");
  if (!expandedItemModes.size) return compactItems;
  const byMode = {
    more: null,
    full: null
  };
  return compactItems.map(item => {
    const mode = expandedItemModes.get(item.id);
    if (!mode || mode === "compact") return item;
    if (!byMode[mode]) byMode[mode] = new Map(parseItems(mode).map(expanded => [expanded.id, expanded]));
    const expanded = byMode[mode].get(item.id) || item;
    expanded.reviewKey = item.reviewKey;
    expanded.diffHash = item.diffHash;
    expanded.collapsed = isFileViewed(expanded);
    return expanded;
  });
}

function loadPatchView(scrollItemId) {
  itemVersionSeed += 1;
  const previousTarget = currentTarget;
  baseItems = itemsForCurrentContext();
  for (const item of baseItems) item.annotations = annotationsForItem(item);
  currentTarget = previousTarget && baseItems.some(item => item.id === previousTarget.itemId) ? previousTarget : null;
  if (!activeItemId || !baseItems.some(item => item.id === activeItemId)) {
    activeItemId = baseItems[0]?.id || null;
  }
  if (currentTarget) {
    const item = baseItems.find(item => item.id === currentTarget.itemId);
    if (item) item.annotations = annotationsForItem(item);
  }
  viewer.setItems(baseItems);
  renderFileList();
  syncContextToggle();
  updateReviewCount();
  if (scrollItemId) {
    requestAnimationFrame(() => {
      viewer.scrollTo({ type: "item", id: scrollItemId, align: "start", behavior: "auto" });
    });
  }
  scheduleHunkEnhancement();
}

function normalizeComment(comment) {
  if (!comment || typeof comment !== "object" || !comment.id) return null;
  return {
    id: String(comment.id),
    kind: comment.kind || "line",
    itemId: comment.itemId || "",
    file: comment.file || "",
    side: comment.side || "",
    line: Number(comment.line || comment.startLine || 0),
    startLine: Number(comment.startLine || comment.line || 0),
    endLine: Number(comment.endLine || comment.startLine || comment.line || 0),
    code: comment.code || "",
    comment: comment.comment || "",
    resolved: Boolean(comment.resolved),
    resolution: comment.resolution || ""
  };
}

function serializedComments() {
  return Array.from(comments.values()).map(normalizeComment).filter(Boolean);
}

function mergeComments(list) {
  if (!Array.isArray(list)) return;
  list.map(normalizeComment).filter(Boolean).forEach(comment => {
    comments.set(comment.id, comment);
  });
}

function parseStoredComments(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function localComments() {
  const lists = [parseStoredComments(localStorage.getItem(storageKey))];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith(legacyStoragePrefix) && key !== storageKey) {
      lists.push(parseStoredComments(localStorage.getItem(key)));
    }
  }
  return lists.flat();
}

function loadComments() {
  comments.clear();
  mergeComments(localComments());
}

function saveComments() {
  localStorage.setItem(storageKey, JSON.stringify(serializedComments()));
}

function itemForId(itemId) {
  return baseItems.find(item => item.id === itemId);
}

function uniqueItemForFile(file) {
  const matches = baseItems.filter(item => item.fileDiff.name === file);
  return matches.length === 1 ? matches[0] : null;
}

function itemForComment(comment) {
  return itemForId(comment.itemId) || uniqueItemForFile(comment.file);
}

function stripPatchPath(value) {
  const text = String(value || "").trim();
  if (!text || text === "/dev/null") return "";
  return text.replace(/^[ab]\//, "");
}

function parsePatchTextByFile(rawPatch) {
  const files = new Map();
  let file = "";
  let pendingOldFile = "";
  let lines = [];
  function flush() {
    if (!file || !lines.length) return;
    files.set(file, (files.get(file) ? files.get(file) + "\n" : "") + lines.join("\n"));
  }
  String(rawPatch || "").split(/\r?\n/).forEach(line => {
    if (line.startsWith("diff --git ")) {
      flush();
      file = "";
      pendingOldFile = "";
      lines = [line];
      return;
    }
    if (!lines.length) lines = [line];
    else lines.push(line);
    if (line.startsWith("--- ")) {
      pendingOldFile = stripPatchPath(line.slice(4).split(/\t/)[0]);
      return;
    }
    if (line.startsWith("+++ ")) {
      file = stripPatchPath(line.slice(4).split(/\t/)[0]) || pendingOldFile;
    }
  });
  flush();
  return files;
}

function parsePromptHunks(rawPatch) {
  const files = new Map();
  let file = "";
  let pendingOldFile = "";
  let hunk = null;
  let oldLine = 0;
  let newLine = 0;
  String(rawPatch || "").split(/\r?\n/).forEach(line => {
    if (line.startsWith("diff --git ")) {
      file = "";
      pendingOldFile = "";
      hunk = null;
      return;
    }
    if (line.startsWith("--- ")) {
      pendingOldFile = stripPatchPath(line.slice(4).split(/\t/)[0]);
      return;
    }
    if (line.startsWith("+++ ")) {
      file = stripPatchPath(line.slice(4).split(/\t/)[0]) || pendingOldFile;
      if (file && !files.has(file)) files.set(file, []);
      hunk = null;
      return;
    }
    const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@.*$/);
    if (match) {
      if (!file) return;
      oldLine = Number(match[1]);
      newLine = Number(match[2]);
      hunk = { file, header: line, lines: [] };
      files.get(file).push(hunk);
      return;
    }
    if (!hunk || !line) return;
    const marker = line[0];
    const code = line.slice(1);
    if (marker === " ") {
      hunk.lines.push({ oldLine, newLine, code });
      oldLine += 1;
      newLine += 1;
    } else if (marker === "+") {
      hunk.lines.push({ oldLine: null, newLine, code });
      newLine += 1;
    } else if (marker === "-") {
      hunk.lines.push({ oldLine, newLine: null, code });
      oldLine += 1;
    }
  });
  return files;
}

let promptHunks = null;
function getPromptHunks() {
  if (!promptHunks) promptHunks = parsePromptHunks(patchPayloads.full || patchPayloads.more || patchPayloads.compact);
  return promptHunks;
}

function lineNumberForSide(entry, side) {
  return side === "old" ? entry.oldLine : entry.newLine;
}

function promptContextForComment(comment) {
  if (!comment || comment.kind === "file") return null;
  const side = comment.side === "old" ? "old" : "new";
  const startLine = Number(comment.startLine || comment.line || 0);
  const endLine = Number(comment.endLine || startLine);
  const hunks = getPromptHunks().get(comment.file) || [];
  for (const hunk of hunks) {
    const sideLines = hunk.lines.filter(entry => lineNumberForSide(entry, side) != null);
    const indexes = [];
    sideLines.forEach((entry, index) => {
      const line = lineNumberForSide(entry, side);
      if (line >= startLine && line <= endLine) indexes.push(index);
    });
    if (!indexes.length) continue;
    const first = indexes[0];
    const last = indexes[indexes.length - 1];
    return {
      hunk: hunk.header,
      before: sideLines.slice(Math.max(0, first - CONTEXT_LINES), first),
      commented: indexes.map(index => sideLines[index]),
      after: sideLines.slice(last + 1, last + 1 + CONTEXT_LINES),
      side
    };
  }
  return null;
}

function commentHasCurrentAnchor(comment) {
  if (!comment) return false;
  if (!itemForComment(comment)) return false;
  if (comment.kind === "file") return true;
  return Boolean(promptContextForComment(comment));
}

function fileStat(fileDiff) {
  const add = fileDiff.insertions ?? fileDiff.additions ?? fileDiff.added;
  const del = fileDiff.deletions ?? fileDiff.removed ?? fileDiff.deleted;
  return { add: Number.isFinite(add) ? add : null, del: Number.isFinite(del) ? del : null };
}

function fileStatusGlyph(fileDiff, stat) {
  const type = String(fileDiff.type || fileDiff.status || fileDiff.changeType || "").toLowerCase();
  if (fileDiff.isNew || type.startsWith("a") || (stat.add && stat.del === 0)) return { ch: "A", cls: "s-add" };
  if (fileDiff.isDelete || fileDiff.isDeleted || type.startsWith("d") || (stat.del && stat.add === 0)) return { ch: "D", cls: "s-del" };
  if (fileDiff.isRename || type.startsWith("r")) return { ch: "R", cls: "s-mod" };
  return { ch: "M", cls: "s-mod" };
}

const COMMENT_ICON = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 3h10v7H7l-3 2.4V10H3z"/></svg>';

function commentCountForItem(itemId) {
  const item = itemForId(itemId);
  let count = 0;
  for (const comment of comments.values()) {
    if (comment.itemId === itemId || (item && uniqueItemForFile(comment.file) === item)) count += 1;
  }
  return count;
}

function updateProgress() {
  const el = document.getElementById("tree-progress");
  if (!el) return;
  let viewed = 0;
  for (const item of baseItems) if (isFileViewed(item)) viewed += 1;
  el.innerHTML = "<b>" + viewed + "</b> / " + baseItems.length + " viewed";
}

function renderFileList() {
  const list = document.getElementById("file-list");
  const filter = fileFilter.trim().toLowerCase();
  const dirCounts = new Map();
  const items = baseItems
    .filter(item => !filter || item.fileDiff.name.toLowerCase().includes(filter))
    .filter(item => !showUnreviewedOnly || !isFileViewed(item))
    .slice()
    .sort((a, b) => a.fileDiff.name.localeCompare(b.fileDiff.name));
  for (const item of items) {
    const parts = item.fileDiff.name.split("/");
    parts.pop();
    for (let index = 0; index < parts.length; index += 1) {
      const dir = parts.slice(0, index + 1).join("/");
      dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
    }
  }
  const renderedDirs = new Set();
  const rows = [];
  for (const item of items) {
    const parts = item.fileDiff.name.split("/");
    const file = parts.pop();
    let hiddenByCollapsedDir = false;
    for (let index = 0; index < parts.length; index += 1) {
      const dir = parts.slice(0, index + 1).join("/");
      const collapsed = collapsedDirs.has(dir);
      if (!renderedDirs.has(dir)) {
        renderedDirs.add(dir);
        rows.push('<button type="button" class="file-tree-folder' + (collapsed ? ' is-collapsed' : '') + '" data-dir="' + escapeHtml(dir) + '" style="padding-left:' + (8 + Math.min(index, 6) * 12) + 'px">' +
          '<span class="file-tree-file">' + escapeHtml(parts[index]) + '</span>' +
          '<span class="file-tree-count">' + (dirCounts.get(dir) || 0) + '</span>' +
          '</button>');
      }
      if (!filter && collapsed) {
        hiddenByCollapsedDir = true;
        break;
      }
    }
    if (hiddenByCollapsedDir) continue;
    const viewedClass = isFileViewed(item) ? " is-viewed" : "";
    const activeClass = item.id === activeItemId ? " is-active" : "";
    const stat = fileStat(item.fileDiff);
    const glyph = fileStatusGlyph(item.fileDiff, stat);
    const statHtml =
      (stat.add != null ? '<span class="file-tree-stat is-add">+' + stat.add + '</span>' : '') +
      (stat.del != null ? '<span class="file-tree-stat is-del">−' + stat.del + '</span>' : '');
    const commentCount = commentCountForItem(item.id);
    const commentHtml = commentCount
      ? '<span class="file-tree-comments" title="' + commentCount + ' comment' + (commentCount === 1 ? '' : 's') + '">' + COMMENT_ICON + commentCount + '</span>'
      : '';
    rows.push('<button type="button" class="file-tree-item' + viewedClass + activeClass + '" data-file-jump="' + escapeHtml(item.id) + '" style="padding-left:' + (12 + Math.min(parts.length, 6) * 12) + 'px">' +
      '<span class="file-tree-status ' + glyph.cls + '">' + glyph.ch + '</span>' +
      '<span class="file-tree-file">' + escapeHtml(file) + '</span>' +
      commentHtml +
      statHtml +
      '</button>');
  }
  list.innerHTML = rows.length ? rows.join("") : '<div class="file-tree-empty">No files match.</div>';
  updateProgress();
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  })[char]);
}

function annotationsForItem(item) {
  const annotations = Array.from(comments.values())
    .filter(comment => comment.kind !== "file" && (comment.itemId === item.id || uniqueItemForFile(comment.file) === item) && commentHasCurrentAnchor(comment))
    .map(comment => ({
      side: annotationSide(comment.side),
      lineNumber: comment.endLine,
      metadata: { kind: "comment", comment }
    }));
  if (currentTarget && currentTarget.kind !== "file" && currentTarget.itemId === item.id) {
    annotations.push({
      side: annotationSide(currentTarget.side),
      lineNumber: currentTarget.endLine,
      metadata: { kind: "editor", target: currentTarget }
    });
  }
  return annotations;
}

function syncItemAnnotations(item) {
  if (!item) return;
  const annotations = annotationsForItem(item);
  item.annotations = annotations;
  item.version = (item.version || 0) + 1;
  viewer.updateItem(item);
}

function updateReviewCount() {
  const n = comments.size;
  document.getElementById("review-count").textContent = String(n);
  const noun = document.getElementById("review-noun");
  if (noun) noun.textContent = n === 1 ? "comment" : "comments";
  const button = document.getElementById("review-count-button");
  if (button) button.title = n ? "Show all stored comments" : "Show comment list";
  const filesEl = document.getElementById("review-files");
  if (filesEl) {
    const f = gitAddSelected.size;
    filesEl.textContent = f ? (" + " + f + (f === 1 ? " file to add" : " files to add")) : "";
  }
}

function saveGitAdd() {
  localStorage.setItem(gitAddStorageKey, JSON.stringify(Array.from(gitAddSelected)));
}

function renderUntracked() {
  const panel = document.getElementById("untracked-panel");
  const list = document.getElementById("untracked-list");
  if (!panel || !list) return;
  if (!Array.isArray(untrackedFiles) || !untrackedFiles.length) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  list.innerHTML = untrackedFiles.map(file => {
    const selected = gitAddSelected.has(file);
    return '<div class="untracked-item' + (selected ? ' is-selected' : '') + '">' +
      '<span class="untracked-name" title="' + escapeHtml(file) + '">' + escapeHtml(file) + '</span>' +
      '<button type="button" class="untracked-add" data-untracked="' + escapeHtml(file) + '"' +
        ' title="Add a \\u0060git add\\u0060 instruction for this file to the copied prompt">' +
        (selected ? 'In prompt \\u2713' : '+ prompt') +
      '</button>' +
    '</div>';
  }).join("");
}

function refreshAnnotations(itemId) {
  if (itemId) {
    syncItemAnnotations(itemForId(itemId));
  } else {
    for (const item of baseItems) syncItemAnnotations(item);
  }
  updateReviewCount();
}

function renderAnnotation(annotation) {
  if (annotation.metadata && annotation.metadata.kind === "editor") {
    const target = annotation.metadata.target;
    const existing = commentForTarget(target);
    const panel = document.createElement("section");
    panel.className = "review-panel";
    panel.style.width = "min(720px, 100%)";
    panel.style.maxWidth = "100%";
    panel.style.boxSizing = "border-box";
    panel.innerHTML =
      '<p class="review-target"></p>' +
      '<pre class="review-code"></pre>' +
      '<textarea class="review-comment" placeholder="Leave feedback for this line"></textarea>' +
      '<div class="review-actions">' +
      '<span class="review-hint">⌘↵ to save · Esc to cancel</span>' +
      '<button type="button" class="review-cancel">Cancel</button>' +
      '<button type="button" class="review-save primary">Save comment</button>' +
      '</div>';
    panel.querySelector(".review-target").textContent = target.file + ":" + lineLabel(target) + " (" + target.side + ")";
    panel.querySelector(".review-code").textContent = target.code || "";
    const textarea = panel.querySelector(".review-comment");
    textarea.value = existing ? existing.comment : "";
    panel.querySelector(".review-save").addEventListener("click", () => saveCurrentComment(textarea.value));
    panel.querySelector(".review-cancel").addEventListener("click", closePanel);
    textarea.addEventListener("keydown", event => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") saveCurrentComment(textarea.value);
      if (event.key === "Escape") closePanel();
    });
    setTimeout(() => textarea.focus(), 0);
    return panel;
  }
  const node = document.createElement("span");
  node.className = "gdiff-annotation";
  node.textContent = "comment";
  node.title = annotation.metadata.comment.comment;
  return node;
}

function openComment(target, anchor) {
  if (target.kind === "file") {
    currentTarget = target;
    renderFileCommentPanel(target, anchor);
    return;
  }
  target.startLine = target.startLine || target.line;
  target.endLine = target.endLine || target.line;
  const previousItemId = currentTarget && currentTarget.kind !== "file" ? currentTarget.itemId : null;
  currentTarget = target;
  if (previousItemId && previousItemId !== currentTarget.itemId) refreshAnnotations(previousItemId);
  refreshAnnotations(currentTarget.itemId);
}

function openLineTarget(target, event) {
  if (event && event.shiftKey && lastLineTarget && lastLineTarget.itemId === target.itemId && lastLineTarget.side === target.side) {
    const startLine = Math.min(lastLineTarget.startLine, target.startLine);
    const endLine = Math.max(lastLineTarget.endLine, target.endLine);
    const rangeTarget = {
      itemId: target.itemId,
      file: target.file,
      side: target.side,
      startLine,
      endLine,
      code: "Selected lines " + startLine + "-" + endLine
    };
    lastLineTarget = target;
    openComment(rangeTarget);
    return;
  }
  lastLineTarget = target;
  openComment(target);
}

function renderFileCommentPanel(target, anchor) {
  closeFileCommentPanel();
  const existing = commentForTarget(target);
  const panel = document.createElement("section");
  panel.id = "file-comment-panel";
  panel.className = "review-panel is-file-comment";
  panel.style.position = "fixed";
  panel.style.zIndex = "31";
  panel.style.width = "min(560px, calc(100vw - 32px))";
  panel.style.maxWidth = "calc(100vw - 32px)";
  panel.style.height = "auto";
  panel.style.minHeight = "0";
  panel.innerHTML =
    '<p class="review-target"></p>' +
    '<textarea class="review-comment" placeholder="Leave feedback for this file"></textarea>' +
    '<div class="review-actions">' +
    '<span class="review-hint">⌘↵ to save · Esc to cancel</span>' +
    '<button type="button" class="review-cancel">Cancel</button>' +
    '<button type="button" class="review-save primary">Save comment</button>' +
    '</div>';
  panel.querySelector(".review-target").textContent = target.file + " (file comment)";
  const textarea = panel.querySelector(".review-comment");
  textarea.value = existing ? existing.comment : "";
  panel.querySelector(".review-save").addEventListener("click", () => saveCurrentComment(textarea.value));
  panel.querySelector(".review-cancel").addEventListener("click", closePanel);
  textarea.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") saveCurrentComment(textarea.value);
    if (event.key === "Escape") closePanel();
  });
  document.body.appendChild(panel);
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    const panelWidth = Math.min(560, window.innerWidth - 32);
    panel.style.left = Math.max(16, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 16)) + "px";
    panel.style.top = Math.min(rect.bottom + 8, window.innerHeight - 220) + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  } else {
    panel.style.right = "16px";
    panel.style.bottom = "68px";
  }
  textarea.focus();
}

function closeFileCommentPanel() {
  document.getElementById("file-comment-panel")?.remove();
}

function lineLabel(target) {
  return target.startLine === target.endLine ? String(target.startLine) : target.startLine + "-" + target.endLine;
}

function closePanel() {
  const previousItemId = currentTarget && currentTarget.kind !== "file" ? currentTarget.itemId : null;
  closeFileCommentPanel();
  currentTarget = null;
  if (previousItemId) refreshAnnotations(previousItemId);
}

function commentLabel(comment) {
  if (comment.kind === "file") return (comment.file || "file") + " (file)";
  const start = comment.startLine || comment.line || 0;
  const end = comment.endLine || start;
  const line = start === end ? String(start) : start + "-" + end;
  return (comment.file || "file") + ":" + line;
}

function truncate(value, max) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1) + "..." : text;
}

function targetFromComment(comment) {
  if (!comment) return null;
  const item = itemForComment(comment);
  if (comment.kind === "file") {
    return {
      kind: "file",
      itemId: item ? item.id : comment.itemId,
      file: comment.file,
      side: "file",
      startLine: 0,
      endLine: 0,
      code: ""
    };
  }
  const context = promptContextForComment(comment);
  const code = context && context.commented.length
    ? context.commented.map(entry => entry.code).join("\n")
    : comment.code;
  return {
    kind: "line",
    itemId: item ? item.id : comment.itemId,
    file: comment.file,
    side: comment.side,
    startLine: comment.startLine || comment.line,
    endLine: comment.endLine || comment.startLine || comment.line,
    code
  };
}

function deleteComment(id) {
  const comment = comments.get(id);
  comments.delete(id);
  saveComments();
  if (comment && itemForId(comment.itemId)) refreshAnnotations(comment.itemId);
  else refreshAnnotations();
  renderFileList();
  renderCommentList();
}

function editComment(id) {
  const comment = comments.get(id);
  if (!comment || !commentHasCurrentAnchor(comment)) return;
  const target = targetFromComment(comment);
  if (!target) return;
  closeCommentList();
  if (target.kind !== "file") expandedItemModes.set(target.itemId, "full");
  loadPatchView(target.itemId);
  requestAnimationFrame(() => {
    scrollToItem(target.itemId);
    openComment(target);
  });
}

function renderCommentList() {
  const panel = document.getElementById("gdiff-comment-list");
  if (!panel) return;
  const body = panel.querySelector(".gdiff-comment-list-body");
  const list = Array.from(comments.values()).sort((a, b) =>
    a.file.localeCompare(b.file) || a.startLine - b.startLine || a.side.localeCompare(b.side)
  );
  const gitAdds = Array.from(gitAddSelected);
  if (!list.length && !gitAdds.length) {
    body.innerHTML = '<p class="gdiff-comment-list-empty">No comments stored.</p>';
    return;
  }
  let html = list.map(comment => {
    const anchored = commentHasCurrentAnchor(comment);
    return '<div class="gdiff-comment-row' + (anchored ? '' : ' gdiff-comment-orphan') + '" data-id="' + escapeHtml(comment.id) + '">' +
      '<div class="gdiff-comment-row-head">' +
      '<span class="gdiff-comment-row-target">' + escapeHtml(commentLabel(comment)) + '</span>' +
      (anchored ? '' : '<span class="gdiff-orphan-badge">not in current diff</span>') +
      '</div>' +
      '<p class="gdiff-comment-row-feedback">' + escapeHtml(truncate(comment.comment, 240)) + '</p>' +
      '<div class="gdiff-comment-row-actions">' +
      (anchored ? '<button type="button" data-act="edit">Edit</button>' : '') +
      '<button type="button" data-act="delete">Delete</button>' +
      '</div>' +
      '</div>';
  }).join("");
  if (gitAdds.length) {
    html += '<div class="gdiff-gitadd-title">Files to git add</div>' +
      gitAdds.map(file =>
        '<div class="gdiff-comment-row gdiff-gitadd-row" data-gitadd="' + escapeHtml(file) + '">' +
        '<div class="gdiff-comment-row-head">' +
        '<span class="gdiff-comment-row-target">' + escapeHtml(file) + '</span>' +
        '</div>' +
        '<div class="gdiff-comment-row-actions">' +
        '<button type="button" data-act="gitadd-remove">Remove</button>' +
        '</div>' +
        '</div>'
      ).join("");
  }
  body.innerHTML = html;
}

function openCommentList() {
  const existing = document.getElementById("gdiff-comment-list");
  if (existing) {
    closeCommentList();
    return;
  }
  const panel = document.createElement("div");
  panel.id = "gdiff-comment-list";
  panel.className = "gdiff-comment-list";
  panel.innerHTML =
    '<div class="gdiff-comment-list-header">' +
    '<strong>Comments</strong>' +
    '<button type="button" data-act="close">Close</button>' +
    '</div>' +
    '<div class="gdiff-comment-list-body"></div>';
  panel.querySelector('[data-act="close"]').addEventListener("click", closeCommentList);
  panel.addEventListener("click", event => {
    const row = event.target.closest(".gdiff-comment-row");
    const action = event.target.closest("[data-act]");
    if (!row || !action) return;
    if (action.dataset.act === "delete") deleteComment(row.dataset.id);
    if (action.dataset.act === "edit") editComment(row.dataset.id);
    if (action.dataset.act === "gitadd-remove") {
      gitAddSelected.delete(row.dataset.gitadd);
      saveGitAdd();
      renderCommentList();
      renderUntracked();
      updateReviewCount();
    }
  });
  function onKey(event) {
    if (event.key === "Escape") closeCommentList();
  }
  function onPointer(event) {
    if (panel.contains(event.target)) return;
    if (event.target.closest(".review-bar")) return;
    closeCommentList();
  }
  panel.__cleanup = function () {
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("mousedown", onPointer, true);
  };
  document.addEventListener("keydown", onKey);
  document.addEventListener("mousedown", onPointer, true);
  document.body.appendChild(panel);
  renderCommentList();
}

function closeCommentList() {
  const panel = document.getElementById("gdiff-comment-list");
  if (!panel) return;
  if (panel.__cleanup) panel.__cleanup();
  panel.remove();
}

function saveCurrentComment(rawValue) {
  if (!currentTarget) return;
  const value = String(rawValue || "").trim();
  const id = commentId(currentTarget);
  const existing = commentForTarget(currentTarget);
  if (!value) {
    if (existing) comments.delete(existing.id);
  } else {
    if (existing && existing.id !== id) comments.delete(existing.id);
    comments.set(id, {
      id,
      kind: currentTarget.kind || "line",
      itemId: currentTarget.itemId,
      file: currentTarget.file,
      side: currentTarget.side,
      line: currentTarget.startLine || 0,
      startLine: currentTarget.startLine || 0,
      endLine: currentTarget.endLine || 0,
      code: currentTarget.code,
      comment: value,
      resolved: existing?.resolved || false,
      resolution: existing?.resolution || ""
    });
  }
  saveComments();
  if (currentTarget.kind === "file") {
    syncItemAnnotations(itemForId(currentTarget.itemId));
  }
  updateReviewCount();
  renderFileList();
  renderCommentList();
  closePanel();
}

function renderContextBlock(before, commented, after, side, xml) {
  const all = [];
  before.forEach(entry => all.push({ line: lineNumberForSide(entry, side), code: entry.code, marker: false }));
  commented.forEach(entry => all.push({ line: lineNumberForSide(entry, side), code: entry.code, marker: true }));
  after.forEach(entry => all.push({ line: lineNumberForSide(entry, side), code: entry.code, marker: false }));
  const visible = all.filter(entry => entry.line != null);
  if (!visible.length) return "";
  const width = String(visible.reduce((max, entry) => Math.max(max, entry.line), 0)).length;
  return visible.map(entry => {
    let num = String(entry.line);
    while (num.length < width) num = " " + num;
    return (entry.marker ? "> " : "  ") + num + "  " + xml(entry.code);
  }).join("\\n");
}

function commentMatchesTarget(comment, target) {
  if (!comment || !target || (comment.kind || "line") !== (target.kind || "line")) return false;
  if (comment.file !== target.file) return false;
  if ((comment.kind || "line") === "file") return true;
  return comment.side === target.side &&
    Number(comment.startLine || comment.line || 0) === Number(target.startLine || target.line || 0) &&
    Number(comment.endLine || comment.startLine || comment.line || 0) === Number(target.endLine || target.startLine || target.line || 0);
}

function commentForTarget(target) {
  const direct = comments.get(commentId(target));
  if (direct) return direct;
  return Array.from(comments.values()).find(comment => commentMatchesTarget(comment, target));
}

function buildPrompt() {
  const xml = value => String(value).replace(/[<>&'"]/g, char => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;"
  })[char]);
  const list = Array.from(comments.values()).sort((a, b) =>
    a.file.localeCompare(b.file) || a.startLine - b.startLine || a.side.localeCompare(b.side)
  );
  const lines = [];
  if (list.length) {
    lines.push(
      "Please address the following line-level review feedback from the git diff.",
      "",
      "Before editing, inspect all comments and target locations first so line numbers do not drift while you work.",
      "Then address the comments one by one.",
      "",
      "Return a concise summary of the changes you made and call out any feedback you could not apply.",
      "",
      "Each <context> block shows the commented line(s) prefixed with '> ' and up to " + CONTEXT_LINES + " surrounding lines on each side from the same hunk.",
      "",
      "<review_feedback>"
    );
  }
  list.forEach((comment, index) => {
    const context = promptContextForComment(comment);
    lines.push("  <comment index=\"" + (index + 1) + "\">");
    lines.push("    <file>" + xml(comment.file) + "</file>");
    if (comment.kind === "file") {
      lines.push("    <scope>file</scope>");
    } else {
      lines.push("    <lines side=\"" + xml(comment.side) + "\" start=\"" + xml(comment.startLine) + "\" end=\"" + xml(comment.endLine) + "\" />");
    }
    if (context && context.hunk) lines.push("    <hunk>" + xml(context.hunk) + "</hunk>");
    lines.push("    <code>" + xml(comment.code) + "</code>");
    if (context) {
      const contextBlock = renderContextBlock(context.before, context.commented, context.after, context.side, xml);
      if (contextBlock) {
        lines.push("    <context>");
        lines.push(contextBlock);
        lines.push("    </context>");
      }
    }
    lines.push("    <feedback>" + xml(comment.comment) + "</feedback>");
    lines.push("  </comment>");
  });
  if (list.length) lines.push("</review_feedback>");
  const gitAdds = Array.from(gitAddSelected);
  if (gitAdds.length) {
    if (lines.length) lines.push("");
    lines.push(
      "The following new files are untracked and not yet part of the git diff.",
      "Please \`git add\` them so they are included in the commit:",
      "",
      "<git_add_files>"
    );
    gitAdds.forEach(file => lines.push("  <file>" + xml(file) + "</file>"));
    lines.push("</git_add_files>");
  }
  return lines.join("\\n");
}

function copyComments() {
  const prompt = (comments.size || gitAddSelected.size) ? buildPrompt() : "No gdiff review comments have been added.";
  navigator.clipboard.writeText(prompt).then(() => {
    const button = document.getElementById("copy-comments");
    const label = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = label; }, 1200);
  }, () => {
    window.prompt("Copy review feedback", prompt);
  });
}

function clearComments() {
  if (!comments.size || !confirm("Clear all gdiff review comments?")) return;
  comments.clear();
  saveComments();
  refreshAnnotations();
  renderFileList();
  closePanel();
  closeCommentList();
}

const codeViewOptions = {
  diffStyle,
  theme: themeName,
  themeType: "$diffs_theme_type",
  stickyHeaders: true,
  itemMetrics: itemMetrics || undefined,
  useTokenTransformer: tokenHooksEnabled,
  overflow: "scroll",
  lineHoverHighlight: "both",
  hunkSeparators: "line-info-basic",
  enableLineSelection: true,
  renderAnnotation,
  renderHeaderMetadata,
  enableTokenInteractionsOnWhitespace: true,
  onLineClick(...args) {
    const props = args[0];
    const context = args[args.length - 1];
    if (!props || !context || !context.item) return;
    const side = lineSide(props.annotationSide);
    const item = context.item;
    openLineTarget({
      itemId: item.id,
      file: item.fileDiff.name,
      side,
      startLine: props.lineNumber,
      endLine: props.lineNumber,
      code: props.lineElement ? props.lineElement.textContent.trim() : "",
    }, props.event);
  },
  onLineNumberClick(...args) {
    const props = args[0];
    const context = args[args.length - 1];
    if (!props || !context || !context.item) return;
    const side = lineSide(props.annotationSide);
    const item = context.item;
    openLineTarget({
      itemId: item.id,
      file: item.fileDiff.name,
      side,
      startLine: props.lineNumber,
      endLine: props.lineNumber,
      code: props.lineElement ? props.lineElement.textContent.trim() : "",
    }, props.event);
  },
  onTokenClick(...args) {
    const props = args[0];
    const context = args[args.length - 1];
    if (!props || !context || !context.item) return;
    const side = lineSide(props.side);
    const item = context.item;
    openLineTarget({
      itemId: item.id,
      file: item.fileDiff.name,
      side,
      startLine: props.lineNumber,
      endLine: props.lineNumber,
      code: props.tokenElement?.closest("[data-line-index]")?.textContent?.trim() || props.tokenText || "",
    }, args[1]);
  },
  onTokenEnter(...args) {
    if (tokenHooksEnabled) showTokenTip(args[0], args[1]);
  },
  onTokenLeave() {
    hideTokenTip();
  },
  onLineSelected(range, context) {
    if (!range || !context || !context.item) return;
    const side = lineSide(range.side || range.endSide || "additions");
    const startLine = Math.min(range.start, range.end);
    const endLine = Math.max(range.start, range.end);
    openComment({
      itemId: context.item.id,
      file: context.item.fileDiff.name,
      side,
      startLine,
      endLine,
      code: "Selected lines " + startLine + "-" + endLine
    });
  }
};

// Restore a persisted dark choice before first paint so there's no light->dark flash.
if (darkMode) {
  document.body.classList.add("theme-dark");
  codeViewOptions.theme = customThemesReady ? "gdiff-noir" : "pierre-dark";
  codeViewOptions.themeType = "dark";
}

const viewer = new CodeView(codeViewOptions);

function applyTheme(dark) {
  darkMode = dark;
  localStorage.setItem(themeStorageKey, dark ? "dark" : "light");
  document.body.classList.toggle("theme-dark", dark);
  codeViewOptions.theme = customThemesReady ? (dark ? "gdiff-noir" : "gdiff-atelier") : (dark ? "pierre-dark" : "pierre-light");
  codeViewOptions.themeType = dark ? "dark" : "light";
  viewer.setOptions(codeViewOptions);
  for (const item of baseItems) item.version = (item.version || 0) + 1;
  viewer.setItems(baseItems);
  scheduleHunkEnhancement();
}

function toggleHelp() {
  document.getElementById("help-overlay").classList.toggle("is-open");
}
function closeHelp() {
  document.getElementById("help-overlay").classList.remove("is-open");
}

function syncViewToggle() {
  document.querySelectorAll("[data-diff-style]").forEach(button => {
    button.setAttribute("aria-pressed", button.dataset.diffStyle === diffStyle ? "true" : "false");
  });
}

function setDiffStyle(nextStyle) {
  if (nextStyle !== "split" && nextStyle !== "unified") return;
  diffStyle = nextStyle;
  codeViewOptions.diffStyle = diffStyle;
  localStorage.setItem(viewStorageKey, diffStyle);
  syncViewToggle();
  viewer.setOptions(codeViewOptions);
  for (const item of baseItems) item.version = (item.version || 0) + 1;
  viewer.setItems(baseItems);
  scheduleHunkEnhancement();
}

function itemContextMode(itemId) {
  return expandedItemModes.get(itemId) || "compact";
}

function nextContextMode(itemId) {
  const mode = itemContextMode(itemId);
  if (mode === "compact") return "more";
  if (mode === "more") return "full";
  return "full";
}

function expandItemContext(itemId) {
  if (!itemId) return;
  expandedItemModes.set(itemId, nextContextMode(itemId));
  loadPatchView(itemId);
}

function eachRoot(callback) {
  const visit = root => {
    callback(root);
    root.querySelectorAll("*").forEach(node => {
      if (node.shadowRoot) visit(node.shadowRoot);
    });
  };
  visit(document);
}

// @pierre/diffs renders rows/headers inside shadow roots. Document <style> rules do not
// pierce shadow boundaries, but CSS custom properties (our tokens) DO inherit through them,
// so we adopt one stylesheet (written in terms of var(--*)) into every shadow root. Adopting
// it once per root is enough — virtualized rows mounted later in that root inherit it.
const diffThemeCss = [
  ".gdiff-annotation{display:inline-flex;align-items:center;gap:4px;margin-inline-start:6px;padding:1px 8px;border-radius:999px;background:var(--accent-subtle);color:var(--accent-fg);font:11px -apple-system,BlinkMacSystemFont,sans-serif;}",
  "[data-diffs-header]{background:var(--bg);border-bottom:1px solid var(--border);box-shadow:0 1px 0 var(--border-muted);z-index:3;}",
  "[data-diffs-header][data-sticky]{position:sticky;top:0;}",
  "[data-header-content],[data-metadata]{min-width:0;}",
  "[data-metadata]{display:flex;align-items:center;gap:8px;}",
  ".gdiff-header-actions{display:inline-flex;gap:8px;align-items:center;margin-inline-start:8px;}",
  ".gdiff-header-actions label{display:inline-flex;gap:4px;align-items:center;color:var(--muted);font:12px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;}",
  ".gdiff-comment-button{position:relative;display:inline-flex;align-items:center;justify-content:center;width:28px;height:26px;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--muted);cursor:pointer;}",
  ".gdiff-comment-button:hover{background:var(--accent-subtle);color:var(--accent-fg);}",
  ".gdiff-comment-button[data-count]:not([data-count='0']){color:var(--accent-fg);}",
  ".gdiff-expand-hunk{display:inline-flex;align-items:center;justify-content:center;width:28px;height:18px;margin:0 8px 0 0;padding:0;border:1px solid transparent;border-radius:4px;background:transparent;color:var(--accent-fg);cursor:pointer;}",
  ".gdiff-expand-hunk:hover:not([disabled]){background:var(--accent-subtle);}",
  ".gdiff-expand-hunk[disabled]{opacity:0.4;cursor:default;}",
  ".review-panel{width:min(640px,100%);max-width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);box-shadow:var(--overlay-shadow);}",
  ".review-target{margin:0 0 8px;color:var(--muted);font-size:12px;overflow-wrap:anywhere;}",
  ".review-code{margin:0 0 8px;max-height:110px;overflow:auto;padding:8px;border-radius:6px;background:var(--bg-inset);font:12px var(--mono);white-space:pre-wrap;}",
  ".review-panel textarea{width:100%;min-height:90px;resize:vertical;margin:0 0 8px;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;}",
  ".review-actions{display:flex;gap:8px;justify-content:flex-end;align-items:center;}",
  ".review-hint{margin-right:auto;color:var(--muted);font-size:11px;}",
  ".review-panel button{border:1px solid var(--border);border-radius:6px;background:var(--panel);color:var(--fg);cursor:pointer;font:inherit;padding:6px 10px;}",
  ".review-panel button.primary{border-color:var(--primary);background:var(--primary);color:#fff;}"
].join("");

let diffSheet = null;
function ensureDiffSheet() {
  if (diffSheet !== null) return diffSheet;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(diffThemeCss);
    diffSheet = sheet;
  } catch (error) {
    diffSheet = false;
  }
  return diffSheet;
}

function adoptDiffStyles() {
  const sheet = ensureDiffSheet();
  if (!sheet) return;
  eachRoot(root => {
    if (root === document || !("adoptedStyleSheets" in root)) return;
    if (!root.adoptedStyleSheets.includes(sheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    }
  });
}

let enhanceQueued = false;
function queueEnhance() {
  if (enhanceQueued) return;
  enhanceQueued = true;
  window.requestAnimationFrame(() => {
    enhanceQueued = false;
    adoptDiffStyles();
    enhanceHunkSeparators();
  });
}

function observeDiffViewer() {
  const target = document.getElementById("viewer");
  if (!target || typeof MutationObserver === "undefined") return;
  // New file hosts (and their shadow roots) mount in the light tree as you scroll — catch
  // them here and (re)adopt the sheet + re-run hunk enhancement.
  new MutationObserver(queueEnhance).observe(target, { childList: true, subtree: true });
  target.addEventListener("scroll", queueEnhance, { passive: true, capture: true });
}

function itemIdForElementPosition(element) {
  const rect = element.getBoundingClientRect();
  let best = null;
  eachRoot(root => {
    root.querySelectorAll(".gdiff-header-actions[data-item-id]").forEach(header => {
      const headerRect = header.getBoundingClientRect();
      if (headerRect.top <= rect.top + 1 && (!best || headerRect.top > best.top)) {
        best = { top: headerRect.top, itemId: header.dataset.itemId };
      }
    });
  });
  return best ? best.itemId : null;
}

function enhanceHunkSeparators() {
  eachRoot(root => {
    let currentItemId = null;
    root.querySelectorAll("*").forEach(node => {
      if (node.classList && node.classList.contains("gdiff-header-actions") && node.dataset.itemId) {
        currentItemId = node.dataset.itemId;
      }
      if (node.dataset && node.dataset.gdiffHunkEnhanced) return;
      const text = (node.textContent || "").trim();
      if (!/^\\d+ unmodified lines?$/.test(text)) return;
      if (Array.from(node.children).some(child => /^\\d+ unmodified lines?$/.test((child.textContent || "").trim()))) return;
      const parent = node.parentElement;
      if (parent && parent.querySelector(".gdiff-expand-hunk")) return;
      node.dataset.gdiffHunkEnhanced = "1";
      const itemId = currentItemId || itemIdForElementPosition(node);
      const mode = itemContextMode(itemId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gdiff-expand-hunk";
      button.title = mode === "compact" ? "Show more context here" : mode === "more" ? "Show full file context here" : "Full context is already shown";
      button.setAttribute("aria-label", button.title);
      button.dataset.itemId = itemId || "";
      button.disabled = mode === "full" || !itemId;
      button.style.display = "inline-flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.width = "28px";
      button.style.height = "18px";
      button.style.margin = "0 8px 0 0";
      button.style.padding = "0";
      button.style.border = "1px solid transparent";
      button.style.borderRadius = "4px";
      button.style.background = "transparent";
      button.style.color = "var(--accent-fg)";
      if (button.disabled) button.style.opacity = "0.4";
      button.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg><span style="position:absolute;clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;overflow:hidden;white-space:nowrap;width:1px;">Expand context</span>';
      button.addEventListener("click", event => {
        event.stopPropagation();
        expandItemContext(button.dataset.itemId);
      });
      node.prepend(button);
    });
  });
}

function scheduleHunkEnhancement() {
  adoptDiffStyles();
  window.setTimeout(() => { adoptDiffStyles(); enhanceHunkSeparators(); }, 250);
  window.setTimeout(() => { adoptDiffStyles(); enhanceHunkSeparators(); }, 900);
}

function syncContextToggle() {
}

function setFileViewed(itemId, viewed) {
  const item = itemForId(itemId);
  if (!item) return;
  if (viewed) {
    viewedFiles.set(item.reviewKey, {
      diffHash: item.diffHash
    });
  } else {
    viewedFiles.delete(item.reviewKey);
  }
  saveViewedFiles();
  item.collapsed = isFileViewed(item);
  item.version = (item.version || 0) + 1;
  viewer.updateItem(item);
  renderFileList();
}

function setActiveFile(itemId) {
  if (activeItemId === itemId) return;
  activeItemId = itemId;
  renderFileList();
}

function scrollToItem(itemId) {
  setActiveFile(itemId);
  viewer.scrollTo({ type: "item", id: itemId, align: "start", behavior: "auto" });
}

function openFileComment(itemId, anchor) {
  const item = itemForId(itemId);
  if (!item) return;
  openComment({
    kind: "file",
    itemId: item.id,
    file: item.fileDiff.name,
    side: "file",
    startLine: 0,
    endLine: 0,
    code: ""
  }, anchor);
}

let activeFileScrollQueued = false;
let activeFileScrollTop = 0;
function updateActiveFileFromScroll() {
  activeFileScrollQueued = false;
  if (!baseItems.length || !viewer || typeof viewer.getTopForItem !== "function") return;
  const marker = activeFileScrollTop + 56;
  let current = baseItems[0];
  let currentTop = Number.NEGATIVE_INFINITY;
  for (const item of baseItems) {
    const top = viewer.getTopForItem(item.id);
    if (typeof top !== "number") continue;
    if (top <= marker && top >= currentTop) {
      current = item;
      currentTop = top;
    }
  }
  if (current) setActiveFile(current.id);
}

function scheduleActiveFileFromScroll() {
  if (activeFileScrollQueued) return;
  activeFileScrollQueued = true;
  window.requestAnimationFrame(updateActiveFileFromScroll);
}

function itemForFileDiff(fileDiff) {
  return baseItems.find(item => item.fileDiff === fileDiff || item.fileDiff.name === fileDiff.name);
}

function renderHeaderMetadata(...args) {
  const fileDiff = args[0];
  const context = args[args.length - 1];
  const item = context && context.item ? context.item : itemForFileDiff(fileDiff);
  if (!item) return null;
  const fileComments = Array.from(comments.values()).filter(comment =>
    comment.kind === "file" && (comment.itemId === item.id || uniqueItemForFile(comment.file) === item)
  ).length;
  const wrap = document.createElement("span");
  wrap.className = "gdiff-header-actions";
  wrap.dataset.itemId = item.id;
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isFileViewed(item);
  checkbox.addEventListener("click", event => event.stopPropagation());
  checkbox.addEventListener("change", event => {
    event.stopPropagation();
    setFileViewed(item.id, checkbox.checked);
  });
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode("Viewed"));
  const comment = document.createElement("button");
  comment.type = "button";
  comment.className = "gdiff-comment-button";
  comment.title = fileComments ? fileComments + " file comments" : "Add file comment";
  comment.setAttribute("aria-label", comment.title);
  comment.dataset.itemId = item.id;
  comment.dataset.count = String(fileComments);
  comment.style.position = "relative";
  comment.style.display = "inline-flex";
  comment.style.alignItems = "center";
  comment.style.justifyContent = "center";
  comment.style.width = "28px";
  comment.style.height = "26px";
  comment.style.padding = "0";
  comment.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3.5h10v7H7l-3.5 3v-3H3z"/></svg>' + (fileComments ? '<span style="position:absolute;top:-6px;right:-6px;display:grid;min-width:16px;height:16px;place-items:center;padding:0 4px;border-radius:999px;background:#0969da;color:#fff;font-size:10px;line-height:1;">' + fileComments + '</span>' : '');
  comment.addEventListener("click", event => {
    event.stopPropagation();
    openFileComment(item.id, comment);
  });
  wrap.appendChild(label);
  wrap.appendChild(comment);
  return wrap;
}

loadComments();
viewer.setup(document.getElementById("viewer"));
observeDiffViewer();
loadPatchView();
if (typeof viewer.subscribeToScroll === "function") {
  viewer.subscribeToScroll(scrollTop => {
    activeFileScrollTop = Number(scrollTop) || 0;
    scheduleActiveFileFromScroll();
  });
} else {
  document.getElementById("viewer").addEventListener("scroll", event => {
    activeFileScrollTop = event.currentTarget ? event.currentTarget.scrollTop : 0;
    scheduleActiveFileFromScroll();
  }, { passive: true, capture: true });
}
document.getElementById("stats").innerHTML =
  '<span class="stat-files">' + baseItems.length + ' files</span>' +
  '<span class="stat-add">+$total_add</span>' +
  '<span class="stat-del">−$total_del</span>';
syncViewToggle();
syncSidebarCollapsed();
document.querySelectorAll("[data-diff-style]").forEach(button => {
  button.addEventListener("click", () => setDiffStyle(button.dataset.diffStyle));
});
document.getElementById("sidebar-toggle-top").addEventListener("click", () => setSidebarCollapsed(!sidebarCollapsed));
document.getElementById("sidebar-toggle-tree").addEventListener("click", () => setSidebarCollapsed(true));
document.getElementById("file-search").addEventListener("input", event => {
  fileFilter = event.target.value;
  renderFileList();
});
document.getElementById("file-list").addEventListener("click", event => {
  const folder = event.target.closest("[data-dir]");
  if (folder) {
    const dir = folder.dataset.dir;
    if (collapsedDirs.has(dir)) collapsedDirs.delete(dir);
    else collapsedDirs.add(dir);
    saveCollapsedDirs();
    renderFileList();
    return;
  }
  const jump = event.target.closest("[data-file-jump]");
  if (jump) {
    scrollToItem(jump.dataset.fileJump);
  }
});
document.getElementById("review-count-button").addEventListener("click", openCommentList);
document.getElementById("copy-comments").addEventListener("click", copyComments);
document.getElementById("clear-comments").addEventListener("click", clearComments);

renderUntracked();
updateReviewCount();
document.getElementById("untracked-list").addEventListener("click", event => {
  const button = event.target.closest("[data-untracked]");
  if (!button) return;
  const file = button.getAttribute("data-untracked");
  if (gitAddSelected.has(file)) gitAddSelected.delete(file);
  else gitAddSelected.add(file);
  saveGitAdd();
  renderUntracked();
  updateReviewCount();
});

// Stagger reveal is a one-time affair — drop the flag so filter re-renders don't re-animate.
window.setTimeout(() => document.getElementById("file-list").classList.remove("is-initial"), 850);

// Keyboard review flow: arrows and n/p step through changed files, v toggles "viewed" on the active file.
function sortedItemIds() {
  return baseItems.slice().sort((a, b) => a.fileDiff.name.localeCompare(b.fileDiff.name)).map(item => item.id);
}
function moveActiveFile(delta) {
  const ids = sortedItemIds();
  if (!ids.length) return;
  const current = activeItemId && ids.includes(activeItemId) ? ids.indexOf(activeItemId) : -1;
  const next = Math.max(0, Math.min(ids.length - 1, current + delta));
  scrollToItem(ids[next]);
}
document.addEventListener("keydown", event => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  const tag = target && target.tagName ? target.tagName : "";
  const nonTextInput = ["checkbox", "radio", "button", "submit", "range"].includes((target && target.type ? target.type : "").toLowerCase());
  const typing = tag === "TEXTAREA" || (target && target.isContentEditable) || (tag === "INPUT" && !nonTextInput);
  if (typing) return;
  if (event.key === "ArrowDown" || event.key === "n") { event.preventDefault(); moveActiveFile(1); }
  else if (event.key === "ArrowUp" || event.key === "p") { event.preventDefault(); moveActiveFile(-1); }
  else if (event.key === "v" && activeItemId) { event.preventDefault(); setFileViewed(activeItemId, !isFileViewed(itemForId(activeItemId))); }
  else if (event.key === "c" && activeItemId) { event.preventDefault(); openFileComment(activeItemId); }
  else if (event.key === "?") { event.preventDefault(); toggleHelp(); }
  else if (event.key === "Escape") { closeHelp(); }
});

document.getElementById("theme-toggle").addEventListener("click", () => applyTheme(!darkMode));
document.getElementById("help-toggle").addEventListener("click", toggleHelp);
document.getElementById("help-overlay").addEventListener("click", event => {
  if (event.target.id === "help-overlay") closeHelp();
});
const unreviewedToggle = document.getElementById("unreviewed-only");
unreviewedToggle.checked = showUnreviewedOnly;
unreviewedToggle.addEventListener("change", () => {
  showUnreviewedOnly = unreviewedToggle.checked;
  localStorage.setItem(unreviewedStorageKey, showUnreviewedOnly ? "1" : "0");
  renderFileList();
});

window.gdiffViewer = viewer;
