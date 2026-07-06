#!/usr/bin/env bash
# gdiff — open the current repo's git diff as a virtualized side-by-side HTML view in your browser.
# Generated from src/gdiff/* by scripts/build-gdiff.

set -euo pipefail

print_help() {
  cat <<'EOF'
gdiff — git diff as a virtualized side-by-side HTML view

Usage:
  gdiff                  Show working tree + staged changes
  gdiff <ref>            Diff vs <ref> (e.g. main, HEAD~3, origin/main)
  gdiff <a> <b>          Diff between two refs
  gdiff -u, --unified    Plain colored unified diff in terminal
  gdiff -h, --help       Show this help

Requires: git. HTML mode loads @pierre/diffs in the browser from esm.sh.

Environment:
  GDIFF_OPEN=0          Skip opening the browser; print the HTML path instead.
  GDIFF_DIFFS_VERSION   @pierre/diffs version to load (default: 1.2.7).
  GDIFF_THEME           Diffs syntax theme name (default: gdiff-atelier, a custom
                        warm-paper theme; also pierre-light / pierre-dark or any
                        bundled Shiki theme name).
  GDIFF_THEME_TYPE      Theme variant: light | dark | system (default: light).
  GDIFF_TOKEN_HOOKS     Token hover hooks (useTokenTransformer): 0 (default) or 1.
  GDIFF_ITEM_METRICS    JSON Partial<VirtualFileMetrics> passed to CodeView
                        itemMetrics for file-diff size estimation. Default: null.
                        See Diffs docs > CodeView file diff size estimation.
EOF
}

mode="html"
args=()
for arg in "$@"; do
  case "$arg" in
    -h|--help) print_help; exit 0 ;;
    -u|--unified) mode="unified" ;;
    *) args+=("$arg") ;;
  esac
done

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "gdiff: not inside a git repository" >&2
  exit 1
fi

collect_diff() {
  local color_flag="${1:-never}"
  local context_lines="${2:-}"
  local context_arg=""
  if [ -n "$context_lines" ]; then
    context_arg="--unified=$context_lines"
  fi
  if [ "${#args[@]}" -eq 0 ]; then
    if [ -n "$context_arg" ]; then
      git --no-pager diff "--color=$color_flag" "$context_arg"
      git --no-pager diff --cached "--color=$color_flag" "$context_arg"
    else
      git --no-pager diff "--color=$color_flag"
      git --no-pager diff --cached "--color=$color_flag"
    fi
  elif [ "${#args[@]}" -eq 1 ]; then
    if [ -n "$context_arg" ]; then
      git --no-pager diff "--color=$color_flag" "$context_arg" "${args[0]}"
    else
      git --no-pager diff "--color=$color_flag" "${args[0]}"
    fi
  else
    if [ -n "$context_arg" ]; then
      git --no-pager diff "--color=$color_flag" "$context_arg" "${args[0]}" "${args[1]}"
    else
      git --no-pager diff "--color=$color_flag" "${args[0]}" "${args[1]}"
    fi
  fi
}

# Untracked (new, never-added) files never appear in `git diff`, so list them
# separately. Only meaningful for the working-tree modes (0 or 1 path arg); a
# ref..ref comparison has no working-tree concept of "untracked".
collect_untracked() {
  if [ "${#args[@]}" -eq 0 ]; then
    git --no-pager ls-files --others --exclude-standard
  elif [ "${#args[@]}" -eq 1 ]; then
    # A single arg is ambiguous: a ref (diff working tree vs ref → all untracked
    # still apply) or a pathspec (filter untracked to that path). Disambiguate.
    if git rev-parse --verify --quiet "${args[0]}^{commit}" >/dev/null 2>&1; then
      git --no-pager ls-files --others --exclude-standard
    else
      git --no-pager ls-files --others --exclude-standard -- "${args[0]}"
    fi
  fi
  # 2 args = ref..ref: no working tree involved, so no untracked files.
}

# Build a JSON string array of untracked paths, escaping backslash and quotes.
untracked_json="["
untracked_first=1
while IFS= read -r untracked_path; do
  [ -n "$untracked_path" ] || continue
  untracked_esc="$(printf '%s' "$untracked_path" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  if [ "$untracked_first" -eq 1 ]; then untracked_first=0; else untracked_json="$untracked_json,"; fi
  untracked_json="$untracked_json\"$untracked_esc\""
done < <(collect_untracked)
untracked_json="$untracked_json]"

if [ "$mode" = "unified" ]; then
  collect_diff always
  if [ "$untracked_json" != "[]" ]; then
    echo
    echo "# Untracked files (not in diff):"
    collect_untracked | sed 's/^/#   /'
  fi
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel)"
repo_name="$(basename "$repo_root")"
git_dir="$(git rev-parse --git-dir)"
case "$git_dir" in
  /*) ;;
  *) git_dir="$repo_root/$git_dir" ;;
esac
out_dir="$git_dir/gdiff"
mkdir -p "$out_dir"

tmp_dir="$(mktemp -d -t gdiff.XXXXXX)"
out="$out_dir/diff.html"
patch_file="$tmp_dir/diff.patch"
patch_more_file="$tmp_dir/diff.more.patch"
patch_full_file="$tmp_dir/diff.full.patch"
trap 'rm -rf "$tmp_dir"' EXIT

collect_diff never >"$patch_file"
if [ ! -s "$patch_file" ] && [ "$untracked_json" = "[]" ]; then
  echo "gdiff: no changes to show."
  exit 0
fi
collect_diff never 20 >"$patch_more_file"
collect_diff never 999999 >"$patch_full_file"
review_context_id="$(git hash-object "$patch_file")"
repo_identity_source="$(git config --get remote.origin.url || true)"
if [ -z "$repo_identity_source" ]; then
  repo_identity_source="$repo_root"
fi
repo_storage_id="$(printf '%s' "$repo_identity_source" | git hash-object --stdin)"
if [ "${#args[@]}" -eq 0 ]; then
  diff_args_identity="working-tree"
else
  diff_args_identity="$(printf '%s\n' "${args[@]}")"
fi
diff_args_storage_id="$(printf '%s' "$diff_args_identity" | git hash-object --stdin)"
title="gdiff — $repo_name"
patch_bytes="$(wc -c <"$patch_file" | tr -d '[:space:]')"

collect_numstat() {
  if [ "${#args[@]}" -eq 0 ]; then
    git --no-pager diff --numstat
    git --no-pager diff --cached --numstat
  elif [ "${#args[@]}" -eq 1 ]; then
    git --no-pager diff --numstat "${args[0]}"
  else
    git --no-pager diff --numstat "${args[0]}" "${args[1]}"
  fi
}
read -r total_add total_del < <(collect_numstat | awk '
  { if ($1 ~ /^[0-9]+$/) add += $1; if ($2 ~ /^[0-9]+$/) del += $2 }
  END { printf "%d %d\n", add, del }
')
diffs_version="${GDIFF_DIFFS_VERSION:-1.2.7}"
diffs_theme="${GDIFF_THEME:-gdiff-atelier}"
diffs_theme_type="${GDIFF_THEME_TYPE:-light}"
token_hooks="${GDIFF_TOKEN_HOOKS:-0}"
item_metrics="${GDIFF_ITEM_METRICS:-null}"
