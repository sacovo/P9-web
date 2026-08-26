"""Regenerate the slide figures in public/figs/ from paper numbers and paper data.

Run with the smolvla-rl venv (it already has matplotlib/seaborn/numpy):

    ../../smolvla-rl/.venv/bin/python assets/make_assets.py

Every number below is taken verbatim from paper/main.tex; the critic trace is the
same ep345_V_real.npy the paper figure uses. Palette validated with the dataviz
validator (light surface, all pairs).
"""

import pathlib

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "public" / "figs"
PAPER = HERE.parent.parent / "smolvla-rl" / "paper"
OUT.mkdir(parents=True, exist_ok=True)

# --- validated palette (dataviz reference instance, light mode) -----------------
BLUE = "#2a78d6"  # categorical slot 1
ORANGE = "#eb6834"  # categorical slot 2
RED = "#e34948"  # diverging warm pole
RAMP = ["#86b6ef", "#3987e5", "#184f95"]  # ordinal blue, steps 250/400/600
INK = "#0b0b0b"
INK2 = "#52514e"
MUTED = "#8a8985"
GRID = "#e6e5e1"
SURFACE = "#ffffff"

plt.rcParams.update(
    {
        "figure.facecolor": SURFACE,
        "axes.facecolor": SURFACE,
        "savefig.facecolor": SURFACE,
        "font.family": "sans-serif",
        "font.sans-serif": ["DejaVu Sans"],
        "font.size": 13,
        "axes.edgecolor": GRID,
        "axes.labelcolor": INK2,
        "axes.titlecolor": INK,
        "axes.linewidth": 1.0,
        "axes.grid": True,
        "grid.color": GRID,
        "grid.linewidth": 1.0,
        "xtick.color": INK2,
        "ytick.color": INK2,
        "xtick.labelsize": 12,
        "ytick.labelsize": 12,
        "legend.frameon": False,
        "savefig.dpi": 200,
        "savefig.bbox": "tight",
    }
)


def despine(ax, keep=("left", "bottom")):
    for side, spine in ax.spines.items():
        spine.set_visible(side in keep)


# ---------------------------------------------------------------- 1. critic trace
def fig_critic():
    v = np.load(PAPER / "data" / "ep345_V_real.npy")
    fig, ax = plt.subplots(figsize=(8.2, 3.6))
    ax.plot(v, color=BLUE, lw=2.0, solid_capstyle="round")
    ax.axhline(0, ls=":", c=MUTED, lw=1.2)
    ax.text(len(v) * 0.995, 0.02, "task done", ha="right", va="bottom",
            fontsize=11, color=MUTED)
    ax.annotate(
        "value drops back\non a missed grasp",
        xy=(62, -0.60), xytext=(112, -0.90), fontsize=11.5, color=INK2,
        arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED,
                        connectionstyle="arc3,rad=-0.15"),
    )
    ax.set_xlabel("step in episode")
    ax.set_ylabel("value  $V(s_t)$")
    ax.set_ylim(-1.05, 0.12)
    ax.set_xlim(0, len(v))
    ax.grid(axis="x", visible=False)
    despine(ax)
    fig.savefig(OUT / "fig_critic_slide.png")
    plt.close(fig)


# ------------------------------------------------------- 2. guidance-weight sweep
def fig_dose():
    W = [0, 0.5, 1, 1.5, 2]
    curves = [
        ("$f^+$=0.3", "15% pos", [67.0, 66.6, 66.0, 67.4, 63.0]),
        ("$f^+$=0.4", "21% pos", [72.8, 70.8, 70.4, 67.4, 65.4]),
        ("$f^+$=0.8", "52% pos", [76.8, 77.8, 75.4, 72.6, 72.4]),
    ]
    fig, ax = plt.subplots(figsize=(8.2, 4.4))
    for (lab, sub, y), c in zip(curves, RAMP):
        ax.plot(W, y, "-o", ms=8, lw=2.0, color=c, mec=SURFACE, mew=2,
                zorder=3, clip_on=False)
        ax.annotate(f"{lab}  ({sub})", xy=(W[-1], y[-1]), xytext=(8, 0),
                    textcoords="offset points", va="center", fontsize=12.5,
                    color=INK2)
    ax.axhline(71.2, ls="--", lw=1.4, color=MUTED, zorder=1)
    ax.text(1.15, 71.2 + 0.4, "KI base  71.2", fontsize=11.5, color=MUTED)
    ax.set_xlabel("guidance weight  $w$")
    ax.set_ylabel("success rate on spatial (%)")
    ax.set_xticks(W)
    ax.set_xlim(-0.05, 2.05)
    ax.set_ylim(61, 80)
    ax.grid(axis="x", visible=False)
    despine(ax)
    fig.subplots_adjust(right=0.72)
    fig.savefig(OUT / "fig_dose_slide.png", bbox_inches="tight")
    plt.close(fig)


# ------------------------------------------------------- 3. label composition
def fig_labels():
    """Table II of the paper, split so the *mislabelled* frames are visible.

    pos/neg totals and the pos:fail / neg:succ cross-terms are all from Table II;
    the clean segments are the totals minus the cross-terms.
    """
    schemes = ["$f^+$=0.3", "$f^+$=0.4", "$f^+$=0.8", "outcome-only"]
    pos = np.array([15.0, 20.7, 51.5, 44.2])
    neg = np.array([85.0, 79.3, 48.5, 55.8])
    pos_fail = np.array([1.7, 3.0, 16.2, 0.0])   # + label on a failed episode
    neg_succ = np.array([30.9, 26.5, 8.9, 0.0])  # − label on a successful episode
    pos_ok, neg_ok = pos - pos_fail, neg - neg_succ
    y = np.arange(len(schemes))[::-1]
    gap = 0.5  # surface gap between stacked segments

    segs = [
        (pos_ok, BLUE, None, "+  on a successful episode"),
        (pos_fail, BLUE, "///", "+  on a failed episode"),
        (neg_succ, RED, "///", "−  on a successful episode"),
        (neg_ok, RED, None, "−  on a failed episode"),
    ]

    fig, ax = plt.subplots(figsize=(9.2, 4.0))
    left = np.zeros(len(schemes))
    for vals, colour, hatch, _ in segs:
        ax.barh(y, vals, left=left, height=0.58, color=colour, hatch=hatch,
                edgecolor=SURFACE, linewidth=1.5, zorder=3)
        left = left + vals + gap

    for yi, p, ns in zip(y, pos, neg_succ):
        ax.text(p / 2, yi, f"{p:.0f}%", ha="center", va="center",
                color="white", fontsize=12.5, fontweight="bold", zorder=4)
        if ns >= 5:
            ax.text(p + 2 * gap + ns / 2, yi + 0.46, f"{ns:.0f}%", ha="center",
                    va="bottom", color=INK, fontsize=11.5, zorder=4)

    ax.set_yticks(y, schemes, fontsize=13.5)
    ax.set_xlim(0, 102)
    ax.set_xlabel("share of all 107,410 rollout frames (%)")
    ax.grid(axis="y", visible=False)
    despine(ax, keep=("bottom",))
    handles = [plt.Rectangle((0, 0), 1, 1, facecolor=c, hatch=h,
                             edgecolor="white", linewidth=1)
               for _, c, h, _ in segs]
    ax.legend(handles, [lbl for *_, lbl in segs], ncol=2, fontsize=11.5,
              loc="lower center", bbox_to_anchor=(0.5, 1.06), labelcolor=INK2,
              handlelength=1.6, columnspacing=1.6,
              title="hatched = the label disagrees with the episode outcome",
              title_fontsize=11.5)
    ax.get_legend().get_title().set_color(MUTED)
    fig.savefig(OUT / "fig_labels.png")
    plt.close(fig)


# ------------------------------------------------- 4. rollout quality vs. delta
def fig_long_regress():
    suites = ["spatial", "goal", "long"]
    base = [71.2, 75.8, 41.6]
    delta = [6.6, 4.2, -5.8]
    x = np.arange(3)

    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.4, 3.9))

    a1.bar(x, base, width=0.55, color=BLUE, zorder=3)
    for xi, b in zip(x, base):
        a1.text(xi, b + 1.5, f"{b:.1f}", ha="center", fontsize=12.5, color=INK)
    a1.set_xticks(x, suites, fontsize=13)
    a1.set_ylim(0, 90)
    a1.set_title("How good are the rollouts?", fontsize=13.5, pad=10)
    a1.set_ylabel("base-policy success (%)")
    a1.grid(axis="x", visible=False)
    despine(a1)

    cols = [BLUE if d > 0 else RED for d in delta]
    a2.bar(x, delta, width=0.55, color=cols, zorder=3)
    a2.axhline(0, color=INK2, lw=1.2, zorder=4)
    for xi, d in zip(x, delta):
        off = 0.6 if d > 0 else -1.9
        a2.text(xi, d + off, f"{d:+.1f}", ha="center", fontsize=12.5, color=INK)
    a2.set_xticks(x, suites, fontsize=13)
    a2.set_ylim(-8.5, 9.5)
    a2.set_title("What does rollout-only training do?", fontsize=13.5, pad=10)
    a2.set_ylabel("change vs. base (pts)")
    a2.grid(axis="x", visible=False)
    despine(a2)

    fig.tight_layout()
    fig.savefig(OUT / "fig_long_regress.png")
    plt.close(fig)


# ------------------------------------------------------------------ 5. latency
def fig_latency():
    cfgs = ["Orin Nano 8 GB\nbf16", "Orin NX 16 GB\nbf16", "Orin NX 16 GB\nfp32"]
    fm = [922, 850, 1143]
    snap = [255, 240, 575]
    speedup = ["3.6×", "3.5×", "2.0×"]
    x = np.arange(len(cfgs))
    w = 0.36

    fig, ax = plt.subplots(figsize=(8.6, 4.2))
    ax.bar(x - w / 2 - 0.012, fm, width=w, color=BLUE, zorder=3)
    ax.bar(x + w / 2 + 0.012, snap, width=w, color=ORANGE, zorder=3)
    for xi, (f, s, sp) in enumerate(zip(fm, snap, speedup)):
        ax.text(xi - w / 2, f + 22, f"{f}", ha="center", fontsize=12.5, color=INK)
        ax.text(xi + w / 2, s + 22, f"{s}", ha="center", fontsize=12.5, color=INK)
        ax.text(xi, max(f, s) + 145, sp, ha="center", fontsize=15,
                fontweight="bold", color=INK)
    ax.set_xticks(x, cfgs, fontsize=12.5)
    ax.set_ylabel("latency for one 20-action chunk (ms)")
    ax.set_ylim(0, 1400)
    ax.grid(axis="x", visible=False)
    despine(ax)
    handles = [
        plt.Rectangle((0, 0), 1, 1, color=BLUE),
        plt.Rectangle((0, 0), 1, 1, color=ORANGE),
    ]
    ax.legend(handles, ["flow matching, 10 Euler steps", "SnapFlow, 1 step"],
              ncol=2, fontsize=12.5, loc="lower center",
              bbox_to_anchor=(0.5, 1.0), labelcolor=INK2)
    fig.savefig(OUT / "fig_latency.png")
    plt.close(fig)


# --------------------------------------------- 6. flow matching: 10 steps vs 1
def fig_flow(with_snapflow=True):
    """Schematic: integrating a velocity field in 10 Euler steps vs. one jump.

    Two variants, because the flow-matching slide comes long before SnapFlow is
    introduced and must not give it away: `fig_flow_steps_only.png` shows only
    the iterative solve, `fig_flow_steps.png` adds the one-step jump.
    """
    rng = np.random.default_rng(0)
    x0, y0 = -1.55, 0.85          # noise sample
    x1, y1 = 1.55, -0.35          # action
    AMP = 0.9                     # how curved the true path is

    # a curved reference path from noise to action
    t = np.linspace(0, 1, 400)
    def path(t):
        return (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + AMP * np.sin(np.pi * t))

    def vel(t):
        """d(path)/dt — the velocity field along the path."""
        return (x1 - x0, (y1 - y0) + AMP * np.pi * np.cos(np.pi * t))

    px, py = path(t)

    fig, ax = plt.subplots(figsize=(9.6, 4.6))

    # background velocity field
    gx, gy = np.meshgrid(np.linspace(-2.1, 2.1, 17), np.linspace(-1.4, 1.6, 11))
    ang = 0.55 * np.cos(1.1 * gx) - 0.35 * gy
    ax.quiver(gx, gy, np.cos(ang), np.sin(ang), color="#d9e5f5",
              scale=26, width=0.0032, zorder=1)

    # the true path
    ax.plot(px, py, color="#b9c6d8", lw=2.0, ls="-", zorder=2)

    # 10 Euler steps
    ts = np.linspace(0, 1, 11)
    ex, ey = path(ts)
    ex = ex + np.concatenate([[0], rng.normal(0, 0.018, 10)])
    ey = ey + np.concatenate([[0], rng.normal(0, 0.028, 10)])
    ax.plot(ex, ey, "-o", color=BLUE, lw=2.0, ms=7, mec=SURFACE, mew=1.6,
            zorder=4, clip_on=False)
    if with_snapflow:
        # the naive-step line runs through the middle, so keep this label left
        ax.annotate("10 Euler steps\n10 forward passes of the expert",
                    xy=(ex[2], ey[2]), xytext=(-2.1, 2.16), ha="left",
                    va="bottom", fontsize=12.5, color=BLUE, fontweight="bold",
                    arrowprops=dict(arrowstyle="->", lw=1.3, color=BLUE,
                                    connectionstyle="arc3,rad=-0.25"))
    else:
        ax.annotate("10 Euler steps  ·  10 forward passes of the action expert",
                    xy=(ex[5], ey[5]), xytext=(-0.15, 1.62), ha="center",
                    fontsize=13, color=BLUE, fontweight="bold",
                    arrowprops=dict(arrowstyle="->", lw=1.3, color=BLUE,
                                    connectionstyle="arc3,rad=0.2"))

    if with_snapflow:
        # A NAIVE single Euler step: one step of size 1 along v(x0). It follows
        # the initial tangent and leaves the path entirely — this is what "just
        # use fewer steps" actually does, and why distillation is needed.
        vx, vy = vel(0.0)
        nx, ny = x0 + vx, y0 + vy
        ax.plot([x0, nx], [y0, ny], ls=(0, (6, 4)), color=MUTED, lw=2.2,
                zorder=3)
        ax.plot([nx], [ny], "x", color=MUTED, ms=14, mew=3, zorder=5)
        ax.annotate("1 Euler step\nfollows $v(x_{t=1})$ and overshoots",
                    xy=(nx, ny), xytext=(nx + 0.28, ny + 0.22), ha="center",
                    va="bottom", fontsize=12.5, color=INK2)

        # SnapFlow single jump
        ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                    arrowprops=dict(arrowstyle="-|>", lw=3.0, color=ORANGE,
                                    shrinkA=0, shrinkB=0,
                                    connectionstyle="arc3,rad=0.0"), zorder=3)
        ax.text(0.0, -0.72, "SnapFlow  ·  1 step, trained to land here",
                ha="center", fontsize=13, color=ORANGE, fontweight="bold")

    ax.plot([x0], [y0], "o", ms=14, color=INK, zorder=5)
    ax.plot([x1], [y1], "o", ms=14, color=INK, zorder=5)
    # Time convention follows the implementation: t=1 is noise, t=0 is the
    # clean action chunk, so the solver integrates t downwards.
    ax.text(x0 - 0.06, y0 - 0.30, "noise  $x_{t=1}$", ha="center", fontsize=13,
            color=INK)
    ax.text(x1 + 0.30, y1, "action chunk  $x_{t=0}$", ha="left", va="center",
            fontsize=13, color=INK)

    ax.set_xlim(-2.15, 2.95)
    ax.set_ylim(-1.15, 3.35 if with_snapflow else 1.95)
    ax.set_axis_off()
    name = "fig_flow_steps.png" if with_snapflow else "fig_flow_steps_only.png"
    fig.savefig(OUT / name, bbox_inches="tight")
    plt.close(fig)


# --------------------------------- 6b. what one flow-matching gradient step sees
def fig_fm_train():
    """Schematic of the conditional flow-matching training objective.

    Left: the data picture. Each (noise, action) pair defines one straight
    path, and the two action modes are the reason a velocity field is used at
    all — a direct regression on actions would average them.

    Right: one training example on that path. The target velocity is the
    constant `omega - a`, and the loss is a plain squared error against it.
    """
    rng = np.random.default_rng(4)

    fig, (ax, bx) = plt.subplots(1, 2, figsize=(10.6, 3.9),
                                 gridspec_kw=dict(width_ratios=[1.0, 1.15],
                                                  wspace=0.10))

    # ---- left: noise cloud, two action modes, straight paths between them
    noise = np.column_stack([rng.normal(-1.15, 0.13, 8), rng.normal(0.0, 0.42, 8)])
    top = np.column_stack([rng.normal(1.15, 0.11, 6), rng.normal(0.80, 0.13, 6)])
    bot = np.column_stack([rng.normal(1.15, 0.11, 6), rng.normal(-0.80, 0.13, 6)])

    for i in range(8):
        a = top[i % len(top)] if i % 2 == 0 else bot[i % len(bot)]
        w = noise[i % len(noise)]
        ax.plot([w[0], a[0]], [w[1], a[1]], color=GRID, lw=1.5, zorder=1)
    # one noise sample, both modes — the multimodality argument, drawn
    w0 = noise[3]
    for a, c in ((top[1], BLUE), (bot[4], BLUE)):
        ax.plot([w0[0], a[0]], [w0[1], a[1]], color=c, lw=2.0, zorder=2)

    ax.scatter(noise[:, 0], noise[:, 1], s=44, color=MUTED, zorder=3)
    ax.scatter(top[:, 0], top[:, 1], s=44, color=INK, zorder=3)
    ax.scatter(bot[:, 0], bot[:, 1], s=44, color=INK, zorder=3)

    ax.text(-1.15, -1.28, "noise samples", ha="center", va="top",
            fontsize=12.5, color=INK2)
    ax.text(1.42, 1.02, "dataset actions", ha="center", va="bottom",
            fontsize=12.5, color=INK)
    ax.text(1.42, -1.28, "two modes:\nround the mug left, or right",
            ha="center", va="top", fontsize=12, color=INK2)
    ax.text(0.0, 1.62, "every pair defines one straight path",
            ha="center", va="bottom", fontsize=12.5, color=INK,
            fontweight="bold")
    ax.set_xlim(-2.0, 2.3)
    ax.set_ylim(-2.05, 2.0)
    ax.set_axis_off()

    # ---- right: one example on one path
    w = np.array([-2.00, 0.0])
    a = np.array([2.00, 0.0])
    tau = 0.425
    x = tau * w + (1 - tau) * a

    bx.plot([w[0], a[0]], [w[1], a[1]], color="#b9c6d8", lw=2.2, zorder=2)
    bx.plot(*w, "o", ms=12, color=MUTED, mec=SURFACE, mew=1.6, zorder=4)
    bx.plot(*a, "o", ms=12, color=INK, mec=SURFACE, mew=1.6, zorder=4)
    bx.plot(*x, "o", ms=11, color=BLUE, mec=SURFACE, mew=1.6, zorder=5)

    bx.text(w[0], w[1] - 0.30, r"$\omega$", ha="center", va="top",
            fontsize=14, color=INK2)
    bx.text(a[0], a[1] + 0.26, "$a$", ha="center", va="bottom", fontsize=14,
            color=INK)
    bx.text(x[0] + 0.06, x[1] + 0.24, r"$x_\tau$", ha="left", va="bottom",
            fontsize=14, color=BLUE)
    bx.text(0.0, -1.30,
            r"$x_\tau = \tau\,\omega + (1-\tau)\,a$,"
            r"   $\ \omega \sim \mathcal{N}(0,I)$,   $\tau \sim U(0,1)$",
            ha="center", va="top", fontsize=13, color=INK2)

    # target velocity: omega - a, constant everywhere along this path
    u = np.array([-1.05, 0.0])
    bx.annotate("", xy=x + u, xytext=x,
                arrowprops=dict(arrowstyle="-|>", lw=2.8, color=BLUE,
                                shrinkA=0, shrinkB=0), zorder=6)
    bx.text(x[0] + u[0] / 2, x[1] - 0.28, r"target  $u = \omega - a$",
            ha="center", va="top", fontsize=13, color=BLUE, fontweight="bold")

    # the network's prediction at the same point: same length, wrong direction
    ang = np.pi - 0.50
    p_ = np.array([np.cos(ang), np.sin(ang)]) * 1.05
    bx.annotate("", xy=x + p_, xytext=x,
                arrowprops=dict(arrowstyle="-|>", lw=2.8, color=ORANGE,
                                shrinkA=0, shrinkB=0), zorder=6)
    bx.text(x[0] + p_[0] / 2 - 0.25, x[1] + p_[1] + 0.22,
            # Not (obs, lang): the expert never sees pixels or text, only the
            # VLM's prefix. Knowledge insulation and prefix caching both hang
            # off that distinction, so the notation has to carry it from here.
            r"$v_\theta(x_\tau,\ \tau,\ \mathrm{prefix})$",
            ha="center", va="bottom", fontsize=13, color=ORANGE,
            fontweight="bold")

    bx.annotate("", xy=x + p_, xytext=x + u,
                arrowprops=dict(arrowstyle="<|-|>", lw=1.9, color=RED,
                                shrinkA=4, shrinkB=4,
                                connectionstyle="arc3,rad=-0.3"), zorder=7)
    bx.text(x[0] + u[0] - 0.28, x[1] + 0.32, "squared\nerror", ha="right",
            va="center", fontsize=12.5, color=RED, fontweight="bold")

    bx.text(0.0, 1.62, "the target velocity is constant along it",
            ha="center", va="bottom", fontsize=12.5, color=INK,
            fontweight="bold")
    bx.set_xlim(-3.9, 3.6)
    bx.set_ylim(-2.05, 2.0)
    bx.set_axis_off()

    fig.savefig(OUT / "fig_fm_train.png", bbox_inches="tight")
    plt.close(fig)


# ----------------------------- 6c. SnapFlow: the policy teaches itself the jump
def fig_snapflow_train():
    """The consistency term: a two-half-step teacher, a one-jump student.

    Both are the SAME weights. The teacher branch runs under `torch.no_grad()`
    and takes two Euler half-steps; their averaged velocity is the chord the
    student's single `t=1 -> s=0` jump is regressed onto. Two steps are not
    exact either — the point is that they are strictly better than one, and
    the target improves as the model does.
    """
    x0, y0 = -1.55, 0.72          # noise, t = 1
    x1, y1 = 1.55, -0.62          # action chunk, t = 0
    AMP = 0.45                    # gentler curvature than fig_flow: the chord
                                  # has to stay legibly close to the endpoint

    def path(t):
        return (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + AMP * np.sin(np.pi * t))

    def vel(t):
        return np.array([x1 - x0, (y1 - y0) + AMP * np.pi * np.cos(np.pi * t)])

    fig, ax = plt.subplots(figsize=(9.6, 4.4))

    gx, gy = np.meshgrid(np.linspace(-2.0, 2.0, 15), np.linspace(-1.3, 1.5, 9))
    ang = 0.55 * np.cos(1.1 * gx) - 0.35 * gy
    ax.quiver(gx, gy, np.cos(ang), np.sin(ang), color="#d9e5f5",
              scale=26, width=0.0032, zorder=1)

    tt = np.linspace(0, 1, 300)
    ax.plot(*path(tt), color="#b9c6d8", lw=2.0, zorder=2)

    start = np.array([x0, y0])
    v1 = vel(0.0)
    half = start + 0.5 * v1
    v_half = vel(0.5)
    teacher = half + 0.5 * v_half
    chord = 0.5 * (v1 + v_half)          # what the student must reproduce
    teacher_end = half + 0.5 * v_half
    # the student has not converged yet: it lands short of the teacher's chord
    student = teacher_end + np.array([-0.30, -0.58])

    # teacher: two half-steps, under no_grad
    for p, q in ((start, half), (half, teacher)):
        ax.annotate("", xy=q, xytext=p,
                    arrowprops=dict(arrowstyle="-|>", lw=2.6, color=BLUE,
                                    shrinkA=0, shrinkB=0), zorder=4)
    ax.plot(*half, "o", ms=9, color=BLUE, mec=SURFACE, mew=1.6, zorder=5)
    ax.plot(*teacher, "o", ms=11, color=BLUE, mec=SURFACE, mew=1.6, zorder=5)
    ax.text(half[0] - 0.10, half[1] + 0.20, r"$x_{1/2}$", ha="right",
            va="bottom", fontsize=13, color=BLUE)
    ax.text(teacher[0] + 0.16, teacher[1] + 0.06,
            "teacher\n2 Euler half-steps\nunder no_grad", ha="left",
            va="bottom", fontsize=12.5, color=BLUE, fontweight="bold")

    # student: one jump
    ax.annotate("", xy=student, xytext=start,
                arrowprops=dict(arrowstyle="-|>", lw=3.0, color=ORANGE,
                                shrinkA=0, shrinkB=0), zorder=4)
    ax.plot(*student, "o", ms=11, color=ORANGE, mec=SURFACE, mew=1.6, zorder=5)
    ax.text(student[0] - 0.14, student[1] - 0.16,
            "student\none jump  $f(x,\\ t{=}1,\\ s{=}0)$", ha="right", va="top",
            fontsize=12.5, color=ORANGE, fontweight="bold")

    # the gradient actually applied
    ax.annotate("", xy=teacher, xytext=student,
                arrowprops=dict(arrowstyle="<|-|>", lw=1.9, color=RED,
                                shrinkA=6, shrinkB=6,
                                connectionstyle="arc3,rad=0.32"), zorder=6)
    mid = (teacher + student) / 2
    ax.text(mid[0] + 0.24, mid[1], "consistency\nloss (MSE)", ha="left",
            va="center", fontsize=12.5, color=RED, fontweight="bold")

    ax.plot(*start, "o", ms=13, color=INK, zorder=6)
    ax.text(start[0] - 0.06, start[1] - 0.24, "noise  $x_{t=1}$", ha="center",
            va="top", fontsize=13, color=INK)
    ax.plot([x1], [y1], "o", ms=13, color=INK, zorder=6)
    ax.text(x1 + 0.22, y1 - 0.04, "action chunk  $x_{t=0}$", ha="left",
            va="top", fontsize=13, color=INK)

    ax.text(-2.0, 2.22, "teacher and student are the same weights",
            ha="left", va="top", fontsize=13, color=INK2, style="italic")

    ax.set_xlim(-2.15, 4.05)
    ax.set_ylim(-2.05, 2.35)
    ax.set_axis_off()
    fig.savefig(OUT / "fig_snapflow_train.png", bbox_inches="tight")
    plt.close(fig)


# ------------------------------------- 7. the gripper shortcut, measured
def fig_gripper_shortcut():
    """LIBERO episode 4: the critic's value steps exactly where the gripper does.

    Source is the critic trained WITHOUT state dropout, so this is the shortcut
    as it stood before the fix.

    Traces are recovered from outputs/plots_dropout/*.png by
    assets/extract_dropout_traces.py (the arrays were never saved). Both axes
    were calibrated from their own tick marks, so the frame indices really are
    comparable: the gripper closes at frame 58.7 and opens at 109.3, and the
    critic's two largest value jumps sit at 58.6 and 109.5.
    """
    d = np.load(OUT / "dropout_traces.npz")
    gf, gv = d["gripper_frame"], d["gripper_value"]
    cs, cv = d["critic_step"], d["critic_value"]
    ts, tv = d["truth_step"], d["truth_value"]
    close, open_ = 58.7, 109.3

    fig, (a0, a1) = plt.subplots(
        2, 1, figsize=(9.6, 4.6), sharex=True,
        gridspec_kw=dict(height_ratios=[1, 2.7], hspace=0.18))

    # --- gripper. Debounce: the source PNG's anti-aliased vertical edge reads
    # back as a few one-pixel dropouts, which are rendering, not data.
    g = (gv > 0.5).astype(int)
    for i in range(1, len(g) - 1):
        if g[i] != g[i - 1] and g[i] != g[i + 1]:
            g[i] = g[i - 1]
    runs = np.split(np.arange(len(g)), np.where(np.diff(g) != 0)[0] + 1)
    for r in runs:
        if len(r) < 25 and r[0] > 0 and r[-1] < len(g) - 1:
            g[r] = g[r[0] - 1]

    a0.fill_between(gf, 0, g, step="mid", color=ORANGE, alpha=0.22, lw=0)
    a0.step(gf, g, where="mid", color=ORANGE, lw=2.2)
    a0.set_ylim(-0.3, 1.9)
    a0.set_yticks([0, 1], ["open", "closed"], fontsize=11.5)
    a0.set_ylabel("gripper", fontsize=12.5)
    a0.grid(False)
    a0.tick_params(axis="x", length=0)
    despine(a0, keep=("left",))

    # --- critic
    a1.plot(ts, tv, ls=(0, (5, 4)), color=MUTED, lw=1.8, label="ground truth")
    a1.plot(cs, cv, color=BLUE, lw=2.2, label="critic value $V(s_t)$")
    a1.set_ylim(-0.72, 0.02)
    a1.set_xlim(0, 116)
    a1.set_xlabel("frame in episode")
    a1.set_ylabel("value  $V(s_t)$")
    a1.grid(axis="x", visible=False)
    despine(a1)
    a1.legend(fontsize=11.5, loc="upper left", labelcolor=INK2)

    # --- the two coincidences
    for x, lab in ((close, "gripper closes"), (open_, "gripper opens")):
        for ax in (a0, a1):
            ax.axvline(x, color=ORANGE, ls=":", lw=1.6, zorder=1)
        a0.text(x - 2.5, 1.34, lab, ha="right", fontsize=11.5, color=ORANGE)

    a1.annotate("the value jumps", xy=(close, -0.30), xytext=(close + 13, -0.52),
                fontsize=12, color=INK,
                arrowprops=dict(arrowstyle="->", lw=1.3, color=INK2,
                                connectionstyle="arc3,rad=-0.25"))
    a1.annotate("…and drops back", xy=(open_, -0.12), xytext=(open_ - 30, -0.05),
                fontsize=12, color=INK, ha="right",
                arrowprops=dict(arrowstyle="->", lw=1.3, color=INK2,
                                connectionstyle="arc3,rad=0.25"))

    fig.savefig(OUT / "fig_gripper_shortcut.png", bbox_inches="tight")
    plt.close(fig)


# ------------------------------------------------------------ 8. state dropout
def fig_state_dropout():
    """Why state dropout is needed, drawn from the critic's actual prefix layout.

    Schematic, not measurement: the repo has the attribution tooling
    (analyze/attribution, visualize_critic.py) but no committed saliency output,
    so nothing here is an attribution score. What *is* from the code:
    embed_prefix lays the prefix out as [img tokens per camera | language |
    state], the state projects to a single token, and SmolVLACritic.forward
    zeroes that state per sample with probability `state_dropout`.
    """
    n_img, n_lang = 30, 7  # drawn proportionally, not the literal token counts
    H = 0.62               # token height
    GAP = 3.4              # strip → value head
    BOXW = 2.6

    img_end = n_img * 1.0
    lang_end = img_end + n_lang * 1.0
    state_x = lang_end + 0.35          # left edge of the single state token
    box_x = state_x + GAP

    def strip(ax, y, state_on, note, sub, colour):
        for i in range(n_img):
            ax.add_patch(plt.Rectangle((i, y), 0.86, H,
                                       facecolor="#cde2fb", edgecolor="none"))
        for i in range(n_lang):
            ax.add_patch(plt.Rectangle((img_end + i, y), 0.86, H,
                                       facecolor="#e8e7e2", edgecolor="none"))
        ax.add_patch(plt.Rectangle(
            (state_x, y), 0.86, H,
            facecolor=ORANGE if state_on else "#ffffff",
            edgecolor=ORANGE, linewidth=1.8))
        if not state_on:
            ax.plot([state_x + 0.08, state_x + 0.78], [y + 0.08, y + H - 0.08],
                    color=ORANGE, lw=1.8, zorder=5)
            ax.plot([state_x + 0.08, state_x + 0.78], [y + H - 0.08, y + 0.08],
                    color=ORANGE, lw=1.8, zorder=5)

        # value head
        ax.add_patch(plt.Rectangle((box_x, y - 0.02), BOXW, H + 0.04,
                                   facecolor="#ffffff", edgecolor=INK,
                                   linewidth=1.3))
        ax.text(box_x + BOXW / 2, y + H / 2, "$V(s)$", ha="center",
                va="center", fontsize=13)

        # what the critic leans on, arcing above its own strip only
        src = state_x + 0.43 if state_on else img_end / 2
        ax.annotate("", xy=(box_x - 0.06, y + H / 2), xytext=(src, y + H + 0.04),
                    arrowprops=dict(arrowstyle="-|>", lw=2.6, color=colour,
                                    shrinkA=1, shrinkB=0,
                                    connectionstyle="arc3,rad=-0.25"), zorder=6)

        ax.text(-1.0, y + H / 2 + 0.20, note, ha="right", va="center",
                fontsize=13, color=INK, fontweight="bold")
        ax.text(-1.0, y + H / 2 - 0.32, sub, ha="right", va="center",
                fontsize=12, color=colour)

    fig, ax = plt.subplots(figsize=(10.4, 3.6))

    strip(ax, 1.62, True, "80 % of batches", "shortcut: read the gripper", ORANGE)
    strip(ax, 0.0, False, "20 % of batches", "no shortcut: read the images", BLUE)

    # header
    ax.text(img_end / 2, 3.12, "image tokens · 2 cameras", ha="center",
            fontsize=12.5, color=INK2)
    ax.text(state_x - 0.7, 3.12, "language", ha="right",
            fontsize=12.5, color=INK2)
    ax.annotate("state · 1 token", xy=(state_x + 0.43, 2.34),
                xytext=(state_x + 1.5, 3.12), ha="left", va="center",
                fontsize=12.5, color=ORANGE, fontweight="bold",
                arrowprops=dict(arrowstyle="->", lw=1.2, color=ORANGE,
                                connectionstyle="arc3,rad=0.2"))

    ax.set_xlim(-13.0, box_x + BOXW + 0.6)
    ax.set_ylim(-0.95, 3.45)
    ax.set_axis_off()
    fig.savefig(OUT / "fig_state_dropout.png", bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    fig_critic()
    fig_dose()
    fig_labels()
    fig_long_regress()
    fig_latency()
    fig_flow(with_snapflow=False)
    fig_flow(with_snapflow=True)
    fig_fm_train()
    fig_snapflow_train()
    fig_gripper_shortcut()
    # fig_state_dropout() — mechanism schematic, superseded by the measured
    # trace above. Kept in case a before/after framing needs it again.
    print(f"wrote figures to {OUT}")
