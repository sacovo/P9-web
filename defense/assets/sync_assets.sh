#!/usr/bin/env bash
# Collect the deck's raster assets from the two repositories they already live
# in, so no figure is maintained twice.
#
#   · charts/*.png and imgs/* from the thesis  — the report's own figures
#   · public/figs, public/videos from ../presentation — the Fachvortrag's
#     figures on flow matching, the critic, the labelling and the LIBERO
#     rollouts, which this talk reuses
#
# Photographs are downscaled to 1600 px on the long edge: the deck renders at
# 1280×720 and a 3000 px JPEG only makes the build slower and the PDF larger.
# The TikZ figures are rendered separately by `render_charts.sh`.
#
#   ./assets/sync_assets.sh [path/to/P9-Mars-Rover-Autonomy]
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
deck="$here/.."
thesis="${1:-$here/../../../../P9-Mars-Rover-Autonomy}"
talk="$deck/../presentation"

[ -d "$thesis/imgs" ] || { echo "No imgs/ under $thesis" >&2; exit 1; }

# The lists below mirror what `slides.md` actually references — adding a figure
# to a slide means adding it here. Three figures the report has are deliberately
# NOT copied, because animated components replaced them: `snapflow_shortcut`,
# `cfg_guidance` and the Fachvortrag's `fig_flow_steps_only`.

# ---------------------------------------------------------------- thesis charts
for f in cycle_budget critic_value rover_dataset_sample safety_layers \
         pnp_ambiguity; do
  cp "$thesis/charts/$f.png" "$deck/public/figs/$f.png"
done

# ------------------------------------------------------- screenshots, verbatim
# n8n canvases and UI: already screen-resolution, so they are copied as they are.
for f in n8n_ros2_agent n8n_battery_check toolchanger_workflow \
         n8n_nodes_palette; do
  cp "$thesis/imgs/$f.png" "$deck/public/img/$f.png"
done
cp "$thesis/imgs/cam_corrupt_5.png" "$deck/public/img/cam_corrupt.png"
cp "$thesis/imgs/cam_tear_4.png"    "$deck/public/img/cam_tear.png"
cp "$thesis/imgs/agent_vision/vis_finetuned.jpg" "$deck/public/img/agent_vis_local.jpg"

# ------------------------------------------------------ photographs, downscaled
shrink() { magick "$1" -resize '1600x1600>' -quality 86 "$2"; }
shrink "$thesis/imgs/maintenance_panel.jpg" "$deck/public/img/maintenance_panel.jpg"
shrink "$thesis/imgs/manibar.jpg"           "$deck/public/img/manibar.jpg"
shrink "$thesis/imgs/tool_rack_crop.jpg"    "$deck/public/img/tool_rack.jpg"

# --------------------------------------------------- reused from the Fachvortrag
if [ -d "$talk/public/figs" ]; then
  for f in fig_fm_train fig_labels fig_dose_slide fig_long_regress vla_loop.svg; do
    [ "${f##*.}" = svg ] && cp "$talk/public/figs/$f" "$deck/public/figs/$f" \
                         || cp "$talk/public/figs/$f.png" "$deck/public/figs/$f.png"
  done
  for v in 250k_goalT0_drawer_FAIL_ep0 cotrain_goalT0_drawer_SUCCESS_ep0; do
    cp "$talk/public/videos/$v.mp4" "$talk/public/videos/$v.jpg" "$deck/public/videos/"
  done
fi

echo "Assets synced into $deck/public"
