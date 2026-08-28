/**
 * The 2-D flow-matching example that both animated figures are drawn from.
 *
 * The data distribution here is a Gaussian mixture with a shared variance,
 * which is what puts the *exact* marginal velocity field in closed form. So
 * these animations show the field a perfectly trained action expert would
 * have learned, not a hand-drawn impression of one — every arrow on screen is
 * evaluated from the formula below.
 *
 * With an action chunk A ~ p_data, noise eps ~ N(0, I) and the straight path
 *
 *     x_tau = tau * A + (1 - tau) * eps,        tau: 0 (noise) -> 1 (action)
 *
 * the regression target is the constant velocity A - eps, so the minimiser of
 * the squared error is its conditional mean, v(x, tau) = E[A - eps | x_tau=x].
 * Conditioned on mixture component k, (A, x_tau) is jointly Gaussian, giving
 *
 *     s^2 = tau^2 sigma^2 + (1 - tau)^2
 *     v_k = mu_k + (tau sigma^2 - (1 - tau)) / s^2 * (x - tau mu_k)
 *
 * with v the posterior-weighted average of the v_k. Two consequences are the
 * entire point of animating this rather than printing it:
 *
 *   tau -> 0  the posterior is the prior, so the field points at the MEAN of
 *             the modes. One Euler step of size 1 therefore lands exactly on
 *             that mean — in the gap between the two behaviours, which is what
 *             a direct regression would have been forced to predict.
 *   tau -> 1  the posterior has collapsed onto one component, and the field
 *             carries the sample into that mode alone.
 *
 * The field is therefore not one picture. It is a different picture at every
 * step of the integration, and the separation happens late.
 */

export interface Mode {
  /** Mixture mean, in world coordinates. */
  x: number
  y: number
  /** Mixture weight; normalised internally, so only ratios matter. */
  w: number
}

/** Shared standard deviation of every mode. Kept equal across components: the
 *  posterior below drops its normalising constant only in that case. */
export const SIGMA = 0.28

/** The behaviour the advantage label marks as good, and the one it does not. */
export const POS: Mode = { x: 1.5, y: 1.15, w: 1 }
export const NEG: Mode = { x: 1.5, y: -1.15, w: 1 }

/** What an unconditioned policy has learned: both behaviours, equally. */
export const BOTH: Mode[] = [POS, NEG]
/** What the policy conditioned on the positive advantage token has learned. */
export const ONLY_POS: Mode[] = [POS]

export type Field = (x: number, y: number, tau: number) => [number, number]

/** The exact flow-matching velocity field of a `modes` mixture. */
export function velocity(
  px: number,
  py: number,
  tau: number,
  modes: Mode[],
  sigma: number = SIGMA,
): [number, number] {
  const s2 = tau * tau * sigma * sigma + (1 - tau) * (1 - tau)
  const coef = (tau * sigma * sigma - (1 - tau)) / s2

  // Posterior over the components. Equal variances, so the Gaussian normaliser
  // is common to all of them and cancels in the softmax; the max is subtracted
  // for the usual reason.
  let peak = -Infinity
  const logits = modes.map((m) => {
    const dx = px - tau * m.x
    const dy = py - tau * m.y
    const l = Math.log(m.w) - (dx * dx + dy * dy) / (2 * s2)
    if (l > peak) peak = l
    return l
  })
  let z = 0
  const p = logits.map((l) => {
    const e = Math.exp(l - peak)
    z += e
    return e
  })

  let vx = 0
  let vy = 0
  modes.forEach((m, k) => {
    const wk = p[k] / z
    vx += wk * (m.x + coef * (px - tau * m.x))
    vy += wk * (m.y + coef * (py - tau * m.y))
  })
  return [vx, vy]
}

/**
 * Classifier-free guidance: extrapolate along the direction from the
 * unconditioned field to the positive-conditioned one.
 *
 *   w = 0  the unconditioned policy      w = 1  the positive conditional
 *   w > 1  past the positive behaviour present in the data
 */
export function guided(px: number, py: number, tau: number, w: number): [number, number] {
  const [ux, uy] = velocity(px, py, tau, BOTH)
  if (w === 0) return [ux, uy]
  const [gx, gy] = velocity(px, py, tau, ONLY_POS)
  return [ux + w * (gx - ux), uy + w * (gy - uy)]
}

/** Explicit Euler from tau = 0 to tau = 1. Returns the `steps + 1` nodes. */
export function integrate(x0: number, y0: number, steps: number, field: Field): number[][] {
  const dt = 1 / steps
  const pts: number[][] = [[x0, y0]]
  let x = x0
  let y = y0
  for (let k = 0; k < steps; k++) {
    const [vx, vy] = field(x, y, k * dt)
    x += dt * vx
    y += dt * vy
    pts.push([x, y])
  }
  return pts
}

/** Deterministic noise, so the picture is identical live and in the PDF. */
export function noiseSamples(n: number, seed = 7): number[][] {
  let s = seed >>> 0
  const u = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return (s + 0.5) / 4294967296
  }
  const out: number[][] = []
  for (let i = 0; i < n; i++) {
    // Box-Muller; both outputs are used, so one call gives one 2-D sample.
    const r = Math.sqrt(-2 * Math.log(u()))
    const th = 2 * Math.PI * u()
    out.push([r * Math.cos(th), r * Math.sin(th)])
  }
  return out
}

// --------------------------------------------------------------------- canvas

export const INK = '#000000'
export const DIM = '#767573'
export const RULE = '#deded9'
export const BLUE = '#2a78d6'
export const RED = '#c70101'
export const YELLOW = '#fde70e'
/** The report's own colour for the SnapFlow shortcut (Okabe-Ito orange). */
export const ORANGE = '#e69f00'

export interface View {
  toX: (x: number) => number
  toY: (y: number) => number
  /** World-unit extent of the visible box, for laying arrows out on a grid. */
  x0: number
  x1: number
  y0: number
  y1: number
  /** Pixels per world unit; equal on both axes, so nothing is distorted. */
  k: number
}

/**
 * A view centred on the interesting part of the plane, scaled to fit
 * `yHalf` world units vertically and whatever that leaves horizontally.
 */
export function makeView(w: number, h: number, cx = 0.3, cy = 0, yHalf = 1.95): View {
  const k = h / (2 * yHalf)
  const xHalf = w / (2 * k)
  return {
    k,
    x0: cx - xHalf,
    x1: cx + xHalf,
    y0: cy - yHalf,
    y1: cy + yHalf,
    toX: (x: number) => (x - cx) * k + w / 2,
    // y up in world coordinates, down in canvas coordinates.
    toY: (y: number) => h / 2 - (y - cy) * k,
  }
}

/**
 * Sets up a correctly oversampled context and clears it to white.
 *
 * The backing store cannot be sized from `devicePixelRatio` alone. A Slidev
 * slide is laid out at a fixed logical width (980 px) and then CSS-scaled to
 * whatever it is displayed or exported at, so a canvas asked for 498 CSS
 * pixels is painted across roughly twice that many device pixels — and sizing
 * the buffer to 498 leaves the browser upscaling a half-resolution image.
 *
 * `getBoundingClientRect()` reports the size *after* that transform, so the
 * ratio against the requested width is exactly the factor to oversample by.
 * It is recomputed on every draw, which is what keeps the figures sharp when
 * the window is resized or the deck is exported at a larger scale.
 */
export function prepare(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  // Falls back to the plain ratio before the first layout, when the rect is 0.
  const slide = rect.width > 0 ? rect.width / w : 1
  // Capped: past 4x the buffer costs memory and bandwidth for nothing.
  const scale = Math.min(Math.max(slide * dpr, 1), 4)
  const bw = Math.round(w * scale)
  const bh = Math.round(h * scale)
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw
    canvas.height = bh
  }
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  return ctx
}

/**
 * Redraws until the measured slide scale settles, then stops.
 *
 * Only needed where there is no animation loop to pick up a later frame — that
 * is, under `slidev export`, where each figure draws once on mount. At that
 * moment the slide's CSS transform is often not final yet, so the first draw
 * would size its backing store for the wrong scale and land in the PDF soft.
 * A CSS transform on an ancestor does not resize the element's layout box, so
 * a ResizeObserver never fires for it; polling the transformed rect for a
 * second is the reliable way to notice.
 */
export function settle(el: HTMLCanvasElement, draw: () => void, ms = 1500): void {
  let seen = -1
  const t0 = performance.now()
  const tick = () => {
    const width = el.getBoundingClientRect().width
    if (width !== seen) {
      seen = width
      draw()
    }
    if (performance.now() - t0 < ms) requestAnimationFrame(tick)
  }
  tick()
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  head = 4.5,
) {
  const a = Math.atan2(y1 - y0, x1 - x0)
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - head * Math.cos(a - 0.4), y1 - head * Math.sin(a - 0.4))
  ctx.lineTo(x1 - head * Math.cos(a + 0.4), y1 - head * Math.sin(a + 0.4))
  ctx.closePath()
  ctx.fill()
}

/**
 * The velocity field at one instant, as a grid of arrows.
 *
 * Arrow length is capped rather than proportional: near tau = 1 the field is
 * v = x, which grows without bound away from the origin and would draw arrows
 * across the whole canvas. Direction is what the figure is about, so the cap
 * costs nothing and opacity carries the magnitude instead.
 */
export function drawField(ctx: CanvasRenderingContext2D, view: View, tau: number, field: Field) {
  const spacing = 0.4
  const cap = 0.3
  const gx0 = Math.ceil(view.x0 / spacing) * spacing
  const gy0 = Math.ceil(view.y0 / spacing) * spacing
  ctx.lineWidth = 1
  for (let x = gx0; x < view.x1; x += spacing) {
    for (let y = gy0; y < view.y1; y += spacing) {
      const [vx, vy] = field(x, y, tau)
      const mag = Math.hypot(vx, vy)
      if (mag < 1e-6) continue
      const len = Math.min(mag, cap)
      const ux = (vx / mag) * len
      const uy = (vy / mag) * len
      const alpha = 0.18 + 0.42 * Math.min(mag / 2.2, 1)
      ctx.strokeStyle = `rgba(118, 117, 115, ${alpha})`
      ctx.fillStyle = `rgba(118, 117, 115, ${alpha})`
      arrow(ctx, view.toX(x), view.toY(y), view.toX(x + ux), view.toY(y + uy), 3.6)
    }
  }
}

/** A mode of the data distribution, as filled one- and two-sigma discs. */
export function drawMode(
  ctx: CanvasRenderingContext2D,
  view: View,
  m: Mode,
  colour: string,
  sigma = SIGMA,
) {
  const px = view.toX(m.x)
  const py = view.toY(m.y)
  ctx.fillStyle = hexToRgba(colour, 0.1)
  ctx.beginPath()
  ctx.arc(px, py, 2 * sigma * view.k, 0, 2 * Math.PI)
  ctx.fill()
  ctx.fillStyle = hexToRgba(colour, 0.18)
  ctx.beginPath()
  ctx.arc(px, py, sigma * view.k, 0, 2 * Math.PI)
  ctx.fill()
}

export function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  colour = DIM,
  align: CanvasTextAlign = 'left',
  size = 11,
  weight = '400',
) {
  ctx.font = `${weight} ${size}px InterVariable, Inter, Helvetica, Arial, sans-serif`
  ctx.fillStyle = colour
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}
