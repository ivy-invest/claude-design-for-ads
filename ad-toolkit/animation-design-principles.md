# Animation design principles

Craft heuristics for video animation work, brand-agnostic. These are reflexive habits — each one is here because skipping it produced a worse result on real projects. Apply alongside the build requirements in `video-export-contract.md`.

---

## Type minimums by deployment surface

Canvas size sets resolution; deployment surface sets type minimums. A 1080×1080 ad on a phone in a feed has very different legibility constraints than a 1080×1080 frame embedded in a sales deck.

| Surface | Hero | Body | Captions / disclosures |
|---|---|---|---|
| Mobile-feed ad (1:1, 9:16, played on phones) | 60px+ | 28px+ | 22px+ |
| Desktop / sales-deck embed (16:9 mostly) | 48px+ | 24px+ | 18px+ |
| Broadcast / large-screen | 56px+ | 28px+ | 20px+ |

Floors, not targets. Animated video has no "hover to read" affordance — when in doubt, go bigger.

## Audit brand assets against the target background

Brand marks ship in the brand's primary color, designed for white or light backgrounds. On a dark canvas they often disappear or read muddy. Before using any logo, brandmark, illustration, or icon:

1. Drop it on the actual scene background at intended size.
2. Check contrast (WCAG AA at minimum for any text-bearing mark).
3. If it fails, generate a color-shifted variant and **save it as a real asset file** — don't just override `fill` at runtime, because the bundler needs the file.

## Sequential reveals: equal velocity, not equal duration

When animating multiple elements that read as one continuous motion (pie wedges sweeping in, bars growing, list items revealing), use **equal angular or linear velocity**, not equal duration per element.

A pie's 41% wedge should take ~5× longer to draw than its 8% wedge. Equal-duration reveals make small slices feel rushed and large ones sluggish — the eye reads it as bad timing even if it can't say why. Equal-velocity reveals read as one continuous sweep.

Same for staggered text (longer words type proportionally longer), bar charts (taller bars grow longer), and any "drawing" animation.

## Beat-to-beat transitions: bridge or pause, never crossfade

When two adjacent beats share a visual element — a chart that morphs, a circle that becomes part of the next composition, a label that persists — **animate the bridge**. Don't fade the first beat out and the second in. Crossfades on shared elements look like two separate scenes that happen to have similar content; bridges look like one continuous thought.

When two beats have nothing in common, hold an empty/black frame for ~200ms between them so the eye can reset. A hard cut between busy compositions reads as confusion.

## Optical alignment audit after every layout change

Compositions drift off-center as elements move during iteration. After every layout pass:

1. Screenshot at a few representative timestamps (early, mid-beat, end-beat).
2. Eyeball margins. Visual center is rarely the same as mathematical center, especially with mixed pie + text + logo compositions.
3. Adjust offsets in fractional pixels if needed — symmetric mathematical layouts often look subtly left-heavy because of letterform shapes.

A 30-second check that catches drift before it ships.

## Compliance keyword sweep on every text revision

If the brand has a forbidden-phrase list, keep it in a comment at the top of the scene file:

```jsx
// COMPLIANCE — forbidden phrases:
//   "will earn", "guarantees", "outperform"
//   specific return numbers, historical comparison claims
//   "best", "top-performing", "proven"
```

After any on-screen-text revision, grep the file for the phrases. Don't trust memory — copy edits introduce them by accident, especially in the final stretch when prose is being tightened.

## Storyboard visuals are proposals; meaning is the contract

A storyboard typically specifies both *what each beat means* and *what it looks like*. The meaning is the contract. The visual is a proposal that might not survive review.

If the proposed visual fails — composition doesn't read, metaphor falls flat, ratio doesn't communicate what the prose claims — pivot the visual while preserving the meaning. Don't push through a weak visual to honor the storyboard literally; that produces video that hits its beats on paper but fails its job in front of viewers.

When you pivot, surface it to the briefer with a one-line explanation ("Beat 4's 1+7 cluster didn't read because the public circle was the same visual scale as the private cluster — switching to an icon-grid metaphor"). The briefer often had a reason for the original proposal worth preserving in the new visual.
