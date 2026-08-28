/**
 * The site's copy lives in `content/p9-content.json` — one file the whole
 * page renders from, so a wording change is not a code change. Typing it
 * here means a wrong shape is a build error rather than a blank section.
 */
import raw from '../../content/p9-content.json';

/** No names here: the page carries the project, the report carries the people. */
export interface SiteMeta {
  title: string;
  subtitle: string;
  description: string;
}

export interface Hero {
  eyebrow: string;
  lead: string;
  image: string;
  imageAlt: string;
}

export interface Overview {
  eyebrow: string;
  heading: string;
  body: string[];
}

export interface Metric {
  value: string;
  label: string;
  note: string;
}

/** One of the two systems the page is organised around. */
export interface Pillar {
  n: string;
  title: string;
  body: string;
  metric: Metric;
  question: string;
  demo: { href: string; label: string };
}

/** The claims that ride along with the two — one number, one sentence. */
export interface SmallClaim {
  title: string;
  value: string;
  label: string;
  body: string;
}

export interface Demo {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  /** Set on tiles that leave the site, so the link is marked as such. */
  external?: boolean;
}

export interface Clip {
  /** Extensionless: `<src>.mp4` is the video, `<src>.jpg` its poster. */
  src: string;
  label: string;
  outcome: 'success' | 'failure' | 'timeout';
  caption: string;
}

export interface LiberoPair {
  title: string;
  task: string;
  body: string;
  clips: Clip[];
}

export interface Libero {
  eyebrow: string;
  heading: string;
  note: string;
  pairs: LiberoPair[];
}

export interface Supporting {
  eyebrow: string;
  heading: string;
  body: string[];
  note: string;
}

export interface Results {
  eyebrow: string;
  heading: string;
  body: string;
  open: string;
}

export interface P9Content {
  site: SiteMeta;
  hero: Hero;
  overview: Overview;
  pillars: Pillar[];
  smaller: SmallClaim[];
  supporting: Supporting;
  results: Results;
  libero: Libero;
  demos: Demo[];
}

export const content: P9Content = raw;

export const { site, hero, overview, pillars, smaller, supporting, results, libero, demos } =
  content;
