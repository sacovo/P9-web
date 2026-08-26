"""Recover the gripper and critic-value traces for LIBERO episode 4 from the
PNGs in smolvla-rl/outputs/plots_dropout/ — the critic trained WITHOUT state
dropout, i.e. the run that still has the shortcut.

The underlying arrays were never saved and re-running needs a GPU + checkpoint,
so the curves are read back out of the rendered images. Both axes are calibrated
from their own tick marks (detected as dark pixels just outside the axes spine)
rather than from assumed limits, so the two panels share a real frame index and
the "the value steps exactly where the gripper does" claim is measured, not
eyeballed.

Writes public/figs/dropout_traces.npz.
"""

import pathlib

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent.parent / "smolvla-rl" / "outputs" / "plots_dropout"
OUT = HERE.parent / "public" / "figs"


def axes_box(gray, col_frac=0.5, row_frac=0.4):
    """(left, right, top, bottom) pixel indices of the axes spines."""
    dark = gray < 100
    h, w = gray.shape
    cols = np.where(dark.sum(0) > col_frac * h)[0]
    rows = np.where(dark.sum(1) > row_frac * w)[0]
    return cols.min(), cols.max(), rows.min(), rows.max()


def tick_positions(gray, box, axis):
    """Pixel centres of the tick marks just outside the axes, as a sorted list."""
    left, right, top, bottom = box
    if axis == "x":
        band = gray[bottom + 2: bottom + 6, left: right + 1] < 100
        hits = np.where(band.any(0))[0] + left
    else:
        band = gray[top: bottom + 1, max(left - 6, 0): left - 1] < 100
        hits = np.where(band.any(1))[0] + top
    if len(hits) == 0:
        return []
    groups, cur = [], [hits[0]]
    for p in hits[1:]:
        if p - cur[-1] <= 2:
            cur.append(p)
        else:
            groups.append(cur)
            cur = [p]
    groups.append(cur)
    return [float(np.mean(g)) for g in groups]


def linmap(px, p0, v0, p1, v1):
    return v0 + (px - p0) * (v1 - v0) / (p1 - p0)


def nearest_mask(rgb, colour, tol):
    d = np.abs(rgb.astype(int) - np.array(colour)).sum(-1)
    return d < tol


# ---------------------------------------------------------------- gripper trace
def gripper_trace():
    """dim_7 is matplotlib's tab10 grey (#7f7f7f) in the state plot."""
    img = Image.open(SRC / "ep_4_state.png").convert("RGB")
    rgb = np.array(img)
    gray = np.array(img.convert("L"))
    box = axes_box(gray)
    left, right, top, bottom = box

    xt = tick_positions(gray, box, "x")          # 0, 20, 40, ... 120
    yt = tick_positions(gray, box, "y")          # 1.0 .. -1.5, top to bottom
    assert len(xt) >= 2 and len(yt) >= 2, (xt, yt)
    # x ticks are 0,20,...; y ticks run 1.0 down to -1.5 in steps of 0.5
    x_of = lambda px: linmap(px, xt[0], 0.0, xt[-1], 20.0 * (len(xt) - 1))
    y_of = lambda py: linmap(py, yt[0], 1.0, yt[-1], 1.0 - 0.5 * (len(yt) - 1))

    mask = nearest_mask(rgb, (127, 127, 127), 40)
    mask[:, :left + 1] = False
    mask[:, right:] = False
    mask[:top + 1, :] = False
    mask[bottom:, :] = False

    frames, vals = [], []
    for px in range(left + 1, right):
        ys = np.where(mask[:, px])[0]
        if len(ys) == 0:
            continue
        frames.append(x_of(px))
        vals.append(y_of(ys.mean()))
    return np.array(frames), np.array(vals)


# ------------------------------------------------------------------ critic value
def critic_trace():
    """The 'Expected Value' curve is the white line over the viridis heat map."""
    img = Image.open(SRC / "critic" / "episode_4_critic.png").convert("RGB")
    rgb = np.array(img)
    gray = np.array(img.convert("L"))
    box = axes_box(gray)
    left, right, top, bottom = box

    xt = tick_positions(gray, box, "x")          # 0, 11, 22, ... 110
    assert len(xt) >= 2, xt
    x_of = lambda px: linmap(px, xt[0], 0.0, xt[-1], 11.0 * (len(xt) - 1))
    # the y axis spans exactly [-1, 0] (ticks 0.0 at the top spine, -1.0 at the bottom)
    y_of = lambda py: linmap(py, top, 0.0, bottom, -1.0)

    white = nearest_mask(rgb, (255, 255, 255), 90)
    white[:, :left + 1] = False
    white[:, right:] = False
    white[:top + 1, :] = False
    white[bottom:, :] = False
    # blank the legend box in the upper-left corner
    white[top: top + int(0.12 * (bottom - top)), left: left + int(0.20 * (right - left))] = False

    steps, vals = [], []
    for px in range(left + 1, right):
        ys = np.where(white[:, px])[0]
        if len(ys) == 0:
            continue
        steps.append(x_of(px))
        vals.append(y_of(ys.mean()))

    # the dashed ground-truth ramp is pure red
    red = nearest_mask(rgb, (255, 0, 0), 110)
    red[:, :left + 1] = False
    red[:, right:] = False
    red[:top + 1, :] = False
    red[bottom:, :] = False
    red[top: top + int(0.12 * (bottom - top)), left: left + int(0.20 * (right - left))] = False
    gsteps, gvals = [], []
    for px in range(left + 1, right):
        ys = np.where(red[:, px])[0]
        if len(ys) == 0:
            continue
        gsteps.append(x_of(px))
        gvals.append(y_of(ys.mean()))

    return (np.array(steps), np.array(vals),
            np.array(gsteps), np.array(gvals))


def edges_of(frame, value, thresh=0.5):
    """First rising and last falling frame of a binary signal."""
    hi = value > thresh
    idx = np.where(hi)[0]
    return float(frame[idx[0]]), float(frame[idx[-1]])


if __name__ == "__main__":
    gf, gv = gripper_trace()
    cs, cv, gts, gtv = critic_trace()
    OUT.mkdir(parents=True, exist_ok=True)
    np.savez(OUT / "dropout_traces.npz",
             gripper_frame=gf, gripper_value=gv,
             critic_step=cs, critic_value=cv,
             truth_step=gts, truth_value=gtv)

    close, open_ = edges_of(gf, gv)
    print(f"gripper closes at frame {close:.1f}, opens at frame {open_:.1f}")

    # the two largest value jumps, forced to be far apart
    d = np.abs(np.diff(cv))
    order = np.argsort(d)[::-1]
    picked = []
    for i in order:
        if all(abs(cs[i] - cs[j]) > 8 for j in picked):
            picked.append(i)
        if len(picked) == 2:
            break
    print("two largest critic jumps at steps:",
          sorted(round(float(cs[i]), 1) for i in picked))
    print(f"gripper: {len(gf)} pts, frames {gf.min():.0f}..{gf.max():.0f}")
    print(f"critic:  {len(cs)} pts, steps  {cs.min():.0f}..{cs.max():.0f}")
    print(f"truth:   {len(gts)} pts")
