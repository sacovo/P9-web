/**
 * Every URL that points outside this repo.
 *
 * All of them are optional on purpose: when one is `null` the corresponding
 * tile degrades from an embed to a link-out (or disappears), and the site
 * still builds. That is what lets the page ship before the DNS records and
 * the demo deployments exist.
 */

export type Maybe<T> = T | null;

export interface Hosts {
  /** n8n editor. The owner login is the whole authentication boundary. */
  n8n: Maybe<string>;
  /** Read-only turtlesim viewer (noVNC) and the rover's /api/status. */
  turtle: Maybe<string>;
  /**
   * Data-less n8n whose only job is rendering workflow canvases for
   * <n8n-demo>. Runs with N8N_PREVIEW_MODE=true, which must never be set on
   * `n8n` above — it disables X-Frame-Options instance-wide and skips the
   * owner-setup redirect. See PLAN.md §6.1.
   */
  n8nPreview: Maybe<string>;
  /** The browser-native PushT / SmolVLA-RECAP demo. */
  recap: Maybe<string>;
}

export const hosts: Hosts = {
  n8n: 'https://n8n-demo.fhnw-rover.ch',
  turtle: 'https://n8n-turtle.fhnw-rover.ch',
  n8nPreview: 'https://n8n-preview.fhnw-rover.ch',
  recap: 'https://recap-demo.fhnw-rover.ch',
};

/**
 * Fallback canvas renderer: n8n's own hosted preview service, which is what
 * `@n8n_io/n8n-demo-component` defaults to. It is live and sends no
 * X-Frame-Options, so it works — but the workflow JSON leaves the visitor's
 * browser for n8n's cloud, and it is a third-party dependency a thesis page
 * should not rest on. Used only when `hosts.n8nPreview` is null.
 */
export const N8N_PREVIEW_FALLBACK =
  'https://n8n-preview-service.internal.n8n.cloud/workflows/demo';

export const workflowCanvasSrc = (): string =>
  hosts.n8nPreview ? `${hosts.n8nPreview}/workflows/demo` : N8N_PREVIEW_FALLBACK;

/** Endpoints the n8n demo exposes, relative to the editor host. */
export const n8nPaths = {
  driveForm: '/form/drive-rover',
  snapshot: '/webhook/rover-snapshot',
  manual: '/webhook/rover-manual',
  chat: '/webhook/rover-chat/chat',
} as const;

export const url = (host: Maybe<string>, path = ''): Maybe<string> =>
  host ? `${host}${path}` : null;

/** Source repositories, linked inline wherever each is relevant. */
const GITLAB = 'https://gitlab.fhnw.ch/fhnw-rover';

export const repos = {
  n8nNodes: `${GITLAB}/autonomy/n8n-nodes-ros2`,
  autonomy: `${GITLAB}/autonomy/ros-fhnw-autonomy`,
  smolvlaRl: `${GITLAB}/autonomy/smolvla-rl`,
  agentFinetune: `${GITLAB}/autonomy/n8n-agent-finetune`,
  rosbridge: `${GITLAB}/ros-fhnw-rosbridge`,
  /** No remote configured on this repo yet — see PLAN.md §11. */
  pushtDemo: null as Maybe<string>,
  /** Already public on GitHub, so linked there rather than on GitLab. */
  rosapiFork: 'https://github.com/sacovo/rosbridge_suite',
  thesisSource: 'https://github.com/sacovo/P9-Mars-Rover-Autonomy',
} as const;

/**
 * The compiled report.
 *
 * Null until the thesis is frozen: the working PDF still carries todonotes
 * and a "List of Tasks and Topics to Cover" page, which must not ship. Run
 * `node scripts/sync-report.mjs` and set this to the emitted path when it is
 * ready — every download link appears on its own once it is non-null.
 */
export const report = {
  pdf: null as Maybe<string>,
  pages: null as Maybe<number>,
};
