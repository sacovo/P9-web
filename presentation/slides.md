---
theme: default
title: Enhancing SmolVLA with Reinforcement Learning
info: |
  Critic-Guided Rollout Post-Training of a Compact Vision-Language-Action Policy
  for Edge Robotics — Fachvortrag, FHNW Hochschule für Informatik.
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

<div class="kicker">FHNW Hochschule für Informatik · Fachvortrag</div>

# Enhancing SmolVLA with<br>Reinforcement Learning

<p class="text-lg mt-2 mb-7" style="color: var(--fhnw-ink-2)">
Critic-guided rollout post-training of a compact vision-language-action policy for edge robotics
</p>

<div class="text-base">
<strong>Sandro Covo</strong><br>
<span class="dim text-sm">sandro.covo@fhnw.ch</span>
</div>

<div class="mt-8 text-sm flex gap-8">
  <div>
    <div class="kicker mb-1">Code</div>
    <a href="https://github.com/sacovo/smolva-rl">github.com/sacovo/smolva-rl</a>
  </div>
  <div>
    <div class="kicker mb-1">Project page</div>
    <a href="https://sacovo.github.io/smolva-rl/">sacovo.github.io/smolva-rl</a>
  </div>
</div>

<img src="/img/fhnw-logo.png" class="absolute right-12 bottom-10 w-48" />

<!--
45 minutes is the HARD CEILING, and questions come on top of it rather than out
of it. Aim at 40 of talk; 38 is comfortable. There is no reason to rush — the
depth in part 2 is there to be used.

Do NOT explain the next slide before playing it. The whole hook depends on the
audience seeing the two clips without being told which is which.
-->

---
layout: center
class: px-16
---

<div class="grid grid-cols-2 gap-10">
  <Clip src="250k_goalT0_drawer_FAIL_ep0" />
  <Clip src="cotrain_goalT0_drawer_SUCCESS_ep0" />
</div>

<p class="text-center mt-6 text-lg">
“open the middle drawer of the cabinet”
</p>

<!--
Play both. Say nothing for ~15 seconds; they loop, let them watch twice.

Then: "Same task. Same language command. Same architecture, 450 million
parameters. The only difference is HOW the model was post-trained. That is what
the next 40 minutes are about."
-->

---
layout: center
class: text-center px-24
---

<p class="text-3xl leading-snug" style="font-weight: 500">
Can a <span class="hl">small</span> robot model improve from
its <span class="hl">own experience</span> —
with no human in the loop — and still run on a
<span class="hl">15-watt computer</span>?
</p>

<style>
.hl { box-shadow: inset 0 -0.58em 0 var(--fhnw-yellow); font-weight: 600; }
</style>

<!--
Each constraint is doing work:
- "small": 450M, not 5B.
- "own experience": autonomous rollouts, no teleoperation corrections.
- "15 watts": it has to survive on a Jetson, on a battery.

The literature answers this for large models on workstation GPUs. Nobody had
answered it for the class of model a mobile robot can actually carry.
-->

---

# The constraint: model size

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

|  | π*<sub>0.6</sub> (RECAP) | SmolVLA |
|---|---|---|
| Parameters | 4 B + 860 M | **450 M** |
| Reference HW | RTX 4090 | Jetson Orin NX |
| Board power | 450 W | **10–25 W** |
| bf16 weights | ≈ 10 GB | **≈ 0.9 GB** |

</div>
<div>

<img src="/img/barbara-campus.jpg" class="w-full border border-[#deded9]" />


<div class="takeaway warn mt-4">
      Many new approaches for training a robotic policy exist for hardware our rover does not have.
</div>

</div>
</div>

<!--
Point at the photo before the table. That is OUR rover, on our campus, and the
Jetson on it is the whole reason any of this is constrained — the numbers on the
left are abstract until the room has seen the thing that has to carry them. One
sentence, then move to the table.

The Jetson's 16 GB is UNIFIED memory, shared with cameras, inverse kinematics,
navigation and the OS. Ten gigabytes of weights would leave about 6 GB for the
entire rest of the robot, before inference activations even start.

openpi lists >8 GB GPU memory as the requirement already for the smaller released
models (pi-0, pi-0.5). The 4090's 450 W is its board power rating.

If asked about Orin Nano vs NX later: latency was measured on an Orin Nano 8 GB,
the target deployment device is the Orin NX 16 GB, and the numbers reproduce
within 8 %.
-->

---

# Overview

<div class="grid grid-cols-3 gap-10 mt-8 text-sm">

<div>
<div class="kicker mb-3">1 — Introduction</div>

- VLA models
- Imitation learning
- LIBERO
- Flow matching: training
- Flow matching: inference
- RECAP

</div>

<div>
<div class="kicker mb-3">2 — Concepts developed</div>

- The critic: honesty and state dropout
- Advantage labelling and f⁺
- Knowledge insulation and FAST+
- SnapFlow: one-step distillation
- Guidance baking

</div>

<div>
<div class="kicker mb-3">3 — Results and analysis</div>

- Results
- Why `long` regresses
- The threshold as a dosage
- Remaining failures
- Accuracy versus latency

</div>

</div>


<!--
Thirty seconds. Its only job: three parts, and the results section is the payoff.
-->

---

# What is a VLA model?

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

<div class="kicker mb-2">In</div>

- 2 camera images
- Joint state
- *“put the bowl on the plate”*

<div class="kicker mb-2 mt-6">Out</div>

- Not text: a **chunk of 20 actions**

<div class="takeaway mt-6">
A VLM reads the scene; a separate <strong>flow-matching expert</strong> generates
the motion. An image generator whose output space is motor commands.
</div>

</div>
<div class="flex justify-center">

<img src="/figs/vla_loop.svg" class="h-[330px]" />

</div>
</div>

<!--
Deep learning for robot control: one network from pixels and language to motor
commands.

Chunking is what makes this tractable: one expensive forward pass buys 20
control steps. Single-step closed-loop control at roughly 1 Hz inference would be
unusable.

Plant this now: the denominator of the whole system is LATENCY PER CHUNK.

Examples in the wild: pi-0 / pi-0.5 from Physical Intelligence, NVIDIA's GR00T,
and SmolVLA, the one that fits on a Jetson and therefore the one we use.
-->

---

# Imitation learning, and its ceiling

<div class="grid grid-cols-2 gap-12 mt-4">
<div class="pt-2">

1. A human **teleoperates** the robot, N times
2. Record (observation, action) pairs
3. Supervised learning on those pairs

</div>
<div>

<div class="takeaway warn">
<strong>Behaviour cloning.</strong> The training data is <em>only</em> successful
demonstrations. There is no failure in it to learn from, and no reward.
</div>

<div class="takeaway mt-5">
By construction it cannot get <strong>better</strong> than its demonstrations.
Only closer to them.
</div>

</div>
</div>

<!--
The ceiling argument motivates everything that follows.

Be precise about WHY there is no signal: it is not that the model is denied a
reward it could otherwise have had. The dataset is curated successful
teleoperation, so "did that attempt work?" is not a distinction that exists in
the data at all. Every frame is something a human did on the way to succeeding.

Flag it forward: the critic inherits the same problem. Trained on demonstrations
alone it has never seen a failure, which is the "making the critic honest" slide.

The economics are the other half: every additional episode costs HUMAN time, one
episode at a time, and does not transfer to a new task. Rollouts cost GPU time; a
robot generates them overnight, unattended. That is the answer to "why not just
collect more demos?", and the results add: you need both.
-->

---

# The benchmark: LIBERO

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

Simulated Franka arm · 3 suites × 10 tasks

| suite | varies |
|---|---|
| `spatial` | spatial reference |
| `goal` | the goal |
| `long` | **multi-stage** tasks |

<p class="note mt-3">50 episodes per task → <strong>n = 500 per suite</strong>, SE ≈ ±2 points.</p>

</div>
<div class="pt-4">

<div class="takeaway warn">
The fourth suite, <code>object</code>, is <strong>excluded</strong>: every policy
we train — including the base — times out on all of it.
</div>

</div>
</div>

<!--
LIBERO in full: Liu et al., "LIBERO: Benchmarking Knowledge Transfer for
Lifelong Robot Learning", arXiv 2306.03310, NeurIPS 2023. Say "a lifelong robot
learning benchmark" if asked what it stands for — the paper uses LIBERO as the
benchmark's name and never expands it letter by letter, so do not guess one.

On `object`: since it affects all configurations identically, we suspect missing
or corrupted object demonstrations in the pre-training data rather than a
property of the methods. Either way it cannot separate them, so it is out. Saying
this now rather than being asked in the Q&A.

If pressed: --augmentation fixes it, but it was not part of the evaluated setup.
-->

---

# Flow matching: training the velocity field

<img src="/figs/fig_fm_train.png" class="w-[88%] mx-auto mt-1" />

<div class="grid grid-cols-5 gap-8 mt-2 text-sm">
<div class="col-span-3">

$$\mathcal{L}_{\text{FM}} = \mathbb{E}_{a,\,\omega,\,\tau}\;\bigl\lVert\, v_\theta(x_\tau,\, \tau,\, \text{prefix}) - (\omega - a)\, \bigr\rVert^2$$

<p class="note mt-1"><strong>prefix</strong> = the VLM's output over images,
language and state — <strong>not</strong> the raw observation.</p>

</div>
<div class="col-span-2">

<div class="takeaway">
A <strong>plain regression</strong>. No solver, no sampling, one forward pass per
training example.
</div>

</div>
</div>

<!--
This is the slide where the audience should stop thinking of the action expert as
"a network that outputs actions". It outputs a VELOCITY, and it is trained by
ordinary supervised regression.

Walk the recipe once, slowly, in this order:
  1. Take a real action chunk `a` from the dataset — 20 steps by 7 joints.
  2. Draw pure Gaussian noise `omega` of the same shape.
  3. Draw a time `tau` uniformly in [0, 1] and mix them:
     x_tau = tau*omega + (1-tau)*a. So tau = 0 is the clean chunk, tau = 1 is
     pure noise, and everything in between is a straight line connecting them.
  4. The label is the velocity of that straight line: `omega - a`. Constant —
     the same vector everywhere along the line, which is the whole reason the
     objective is cheap.
  5. Ask the network for its velocity at that point and take the squared error.

That is the entire training loop. Note what is NOT in it: no integration, no
sampling from the model, no adversarial term, no reference network. Training a
flow-matching policy costs the same as training a regressor.

Now the part that makes it work, which is the LEFT panel. A single example is a
line, and the network cannot possibly fit all of them: different pairs cross the
same point with different velocities. The MSE minimiser at each (x, tau) is
therefore the AVERAGE velocity of all the lines through that point. Averaging
those conditional fields gives a field whose ODE carries the noise distribution
onto the action distribution. That is the flow-matching theorem, and one sentence
of it is enough here.

Say the third argument out loud, it is not decoration: the expert is conditioned
on the PREFIX — the VLM's own output over the images, the language and the state
— and never on the raw observation. Two later slides are consequences of exactly
that. Knowledge insulation works by detaching this tensor, which is only possible
because it is a tensor and not an image. And the ten Euler steps on the next
slide cost ten passes of the expert but only one pass of the VLM, because the
prefix is computed once and cached.

Why a field rather than regressing actions directly? Multimodality — the two
clusters on the left. Reaching round the mug on the left and on the right are
both correct; their AVERAGE drives straight into the mug. A direct regression is
forced to output that average. The velocity field is not: the two modes are
separated by where the sample happens to start, so both survive.

If someone asks "why the straight line and not some other path" — straight
(optimal-transport) paths give the constant target above and, empirically, a
field that needs few integration steps. Curved paths are legal, just worse.

Ninety seconds. Do NOT mention SnapFlow yet.
-->

---

# Flow matching: and paying for it at inference

<img src="/figs/fig_flow_steps_only.png" class="w-[70%] mx-auto mt-1" />

<div class="grid grid-cols-5 gap-10 mt-2 text-sm">
<div class="col-span-3">

$$x_{t-\Delta} = x_t - \Delta \cdot v_\theta(x_t,\, t,\, \text{prefix}) \qquad \Delta = 0.1,\; t: 1 \rightarrow 0$$

<p class="note mt-1">The <strong>prefix is computed once</strong> and cached: the
VLM runs once, the expert ten times.</p>

</div>
<div class="col-span-2">

<div class="takeaway warn">
<strong>10 Euler steps = 10 forward passes of the action expert</strong>, for one
decision.
</div>

</div>
</div>

<!--
Training is one pass; inference is not. To produce an actual chunk we start from
noise and integrate the field back down to t = 0, in ten fixed Euler steps of
size 0.1.

Watch the arithmetic here, because the latency slide will check it: the ten steps
are ten passes of the ACTION EXPERT, not of the whole model. The vision-language
prefix is computed once and cached. That is why dropping nine steps takes 922 ms
to 255 ms and not to 92 ms, and it is why the prefix is what remains at the end.

Why ten and not two? The field is curved — that is exactly the grey path in the
figure. Euler follows the tangent, so the step size bounds the discretisation
error. Fewer steps means a chunk that drifts off the manifold of plausible
actions, and in closed loop that shows up as jerky or plainly wrong motion.

Leave the cost hanging. It gets answered in part 2.
-->

---

# RECAP: learning from your own rollouts

<div class="text-center mt-2">
  <img src="/figs/pipeline.svg" class="w-[88%] mx-auto" />
</div>

<div class="grid grid-cols-2 gap-12 mt-5 text-sm">
<div>



</div>
</div>

<!--
RECAP in full, the way our own docs gloss it: REinforcement learning via
Advantage-Conditioned Policies. It is the name of the recipe, introduced by
Amin et al., "pi*-0.6: a VLA that learns from experience", arXiv 2511.14759,
Physical Intelligence, 2025. The paper names the recipe but does not spell the
acronym out, so do not present the expansion as theirs.

Walk the figure left to right and say the word ROUND twice, because that is the
only structure in it.

  Round 1 is the demonstrations. The critic is trained FIRST, on the expert data
  — it has to exist before any policy does, because it is what turns a dataset
  into a LABELLED one. It scores every frame, the advantage clears the threshold
  or it does not, each frame gets a + or a -, and only then do we train the
  policy. That first policy is already advantage-conditioned, on expert data.

  Round 2 is that policy's own rollouts. Identical boxes, identical order: the
  critic is fine-tuned on the rollouts, relabels them, and the policy is
  fine-tuned on the result.

Make the shared part explicit, because it is the usual misreading: the critic is
not something that shows up in round 2. Both rounds run the whole loop. The only
thing that changes between them is which dataset enters on the left.

Our delta runs through the whole results section: 10x smaller, and no human in
the rollouts — they used a 5-billion-parameter model AND mixed corrective
teleoperation into the rollout data. The second difference matters more.

If you see puzzled faces, answer the obvious question now: is this reinforcement
learning? No policy gradient, nothing online. It is critic-based relabelling plus
conditioned supervised fine-tuning — chosen deliberately because it needs neither
reward shaping nor online-RL infrastructure. Otherwise save it for Q&A.
-->

---

# The critic: “how far along am I?”

<div class="grid grid-cols-2 gap-10 mt-4">
<div class="pt-2">

Predicts **normalised time remaining**, not good/bad.
<span class="dim">−1 at the start, 0 when done.</span>

- A **distribution**, not a scalar: C51, 201 bins
- Same backbone, truncated to 8 layers
- Used **only for labelling**, never at inference

</div>
<div>

<img src="/figs/fig_critic_slide.png" class="w-full" />

</div>
</div>

<!--
This is a real trace from the demonstration-trained critic on one expert episode,
not a schematic.

Point at the bump around step 30–40 and the dip at 60: the gripper closes on
nothing, the critic notices, the value falls back. THAT is what makes per-frame
advantages informative within a single trajectory. If a plain success/failure
label were used, every frame in this episode would be positive — including the
missed grasp.

(Outcome-only labelling turns out to work almost as well. Do not spoil it here.)

Why categorical rather than regression: multimodal targets. "Stop regressing",
Bellemare et al.'s distributional RL line of work — C51.
-->

---

# Making the critic honest

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

<div class="kicker mb-2">Problem</div>

Trained only on **successful** demonstrations, the critic scores failed rollouts
close to successes.

<div class="kicker mb-2 mt-7">Fix</div>

Failed episodes get a large constant added to their remaining time, so their target
clamps to the **bottom of the value support**.

</div>
<div class="pt-8">


</div>
</div>

<!--
This is a distribution-shift bug, not a robotics bug. Train on successes only,
evaluate on failures, get overconfident predictions: the same failure mode as any
classifier that never saw the negative class.

Through the pessimistic returns, frames of failed episodes now receive strongly
negative advantages, which is what you want them to receive.

This is the kind of thing you do not find in the paper you are reimplementing. It
cost us a training round to discover.

The next slide is the second one of those, and it has the same shape: the critic
looked fine on the metric it was trained for, and was not fine.
-->

---

# State dropout

<p class="note text-center" style="margin-bottom:0">The critic trained <strong>without</strong> state dropout · LIBERO episode 4</p>

<img src="/figs/fig_gripper_shortcut.png" class="w-[60%] mx-auto" />

<div class="grid grid-cols-2 gap-10 mt-3">
<div class="takeaway warn">
The value steps at frames <strong>58.6</strong> and <strong>109.5</strong>; the
gripper moves at <strong>58.7</strong> and <strong>109.3</strong>. The critic is
reading the gripper, not the scene.
</div>
<div class="takeaway">
<code>--state_dropout 0.2</code> zeroes the state, so a fifth of the time the
shortcut simply is not there.
</div>
</div>

<!--
LIBERO episode 4, critic trained WITHOUT state dropout. Top: state dimension 7,
the gripper. Bottom: the critic's expected value against the ground-truth ramp.

The coincidence is measured, not eyeballed. The two largest jumps in the value
curve sit at frames 58.6 and 109.5; the gripper transitions at 58.7 and 109.3.
Within a fifth of a frame, twice.

Between the jumps the value is nearly FLAT while ground truth keeps rising. In
that stretch the critic is not tracking progress, it is holding what the gripper
told it.

The shortcut: gripper closed means mid-task, gripper open at the end means done.
That scores well on demonstrations and says nothing about whether the object
reached the bowl. Shortcut learning, the robotics version of a classifier reading
the watermark.

The state is one token in the prefix [image tokens | language | state], and the
critic was leaning on it almost exclusively. State dropout was our design
decision, not RECAP's.

On a real robot, a critic that judges from IMAGES is the only kind that could
supply a success signal without a simulator to ask.

Provenance, if asked: the arrays were never saved. Both curves come from the
rendered PNGs in outputs/plots_dropout/ via assets/extract_dropout_traces.py,
each axis calibrated from its own tick marks. Re-running the critic needs a GPU
and the checkpoint.

That closes the critic: pessimistic on failures, and no longer reading the
gripper. Next is the only thing we ever use it for — turning its output into a
label on every frame.
-->

---

# Advantage and the threshold f⁺

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

<div class="kicker mb-2">Per-frame advantage · N-step TD</div>

$$A_t = \textstyle\sum_{k<N} r_{t+k} + V(s_{t+N}) - V(s_t)$$

<p class="note">“Was this step better than expected?”</p>

<div class="legend mt-5 text-sm">

| | |
|---|---|
| <em>V</em>(<em>s</em>) | the critic: expected **normalised time-to-completion**, −1 at the start, 0 when done |
| <em>s<sub>t</sub></em> | the frame it sees — two camera images and the joint state |
| <em>r</em> | a constant **time cost**, −1/<em>T</em><sub>max</sub> per step |
| <em>N</em> | the lookahead, **50 frames** |

</div>

</div>
<div>

<div class="kicker mb-2">Threshold</div>

$$A_t > \varepsilon \;\Rightarrow\; \texttt{+} \qquad \text{else} \qquad \texttt{−}$$

<p class="note">ε = the 100(1−f⁺)-th percentile over that task's <em>successful</em> frames.</p>

<div class="kicker mb-2 mt-8">Classifier-free guidance</div>

$$v^{\text{cfg}} = v_\theta + w\,\bigl(v^{+}_\theta - v_\theta\bigr)$$

<p class="note">
<em>v</em><sup>+</sup><sub>θ</sub> = the velocity field with the <code>+</code> token in the
prefix, <em>v</em><sub>θ</sub> = with the token dropped.
</p>

<p class="note mt-2">
<em>w</em> = 0 unconditional · <em>w</em> = 1 positive conditional · <em>w</em> &gt; 1 extrapolates past the
positive mode.
</p>

</div>
</div>

<!--
Do not derive the TD residual. The audience needs exactly two things:
(1) it is a per-frame "better than expected?" score, and
(2) f-plus is a knob controlling what fraction of frames may be positive.

N = 50. TD rather than Monte Carlo because the bootstrapped value keeps variance
manageable over 300-step episodes.

The legend is there so nobody has to ask; do not read it out. If someone does
ask about the reward, the honest answer is the interesting one: there is no
shaped reward at all. Every step costs the same −1/T_max, so the sum over N
steps is a CONSTANT, and the whole advantage is the amount the critic's value
moved over those 50 frames minus that fixed time budget. Progress faster than
the clock is positive, slower is negative. That is also why the critic has to be
honest — it is the only thing in the formula carrying information.

Implementation note, if pressed: it is computed as (R_t − V_t) − (R_{t+N} −
V_{t+N}) with R the empirical normalised return, which is the same quantity
rearranged. Frames within N of the episode end fall back to the Monte-Carlo
form.

Mechanics: the label is carried as one extra token in the language prefix, with
token dropout 0.3 — so the model simultaneously learns an unconditional
predictor, which is what makes CFG possible at inference.

The CFG analogy for non-specialists: the same trick image generators use to
enforce "more prompt", applied to "more good behaviour".

Tease f-plus deliberately. Two slides in part 3 pay it off.
-->

---

# Knowledge insulation

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

The randomly initialised action expert would **destroy** the pretrained VLM
knowledge with its gradients.

$$\mathcal{L} = \underbrace{\mathcal{L}_{\text{AR}}}_{\text{backbone}} \;+\; \underbrace{\mathcal{L}_{\text{FM}}}_{\text{expert only}}$$

- Prefix **detached** before the expert sees it, and every VLM parameter frozen
  for that forward pass
- The backbone's *only* training signal is an **autoregressive loss over
  FAST-tokenised actions**

</div>
<div class="pt-2">


<div class="takeaway mt-5">
The backbone still <em>learns about actions</em> — just in the representation it
is already good at: <strong>next-token prediction</strong>.
</div>

</div>
</div>

<!--
Driess et al., arXiv 2505.23705.

The problem in one sentence: at step 0 the action expert is random, so its
gradients are noise, and those gradients flow straight back through the
cross-attention into a backbone that took millions of image-text pairs to train.
The usual symptom is a policy that stops responding to language — it has
forgotten what "the middle drawer" means while learning to move a joint.

Two mechanisms, both needed, and it is worth being concrete because "stop
gradient" sounds like one line of code:
  1. The prefix tensor is DETACHED before the expert consumes it, which cuts the
     self-attention route.
  2. Every VLM parameter is set requires_grad=False for the duration of the
     flow-matching forward pass, which cuts the cross-attention, residual and
     MLP routes as well. Detaching alone is not enough.
  Both are restored before the AR loss backward, which is what still trains the
  backbone.

So the two loss terms in the sum train disjoint parameter sets, in one optimiser
step: AR trains the backbone, flow matching trains the expert. Weighted 1:1.

Advantage conditioning is active FROM TRAINING STEP 1. The base policy
understands the +/- tokens before it has ever seen a rollout. Without that,
fine-tuning would have to teach both a new token and a new behaviour at once, on
20k steps of data.

Be honest about the framing if anyone asks: our no-KI baseline changes the
pre-training recipe as a whole — insulation, FAST AR co-training, and an inert
conditioning token — not gradient insulation in isolation. So "+5 to +11 for KI"
means the recipe, not the stop-gradient by itself. The paper says so.

Next slide: what "FAST-tokenised" actually means, because the AR loss is doing
all the work here.
-->

---

# FAST+: actions the backbone can read

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

<div class="kicker mb-2">One chunk → a short token string</div>

20 × 7 floats
&nbsp;→&nbsp; normalise per joint
&nbsp;→&nbsp; **DCT** along time
&nbsp;→&nbsp; quantise
&nbsp;→&nbsp; flatten
&nbsp;→&nbsp; **BPE**

- **DCT**: smooth trajectories put nearly all energy in a few low frequencies —
  the rest quantise to **zero**
- **BPE**: merges the long runs of zeros away

<p class="note mt-2">
<strong>FAST+</strong> = the universal tokenizer, BPE trained on ~1 M real robot
trajectories. Used off the shelf — nothing fitted per dataset.
</p>

</div>
<div class="pt-2">

<div class="takeaway">
1024 <strong>rarely used ids</strong> of the VLM vocabulary are repurposed as
action tokens; their embeddings are re-initialised.
</div>

<div class="takeaway warn mt-5">
The AR loss is then just <strong>cross-entropy on the next token</strong>. No new
head, no new objective — the backbone does what it was pretrained to do.
</div>

</div>
</div>

<!--
FAST in full: Frequency-space Action Sequence Tokenization. Pertsch et al.,
"FAST: Efficient Action Tokenization for Vision-Language-Action Models",
arXiv 2501.09747, 2025. The "+" is not a different algorithm: FAST+ is the
UNIVERSAL tokenizer they released alongside it, the same DCT-quantise-BPE
pipeline with the BPE vocabulary trained once on ~1 M real robot trajectories
rather than fitted per dataset.

Motivate the problem first, it is not obvious. We want the backbone to learn from
actions, but the backbone is a language model: it learns by predicting discrete
tokens. So the action chunk has to become a token string.

The naive answer is per-dimension binning: discretise each of the 7 joints at
each of the 20 steps into, say, 256 bins. That gives 140 tokens per chunk, and
they are horribly redundant — consecutive control steps are nearly identical, so
the model can predict the next token almost perfectly by copying the previous
one, and learns nothing. High accuracy, no signal. That is the failure FAST
exists to fix.

The pipeline:
  - Normalise each joint to [-1, 1] using the 1st and 99th percentile of the
    training data, so no single dimension dominates the quantisation.
  - Apply a discrete cosine transform along TIME, independently per joint. Same
    transform JPEG uses on image blocks. A robot trajectory is smooth, so almost
    all of its energy sits in the first few coefficients.
  - Quantise the coefficients with a scale factor and round. The high-frequency
    ones round to exactly zero — that is the compression, and it is lossy in a
    way that only removes jitter.
  - Flatten the coefficient matrix into one sequence, then run byte-pair encoding
    over it. BPE merges the long runs of zeros into single tokens. The result is
    roughly an order of magnitude shorter than the naive binning, and the
    redundancy is gone.

FAST+ is the part worth naming out loud: rather than fitting a tokenizer to
LIBERO, Physical Intelligence released a UNIVERSAL one — the BPE vocabulary
trained on about a million real robot action sequences across many embodiments
and control frequencies. We load it off the shelf, exactly as one would load a
text tokenizer. Nothing about it is tuned to our robot.

The vocabulary detail: those 1024 action tokens have to live somewhere in the
VLM's vocabulary. We take 1024 rarely used ids and re-initialise their input
embeddings and output rows. So no vocabulary resize, no architecture change —
the lm_head already has a slot for every one of them.

And then the AR loss is genuinely just cross-entropy over the next token, over
the action-token span only, with the prefix masked out at -100. That is the
punchline: the backbone is never asked to do anything it was not pretrained to
do. It reads images and language and predicts the next token; the tokens just
happen to be a trajectory.

If asked whether the FAST branch is used at inference: no. It exists only to
supply the backbone with a gradient. All deployed actions come from the
flow-matching expert.
-->

---

# SnapFlow: 10 steps → 1

<div class="grid grid-cols-2 gap-10 mt-4">
<div class="pt-2">

Distil the ten Euler steps into a **single time-conditioned jump**.

<div class="takeaway warn mt-5">
<strong>Not the same as taking one Euler step.</strong> That follows
<em>v</em>(<em>x</em><sub><em>t</em>=1</sub>) and leaves the path. SnapFlow
<em>trains</em> the single step to land on the integral.
</div>

<div class="takeaway mt-4">
So the target cannot come from the data alone. It has to come from the
<strong>original policy's own ten-step solve</strong>.
</div>

</div>
<div>

<img src="/figs/fig_flow_steps.png" class="w-full mt-4" />

</div>
</div>

<!--
Signpost the switch: everything so far in part 2 was about making the policy
BETTER. This is the one that makes it FASTER, and it is the open problem left
hanging at the end of part 1.

On the Jetson the ten Euler steps are the cost driver. That is the whole
motivation.

The grey dashed line answers "why not just use fewer steps?" One Euler step of
size 1 IS the cheap option, and it is free. It follows the initial velocity, the
field curves away underneath it, and it lands nowhere near the target. That is
why the step count cannot simply be turned down.

Set up the next two slides explicitly: to train a single step that lands on the
integral we need two things — somewhere to PUT the "how far am I jumping?"
information, and a target to regress the jump onto. One slide each.
-->

---

# SnapFlow: what actually gets trained

<div class="grid grid-cols-2 gap-10 mt-4">
<div>

<div class="kicker mb-2">A second time input</div>

The expert already takes the flow time *t*. Add a **target time _s_**, and
reinterpret the output as the *average* velocity carrying <em>x<sub>t</sub></em>
from *t* to *s*.

| | |
|---|---|
| *s* = *t* | the ordinary instantaneous velocity |
| *t* = 1, *s* = 0 | **the whole jump, one pass** |

<p class="note mt-2">
sinusoidal embedding of <em>s</em> → Linear · SiLU · Linear → <strong>added</strong> to
the action + time embedding.
</p>

</div>
<div class="pt-2">

<div class="takeaway warn">
That MLP is <strong>initialised to all zeros</strong> — weights <em>and</em> biases.
At step 0 the <em>s</em> branch contributes exactly nothing, so the network
<strong>is</strong> the ten-step policy.
</div>

<div class="kicker mb-2 mt-6">Trainable</div>

- the target-time MLP
- the action-expert transformer
- action in/out projections, action-time MLP

<p class="note mt-2">The VLM backbone is <strong>frozen throughout</strong>.</p>

</div>
</div>

<!--
The question this slide answers is: what new parameters exist, and what is the
starting point?

The architecture change is small and worth stating precisely, because people
expect a distilled model to be a NEW, smaller network. It is not. It is the same
action expert with one extra scalar input.

  - Today the expert is conditioned on the flow time t: "where am I along the
    path?" Its output is the instantaneous velocity there.
  - SnapFlow adds a target time s: "and where am I trying to get to?" The output
    is redefined as the AVERAGE velocity over the interval [t, s] — so one step
    of size (t - s) along it lands exactly at time s.
  - Set s = t and the interval has zero width: the average velocity IS the
    instantaneous velocity. The old behaviour is a special case, not a
    replacement. That is what lets the flow-matching loss keep working unchanged.
  - Set t = 1, s = 0 and one step covers the whole path. That is the deployed
    setting.

Mechanically: s gets the same sinusoidal embedding treatment as t, goes through a
two-layer MLP, and the result is ADDED to the existing action-plus-time
embedding. Additive, not concatenated — which is what makes the zero
initialisation possible.

The zero initialisation is the detail I would keep if I could keep only one.
Both linear layers, weights and biases, start at exactly zero. So on the first
training step the s branch outputs the zero vector, the addition is a no-op, and
the model's predictions are bit-for-bit those of the trained ten-step policy.
Distillation starts from a policy that already scores 68 % rather than from
noise. There is no warm-up phase and nothing to recover from — the loss curve
starts where the original ended.

This is the same trick as zero-initialised residual branches in ControlNet or
the zero-init gates in adapters. Say that if the audience is an ML audience.

On what trains: the VLM backbone is frozen for the entire distillation run —
knowledge insulation taken to its limit. Only the expert and the small
projections around it move. It is also why distillation is cheap: 15k steps
against 250k for pre-training, and no backbone gradients at all.
-->

---

# SnapFlow: the policy is its own teacher

<img src="/figs/fig_snapflow_train.png" class="w-[70%] mx-auto mt-1" />

<div class="grid grid-cols-2 gap-10 mt-1 text-sm">
<div>

$$\mathcal{L} = \alpha\, \mathcal{L}_{\text{FM}} + (1-\alpha)\, \lambda\, \mathcal{L}_{\text{cons}} \qquad \alpha = 0.5,\ \lambda = 0.1$$

<p class="note mt-1">
<strong>FM</strong> at <em>s</em> = <em>t</em>, against dataset actions — anchors the base field.<br>
<strong>Consistency</strong>: the jump against the teacher's two-half-step chord.
</p>

</div>
<div>

<div class="takeaway warn">
The teacher is the <strong>same weights under <code>no_grad</code></strong>. Two
half-steps are strictly better than one — so the student always has something to
chase, and the target improves as the student does.
</div>

</div>
</div>

<!--
This is the slide the "how can it teach itself?" question lives on. Take ninety
seconds and walk the loop.

The consistency term, concretely:
  - Draw pure noise x_1.
  - TEACHER branch, under torch.no_grad, so no gradient flows through it:
      v_1    = f(x_1,    t=1,   s=1)        the instantaneous velocity at noise
      x_half = x_1 - 0.5 * v_1              one Euler HALF-step
      v_half = f(x_half, t=0.5, s=0.5)      instantaneous velocity there
      v_bar  = 0.5 * (v_1 + v_half)         the average — "the chord"
  - STUDENT branch, with gradients:
      v_student = f(x_1, t=1, s=0)          one jump, the deployed path
  - Loss: MSE(v_student, v_bar).

So the answer to "teacher and student" is: there is no second network and no
stored teacher checkpoint. The same weights are called three times per step,
twice without gradients and once with. The only asymmetry is HOW they are
called — two half-steps versus one whole step.

Why that is not circular, which is the real question:
  Two half-steps of Euler are a strictly better approximation of the integral
  than one whole step, for the same field. So the teacher branch is always a
  little ahead of the student branch. Training the student to match it moves the
  student forward — and because the student IS the teacher, the teacher's
  two-half-step answer moves forward with it. Next step, a slightly better
  target. It bootstraps.
  Recursively: 1 step chases 2, 2 chases 4, 4 chases 8. Nobody ever computes the
  ten-step solve during training, but the fixed point of the recursion is the
  full integral. This is the shortcut-model / consistency-distillation argument.

Why the FM term is still there, at half the total weight: the consistency term
alone has a trivial solution — a constant field is perfectly self-consistent and
completely useless. The flow-matching term is anchored to real dataset actions
and forbids that collapse. It is also what keeps s = t behaving like the
original policy, so nothing about the ten-step path degrades while the jump is
being learned.

Two safety details if asked:
  - Teacher velocities are clamped to +/- 20. Early in training a badly scaled
    prediction would otherwise produce an enormous shortcut target and blow up
    the student.
  - Advantage conditioning stays ON during distillation, with token dropout 0.3,
    so the unconditional branch survives and CFG still works on the distilled
    policy.

Data mixture: the same one the original was fine-tuned on — critic-labelled
rollouts with demonstration batches at ratio 0.5. And the rollout frames KEEP
their real +/- labels. Forcing them all positive is exactly the mistake one would
make first, and it makes the flow-matching term imitate advantage-negative
rollout actions under the positive token. We made it.

15k steps, and that number is not arbitrary — the accuracy/latency slide in part
3 explains why longer is worse.
-->

---

# Guidance baking

<div class="grid grid-cols-2 gap-10 mt-4">
<div class="pt-2">

CFG needs **two** forward passes per step. Distil the **blended** field at
<em>w</em> = 1.5 and a single unguided pass reproduces guided behaviour.

<div class="takeaway warn mt-6">
The cost: guidance stops being a <strong>runtime</strong> parameter. Changing <em>w</em>
means a new distillation run.
</div>

</div>
<div>

| variant | spatial | goal | long | avg |
|---|---:|---:|---:|---:|
| no baking | 74.2 | **84.2** | **40.0** | **66.1** |
| self-distilled | 67.0 | 72.4 | 32.6 | 57.3 |
| frozen original | **76.8** | 75.2 | 25.2 | 59.1 |

</div>
</div>

<!--
Following Meng et al., CVPR 2023, on distillation of guided diffusion models.

This is the SnapFlow machinery from the last slide, pointed at a second cost.
Distillation removed the ten solver steps; guidance is the other factor of two,
because CFG needs a conditional AND an unconditional pass at every one of them.
The idea: make the teacher's target the BLENDED field rather than the plain
conditional, and the student learns the guided behaviour outright.

"Self-distilled" in the table is exactly the loop from the previous slide — same
weights, teacher branch under no_grad. And here that loop FAILS, at 57.3, which
is worth being honest about: the data-anchored flow-matching term pulls the
student back toward the unguided field, and the blend's unconditional branch,
trained by no loss term at all, drifts. Under guided self-distillation the
bootstrap argument breaks — the target tracks the student's own conditional,
whose fixed point collapses onto the unconditional.

A FROZEN copy of the original supplying both loss terms recovers the mechanism,
but only where guidance helps the original: spatial 76.8, while `long` collapses
to 25.2.

Conclusion to state plainly: guidance baking is worthwhile only where the
original demonstrably profits from w > 1. The plain distilled policy is what we
deploy.
-->

---
layout: section
---

<div class="kicker mb-4">Part 3</div>

# Results and analysis

<p class="mt-4 text-lg">
3 suites · 10 tasks each · 50 episodes per task · n = 500
</p>

<!--
Clock check. You should reach this slide at about minute 27 of 40. Parts 1 and 2
are roughly two thirds of the deck but only two thirds of the time, because part
3 has the four analysis slides that need room to breathe.

Under 25 means you rushed part 2 — slow down, the method depth is the point of
the extra slides.

Past 31, drop in this order:
  1. "Is the critic needed at all?"
  2. "Guidance only pays off after co-training"

Past 34, also drop "SnapFlow: what actually gets trained" and "FAST+" retro-
actively from the next run — both stand alone as notes-only material — and go
straight to the headline table.

The 45-minute limit is a ceiling on the talk itself, so 40 leaves five minutes of
slack rather than five minutes of questions.
-->

---

# Results

<table class="mt-4">
<thead>
<tr><th>method</th><th>spatial</th><th>goal</th><th>long</th><th>avg</th><th>ms / chunk</th></tr>
</thead>
<tbody>
<tr v-click><td>SmolVLA, no KI</td><td>65.0</td><td>70.6</td><td>30.2</td><td>55.3</td><td class="dim">—</td></tr>
<tr v-click><td>SmolVLA + KI &nbsp;<span class="dim">(base)</span></td><td>71.2</td><td>75.8</td><td>41.6</td><td>62.9</td><td class="dim">—</td></tr>
<tr v-click><td>+ rollout data &nbsp;<span class="dim">(f⁺ = 0.8)</span></td><td>77.8</td><td>80.0</td><td class="neg">35.8</td><td>64.5</td><td class="dim">—</td></tr>
<tr v-click><td>+ co-training &nbsp;<span class="dim">(f⁺ = 0.4)</span></td><td>75.4</td><td>84.2</td><td><strong>43.8</strong></td><td>67.8</td><td class="dim">—</td></tr>
<tr v-click><td>+ co-training &nbsp;<span class="dim">(f⁺ = 0.8)</span></td><td><strong>80.0</strong></td><td><strong>86.2</strong></td><td>38.2</td><td><strong>68.1</strong></td><td>922</td></tr>
<tr v-click><td>+ SnapFlow distillation</td><td>74.2</td><td>84.2</td><td>40.0</td><td>66.1</td><td><strong>255</strong></td></tr>
</tbody>
</table>

<div v-click class="grid grid-cols-3 gap-6 mt-7 text-sm">
<div class="takeaway"><strong>1.</strong> KI is the largest single effect.</div>
<div class="takeaway warn"><strong>2.</strong> Rollouts help, but not on <code>long</code>.</div>
<div class="takeaway"><strong>3.</strong> Demonstrations repair that.</div>
</div>

<!--
Reveal row by row and let each land. Six clicks, then the three claims.

Percent success at each method's best guidance weight; every conditioned method
gets the identical five-point sweep.

Claim 1: +5 to +11 points. That is the PRE-TRAINING RECIPE, not the RL part.
Claim 2: rollout post-training transfers, but only on the short-horizon suites.
         `long` gets WORSE — 35.8 versus 41.6.
Claim 3: 68.1 % versus 62.9 % for the base, 55.3 % without KI.

Make exactly three claims. The two f-plus rows are the next four slides.

The ±2 point standard error matters for f-plus 0.4 vs 0.8 on `long` (43.8 vs
38.2) — flag it when you get there, not here.
-->

---

# Why does `long` regress?

<img src="/figs/fig_long_regress.png" class="w-[76%] mx-auto mt-2" />

<div class="takeaway warn mt-6 text-base">
Rollout post-training <strong>amplifies the quality of the rollouts you feed
it</strong>. Where most rollouts fail, even the positives come from mediocre
behaviour: <strong>learning from a weak teacher</strong>.
</div>

<!--
Left panel is base-policy success per suite, used as a STAND-IN for rollout
quality — the rollouts were collected by exactly that policy. Say "stand-in", not
"measurement": per-suite rollout success was not logged separately (600 episodes,
64.3 % success overall).

The chain:
- spatial / goal: ~75 % of episodes succeed → plenty of good behaviour to
  reinforce → it helps.
- long: most rollouts fail → even the positively labelled frames come from
  mediocre behaviour → the policy falls below its starting point.

And this is exactly where we differ from RECAP. Their human teleoperation
corrections insert good behaviour precisely where the policy lacks it. In our
autonomous setting nothing plays that role — until we co-train on the expert
demonstrations.

That is what the demonstrations are actually for: not more data, but good
behaviour where the rollouts have none.

This is the slide the whole talk is built around. Take the time.
-->

---

# f⁺ decides what “negative” means

<div class="grid grid-cols-5 gap-8 mt-4">
<div class="col-span-3">

<img src="/figs/fig_labels.png" class="w-full" />

</div>
<div class="col-span-2 pt-6">

<div class="takeaway warn">
At f⁺ = 0.3, <strong>31 % of all frames</strong> are negative-labelled frames
from <em>successful</em> episodes.
</div>

<div class="takeaway mt-5">
Those are the approach and transport motions. The policy is trained to treat
<strong>necessary actions as behaviour to avoid</strong>.
</div>

</div>
</div>

<!--
Table II of the paper, drawn so the mislabelled frames are visible. The hatched
red block is the damage.

At f-plus = 0.8 the negative label is reserved for genuinely low-advantage
behaviour, mostly from failed episodes.

The opposite error — the hatched BLUE block, pos:fail — grows with f-plus: at
0.8, 16 % of all frames are positive labels sitting on failed episodes. That is
the cost of a permissive threshold, and it is much cheaper than the other error.
Mention only if asked.
-->

---

# …and what that does to the policy

<div class="grid grid-cols-5 gap-8 mt-4">
<div class="col-span-3">

<img src="/figs/fig_dose_slide.png" class="w-full" />

</div>
<div class="col-span-2 pt-6">

<div class="takeaway warn">
When the labels are wrong, <strong>guidance makes it worse</strong>: it
extrapolates <em>away</em> from useful behaviour.
</div>

<div class="takeaway mt-5">
Set the threshold <strong>permissively</strong>. We use f⁺ = 0.8 throughout.
</div>

</div>
</div>

<!--
Reading the figure:
- f-plus 0.3: the ENTIRE sweep sits below the base policy.
- f-plus 0.4: unguided still edges out the base at 72.8, but guidance erodes it
  steadily, down to 65.4 at w = 2.
- f-plus 0.8: improves over the base, and moderate guidance helps.

The failure is MONOTONE in w, which is what tells you the guidance direction is
broken rather than noisy: the v-plus minus v
direction points away from useful behaviour.
-->

---

# Guidance only pays off after co-training

<div class="grid grid-cols-2 gap-12 mt-4">
<div class="pt-2">

<div class="kicker mb-2">Gain from guidance on spatial</div>

| fine-tuning mix | gain |
|---|---:|
| rollout-only, f⁺ = 0.8 | +1.0 |
| **co-trained**, f⁺ = 0.8 | **+6.6** |

<div class="takeaway warn mt-6">
Hypothesis: <strong>capacity</strong>. A 450 M model does not retain its mode
separation through rollout-only fine-tuning.
</div>

</div>
<div>

<div class="kicker mb-2">Diagnostic: force the negative token</div>

| policy | suite | positive | negative |
|---|---|---:|---:|
| f⁺ = 0.8 | long | 35.8 | 34.8 |
| f⁺ = 0.4 | long | 33.2 | 29.4 |
| f⁺ = 0.3 | spatial | 66.0 | **66.4** |
| f⁺ = 0.3 | goal | 73.6 | **76.4** |

<p class="note mt-3">
At f⁺ = 0.3 the negative token scores <strong>higher</strong>. The separation is
gone.
</p>

</div>
</div>

<!--
DROPPABLE if you are running late, but drop "Is the critic needed at all?" first.

Rollout-only: the gain over the base is already there at w = 0 (76.8 vs 71.2). So
it is the TRAINING that helps, not the inference-time steering.
Co-trained: 73.4 at w=0 → 80.0 at w=1.5 on spatial, and +2.4 on goal.

The probe: if + and − mean anything, forcing the negative token should hurt. At
f-plus 0.3 it does not — positive, negative and unconditional have collapsed into
a narrow band, so CFG has nothing to amplify.

Say the capacity story AS A HYPOTHESIS. The demonstration batches act as explicit
replay. The paper says "our experiments are consistent with this capacity view
but do not isolate it" — that is the right register here too. Do not oversell.
-->

---

# Where the policies still fail

<img src="/figs/lib10_dualobj_fail.png" class="w-full mt-2" />
<p class="note mt-2">“put <strong>both</strong> the alphabet soup <strong>and</strong> the cream cheese box in the basket”</p>

<div class="grid grid-cols-2 gap-10 mt-5">
<div class="takeaway warn">
Tasks chaining <strong>two</strong> pick-and-place subgoals: below
<strong>16 %</strong> for <em>every</em> method, including the base.
</div>
<div class="takeaway">
Single-subgoal <code>long</code> tasks reach <strong>70–80 %</strong>.
</div>
</div>

<!--
The first object lands in the basket, the second is never sequenced, timeout.

So the low `long` average is a CAPABILITY CEILING from error compounding across
subgoals — not a weakness of any particular post-training method. No labelling
scheme and no data mixture we tried touches these tasks. This is where the 450 M
parameter budget actually runs out.

Statistical care: per-task numbers at 50 trials carry about ±14 % at 95 %
confidence, so only talk about patterns that hold across all methods and sit far
outside that band. This one does: sub-16 % everywhere versus 70–80 % everywhere.

Optional if time allows: play cotrain_lib10T7_putBOTH_FAIL_ep0.
-->

---

# What co-training actually adds

<div class="grid grid-cols-5 gap-10 mt-3">
<div class="col-span-3">

<img src="/figs/drawer_compare.png" class="w-full" />

<div class="grid grid-cols-2 gap-5 mt-4">
  <Clip src="250k_goalT0_drawer_FAIL_ep0" verdict="fail" label="base policy" />
  <Clip src="cotrain_goalT0_drawer_SUCCESS_ep0" verdict="success" label="co-trained policy" />
</div>

</div>
<div class="col-span-2 pt-10">

<div class="takeaway warn">
The base policy <strong>never</strong> opens a drawer, so its rollouts contain
no positive drawer examples to reinforce.
</div>

<div class="takeaway mt-5">
Rollouts <strong>sharpen what the policy already shows</strong>. Missing skills
have to come from the demonstrations.
</div>

</div>
</div>

<!--
Close the loop explicitly: "that was the difference you saw at the start."

Top filmstrip: the co-trained policy reaches the handle and pulls the drawer
open. Bottom: the base policy hovers near the cabinet without ever engaging the
handle, until timeout.

This is the same statement as the `long` regression, seen from the other side —
and the reason both best configurations are co-trained.

Let the clips run while you say the last sentence.
-->

---

# Is the critic needed at all?

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

Bypass the critic entirely: label by **episode outcome** alone.

| labelling | spatial | goal | long | avg |
|---|---:|---:|---:|---:|
| critic, f⁺ = 0.8 | **77.8** | 80.0 | 35.8 | 64.5 |
| outcome-only | 72.8 | **81.8** | **40.0** | **64.9** |

</div>
<div class="pt-4">

<div class="takeaway">
<strong>Indistinguishable</strong> on average: 64.9 vs. 64.5, well inside ±2
points.
</div>

<div class="takeaway warn mt-5">
The gap we did not close: outcome-only <strong>×</strong> co-training was never
run.
</div>

</div>
</div>

<!--
DROP THIS ONE FIRST if you are behind schedule.

The scheme: every frame of a successful episode positive, every frame of a failed
one negative. No values, no advantages, no thresholds.

So the critic's within-trajectory granularity is NOT required to benefit from
rollout data on these suites. A plain success/failure bit does the same job.

If you keep the slide, do not be defensive. Name the missing cell and stop: the
critic buys granularity we cannot yet show is worth its cost. The experiment that
would settle it is one 90-minute fine-tuning run we did not get to.
-->

---

# SnapFlow: accuracy versus latency

<div class="grid grid-cols-2 gap-12 mt-4">
<div>

| policy | spatial | goal | long | avg |
|---|---:|---:|---:|---:|
| original, 10-step | **80.0** | **86.2** | 38.2 | **68.1** |
| SnapFlow, 1 step | 74.2 | 84.2 | **40.0** | 66.1 |

<div class="takeaway mt-6">
<strong>Within 2 points</strong>, and <em>better</em> on <code>long</code>, for
3.6× less latency.
</div>

</div>
<div class="pt-2">

<div class="takeaway warn">
<strong>Over-distillation.</strong> 15k → 120k steps <em>lowered</em> the
distillation loss 0.106 → 0.047 and cost about <strong>ten points</strong> of
success.
</div>

<p class="note mt-4">The proxy loss is not the objective.</p>

</div>
</div>

<!--
We distil the strongest configuration: co-trained, f-plus = 0.8.

Why that one is the right choice to deploy: on edge robots long-horizon tasks are
usually decomposed by a higher-level planner anyway, so short-horizon competence
is the operating regime that matters.

Over-distillation is a textbook case of optimising a surrogate and watching the
real metric go the other way. Nobody would have caught it from the loss curve.
All distilled policies are therefore trained for 15k steps.
-->

---

# Performance measurements

<img src="/figs/fig_latency.png" class="w-[58%] mx-auto mt-1" />

<div class="grid grid-cols-2 gap-10 mt-4">
<div class="takeaway">
Re-planning rate <strong>1.1 → 3.9 chunks/s</strong>, or 12.7 ms per action.
</div>
<div class="takeaway warn">
The remaining 255 ms is the <strong>vision-language prefix</strong>, not the
solver.
</div>
</div>

<!--
922 → 255 ms on the Orin Nano in bf16. The target device, an Orin NX 16 GB,
reproduces this within 8 %; measured, not extrapolated.

In fp32 the speed-up shrinks to 2.0×, because the shared prefix starts to
dominate. bf16 is the practical deployment dtype; fp32 would exceed the Orin
Nano's memory entirely.

Setup: batch size 1, two 256×256 cameras, 48 language tokens, 30 timed
generations after 8 warm-ups, std ≈ 1 ms.

If the Jetson is physically in the room: hold it up and mention the power draw.

We removed the solver cost; what is left is the backbone. Prefix caching is the
obvious next lever.
-->

---

# Conclusions

<div class="mt-6">

<div class="takeaway text-base py-4">
<strong>1.</strong> Critic-guided rollout post-training <strong>transfers</strong>
to a 450 M model, with no human in the loop.
</div>

<div class="takeaway text-base py-4 mt-5">
<strong>2.</strong> With one condition: rollouts only <strong>amplify what the
policy can already do</strong>. Demonstrations bring missing skills in.
</div>

<div class="takeaway text-base py-4 mt-5">
<strong>3.</strong> One-step distillation holds that to within <strong>2 points
at 3.6× less latency</strong>.
</div>

</div>

<!--
Two minutes. Do not add a fourth point.

Next steps, if asked: real robot hardware instead of simulation; the missing cell
(outcome-only × co-training); multiple seeds; vision-prefix caching as the next
latency lever.

Reproducibility: every figure in the paper regenerates from data committed to the
repo, and CI builds the PDF and the project page on every push.

If you have to cut to one sentence: rollout post-training works on small models,
but only if you keep feeding it demonstrations, because it can only amplify what
is already there.
-->

---

# References

<div class="grid grid-cols-2 gap-x-12 gap-y-6 mt-6 text-sm">

<div>
<div class="kicker mb-1">SmolVLA — the policy</div>
M. Shukor et al., “SmolVLA: A vision-language-action model for affordable and
efficient robotics”<br>
<span class="dim">arXiv:2506.01844, 2025</span>
</div>

<div>
<div class="kicker mb-1">RECAP — the post-training recipe</div>
A. Amin et al., “π*<sub>0.6</sub>: a VLA that learns from experience”<br>
<span class="dim">arXiv:2511.14759, 2025</span>
</div>

<div>
<div class="kicker mb-1">Knowledge insulation — the pre-training recipe</div>
D. Driess et al., “Knowledge insulating vision-language-action models: Train
fast, run fast, generalize better”<br>
<span class="dim">arXiv:2505.23705, 2025</span>
</div>

<div>
<div class="kicker mb-1">FAST+ — the action tokenizer</div>
K. Pertsch et al., “FAST: Efficient action tokenization for
vision-language-action models”<br>
<span class="dim">arXiv:2501.09747, 2025</span>
</div>

<div>
<div class="kicker mb-1">SnapFlow — one-step distillation</div>
W. Luan et al., “SnapFlow: One-step action generation for flow-matching VLAs via
progressive self-distillation”<br>
<span class="dim">arXiv:2604.05656, 2026</span>
</div>

<div>
<div class="kicker mb-1">LIBERO — the benchmark</div>
B. Liu et al., “LIBERO: Benchmarking knowledge transfer for lifelong robot
learning”<br>
<span class="dim">arXiv:2306.03310, 2023</span>
</div>

</div>

<!--
Do not read this slide out. Ten seconds, then move on — it exists so the room can
photograph it, and so there is something to flip back to in the Q&A.

The one sentence worth saying: of the six, four are methods we implemented
rather than used — RECAP, knowledge insulation, FAST+ and SnapFlow. SmolVLA is
the model we started from, LIBERO is the benchmark we measured on.

Full names, if asked (they are in the notes of the slides where each appears):
  RECAP   — REinforcement learning via Advantage-Conditioned Policies. Our gloss;
            the pi*-0.6 paper names the recipe without expanding it.
  FAST    — Frequency-space Action Sequence Tokenization. FAST+ is the universal
            variant, BPE trained on ~1 M real trajectories.
  LIBERO  — a lifelong robot learning benchmark; the paper does not expand the
            acronym, so do not invent one.

The full bibliography is in the paper; these six are the ones this talk actually
stands on.
-->

---
layout: center
class: text-center
---

# Questions?

<div class="mt-10 text-base">
<strong>Sandro Covo</strong> · sandro.covo@fhnw.ch
</div>

<div class="mt-8 flex gap-12 justify-center text-sm">
  <div>
    <div class="kicker mb-1">Code</div>
    <a href="https://github.com/sacovo/smolva-rl">github.com/sacovo/smolva-rl</a>
  </div>
  <div>
    <div class="kicker mb-1">Project page</div>
    <a href="https://sacovo.github.io/smolva-rl/">sacovo.github.io/smolva-rl</a>
  </div>
</div>

<!--
PREPARED ANSWERS

"Is this actually reinforcement learning?"
  No policy gradient, nothing online. Critic-based relabelling plus conditioned
  supervised fine-tuning — chosen because it needs neither reward shaping nor
  online-RL infrastructure.

"Where does the success signal come from with no human?"
  From the simulator (meta/episodes.parquet). On real hardware that is THE open
  question — and precisely why a critic that judges from images is interesting.

"n = 500, one seed — are the differences significant?"
  Suite-level SE ≈ ±2 points. KI (+5…+11) and co-training (+5.2 avg) are clearly
  above it. The fine-grained f-plus differences on `long` are not, and the paper
  says so.

"Why is the object suite missing?"
  Every policy including the base times out there; we suspect corrupted
  pre-training demos. It affects all configurations identically, so it separates
  nothing. (--augmentation fixes it, but it was not part of the evaluated setup.)

"Why not just collect more demonstrations?"
  Demos cost human time per episode, rollouts cost GPU time. That is the whole
  economic point — and the results say you need both: few demos, many rollouts.

"How does this differ from the original RECAP?"
  A 10× smaller model, no teleoperation corrections, and the resulting insight
  that demonstration co-training has to take over their role.

"Why 10 Euler steps — why not simply fewer?"
  Fewer steps without distillation degrades action quality: Euler follows the
  tangent and the field is curved. SnapFlow explicitly trains the single step to
  hit the integral, by conditioning on a target time s and regressing the
  t=1 → s=0 jump onto the model's own two-half-step chord.

"How can the policy be its own teacher without going in circles?"
  Two Euler half-steps approximate the integral strictly better than one whole
  step, for the same field. So the teacher branch is always slightly ahead. Each
  gradient step pulls the one-step student up to it, which also improves the
  teacher, so the target moves forward too. 1 chases 2, 2 chases 4 — the fixed
  point is the full integral. The flow-matching term against real dataset actions
  is what forbids the trivial self-consistent solution (a constant field).

"Doesn't distillation start from scratch?"
  No. The target-time MLP is zero-initialised, weights and biases, so at step 0
  the model's output is exactly the trained ten-step policy's. And only the
  expert trains — the VLM backbone is frozen for the whole run.

"Why a discrete tokenizer for the backbone at all?"
  The backbone is a language model; its native objective is next-token
  prediction. FAST turns a chunk into a short token string via a DCT along time,
  quantisation, and BPE, so the AR loss is plain cross-entropy. We use FAST+, the
  universal tokenizer trained on ~1 M real robot trajectories, off the shelf. It
  never runs at inference — deployed actions all come from the flow expert.

"Is +5 to +11 really knowledge insulation?"
  It is the pre-training RECIPE as a whole — insulation, FAST AR co-training and
  the conditioning token — not the stop-gradient in isolation. The paper is
  explicit about this.

BACKUP SLIDES FOLLOW: limitations · the full recipe · label composition ·
edge latency · per-task shifts.
-->

---
layout: section
---

<div class="kicker mb-4">Backup</div>

# Appendix

---

# Limitations

<div class="grid grid-cols-2 gap-12 mt-5 text-sm">
<div>

- **Simulation only.** No real-robot results.
- **One seed per configuration**, SE ≈ ±2 points; several threshold effects sit
  at the edge of resolution.
- Per-task numbers at 50 trials: ≈ ±14 % at 95 % confidence.

</div>
<div>

- Reporting the **max over a five-point guidance sweep** flatters absolutes by
  1–2 points.
- Only **f⁺ ∈ {0.3, 0.4, 0.8}** tested.
- Latency measured on-device but **not in closed-loop control**.
- **Not comparable to published SmolVLA numbers**: no community-corpus
  pre-training.

</div>
</div>

<!--
On the guidance sweep: every conditioned method receives the identical sweep, so
comparisons among them are unaffected. But the no-KI baseline is evaluated at a
single operating point and does not get that benefit.

On comparability: the released SmolVLA is pre-trained on a large corpus of
community robot datasets. Every model here sees only the LIBERO expert
demonstrations. Evaluated under our protocol, the released LIBERO fine-tune scores
close to our no-KI baseline — which is why it is a faithful stand-in.
-->

---

# The full recipe: two rounds

<div class="grid grid-cols-2 gap-12 mt-5">
<div class="text-sm">

<div class="kicker mb-2">Round 1 — demonstrations</div>

1. Train the C51 critic on the expert data
2. Advantages → thresholds
3. **Pre-train the policy, 250k steps**

<div class="kicker mb-2 mt-6">Round 2 — its own rollouts</div>

1. **600 episodes autonomously**: 107,410 frames, 64.3 % success
2. Fine-tune the critic, pessimistic on failures
3. Recompute advantages, re-threshold
4. **Fine-tune the policy, 20k steps**

</div>
<div>

<img src="/figs/pipeline.svg" class="w-full" />

<div class="takeaway mt-5">
<strong>Co-training:</strong> with probability 0.5 the batch comes from the
demonstrations instead, all frames positive.
</div>

</div>
</div>

<!--
Two roles for co-training: a clean reference for the positive branch, and replay
against forgetting behaviour learned in pre-training but never exercised in the
rollout data.

Pre-training runs with knowledge insulation and advantage conditioning already in
place from step 1.
-->

---

# Label composition of the rollout data

<div class="grid grid-cols-2 gap-12 mt-5">
<div>

| scheme | pos % | neg % | pos:fail | neg:succ |
|---|---:|---:|---:|---:|
| f⁺ = 0.3 | 15.0 | 85.0 | 1.7 | **30.9** |
| f⁺ = 0.4 | 20.7 | 79.3 | 3.0 | **26.5** |
| f⁺ = 0.8 | 51.5 | 48.5 | 16.2 | 8.9 |
| outcome-only | 44.2 | 55.8 | 0.0 | 0.0 |

<p class="note mt-4">
All 107,410 rollout frames, failures included.<br>
<strong>pos:fail</strong> — positive labels on failed episodes.<br>
<strong>neg:succ</strong> — negative labels on successful episodes.
</p>

</div>
<div>

<img src="/figs/fig_labels.png" class="w-full" />

</div>
</div>

<!--
The two cross-terms are the two ways the labelling can be wrong, and they trade
off. A permissive threshold buys a large reduction in neg:succ for a smaller
increase in pos:fail — which is why f-plus = 0.8 wins.
-->

---

# Action-chunk latency on edge devices

<div class="grid grid-cols-2 gap-12 mt-5">
<div>

| device | dtype | FM (10) | SnapFlow | speed-up |
|---|---|---:|---:|---:|
| Orin Nano 8 GB | bf16 | 922 | **255** | **3.6×** |
| Orin NX 16 GB | bf16 | 850 | 240 | 3.5× |
| Orin NX 16 GB | fp32 | 1143 | 575 | 2.0× |

<p class="note mt-4">
JetPack 6, PyTorch 2.11, autocast, batch size 1, two 256×256 cameras, 48 language
tokens. 30 timed generations after 8 warm-ups, std ≈ 1 ms.
</p>

</div>
<div>

<img src="/figs/fig_latency.png" class="w-full" />

</div>
</div>

<!--
fp32 would exceed the Orin Nano's memory entirely — hence bf16 as the deployment
dtype. In fp32 the shared vision-language prefix dominates, which is why the
speed-up halves.
-->

---

# Per-task shifts hide in the averages

<div class="grid grid-cols-2 gap-12 mt-5">
<div class="grid grid-cols-2 gap-5">
  <Clip src="rollout_spatialT5_ramekin_SUCCESS_ep0" verdict="success" label="rollout-only" />
  <Clip src="cotrain_spatialT5_ramekin_FAIL_ep1" verdict="fail" label="co-trained" />
</div>
<div class="pt-4">

<div class="takeaway warn">
The ramekin grasp: rollout-only <strong>learns</strong> it, co-training
<strong>loses</strong> it again.
</div>

<div class="takeaway mt-5">
Specialisation runs in <strong>both</strong> directions; co-training is not free.
</div>

</div>
</div>

<!--
`spatial` task 5. Co-training trades some of what the rollouts taught for the
skills the rollouts never contained.

Aggregate suite numbers hide shifts like this entirely, which is why the analysis
in the paper goes per-task before drawing any conclusion.
-->
