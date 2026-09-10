#!/usr/bin/env bash
# Render the thesis' TikZ figures into standalone SVGs for the deck.
#
# The charts under `charts/*.tex` in the thesis repo are `\input` fragments:
# they carry no preamble and rely on main.tex for the tikz libraries and the
# Okabe-Ito `fig*` colours. This wraps each one in a `standalone` document that
# repeats exactly those declarations, so a figure in the deck and the same
# figure in the report are the same drawing.
#
# The raster figures (charts/*.png, imgs/*) need no rendering and are copied by
# `sync_assets.sh` instead.
#
#   ./assets/render_charts.sh [path/to/P9-Mars-Rover-Autonomy]
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
thesis="${1:-$here/../../../../P9-Mars-Rover-Autonomy}"
out="$here/../public/figs"

[ -d "$thesis/charts" ] || { echo "No charts/ under $thesis" >&2; exit 1; }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# One figure per line: <source> <output stem>. A bare stem is a chart of the
# thesis; `local:<stem>` is one of the two figures drawn inline in the report's
# theory chapter, whose tikzpicture was lifted into this directory verbatim.
charts=(
  "n8n_stack                n8n_stack"
  "agent_finetune           agent_finetune"
  "recap_pipeline           recap_pipeline"
  "mani_overview            mani_overview"
  "local:recap_concept      recap_concept"
  "local:vla_architecture   vla_architecture"
)

for entry in "${charts[@]}"; do
  read -r stem name <<<"$entry"
  case "$stem" in
    local:*) src="$here/${stem#local:}.tex" ;;
    *)       src="$thesis/charts/$stem.tex" ;;
  esac
  [ -f "$src" ] || { echo "skip $stem (no $src)" >&2; continue; }

  cat >"$work/$name.tex" <<'PREAMBLE'
\documentclass[border=4pt]{standalone}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{amsmath}
\usepackage{siunitx}
\usepackage{tikz}
\usetikzlibrary{arrows.meta, positioning, fit, backgrounds, calc}
% The Okabe-Ito palette of main.tex, repeated verbatim.
\definecolor{figblue}{HTML}{0072B2}
\definecolor{figorange}{HTML}{E69F00}
\definecolor{figgreen}{HTML}{009E73}
\definecolor{figvermillion}{HTML}{D55E00}
\definecolor{figsky}{HTML}{56B4E9}
\definecolor{figpink}{HTML}{CC79A7}
\definecolor{figgray}{HTML}{999999}
% `\path{...}` is url's, used in the charts for topic and file names.
\usepackage{url}
\begin{document}
PREAMBLE
  printf '\\input{%s}\n\\end{document}\n' "$src" >>"$work/$name.tex"

  ( cd "$work" && pdflatex -interaction=nonstopmode -halt-on-error "$name.tex" >/dev/null ) \
    || { echo "FAILED $stem — see $work/$name.log" >&2; cp "$work/$name.log" "/tmp/$name.log"; continue; }

  pdftocairo -svg "$work/$name.pdf" "$out/$name.svg"
  echo "  → public/figs/$name.svg"
done
