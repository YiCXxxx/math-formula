"use strict";

// Everything displayed in the library comes from the data file; no card content is hard-coded here.
const DATA_URL = "./data/formulas.json";
const QUICK_TAGS = ["eigenvalue", "trace", "characteristic polynomial", "laplacian"];
const FAVORITE_TAGS = ["eigenvalue", "trace", "characteristic polynomial", "determinant", "laplacian", "adjacency", "trees", "rank", "spectrum", "spanning trees"];
const CATEGORIES = [
  { value: "all", label: "All formulas", symbol: "▦" },
  { value: "Graph Theory", label: "Graph Theory", symbol: "◇" },
  { value: "Linear Algebra", label: "Linear Algebra", symbol: "𝛌" },
];

const $ = (selector) => document.querySelector(selector);
const state = { items: [], category: "all", tag: "", query: "" };

function normalized(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\\[a-z]+/g, (command) => ` ${command.slice(1)} `)
    .replace(/[_{}^$\\]/g, " ")
    .replace(/[-‐‑–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchText(item) {
  return normalized([
    item.title, item.formula, item.conditions, item.meaning,
    item.example, item.source, item.category, ...item.tags, ...item.aliases,
  ].join(" "));
}

function matchItem(item) {
  if (state.category !== "all" && item.category !== state.category) return false;
  if (state.tag && !item.tags.includes(state.tag)) return false;
  const terms = normalized(state.query).split(" ").filter(Boolean);
  return terms.every((term) => item._search.includes(term));
}

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function math(el, latex, displayMode = false) {
  if (window.katex?.render) {
    window.katex.render(latex, el, { displayMode, throwOnError: false, trust: false, strict: "ignore" });
  } else {
    el.textContent = latex; // Graceful fallback if the external KaTeX CDN is unavailable.
  }
}

function inlineMath(el, value) {
  el.textContent = value;
  if (window.renderMathInElement) {
    window.renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
      trust: false,
      strict: "ignore",
    });
  }
}

function setTag(tag) {
  state.tag = state.tag === tag ? "" : tag;
  update();
}

function tagButton(tag, className) {
  const button = make("button", className, `# ${tag}`);
  button.type = "button";
  button.setAttribute("aria-pressed", String(state.tag === tag));
  button.setAttribute("aria-label", `Filter by ${tag}`);
  button.addEventListener("click", () => setTag(tag));
  return button;
}

function categoryFilters() {
  const wrap = $("#category-filters");
  wrap.replaceChildren();
  for (const category of CATEGORIES) {
    const count = state.items.filter((item) => category.value === "all" || item.category === category.value).length;
    const button = make("button", "category-button");
    button.type = "button";
    button.setAttribute("aria-pressed", String(category.value === state.category));
    button.append(make("span", "category-icon", category.symbol));
    button.append(make("span", "", category.label));
    button.append(make("span", "category-count", String(count)));
    button.addEventListener("click", () => { state.category = category.value; update(); });
    wrap.append(button);
  }
}

function renderTagFilters() {
  const allTags = new Set(state.items.flatMap((item) => item.tags));
  for (const [selector, tags, className] of [
    ["#quick-tags", QUICK_TAGS, "quick-tag"],
    ["#sidebar-tags", FAVORITE_TAGS, "sidebar-tag"],
  ]) {
    const wrap = $(selector);
    wrap.replaceChildren(...tags.filter((tag) => allTags.has(tag)).map((tag) => tagButton(tag, className)));
  }
}

function detailRow(label, content) {
  const section = make("div", "detail-group");
  section.append(make("span", "detail-label", label.toUpperCase()));
  const p = make("p", "detail-value");
  inlineMath(p, content);
  section.append(p);
  return section;
}

function renderCard(item, index) {
  const article = make("article", "formula-card");
  article.id = `formula-${item.id}`;
  const meta = make("div", "card-meta");
  meta.append(make("span", "", item.category.toUpperCase()));
  meta.append(make("span", "card-number", String(index + 1).padStart(2, "0")));
  article.append(meta);
  article.append(make("h3", "card-title", item.title));
  const formula = make("div", "card-formula");
  formula.setAttribute("aria-label", `Formula: ${item.formula}`);
  math(formula, item.formula, true);
  article.append(formula);
  const meaning = make("p", "card-meaning");
  inlineMath(meaning, item.meaning);
  article.append(meaning);
  const tags = make("div", "card-tags");
  for (const tag of item.tags) tags.append(tagButton(tag, "card-tag"));
  article.append(tags);

  const detailsId = `details-${item.id}`;
  const toggle = make("button", "details-toggle");
  toggle.type = "button";
  toggle.setAttribute("aria-controls", detailsId);
  toggle.setAttribute("aria-expanded", "false");
  toggle.append(make("span", "", "Conditions, example & source"));
  toggle.append(make("span", "details-arrow", "→"));
  article.append(toggle);
  const details = make("div", "card-details");
  details.id = detailsId;
  details.hidden = true;
  details.append(detailRow("Conditions", item.conditions));
  details.append(detailRow("Example", item.example));
  details.append(detailRow("Source", item.source));
  if (item.aliases.length) details.append(detailRow("Also known as", item.aliases.join(" · ")));
  article.append(details);
  toggle.addEventListener("click", () => {
    const expand = details.hidden;
    details.hidden = !expand;
    toggle.setAttribute("aria-expanded", String(expand));
  });
  return article;
}

function activeFilterChips() {
  const wrap = $("#active-filters");
  wrap.replaceChildren();
  const entries = [];
  if (state.category !== "all") entries.push([state.category, () => { state.category = "all"; }]);
  if (state.tag) entries.push([`# ${state.tag}`, () => { state.tag = ""; }]);
  if (state.query.trim()) entries.push([`“${state.query.trim()}”`, () => { state.query = ""; $("#search-input").value = ""; }]);
  wrap.hidden = entries.length === 0;
  if (!entries.length) return;
  wrap.append(make("span", "active-filter-label", "ACTIVE FILTERS"));
  for (const [label, onRemove] of entries) {
    const chip = make("button", "active-filter-chip", `${label}  ×`);
    chip.type = "button";
    chip.title = `Remove ${label} filter`;
    chip.addEventListener("click", () => { onRemove(); update(); });
    wrap.append(chip);
  }
}

function syncURL() {
  const url = new URL(window.location.href);
  for (const key of ["q", "tag", "category"]) url.searchParams.delete(key);
  if (state.query.trim()) url.searchParams.set("q", state.query.trim());
  if (state.tag) url.searchParams.set("tag", state.tag);
  if (state.category !== "all") url.searchParams.set("category", state.category);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function update() {
  categoryFilters();
  renderTagFilters();
  activeFilterChips();
  const filtered = state.items.filter(matchItem);
  $("#result-count").textContent = `${filtered.length} of ${state.items.length} formulas`;
  $("#results").replaceChildren(...filtered.map(renderCard));
  $("#empty-state").hidden = filtered.length !== 0;
  $("#clear-search").hidden = !state.query;
  syncURL();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("#theme-symbol").textContent = theme === "dark" ? "☀" : "☾";
  $("#theme-label").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  $("#theme-toggle").setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  try { window.localStorage.setItem("formula-atlas-theme", theme); } catch { /* Storage may be blocked. */ }
}

async function init() {
  try {
    const storedTheme = window.localStorage.getItem("formula-atlas-theme");
    setTheme(storedTheme === "light" || storedTheme === "dark" ? storedTheme : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  } catch { setTheme("light"); }
  $("#theme-toggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  state.tag = params.get("tag") || "";
  const initialCategory = params.get("category");
  if (CATEGORIES.some((category) => category.value === initialCategory)) state.category = initialCategory;
  $("#search-input").value = state.query;
  $("#search-input").addEventListener("input", (event) => { state.query = event.target.value; update(); });
  $("#clear-search").addEventListener("click", () => { state.query = ""; $("#search-input").value = ""; update(); $("#search-input").focus(); });
  $("#reset-filters").addEventListener("click", () => { state.query = ""; state.tag = ""; state.category = "all"; $("#search-input").value = ""; update(); });
  document.addEventListener("keydown", (event) => {
    const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((event.key === "/" && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
      event.preventDefault(); $("#search-input").focus();
    }
    if (event.key === "Escape" && document.activeElement === $("#search-input")) {
      state.query = ""; $("#search-input").value = ""; update(); $("#search-input").blur();
    }
  });

  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Formula data should be an array");
    state.items = data.map((item) => ({ ...item, _search: searchText(item) }));
    update();
  } catch (error) {
    console.error("Formula load error:", error);
    $("#result-count").textContent = "Unavailable";
    $("#error-state").hidden = false;
  } finally {
    $("#results").setAttribute("aria-busy", "false");
  }
}

init();
