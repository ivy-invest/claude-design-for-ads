# Brief template: animated explainer video

This is the briefing template for an animated explainer or marketing video. Fill it in, then paste the filled-in version into Claude Design. A complete brief produces a faster, better animation with fewer iterations.

If a design system is in use, the brief can reference its tokens (colors, fonts, type scale) by name instead of restating values. Only override when departing from system defaults.

---

## Subject & audience

Topic in one sentence:
e.g. "Introduce the concept of [product category] to viewers unfamiliar with it, and connect that concept to our product."

Viewer profile:
Who watches this? Sophistication level, prior knowledge, demographic, context (paid feed scrolling, sales meeting, conference talk).

What the viewer should understand or feel by the end:
One outcome. "They understand [concept] and are curious about [product]." Not three outcomes — one.

---

## Tone & brand

Tonal anchor:
Pick a comparison. "Like a NYT explainer — calm, editorial, confident." "Like a Wieden+Kennedy spot — wry, restrained, premium." Avoid abstract adjectives ("modern, clean, friendly") — they don't decide anything.

Brand colors (or "use design-system tokens"):
Background, primary accent, secondary, text. Hex codes if not from the system.

Brand fonts (or "use design-system tokens"):
Headline family + weight. Body family + weight. Any italic or accent conventions.

Compliance constraints — forbidden phrases:
List explicitly. "will earn", "guarantees", specific return numbers, "best", "proven", etc. Claude Design will check for these on every text revision.

---

## Storyboard

Beat-by-beat. For each beat, specify:

- Timestamp range ([start, end] in seconds)
- On-screen text (verbatim — this is what the viewer reads)
- Visual description
- Whether the visual is [required] (part of the brief) or [proposal] (can be pivoted if it doesn't read in review)

```
Beat 1 (0–5s) — [name the beat in one phrase, e.g. "The familiar picture"]
  Text:    "..."
  Visual:  [proposal] A clean N/M pie chart animates in. Calm, familiar.

Beat 2 (5–13s) — ...
  Text:    "..."
  Visual:  [required] The pie morphs into an N-slice allocation; slices reveal one by one.

...

Beat N (last) — Bring it home
  Text:    "..."
  Visual:  [required] [Logo / wordmark / CTA reveals and holds.]
```

Most visual choices should be [proposal]. Mark only the ones that are non-negotiable — usually the opening and closing beats, and any beat carrying a specific factual visualization.

---

## Deployment surface

Where will this run?
Paid social (which platform), organic, sales deck, conference, web embed, broadcast TV.

Primary device:
Phone in feed, desktop browser, large screen, projector. This sets the type minimums.

Sound on or off?
Almost always off for social. If off, on-screen text must carry the entire message — Claude Design will treat audio as nonexistent.

Aspect-ratio siblings needed?
List all needed: 1:1 (1080×1080), 9:16 (1080×1920), 16:9 (1920×1080). Designing for one then reflowing to others is faster than retrofitting later.

---

## Localization

Single language, or will be re-cut?
If re-cut: name the languages. Claude Design will leave breathing room in text containers — German runs ~30% longer than English, Japanese can wrap differently, etc.

---

## Technical

Target resolution: e.g. 1080×1080

Target duration: e.g. 45 seconds. Mark this as soft target (can flex ±15% for comprehension) or hard cap (must fit broadcast slot or platform limit).

Final-frame requirements:
What holds on screen at t=duration, and for how long. e.g. "Logo + CTA holds for at least 3 seconds with no exit fade."

Delivery format:
MP4 (H.264), ProRes, WebM, source HTML for further editing, etc.

---

## Worked example

For a fully filled-in version of this template plus the resulting animation, see `explainer-video/`.
