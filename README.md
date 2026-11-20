# Formula Atlas

A lightweight, searchable reference for **public, standard mathematics formulas** in graph theory and linear algebra. No frameworks, build tools, accounts, analytics, or backend required.

## Features

- Fast, live search across **title, formula, conditions, meaning, example, source, tags, aliases, and subject**
- One-click tag filters, including `eigenvalue`, `trace`, and `characteristic polynomial`
- Graph Theory / Linear Algebra subject filters, with optional combined keyword + tag filtering
- KaTeX-rendered equations, plus expandable conditions, examples, and sources
- Dark mode with remembered preference; responsive desktop and mobile design
- Search deep links: e.g. `?q=trace&tag=eigenvalue&category=Linear+Algebra`
- `/` or `Ctrl/Cmd + K` focuses search; `Esc` clears the current search
- GitHub Actions automatically validates and publishes the static site to GitHub Pages on each push to `main`

## Project structure

```text
math-formula/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Validate and deploy on main
├── scripts/
│   └── validate_data.py        # Checks required fields and IDs
├── site/                       # Only this folder is published
│   ├── .nojekyll
│   ├── index.html
│   ├── assets/
│   │   ├── app.js              # Search, filters, KaTeX, theme
│   │   └── styles.css          # Responsive visual design
│   └── data/
│       └── formulas.json       # The only file to edit for new formulas
├── .gitignore
├── LICENSE
└── README.md
```

## Preview locally

From the repository root, run:

```bash
python3 -m http.server 8000 --directory site
```

Open **http://localhost:8000** in your browser. (On Windows, `py -m http.server 8000 --directory site` also works.)

> Do **not** double-click `index.html` and open it with a `file://` URL. Browsers commonly block local `fetch()` calls to the JSON file. Use the local server above instead.
>
> The website uses KaTeX from jsDelivr and needs internet access for math rendering. If the CDN is unavailable, the original LaTeX is displayed.

## Publish on GitHub Pages

1. Create a new **public** GitHub repository, such as `math-formula-search`. Keep its default branch named `main`.
2. Upload/commit **all repository files**, including the hidden `.github/` folder and the `site/` folder, to `main`.
3. In GitHub, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. Open **Actions** and check the `Deploy Formula Atlas to GitHub Pages` run. (You can use **Run workflow** to trigger it manually.)
5. Once the action succeeds, your URL will usually be:

   `https://YOUR_USERNAME.github.io/math-formula/`

GitHub Actions will automatically republish on each subsequent push to `main`. A repository named exactly `YOUR_USERNAME.github.io` is instead hosted at the user-site root URL `https://YOUR_USERNAME.github.io/`.

### Command-line publishing alternative

From the extracted directory, run these commands after creating an **empty** GitHub repository:

```bash
git init
git add .
git commit -m "Launch Formula Atlas"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/math-formula.git
git push -u origin main
```

**Note:** These steps do not publish anything by themselves until you actually create and push a repository on GitHub. If a repo already exists, adapt the `git remote` and branch commands.

## Add or edit a formula

Open `site/data/formulas.json`. Each entry has these required fields (plus `id` and `category` for organization):

```json
{
  "id": "trace-example",
  "category": "Linear Algebra",
  "title": "Trace of a matrix",
  "formula": "\\operatorname{tr}(A)=\\sum_{i=1}^{n}a_{ii}",
  "conditions": "Any square matrix $A$ of size $n\\times n$.",
  "meaning": "The trace sums the diagonal entries.",
  "example": "For $A=\\operatorname{diag}(2,3)$, the trace is $5$.",
  "source": "Standard linear algebra textbook; trace definition.",
  "tags": ["trace", "matrix"],
  "aliases": ["diagonal sum", "tr(A)"]
}
```

- `id`: Unique, stable slug (used as the HTML anchor).
- `category`: Either `Graph Theory` or `Linear Algebra` in v1.
- `formula`: **LaTeX without** surrounding `$` delimiters. It is rendered as a display equation.
- `conditions`, `meaning`, `example`, `source`: Short text; surround inline mathematics with `$...$`.
- `tags`: An array of short, lowercase search/filter labels. Tags automatically appear on formula cards.
- `aliases`: Related search terms, including alternative names, abbreviations, or spelling variants. Can be an empty array.
- Escape every LaTeX backslash in JSON as `\\` (e.g. `"\\lambda"`, not `"\lambda"`).

**No layout or JavaScript changes are needed** to add formula records. Use the same schema and keep the JSON array valid (commas between objects). Run:

```bash
python3 scripts/validate_data.py
```

The GitHub Action performs the same check before each deployment. The initial catalog includes **44 formulas** (22 Graph Theory; 22 Linear Algebra).

## Public-content policy

This repository is intended for **publicly known standard mathematical results** and **your own original explanatory text**. Do not add private homework solutions, nonpublic class materials, unreleased manuscripts, or unpublished research. The starter examples are standard textbook-level examples, not personal coursework. Sources are high-level reference labels, not copied textbook passages.

## Implementation notes

- Static HTML, CSS and JavaScript only. No npm, bundler, framework, database, or API keys.
- Dynamic text is placed using DOM `textContent`; math is rendered with KaTeX using `trust: false`.
- The CSS and JavaScript are first-party static files. KaTeX is pinned to version `0.19.1` on jsDelivr.
- The deployment workflow publishes **only** the `site/` folder, excluding internal scripts and project notes from the website artifact.
- Licensed under MIT for the website source code. If you add third-party content later, follow its separate license and attribution requirements.
