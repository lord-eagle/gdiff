# gdiff

Open the current git repo's diff as a beautiful side-by-side HTML view in your browser. One command, any project, no per-repo setup.

```sh
gdiff                # working tree + staged vs HEAD
gdiff main           # diff vs main
gdiff HEAD~3 HEAD    # diff between two refs
gdiff --unified      # plain colored unified diff in terminal
```

## Install

### Quick (curl)

```sh
curl -fsSL https://raw.githubusercontent.com/lord-eagle/gdiff/main/install.sh | bash
```

Drops `gdiff` into `~/.local/bin`. Add it to `PATH` if not already.

### Homebrew (tap) — coming soon

Tracking in [issue #1](https://github.com/lord-eagle/gdiff/issues/1). For now use the curl installer above.

### Manual

```sh
git clone https://github.com/lord-eagle/gdiff.git
ln -s "$PWD/gdiff/bin/gdiff" ~/.local/bin/gdiff
```

## Requirements

- `git`
- Browser network access for HTML mode — loads [`@pierre/diffs`](https://diffs.com/docs) from `esm.sh`
- macOS or Linux (uses `open` / `xdg-open`)

`--unified` mode needs only `git`.

## How it works

- Runs `git diff` (working tree + staged, or against the refs you pass).
- Streams the unified diff into a temp patch file.
- Writes an HTML app to a temp dir and opens it in your default browser.
- The app parses and renders the patch with [`@pierre/diffs`](https://diffs.com/docs).

The HTML view uses Diffs' `CodeView`, which handles virtualized file rendering, row/window measurement, scroll reconciliation, and syntax highlighting.

The HTML view includes a searchable, collapsible file tree, side-by-side/stacked view switching, per-file viewed/collapse state, file-level comment icons, and inline hunk expand controls for showing more context.

## Review comments

In the HTML diff view:

- Click a **line number** (gutter) to add or edit feedback for that line. The code column stays selectable so you can still copy snippets.
- Drag across line numbers, or click one and then shift-click another, to comment on a range.
- Click the comment icon in a file header to leave file-level feedback.
- Each file header sticks while you scroll through that file, keeping its **Viewed** toggle and file-comment button reachable. The header controls stay in sync with sidebar state and the `v` / `c` keyboard shortcuts.
- Comments are saved to `localStorage` immediately. When `python3` is available, `gdiff` also serves the HTML over `127.0.0.1` and persists comments to `.gdiff-review.json` at the repository root.
- If `python3` is missing, the local server cannot start, or you open the generated HTML file directly, comments continue to work from `localStorage` only.
- JSON comment records include `id`, `kind`, `itemId`, `file`, `side`, `line`, `startLine`, `endLine`, `code`, `comment`, `resolved`, and `resolution`. The `resolved` and `resolution` fields are preserved for downstream review workflows even though the current UI does not expose resolution controls yet.
- Click **Copy prompt** to copy all comments as structured feedback that can be pasted into an agent. If the browser blocks the clipboard API, a fallback modal lets you copy manually.

## Use it from Soloterm

Soloterm has no global config, so you wire `gdiff` per project. Two paths:

**Option A — drop the example `solo.yml` into your project (one-liner):**

```sh
curl -fsSL https://raw.githubusercontent.com/lord-eagle/gdiff/main/examples/solo.yml -o solo.yml
```

Reload the project in Solo. Solo prompts to **trust** the YAML commands (security gate) — approve once, then:

- `Diff (HTML)` tab → browser pops with side-by-side view
- `Diff (terminal)` tab → ANSI unified diff in-pane

If your repo already has a `solo.yml`, copy the `processes` block from [examples/solo.yml](examples/solo.yml) into yours instead of overwriting.

**Option B — add via Solo UI** (no file change):

1. Open the project in Solo.
2. Add Process → Command → `gdiff` → Save.
3. Click the tab any time you want to see the current diff.

Either way, you can also just run `gdiff` in any Solo terminal tab.

## Credits

`gdiff` is a thin bash wrapper. The actual side-by-side HTML rendering is done by:

- [**`@pierre/diffs`**](https://diffs.com/docs) — its `CodeView` handles virtualized file rendering, split/stacked layout, syntax highlighting, and line selection. Loaded in the browser at runtime from [esm.sh](https://esm.sh) (`@pierre/diffs@1.2.7` by default; override with `GDIFF_DIFFS_VERSION`); not bundled.

Huge thanks to that project — `gdiff` would not exist without it.

## License

MIT — see [LICENSE](LICENSE).
