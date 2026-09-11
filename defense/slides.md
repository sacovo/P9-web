---
theme: default
title: P9 — Mars Rover Autonomy
info: |
  Autonomous manipulation and workflow automation for the FHNW Mars Rover.
  Master's thesis defence, FHNW.
author: Sandro Covo
class: text-left
highlighter: shiki
lineNumbers: false
transition: none
mdc: true
drawings:
  persist: false
fonts:
  provider: none
  sans: 'InterVariable, Inter, Helvetica, Arial, sans-serif'
  serif: 'Georgia, serif'
  mono: 'Courier New, Courier, monospace'
---

<div class="yellow-band"></div>

<div class="kicker">FHNW · Master’s thesis · Defence</div>

# P9 — Mars Rover Autonomy

<p class="text-lg mt-2 mb-7" style="color: var(--fhnw-ink-2)">
Autonomous manipulation and workflow automation for the FHNW Mars Rover
</p>

<div class="text-base">
<strong>Sandro Covo</strong><br>
<span class="dim text-sm">sandro.covo@fhnw.ch · Advisor: Prof. Dr. Christoph Stamm</span>
</div>

<img src="/img/fhnw-logo.png" class="absolute right-12 bottom-10 w-48" />

<!--
45 minutes for the talk, 15–20 for questions. The deck is paced for 41 and the
live demo at the end is the other two, so the ceiling is met with the demo and
comfortably beaten without it. The clock check on each of the five dividers
says where you should be and what to drop first.

The shape: the two contributions the talk is actually about are the policy
(part 1, with part 2 on making it real time) and the workflow layer (part 3,
with part 4 on the agent). Part 5 is what reached the rover. Everything else —
the approach phase, the safety gating, the manipulator control — is one slide
of bullets at the front, with the numbers in its notes for the questions.

Two things to establish in the first three minutes, because everything else
hangs off them: this is a rover that has to run whole ordered tasks over a
delayed link, and the thesis is two systems, not one — a workflow layer that
decides what happens and when, and a policy that produces the motions it asks
for. The maintenance panel is the example that carries both; it is not the
subject.

Assume the advisor has read the report and the expert has skimmed it. Assume
nobody in the room has read chapter 4.
-->

---

# The rover

<div class="grid grid-cols-5 gap-10 mt-2">
<div class="col-span-2 flex items-center">

<img src="/img/manibar.jpg" class="max-h-[370px] w-auto mx-auto border border-[#deded9]" />

</div>
<div class="col-span-3 pt-3">

<div class="kicker mb-3">“Barbara” · European Rover Challenge 2026</div>

| | |
|---|---|
| Arm | 6 DoF, tool changer |
| Cameras | two on the tool, one on the chassis |
| Depth | 8×8 ToF **in the gripper** |
| Compute | 2 × Jetson Orin NX |
| Control | **20 Hz** — 50 ms |
| Link | Wi-Fi, no line of sight |

</div>
</div>

<!--
Start here, not at a task: everything in the talk is bounded by this machine
and by how it is operated.

Point at the photo rather than the table. The tool changer at the top is what
lets one arm do six kinds of thing; the two cameras sit either side of it; the
ToF grid is in the palm, between the jaws, and is not visible here. The arm is
a custom build by the mechanical team — belts, a differential wrist, about a
centimetre of compliance under its own weight. That centimetre comes back
twice: as the accuracy budget of the approach phase, and as the reason a taught
position beats a computed one.

The Jetson is the constraint that generates most of chapter 4: sixteen
gigabytes of UNIFIED memory, shared with the cameras, navigation, SLAM and the
OS. Whatever runs, runs on a 10–25 W board that is already busy.

And the operating conditions are the other half: no line of sight, a Wi-Fi link
with delay in it, and a rotating crew of students at the console. Autonomy is
worth points at the ERC, but the reason we want it is that it takes the link
out of the control loop.
-->

---

# The maintenance panel

<div class="grid grid-cols-2 gap-10 mt-2">
<div>

<img src="/img/maintenance_panel.jpg" class="w-full border border-[#deded9]" />

<p class="note mt-2">Our replica, on a bench at the FHNW. The ArUco markers are
ours, not the organisers'.</p>

</div>
<div class="pt-1">

<div class="kicker mb-2">The prescribed sequence</div>

1. the main switch
2. four lever switches
3. three of five rotary switches
4. a plug into one of two IEC&nbsp;C14 sockets
5. two rotary power switches
6. a plate onto an electromagnet

| | |
|---|---|
| Order | graded; photographs before and after |
| Layout | dimensions and placement published only on the day |
| Elements | repeat, and sit close together |
| Placement needed | **±25 mm** in the panel plane |

</div>
</div>

<!--
The slide is the panel; the framing is yours to say out loud. The two halves of
the thesis are a workflow layer that decides what happens and when, and a
policy that produces the motions it asks for — and the panel is the example
that carries both. It is not the subject.

Two properties of it decide the architecture, and they are worth saying while
the room looks at the photo:

  1. The elements REPEAT and sit close together — five rotary switches that look
     identical. "Turn the third from the left" is not a sentence a language
     model resolves reliably, so something deterministic has to place the
     gripper.
  2. The order is graded, with photographs before and after. Under competition
     pressure operators forget steps. That is the failure mode the workflow
     layer exists to remove — and it is the same failure mode on every other
     task: driving, sampling, the tool change.

The last box is the honest weighting of the talk, and it is why the deck is
built the way it is: the procedure is most of every run, the motion is the
small hard part, and both had to be built.
-->

---

# Three questions

<div class="grid grid-cols-3 gap-8 mt-8 text-sm">

<div>
<div class="kicker mb-3">RQ1 — automation and RL</div>

Automating the ERC tasks, and training more capable manipulation policies with
reinforcement learning.

<p class="note mt-3">The workflow layer and the policy.</p>
</div>

<div>
<div class="kicker mb-3">RQ2 — marker-free depth</div>

Positioning the gripper precisely from depth, where no fiducial markers are
available.

<p class="note mt-3">Partly. I will say where it stops.</p>
</div>

<div>
<div class="kicker mb-3">RQ3 — errors and plan changes</div>

Handling errors, unknown states and changes of plan safely during autonomous
operation.

<p class="note mt-3">Below the autonomy, and above it.</p>
</div>

</div>

<div class="takeaway mt-10">
They cut across the work rather than mapping one to one. I come back to them at
the end.
</div>

<!--
Read the RQs as they are written in the report, then move. This slide exists so
the closing slide has something to close.

RQ2's caveat is better said now than caught in the Q&A: the depth grid is
integrated and shipped, but the ablation that would show the policy uses it was
not run, and the deployed approach phase still needs three markers on the
board. It is on the last-but-two slide too.
-->

---

# Contents

<div class="mt-10 text-xl leading-loose">

1. **The policy** — one model, an instruction, and its own experience
2. **Real time on the Jetson** — one chunk, from 1357 ms to 330
3. **The workflow layer** — a task an operator can read off a canvas
4. **The agent** — the same tools, driven by a model
5. **On the rover** — what runs, what does not, and what comes next

</div>

<p class="note mt-10">
Underneath all five: the approach phase in C++, safety gating, manipulator
control at 20 Hz, depth in the observation.
</p>

<!--
One minute, and it is a map rather than an argument. Read the five lines, say
the one sentence below them, and move.

The two things P9 adds, said once here and not repeated: ONE
language-conditioned policy instead of one model per substep — SmolVLA, RL
post-training with RECAP, distilled to a single step and real time on the
Jetson; and a WORKFLOW LAYER over ROS2 — a task as a canvas an operator can
read, with an LLM agent on the same nodes.

Inherited from P8: markers and an EKF for the approach, per-task ACT policies, a
LeRobot <-> ROS2 adapter and a recorder. No language, and nothing above the
substep — a task was a bespoke node someone wrote, and only its author could
read it. That is what the two additions replace.

THE STACK, if you want a clause per layer: operator (a form, a canvas, a chat
window — no terminal); workflow layer (n8n over a rosbridge WebSocket);
approach and manipulation side by side; safety gating; hardware. The layers are
separated by INTERFACE, not by convenience, and nothing above the control loop
runs at rate — a workflow step costs about 120 ms and about a second once it
waits on a subsystem, so everything at 20 Hz stays in ROS2.

THE APPROACH PHASE, for the advisor, whose field this is. Markers fix the BOARD,
forward kinematics carries the GRIPPER; no marker has to be visible at the
working pose. One square marker admits two poses — marker 88 alone gives two
tool frames 129 degrees apart, reprojecting at 0.68 and 0.70 pixels, and the one
OpenCV calls better is 65 mm from the truth. Pool two markers into a single
solvePnP over eight points and the ambiguity disappears. Stored registration:
18.1 mm median, 83 %, against a ±25 mm requirement. Own recording: 14.9 mm, 12
of 12. Why 25 mm: from that close the switch to be turned is unambiguous in the
gripper cameras, so the policy manipulates ONE switch rather than choosing among
five neighbours. The C++ rewrite took the control cycle from 964 to 59
microseconds and the tail from 3.7 ms to 159 microseconds.

THE ERROR BUDGET, if asked, over 1411 still frames at thirty holds across eleven
stations: random frame-to-frame scatter is 1.49 mm median and 0.33 mm averaged
over twenty frames; what is left after fitting one rigid camera-to-base
transform and one rigid tool offset is 10.87 mm. So the systematic part is about
seven times the random one, and it grows with reach — vision reads 15 to 20 per
cent less reach displacement than forward kinematics. Ruled out: lens distortion
(1.05 mm), principal point, image position, wrist attitude, joint zeros,
monocular scale. Characterised rather than attributed: reach and camera range
correlate at 0.97 and the two candidate directions are 7.9 degrees apart. The
decisive experiment is a second rover-fixed camera seeing the same markers,
which the rover already carries. And the reference is soft too — three of the
detector's switch positions move 5.0 to 8.5 mm between recordings.

SAFETY, if asked. The four layers differ in what they leave running: the upper
three hold the arm under its controllers, only the hardware stop drops holding
torque. The heartbeat is an ABSENCE-detector, not a command — a crashed
interface, a dead link and an operator who walked away all produce the same safe
outcome, sub-second, with nobody deciding to. The e-stop LATCHES: new goals are
rejected until a message on /e_stop/reset. Deliberately NOT gated: a move to a
joint configuration taught beforehand, released by a human through a form — the
tool change in part 3 runs entirely on such moves. All three software layers
were exercised on the running rover.
-->
---
layout: section
---

<div class="kicker mb-4">Part 1</div>

# The policy

<p class="mt-4 text-lg">
One model, an instruction, and its own experience
</p>

<!--
Clock check: minute 4 of 45. If you are past 6, cut the FAST half of the
knowledge-insulation slide.

This part is twelve slides and it is the technical core. Budget 11 minutes.
The order is: what the model is (1 slide), how a chunk is produced (3), RECAP
(2), knowledge insulation (1), distillation (1), what came out (4 — the
benchmark with the demo clips, the results, the SnapFlow correction and the
guidance follow-up). Making it *fast* is part 2 and is no longer in here.

What used to sit in here and is now in the appendix, ready if asked: the
SmolVLA architecture diagram, its parameter counts, the critic and its honesty
fix, and the f-plus label figure.

"Can guidance survive distillation?" is the designated cut and its notes say so:
dropping it costs no thesis-relevant claim, since the correction slide before it
carries the one that matters.
-->

---

# One model instead of one per task

<div class="grid grid-cols-2 gap-12 mt-3">
<div>

<div class="kicker mb-2">In</div>

<v-clicks>

- three camera images
- the arm's joint state, and the ToF grid
- *“rotate the black switch to the right”*

</v-clicks>

<div class="kicker mb-2 mt-5">Out</div>

<v-click>

- a **chunk of actions** for the arm to execute

</v-click>

<div class="takeaway mt-5" v-click>
A single policy handles different tasks.
</div>

</div>
<div class="flex justify-center items-center">

<img src="/figs/vla_loop.svg" class="h-[300px]" />

</div>
</div>

<!--
Plant two things here, both of which are load-bearing later.

CHUNKING. One expensive forward pass buys fifty control steps. Without it a
450M-parameter model could not drive a 20 Hz arm at all. With it, the question
stops being "how fast is inference" and becomes "how often can it re-plan" —
which is the shape of the whole deployment section.

The CHUNK IS OPEN LOOP. The policy sees one observation and commits to 2.5
seconds. Nothing corrects it in between; a separate progress model decides when
to stop.

If asked why SmolVLA and not pi-0 or GR00T: 450 million parameters against four
billion plus, and roughly 0.9 GB of weights against ten. The larger models are
not deployable on this board, full stop.

If asked what is INSIDE it — the prefix, the sixteen backbone layers, the action
expert, the parameter counts, the 83-value state token with the flattened 8×8
depth grid — the architecture diagram and the numbers table are the first two
appendix slides. Go there rather than describing them.

The figure is the LIBERO configuration — two cameras, chunks of twenty — while
the bullets are the rover's: three cameras and fifty actions. Different dataset,
different config. Say so if anyone reads the boxes closely.
-->

---

# How one chunk is produced

<div class="mt-8 flex justify-center">

<svg viewBox="0 0 900 300" class="w-full max-w-[880px]" role="img" aria-label="Observation into the VLM prefix, its cache into the action expert, ten Euler steps, then one chunk of actions">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#131a1f"/></marker></defs>
  <g fill="#f1f1ee" stroke="#767573" stroke-width="1.5">
    <rect x="2" y="118" width="152" height="84" rx="3"/><rect x="228" y="118" width="186" height="84" rx="3"/><rect x="488" y="118" width="186" height="84" rx="3"/><rect x="748" y="118" width="150" height="84" rx="3"/>
  </g>
  <text x="78" y="152" style="font-size:17px;font-weight:600;fill:#131a1f" text-anchor="middle">observation</text>
  <text x="321" y="152" style="font-size:17px;font-weight:600;fill:#131a1f" text-anchor="middle">VLM prefix</text>
  <text x="581" y="152" style="font-size:17px;font-weight:600;fill:#131a1f" text-anchor="middle">action expert</text>
  <text x="823" y="152" style="font-size:17px;font-weight:600;fill:#131a1f" text-anchor="middle">action chunk</text>
  <text x="78" y="176" style="font-size:13px;fill:#767573" text-anchor="middle">3 images · state</text>
  <text x="78" y="192" style="font-size:13px;fill:#767573" text-anchor="middle">· instruction</text>
  <text x="321" y="176" style="font-size:13px;fill:#767573" text-anchor="middle">once per</text>
  <text x="321" y="192" style="font-size:13px;fill:#767573" text-anchor="middle">observation</text>
  <text x="581" y="176" style="font-size:13px;fill:#767573" text-anchor="middle">one velocity</text>
  <text x="581" y="192" style="font-size:13px;fill:#767573" text-anchor="middle">estimate</text>
  <text x="823" y="176" style="font-size:13px;fill:#767573" text-anchor="middle">2.5 s of motion</text>
  <g stroke="#131a1f" stroke-width="1.8" marker-end="url(#ah)" fill="none">
    <path d="M158,160 H222"/><path d="M418,160 H482"/><path d="M678,160 H742"/><path d="M581,268 V206"/>
  </g>
  <text x="450" y="150" style="font-size:13px;fill:#767573" text-anchor="middle">cache</text>
  <text x="581" y="286" style="font-size:13px;fill:#767573" text-anchor="middle">noise</text>
  <path d="M660,116 C700,44 462,44 502,116" stroke="#131a1f" stroke-width="1.8" fill="none" marker-end="url(#ah)"/>
  <rect x="518" y="28" width="128" height="28" fill="#fde70e"/>
  <text x="582" y="48" style="font-size:15px;font-weight:600;fill:#131a1f" text-anchor="middle">10 Euler steps</text>
</svg>

</div>

<div class="mt-8">
<p class="note text-center">
The expensive half runs <strong>once</strong>; the cheap half runs ten times.
That split is what makes the export in part 2 possible at all.
</p>
</div>

<!--
The general principle before any of the mathematics. Walk it left to right in
four sentences and do not stop anywhere.

  · The observation is three camera images, the joint state with the depth grid,
    and the instruction.
  · The VLM reads all of that ONCE and leaves a cache behind. This is about 95
    per cent of the cost of a chunk, and part 2 is entirely about it.
  · The action expert starts from noise and asks, ten times, "which way should
    this chunk move" — each pass a single velocity estimate, each one reading
    the same cache.
  · What comes out is fifty actions, two and a half seconds of motion, not a
    sentence.

The two questions this pre-empts: why the policy is split into a prefix and a
suffix engine (part 2), and why the ten steps can be distilled into one without
touching the expensive half.
-->
---

# Training: a regression onto a straight line

<div class="mt-2">

<img src="/figs/fig_fm_train.png" class="w-full max-w-[820px] mx-auto" />

<div class="grid grid-cols-2 gap-12 mt-5 items-center">
<div>

$$\mathcal{L} = \mathbb{E}_{\tau,\epsilon}\bigl\lVert\, v_\theta(A^\tau, o_t) - (A - \epsilon)\,\bigr\rVert^2$$

</div>
<div>

<p class="note">
Draw noise, draw a point on the straight line between it and a demonstrated
chunk, and regress onto that line's velocity. No solver and no sampling in the
training loop.
</p>

</div>
</div>

</div>

<!--
One minute. The point is that training is cheap and ordinary: it is a
regression, and the target is a straight line, which is why a flow-matching
policy trains as easily as a behaviour-cloning one.

τ is the interpolation coordinate between noise and data, not time in the
episode — worth saying, because the next slide animates the integration over τ
and the two get confused.

What this buys over regressing the action directly: the model learns a velocity
FIELD rather than a single conditional mean, so it can represent a multi-modal
action distribution. A direct regression onto two equally good demonstrations
predicts their average, which is often a motion neither of them makes.
-->
---

# Inference: ten Euler steps

<div class="flex justify-center mt-2">

<FlowMatching :width="520" :height="310" />

</div>

<div class="mt-3">

$$\mathcal{L} = \mathbb{E}_{\tau,\epsilon}\bigl\lVert\, v_\theta(A^\tau, o_t) - (A - \epsilon)\,\bigr\rVert^2$$

</div>

<!--
Two minutes, and the animation carries it — talk over it rather than to the
bullet points.

Say what is on screen: the two blue clouds are two demonstrated ways of doing
the same thing, the dots start as pure noise, and the grey arrows are the
velocity field. Then the two things the animation is here to show, in this
order:

  1. THE FIELD IS NOT ONE PICTURE. Watch the arrows change between steps. Early
     on, at tau near zero, they all point at the MEAN of the two modes — a
     model that had to commit at that moment could only predict the average.
     The separation happens late, in the last few steps, once the sample is
     already committed to one side. That is why the field escapes the
     mode-averaging a direct regression cannot: it never has to choose early.

  2. NOW PRESS "1". One Euler step of size one lands every sample exactly on
     the cross — the mean, in the gap between both behaviours, which is the
     one place no demonstration ever put the gripper. This is not a drawing; it
     is arithmetic. At tau = 0 the field is the mean minus the sample, so one
     full step of it cancels the sample and leaves the mean. Press 2 and 4 to
     show the modes pulling apart, then 10 for the deployed sampler.

Everything on screen is evaluated from the closed-form field of this Gaussian
mixture, so it is what a perfectly trained expert would have learned.

The bill, on the left: the prefix — the VLM's pass over images, language and
state — is computed ONCE and cached, so the ten steps are ten passes of the
small expert only. Keep that arithmetic in mind, because on the Jetson it
inverts: there the prefix is 95 % of the chunk and the ten steps are almost
free. The SmolVLA paper's own numbers say the opposite, and the difference is
the hardware.

"Why not simply use fewer steps" now has a picture behind it, and it gets its
engineered answer in five slides.
-->

---

# RECAP: condition on how good the action was

<img src="/figs/recap_concept.svg" class="h-[430px] mx-auto mt-2" />

<!--
RECAP: reinforcement learning with experience and corrections via
advantage-conditioned policies, from Physical Intelligence's pi*-0.6 paper,
2025. Published on a model an order of magnitude larger than ours.

Walk the three panels, slowly.

  (a) Pool the expert demonstrations and the policy's own rollouts. A critic
      scores every frame. The N-step advantage asks whether that step advanced
      the task faster than the baseline rate. A percentile threshold splits the
      timesteps: the top f-plus fraction gets a POSITIVE token, everything
      else — failures included — gets a NEGATIVE one.

  (b) Train on both labels. The negative frames are trained on, not discarded:
      the positive condition is defined against them.

  (c) At inference, clamp the token to positive.

The red dashed arrow at the bottom is the self-improvement loop. The improved
policy collects new rollouts, which are relabelled and trained on again.

Answer the obvious question before it is asked: is this reinforcement learning?
There is no policy gradient and nothing online. It is critic-based relabelling
plus conditioned supervised fine-tuning — chosen precisely because it needs
neither reward shaping nor online-RL infrastructure, both of which are
impractical on a robot arm.

Our two differences from the paper: ten times smaller, and no human in the
rollouts. They mixed corrective teleoperation into the rollout data. We did
not, and the results slide is about what fills that gap.
-->

---

# Two knobs: the threshold, and guidance

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2">

<div class="kicker mb-1">Per-frame advantage</div>

$$A_t = V(o_{t+N}) - V(o_t) - \tfrac{N}{T_{\max}}$$

<p class="note">Did the critic's value move more than the clock did? The top
<strong>f⁺</strong> of successful frames are positive; everything else is
negative.</p>

<div class="kicker mb-1 mt-5">Classifier-free guidance</div>

$$v = v_{\text{unc}} + w\,(v_{\text{pos}} - v_{\text{unc}})$$

<p class="note">Dropped for 30 % of training samples, so one network learns
both.</p>

<div class="takeaway warn mt-4 text-sm">
Any weight other than 0 or 1 runs the whole model <strong>twice</strong>.
</div>

</div>
<div class="col-span-3 flex justify-center pt-1">

<Guidance :width="498" :height="300" />

</div>
</div>

<!--
Do not derive the TD residual. Two things only: it is a per-frame "better than
expected?" score, and f-plus is a knob controlling what fraction of frames may
be positive.

If someone asks about the reward, the honest answer is the interesting one:
there is no shaped reward at all. Every step costs −1/T_max, so the sum over N
steps is a CONSTANT, and the whole advantage is how far the critic's value
moved over 50 frames minus that fixed budget. Progress faster than the clock is
positive. That is also why the critic has to be honest — it is the only thing
in the formula carrying information.

The honesty problem itself is an appendix slide, with the value trace: trained
on successful demonstrations only, the critic scores a FAILED rollout almost as
highly as a successful one, and the fix is to fine-tune on the rollouts with a
large constant added to the remaining time of failed episodes. Say the sentence
here if it comes up; show the slide only if pressed.

The guidance analogy for a non-specialist: the same trick image generators use
to enforce "more prompt", pointed at "more good behaviour".

Let the sweep run once while you say the formula, then grab the slider and walk
it by hand — it is the same 2-D example as the flow-matching slide, with the
two modes now standing for the two advantage labels:

  w = 0   the unconditioned field. Trajectories land in BOTH clouds, because
          nothing has told the policy which one is wanted.
  w = 1   the positive conditional exactly. The bundle collapses onto the blue
          cloud. One forward pass, and it is what the deployed policy runs at.
  w > 1   hold here. The endpoints keep going, PAST the blue cloud, into a
          region where no demonstration ever was. That is what "extrapolates"
          means, and it is why guidance can overshoot as easily as it can help.

The inset is the formula at one point on the way: the grey arrow is v_unc, the
blue one is v_pos, and the black one is what actually gets integrated. Its tip
slides along the dashed line as w moves — inside the segment is interpolation,
past the blue tip is extrapolation, and the line turns yellow there.

This is the mechanism behind the f-plus result in the appendix. If the labels are wrong, v_pos - v_unc points away from behaviour the
task needs, and every one of these arrows is then pointing the wrong way, in
proportion to w. Say that here so the sweep on that slide is already familiar.

Flag the latency cost. On the Jetson the second pass is a second run of the
vision-language prefix, and the prefix is 95 % of the chunk, so a guidance
weight is nearly a factor of two — which is why the deployed policy runs at 1.
-->

---

# Knowledge insulation

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

A randomly initialised action expert sends **noise gradients** back into a
backbone that took millions of image–text pairs to train.

$$\mathcal{L} = \underbrace{\mathcal{L}_{\text{AR}}}_{\text{backbone}} + \underbrace{\mathcal{L}_{\text{FM}}}_{\text{expert only}}$$

- The prefix is **detached** before the expert sees it, and every VLM parameter
  is frozen for that forward pass
- The backbone's only signal is a **next-token loss over FAST-tokenised
  actions** — the thing it was pretrained to do

</div>
<div class="pt-2">

<div class="kicker mb-3">FAST: a chunk becomes a short token string</div>

<svg viewBox="0 0 440 200" class="w-full" role="img" aria-label="A smooth joint trajectory transformed by DCT into a few large coefficients, quantised to a short run of tokens">
  <defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#131a1f"/></marker></defs>
  <g stroke="#c8cdc8" stroke-width="1" fill="none"><path d="M8,96 H150"/><path d="M170,96 H312"/></g>
  <path d="M8,80 C40,40 60,120 90,70 C115,30 132,86 150,62" stroke="#131a1f" stroke-width="2" fill="none"/>
  <text x="79" y="122" style="font-size:12px;fill:#767573" text-anchor="middle">one joint over time</text>
  <g fill="#131a1f"><rect x="176" y="40" width="13" height="56"/><rect x="196" y="58" width="13" height="38"/><rect x="216" y="76" width="13" height="20"/><rect x="236" y="90" width="13" height="6"/></g>
  <g fill="#c8cdc8"><rect x="256" y="93" width="13" height="3"/><rect x="276" y="93" width="13" height="3"/><rect x="296" y="93" width="13" height="3"/></g>
  <text x="241" y="122" style="font-size:12px;fill:#767573" text-anchor="middle">DCT along time</text>
  <g fill="#fde70e" stroke="#767573" stroke-width="1"><rect x="332" y="62" width="30" height="26" rx="2"/><rect x="366" y="62" width="30" height="26" rx="2"/><rect x="400" y="62" width="30" height="26" rx="2"/></g>
  <text x="381" y="122" style="font-size:12px;fill:#767573" text-anchor="middle">quantise → BPE</text>
  <g stroke="#131a1f" stroke-width="1.5" fill="none"><path d="M156,96 H168" marker-end="url(#fa)"/><path d="M316,96 H328" marker-end="url(#fa)"/></g>
  <rect x="8" y="152" width="424" height="36" fill="#f1f1ee"/>
  <text x="20" y="175" style="font-size:13px;fill:#131a1f">Smooth motion is a few low frequencies; the rest are zero.</text>
</svg>

</div>
</div>

<!--
The symptom this prevents is specific and worth naming: a policy that stops
responding to language. It has forgotten what "the middle drawer" means while
learning to move a joint.

Two mechanisms, both needed, because "stop gradient" sounds like one line of
code. The prefix tensor is detached, which cuts the self-attention route; and
every VLM parameter is set requires_grad=False for the flow-matching forward
pass, which cuts cross-attention, residuals and MLPs. Both are restored before
the AR backward, which is what still trains the backbone.

So the two loss terms train disjoint parameter sets in one optimiser step.

FAST+ is used off the shelf: the universal tokenizer, its BPE vocabulary
trained on about a million real robot trajectories, nothing fitted to our data.
It never runs at inference — every deployed action comes from the flow expert.

Be honest about the 5-to-11 if asked: our no-insulation baseline changes the
pre-training RECIPE as a whole — insulation, FAST co-training and the
conditioning token — not the stop-gradient in isolation. The report says so.

DROPPABLE: the right-hand column. The left half is the load-bearing part.
-->

---

# SnapFlow: ten steps into one


<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2 pt-1">

Ten Euler steps distilled into a **single time-conditioned jump**, with the
model as its own teacher.

<div class="snapflow-loss my-4">

$$\mathcal{L} = \underbrace{\bigl\lVert f_\theta^{\,\tau\to\tau'} - \mathrm{sg}\bigl[f_\theta^{\,\text{2 half-steps}}\bigr]\bigr\rVert^2}_{\text{consistency}} \;+\; \underbrace{\bigl\lVert v_\theta - (A-\epsilon) \bigr\rVert^2}_{\text{flow matching}}$$

</div>

<div class="legend mt-3 text-xs">

| | |
|---|---|
| <em>f</em><sub>θ</sub> | student = one jump τ→τ′ · teacher = the same weights, in two half-steps |
| sg | stop-gradient: the teacher branch is a frozen target |
| <em>A</em> − <em>ε</em> | demonstrated chunk minus its noise — the straight line's velocity |

</div>

<div class="takeaway warn mt-3 text-sm">
Two half-steps beat one whole, so the teacher is always slightly ahead — and
improves with the student.
</div>

</div>
<div class="col-span-3 flex justify-center pt-1">

<SnapFlow :width="498" :height="288" />

</div>
</div>

<!--
The legend under the loss is there so nobody has to ask; do not read it out.
The longer answers if someone does: f_theta is the one model wearing both hats
— the student takes a single jump from tau to tau-prime, the teacher covers the
same interval in two half-steps. sg[.] is the stop-gradient: no gradient flows
back through the teacher branch, so the target is frozen for that update and the
student moves onto the teacher rather than the teacher drifting onto the
student. Without it both ends could meet by collapsing anywhere, and the trivial
constant solution has zero consistency loss. v_theta and A - epsilon are the
flow-matching term from earlier, kept in the objective so the field itself stays
valid while it is being distilled: A is the demonstrated action chunk, epsilon
its noise sample, and A - epsilon is the velocity of the straight line between
them.

Everything before this made the policy BETTER. This is the one that makes it
FASTER. Same 2-D example as the flow-matching slide, one noise sample, and it
builds in four beats — let it loop once, then walk it with the beat buttons.

  1  THE TEN STEPS. The blue path is the deployed sampler, and A is where it
     lands. This is the answer the shortcut has to reproduce.

  2  ONE EULER STEP. The grey dashed line is the free option — follow the
     initial velocity for a full unit of time. The field curves away underneath
     it and it lands on the cross, nowhere near A. That is why the step count
     cannot simply be turned down.

  3  THE TEACHER. Evaluate the field at the noise sample, take HALF a step,
     evaluate again there, average the two velocities into one chord — the
     orange arrow — and let the student take a single jump along it. Say the
     identity out loud, because it is the whole trick: one jump along the
     average of the two velocities lands EXACTLY where the two half-steps
     land. Not approximately. It is the same arithmetic rearranged.

  4  THE BOOTSTRAP, and this is the beat that answers "how can it teach itself
     without going in circles". Two more paths appear, at 4 steps and 8, and
     each one hugs the blue curve more closely than the last — the family on
     screen is now 1 (grey dashed), 2 (the teacher's polyline), 4, 8 and 10.
     Two half-steps are strictly better than one whole step for the same field,
     so the teacher branch is always slightly ahead of the student; training the
     student to match it moves the student forward, and because the student IS
     the teacher, the target moves forward with it. In this example the distance
     to A falls 1.39, 0.34, 0.14, 0.02 for 1, 2, 4 and 8 steps. The fixed point
     of that recursion is the full integration.

Be honest about beat 3 if asked: the chord does NOT land on A either — it lands
where two steps land, which is four times closer than one step and still short.
That is the point of beat 4. Nobody ever computes the ten-step solve during
training.

THE SECOND SCENE. The "training rounds" button switches the same figure to what
happens over rounds, and it is the natural follow-up to beat 4 — press it if
the room looks unconvinced, or if someone asks whether the target runs away
from the student.

Name the two paths before narrating the rounds. The ORANGE line is the student:
one straight segment from the noise to wherever its single call lands, and it
stays one segment however good it gets, because one forward pass is the entire
point of the distillation. The BLACK line is the teacher: two segments through
the hollow node, which are its two half-steps.

Then each round is the same three moves. The jump swings up onto the chord —
that is the training. The two ends meet, which is consistency. The teacher then
recomputes on the improved model and is ahead again by HALF as much. The gaps
it closes run 1.09, 0.20, 0.11, and the student lands 0.34, 0.14, 0.02 from A,
so consistency is re-established every round and what is left of it halves.
That is the whole argument that the loop converges.

Worth pointing at once you reach the last round: the orange chord still does
not FOLLOW the blue curve, it cuts straight across it. A distilled policy does
not reproduce the trajectory, only its endpoint — which is all the arm is ever
given anyway.

There is a copy of that scene in the appendix, since the PDF of this slide can
only carry one of them — and next to it, the answer to the question this beat
invites: why the target is two half-steps rather than the ten-step solve.

The zero initialisation is the detail I would keep if I could keep only one.
Both linear layers, weights and biases, start at zero, so at step 0 the model's
predictions are bit-for-bit those of the trained ten-step policy. Distillation
starts from a policy that already scores 68 %, not from noise.

The flow-matching term, anchored on real dataset actions, is what forbids the
trivial self-consistent solution — a constant field is perfectly
self-consistent and completely useless.

The number that is not arbitrary: 15k steps. Extending an early variant to 120k
kept LOWERING the distillation loss while closed-loop success dropped about ten
points. The proxy is not the objective.
-->

---
routeAlias: policy-demo
---

# The benchmark: LIBERO

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2 pt-1">

A MuJoCo suite of **language-conditioned** manipulation tasks on a simulated
7-DoF arm. Each task pairs a scene with an instruction and human demonstrations.

<table class="mt-4">
<tbody>
<tr><td><code>spatial</code></td><td>same objects, moved</td></tr>
<tr><td><code>object</code></td><td>same layout, different objects</td></tr>
<tr><td><code>goal</code></td><td>same scene, different instruction</td></tr>
<tr><td><code>long</code></td><td>ten long-horizon tasks</td></tr>
</tbody>
</table>

<p class="note mt-4">Ten tasks a suite, 50 episodes each — 500 per number.
Success is the task's goal predicate holding at termination.</p>

</div>
<div class="col-span-3 flex items-center">

<div class="grid grid-cols-3 gap-4 w-full">
  <Clip src="rollout_spatialT5_ramekin_SUCCESS_ep0" verdict="success" label="spatial — pick and place" />
  <Clip src="cotrain_goalT0_drawer_SUCCESS_ep0" verdict="success" label="goal — open the drawer" />
  <Clip src="cotrain_lib10T5_book_SUCCESS_ep0" verdict="success" label="long — book into the caddy" />
</div>

</div>
</div>

<!--
Two minutes. The benchmark and the demo are one slide now: say what LIBERO is
while the three clips run, and let them keep running.

Each suite varies exactly ONE factor, which is what makes a per-suite rate
informative rather than an average: spatial varies placement with the objects
fixed, object varies the objects with the layout fixed, goal varies the
instruction with both fixed, and long combines them into tasks that chain
subgoals.

The clips are three of the four suites under ONE set of weights — the same
model, advantage-conditioned and distilled to a single step, and the only thing
that changes is the sentence it is given: "pick up the ramekin and put it in the
tray", "open the middle drawer of the cabinet", "pick up the book and place it
in the back compartment of the caddy". That is the whole point of replacing the
per-task ACT models, and it is visible here in a way a table cannot show.

Say the caveat while they play: this is the LIBERO robot and not the rover,
which is what the whole section carries. The policy works, and it works in
simulation.

If asked why a benchmark at all: it is public, fixed and repeatable, and the
rover is none of those — its arm changes between sessions and a task can fail
for reasons that have nothing to do with the policy.

If someone asks whether the clips are cherry-picked: yes, in that they are
successes. The rates behind them are on the next slide — 80.0, 86.2 and 38.2
per cent — and the failure that matters is the two-subgoal task, where rollout
post-training makes things worse and only demonstrations repair it. The paired
clips for that are on the companion site, not in the deck.

Do not run this from the website. The clips are in the deck and loop silently
on their own; opening a browser here costs a minute and buys nothing. The
workflow demo is still at the end, after the conclusions.
-->
---

# What it is worth: LIBERO

<table class="mt-3">
<thead>
<tr><th>configuration</th><th>spatial</th><th>goal</th><th>long</th><th>avg</th></tr>
</thead>
<tbody>
<tr v-click><td>SmolVLA, no knowledge insulation</td><td>65.0</td><td>70.6</td><td>30.2</td><td>55.3</td></tr>
<tr v-click><td>SmolVLA with insulation &nbsp;<span class="dim">(base)</span></td><td>71.2</td><td>75.8</td><td>41.6</td><td>62.9</td></tr>
<tr v-click><td>+ its own rollout data &nbsp;<span class="dim">(f⁺ = 0.8)</span></td><td>77.8</td><td>80.0</td><td class="neg">35.8</td><td>64.5</td></tr>
<tr v-click><td>+ demonstration co-training &nbsp;<span class="dim">(f⁺ = 0.4)</span></td><td>75.4</td><td>84.2</td><td><strong>43.8</strong></td><td>67.8</td></tr>
<tr v-click><td>+ demonstration co-training &nbsp;<span class="dim">(f⁺ = 0.8)</span></td><td><strong>80.0</strong></td><td><strong>86.2</strong></td><td>38.2</td><td><strong>68.1</strong></td></tr>
<tr v-click><td>+ SnapFlow distillation<sup>*</sup></td><td>74.2 &rarr; <strong>80.6</strong></td><td>84.2 &rarr; <strong>87.6</strong></td><td>40.0 &rarr; 39.4</td><td>66.1 &rarr; <strong>69.2</strong></td></tr>
</tbody>
</table>

<p v-click class="note mt-2"><sup>*</sup>Corrected after the report: the
target-time head was disabled by its initialisation, so the figures on the left
measure SnapFlow with its mechanism switched off.</p>

<div v-click class="grid grid-cols-3 gap-6 mt-6 text-sm">
<div class="takeaway"><strong>1.</strong> KI has the largest effect.</div>
<div class="takeaway warn"><strong>2.</strong> Rollouts help — except on <code>long</code>.</div>
<div class="takeaway"><strong>3.</strong> Demonstrations repair that.</div>
</div>

<!--
Reveal row by row. Six clicks, then the three claims. Say exactly three things;
the next two slides are the analysis.

Protocol, stated once: 500 episodes per suite, each configuration at its best
guidance weight over the same five-point sweep, one seed. Suite-level standard
error about 2 points, which is the resolution every comparison has to clear.

Claim 1: +5 to +11 per suite. That is the pre-training RECIPE, not the RL part.
Claim 2: rollout post-training transfers to a 450M model on the short-horizon
         suites, and makes `long` WORSE — 35.8 against 41.6.
Claim 3: 68.1 against 62.9 for the base, 55.3 without insulation.

WHY `long` REGRESSES, since that slide is no longer in the deck and claim 2 is
incomplete without it. Rollout post-training amplifies the quality of the
rollouts you feed it. Base-policy success per suite stands in for rollout
quality — the rollouts were collected by exactly that policy, 600 episodes,
64.3 % overall. On spatial and goal, three quarters of episodes succeed, so
there is plenty of good behaviour to reinforce and it helps. On `long`, most
rollouts fail, so even the positively labelled frames come from mediocre
behaviour, and the policy falls below where it started. The base policy never
opens a drawer, so its rollouts contain no positive drawer example to
reinforce — that skill can only come back from the DEMONSTRATIONS, which is the
role human corrections play in the original recipe, filled here by data already
on disk. The paired clips are on the companion site under LIBERO rollouts,
alongside a third pair where co-training LOSES a skill the rollouts taught.
Specialisation runs in both directions.

The asterisk is yours to explain, and better volunteered than waited for. The
SnapFlow row is the only one that moved: the report's 66.1 measured the
distillation with its target-time mechanism disabled by an initialisation bug,
and 69.2 is the same recipe with it working. One sentence here -- "that row is
corrected, I will show you why next" -- and the next slide does the work. Do not
start the explanation on this slide.

Two caveats to volunteer rather than defend later. The absolute numbers are not
comparable to published SmolVLA figures, because none of these models saw the
community pre-training corpus. And a fourth suite, `object`, is missing: every
policy here scores ZERO on it, base included. Photometric augmentation alone
lifts it to 53.6 %, which says the policy had overfitted to the appearance of
the training images. It affects every configuration identically, so it
separates nothing and it is excluded rather than printed as a row of zeros.
-->


---

# SnapFlow correction

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-5">

<table class="mt-1 text-sm">
<thead>
<tr><th>one-step policy</th><th>spatial</th><th>goal</th><th>long</th><th>avg</th></tr>
</thead>
<tbody>
<tr><td>as reported <span class="dim">(head disabled)</span></td><td>74.2</td><td>84.2</td><td>40.0</td><td>66.1</td></tr>
<tr v-click><td><strong>with the head working</strong></td><td><strong>80.6</strong></td><td><strong>87.6</strong></td><td>39.4</td><td><strong>69.2</strong></td></tr>
<tr v-click><td class="dim">ten-step teacher, for reference</td><td class="dim">80.0</td><td class="dim">86.2</td><td class="dim">38.2</td><td class="dim">68.1</td></tr>
</tbody>
</table>

<div class="kicker mb-1 mt-4">The target-time head</div>

$$\text{MLP}(s) = W_2\,\sigma(W_1 s + b_1) + b_2, \qquad W_1 = W_2 = 0$$

<p class="note">Zeroing <em>both</em> layers makes it identity at step 0 — and
permanently constant: <span class="mono">SiLU(0)=0</span> kills the gradient to
<em>W₂</em>, and <em>W₂</em>=0 kills it to <em>W₁</em>. Only <em>b₂</em> ever moves.</p>

</div>
</div>

<!--
This is the slide to be straight about. The number in the report is 66.1 and it
is wrong — not mismeasured, but measuring a mechanism that never ran.

The bug in one sentence: the head that tells the network "predict the jump" and
not "predict the local velocity" was initialised to all zeros in both layers, so
it could never learn anything. Zero-init is standard practice — adaLN-Zero,
ControlNet — but it applies to the OUTPUT layer only, exactly so gradients keep
flowing. Zeroing both is an identity that cannot leave.

Three independent confirmations, if pressed. The trained weights: W1, b1, W2
exactly zero, only b2 moved. The algebra above. And end-to-end, embed_suffix
returns bit-identical embeddings for s=0 and s=t on the shipped checkpoint.

There was a second half to the fix, worth mentioning only if asked: every RECAP
checkpoint already carries a zeroed copy of the head, so warm-starting the
student loaded the zeros back over a correct initialisation. Fixing the init
alone changed nothing.

What it means for the thesis claim: the numbers in the report are the ABLATION
of SnapFlow's mechanism, not SnapFlow. Retrained with it working, the one-step
policy matches its own ten-step teacher, which is what the SnapFlow paper
reports and what we had failed to reproduce.

If asked why long does not improve: it does not, 39.4 against 40.0, unchanged.
The gain is entirely on the two short-horizon suites.
-->

---

# Can guidance survive distillation?

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-3">

<table class="mt-1 text-sm">
<thead>
<tr><th>on <code>spatial</code>, n = 500</th><th>w=0</th><th>best</th><th>gain</th></tr>
</thead>
<tbody>
<tr><td class="dim">ten-step teacher</td><td class="dim">73.4</td><td class="dim">80.0</td><td class="dim">+6.6</td></tr>
<tr v-click><td>one-step, ordinary CFG</td><td><strong>80.6</strong></td><td>80.6</td><td class="neg">0.0</td></tr>
<tr v-click><td>+ guidance baked in</td><td>73.6</td><td>73.6</td><td class="neg">0.0</td></tr>
<tr v-click><td>+ direction supervised <span class="dim">(PDM)</span></td><td>74.8</td><td>79.2</td><td><strong>+4.4</strong></td></tr>
</tbody>
</table>

<div class="kicker mb-1 mt-4">What guidance does to a one-step policy</div>

<p class="note">A <em>fixed direction scaled linearly by w</em> — only 0.28 aligned
with the teacher's, and 1.47× too large. Supervising the direction separately
fixes both: <strong>0.50</strong> aligned, <strong>1.06×</strong>.</p>

</div>
<div class="col-span-2 pt-1">

<div class="kicker mb-2">Why baking a weight fails</div>

<svg width="250" height="248" viewBox="0 0 210 208" style="display:block;margin:0 auto;max-width:100%">
  <defs>
    <marker id="ab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#2a78d6"/></marker>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#c70101"/></marker>
    <marker id="ak" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#000"/></marker>
  </defs>

  <g transform="translate(0,0)">
    <text x="0" y="8" style="font-size:8px;fill:#767573;letter-spacing:.04em">NAIVE — BLEND ONLY</text>
    <line x1="14" y1="84" x2="140" y2="48" stroke="#fde70e" stroke-width="6" stroke-linecap="round"/>
    <line x1="14" y1="84" x2="118" y2="28" stroke="#2a78d6" stroke-width="1.2" marker-end="url(#ab)"/>
    <line x1="14" y1="84" x2="174" y2="74" stroke="#c70101" stroke-width="1.2" marker-end="url(#ar)"/>
    <line x1="14" y1="84" x2="140" y2="48" stroke="#000" stroke-width="1.6" marker-end="url(#ak)"/>
    <text x="122" y="24" style="font-size:9px;fill:#2a78d6;font-style:italic">v⁺</text>
    <text x="180" y="78" style="font-size:9px;fill:#c70101;font-style:italic">v⁻</text>
    <text x="128" y="66" style="font-size:9px;font-style:italic">v(cfg)</text>
  </g>

  <g transform="translate(0,112)">
    <text x="0" y="8" style="font-size:8px;fill:#767573;letter-spacing:.04em">PDM — v⁺ AND d</text>
    <line x1="14" y1="84" x2="118" y2="28" stroke="#fde70e" stroke-width="6" stroke-linecap="round"/>
    <line x1="174" y1="74" x2="118" y2="28" stroke="#fde70e" stroke-width="6" stroke-linecap="round"/>
    <line x1="14" y1="84" x2="118" y2="28" stroke="#2a78d6" stroke-width="1.6" marker-end="url(#ab)"/>
    <line x1="14" y1="84" x2="174" y2="74" stroke="#c70101" stroke-width="1.2" marker-end="url(#ar)"/>
    <line x1="174" y1="74" x2="118" y2="28" stroke="#2a78d6" stroke-width="1.6" marker-end="url(#ab)"/>
    <text x="122" y="24" style="font-size:9px;fill:#2a78d6;font-style:italic">v⁺</text>
    <text x="180" y="78" style="font-size:9px;fill:#c70101;font-style:italic">v⁻</text>
    <text x="150" y="44" style="font-size:9px;fill:#2a78d6;font-style:italic">d</text>
  </g>
</svg>


<p class="note mt-2 text-xs">
Li et al., <em>Rethinking Classifier-Free Guidance in On-Policy Diffusion
Distillation</em>, 2026 —
<a href="https://rethinking-cfg-opd.github.io/">rethinking-cfg-opd.github.io</a>.
<span class="dim">Not in the report.</span>
</p>


</div>
</div>

<!--
Optional slide. Drop it first if you are behind — the previous slide carries the
thesis-relevant claim; this one is the follow-up investigation.

The story in four beats, one per click.

  1  Ordinary CFG on the one-step policy: flat. Guidance is worth +6.6 to the
     teacher and nothing to the student.
  2  Baking a fixed weight in: worse, and no guidance response either.
  3  Conditioning on w as an input: the policy learns to ignore it. Blends at
     different w differ only by w(v_pos - v_unc), which is small next to the
     field being regressed, so the loss barely rewards attending to w.
     Conditioning collapse.
  4  Supervising the DIRECTION as its own loss term — positive-direction
     matching, from the CFG-distillation literature — and guidance finally
     works: +4.4, peaking at w=1.5 exactly like the teacher.

The honest ending is that it still loses. 79.2 against 80.6 is inside the
~2-point standard error, and PDM pays for its guidance response with a lower
unguided baseline. So the deployed configuration does not change.

Why this is still worth a slide: it says the failure was a fixable property of
how the branches are supervised, not something intrinsic to one-step sampling.
That is a different claim from "guidance and distillation are incompatible",
which is what the flat rows alone would suggest.

If asked what the measurement is: for each policy, how far its action chunk
moves when w rises, compared to how far the teacher's moves. Direction and
magnitude, at 12 states, 32 noise draws each.

The figure, if you walk through it: three vectors from a common origin. The
positive branch v-plus, the unconditional branch v-minus, and the blend the
sampler actually uses. Baking supervises ONLY the blend (highlighted, top), so
an error on one branch can be cancelled by an equal and opposite error on the
other -- a whole line of equally optimal solutions, and the one training picks
holds only at the weight it was trained at. PDM (bottom) constrains the positive
prediction AND the direction between the branches, which pins both. Redrawn from
Li et al. (the footnote), who name the failure negative branch asymmetry; the w-conditioned
row is gone from the table because it has no reported number -- it never learned
to use its w input.

A conditioned row is not on the slide on purpose. If someone asks whether you
tried making w an input: yes, and the policy ignored it. The blends at different
w differ only by w times the branch difference, which is small next to the field
being regressed, so the loss barely rewards attending to w.
-->


---
layout: section
---

<div class="kicker mb-4">Part 2</div>

# Real time on the Jetson

<p class="mt-4 text-lg">
Getting one chunk from 1357 ms to 330
</p>

<!--
Clock check: minute 15 of 45. Two slides, three minutes.

This is its own contribution in the report and it is the one an engineer in the
room will want. The arc is two sentences: the policy as trained does not fit
the control cycle at all, and what makes it fit is an export path plus a
precision that had to be discovered rather than chosen.

WHY IT HAD TO BE FAST, since the cycle-budget slide is no longer in the deck:
the controller replays a chunk while computing the next one, so the publisher
keeps draining the queue during the forward pass, and the leading actions of a
new chunk describe a moment that has already passed. A chunk of n actions
costing c delivers n - c/dt of them. The bound is c <= n*dt/2, which at fifty
actions is 1250 ms — and eager FP32, at 1357 ms, misses it: it consumes 27 of
its 50 actions before the chunk lands, loses four on every re-plan, and the
queue runs dry. No queue depth fixes that. On the deployed engine the same
amortisation is 43 of 50 actions and 8 ms, and the cycle closes at 30 of 50 ms,
the largest item being the JPEG decode of three camera streams at 15 ms.

If you are past 21, say those two sentences over the engine table and move on.
-->

---
clicks: 4
---

# Making it fit the Jetson

<TrtPipeline :height="430" class="mt-2" />

<!--
Walk the figure with the clicks rather than talking over all of it at once.

  1. The cluster: a trained checkpoint, and nothing else leaves it.
  2. The export: TWO graphs, because an engine holds one forward pass with
     fixed shapes — the VLM prefix once per observation, the expert suffix once
     per denoising step. The loop between them stays in Python.
  3. The build, and the numerics check against the PyTorch reference.
  4. The transfer that does not work.

The last click swaps in the second panel — what the two engines contain — and
the appendix carries that panel again for the PDF.

The figure is three machines: train on the HPC cluster, export to ONNX on a
desktop GPU, build the engine on the rover. The red cross is the transfer that
does not work — TensorRT times kernels on the device it runs on, so an engine
built for SM_86 will not load on the Jetson's SM_87.

The FP16 result is the one to dwell on, because it is a genuine finding and it
was nearly missed. The evidence that it is the vision-language prefix:
  - ACT, which has no VLM, converts to FP16 cleanly.
  - Plain SmolVLA collapses exactly as RECAP does.
  - Hold the prefix at FP32 and leave the expert at FP16, and the policy comes
    back inside the threshold by a factor of fifteen.
And TF32 versus FP16 separates mantissa from range: same ten mantissa bits, an
order of magnitude apart in error.

The methodological part, and be candid: this export pipeline was written by an
AI agent, given a goal, an oracle and the hardware, and left to iterate — 19
hours, 2230 steps, 1252 lines that are still what runs. Two results passed the
check while being wrong. It widened its own acceptance threshold when ACT
missed it, and its rebuild script silently produced an FP32 engine when a
half-precision flag disappeared in TensorRT 11. The oracle also only ever ran
random weights, which is exactly why the FP16 collapse on TRAINED weights was
invisible to it. The lesson is about the oracle, not about the agent.
-->

---

# What each engine costs, and what it costs you

<table class="mt-6">
<thead>
<tr><th>engine</th><th>chunk</th><th>mean abs error</th><th>accepted</th></tr>
</thead>
<tbody>
<tr><td>eager FP32</td><td>1357 ms</td><td>the reference</td><td>—</td></tr>
<tr><td>TensorRT FP32</td><td>858 ms</td><td>0.00000</td><td>yes</td></tr>
<tr><td>TF32 prefix / FP16 suffix</td><td>434 ms</td><td>0.0014<span class="pad">0</span></td><td>yes</td></tr>
<tr><td><strong>TF32 prefix / FP32 suffix, SnapFlow</strong></td><td><strong>330 ms</strong></td><td>0.00017</td><td><strong>yes</strong></td></tr>
<tr><td><em>FP16, whole graph</em></td><td><em>128 ms</em></td><td><em>0.897<span class="pad">00</span></em></td><td><em>no</em></td></tr>
</tbody>
</table>

<div class="grid grid-cols-2 gap-8 mt-8 text-sm">
<div class="takeaway warn">
Converted whole to FP16 the trained policy <strong>collapses</strong>: 0.83 mean
error against a 0.02 gate, and 17 % of the action spread left.
</div>
<div class="takeaway">
A <strong>range</strong> problem, not a mantissa one — TF32 carries the same ten
mantissa bits and is fine.
</div>
</div>

<!--
The numbers behind the pipeline on the previous slide. Read three rows and stop.

  · Eager FP32 is 1357 ms, which is on the wrong side of the bound the next
    slide sets out.
  · The deployed engine is 330 ms — a factor of 4.1 — and it passes the
    acceptance check outright.
  · Whole-graph FP16 would have been 128 ms and is unusable.

The accuracy column is the acceptance check: fifty samples spread over the
dataset, the same preprocessor, per-sample seeded noise so the sampler's own
randomness does not enter the difference. The gate is a MEAN for SmolVLA because
the sampler integrates ten Euler steps and one differing velocity estimate can
carry a single sample onto another trajectory while every other chunk agrees.

The FP16 row is kept in the table on purpose: it is what the optimisation would
have achieved had it been usable, and it is the reason the prefix runs at TF32
rather than at half precision.
-->

---
layout: section
---

<div class="kicker mb-4">Part 3</div>

# The workflow layer

<p class="mt-4 text-lg">
A task an operator can read off a canvas
</p>

<!--
Clock check: minute 18 of 45.

Under 15 means you rushed part 1. Past 20, drop the "what n8n is not" slide and
compress the tool change into one sentence on the maintenance slide.

Parts 3 and 4 are thirteen slides in 14 minutes. They are less mathematical and
they will move faster than you expect.
-->

---

# Why a workflow layer at all

<div class="grid grid-cols-2 gap-12 mt-3 text-sm">
<div>

<div class="kicker mb-2">The problem</div>

- ERC tasks have a **prescribed order**, and operators under pressure forget steps
- A task is ROS2 calls with branches, waits and confirmations — **not a control
  problem**
- The people who run the rover are **not all programmers**

</div>
<div>

<div class="kicker mb-2">The choice</div>

<div class="takeaway warn">
<strong>n8n</strong>, bridged to ROS2 over a rosbridge WebSocket. Topics,
services and actions become drag-and-drop nodes — and the <em>same</em> nodes
are tools for an LLM agent.
</div>

<p class="note mt-2">
A community node package, <code>@fhnw-rover/n8n-nodes-ros2</code>.
</p>

</div>
</div>

<img src="/img/n8n_battery_check.png" class="w-full border border-[#deded9] bg-white mt-5" />

<!--
The framing that lands with a robotics audience: this is not a replacement for
ROS2. It is the layer ABOVE the control loop — sequencing substeps, setting
parameters, reading measurements back, and connecting the robot to things that
are not robots.

Writing one bespoke sequencer node per task is how this normally goes. Then
every change is a rebuild, and only its author can read it.

The single-integration argument is the one I would defend hardest. MCP and
"skills" were both considered. The reason for neither is that an n8n node can
be dragged onto a canvas by a human OR called as a tool by an agent, from the
same definition. Two interfaces would have meant two things to keep in step.

The canvas on the slide is the breadth argument in advance — a battery warning
that raises a task in Asana from a ROS2 topic, ten nodes and no code. It comes
back with its numbers four slides on; here it is just what a workflow LOOKS
like, and the point is that an operator can read it.
-->

---

# n8n ↔ ROS2

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-3">

<img src="/figs/n8n_stack.svg" class="w-full" />

</div>
<div class="col-span-2 pt-1">

<div class="kicker mb-2">Both directions of every primitive</div>

- **Topics** — subscribe, trigger, publish
- **Services** — call, *and* advertise one
- **Actions** — start / status / result / feedback / cancel, and a server
- **Introspection** — topics, services and types at run time
- **Images** — a `CompressedImage` as an n8n binary
- **Docker** — restart a container on the rover

<p class="note mt-4">
Agent tools, all but the triggers.
</p>

</div>
</div>

<!--
The engineering underneath, in one sentence each, because this is where the
work actually was:

  - n8n's execution model is REST-shaped: a node runs, returns, and forgets.
    rosbridge is a persistent socket carrying asynchronous traffic. Connection
    state is therefore held OUTSIDE node executions, one pooled socket per
    endpoint, with concurrent connects deduplicated — otherwise parallel
    executions each open a socket and leak all but the last.

  - DDS discovery latency: a freshly advertised publisher is not yet known to
    subscribers, so the first messages vanish. Publishers wait, and a message
    can be sent as a short burst. Neither makes delivery certain, which is why
    the rule is: a command that SETS STATE goes through a service, whose
    response confirms receipt. The drill workflow was ported from topics to
    services for exactly that reason.

  - The introspection node is what lets a workflow, or an agent, find what
    exists rather than hard-coding interface names. It comes back in part 4.

Three bugs in rosbridge_suite had to be fixed to get here — the action-type
lookup, the parameter cache, and bounded string fields. All three went upstream;
two are merged. The rover runs a fork until they are released.
-->

---

# The maintenance workflow

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

**87 nodes** — one loop per substep, repeated until the operator reports that
substep done:

1. the detector returns the candidate elements of **one type**
2. the operator picks one from a dropdown
3. the arm **aligns**
4. the **policy** runs
5. the operator confirms the outcome

<p class="note mt-3">Before every loop it offers a switch back to manual.</p>

</div>
<div class="pt-2">

<div class="takeaway">
Two substeps break the pattern. Both have a <em>fixed</em> target, so there is
nothing to detect or select — and the plug needs a different tool, so it calls
the tool-change workflow twice.
</div>

<p class="note mt-5">
Run on the rover. Substeps whose policies exist run their loops; the rest are
wired and performed by hand.
</p>

</div>
</div>

<!--
The 87-node canvas is unreadable at any size a slide allows. It is a full-page
figure in the report's appendix, and the whole set is browsable on the
companion site — offer that rather than showing a postage stamp. The next slide
shows a canvas at a size worth reading.

Describe the loop instead, in one breath, walking the five numbered steps. The
point is that the detector is the thing that resolves "which of the five rotary
switches" — a deterministic component, not the language model — and the operator
is in the loop at the pick and at the confirmation.

The branch-order trap that this canvas taught me is on the "what n8n is not"
slide at the end of this part; do not spend it here.
-->

---

# The tool change, on the canvas

<N8nCanvas slug="toolchanger" fallback="img/toolchanger_workflow.png" :height="420" />

<!--
The canvas at a size worth reading. It pans and zooms, and a double-click opens
a node — but click the slide background again before paging on, or the arrow
keys go to the iframe instead of the deck. Without a network it is the
screenshot, and nothing about the slide changes.

Twenty-five nodes. What to point at: every move is a call of the
*Position anfahren* sub-workflow, so the canvas holds no joint value at all —
the values live in a data table and re-teaching a slot after a mechanical change
is one row, not a search through the canvas. Those data tables are the
blackboard of the whole layer: taught positions, task state, and the locks that
would keep two actuating workflows apart. And the form node in the middle is the
operator confirming the tool is held before the arm lifts it clear.

THE LESSON THIS SLIDE CARRIES, and it is the most transferable thing in the
thesis: MECHANICAL TOLERANCE BEATS CONTROL ACCURACY. The rack is bolted on, so
the exchange is a chain of taught joint positions — no camera, no IK. Under a
straight push the residual misalignment jams the coupling, so the workflow
SHAKES THE WRIST while pressing and the lead-in chamfer pulls the halves
together. No amount of software removes the residual error of a taught position;
a chamfer and an oscillating wrist absorb it. That is cheaper than a more
accurate controller.

The numbers: 9 of 10 pickups, 10 of 10 parks, about 30 s a change. And a
deterministic sequence of taught positions has one more property — a retry
starts from exactly the same state as the first attempt, so the one failure cost
a second 30-second run and nothing else.
-->

---

# It reaches further than the robot

<img src="/img/n8n_battery_check.png" class="w-[74%] mx-auto border border-[#deded9] mt-2" />

<div class="grid grid-cols-2 gap-10 mt-4 text-sm">
<div>

<div class="takeaway">
<strong>Ten nodes, no code.</strong> Every five minutes: on battery, below
threshold, no alert open → raise a task in Asana, and remember that it did.
</div>

</div>
<div>

<div class="kicker mb-2">And downwards, into another subsystem</div>

The **deep-sampling** workflow: 70 nodes, five phases, built by another team
member who did not write the node package. 3 of 3 complete runs, 111–148 s end
to end, service call 563 ms median.

</div>
</div>

<!--
The same canvas as two slides ago, now for what it does rather than for what it
looks like. The two examples are deliberately opposite directions, and together
they are what makes the integration worth more than a sequencer.

Upward: a ROS2 topic reaches an issue tracker. The equivalent in a bespoke node
needs an Asana client, its credentials, and somewhere to persist the alert
flag — plus a cron job or a systemd timer to run it at all. Here the debouncing
is three data-table nodes.

Downward: the sampling workflow spans a subsystem the autonomy stack otherwise
never touches, and it is the case that produced the topics-versus-services rule.
An earlier version published setpoints to topics, messages were occasionally
lost, and the drill kept its previous value while the workflow continued as if
the command had landed.

The 563 ms is not n8n's overhead — it is the drill controller's own 2 Hz cycle.
n8n's own overhead is about 120 ms per step.
-->

---

# What n8n is not

<div class="grid grid-cols-2 gap-12 mt-4 text-sm">
<div>

<div class="kicker mb-2">Not a control loop</div>

- ~120 ms a step, ~1 s once it waits on a subsystem
- The 50 ms period stays in ROS2

<div class="kicker mb-2 mt-5">One node at a time, one branch to completion</div>

- A safety property — but execution is **depth-first**, and where a node has two
  outgoing connections the **upper branch on the canvas runs first**
- So a node's vertical position is part of the program: moving one for tidiness
  can change behaviour

</div>
<div>

<div class="kicker mb-2">No interlock between workflows</div>

- Nothing stops two driving the hardware at once
- Automated triggering would need a lock first

<div class="kicker mb-2 mt-5">Debugging re-runs from the trigger</div>

- On the sampling workflow that costs a drill cycle, and two minutes before the
  last phase is reached

</div>
</div>

<div class="takeaway warn mt-5">
The maintenance workflow <em>depends</em> on branch order: the nodes that return
the beacon and the SpaceMouse to autonomous mode sit <strong>above</strong> the
branch that starts the next substep. Below it, the next substep would begin
while the arm was still under manual control.
</div>

<!--
DROPPABLE if you are behind. But it is the slide an expert will respect, so
keep it if you can.

Every one of these was learned by running into it, and none of them is visible
in the editor. That is the actual conclusion: the rules exist, they are
specific to driving a robot from n8n, and they should be written down for the
next team — a command that sets state goes through a service; pin a node's
output before you debug; an actuating workflow takes a lock in a data table
first.

The branch-order rule is the most surprising thing in this part and it is a
genuine trap. It is also the argument for writing that short manual: it is
invisible in the editor and was learned by running into it on the maintenance
canvas.

The honest position on where the boundary sits: n8n belongs above the control
loop. Everything inside it — the 20 Hz policy, the alignment controller, the
heartbeat — stays in ROS2 and always will.
-->

---
layout: section
---

<div class="kicker mb-4">Part 4</div>

# The agent

<p class="mt-4 text-lg">
The same tools, driven by a model — and then by a model on board
</p>

<!--
Clock check: minute 25 of 45. Six slides, seven minutes.

The arc: an agent is worth having for the open-ended half of the work; it must
not drive the hardware; and it can be moved onto the rover for free if you are
willing to fine-tune it on its own executions.
-->

---

# An agent on the same nodes

<N8nCanvas slug="ros2-agent" fallback="img/n8n_ros2_agent.png" :height="400" />

<p class="note mt-4 text-center">
Fourteen tools, all of them read-only by credential. No action node and no
Docker node is attached.
</p>

<!--
The canvas is live, like the tool-change one: pan to a tool and double-click it
if the room asks what a tool definition actually looks like. Click the slide
background again before paging on.

Deterministic workflows take everything that drives hardware, where the order
and the safety must be guaranteed. The agent takes the work where flexibility
helps and a wrong step is cheap: "how is the battery doing?", "which controllers
are loaded?", "show me what the gripper camera sees".

The discovery tools are what make it work without hard-coded names: it lists
what is running, fetches the definition of the interface it picked, and only
then reads or calls it.

The guardrail detail worth defending, because it is the one an expert will
probe: the read-only switch sits on the CREDENTIAL, not on the node. A workflow
author cannot lift it from inside a workflow, and neither can the agent —
an agent driving a node as a tool fills in parameters but never chooses the
credential. Below all of it, any autonomous motion is still under the heartbeat
and the e-stop described on the contributions slide.

The beacon is the apparent exception: setting an indicator light is a service
call, but it moves nothing.
-->

---

# Images through tool calls

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

Tool calling is a **text** protocol: the model emits JSON, the runtime returns a
string. Fine for reading a topic. Not fine for looking at a camera.

<div class="takeaway warn mt-5">
In stock n8n an image could be attached <strong>once</strong>, at the start of a
conversation, and never fetched mid-task. The binary output of a tool was
discarded when the result was packaged.
</div>

</div>
<div class="pt-2">

The fix is in n8n's core: a node's binary output is carried through to the model
as a **multimodal content block** alongside the text.

<div class="takeaway mt-5">
So “capture a frame and tell me what you see” becomes <strong>one tool
call</strong>, issuable at any point in the reasoning loop.
</div>

<p class="note mt-4">
Contributed upstream as n8n PR <strong>#34161</strong>. Open at the time of
writing; the rover runs a pinned fork until it lands.
</p>

</div>
</div>

<!--
Short slide, one minute. It is here because it is the enabling change for
everything on the next two slides — without it there is no vision path to
fine-tune and no vision result to report.

The general point, if you want one: perception reaches an agent as tool
RESULTS. An object list from a detector, a camera frame alongside the text.
Once that is true, "what the robot can do" and "what the agent can do" are the
same set, and extending one extends the other.
-->

---

# Onto the rover

<img src="/figs/agent_finetune.svg" class="w-[92%] mx-auto mt-2" />

<div class="grid grid-cols-3 gap-6 mt-6 text-sm">
<div class="takeaway">
<strong>Offline, and no per-call cost.</strong> Qwen3.5-0.8B, vision-capable,
native function calling.
</div>
<div class="takeaway warn">
The training data is <strong>the deployed agent's own executions</strong>,
driven by a cloud model. Running it is collecting.
</div>
<div class="takeaway">
LoRA, vision tower frozen: <strong>1.25 %</strong> of parameters trained.
Served on the Jetson through vLLM.
</div>
</div>

<!--
Walk the chain. Nothing in it is synthetic.

  - The cloud-driven agent runs against the real ROS2 stack.
  - A collection script pulls completed executions from n8n's REST API and
    reconstructs each turn: system and user messages, the exact tool schemas,
    the calls and their results — camera frames included as multimodal results.
    The schemas are CAPTURED from the running system rather than written by
    hand, which is what guarantees the model is trained against the interface it
    will be deployed on.
  - Grading is the one place a human intervenes: 923 trajectories harvested,
    796 kept. Verbose answers compressed, over-long observations truncated.
    Split at the prompt id and stratified by category, so no prompt leaks
    across the split.
  - LoRA SFT on the SLURM cluster, adapter merged back into the base weights,
    served with vLLM. Rewiring n8n to the local endpoint is one connection
    moved on the canvas.

A finding worth one sentence: a system-prompt ablation — full prompt, short
anchor, none — showed no measurable difference. The tool-use behaviour is in
the weights.
-->

---

# What fine-tuning bought

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-3">

| on 43 reworded held-out prompts | untrained | fine-tuned | cloud |
|---|---:|---:|---:|
| prompts with ≥ 1 tool call | 37 % | **93 %** | 92 % |
| mean tool calls per run | 1.0 | 5.2 | 5.5 |

<p class="note mt-3">
Prompts <em>reworded</em> from the training set — same intent, fresh phrasing —
so this measures learned behaviour, not memorised strings. Cloud pools Gemini
3.5 Flash and Claude Sonnet 4.6.
</p>

<div class="takeaway warn mt-4">
The base model's failure is not that it acts badly. It <strong>refuses to
act</strong>: it answers in prose, and hallucinates. Asked for the state of
charge, it described a “crossfire range display”.
</div>

</div>
<div class="col-span-2">

<img src="/img/agent_vis_local.jpg" class="w-full border border-[#deded9]" />

<p class="note mt-2">
The on-device model discovered a camera topic itself, captured a live frame and
described it: <em>“a person in an orange shirt kneeling… the workbench, tools
and lab environment.”</em>
</p>

</div>
</div>

<!--
State the statistics honestly before anyone asks. Each prompt was run once, so
each local column rests on 43 single observations and the cloud column pools
two models over 86. A difference of a few points is a prompt or two. So 93
against 92 says fine-tuning CLOSED the gap; it does not say the local model
overtook the cloud one, and I will not claim that.

What the number does support is the engineering claim: a sub-billion-parameter
model, specialised on its own recorded executions, becomes usable for a
specific robot's tools. On a Jetson, offline, at no per-call cost.

The vision result is worth the picture: the local vision path works end to end —
camera frame returned as a tool result, read by the small VLM, described
faithfully. The cloud model on the same prompt described its own, different
frame, correctly noting it was looking upward at a dark structure, which is an
artefact of that camera being mounted upside down.
-->

---

# The same prompt, before and after

<div class="grid grid-cols-2 gap-8 mt-3 items-stretch">
<div class="flex flex-col">

<div class="kicker mb-2">Base model — no tool call at all</div>

<pre class="text-xs leading-normal">user: How's the SoC looking right now?

final: The Matterport System's crossfire
       range display is not showing. Does
       this mean you're looking at camera
       input or another mode?</pre>

<div class="takeaway warn mt-auto text-sm">
It answers in prose, about hardware the rover does not have.
</div>

</div>
<div class="flex flex-col">

<div class="kicker mb-2">Fine-tuned — two tool calls, live data</div>

<pre class="text-xs leading-normal">user: How's the SoC looking right now?

[1] List_topics  {"Grep_Pattern": "soc"}
    -&gt; /wecant/AFB/SoC_1/Value ...

[2] Topic_Next_Message
    {"Topic_Name": "/wecant/AFB/SoC_1/Value"}
    -&gt; {"data": 88}

final: The SoC is currently 88 - a decent
       level, though you might want to keep
       monitoring it.</pre>

<div class="takeaway mt-auto text-sm">
Same weights, same prompt. It greps the topic list, reads the value, and answers
from the rover.
</div>

</div>
</div>

<!--
The 37-versus-93 number made concrete, and it is the same prompt on both sides —
verbatim from the appendix, only the line breaks are mine.

The left-hand answer is the characteristic base-model failure and it is worth
naming precisely: it is not a wrong tool call, it is NO tool call. The model
answers from its priors and invents a "Matterport System crossfire range
display", which is not a thing on this rover. That is what fine-tuning removed.

On the right, note what it did NOT need: no system prompt engineering. The
ablation over the full prompt, a short anchor, and none at all showed no
measurable difference — the tool-use behaviour is in the weights.

The honest caveat, and the next slide is about it: this run greps for `soc`
first, which is exactly why it succeeds. A differently phrased request on the
same category has the same model guessing four topic names and giving up. What
separates the two is whether it tries the right substring, not whether the topic
is reachable.
-->

---

# Where the gap actually is

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

<div class="kicker mb-2">Discovery, under paraphrase</div>

Asked to *“read out the current SoC value”*:

- **local** — guessed `sohc_state`, `energy`, `battery`, `power`, subscribed to
  each, gave up
- **cloud** — tried `battery` and `power`, got nothing, then **searched the
  topic list for `soc`** and found `/wecant/AFB/SoC_1/Value`

<p class="note mt-3">
The two local successes on that category both grepped for <code>soc</code>
first. What decides the outcome is whether the right substring is tried.
</p>

</div>
<div class="pt-2">

<div class="takeaway warn">
Also: probes less efficiently (nine CPU topics where the cloud model read
three), and guesses argument schemas instead of fetching them.
</div>

<div class="takeaway mt-5">
This is <strong>not only</strong> a model-size problem. The charge lives at
<code>/wecant/AFB/SoC_1/Value</code>, next to a topic called
<code>MrCrap_A_2</code>. The prefix names the <em>board</em>, not what it does.
</div>

<p class="note mt-4">
Three fixes, and only one of them is a bigger model: semantic topic discovery,
a machine-readable system description, and predictable names.
</p>

</div>
</div>

<!--
This is the slide that turns a limitation into a contribution, so give it the
minute.

The finding is not "small models are worse". It is that ROS2 gives an agent no
way to discover capability except by matching identifier strings, and identifier
strings on a real robot are named by whoever wired the board. A convention like
power_delivery_system/state_of_charge costs nothing when the topic is first
published, and it is the difference between an agent that answers and one that
gives up.

The remaining honest gaps: multi-step planning, efficient probing, schema
fidelity. All three scale with data and model size, so the natural next step is
more collected trajectories in the weak categories and a larger base model —
which the pipeline supports as it stands, since collection is just running the
agent.

The failure that embarrasses me most, if asked: told to turn the beacon red, it
guessed a `Value` field instead of checking the schema, a retry succeeded, and
its final answer reported failure and cited a service that never appeared in
any tool result. Full transcripts are in the report's appendix.
-->

---
layout: section
---

<div class="kicker mb-4">Part 5</div>

# On the rover

<p class="mt-4 text-lg">
What runs, what does not, and what I would do next
</p>

<!--
Clock check: minute 32 of 45. Seven slides and then the demo — these are short,
and they are the ones that decide what the room remembers.

Do not speed up here. If you are late, drop "What I would keep from this" and
fold its second point into the conclusion; if you are very late, skip the live
demo at the end and offer it during the questions instead. Both are cheaper
than rushing the research questions.
-->

---

# End to end, on the arm

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-2">

<img src="/figs/rover_dataset_sample.png" class="w-full" />

<p class="note mt-1 text-[0.72rem]">One episode of the panel-switch dataset.
Four datasets on the Hub, 20 Hz — black switch 83, red switch 24, lever switch
11, four instructions 120.</p>

</div>
<div class="col-span-3 pt-1 text-sm">

<div class="kicker mb-1">Rotary switches</div>

The policy turns them. It often fails on the first attempts, and a retry
eventually succeeds. The substep with the most demonstrations behind it — and
the easiest for a human to teleoperate.

<div class="kicker mb-1 mt-3">Lever switches</div>

Harder, and hard for a human too: the motion tensions and then **snaps** —
exactly what a flow-matching policy handles worst. Eleven episodes.

<div class="kicker mb-1 mt-3">The plug</div>

Not trained. An operator **cannot teleoperate it well enough to demonstrate**,
so there was nothing to imitate.

</div>
</div>

<div class="takeaway mt-3 text-sm">
The full chain runs: teleoperated recording → annotation → critic → advantage-conditioned
fine-tuning → distillation → TensorRT → a policy driving the manipulator, under
the safety layer, started by a workflow.
</div>

<!--
Be plain here. The pipeline is demonstrated end to end; the task success rates
are not what anyone would want yet.

The figure is one episode of the panel-switch dataset: five camera frames along
the top, the six joints measured against commanded in the middle, the gripper at
the bottom. The demonstration opens the jaws, holds them while the arm settles,
closes at 7.5 s, turns the switch with the wrist roll, backs off at 13.5 s.

Say what the recording pipeline actually is, because it is the deliverable: bags
recorded in the field, episode boundaries and task strings set in an annotation
GUI, converted offline into a LeRobot dataset with the same converters the live
system uses. So a recorded frame and a live observation have identical layout by
construction. Nothing has to be kept in step by hand.

Then the concession, and make it plainly. What the arm inherits is the
ARCHITECTURE and advantage conditioning, not the RECAP loop that produces the
gain. The gain was measured on LIBERO, on a different robot, a different dataset
and a different observation layout. The rover policy is pre-trained on a public
UR5 dataset for 120k steps and fine-tuned on those recordings for 30k.

The plug is the honest centrepiece and it is a better lesson than a result:
"you can only imitate what you can demonstrate". The bound is not the learning
method, it is the data-collection interface. On a real robot that interface —
the teleoperation rig, the tool — is PART of the learning system, and improving
it can matter more than improving the architecture. The tool in the report
rotates the plug through 90 degrees as the jaw closes, which removes the
regrasp an operator cannot do. It exists; it has not yet been used to record.

Also say what the approach phase does, because it is the reliable half: it
places the gripper inside 25 mm and it is retried from a known pose when it does
not. Every remaining failure is in the manipulation phase.

The datasets are public under `fhnwrover` on the Hugging Face Hub, and the
companion site links a browser for them.
-->

---

# And what real hardware does to a measurement

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2">

<div class="grid grid-cols-2 gap-3">
<img src="/img/cam_corrupt.png" class="w-full border border-[#deded9]" />
<img src="/img/cam_tear.png" class="w-full border border-[#deded9]" />
</div>
<p class="note mt-2">Two failure modes of one gripper camera. 20 of 135 frames
in one recording; 100 of 131 in another.</p>

</div>
<div class="col-span-3 pt-1">

Nothing downstream filters these. They reach the policy exactly as they arrive,
and one of them shapes **every action in the chunk planned from it**.

<div class="takeaway warn mt-4">
Worse: corrupted frames overload the encoder, and then <em>every</em> camera's
stream lags — including the clean ones. The policy acts on a scene the arm has
already left.
</div>

<div class="takeaway mt-5">
Which is why the quantitative policy claims in this thesis are made in
<strong>simulation</strong>. A failure on the arm could be the policy, or the
camera, or backlash after a collision.
</div>

</div>
</div>

<!--
This slide is now the setup for the competition slide four on: the fault
described here is the one that stopped the policy from running at the ERC. Do
not spend the punchline here — just make sure the room understands that a
corrupted frame reaches the policy unfiltered and that one bad camera lags every
other stream through the encoder.

This slide is the defence of a methodological choice, and it is better to make
it before it is asked as a criticism.

LIBERO is hardware-independent, public and repeatable, so it carries the
quantitative claims. The rover shows that the whole system works on real
hardware. Separating policy quality from hardware variance on the arm would
need far more repetitions than the available arm time allowed.

The corruption is characterised in the report rather than just complained
about: the top image is a frame transfer failing partway through readout — the
magenta band reaches the last line in 19 of 20 affected frames. The bottom one
is data lost inside a line, so lines smear along their own length. They spread
differently over a recording too, which is what says they are different faults.

Then the sim-to-real lesson, if there is time for one sentence: in simulation,
changing the light from indoors to outdoors is one config line. In the real
world it needs several people, equipment, and a favourable weather forecast.
-->

---

# Which policy the rover competes with

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

<div class="kicker mb-2">The decision</div>

The **per-task ACT policies**, one per substep, inherited from P8 and served
through the same TensorRT path.

<p class="note mt-3">
A judgement made under a data and time budget. No controlled comparison stands
behind it, and the camera faults are part of why.
</p>

</div>
<div class="pt-2">

<div class="takeaway warn">
ACT is smaller and each policy covers <em>one</em> motion, so it reaches usable
behaviour on the demonstrations already recorded.
</div>

<div class="takeaway mt-5">
SmolVLA carries every substep in one set of weights. Bringing it to that
standard asks for more demonstrations and more training time than remained.
</div>

<p class="note mt-4">
Both load through the same controller, so the choice is a configuration entry.
The Jetson was never the obstacle: SmolVLA meets the cycle budget with 20 ms
to spare.
</p>

</div>
</div>

<!--
Epilogue on the next slide: in the event neither policy ran, because the camera
went before the substep did. Say "competes with" in the past tense now, and let
the next slide carry what actually happened.

Say this without defensiveness. It is the most likely question in the Q&A and
the answer is better than it sounds.

What is NOT the reason: latency. SmolVLA runs inside the control budget on the
engines, and the ACT models were never needed as a fallback for speed. The
reason is demonstrations, and the report is explicit that this is a judgement
rather than a measurement — nothing in the rover testing separates the two
architectures cleanly.

What that leaves standing: the architecture argument is unchanged. One model
covers every substep, the instruction re-tasks it, and post-training improves
it without new demonstrations. What it lacks is data and time to train on it.
And the recording interface built here is what produces data — including from
the ERC runs themselves, which are recorded as bags and convert straight into
training input.
-->

---

# At the competition

<div class="grid grid-cols-3 gap-6 mt-5 text-sm">

<div class="takeaway">
<div class="kicker mb-2">Workflow layer</div>
<strong>Ran without a failure</strong>
</div>

<div class="takeaway">
<div class="kicker mb-2">Approach phase</div>
<strong>Aligned as measured.</strong> 
</div>

<div class="takeaway warn">
<div class="kicker mb-2">The policy</div>
<strong>Not tried.</strong> 
</div>



</div>

<!--
This is the slide the report could not have: it says "submitted before the ERC,
so no competition results exist yet". Say that out loud once — the examiners
have read that sentence — and then give them the three outcomes.

Take them in the order the boxes are in, and resist inflating any of them.

  1. The WORKFLOW LAYER is the unambiguous success. It ran across several tasks
     without a failure, and it earned automation points outside the maintenance
     panel as well. That is the contribution with the strongest real-world
     evidence behind it, and it is the one built to be used by people who did
     not write it.

  2. The APPROACH PHASE aligned, at the 18.1 mm the report measures. What cost time
     was a configuration and rules problem rather than the vision: part of it
     was ours, decided under pressure in the days before the event. Own that
     plainly rather than attributing it to the rules alone — it reads better and
     it is true.

  3. The POLICY never got to run. A gripper camera had degraded, and with a
     corrupted observation feeding a policy that commands joint positions
     directly, the call was to operate that substep manually rather than risk
     the manipulator. That is a decision, not a crash, and it is worth saying in
     those words.

The connection worth making, because it is the honest version of an "I told you
so": the failure mode that stopped the policy is exactly the one chapter 5
documents and quantifies — 20 of 135 frames hit indoors, only 31 of 131 clean
outdoors, and one bad camera lagging every other stream through the encoder.
The report named it as the top reliability item before the competition, and the
competition agreed.

And it bears on RQ3 as much as on RQ1: handing a substep back to a human
because the observation could not be trusted is the recovery path the third
research question asks for, exercised for real rather than in the laboratory.

If asked whether SmolVLA would have done better: no reason to think so. It reads
the same three camera streams. The blocker was the observation, not the policy.
-->

---

# The three questions, answered

<div class="grid grid-cols-3 gap-8 mt-5 text-sm">

<div>
<div class="kicker mb-3">RQ1 — automation and RL</div>

Approach and manipulation, automated by different tools; workflows above them
so a task is a graph rather than a program.

<div class="takeaway mt-4">
RL enters as <strong>post-training on the policy's own rollouts</strong>:
68.1 % against 62.9 %, in simulation.
</div>
</div>

<div>
<div class="kicker mb-3">RQ2 — marker-free depth</div>

<div class="takeaway warn">
<strong>Not by a result.</strong> The grid is in every frame and in the deployed
observation, with no ablation to show the policy uses it.
</div>

<p class="note mt-3">
And the deployed approach phase still needs three markers on the board. Answered
for the <em>element</em>, not for the environment.
</p>
</div>

<div>
<div class="kicker mb-3">RQ3 — errors and plan changes</div>

Below: a heartbeat that stops on absence, a latching e-stop, cancellable phases.

<div class="takeaway mt-4">
Above: phases with terminal results, so the workflow retries, escalates, or
hands back to a human.
</div>
</div>

</div>

<div class="takeaway mt-8" v-click>
At the ERC: the workflow layer ran across tasks without a failure — and a
degraded camera was handed back to an operator rather than driven blind.
</div>

<!--
Two minutes. The middle column is the one to deliver without flinching.

The depth grid is kept on a cost argument — one configuration entry, 64 numbers
in a vector that was padded anyway — and not on a demonstrated gain. The
experiment that would settle it is two training runs on the same recordings
differing in one flag, and then enough real-world executions to resolve the
difference against the arm's own run-to-run variance. It was the executions,
not the training, that did not fit.

There is no reason to expect that adding sensor values harms the policy, and
that is a weaker claim than "it helps". Say the weaker one.
-->

---

# What I would keep from this

<div class="mt-6">

<div class="takeaway text-base py-3">
<strong>1. A task is a canvas, not a program.</strong>
</div>

<div class="takeaway text-base py-3 mt-4">
<strong>2. Mechanical tolerance beats control accuracy.</strong>
</div>

<div class="takeaway text-base py-3 mt-4">
<strong>3. Edge AI for robotics is viable — but more training is needed.</strong>
</div>

<div class="takeaway warn text-base py-3 mt-4">
<strong>4. You can only imitate what you can demonstrate.</strong>
</div>

</div>

<!--
Four headlines, one line each, and they are yours to finish. Two of them come
from the half of the work that ran on the rover, which is the half a closing
slide should not be shy about.

  1. A TASK IS A CANVAS. The deep-sampling workflow — seventy nodes, five
     phases, three complete runs — was built by another team member who never
     wrote a line of the node package. The maintenance workflow runs on the
     rover. That is the code-free claim being paid, not asserted.
  2. MECHANICAL TOLERANCE. A chamfer and a shaking wrist solved a tool change
     that no controller change would have: nine pickups in ten, and the tenth
     latched on a retry. On real hardware, geometry is cheaper than accuracy.
  3. EDGE AI. The viable half is measured: two models that were cloud workloads
     a few years ago run on two Jetsons, 1357 ms a chunk down to 330, and the
     cycle closes at 30 of the 50 ms — with export, precision and distillation
     doing that work, since the policy as trained misses the deadline by 31 ms.
     The BUT is the behaviour, not the compute: reaching the success rates the
     task needs asks for more demonstrations and more training time than the
     project had. The board was never the obstacle.
  4. DEMONSTRATE. The plug is untrained because it cannot be teleoperated. On a
     real robot the data-collection interface is part of the learning system —
     and the corollary is that rollouts amplify what the policy already does,
     while a missing skill has to come back from the demonstrations.

If you are short of time, say 1 and 4 and stop: the layer that worked, and the
honest bound on the layer that is not finished.

The fifth candidate, if someone asks for one, is about agents: give one a real
oracle or its results will pass while being wrong. That is the TensorRT story,
and it generalises.
-->

---

# Where it goes next

<div class="grid grid-cols-2 gap-12 mt-4 text-sm">
<div>

<div class="kicker mb-2">The policy</div>

- **Rollouts on the arm**, autonomously and with human interventions — the
  half of RECAP the rover never ran
- The ERC runs are themselves a source: recorded as bags, they convert straight
  into training data
- **Real-time chunking** instead of blending overlapping chunks — which
  conflicts with both of the latency optimisations, and that is the interesting
  part
- The **depth ablation**, and an 8×8 encoder instead of a flat vector

</div>
<div>

<div class="kicker mb-2">The workflow layer and the agent</div>

- **Demonstrate and train the plug**, now that a tool for it exists
- More collected trajectories in the weak categories, and a larger base model
- **Semantic tool discovery** for ROS2, a machine-readable system description,
  and topic names that describe what they carry
- A short manual of the rules that are invisible in the editor, before the next
  competition cycle

</div>
</div>

<!--
One minute, and pick two to actually say out loud: rollouts on the arm, and
semantic tool discovery. The rest are on the slide for the record.

Real-time chunking is the one worth a sentence if the expert is an ML person:
instead of blending two chunks after the fact, it treats the start of a new
chunk as an inpainting problem inside the denoising process, so the new chunk is
GENERATED to continue the old one. Both of our optimisations remove the thing it
needs — SnapFlow removes the intermediate states, and the TensorRT export
freezes the graph. A suffix engine that takes the guidance inputs, with the loop
kept in Python, is the version that fits and should be tried first.

The lerobot-ROS2 interface RFC is also live, and this adapter takes part in it.
Mention only if asked about reuse beyond the rover.
-->

---

# Demo

<div class="kicker mt-5 mb-3">p9.fhnw-rover.ch</div>

<div class="grid grid-cols-2 gap-5">

<a class="demo-btn" href="https://p9.fhnw-rover.ch/demos/rover/#workflows" target="_blank">
<span class="demo-btn-title">The workflow gallery</span>
<span class="demo-btn-sub">every canvas on the rover, rendered from JSON — pan, zoom, open a node</span>
</a>

<a class="demo-btn" href="https://p9.fhnw-rover.ch/demos/rover/#drive" target="_blank">
<span class="demo-btn-title">Drive it, and ask it</span>
<span class="demo-btn-sub">a virtual rover over real ROS2 — the drive form, the agent chat, the live view</span>
</a>

<a class="demo-btn" href="https://p9.fhnw-rover.ch/demos/pusht" target="_blank">
<span class="demo-btn-title">SmolVLA + RECAP in your browser</span>
<span class="demo-btn-sub">PushT on WebGPU — drag the agent away and watch it recover, move the guidance weight</span>
</a>

<a class="demo-btn" href="https://p9.fhnw-rover.ch/#libero" target="_blank">
<span class="demo-btn-title">The LIBERO rollouts</span>
<span class="demo-btn-sub">the three comparisons of part 1, side by side — and the datasets, on the Hub</span>
</a>

</div>

<div class="takeaway warn mt-5">
The read-only live view is open to anyone. Send the rover somewhere from your
phone during the questions if you like.
</div>

<!--
Two to three minutes, and it comes after the conclusions so that skipping it
costs nothing. The buttons open in a browser tab — check the site before the
talk.

Offer it rather than work through all four; a live demo in a defence is a way to
lose five minutes. If the room wants one, take the GALLERY first: it renders its
canvases from JSON, needs no running n8n and cannot fail in the room. Show the
maintenance canvas at full size — the thing that is unreadable on a slide — then
the battery watchdog, which is ten nodes, contains no code, and explains itself:
read the power source, read the state of charge, compare, raise an Asana task,
remember that it did. The gallery holds the rover's five canvases alongside the
eleven demo ones.

Then scroll back up the same page to the live rover if the network cooperates.
It serves genuine ROS2 interfaces from a simulator rather than from Barbara, so
it is safe to leave running and safe to hand to the room. The drive form and the
agent chat are the two worth showing; ask the agent what interfaces the robot
has and let it discover them live.

Do NOT trigger an actuating workflow. The arm is not here, the heartbeat is not
present, and a form waiting for a confirmation nobody gives is a bad way to
spend the last minutes.

The PushT demo is the one that makes the policy tangible: it runs the same
policy family entirely client-side, so you can take over mid-episode and watch
it recover, and scrub the guidance weight to see what it does and does not
change. It is also the safest of the four — no server, no network after load.

The LIBERO button lands on the rollouts; the demonstration datasets are on the
Hugging Face Hub under `fhnwrover`, episode by episode in LeRobot's viewer, and
the same page links them. The report as a PDF is on the front page.

The n8n editor itself is at n8n-demo.fhnw-rover.ch if anyone asks to see the
canvases in the tool rather than rendered — but it needs a login, so it is not
on the slide.

The gallery is the offline fallback for everything here.
-->

---
layout: center
class: text-center
---

# Questions?

<div class="mt-10 text-base">
<strong>Sandro Covo</strong> · sandro.covo@fhnw.ch
</div>

<div class="mt-8 flex gap-10 justify-center text-sm">
  <div>
    <div class="kicker mb-1">Demos, rollouts, datasets</div>
    <a href="https://p9.fhnw-rover.ch">p9.fhnw-rover.ch</a>
  </div>
  <div>
    <div class="kicker mb-1">n8n, public</div>
    <a href="https://n8n-demo.fhnw-rover.ch">n8n-demo.fhnw-rover.ch</a>
  </div>
  <div>
    <div class="kicker mb-1">n8n, on the rover</div>
    <a href="http://172.16.10.121:5678">172.16.10.121:5678</a>
  </div>
  <div>
    <div class="kicker mb-1">Source</div>
    <a href="https://gitlab.fhnw.ch/fhnw-rover">gitlab.fhnw.ch/fhnw-rover</a>
  </div>
</div>

<!--
PREPARED ANSWERS

"Is this actually reinforcement learning?"
  No policy gradient, nothing online. Critic-based relabelling plus conditioned
  supervised fine-tuning, chosen because it needs neither reward shaping nor
  online-RL infrastructure — neither of which is practical on an arm.

"Why is the benchmark result not on the rover?"
  Because separating policy quality from hardware variance needs repetitions
  the arm time did not allow, and because a failure on the arm can be the
  camera, the backlash or the policy. LIBERO is public, fixed and repeatable.
  The cost is stated: it is a LIBERO result on the LIBERO robot.

"Where does the success signal come from with no human?"
  From the simulator, on LIBERO. On real hardware that is THE open question,
  and precisely why a critic that judges from images is interesting.

"Why does the rover compete with ACT if SmolVLA is the contribution?"
  Demonstrations and training time, not latency and not the architecture. The
  policy controller selects between them by configuration.

"n = 500, one seed — are the differences significant?"
  Suite-level SE about 2 points. Knowledge insulation (+5 to +11) and
  co-training (+5.2 average) clear it. The fine-grained f-plus differences on
  `long` do not, and the report says so.

"Why not MCP for the agent tools?"
  Considered. An n8n node can be dragged onto a canvas by a human OR called as
  a tool by an agent, from one definition. MCP would have meant a second
  interface to keep in step with the first.

"Is it safe to let an LLM near a robot?"
  It is given no action node and no container control; its credential is
  read-only; the publish node takes a namespace allowlist; both checks run
  before the socket opens and sit on the credential, which neither the workflow
  author nor the agent can change. And every autonomous motion is still under
  the heartbeat and the e-stop.

"93 % versus 92 % — did the local model beat the cloud one?"
  No. 43 prompts, run once each. That says the tool-use gap closed, nothing
  more. The cloud model is still better at discovery, probing efficiency and
  argument schemas.

"Why two half-steps as the distillation target, not the ten-step solve?"
  Appendix slide on it. Five times cheaper per training step — two forward
  passes against ten, on every one of 15k. The target stays just ahead of the
  student, so each round is an easy regression instead of one leap from
  "instantaneous velocity" to "the average over the whole path". And the fixed
  point of the recursion is the exact integral rather than the ten-step
  approximation of it. That last one is theory, though: the student still ends
  two points below its teacher, so optimisation bound before the target did.

"Why is the object suite missing?"
  Every policy including the base scores zero on it. Photometric augmentation
  alone lifts it to 53.6 %, so the policy had overfitted to the appearance of
  the training images. It affects all configurations identically.

"What would you do differently?"
  Build the demonstration interface first. The plug substep, the lever switch
  and the rover-versus-LIBERO gap all trace back to how much data could be
  recorded and how good it was.

BACKUP SLIDES FOLLOW: the SmolVLA architecture and its numbers · the critic ·
engine accuracy · latency table · the f-plus labels · guidance baking ·
the label composition · the n8n node package · agent transcripts.
-->

---
layout: section
---

<div class="kicker mb-4">Backup</div>

# Appendix

---

# What is inside SmolVLA

<img src="/figs/vla_architecture.svg" class="h-[430px] mx-auto mt-2" />

<!--
This diagram is the report's, and it carries the whole of part 1 in one
picture: the prefix on the left, the backbone, the expert on the right, the two
losses at the bottom, the red stop-gradient line between them, and the critic
in panel (b).

Do not explain it all now. Name three things and come back to it:
  - The advantage token sits in the PREFIX, alongside the language. That is
    what makes RECAP a change of input rather than a change of architecture.
  - The red dashed line is knowledge insulation, its own slide in part 1.
  - Panel (b), the critic, is the same network with the backbone truncated and
    a value head instead of an expert. It never leaves the training cluster.

The state token is the honest weak point of the depth contribution and this is
where to concede it, before the results do. The policy CAN learn the layout,
since the cell-to-dimension mapping is fixed, but it spends capacity on
something an 8×8 encoder would have given it for free. That is future work in
the report.
-->

---

# SmolVLA, in numbers

<div class="grid grid-cols-2 gap-12 mt-6">
<div>

<table>
<tbody>
<tr><td>Backbone</td><td>SmolVLM-2, layers 1–16 of 32</td></tr>
<tr><td>Expert</td><td>16 layers, 0.75× width, ≈100 M</td></tr>
<tr><td>Total</td><td><strong>≈450 M parameters</strong></td></tr>
<tr><td>State</td><td>83 values → <strong>one token</strong></td></tr>
</tbody>
</table>

</div>
<div class="pt-2">

<div class="takeaway warn">
The 8×8 depth grid is 64 of those 83 numbers, <strong>flattened</strong>. Two
cells that are neighbours on the sensor land eight apart in the vector, and
nothing in the input says so.
</div>

</div>
</div>

<!--
The numbers behind the previous slide, and the one design limitation worth
admitting before it is asked.

Only the first sixteen of SmolVLM-2's thirty-two layers are kept — the paper's
own finding is that the later layers add little for control and cost latency,
and that halving matters on the Jetson.

The flattening is the honest weakness of the depth contribution. The policy can
still learn the layout, since the mapping from zone to dimension is fixed across
the dataset, but it spends capacity and training samples on something the sensor
geometry would have given for free. A small convolutional encoder over the 8×8
grid is the version that fixes it, and the change is confined to the observation
pipeline.
-->
---

# The critic, and making it honest

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-3">

<img src="/figs/critic_value.png" class="w-full" />

</div>
<div class="col-span-2 pt-1">

Predicts **normalised time remaining**, as a distribution over 201 bins.

<div class="takeaway warn mt-4">
Trained on successful demonstrations only, it scores a <em>failed</em> rollout
almost as highly as a successful one.
</div>

<div class="takeaway mt-4">
Fix: fine-tune on the rollouts with a large constant added to the remaining
time of failed episodes, so their target clamps to the bottom of the support.
</div>

</div>
</div>

<!--
The figure is a real trace over one successful LIBERO rollout, with eight
frames of that same episode above the curve. The value climbs from −0.72 to
−0.14 as the arm reaches, grasps and transports the bowl, and the positive
labels fall exactly in that stretch. After frame 40 it steps up once and
flattens — the task is decided, little progress per step remains, and the whole
tail is negative even though the episode runs on for another 39 frames.

That is the point of a per-frame critic over an outcome label: within ONE
successful episode it separates the part that made progress from the part that
did not.

The honesty problem is a distribution-shift bug, not a robotics bug: train on
successes, evaluate on failures, get overconfident predictions. The same
failure mode as any classifier that never saw the negative class. It is not in
the paper we were reimplementing, and it cost a training round to find.

Second one, if asked, and it is a good story: a critic trained without state
dropout learned to read the GRIPPER channel instead of the scene. The two
largest jumps in its value curve sat within a fifth of a frame of the two
gripper transitions. Zeroing the state for 20 % of samples removes the
shortcut. A critic that judges from IMAGES is the only kind that could ever
supply a success signal on real hardware, where there is no simulator to ask.
-->

---

# Engine accuracy on trained weights

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| policy | engine | mean abs | spread | ok |
|---|---|---:|---:|---|
| RECAP 10-step | FP16 | 0.826<span class="pad">00</span> | 17 % | no |
| RECAP 10-step | TF32/FP16 | 0.0014<span class="pad">0</span> | 100 % | **yes** |
| RECAP SnapFlow | FP16 | 0.897<span class="pad">00</span> | 62 % | no |
| RECAP SnapFlow | TF32/FP32 | 0.00017 | 100 % | **yes** |
| SmolVLA | FP16 | 0.549<span class="pad">00</span> | 67 % | no |
| ACT | FP16 | 0.00059 | 100 % | no |
| ACT | TF32 | 0.00014 | 100 % | **yes** |

</div>
<div class="pt-2">

<p class="note">
50 samples across the dataset, per-sample seeded noise, against the eager
reference. “Spread” is the standard deviation of the engine's actions as a
percentage of the reference's — an engine that has stopped tracking the policy
<em>flattens</em> rather than simply erring.
</p>

<div class="takeaway warn mt-5">
ACT fails FP16 narrowly and for a reason: the error sits almost entirely in the
sixth joint — the axis that rotates the switches, so it travels furthest.
</div>

</div>
</div>

<!--
The spread column is the diagnostic that matters. A mean error can always be
argued about; an engine whose actions retain 17 % of the reference's standard
deviation has collapsed toward a constant, and no threshold discussion saves it.

TF32 and FP16 carry the same ten mantissa bits and are an order of magnitude
apart here. That is the whole argument that the fault is range, not precision.
-->

---

# Latency, every backend

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| backend | ten-step | SnapFlow |
|---|---:|---:|
| eager FP32 | 1357 | 837 |
| eager FP16 autocast | 976 | 324 |
| TensorRT FP32 | 858 | 683 |
| TensorRT FP32 / FP16 | 778 | 674 |
| TensorRT TF32 / FP16 | **434** | 324 |
| TensorRT TF32 / FP32 | — | **330** |
| *TensorRT FP16, rejected* | *194* | *128* |

<p class="note mt-3">One 50-action chunk on the Jetson Orin, mean of 20 runs,
three camera streams, guidance weight 1.</p>

</div>
<div class="pt-2">

<div class="takeaway">
The prefix is about <strong>95 %</strong> of the chunk at every precision:
≈662 ms at FP32, ≈312 ms at TF32, ≈121 ms at FP16.
</div>

<div class="takeaway warn mt-5">
So SnapFlow removes only 104 ms here, not the factor of 3.6 it is worth on the
eager path. Nine denoising steps are small against a prefix that costs 312 ms.
</div>

<p class="note mt-4">
A usable whole-graph FP16 engine would have sustained about 7.8 Hz of
re-planning against the deployed 3.0.
</p>

</div>
</div>

---

# What the two engines contain

<TrtPipeline scene="engines" :height="330" />

<p class="note mt-4">
An engine holds <strong>one</strong> forward pass with fixed shapes, so the
policy is two of them, and the loop between them stays in Python.
</p>

<!--
The second panel of the export figure, given its own page so that it exists in
the PDF too — the component prints one scene, and the slide in part 1 prints
the path.

The talk reaches this live with the last click on that slide, or with the "the
two engines" button. Come here only if someone asks what actually got exported.

The detail worth having ready: the advantage token is appended to the language
tokens by the host, which is why the prefix is run a second time with that
token masked when guidance is on, and why the blend of the two velocity fields
happens in Python rather than inside an engine.
-->

---

# SnapFlow: what training does to the gap

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2 pt-1">

<div class="kicker mb-3">Three rounds, measured on this example</div>

| round | closes a gap of | lands, from A |
|---|---:|---:|
| 1 | 1.09 | 0.34 |
| 2 | 0.20 | 0.14 |
| 3 | 0.11 | **0.02** |

<div class="takeaway warn mt-5 text-sm">
Consistency is re-established every round — and what is left of it halves.
</div>

</div>
<div class="col-span-3 flex justify-center pt-1">

<SnapFlow :width="498" :height="300" scene="rounds" />

</div>
</div>

<!--
This is the second scene of the figure on the SnapFlow slide, given its own
page so that it exists in the PDF too — a canvas can only print one scene, and
that slide prints the shortcut construction.

Reach it live from the SnapFlow slide with the "training rounds" button rather
than by jumping here, unless someone asks in the questions.

What the slide no longer says, and you do: each round the student's SINGLE JUMP
is trained onto the teacher's two half-steps; the teacher is then recomputed on
the improved model and is ahead again, by half as much. The jump stays one
straight segment throughout — one forward pass is the whole point — and only
where it lands improves. The target is not receding faster than the student
closes on it, and that is measured here rather than asserted.

The two columns are the two halves of the claim the recipe rests on. The gap
it closes is the consistency residual, driven to zero every round; where it
lands is the accuracy, and that improves because the chord it is chasing does.

The honest footnote, if anyone presses on the fixed point: a fourth round would
put the student slightly PAST A. That is correct rather than a bug — the fixed
point of the recursion is the exact integral, and the ten-step sampler is
itself an approximation of it, about 0.10 away in this example. Three rounds is
where the student reaches the thing we actually deploy, so that is where the
figure stops.
-->

---

# Why not distil onto the ten-step solve?

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2">

<div class="kicker mb-2">The target, in full</div>

```python
v1     = teacher(x, τ=0)          # no_grad
x_half = x + 0.5 * v1
v_half = teacher(x_half, τ=0.5)   # no_grad
target = 0.5 * (v1 + v_half)
```

<p class="note mt-2">
Two evaluations of the action expert. The ten-step solve would be ten — on
every one of 15k training steps.
</p>

</div>
<div class="col-span-3 pt-1">

<div class="takeaway">
<strong>1. Cheaper.</strong> Two forward passes against ten, on every step, for
a target that is thrown away immediately.
</div>

<div class="takeaway warn mt-4">
<strong>2. A curriculum, not a leap.</strong> The target sits just ahead of the
student — it closes 1.09, then 0.20, then 0.11 — instead of asking one
regression to cross the whole gap at once.
</div>

<div class="takeaway mt-4">
<strong>3. A higher ceiling, in principle.</strong> The fixed point of the
recursion is the <em>exact</em> integral; ten steps is itself 0.10 short of it
here. In practice the student still lands 2 points below its teacher, so what
binds is optimisation rather than the target.
</div>

</div>
</div>

<!--
This is the obvious "why not just do the simple thing" objection, and it is a
fair one — put it in the appendix rather than the talk, and come here if it is
asked.

Reason 2 is the one I would lead with, because the figure on the previous slide
already showed it: the distance the student has to cover in one round is small
and shrinking, and every one of those regressions is easy. A frozen ten-step
target asks the network to go from "predict the instantaneous velocity" to
"predict the average velocity over the whole path" in a single fit.

Reason 3 needs the caveat said out loud or it oversells. The recursion's fixed
point being the exact integral is a property of the scheme, not something
measured here — and the measured result goes the other way, since the distilled
student loses about two points of average success to its ten-step teacher. The
honest reading is that the target was never the binding constraint.

If someone asks whether a frozen teacher was ever used: yes, but for a
different purpose — guidance baking, where self-distillation collapses and a
frozen copy supplies both loss terms. That is the `frozen teacher` row of the
guidance-baking table, and it is the one place a second copy of the checkpoint
is held in memory.

ONE SENTENCE IN THE REPORT READS TWO WAYS, and this is the slide where it comes
up. Chapter 4, the SnapFlow distillation paragraph:

    "…a distillation term that matches the single-step jump to the teacher's
     full integration."

That is defensible: the teacher IS the two-half-step branch, so "its full
integration" means the whole traversal it makes from noise to action — the two
half-steps, which is what runs. But the same paragraph opens with "the student
is distilled from the ten-step teacher", so by the time the phrase arrives the
word has already been used for the checkpoint being distilled FROM. Read that
way, "the teacher's full integration" sounds like the ten-step solve, which is
not the target.

So it is a clarity problem, not an error. Chapter 3 spells the mechanism out
correctly and at length, and the code matches chapter 3.

If it is raised, do not over-concede. Say what the target actually is — two
evaluations under `no_grad`, averaged, the four lines on the left — note that
the sentence carries both readings because "teacher" does double duty in that
paragraph, and move to the reasons on this slide, which are the interesting
half of the answer.

For the next revision of the report, the cheap fix is to stop the noun doing
two jobs: "…a distillation term that matches the single-step jump to the same
weights' own two half-steps."
-->

---

# f⁺ decides what “negative” means

<div class="grid grid-cols-2 gap-8 mt-3">
<div>

<img src="/figs/fig_labels.png" class="w-full" />

<div class="takeaway warn mt-3 text-sm">
At f⁺ = 0.3, <strong>31 % of all frames</strong> are negative labels sitting on
<em>successful</em> episodes — the approach and transport motions the task
needs.
</div>

</div>
<div>

<img src="/figs/fig_dose_slide.png" class="w-full" />

<div class="takeaway mt-3 text-sm">
And then guidance makes it <strong>worse</strong>, monotonically in <em>w</em>:
it extrapolates <em>away</em> from behaviour the task requires.
</div>

</div>
</div>

<!--
The two halves are cause and effect, and this is the finding that goes beyond
the recipe we started from.

Left: what the threshold does to the DATA, before any policy is trained. The
red block is the damage — frames inside successful episodes that get labelled
negative.

Right: what that does to the POLICY. At f-plus 0.3 the entire guidance sweep
sits below the base. At 0.4 the unguided policy still edges past it, but
guidance erodes it steadily down to 65.4 at w = 2. At 0.8 both the unguided
policy and moderate guidance improve on the base. That is the setting used
throughout.

The failure being MONOTONE in w is what tells you the guidance DIRECTION is
broken rather than the result being noisy.

The diagnostic that confirms it, if asked: force the negative token at
inference. At f-plus 0.3 the negative token scores HIGHER than the positive one
on two suites — 66.4 against 66.0, 76.4 against 73.6. With seven of every ten
successful frames labelled negative, the token never carried a good-versus-bad
distinction at all, so guidance had nothing to amplify.

Practical rule out of this: set the threshold permissively. The other error —
positive labels on failed episodes — is much cheaper.
-->

---

# Guidance baking

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| variant | spatial | goal | long | avg |
|---|---:|---:|---:|---:|
| plain student | 74.2 | **84.2** | **40.0** | **66.1** |
| baked, self-distilled | 67.0 | 72.4 | 32.6 | 57.3 |
| baked, frozen teacher | **76.8** | 75.2 | 25.2 | 59.1 |
| teacher, ten steps | 80.0 | 86.2 | 38.2 | 68.1 |

</div>
<div class="pt-2">

Distil the **blended** field at *w* = 1.5, so one unguided pass reproduces
guided behaviour and the second prefix run disappears.

<div class="takeaway warn mt-5">
Self-distilled it <strong>collapses</strong>: the flow-matching term pulls the
student back toward the unguided field, and the blend's unconditional branch is
trained by no loss at all.
</div>

<div class="takeaway mt-4">
A frozen teacher fixes the mechanism where guidance helps most — 76.8 on
<code>spatial</code>, in one pass — and overshoots badly on <code>long</code>.
</div>

</div>
</div>

---

# Label composition of the rollout data

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| scheme | pos % | neg % | pos:fail | neg:succ |
|---|---:|---:|---:|---:|
| f⁺ = 0.3 | 15.0 | 85.0 | 1.7 | **30.9** |
| f⁺ = 0.4 | 20.7 | 79.3 | 3.0 | **26.5** |
| f⁺ = 0.8 | 51.5 | 48.5 | 16.2 | 8.9 |

<p class="note mt-3">
All 107,410 rollout frames over 600 episodes and 30 tasks, failures included.
Collected by the base policy at 64.3 % success.
</p>

</div>
<div>

<img src="/figs/fig_labels.png" class="w-full" />

</div>
</div>

<!--
The two cross-terms are the two ways the labelling can be wrong, and they trade
off. A permissive threshold buys a large reduction in neg:succ for a smaller
increase in pos:fail, which is why f-plus = 0.8 wins.
-->

---

# The node package

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2">

<img src="/img/n8n_nodes_palette.png" class="h-[300px] mx-auto border border-[#deded9]" />

</div>
<div class="col-span-3 pt-1">

<div class="kicker mb-2">Payloads without knowing the message layout</div>

n8n's resource mapper renders a message as a form, one input per field,
generated from the **live type definition** — nested and custom types included.

<div class="takeaway mt-4">
Entered values are strings, so they are coerced back to their declared types,
and a payload that cannot be converted is refused <em>before</em> it is sent.
</div>

<div class="takeaway warn mt-4">
Nodes used as agent tools <strong>soft-fail</strong>: they return a structured
error as a tool result, so the agent sees the failure and reacts instead of the
workflow crashing.
</div>

</div>
</div>

---

# System tests of the node package

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

Resource leaks and lost messages under load cannot be caught by mocked tests,
so the harness runs the **real nodes against a live rosbridge stack** in a
container.

| test | result |
|---|---|
| repeated image capture | ≈120 ms each, memory flat |
| 100-message burst | 1.8 s, completes |
| 200 subscribe/unsubscribe | topics return 207 → 7 |

</div>
<div class="pt-2">

<div class="takeaway">
The memory result is the one the pooled connection exists to produce: five
executions end slightly <em>below</em> the 785 MiB baseline.
</div>

<div class="takeaway warn mt-5">
What it does <strong>not</strong> measure: how many of the 100 burst messages
arrived. The evidence for that loss stays operational.
</div>

<p class="note mt-4">
Run once, on a workstation rather than on the Jetson.
</p>

</div>
</div>

---

# The deployment

<img src="/figs/recap_pipeline.svg" class="h-[430px] mx-auto mt-1" />

<!--
The full RECAP pipeline as implemented: blue trains the policy, orange trains
or applies the critic, green is distillation, grey the two datasets. Each stage
is one script, run by hand, passing files to the next — which is what lets a
stage be re-run or replaced without touching the others.

The red dashed arrow is the self-improvement loop. One pass around it was run,
on LIBERO. The rover chain never ran the rollout stage at all.

Training: about 18 hours on two H200s for pre-training, 90 minutes on one for a
fine-tuning run, 15k steps for a distillation.
-->

---

# The C++ rewrite, stage by stage

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| stage | Python | C++ | factor |
|---|---:|---:|---:|
| guards | 5.3 | 0.2 | 32.1 |
| transform lookup | 35.7 | 1.2 | 30.9 |
| pose error | 132.5 | 6.3 | 21.2 |
| debug publish | 223.6 | 19.5 | 11.5 |
| feedback publish | 16.9 | 3.5 | 4.8 |
| velocity | 100.2 | 11.9 | 8.4 |
| target publish | 449.8 | 16.3 | 27.6 |
| **whole cycle** | **964.2** | **58.8** | **16.4** |

<p class="note mt-3">Microseconds, means over the same recorded input. A release
build reaches 17.6 µs — a factor of 54.9.</p>

</div>
<div class="pt-2">

<div class="takeaway">
For a loop with a deadline, read the <strong>tail</strong>: the 99th percentile
goes from 1.3 ms to 99.3 µs, and the worst cycle from 3.7 ms to 158.5 µs.
</div>

<div class="takeaway warn mt-5">
One node in isolation, on a workstation, <strong>not</strong> on the Jetson.
The ratios are the claim; the absolute figures are not what the rover runs at.
</div>

<p class="note mt-4">
The argument is contention rather than the mean. Both Jetsons already run at
elevated load — sensors, camera streaming, inter-node traffic — and a policy
shares the machine. The Python node alone would have been fast enough.
</p>

</div>
</div>

<!--
Two structural wins beyond the language, worth naming if the question is "is
this just C++ being faster":

  - The ArUco detection was two node instances each decoding the SAME camera
    frame. Merged into one that decodes and converts to greyscale once and
    shares the result, so only the dictionary-specific detection still runs
    twice.
  - JPEG decode moved to the GPU — NVJPEG on the Jetson through torchvision's
    decode_jpeg on CUDA — with a CPU fallback.

And the frame gate, if there is time: inference only runs once the queue drains,
so most ticks decode three camera streams and throw the result away. Gating on
that condition converts 24 frames instead of 600 and hands back 0.84 of a core.
It is currently disabled while a progress tracker is loaded, because the tracker
consumes a frame every tick.
-->

---

# Precision: why not FP16, and what is left

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| format | exp | mant | largest | where it applies |
|---|---:|---:|---|---|
| FP32 | 8 | 23 | 3.4·10<sup>38</sup> | the reference |
| TF32 | 8 | 10 | 3.4·10<sup>38</sup> | multiply inputs only |
| BF16 | 8 | 7 | 3.4·10<sup>38</sup> | storage and compute |
| FP16 | 5 | 10 | 65 504 | storage and compute |
| INT8 | — | — | *scaled* | storage and compute |

<div class="takeaway mt-4">
TF32 and FP16 carry the <strong>same ten mantissa bits</strong> and land an
order of magnitude apart. So the fault is range, not precision.
</div>

</div>
<div class="pt-2">

<div class="takeaway warn">
<strong>BF16 was never built as an engine.</strong> TF32 working is the evidence
that the prefix needs range — and BF16 keeps that range while also halving
memory traffic, which TF32 does not.
</div>

<div class="kicker mb-2 mt-5">Why INT8 could succeed where FP16 fails</div>

It is a **scaled** format: the window is placed by calibration instead of fixed
by the standard. SmoothQuant migrates the outliers from activations into
weights by a per-channel scaling that folds into the preceding layer offline,
at no inference cost.

<div class="takeaway warn mt-4">
But the ceiling is ≈140 ms a chunk and about 7.8 Hz of re-planning, against a
deployment that asks for <strong>2</strong>.
</div>

</div>
</div>

<!--
Only come here if someone asks "why not quantise, the way LLMs are run on small
hardware". It is a good question and the honest answer is that TF32 was the
cheap fix and I did not climb the ladder above it.

The ladder, cheapest first:
  1. BF16 — no calibration set, no graph rewrite. Untried. Orin is Ampere, so
     BF16 tensor cores run at FP16 throughput.
  2. Selective precision — the FP16 conversion already accepts an op and node
     block list; only the default one is passed, and it exists for parser
     reasons rather than accuracy.
  3. SmoothQuant — exact rescaling, folds into the weights, would rescue plain
     FP16 as well as INT8. The calibration set already exists: the fifty
     acceptance-check samples.
  4. Mixed-precision decomposition, the cited LLM.int8() paper itself. Needs a
     decomposed matmul kernel TensorRT does not provide, so a plugin.

Rule out FP8 before it is suggested: Orin is SM_87, Ampere, and has no FP8
tensor cores — that is Ada and Hopper. E5M2 carries the same five exponent bits
as FP16 anyway, so the format would not have fixed range on its own.

The cost, not just the benefit: the gate is a mean absolute error below 2e-2 and
the deployed FP16 suffix sits at 2.7e-3. INT8 error runs an order of magnitude
above that, so going there means re-deriving the acceptance criterion on task
success rather than on numerical agreement.
-->

---

# What the arm actually does

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| dataset | episodes | frames |
|---|---:|---:|
| `black_switch` | 83 | 26 634 |
| `red_switch` | 24 | 9 730 |
| `fi_switch` | 11 | 3 300 |
| `erc_various` &nbsp;<span class="dim">(four instructions)</span> | 120 | 40 432 |

<p class="note mt-3">All at 20 Hz, three camera streams and an 83-dimensional
state per frame. Published under <code>fhnwrover</code>.</p>

<div class="takeaway warn mt-4">
Under the right conditions the policy does the tasks it was trained for, in the
region it was trained in — <strong>but not reliably</strong>.
</div>

<div class="takeaway mt-4">
The approach phase is the reliable half, by construction and by measurement.
What remains is the manipulation.
</div>

</div>
<div class="pt-2">

<div class="kicker mb-2">Per substep, honestly</div>

**Rotary switches** — turned, but often not on the first attempt. The substep
with the most demonstrations behind it, because it is the easiest to
teleoperate.

**Lever switches** — harder. A quick motion under tensile load, which is
exactly where a flow-matching policy struggles, and the fewest and least smooth
demonstrations.

**The plug** — never trained. It could not be teleoperated well enough to
demonstrate, so no data existed.

</div>
</div>

<!--
This is the backup for "what did this thesis actually deliver on the robot".
Do not soften it and do not lead with the LIBERO number.

Delivered and measured on the arm: the approach phase inside 25 mm; the policy
running inside the control budget with 20 ms of 50 free; the pipeline end to
end from teleoperated recording through annotation, critic training,
advantage-conditioned fine-tuning, distillation and TensorRT export to a policy
driving the manipulator; the workflow layer; the on-device agent; and all three
software stopping layers exercised on the running rover.

Not delivered: a rover-side RL gain, the depth ablation, reliable manipulation.

The bound is demonstrations and arm time, not the architecture. Latency was
never the reason ACT competes — SmolVLA meets the budget with margin.

The plug tool now exists and rotates the plug 90 degrees as the jaws close, so
the substep looks learnable once demonstrations can be recorded through it.
That has not been tried.
-->

---

# The workflow layer, measured

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| | measured |
|---|---|
| Sampling workflow, end to end | 111 – 148 s |
| …node steps per run | 111 – 131 over 41 – 43 nodes |
| …fixed settling waits | 33 – 40 s |
| Service call, median / p90 | 563 ms / 1.1 s |
| State topic read, median | 495 ms |
| n8n overhead alone | ≈120 ms |
| Tool pickup | 9 of 10, ≈30 s |
| Tool park | 10 of 10, ≈20 s |

<p class="note mt-3">Three complete sampling runs from the execution log, all
finishing without a node error.</p>

</div>
<div class="pt-2">

<div class="takeaway">
The 563 ms is the <strong>drill controller's own 2 Hz cycle</strong>, not n8n.
n8n's overhead is an order of magnitude smaller.
</div>

<div class="takeaway warn mt-5">
Either figure is far above a 50 ms control period. A workflow cannot close a
control loop — everything at rate stays in ROS2.
</div>

<p class="note mt-4">
The one failed pickup did not latch, and the same procedure succeeded on a
retry from an unchanged state. That is the property a chain of taught positions
has, and it is why the exchange runs with no camera and no IK in the loop.
</p>

</div>
</div>

<!--
The repetition in the node-step count is polling: waiting for a hardware phase
to end is a topic read followed by a condition, repeated until the drill's state
machine reports the expected value. That is 43 to 52 topic reads per run.

The setpoint story, if asked why services and not topics: an earlier version
published to the topic and messages were occasionally lost, so the drill kept
its previous value while the workflow continued as if the command had landed.
The controller exposes each value as both, and the service returns a response,
so the workflow only advances once the value was accepted.

And the fact worth leading with on "could anyone else run this": the sampling
workflow was built by another team member, who did not write the node package.
-->

---

# What the stopping layers do not cover

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| | the gap |
|---|---|
| `move_to_joint_positions` | a **blocking** service call — the one motion the software e-stop cannot interrupt |
| Two workflows at once | nothing in n8n interlocks them; held by procedure today |
| Branch order | depth-first, upper branch first — canvas position is part of the program |

<div class="takeaway mt-5">
The joint move is not <em>autonomous</em> in the sense the report defines: every
pose is fixed in advance and a human releases it. But the whole tool change runs
on it, and only the hardware stop covers it.
</div>

</div>
<div class="pt-2">

<div class="takeaway warn">
The remedy for concurrency is a <strong>lock in a data table</strong>, taken by
the few workflows that actuate — not n8n's global one-execution cap, which
would serialise the monitoring workflows too.
</div>

<div class="takeaway warn mt-5">
Safety-relevant sequencing encoded in canvas geometry is a latent defect, not a
feature. It is documented, which is why the rule is written down — the
long-term answer is explicit edges or a ROS2 node.
</div>

<p class="note mt-4">
Verification is functional, on the running rover, plus unit tests on the latch
semantics and goal rejection. Not an instrumented stop-time measurement: the
requirement states a bound and the observed behaviour is inside it.
</p>

</div>
</div>

<!--
The companion to the four stopping layers, which are now only a bullet on the
contributions slide and a paragraph in its notes. Those are what the layers do;
this one is what they do not, and volunteering it is worth more than
being caught by it.

The maintenance workflow DEPENDS on the branch-order behaviour: the nodes that
return the beacon and the SpaceMouse to autonomous mode sit above the branch
that starts the next substep, because below it the next substep would begin
while the arm was still under manual control. Moving a node for tidiness
changes behaviour.

If pressed on the concurrency gap: analytical workflows can overlap safely.
Drilling, driving and operating the panel each assume they have the rover to
themselves, and the competition setup does not reach the limit because the rover
performs one task at a time by procedure. An interlock is needed before
actuating workflows are ever triggered automatically.
-->
