---
name: Design-subagent theme placeholder colors left unfilled
description: A generated Tailwind index.css can ship with literal "red" placeholder values for core CSS color variables (--card, --primary, etc.) instead of real HSL — breaks component backgrounds silently.
---

Some design-subagent-generated `index.css` theme files scaffold every CSS
custom property (`--background`, `--card`, `--primary`, `--sidebar`, etc.)
with a literal placeholder value of `red` and a `/*replace with H S L */`
comment, intended to be filled in with real `H S% L%` triples during theming.
If that fill-in step is skipped, the property is invalid inside
`hsl(var(--card))`, so the browser drops the declaration — components using
`bg-card` etc. render as transparent/see-through instead of erroring loudly.

**Why:** This caused a "glassy"/washed-out look across an entire app (cards,
popovers, sign-in/sign-up box) even though hero sections styled with inline
colors looked fine. It's easy to mistake for an intentional low-opacity design
choice rather than a broken variable.

**How to apply:** When a page/card looks unexpectedly transparent or
washed-out despite explicit `bg-card`/`bg-primary` classes, grep the
project's `index.css` for `red; /*replace` or similar placeholder markers in
both the `:root` and `.dark` blocks before assuming it's a design/opacity
choice — fill them with real HSL values matching the intended palette.
