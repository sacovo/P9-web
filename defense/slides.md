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

<div class="mt-8 text-sm flex gap-10">
  <div>
    <div class="kicker mb-1">Companion site &amp; demos</div>
    <a href="https://p9.fhnw-rover.ch">p9.fhnw-rover.ch</a>
  </div>
  <div>
    <div class="kicker mb-1">Report</div>
    <a href="https://p9.fhnw-rover.ch/p9-mars-rover-autonomy.pdf">the PDF you were sent</a>
  </div>
</div>

<img src="/img/fhnw-logo.png" class="absolute right-12 bottom-10 w-48" />

<!--
45 minutes for the talk, 15–20 for questions. The deck is paced for 41 and the
live demo at the end is the other three, so the ceiling is met with the demo
and comfortably beaten without it. The clock check on each of the five dividers
says where you should be and what to drop first.

Two things to establish in the first four minutes, because everything else
hangs off them: the maintenance panel is a REAL fixed task with a rulebook,
and this thesis is two systems, not one — a policy that moves the arm, and a
workflow layer that decides when to move it.

Assume the advisor has read the report and the expert has skimmed it. Assume
nobody in the room has read chapter 4.
-->

---

# The task

<div class="grid grid-cols-2 gap-10 mt-2">
<div class="flex items-center">

<img src="/img/maintenance_panel.jpg" class="w-full border border-[#deded9]" />

</div>
<div class="pt-2">

<div class="kicker mb-2">European Rover Challenge · maintenance task</div>

In a **prescribed order**, on a panel whose exact layout is published only on
the day:

- set a main switch
- flip four lever switches
- turn three of five rotary switches
- insert a plug into an IEC C14 socket
- turn two rotary power switches
- place a plate on an electromagnet

<div class="takeaway warn mt-5">
Operated over Wi-Fi with no line of sight. Autonomy earns bonus points — and
takes the link delay out of the control loop.
</div>

</div>
</div>

<!--
This is our own replica, on a bench at the FHNW. The competition panel is
built to the same rules but the dimensions and placement are not published in
advance, which is why nothing in the stack may hard-code a position.

Two properties of this panel decide the whole architecture, and they are worth
saying out loud while the audience looks at the photo:

  1. The elements REPEAT and sit close together. Five rotary switches that look
     identical. So "turn the third switch from the left" is a sentence a
     language model cannot resolve reliably, and something deterministic has to
     place the gripper at the right one.
  2. The order is graded. Photographs before and after, switches in sequence.
     Under competition pressure operators forget steps — that is the failure
     mode the workflow layer exists to remove.

The ArUco markers taped to the board are ours, not the organisers'.
-->

---

# The robot

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-2 flex items-center">

<img src="/img/manibar.jpg" class="w-full border border-[#deded9]" />

</div>
<div class="col-span-3 pt-2">

<div class="kicker mb-2">“Barbara”, ERC 2026</div>

| | |
|---|---|
| Manipulator | 6 DoF, Bowden-driven wrist, tool changer |
| Cameras | two on the tool changer, one on the chassis |
| Depth | 8×8 time-of-flight grid **inside the gripper** |
| Compute | 2 × Jetson Orin NX 16 GB, shared with everything else |
| Control rate | **20 Hz** — a 50 ms cycle |

<div class="takeaway mt-5">
Every number in this talk is bounded by that last row: whatever runs, runs
on a 10–25 W board that is also doing navigation, SLAM and three camera
streams.
</div>

</div>
</div>

<!--
Point at the photo, not the table. The tool changer at the top is what makes
the plug substep possible at all; the two cameras sit either side of it; the
ToF sensor is in the palm, between the jaws, and you cannot see it here.

The arm is a custom build by the mechanical team — belts, a differential
wrist, and about a centimetre of compliance under its own weight. That
centimetre comes back twice later: once as the accuracy budget of the approach
phase, once as the reason a taught position beats a computed one.

The Jetson is the constraint that generates most of chapter 4. Sixteen
gigabytes of UNIFIED memory, shared with the cameras, the navigation stack and
the OS.
-->

---

# Where this starts

<div class="grid grid-cols-2 gap-12 mt-3">
<div>

<div class="kicker mb-2">Inherited from P8</div>

- Approach phase: ArUco markers + an extended Kalman filter
- Manipulation: an **ACT** policy, trained per task
- A LeRobot ↔ ROS2 adapter, a recorder, a progress model

<div class="takeaway mt-5">
ACT cannot be conditioned on language. One switch, one model, one dataset,
every time.
</div>

</div>
<div class="pt-2">

<div class="kicker mb-2">What P9 adds</div>

1. One **language-conditioned policy**, post-trained with reinforcement learning
2. A **workflow layer** over ROS2, with an LLM agent on the same tools
3. **Real-time deployment** on the Jetson
4. Depth into the policy's observation
5. Visual servoing, reimplemented and measured

<p class="note mt-4">
Plus the manipulator control and the safety gating all five run on — supporting
work, and the report says so.
</p>

</div>
</div>

<!--
Thirty seconds on the left, a minute on the right.

The honest framing of the left column: P8 worked. It is not that the previous
project failed; it is that "one model per substep" does not scale to a panel
with six kinds of element, and every new element is a new dataset and a new
training run.

On the right, resist the urge to explain any of the five now. The numbering is
the map for the next forty minutes: 1 and 3 are part 2 of the talk, 2 is parts
3 and 4, and 4 and 5 get a slide each on the way past.
-->

---

# Three questions

<div class="grid grid-cols-3 gap-8 mt-6 text-sm">

<div>
<div class="kicker mb-3">RQ1 — automation and RL</div>

How can the maintenance task and further ERC tasks be automated, and how can
reinforcement learning train more capable manipulation policies?

<p class="note mt-3">Answered by the policy and the workflow layer.</p>
</div>

<div>
<div class="kicker mb-3">RQ2 — marker-free depth</div>

How can the gripper be positioned precisely from depth when no fiducial
markers are available?

<p class="note mt-3">Partly answered. I will say where it stops.</p>
</div>

<div>
<div class="kicker mb-3">RQ3 — errors and plan changes</div>

How can errors, unknown states and changes of plan be handled safely during
autonomous operation?

<p class="note mt-3">Answered below the autonomy, and above it.</p>
</div>

</div>

<div class="takeaway mt-8">
The three cut across the contributions rather than mapping one to one, so I
come back to them at the end with what each actually got.
</div>

<!--
Read RQ2's caveat out loud now rather than being caught by it in the Q&A: the
depth grid is integrated and shipped, but the ablation that would show it helps
was not run, and the deployed approach phase still needs three markers on the
board. That is on the last-but-two slide too.

Do not linger. This slide exists so the closing slide has something to close.
-->

---
layout: section
---

<div class="kicker mb-4">Part 1</div>

# How the arm is commanded

<p class="mt-4 text-lg">
Two phases, four ways to stop them
</p>

<!--
Clock check: minute 4 of 44.

This part is three slides and it is scaffolding. It exists so that "the policy
runs" and "the workflow starts a phase" both mean something concrete later.
Do not let it run past minute 8.
-->

---

# A substep is two phases

<img src="/figs/mani_overview.svg" class="h-[300px] mx-auto" />

<div class="grid grid-cols-3 gap-8 mt-4 text-sm">
<div class="takeaway">
<strong>Approach</strong> — classical. Cartesian pose targets, driven by markers
and kinematics. <code>align_to_target</code>.
</div>
<div class="takeaway">
<strong>Manipulation</strong> — learned. Joint commands straight from the
policy, no IK in the loop. <code>run_policy</code>.
</div>
<div class="takeaway warn">
Both are ROS2 <strong>actions</strong> with a terminal result, which is what
lets the layer above branch on how a phase ended.
</div>
</div>

<!--
Walk the diagram once: blue is the operator's manual path from the SpaceMouse,
orange is the two autonomous paths and the orchestration that starts them, grey
is sensors and hardware.

Three things to say, then move on.

  1. The approach phase commands a CARTESIAN pose, because its goal is defined
     on the panel and has to go through inverse kinematics. The policy commands
     JOINTS directly, because that is the shape of the recorded demonstrations
     and it keeps the IK solver out of the learning loop. The price is that the
     policy is tied to this particular arm.

  2. Only one ros2_control controller may be active at a time, so the hand-off
     between the phases is an acquire/release inside the actions themselves,
     not an external sequencer. A node that has not claimed its controller
     cannot move the arm at all.

  3. The dashed box has one role per side: observations from the left, goals
     from the top, safety from the bottom, commands out to the right. The
     fourth path into the top is n8n, which is part 3.
-->

---

# The approach phase, in one slide

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-3">

<img src="/figs/pnp_ambiguity.png" class="w-full" />

</div>
<div class="col-span-2 pt-2">

Markers on the panel fix the board; the arm's own kinematics carries the
gripper. **No marker has to be visible at the working pose.**

| | |
|---|---|
| Requirement | ±25 mm in the panel plane |
| Stored registration | **18.1 mm** median, 83 % of targets |
| Own recording | 14.9 mm, 12 / 12 |

<div class="takeaway warn mt-4">
The bug that cost the most: a single square marker admits <strong>two</strong>
poses that reproject equally well. Pool two markers into one fit and the second
solution disappears.
</div>

</div>
</div>

<!--
The figure is one real frame from the base camera. Panel (a): marker 88 solved
on its own gives two tool frames 129 degrees apart, reprojecting at 0.68 and
0.70 pixels — the reprojection error genuinely cannot choose, and the one
OpenCV reports as better is 65 mm from the truth. Panel (b) is both markers
pooled into a single solvePnP over eight points.

Why 25 mm: from that close, the switch to be turned is unambiguous in the
gripper cameras, so the policy manipulates ONE switch rather than choosing
among five neighbours.

The architectural point, if there is time for one: we deliberately do not track
the gripper by vision during the task. A base camera loses the gripper markers
at exactly the poses where precision matters. So the camera-to-base transform
is solved once from a dedicated wiggle recording and stored, and forward
kinematics carries the tool from there. That works because the kinematic chain
was fitted and is true to about a centimetre — the vision estimate is the part
that degrades with reach, not the arm.

Also reimplemented in C++: the whole control cycle went from 964 to 59
microseconds, and the tail from 3.7 ms to 159 microseconds. That matters on a
Jetson that is already busy, not because Python was too slow in isolation.
-->

---

# Four ways to stop

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-3">

<img src="/figs/safety_layers.png" class="w-full" />

</div>
<div class="col-span-2 pt-1">

<div class="takeaway">
<strong>Heartbeat.</strong> Autonomy actuates only while the operator station
publishes. Silence for 0.5 s and the arm holds — a lost link stops motion with
nobody acting.
</div>

<div class="takeaway warn mt-4">
<strong>Latching e-stop.</strong> Aborts the running goal and <em>refuses new
ones</em> until it is reset. That is what makes it a stop and not a pause.
</div>

<p class="note mt-4">
Above both: any phase action can be cancelled. Below both: the hardware stop,
which cuts power to the whole rover.
</p>

</div>
</div>

<!--
The layers differ in what they leave running and how they resume, which is the
whole content of the figure. The upper three all hold the arm in position under
its controllers; only the hardware stop drops holding torque and needs a
reboot and a homing run.

The design decision worth defending: the heartbeat is an ABSENCE-detector, not
a command. A crashed operator interface, a dead Wi-Fi link and an operator who
walked away all produce the same safe outcome, and none of them require anyone
to press anything. That is the sub-second requirement from the ERC rules.

Deliberately NOT gated: a move to a joint configuration taught beforehand. It
is fully determined before it starts and is released by a human through a form,
so it is not autonomous in the sense the safety section defines. Say this
before someone catches it — the tool change in part 3 runs entirely on such
moves.

All three software layers were exercised on the running rover.
-->

---
layout: section
---

<div class="kicker mb-4">Part 2</div>

# The policy

<p class="mt-4 text-lg">
One model, an instruction, and its own experience
</p>

<!--
Clock check: minute 8 of 44. If you are past 10, cut the FAST half of the
knowledge-insulation slide and the guidance-baking notes.

This part is fifteen slides and it is the technical core. Budget 16 minutes.
The order is: what the model is (3 slides), why imitation is not enough (1),
RECAP (4), making it fast (3), what came out (4).
-->

---

# One model instead of one per task

<div class="grid grid-cols-2 gap-12 mt-3">
<div>

<div class="kicker mb-2">In</div>

- three camera images
- the arm's joint state, and the ToF grid
- *“rotate the black switch to the right”*

<div class="kicker mb-2 mt-5">Out</div>

- not text: a **chunk of 50 actions**, 2.5 s of motion

<div class="takeaway mt-5">
A VLM reads the scene; a separate <strong>flow-matching expert</strong>
generates the motion. Re-tasking is a change of sentence, not a change of
weights.
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
-->

---

# What is inside SmolVLA

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-3">

<img src="/figs/vla_architecture.svg" class="h-[330px]" />

</div>
<div class="col-span-2 pt-2">

| | |
|---|---|
| Backbone | SmolVLM-2, layers 1–16 of 32 |
| Expert | 16 layers, 0.75× width, ≈100 M |
| Total | **≈450 M parameters** |
| State | 83 values → **one token** |

<div class="takeaway warn mt-4">
The 8×8 depth grid is 64 of those 83 numbers, flattened. Two cells that are
neighbours on the sensor land 8 apart in a vector, and nothing in the input
says so.
</div>

</div>
</div>

<!--
This diagram is the report's, and it carries the whole of part 2 in one
picture: the prefix on the left, the backbone, the expert on the right, the two
losses at the bottom, the red stop-gradient line between them, and the critic
in panel (b).

Do not explain it all now. Name three things and come back to it:
  - The advantage token sits in the PREFIX, alongside the language. That is
    what makes RECAP a change of input rather than a change of architecture.
  - The red dashed line is knowledge insulation, four slides away.
  - Panel (b), the critic, is the same network with the backbone truncated and
    a value head instead of an expert. It never leaves the training cluster.

The state token is the honest weak point of the depth contribution and this is
where to concede it, before the results do. The policy CAN learn the layout,
since the cell-to-dimension mapping is fixed, but it spends capacity on
something an 8×8 encoder would have given it for free. That is future work in
the report.
-->

---

# Flow matching: cheap to train, expensive to run

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-2">

<img src="/figs/fig_fm_train.png" class="w-full" />

$$\mathcal{L} = \mathbb{E}_{\tau,\epsilon}\bigl\lVert\, v_\theta(A^\tau, o_t) - (A - \epsilon)\,\bigr\rVert^2$$

<p class="note">A plain regression onto the velocity of the straight line from
noise to a demonstrated chunk. No solver, no sampling.</p>

<div class="takeaway warn mt-2 text-sm">
At inference it has to be <strong>integrated</strong> instead: ten Euler steps,
ten forward passes of the expert, for one decision.
</div>

</div>
<div class="col-span-3 flex justify-center pt-1">

<FlowMatching :width="498" :height="300" />

</div>
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

# Imitation has a ceiling

<div class="grid grid-cols-2 gap-12 mt-4">
<div class="pt-2">

1. A human **teleoperates** the arm, N times
2. Record (observation, action) pairs
3. Supervised learning on those pairs

<p class="note mt-4">
Every frame is something a human did on the way to succeeding. There is no
failure in the dataset, and no reward.
</p>

</div>
<div>

<div class="takeaway warn">
By construction the policy cannot get <strong>better</strong> than its
demonstrations. Only closer to them.
</div>

<div class="takeaway mt-5">
And the economics run the wrong way: a demonstration costs <strong>human</strong>
time, one episode at a time. A rollout costs GPU time and the robot collects it
unattended.
</div>

</div>
</div>

<!--
This slide motivates everything that follows, so do not rush it.

Be precise about why there is no signal. It is not that a reward was withheld.
The dataset is curated successful teleoperation, so "did that attempt work?" is
not a distinction that exists in the data at all.

Flag it forward: the critic inherits exactly the same problem two slides from
now, and that turns into a real bug.

The economic argument is the one that convinces engineers rather than
ML people, and the results at the end qualify it: you need both. Rollouts
sharpen what the policy already does; demonstrations are the only source of
what it cannot do yet.
-->

---

# RECAP: condition on how good the action was

<img src="/figs/recap_concept.svg" class="h-[350px] mx-auto" />

<div class="takeaway warn mt-3 text-sm">
No policy gradient, no importance weighting, no reward model. The objective
stays the supervised imitation loss; only the <strong>input</strong> is new.
</div>

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

# The critic, and making it honest

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-3">

<img src="/figs/critic_value.png" class="w-full" />

</div>
<div class="col-span-2 pt-1">

Predicts **normalised time remaining**, not good/bad. A distribution over 201
bins, not a scalar.

<div class="takeaway warn mt-4">
Trained on successful demonstrations only, it scores a <em>failed</em> rollout
almost as highly as a successful one.
</div>

<div class="takeaway mt-4">
Fix: fine-tune on the rollouts with a large constant added to the remaining
time of failed episodes, so their target clamps to the bottom of the value
support.
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

# Two knobs: the threshold, and guidance

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-2">

<div class="kicker mb-1">Per-frame advantage</div>

$$A_t = V(o_{t+N}) - V(o_t) - \tfrac{N}{T_{\max}}$$

<p class="note">Every step costs the same, so this is just: did the critic's
value move more than the clock did? The top <strong>f⁺</strong> of a task's
successful frames are labelled positive, everything below — failures
included — negative.</p>

<div class="kicker mb-1 mt-5">Classifier-free guidance</div>

$$v = v_{\text{unc}} + w\,(v_{\text{pos}} - v_{\text{unc}})$$

<p class="note">The token is dropped for 30 % of training samples, so the same
network also learns the unconditioned policy.</p>

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

This is the mechanism behind the f-plus result two slides into part 3 of the
results. If the labels are wrong, v_pos - v_unc points away from behaviour the
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

<div class="kicker mb-2">FAST: a chunk becomes a short token string</div>

<p class="note">
normalise per joint → **DCT along time** → quantise → flatten → **BPE**
</p>

<p class="note mt-2">
Smooth trajectories put almost all their energy in a few low frequencies; the
rest quantise to zero and BPE merges the runs away. 1024 rarely used vocabulary
ids are repurposed as action tokens.
</p>

<div class="takeaway warn mt-5">
Worth <strong>5 to 11 points</strong> per suite over the same architecture
trained the conventional way — the largest single effect in the whole
evaluation.
</div>

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

Distil the ten Euler steps into a **single time-conditioned jump**, with the
model as its own teacher.

- A second time input *s* through an MLP **initialised to all zeros**, so
  training starts from the ten-step policy exactly
- Teacher: the same weights under `no_grad`, **two half-steps**
- Student: one whole jump, regressed onto that chord

<div class="takeaway warn mt-4 text-sm">
Two half-steps beat one whole, so the teacher is always slightly ahead — and
improves with the student.
</div>

</div>
<div class="col-span-3 flex justify-center pt-1">

<SnapFlow :width="498" :height="300" />

</div>
</div>

<!--
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
<tr v-click><td>+ SnapFlow distillation</td><td>74.2</td><td>84.2</td><td>40.0</td><td>66.1</td></tr>
</tbody>
</table>

<div v-click class="grid grid-cols-3 gap-6 mt-6 text-sm">
<div class="takeaway"><strong>1.</strong> The pre-training recipe is the largest effect.</div>
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

Two caveats to volunteer rather than defend later. The absolute numbers are not
comparable to published SmolVLA figures, because none of these models saw the
community pre-training corpus. And a fourth suite, `object`, is missing: every
policy here scores ZERO on it, base included. Photometric augmentation alone
lifts it to 53.6 %, which says the policy had overfitted to the appearance of
the training images. It affects every configuration identically, so it
separates nothing and it is excluded rather than printed as a row of zeros.
-->

---

# Why `long` regresses, and what fixes it

<div class="grid grid-cols-5 gap-8 mt-3">
<div class="col-span-3">

<img src="/figs/fig_long_regress.png" class="w-full" />

<div class="grid grid-cols-2 gap-5 mt-3">
  <Clip src="250k_goalT0_drawer_FAIL_ep0" verdict="fail" label="base policy" />
  <Clip src="cotrain_goalT0_drawer_SUCCESS_ep0" verdict="success" label="co-trained" />
</div>

</div>
<div class="col-span-2 pt-2">

<div class="takeaway warn">
Rollout post-training <strong>amplifies the quality of the rollouts you feed
it</strong>. Where most of them fail, even the positives come from mediocre
behaviour.
</div>

<div class="takeaway mt-5">
The base policy never opens a drawer, so its rollouts contain no positive
drawer example to reinforce. That skill can only come back from the
<strong>demonstrations</strong>.
</div>

<p class="note mt-4">
Which is the role human corrections play in the original recipe — filled here
by data that was already on disk.
</p>

</div>
</div>

<!--
This is the slide the policy half of the thesis is built around. Take the time,
and let the clips loop while you talk.

Left panel: base-policy success per suite, used as a stand-in for rollout
quality, since the rollouts were collected by exactly that policy. Say
"stand-in", not "measurement" — per-suite rollout success was not logged
separately. 600 episodes, 64.3 % overall.

The chain: spatial and goal, three quarters of episodes succeed, plenty of good
behaviour to reinforce, it helps. On `long`, most rollouts fail, so even the
positively labelled frames come from mediocre behaviour, and the policy falls
below where it started.

Then the clips, which are the same statement from the other side. Same task,
same instruction, same 450M architecture. The only difference is whether
demonstrations were mixed back into fine-tuning.

Both are on the companion site under LIBERO rollouts, alongside a third pair
where co-training LOSES a skill the rollouts taught. Specialisation runs in
both directions.
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

# The same recipe, on the arm

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-3">

<img src="/figs/rover_dataset_sample.png" class="w-full" />

</div>
<div class="col-span-2 pt-1">

<div class="kicker mb-2">Four datasets, 20 Hz, on the Hub</div>

| dataset | episodes |
|---|---:|
| black switch | 83 |
| red switch | 24 |
| lever switch | 11 |
| four instructions | 120 |

<div class="takeaway warn mt-4">
The rover lineage runs every RECAP stage <strong>except the rollout
collection</strong>. Both of its stages train on demonstrations — collecting
rollouts needs arm time that did not exist.
</div>

</div>
</div>

<!--
One episode of the panel-switch dataset: five camera frames along the top, the
six joints measured against commanded in the middle, the gripper at the bottom.
The demonstration opens the jaws, holds them while the arm settles, closes at
7.5 s, turns the switch with the wrist roll, backs off at 13.5 s.

Say what the pipeline actually is, because it is the deliverable: bags recorded
in the field, episode boundaries and task strings set in an annotation GUI,
converted offline into a LeRobot dataset with the same converters the live
system uses. So a recorded frame and a live observation have identical layout
by construction. Nothing has to be kept in step by hand.

Then the concession, and make it plainly. What the arm inherits from this
contribution is the ARCHITECTURE and advantage conditioning, not the RECAP loop
that produces the gain. The gain was measured on LIBERO, on a different robot,
a different dataset and a different observation layout. The rover policy is
pre-trained on a public UR5 dataset for 120k steps and fine-tuned on those
recordings for 30k.

The datasets are public under `fhnwrover` on the Hugging Face Hub, and the
companion site links a browser for them.
-->

---

# Making it fit the Jetson

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-3">

<img src="/figs/tensorrt_pipeline.svg" class="h-[290px]" />

</div>
<div class="col-span-2 pt-1">

Two graphs, because an engine holds **one** forward pass with fixed shapes:
the VLM **prefix** once per observation, the expert **suffix** once per
denoising step. The loop stays in Python.

<div class="takeaway warn mt-4">
Converted whole to FP16, the trained policy <strong>collapses</strong>: mean
error 0.83 against a 0.02 gate, and the actions keep 17 % of their spread.
</div>

<div class="takeaway mt-4">
Not a mantissa problem — a <strong>range</strong> problem. TF32 has the same 10
mantissa bits and is fine, because trained transformers grow outlier activation
channels FP16's exponent cannot hold.
</div>

</div>
</div>

<!--
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

# The cycle closes

<img src="/figs/cycle_budget.png" class="w-[72%] mx-auto mt-1" />

<div class="grid grid-cols-3 gap-6 mt-3 text-sm">
<div class="takeaway warn">
Eager, a chunk takes <strong>1357 ms</strong> — longer than half the motion it
commands. The queue drains.
</div>
<div class="takeaway">
Deployed: <strong>330 ms</strong>, a <strong>4.1×</strong> speed-up from export
and distillation together.
</div>
<div class="takeaway">
The cycle closes at <strong>30 of 50 ms</strong>. Re-planning at 3 Hz; the
deployment asks for 2.
</div>
</div>

<!--
This is the slide that says the acceleration was NECESSARY, not merely nice.

The arithmetic, which is the interesting bit and not obvious: the controller
replays a chunk while computing the next one, so the publisher keeps draining
the queue during the forward pass. The leading actions of a new chunk describe
a moment that has already passed, and are discarded. A chunk of n actions
costing c delivers n − c/Δt of them.

So the eager path consumes 27 of its 50 actions before the chunk lands and
returns 23. It loses four actions on every re-plan until the queue runs dry.
No queue depth fixes that — a deeper queue only postpones the first stall. The
bound is c ≤ n·Δt/2, which at fifty actions is 1250 ms, and eager FP32 misses
it.

On the deployed engine the same amortisation is 43 of 50 actions and 8 ms.
The largest item in the cycle is then the JPEG decode of three camera streams
at 15 ms — the ROS-side work is the floor of this budget, whichever policy is
loaded.

Caveats, volunteered: the benchmark has the Jetson to itself, and the budget
holds no progress tracker yet. Two fifths of the cycle is spare, so neither
puts the engine path at risk.

One more saving worth a sentence if there is time: only one tick in ten
actually feeds a forward pass, and the rest decoded three camera frames and
threw them away. A frame gate returned 0.84 of a CPU core to the rest of the
stack.
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
Clock check: minute 24 of 44.

Under 22 means you rushed part 2. Past 27, drop the "what n8n is not" slide and
compress the tool change into one sentence on the maintenance slide.

Parts 3 and 4 are twelve slides in 14 minutes. They are less mathematical and
they will move faster than you expect.
-->

---

# Why a workflow layer at all

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

<div class="kicker mb-2">The problem</div>

- ERC tasks have a **prescribed order**, and operators under pressure forget steps
- A task is a sequence of ROS2 calls with branches, waits and confirmations —
  not a control problem
- The people who run the rover are **not all programmers**

<div class="takeaway warn mt-5">
Writing one bespoke sequencer node per task is how this normally goes. Then
every change is a rebuild, and only its author can read it.
</div>

</div>
<div class="pt-2">

<div class="kicker mb-2">The choice</div>

**n8n** — an open-source workflow automation tool — bridged to ROS2 over a
rosbridge WebSocket.

- ROS2 topics, services and actions become **drag-and-drop nodes**
- The same nodes are **tools for an LLM agent**, so one integration serves both
- And it already speaks to everything else: an issue tracker, a chat system, a
  spreadsheet

<p class="note mt-4">
Packaged as a community node package, <code>@fhnw-rover/n8n-nodes-ros2</code>.
</p>

</div>
</div>

<!--
The framing that lands with a robotics audience: this is not a replacement for
ROS2. It is the layer ABOVE the control loop — sequencing substeps, setting
parameters, reading measurements back, and connecting the robot to things that
are not robots.

The single-integration argument is the one I would defend hardest. MCP and
"skills" were both considered. The reason for neither is that an n8n node can
be dragged onto a canvas by a human OR called as a tool by an agent, from the
same definition. Two interfaces would have meant two things to keep in step.

The breadth argument gets its evidence two slides on: a battery warning that
raises a task in Asana from a ROS2 topic, in ten nodes and no code.
-->

---

# n8n ↔ ROS2

<div class="grid grid-cols-5 gap-8 mt-2">
<div class="col-span-3">

<img src="/figs/n8n_stack.svg" class="w-full" />

</div>
<div class="col-span-2 pt-1">

<div class="kicker mb-2">Both directions of every primitive</div>

- **Topics** — subscribe once, subscribe as a trigger, publish
- **Services** — call, *and* advertise one so ROS2 can start a workflow
- **Actions** — start / status / result / feedback / cancel, and an action server
- **Introspection** — list topics, services and types at run time
- **Images** — a `CompressedImage` decoded into an n8n binary
- **Docker** — the rover runs in containers, so a workflow can restart one

<p class="note mt-4">
All of them usable as agent tools, except the triggers.
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

# A substep is always the same shape

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

<div class="kicker mb-3">The pattern</div>

1. **Select** — the panel detector returns the candidate elements
2. **Approach** — `align_to_target` servos the gripper to it
3. **Manipulate** — `run_policy` runs until the progress model says done
4. **Verify and record** — before the next substep starts

<div class="takeaway warn mt-5">
Every phase is a ROS2 action with a terminal result, so the workflow always
learns <em>how</em> a phase ended and can branch on it: retry, or escalate to a
human.
</div>

</div>
<div class="pt-2">

<div class="kicker mb-3">And the order is the graph</div>

The sequence the rules demand is the **topology of the canvas**. It is visible
to anyone who opens it, and the active node is highlighted while it runs.

<div class="takeaway mt-5">
Unsafe steps are gated on a <strong>form</strong>: the workflow pauses, shows
the operator a camera frame and a choice, and only then issues the next call.
</div>

<p class="note mt-4">
The ERC's blue beacon and its mandatory 5-second delay before autonomous motion
live here too — once per return to autonomy.
</p>

</div>
</div>

<!--
This slide is RQ3's answer above the autonomy, and the safety slide was its
answer below.

The point to make firmly: "handle errors and plan changes" is not solved by a
clever recovery algorithm. It is solved by every phase being cancellable and
reporting a terminal result, so a supervisor — human or graph — can decide what
to do next. A substep that fails is retried from a known pose; one that keeps
failing is handed back to an operator, who can take manual control and hand it
back.

The manual hand-off is mechanically neat: switching to manual takes the
SpaceMouse node out of auto mode, which stops the operator heartbeat, which
stops autonomous commanding. One switch, and the safety layer does the rest.
-->

---

# The maintenance workflow

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

**87 nodes**, one loop per substep, repeated until the operator reports that
substep done. Before every loop it offers a switch back to manual.

<div class="takeaway mt-4">
Two substeps break the pattern. Both have a <em>fixed</em> target, so there is
nothing to detect or select — and the plug needs a different tool, so it calls
the tool-change workflow twice.
</div>

<p class="note mt-4">
Run on the rover. Substeps whose policies exist run their loops; the rest are
wired and performed by hand.
</p>

</div>
<div class="pt-1">

<div class="kicker mb-2">One rule I did not expect to have to learn</div>

Where a node has two outgoing connections, execution is depth-first and the
**upper branch on the canvas runs first**.

<div class="takeaway warn mt-4">
So a node's vertical position is part of the program. The nodes that return the
beacon and the SpaceMouse to autonomous mode sit <em>above</em> the branch that
starts the next substep — below it, the next substep would begin while the arm
was still under manual control.
</div>

<p class="note mt-4">
Moving a node for tidiness can change behaviour.
</p>

</div>
</div>

<!--
The 87-node canvas is unreadable at any size a slide allows. It is a full-page
figure in the report's appendix, and the whole set is browsable on the
companion site — offer that rather than showing a postage stamp.

Describe the loop instead, in one breath: the detector returns the candidate
elements of one type, the operator picks one from a dropdown, the arm aligns,
the policy runs, the operator confirms the outcome, and the workflow returns to
detection until that substep is reported done.

Then spend the rest of the slide on the right-hand column, because it is the
most surprising thing in this part and it is a genuine trap. It is also the
argument for writing that short manual: this rule is invisible in the editor
and was learned by running into it.
-->

---

# Mechanical tolerance beats control accuracy

<div class="grid grid-cols-5 gap-6 mt-3">
<div class="col-span-2 flex items-center">

<img src="/img/tool_rack.jpg" class="w-full border border-[#deded9]" />

</div>
<div class="col-span-3 pt-1">

<img src="/img/toolchanger_workflow.png" class="h-[195px] mx-auto border border-[#deded9]" />

<div class="takeaway warn mt-3 text-sm">
The rack is bolted on, so the exchange is a chain of <strong>taught joint
positions</strong> — no camera, no IK. Under a straight push the residual
misalignment jams the coupling, so the workflow <strong>shakes the wrist</strong>
while pressing and the lead-in chamfer pulls the halves together.
</div>

<div class="grid grid-cols-3 gap-4 mt-3 text-xs">
<div><div class="kicker mb-1">Pickups</div><strong>9 / 10</strong> <span class="dim">— the one failure latched on a retry</span></div>
<div><div class="kicker mb-1">Park</div><strong>every time</strong> <span class="dim">— gravity helps</span></div>
<div><div class="kicker mb-1">Duration</div><strong>≈30 s</strong> <span class="dim">— deliberately slow</span></div>
</div>

</div>
</div>

<!--
This is one of the lessons-learned arriving early, and it is the most
transferable thing in the thesis.

No amount of software removes the residual error of a taught position. What
removes it is a chamfer and a wrist that oscillates while it presses: the
mechanism absorbs the misalignment. That is a cheaper answer than a more
accurate controller, and it is why this substep needs neither vision nor IK.

The other property a deterministic sequence of taught positions has: a retry
starts from exactly the same state as the first attempt. The one failure cost a
second 30-second run and nothing else.

The canvas on the right holds no joint value at all — every move is a call of a
"drive to position" sub-workflow that reads the row from a data table. So
re-teaching a slot after a mechanical change is one row, not a search through
the canvas. Those data tables are the blackboard of the whole layer: taught
positions, task state, and the locks that would keep two actuating workflows
apart.
-->

---

# It reaches further than the robot

<div class="grid grid-cols-2 gap-8 mt-3">
<div>

<img src="/img/n8n_battery_check.png" class="w-full border border-[#deded9]" />

<div class="takeaway mt-3 text-sm">
<strong>Ten nodes, no code.</strong> Every five minutes: on battery, below
threshold, and no alert open yet → raise a task in Asana, and remember that it
did.
</div>

</div>
<div>

<div class="kicker mb-2">And downwards, into another subsystem</div>

The **deep-sampling** workflow: 70 nodes over five phases — drill, unload,
tare, weigh — writing the drill's setpoints, polling its state machine, taking
the two photographs the rules require and filing them against the sample.

| | |
|---|---:|
| complete runs | 3 of 3, no node error |
| end to end | 111 – 148 s |
| service call, median | 563 ms |

<div class="takeaway warn mt-4">
Built by <strong>another team member</strong>, who did not write the node
package. That is the strongest evidence available for the code-free claim.
</div>

</div>
</div>

<!--
The two examples are deliberately opposite directions, and together they are
what makes the integration worth more than a sequencer.

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

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

<div class="takeaway warn">
<strong>Not a control loop.</strong> A step costs ~120 ms of n8n alone, ~1 s
once it waits on a subsystem. The 50 ms control period stays in ROS2.
</div>

<div class="takeaway mt-5">
<strong>One node at a time</strong>, one branch to completion. Genuinely a
safety property — two branches cannot command the arm at once — and also why
sequencing ends up encoded in node positions.
</div>

</div>
<div class="pt-2">

<div class="takeaway warn">
<strong>No interlock between workflows.</strong> Nothing stops two of them
driving the hardware simultaneously. The competition procedure does one task at
a time; automated triggering would need a lock first.
</div>

<div class="takeaway mt-5">
<strong>Debugging re-runs from the trigger.</strong> On a web API that costs a
few calls. On this workflow it costs a drill cycle, and two minutes before the
last phase is even reached.
</div>

</div>
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
Clock check: minute 31 of 44. Five slides, seven minutes.

The arc: an agent is worth having for the open-ended half of the work; it must
not drive the hardware; and it can be moved onto the rover for free if you are
willing to fine-tune it on its own executions.
-->

---

# An agent on the same nodes

<img src="/img/n8n_ros2_agent.png" class="w-full border border-[#deded9] mt-1" />

<div class="grid grid-cols-3 gap-6 mt-4 text-sm">
<div class="takeaway">
<strong>Fourteen tools:</strong> seven introspection lookups, read a topic,
publish, capture an image, call a service, and three Asana operations.
</div>
<div class="takeaway warn">
<strong>Inspection, not actuation.</strong> No action node and no Docker node
is attached, so it starts no long-running goals.
</div>
<div class="takeaway">
A <strong>read-only credential</strong> and a topic-namespace allowlist, checked
before the socket opens.
</div>
</div>

<!--
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
and the e-stop from part 1.

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
Clock check: minute 38 of 44. Seven slides and then the demo — these are short,
and they are the ones that decide what the room remembers.

Do not speed up here. If you are late, drop "What I would keep from this" and
fold its second point into the conclusion; if you are very late, skip the live
demo at the end and offer it during the questions instead. Both are cheaper
than rushing the research questions.
-->

---

# End to end, on the arm

<div class="grid grid-cols-3 gap-6 mt-4">
<div>
<div class="kicker mb-2">Rotary switches</div>

The policy turns them. It often fails on the first attempts, and a retry
eventually succeeds.

<p class="note mt-2">The substep with the most demonstrations behind it — and
the easiest for a human to teleoperate.</p>
</div>

<div>
<div class="kicker mb-2">Lever switches</div>

Harder, and hard for a human too: the motion tensions and then **snaps**.

<p class="note mt-2">Exactly the kind of motion a flow-matching policy handles
worst — and the dataset has eleven episodes.</p>
</div>

<div>
<div class="kicker mb-2">The plug</div>

Not trained. An operator **cannot teleoperate it well enough to demonstrate**,
so there was nothing to imitate.

<p class="note mt-2">A tool that rotates the plug upright as it closes now
exists. It has not yet been used to record.</p>
</div>
</div>

<div class="takeaway mt-6">
The full chain runs: teleoperated recording → annotation → critic → advantage-conditioned
fine-tuning → distillation → TensorRT → a policy driving the manipulator, under
the safety layer, started by a workflow.
</div>

<!--
Be plain here. The pipeline is demonstrated end to end; the task success rates
are not what anyone would want yet.

The plug is the honest centrepiece and it is a better lesson than a result:
"you can only imitate what you can demonstrate". The bound is not the learning
method, it is the data-collection interface. On a real robot that interface —
the teleoperation rig, the tool — is PART of the learning system, and improving
it can matter more than improving the architecture. The tool in the report
rotates the plug through 90 degrees as the jaw closes, which removes the
regrasp an operator cannot do.

Also say what the approach phase does, because it is the reliable half: it
places the gripper inside 25 mm and it is retried from a known pose when it does
not. Every remaining failure is in the manipulation phase.
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

# See it rather than take my word

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

<div class="kicker mb-2">p9.fhnw-rover.ch</div>

- **A virtual rover, driven by n8n** — real ROS2 topics, services and actions,
  sixteen workflows on a live canvas, the editor, a drive form and the agent
  chat &nbsp;<span class="dim">/demos/rover</span>
- **SmolVLA + RECAP in your browser** — PushT on WebGPU. Drag the agent away
  and watch it recover; move the guidance weight
  &nbsp;<span class="dim">/demos/pusht</span>

</div>
<div>

<div class="kicker mb-2">And the material behind the numbers</div>

- The **LIBERO rollouts** of the three comparisons in part 2, side by side
- The **demonstration datasets**, episode by episode, in LeRobot's viewer on the
  Hugging Face Hub
- The report as a PDF

<div class="takeaway warn mt-5">
The read-only live view is open to anyone. Send the rover somewhere from your
phone during the questions if you like.
</div>

</div>
</div>

<!--
Half a minute, and offer it rather than demonstrate it — a live demo in a
defence is a way to lose five minutes.

If the room does want one, the safest is the rover demo: open the drive form,
send it somewhere, and let the live view show it moving while the battery
watchdog preempts the patrol. It is a simulated rover offering genuine ROS2
interfaces, and it is read-only at the protocol level for viewers.

The PushT demo is the one that makes the policy tangible: it runs the same
policy family entirely client-side, so you can take over mid-episode and watch
it recover, and scrub the guidance weight to see what it does and does not
change.
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

<div class="mt-4">

<div class="takeaway text-base py-3">
<strong>1. Edge AI for robotics is viable — but not as trained.</strong> Two
models that were cloud workloads a few years ago run on two Jetsons. The policy
as trained misses the deadline by 31 ms; export, precision and distillation are
what make it deployable rather than merely comfortable.
</div>

<div class="takeaway warn text-base py-3 mt-4">
<strong>2. You can only imitate what you can demonstrate.</strong> The plug is
untrained because it cannot be teleoperated. On a real robot the data-collection
interface is part of the learning system.
</div>

<div class="takeaway text-base py-3 mt-4">
<strong>3. Rollouts amplify; demonstrations extend.</strong> Post-training
sharpens behaviour the policy already shows. A missing skill has to come back
from the demonstrations — which is the role human corrections play in the
recipe this one is built on.
</div>

</div>

<!--
Three, and do not add a fourth. If you are short of time, this slide and the
next can merge into one minute: say number 2 and number 3 and stop.

The fourth candidate, if someone asks for one, is the tool-change lesson:
mechanical tolerance beats control accuracy. A chamfer and a shaking wrist
solved what no controller change would have.

The fifth is about agents: give one a real oracle or its results will pass while
being wrong. That is the TensorRT story, and it generalises.
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

# Demo: two instances of the same thing

<div class="grid grid-cols-2 gap-10 mt-4">
<div class="takeaway hoverable" style="border-left-color: var(--fhnw-yellow)">

<div class="kicker mb-1">Public · a simulated rover</div>

### <a href="https://n8n-demo.fhnw-rover.ch">n8n-demo.fhnw-rover.ch</a>

Real ROS2 topics, services and actions, served by a simulator instead of by
Barbara — so it can be left running and opened by anyone.

- **sixteen workflows** on the canvas, eleven written to show what a node does
  and five taken off the rover
- the **drive form**, the **agent chat**, and a read-only live view
- embedded on <span class="dim">p9.fhnw-rover.ch/demos/rover</span>

</div>
<div class="takeaway hoverable">

<div class="kicker mb-1">Team network only · the rover itself</div>

### <a href="http://172.16.10.121:5678">172.16.10.121:5678</a>

The same node package against the real ROS2 graph, on the Jetson, behind the
owner login.

- the workflows that actually run: **maintenance** (87 nodes), **tool change**,
  **deep sampling**, the **battery watchdog**
- the **data tables** holding the taught positions and the task state
- the agent, wired to the **local fine-tuned model**

</div>
</div>

<p class="note mt-5 text-center">
Same nodes, same canvas, same credentials model. One drives a simulator; the
other drives an arm.
</p>

<!--
Two to three minutes, and only if the room wants it. Offer, do not insist —
this comes after the conclusions precisely so that skipping it costs nothing.

If you run it, run it in this order and resist wandering:

  1. The DEMO instance, because it cannot break anything. Open the workflow
     list so the room sees sixteen canvases, then open one — the battery
     watchdog is the best single artefact, ten nodes, no code, and it explains
     itself. Then the agent chat: ask it what interfaces the robot has, and let
     it discover them live.
  2. The ROVER instance, if the network cooperates. This is the one worth
     showing for the maintenance canvas at full size — the thing that is
     unreadable on a slide — and for the data tables, because "a taught
     position is a row" lands better when they see the row.

Do NOT trigger an actuating workflow from here. The arm is not in the room, the
heartbeat will not be present, and a form waiting for a confirmation nobody
gives is a bad way to spend the remaining minutes.

The rover instance is on 172.16.10.121, an address on the team network. If the
defence room is not on it, say so and stay on the demo host — everything
structural is visible there. Check both before the talk, and have the workflow
gallery on p9.fhnw-rover.ch open in a third tab as the offline fallback, since
those canvases render from JSON and need no instance at all.
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

"Why is the object suite missing?"
  Every policy including the base scores zero on it. Photometric augmentation
  alone lifts it to 53.6 %, so the policy had overfitted to the appearance of
  the training images. It affects all configurations identically.

"What would you do differently?"
  Build the demonstration interface first. The plug substep, the lever switch
  and the rover-versus-LIBERO gap all trace back to how much data could be
  recorded and how good it was.

BACKUP SLIDES FOLLOW: engine accuracy · latency table · guidance baking ·
the label composition · the n8n node package · agent transcripts.
-->

---
layout: section
---

<div class="kicker mb-4">Backup</div>

# Appendix

---

# Engine accuracy on trained weights

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

| policy | engine | mean abs | spread | ok |
|---|---|---:|---:|---|
| RECAP 10-step | FP16 | 0.826 | 17 % | no |
| RECAP 10-step | TF32/FP16 | 0.0014 | 100 % | **yes** |
| RECAP SnapFlow | FP16 | 0.897 | 62 % | no |
| RECAP SnapFlow | TF32/FP32 | 0.00017 | 100 % | **yes** |
| SmolVLA | FP16 | 0.549 | 67 % | no |
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

<img src="/figs/recap_pipeline.svg" class="h-[350px] mx-auto mt-1" />

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
