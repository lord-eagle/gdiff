# gdiff

Open the current git repo's diff as a beautiful side-by-side HTML view in your browser. One command, any project, no per-repo setup.

```sh
gdiff                # working tree + staged vs HEAD
gdiff main           # diff vs main
gdiff HEAD~3 HEAD    # diff between two refs
gdiff --unified      # plain colored unified diff in terminal
```

## Install

### Quick (curl) — public repo only

```sh
curl -fsSL https://raw.githubusercontent.com/lord-eagle/gdiff/main/install.sh | bash
```

Drops `gdiff` into `~/.local/bin`. Add it to `PATH` if not already.

### Private repo (gh cli)

While the repo is private, use the GitHub CLI (collaborator access required):

```sh
gh auth login                                # one-time, if not already
gh api repos/lord-eagle/gdiff/contents/install.sh \
  -H "Accept: application/vnd.github.raw" | bash
```

Or clone + symlink:

```sh
gh repo clone lord-eagle/gdiff ~/.gdiff
mkdir -p ~/.local/bin && ln -sf ~/.gdiff/bin/gdiff ~/.local/bin/gdiff
```

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

Soloterm has no global config, but you can:

- Add a process in any Solo project: command `gdiff`. Click the tab → browser pops with the diff.
- Or just run `gdiff` in any Solo terminal tab — works the same.

## License

MIT — see [LICENSE](LICENSE).
