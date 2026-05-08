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

### Homebrew (tap)

```sh
brew tap lord-eagle/gdiff https://github.com/lord-eagle/gdiff.git
brew install gdiff
```

### Manual

```sh
git clone https://github.com/lord-eagle/gdiff.git
ln -s "$PWD/gdiff/bin/gdiff" ~/.local/bin/gdiff
```

## Requirements

- `git`
- `node` (only for HTML mode — uses `npx diff2html-cli`, cached after first run)
- macOS or Linux (uses `open` / `xdg-open`)

`--unified` mode needs only `git`.

## How it works

- Runs `git diff` (working tree + staged, or against the refs you pass).
- Pipes the unified diff into `diff2html-cli` via `npx --yes` — no global npm install.
- Writes a self-contained HTML file to a temp dir and opens it in your default browser.

## Use it from Soloterm

Soloterm has no global config, so you wire `gdiff` per project. Two paths:

**Option A — paste into your repo's `solo.yml`** ([example](examples/solo.yml)):

```yaml
processes:
  Diff (HTML):
    command: gdiff
    auto_start: false
  Diff (terminal):
    command: bash -lc 'gdiff --unified'
    auto_start: false
```

Solo will prompt you to trust the new commands once. Click the `Diff (HTML)` tab → browser pops with the side-by-side view. Click `Diff (terminal)` for the colored unified diff in-pane.

**Option B — add via Solo UI** (no file change):

1. Open the project in Solo.
2. Add Process → Command → `gdiff` → Save.
3. Click the tab any time you want to see the current diff.

Either way, you can also just run `gdiff` in any Solo terminal tab.

## License

MIT — see [LICENSE](LICENSE).
