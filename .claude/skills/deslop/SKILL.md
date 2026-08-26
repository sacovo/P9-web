---
name: deslop
description: Rewrite AI-generated thesis prose to be shorter, more precise, and honestly calibrated. Applies the FHNW PIK language rubric (Lesefreundlichkeit, Logik und Leseführung, Präzision, Anreiz) plus AI-tell removal. Use for /deslop, or whenever asked to tighten, deslop, shorten, or de-AI text in chapters/*.tex.
---

# deslop — de-AI thesis prose

Strip AI bulk from the P9 thesis without changing what it claims. The output must
read as if the author wrote it: shorter, concrete, and honest about what is and
is not finished.

Sources this encodes: the FHNW PIK language rubric
(`pik.igs.htu.fhnw.ch/verarbeiten/sprache`, four Hamburg-model dimensions with
"So gelingt… / Was ist zu vermeiden" tables), the Sainani five-pass manuscript
review (`labarba/sciwrite`), and the AI-tell catalogue from
`stephenturner/skill-deslop`.

## House style for this thesis

- **Impersonal by default.** "The policy was trained on 40 demonstrations", not
  "We trained the policy on 40 demonstrations". Use "we" only where the
  impersonal version is clearly worse — a buried actor, a stacked passive, or a
  sentence that needs three clauses to avoid the pronoun. Never mix the two
  inside one paragraph.
- Do not translate. The thesis is English; the FHNW thresholds transfer, the
  German examples do not.
- Preserve LaTeX exactly: `\label`, `\cref`, floats, `\task`, `\kw`, `\note`,
  `\SI`, minted blocks, citation keys.

## Workflow

1. **Branch first.** Before the first edit:

   ```bash
   git status --porcelain          # must be clean; if not, stop and report
   git switch -c deslop/<scope>    # e.g. deslop/05-evaluation
   ```

   `<scope>` names what is being edited: a chapter stem, or `selection` for an
   ad-hoc passage. If the tree is dirty, stop and ask — do not stash or commit
   the user's work.

2. **Read the whole target file** before editing any part of it. Bulk lives in
   paragraph structure across sections, not in single sentences.

3. **Run the passes below in order.** Pass 0 can halt the job. Pass 5b is the
   one most easily skipped and the one an automated audit will not find for you.

4. **Edit, then verify:**

   ```bash
   make check      # spell + chktex + figure refs
   make            # must still compile
   ```

   If the TeX toolchain is absent (`pdflatex`, `chktex`, `biber` missing — it
   often is), you cannot claim the document builds. Say so plainly in the
   report, and substitute a structural check you *can* run: every `\label` that
   existed still exists, every `\cref` target resolves against all of
   `chapters/` and `main.tex`, every `\cite` key resolves against both `.bib`
   files, float and `\task`/`\kw`/`\note` counts unchanged, braces balanced.
   `make spell` needs only hunspell and usually works. Never let "verified
   structurally" be reported as "verified".

5. **Commit in reviewable chunks** — one commit per chapter or per pass, short
   message saying why (see the repo's commit-message preference). Then report
   the branch name, the diff stat, and every CRITICAL finding. Do not merge, do
   not push.

## Pass 0 — Facts before style (blocking)

Style work on a wrong sentence produces a better-looking wrong sentence.

- Any claimed **result**: check it is real. Several P9 pillars were still in
  progress while this was written — SmolVLA+RL was trained in LIBERO sim before
  it reached the rover arm. A *result* stated in `05_evaluation` or
  `06_conclusions` must match what was actually obtained. A *capability*
  described in the design chapters may be stated plainly; see the status rule
  below.
- Any **number, unit, latency, or rate** not traceable to a source, a chart in
  `charts/`, `bench-results/`, or an existing `\task{}`: flag CRITICAL, do not
  smooth it into fluent prose.
- Any **citation** the AI produced: verify the key exists in `references.bib` or
  `new_references.bib` **and** that the source supports the claim. Hallucinated
  or misattributed citations are the highest-severity finding in this skill.
- **Re-expanded P8 material** (Test-Time Training, action blending, the P8
  red-ring/drivetrain evaluation): delete, do not rewrite. Scope rule in
  `CLAUDE.md`.
- **When two chapters disagree about a mechanism, read the code.** The
  implementation repos under `~/work/fhnw/rover/` are the authority, and the
  chapters are downstream of them. A disagreement that survived two audits and
  three commits — whether the panel pose is filtered — was settled in one pass
  over `ros-fhnw-autonomy/src/barbara_autonomy_cpp` plus the launch file that
  decides how many nodes start. Launch and config files carry as much of the
  answer as the source: the same executable started twice with different
  parameters is two different mechanisms, and no chapter said so. Do this
  *before* writing a `\note{}` about which chapter is stale.

If a passage is slop covering for work that does not exist, the correct output
is a shorter honest passage plus a `\task{}` describing what the author still
has to write. Never fill a `\task{}` with invented prose.

**Pending work goes in a `\task{}`, never in prose.** This is a living document
on a nearly-finished project, and the author's rule is about *where* a gap is
recorded, not whether. A `\task{}` is listed in the "List of Tasks and Topics to
Cover" after the ToC: it is findable, it is countable, and clearing it is one
edit. The same admission dissolved into a paragraph — "was not measured", "was
not compared", "has not run end to end", "at the time of writing" — has to be
hunted down sentence by sentence when the run lands two days later, and some of
it will be missed.

So in `00_abstract`, `01_introduction`, `02_system_design`, `03_theory` and
`04_implementation`: prose describes the system as designed and built; anything
still outstanding goes in a `\task{}` beside it. Never delete a real gap to
satisfy this — move it into the macro.

`05_evaluation` and `06_conclusions` are different, because there the status
*is* the content: no result may be claimed that was not obtained, and that
belongs in the prose.

The line to hold is between **unmeasured and nonexistent**. "Built, evaluation
pending" is a `\task{}` in a design chapter, not a hedged sentence. "Described
as built when no such component exists" is still a CRITICAL finding at any
altitude — that is what Pass 0 is for, and this rule does not soften it.

Some gaps are also simply **out of scope**. This thesis delivers infrastructure,
not every ERC-specific step; a rules requirement the infrastructure supports but
nobody has wired up yet may not need a `\task{}` at all. Ask before adding one.

**Before rewriting any factual sentence, read to the end of its paragraph and
open the chapter that reports the outcome.** This is where a correction pass
does its own damage, and the failure is consistent: a sentence is rewritten from
a single line, or from an author's one-line answer, while the qualifier sits two
sentences later. Instances from one pass over this thesis: "no re-homing is
required" written from the half of a paragraph that says the zero is stored,
missing the half that says multi-turn joints still home; "photometric
augmentation is not ablated here" written from an author's recollection, where
the evaluation reports that ablation as a headline result; a controller named
from the sentence being replaced rather than from the chapter that names it.

An author's answer settles *intent*. It does not settle what the thesis
currently says, and the two disagree more often than either of you expects —
so check the answer against the chapters before writing it in, and say so when
they differ.

**Then propagate.** A fact usually appears in three or four places: abstract,
introduction, the chapter that implements it, the chapter that measures it,
conclusions. Fixing one end and not the others manufactures a fresh
contradiction — a transcript count corrected in the appendix but not in the
evaluation, an architecture corrected in two chapters and left standing in a
third. Grep the changed number or phrase across `chapters/` before moving on.

## Pass 1 — Cut the scaffolding

Delete, do not compress:

- **Topic-setting openers.** FHNW collects these from real student theses as
  *Phrasen*: "X ist ein aktuelles Thema, über das viel diskutiert wird", "In
  unserer modernen Welt…", "Es besteht Handlungsbedarf." English equivalents:
  "In recent years, X has attracted significant attention", "With the rapid
  advancement of…", "It is worth noting that…", "As the field continues to
  evolve…"
- **Section previews and recaps.** "This section explores…", "As discussed
  above…", "To summarize this chapter…" One orienting sentence per *chapter* is
  legitimate reader guidance and FHNW endorses it. A preview at every subsection
  is padding.
- **Enumerated announcements**, the same defect one level down and the easiest
  to miss: a sentence that counts what the next sentences already deliver.
  "Two corrections are needed because…" followed by the two corrections. "Two
  properties make this attractive here." "The result is measured on two levels."
  "There are two ways out." Delete the count and start with the first item. Scan
  for *two/three/both/several* followed by a colon or a full stop.
- **Thesis-statement openers**, the most common shape of all and the one an
  author will flag if you do not: a paragraph's first sentence names the answer
  abstractly, and the sentences after it deliver that same answer concretely.
  "The intended answer to both is a tool." followed by what the tool does. "The
  fix is architectural." "What made the difference was the calibration." The
  opener adds no fact, no number and no cross-reference; it only tells the
  reader what they are about to read.

  **Test:** delete the first sentence and read the paragraph from its second.
  If the paragraph still opens on something concrete — a mechanism, a number, a
  component — the opener was scaffolding and stays deleted. Keep it only when it
  carries a fact that appears nowhere else in the paragraph, or when it marks a
  contrast with the *previous* paragraph that the concrete sentence cannot.

  Do this pass with the whole paragraph visible, not sentence by sentence: the
  defect is only detectable as a relation between the opener and what follows,
  which is why it survives sentence-local editing. Sweep every paragraph in the
  file for it explicitly — the same pass on this thesis cleared an opener as
  "earned" twice in a row and the author rejected it both times, first for its
  *rather than* clause and then for the whole sentence.
- **Fractal summaries** — the same point restated at chapter open, section open,
  and section close. Keep the instance that does work.
- **Meta-transitions**: "Building on this", "Having established X", "Despite
  these challenges", "It is important to note that".
- **Unrequested comparison tables and pro/con lists.** AI builds a two-column
  comparison whenever two things are mentioned. Keep only if the comparison
  drove a design decision that was actually made.

Test: if a paragraph's first sentence can go without making the second unclear,
it goes.

## Pass 1b — Altitude and authorship

Two questions decide how much detail a passage may carry. Both were missed on a
full pass over chapter 2 and had to be fixed on author review.

**Did this project build it?** Detail should track authorship. The rover's
hardware emergency stop, the drivetrain's message fields, the container and
CUDA setup are all inherited or documented elsewhere; a passing mention is the
whole budget. A disconnect time "verified under a \SI{20}{\ampere} load", a
five-field message breakdown for a subsystem the autonomy never commands, and a
JetPack footnote are detail spent on someone else's work. Cite the ERC report
or the repository and move on.

**Is this the chapter for it?** System design states *what* a component is and
*why* it exists; implementation states *how*. A backbone name, a layer, a
hyperparameter, a bin count, a message field list serve the argument in the
implementation chapter and pad the design chapter. Before keeping a technical
detail, grep for it in `chapters/04_implementation.tex` — if it is already
there, the design chapter needs a sentence and a `\cref`, not a summary.

**The specific trap:** Pass 5b tells you to restate a motivation the results
actually support. The evidence for that motivation usually lives in the
implementation or evaluation chapter, and the reflex is to import it — a
measured drift, a percentage, a mechanism — to make the new motivation
convincing. That is how a paragraph gets *longer* during a pass whose job is to
shorten. Restate the motivation in one clause and `\cref` the evidence where it
already lives. Two paragraphs in chapter 2 grew this way and both were rejected
on review.

## Pass 2 — Calibrate claims

| AI phrasing | Honest phrasing |
|---|---|
| demonstrates / proves that | the run showed / in this setup |
| significantly improves | reduced latency from 120 ms to 45 ms |
| robust, seamless, comprehensive, powerful | delete, or state the tested range |
| enables real-time performance | runs at 22 Hz on the Orin at INT8 |
| a novel approach | drop, unless novelty is a stated contribution |
| validates the approach | is consistent with / does not contradict |

Same rule from the other side is FHNW's *Präzision*: replace modal verbs and
vague quantifiers with numbers. Their example — "Die Anlage soll möglichst
günstig gebaut werden" → "Bau und Installation dürfen maximal Fr. x kosten."

Over-hedging is the mirror failure: "may potentially suggest that it could be
possible". One hedge per claim, maximum.

Hard rule: if a rewrite makes unfinished work read as finished, the rewrite is
wrong even when the prose is better.

## Pass 3 — Präzision

| So gelingt es | Was ist zu vermeiden |
|---|---|
| Concrete, quantified statements | Modal verbs (*should, might, could*), catch-all words, indefinite "one" |
| Measured word choice | Unjustified superlatives, slang |
| Terms that mean exactly what is needed | Approximately-right words |
| Tight expression | Repetition, rambling description, drift off the research question |

Apply the FHNW adjective rule aggressively to AI text: **be stingy with
adjectives and adverbs in technical prose — they inflate content.** Fact first,
judgement second. Their example: "Die erfolgreiche Massnahme führte zu drei
Prozent mehr Umsatz" — "erfolgreiche" does nothing because the reader cannot yet
see the success. Better: state the gain, then call it a success.

Mechanical check: delete every adverb in the paragraph, restore only those whose
absence changes the meaning.

## Pass 4 — Lesefreundlichkeit

| So gelingt es | Was ist zu vermeiden |
|---|---|
| Known or defined technical terms | Undefined terms; synonym-hopping for one concept |
| Restrained, correct loanwords | Unnecessary or misused ones |
| Concrete expressions, verbs instead of nouns | Abstractions, nominalizations |
| Subject–verb–object order | Split verb brackets, ambiguous word order |
| Main clause first, simple construction | Nested clauses, over-long sentences |
| Direct expression | Passive used as the default voice |

Thresholds from FHNW: standard sentence ≈ 16 words; above 25 words comprehension
fails. **One thought, one sentence.** Nominal groups of more than three members
must be split across sentences.

Kill nominalizations by restoring the buried verb: "provides a review of" →
"reviews"; "performs an evaluation of" → "evaluates"; "the implementation of the
calibration was carried out" → "the calibration ran".

Passive is fine where the actor is genuinely the system or genuinely irrelevant
— which, given the impersonal house style, is most of this thesis. It is not
fine as a reflex that buries a real actor behind "it was decided that".

## Pass 5 — Logik und Leseführung

| So gelingt es | Was ist zu vermeiden |
|---|---|
| Sentences that connect; correct conjunctions and pronouns | Missing or wrong connectors, ambiguous pronoun reference |
| Floats woven into the text, introduced and interpreted | Floats with no lead-in, no interpretation, no caption |
| Consistent tense (present↔present/perfect, past↔past/pluperfect) | Tense mixing inside one sentence |
| Logical ordering of thoughts | Jumps, missing intermediate steps, contradictions |
| Everything that belongs together in one section | The same thought in several places |
| A clear thread tied to the research question | Passages that do not serve it |

Two AI-specific failures this pass catches:

- **Fake cohesion.** "however", "moreover", "furthermore", "thus" sprayed
  without a real relation. Check each: does "however" mark an actual contrast?
  If the connector can be deleted without loss, delete it. If it is wrong, fix
  the logic, not the word.
- **Broken correlative pairs.** FHNW flags "einerseits … zum anderen"; in
  English, "not only … but instead", or "on the one hand" with no other hand.

Cross-check with `make figures`: every float `\cref`'d, introduced before it
appears, interpreted after.

## Pass 5b — Motivation against outcome

The passes above catch claims that contradict each other. This one catches a
passage where every fact is individually right and the *reason given for doing
the thing* is still wrong — because the results ended up justifying it
differently. It is invisible to a contradiction check, so it has to be looked
for on purpose.

For every section opener and every design-rationale sentence — "X was done
because Y", "this is needed because", "which motivated", "in order to", "so
that" — ask: **did the evaluation and the conclusions justify it this way?**

Worked examples, all found in this thesis after seven contradiction audits had
already passed over them:

- A visual-servoing section argued that encoder placement, backlash and
  compliance make the arm untrustworthy, so vision is needed to steer it
  accurately. The conclusions state "The kinematics was accurate, the vision was
  not", and the deployed system uses vision to relate two frames, not to steer.
  The motivation named the wrong problem.
- An optimisation section opened on "a hard latency budget of a few tens of
  milliseconds per observation-to-action pass". The policy runs open-loop with
  action chunking and the deployed chunk is 325 ms. The motivation invoked a
  constraint the design had already removed.
- A distillation subsection rested on the cited paper's "sampler is 80 % of
  latency". On this work's own engines the sampler is about a quarter. The
  premise was true of the source and false of the system.
- An implementation chapter called simultaneous marker visibility "a convenient
  property of the maintenance task" that the approach exploits, sixty lines
  above its own measurement that the property holds in 2.2 % of frames at the
  working pose.

The fix is never to delete the section. Restate the motivation as the reason the
results actually support — which is usually the more interesting reason, and
which stops the later finding reading as a surprise the thesis sprang on itself.

Related, and worth one sweep of its own: **theory sited where it explains
nothing.** If a passage's mechanism is load-bearing for a different section than
the one it sits in, move it there. A quantisation explanation lived under an
on-device model that never quantises, while the section that needed it to
explain an FP16 failure cross-referenced *into* it.

## Pass 6 — AI tells and rhythm

- **Tricolons.** AI groups in threes. Two items or one usually suffice; when the
  third exists for cadence, drop it.
- **Binary contrast.** "Not X. Y." / "This isn't about A, it's about B." State
  the claim.
- **Unearned opposition**, the quiet version of the same tell and far more
  common: "X rather than Y", "X instead of Y", "not Y but X", where Y is
  something no reader was going to propose. "Cartesian commands describe the
  task rather than the arm." "The prediction discards the previous state rather
  than propagating it." Drop the *rather than* clause and check whether anything
  was lost. The test is whether Y is a live alternative in the reader's head:
  "Rather than regressing the time as a scalar, the critic predicts a
  distribution" keeps its opposition, because regression is exactly what a
  reader expects there. Nothing else does.

  Sharpened after a pass where the author rejected three instances the test had
  cleared: require the alternative to be one the **thesis actually considered**,
  not one a reader could imagine. "Not a display choice", "not a runtime
  tracker", "rather than how a differential-drive twist would describe it" all
  fail that. Default to deleting the *not-Y* half and see whether the sentence
  lost anything.
- **Wrong-agent verbs.** A chapter, section, figure or table *reports*,
  *states*, *lists*; it does not *measure*, *prove*, *argue* or *demonstrate*.
  Experiments and people do those. "\cref{section:eval-trt} measures both
  rates" → "reports". Cheap to check, and it reads as ghostwriting when wrong.
- **Claims too general to be false.** "Nothing in them is specific to the
  manipulator." "The same nodes run on different hardware configurations." If no
  observation could contradict the sentence, it is decoration. Replace with the
  mechanism that makes it true, or cut.
- **Coined compression.** Rewriting from the claim can produce a vivid phrase
  that is not literally checkable — "a filter that can average hard", "the
  geometry is against them". After each rewrite, read the new phrases back and
  ask whether each names something a reader could verify. If not, state the
  fact: "averaged, and the panel is assumed static".
- **Self-answered rhetorical questions.** FHNW allows them sparingly as
  structuring devices; cap at one or two in the entire thesis, where the
  question is genuinely the reader's.
- **Dramatic fragments** and one-sentence paragraphs for emphasis. FHNW warns
  separately against over-fragmented paragraphs.
- **Em dashes** as an all-purpose connector. Use commas, colons, or a full stop.
  While there, check `---` / `--` / `-` are used correctly.
- **Bold-first bullets** (`\textbf{Term.} explanation`) as the default list
  shape.
- **Uniform paragraph length.** Three-to-four-sentence paragraphs down a whole
  page reads as machine output.
- **Word-stem repetition.** FHNW's example repeats *realisier-* three times in
  three sentences. `make spell` will not catch this; check by eye.

## Pass 7 — Consistency

- **One term, one concept**, throughout. Fix synonym drift: "the policy" / "the
  model" / "the network" / "the agent" for the same object; "arm" /
  "manipulator" / "Barbara".
- **Acronyms** defined once at first use, then used, never re-expanded. Check
  ToF, VLA, IK, EKF, RL, TRT, SmolVLA.
- **Numbers agree** across text, tables, figures, and abstract — same values,
  same significant figures, `siunitx` for units.
- **Citation keys** resolve and support the claim (already covered in Pass 0;
  re-check anything moved or merged during rewriting).

## Pass 8 — Thesis mechanics

- Every `\label`, `\cref`, `\task`, `\kw`, `\note` and float survives the
  rewrite. Silently dropping a label is a defect.
- Non-Latin glyphs in printed bibliography fields break the build under
  `inputenc` — wrap in math or remove.
- Legitimate new technical terms flagged by `make spell` go into
  `tools/dict/project.dic`. Never reword valid prose to appease the spell
  checker.
- Finish with `make check` and `make`.

## Rewrite procedure

Work paragraph by paragraph. Sentence-local edits preserve the AI paragraph
shape, which is where the bulk lives.

1. Read the paragraph and state, in your own words, the one claim it makes.
2. Zero claims → delete it.
3. More than one → split it.
4. Rewrite **from the claim**, not from the original sentences. Rewriting from
   AI text inherits its rhythm.
5. Restore only the specifics the original carried: numbers, citations, terms.
6. Compare lengths, counting prose only — exclude TikZ blocks, tabulars,
   equations and comments, or a diagram-heavy file will report a cut it did not
   make. Then interpret the ratio as a **diagnostic, not a target**:

   - **40–60%** — where the original was AI-bulked. Previews, fractal summaries,
     unrequested comparison tables, and paragraphs restating their neighbour.
   - **75–90%** — dense prose that has already been revised once. A derivation,
     a method description, or a passage of honest status statements has little
     bulk to give, and the four dimensions still apply to it.
   - **above 90%** — treat as a defect in the pass, not a property of the text.
     Re-run steps 1–5 before concluding the file was dense.

   **The whole-file ratio hides growth.** It nets cuts against additions, so a
   pass can delete three scaffolding paragraphs, grow two others past their
   original length, and report a number that looks like honest density. Check
   per paragraph as well: any paragraph longer after the pass than before needs
   a reason, and "the corrected motivation needed the evidence" is not one — see
   Pass 1b. On the chapter this rule came from, the file read 99.7% and two
   paragraphs had grown.

7. **Have someone else find the bulk you cannot see.** After step 6, hand the
   current file and the diff to a reviewer that has not watched you edit — a
   subagent is enough — and ask only for text that can be deleted or compressed,
   with no additions proposed. Editing section by section leaves duplication
   that is invisible from inside, because each sentence looks earned in
   isolation: on this chapter the reviewer found controller switching stated
   three times, the drivetrain status three times, and the same registration
   explained in adjacent paragraphs. That round took the file from 99.7% to
   92.3%, and author review then took it to 78%. Two of those three rounds were
   not the author's job.

   That last band is the one to be honest about, because the failure is
   invisible from the inside: a pass that edits sentences in place produces
   fluent output and a high ratio, and reads like a finished job. Calibration
   from this repo: a chapter given sentence-local edits landed at 96.7%; the
   same chapter rewritten from the claim, paragraph by paragraph, landed at
   88.5% — and the second pass was the one that found a three-way duplicated
   argument, a zero-claim paragraph, and a factual error the first had walked
   straight past.

   A high ratio has to be earned, not assumed. Before concluding a file is
   dense, name the bulk you searched for and did not find: a roadmap opener, a
   paragraph whose claim was already made, a claim the results do not support, a
   float with no lead-in, a synonym drift. If you can name what you looked for,
   report the ratio with that justification. If you cannot, you polished — go
   back to step 1.

   Never cut to reach a number. A pass that hits 60% by deleting a method
   detail, a limitation, or a status caveat has failed, however well it reads.
   Cutting is the usual remedy for bulk, not the definition of the job.

## Reporting

Tag every finding by severity:

- **CRITICAL** — factually wrong, overstated result, hallucinated citation,
  invented number, P8 material reintroduced
- **MAJOR** — impairs clarity: buried claim, broken logic, sentence over 25
  words, undefined term, dropped label
- **MINOR** — style: adverb, tricolon, em dash, filler transition

Show `before → after` with a one-line reason for each non-trivial change. Never
rewrite silently in bulk: the author has to see and be able to reject each
change, and FHNW requires AI use to be declared for revision as well as
generation (`Was referenzieren?`).

Close with the branch name, `git diff --stat`, the prose word-count delta, and
every CRITICAL finding restated. If the pass landed above roughly 80%, say in
one sentence what bulk you looked for and did not find (step 6) — an unexplained
high ratio reads as a pass that stopped early. Above 90%, say instead which
paragraphs you rewrote from the claim and which you only edited in place; if the
honest answer is "edited in place", the pass is not finished.

## Self-check before delivering

Score 1–10; revise below 35/50.

| Dimension | Question |
|---|---|
| Truth | Does every claim match what was actually done? |
| Präzision | Any word that could go without loss? |
| Lesefreundlichkeit | Any sentence over 25 words, any four-member nominal group? |
| Logik | Does every connector mark a real relation? |
| Anreiz | Does it read like a person with something to say, or like filler? |

*Anreiz* is the dimension AI text fails hardest, and cutting cannot fix it —
only having a point can.

## Scope limits

- Edits prose. Does not change technical content, restructure chapters, or add
  citations.
- Flags missing work; never fills it in.
- Does not translate.
- If shortening would drop a required element — a method detail, a limitation, a
  declaration — stop and say so instead.
- Never merges or pushes the branch.
