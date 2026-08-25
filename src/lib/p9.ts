/**
 * The site's copy lives in `content/p9-content.json` — one file the whole
 * page renders from, so a wording change is not a code change. Typing it
 * here means a wrong shape is a build error rather than a blank section.
 */
import raw from '../../content/p9-content.json';

export interface SiteMeta {
  title: string;
  subtitle: string;
  author: string;
  advisor: string;
  institution: string;
  school: string;
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

export interface Contribution {
  n: string;
  title: string;
  body: string;
  metric: Metric;
  question: string;
}

export interface Demo {
  id: string;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}

export interface Figure {
  src: string;
  alt: string;
  caption: string;
  wide: boolean;
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

export interface Figures {
  eyebrow: string;
  heading: string;
  note: string;
  items: Figure[];
}

export interface P9Content {
  site: SiteMeta;
  hero: Hero;
  overview: Overview;
  contributions: Contribution[];
  supporting: Supporting;
  results: Results;
  demos: Demo[];
  figures: Figures;
}

export const content: P9Content = raw;

export const { site, hero, overview, contributions, supporting, results, demos, figures } =
  content;
