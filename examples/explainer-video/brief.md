# Brief — Endowment-Style Investing explainer (50s, 1:1)

The brief that produced explainer.html / scenes.jsx. A real working example of the template at ../brief-template.md.

---

## Subject & audience

Topic: Introduce endowment-style investing to a retail investor who has never heard the term before.

Viewer profile: A sophisticated but institutionally-untrained individual investor, age 45–65+, mass-affluent ($200K+ income, $1M+ net worth). Knows what the S&P 500 is. Does not know what "endowment-style" means.

What the viewer should understand or feel by the end: The viewer understands the concept of endowment-style investing and is curious about Ivy Invest.

---

## Tone & brand

Tonal anchor: Sophisticated, confident, editorial. NYT explainer or WSJ data viz — not MailChimp mascot energy. Respects the viewer's intelligence. No exclamation points. No stock-photo smiles.

Brand:

- Background: #082519 (forest deep)
- Primary accent: #9BD0BC (mint — accent words, chart highlights)
- Secondary: #EFE7D4 (cream — body text, secondary elements)
- Headlines: Roboto Serif 500, often with an italic mint accent word
- Body / captions: Inter 500–600
- Lots of negative space. One clear idea per scene.

Compliance — forbidden phrases: "will earn", "guarantees", "outperform", "best", "proven", specific Ivy Invest return numbers, historical comparison graphs.

---

## Storyboard

```
Beat 1 (0–5s) — The familiar picture
  Text:    "Most investors own stocks and bonds."
  Visual:  [proposal] A clean 70/30 pie animates in. Labels Stocks, Bonds.

Beat 2 (5–13s) — The surprise
  Text:    "But universities like Harvard and Yale invest very differently."
  Visual:  [proposal] The 70/30 morphs into an 8-slice endowment allocation;
           slices reveal one by one with labels.

Beat 3 (13–18.5s) — Name the concept
  Text:    "This is endowment-style investing."  ("endowment-style" mint italic)
           Subtitle: "A long-term approach that includes public and private markets."
  Visual:  [required] The 8-slice pie holds on the left at smaller scale; the
           phrase becomes the dominant title on the right.

Beat 4 (18.5–27.5s) — Scope of the opportunity
  Text:    "Most of the economy is private."
           Stat: "Among U.S. companies with $100M+ revenue, private outnumber
                  public nearly 7 to 1."
  Visual:  [proposal] Originally specified as 1 large vs. 7 small circles.
           Pivoted to icon grid (1 cream-outlined building + 7 mint-filled
           buildings) because the ratio didn't read with circles of similar
           size — same "1 vs 7" meaning, clearer reading.

Beat 5 (27.5–35.5s) — The gatekeeping
  Text:    "But these investments have typically required high minimums —
            and the right connections."
  Visual:  [proposal] Originally specified as a velvet rope around the
           private cluster. Pivoted to an iceberg metaphor — small tip above
           the waterline (public), large submerged mass (private), red lock
           on the submerged portion. Stronger metaphor for "what's hidden
           below the surface" + "out of reach."

Beat 6 (35.5–50s) — Bring it home
  Text:    "Now, open to everyone."   (open/everyone in mint italic)
           Tagline: "Bringing endowment-style investing to individual investors."
           Eyebrow: "STARTING AT $1,000"
           CTA: "Learn more at ivyinvest.co"
  Visual:  [required] Lock unlocks (rust → mint), waterline drops, submerged
           iceberg brightens. Iceberg fades; Ivy mark + wordmark reveal;
           tagline + CTA. Holds at full opacity from t≈47s through t=50s.
```

Most visuals were marked [proposal] in the original brief. Beats 4 and 5 both went through visual pivots in review — see the README for what changed and why.

---

## Deployment surface

- Where: Paid social (LinkedIn, Instagram), embedded in sales pages.
- Primary device: Phone in feed.
- Sound: Off. On-screen text carries the message.
- Aspect-ratio siblings: 1:1 was the primary; 9:16 and 16:9 versions were considered for follow-up.

## Localization

Single language (English).

## Technical

- 1080×1080
- 50 seconds (extended from original 45s target — Beat 6 needed more breathing room for the iceberg-to-logo cascade)
- Final-frame requirement: full Ivy mark + wordmark + tagline + CTA hold for ≥3s with no exit fade
- Delivery: MP4 (H.264) for paid social, plus standalone HTML for sales-page embed
