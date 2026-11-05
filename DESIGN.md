# strip — design system

Source of truth: `airemover.html`. If this file and the CSS disagree, the CSS wins.

## What this is

A standalone image metadata tool. Vanilla HTML, CSS and JS in two files: `airemover.html` (the app) and `hero.html` (landing hero). No build, no framework, no Tailwind. Every file duplicates the same tokens in its own `:root`.

## Design thesis

**A lab instrument, not a website.** Near-black canvas, one acid-lime signal colour, oversized geometric wordmark, monospace telemetry for every small label and number. The interface is quiet; the lime accent and the giant `strip.` wordmark carry all the boldness. Nothing decorative that does not also communicate state.

Three rules that keep it coherent:

1. **One accent.** Lime is the only chromatic colour, plus semantic danger and warn. Never add a fourth hue.
2. **Two typefaces, strict roles.** Space Grotesk for words, JetBrains Mono for machine data (labels, counts, badges, log).
3. **Flat surfaces, hard edges, no glow except where it means something.** No purple/blue gradients, no glassmorphism, no pill badges, no drop shadows on cards.

## Tokens

Defined once in `:root`. Change them there, never inline.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0b` | Page background |
| `--panel` | `#101012` | Card gradient end |
| `--panel-raised` | `#17171a` | Card gradient start, inputs, buttons |
| `--border` | `rgba(255,255,255,.085)` | Hairlines, card and control borders |
| `--border-strong` | `rgba(255,255,255,.17)` | Hover borders, dashed drop zone, scrollbar |
| `--text` | `#f3f3ee` | Primary text (warm off-white, never pure white) |
| `--text-dim` | `#a3a39b` | Subtitles, secondary labels |
| `--text-muted` | `#77776f` | Hints, counts, log body |
| `--accent` | `#d7ff4f` | Acid lime: primary buttons, active states, success |
| `--accent-soft` | `rgba(215,255,79,.12)` | Success badge background |
| `--danger` / `--danger-soft` | `#ff6b6b` / `rgba(255,107,107,.12)` | Errors, flagged files |
| `--warn` / `--warn-soft` | `#ffb84d` / `rgba(255,184,77,.12)` | Ambiguous, processing |
| `--radius` | `18px` | Cards, drop zone |
| `--radius-sm` | `12px` | Inputs, buttons, rows, log |
| `--mono` | JetBrains Mono stack | All mono text |

Theme colour meta: `#0a0a0b`. Selection: lime background, `#0a0a0b` text. Focus: `2px solid var(--accent)` with `2px` offset — never removed.

## Typography

Loaded from Google Fonts with `display=swap`, system fallbacks keep the layout intact offline.

```
"Space Grotesk" — 400 / 500 / 600 / 700
"JetBrains Mono" — 400 / 500
```

| Role | Family | Size | Weight | Tracking |
|---|---|---|---|---|
| Wordmark `h1` | Space Grotesk | `clamp(56px, 16vw, 84px)` | 700 | `-0.06em`, line-height `0.88` |
| Subtitle | Mono | `10.5px` | 400 | `0.16em`, uppercase |
| Section label | Mono | `10px` | 500 | `0.16em`, uppercase |
| Count / telemetry | Mono | `11px` | 400 | tabular-nums |
| Body / buttons | Space Grotesk | `14px` | 500–600 | `0.005em` on buttons |
| File name | Space Grotesk | `13.5px` | 500 | default |
| Badge | Mono | `9.5px` | 500 | `0.08em`, uppercase |
| Hint / progress | Mono | `10px` | 400 | `0.06–0.14em` |
| Log | Mono | `11px` | 400 | line-height `1.7` |

Sentence case for all prose. Uppercase only on mono micro-labels. The wordmark ends in a lime full stop: `strip<span class="dot">.</span>`.

## Layout

- Tool surface: single column, `.app` max-width `560px`, centred, `gap: 16px`.
- Safe-area padding on `body`: `max(32px, …)` top, `max(20px, …)` sides, `max(48px, …)` bottom.
- Header is left-aligned and closes with a hairline `border-bottom`. Never centre it.
- The tool has no sidebar, nav, or footer. The hero carries one top bar and one closing strip.

## Surfaces and background

- Page: `--bg` plus two lime radial glows — one weak at top centre (`900×520px at 50% -12%`), one faint at bottom right.
- Fixed grain overlay on `body::before`: inline SVG `feTurbulence`, `opacity: .045`, `pointer-events: none`, `z-index: 0`. `.app` sits at `z-index: 1`. No external image.
- Cards: `linear-gradient(180deg, var(--panel-raised), var(--panel))`, `1px` border, radius `18px`, `padding: 20px`, and a single inset top highlight `inset 0 1px 0 rgba(255,255,255,.04)`. No outer shadow.

## Components

### Header
A mono `.back` link (`Back to hero`, left arrow SVG) sits above the wordmark and turns lime on hover. Then the `h1` wordmark, then a mono uppercase subtitle with a `6px` lime dot before it (`::before`). 18px padding below, hairline border.

### Drop zone (`#drop`)
Full-width dashed `1px` `--border-strong` border, radius `18px`, padding `44px 24px`, panel gradient wash. Hover/drag: border turns solid lime, background `rgba(215,255,79,.05)`. Icon: 30px line-art inline SVG, lime at 85% opacity. Label 18px/600; hint mono 10px uppercase.

Once a queue exists it becomes `.compact`: horizontal, centred, `15px` padding, `12px` radius, 18px icon, 14px label, hint hidden. It must never disappear — it is the add-more control.

### Card / queue
Section head: mono label left, mono count right. Rows are `rgba(255,255,255,.025)` with `1px` transparent border, radius `12px`, `10px 12px` padding, `44px` thumbnail at radius `8px`. Hover adds a `--border` border and lifts the background to `.04` white.

### Badges
Square chips, never pills: radius `6px`, mono 9.5px uppercase, `4px 8px` padding, `5px` dot from `currentColor`.
States: neutral `--text-dim`; `flagged`/`error` danger; `ambiguous`/`processing` warn; `done` lime. Processing pulses the dot only (`1s` alternate).

### Progress
6px track at 8% white, lime fill with `0 0 12px rgba(215,255,79,.45)` glow, animated with `transform: scaleX()` only. Caption right-aligned mono 10px.

### Select
`appearance: none`, min-height `50px`, radius `12px`, panel-raised fill, custom inline SVG chevron at `right: 16px`.

### Buttons

| Class | Look | Use |
|---|---|---|
| `.btn-action.primary` | Lime fill, `#0a0a0b` text | The one action that moves the task forward |
| `.btn-action` | Panel-raised, `--border`, 14px/600 | Secondary actions |
| `.btn-secondary` | Panel-raised, dim text, 13px/500 | Utility (camera) |
| `.btn-reset` | Transparent, muted text | Destructive/quiet (clear all) |

All are min-height `50px` (`40px` for reset), radius `12px`. Hover darkens to `#1e1e22` and strengthens the border; primary brightens to `#e3ff7a`. Press is `scale(0.985)`. Disabled is opacity `.45` and `not-allowed`.

`.download-row` holds two flex actions with `min-width: 180px`, wraps on narrow screens.

### Log
Hidden until it has content. Mono 11px, radius `12px`, `rgba(0,0,0,.3)` fill, hairline border, `160px` max height. Line colours: lime success, amber warn, red error.

## Motion

- Transitions: `150–180ms ease` for colour and border; `100ms` for press; `250ms ease-out` for progress.
- Animate only `transform` and `opacity`. Nothing animates width, height, top or left.
- Never animate entry on load. Motion only reflects a state change.
- `prefers-reduced-motion: reduce` collapses all animation and transitions to `0.01ms`.

## Voice

Direct, lowercase, no exclamation marks, no "Oops". Status text describes the fact: "Spoofed 4 files", "If the browser asks to allow multiple downloads, choose allow." Never address the user as "you" in UI copy.

## Accessibility

- Every interactive element is a real `<button>`, `<label>` or `<select>`.
- `:focus-visible` is always visible.
- `#progressWrap` is a `role="progressbar"` with live `aria-valuenow`.
- Badges carry text, not colour alone.
- Touch targets are at least `44px` tall.
- Icons are inline SVG with `aria-hidden="true"`.

## Do not

- Do not add a second accent, gradient buttons, glassmorphism, or neon glow.
- Do not use pill badges, rounded avatars, or 3-equal-column card grids.
- Do not introduce Inter, Roboto, or another generic sans.
- Do not centre the header, and do not add a nav or footer link farm.
- Do not add icon libraries; inline SVG at `1.6–2` stroke width only.
- Do not inline colours that are already tokens.
- Do not load external images; the grain is inline SVG for a reason.

## Surfaces

### `airemover.html` — the tool (Operate)

Single column, `max-width: 560px`, one task. Header, drop zone, queue, controls, log, in that order. This is the surface the tokens above were drawn from.

### `hero.html` — landing hero (Persuade)

Same world, wider canvas. It does not introduce new tokens.

- `.page` max-width `1240px`, top bar above a full-height hero, ticker strip below.
- Two-column hero: oversized `h1` left (`clamp(52px, 8.2vw, 96px)`, second line lime), instrument panel right. Copy column carries headline, one lede (`46ch` max), one lime CTA and a mono aside.
- `.instrument`: solid panel with a dashed frame offset `14px` down and right behind it (`translate(14px, 14px)`), giving depth without shadows. Disabled below `900px`.
- `.panel`: same card recipe as `.card`, but divided into head / rows / foot by hairlines.
- `.row`: two-line grid — mono filename + uppercase chip on top, mono detection note below.
- `.chip`: badge variant, radius `6px`, mono 9px uppercase, danger or warn bounds. Never a pill.
- `.ticker`: mono 10px uppercase index of what gets stripped, hairline top, wrapped with `/` separators.
- One primary action, repeated only in the top bar at small size. The rest of the page stays quiet.

The hero never runs a load animation. State, not theatre.

### `legal.html` — terms & privacy (Read)

Same tokens, no cards. Single column, `max-width: 720px`, paragraphs capped at `68ch`, `15px/1.7` in `--text-dim`, `h1` display size, `h2` at `26–32px`, mono `h3` section labels. A jump nav sits between two hairlines. `section` elements carry `scroll-margin-top` so anchors don't tuck under the top edge.

Both `airemover.html` and `hero.html` end with links to `legal.html#privacy` and `legal.html#terms`: mono 10px uppercase, `--text-muted`, lime on hover. On the tool they sit in a centred `.legal-links` footer; on the hero they join the ticker's right side.

## Changing the design

1. Edit tokens in `:root` first.
2. Keep the lime dot, mono micro-labels and 18/12 radius pairing.
3. Update this file in the same change so it stays truthful.
