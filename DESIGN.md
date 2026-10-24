---
name: Pen's Pulse
description: High-craft, academic-grade design system for Pen's Pulse technical publication
colors:
  primary: "oklch(45% 0.13 148deg)"
  accent: "oklch(42% 0.14 148deg)"
  background: "oklch(96.5% 0.006 150deg)"
  foreground: "oklch(40% 0.03 150deg)"
  muted: "oklch(92.5% 0.006 150deg)"
  muted-foreground: "oklch(56% 0.02 150deg)"
  border: "oklch(88% 0.005 150deg)"
  ring: "oklch(45% 0.13 148deg)"
typography:
  display:
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, PingFang TC, Noto Sans CJK TC, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, PingFang TC, Noto Sans CJK TC, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, PingFang TC, Noto Sans CJK TC, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, PingFang TC, Noto Sans CJK TC, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Lilex, SF Mono, Cascadia Code, Monaco, monospace"
    fontSize: "0.875rem"
    fontWeight: 450
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  badge-tag:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Scholar SWE Codex

## Overview

**Creative North Star: "The Scholar-Engineer's Codex"**

Scholar SWE Codex is an editorial, high-craft design system tailored for long-form engineering essays, systems postmortems, architecture dissections, and technical notebooks. Inspired by the calm digital-garden aesthetic of [My Scholar](https://myscholar.pages.dev/) and academic typography traditions, the interface is deliberately quiet and restrained. It eliminates aggressive SaaS marketing patterns, noisy gradients, popups, and gratuitous gamification, allowing complex technical prose and source code to claim the reader's undivided focus.

Visual authority stems from disciplined proportions, generous whitespace, balanced typographic measure, and hairline tonal boundaries. Every layout decision respects the reader's cognitive load: prose is constrained to optimal optical measures, code snippets are elevated with crisp syntax highlighting and instant copying ergonomics, and collapsible callout admonitions sit naturally alongside the text without breaking narrative flow.

**Key Characteristics:**

- **Quiet Editorial Authority:** Typography and whitespace take precedence over decorative containers.
- **Academic & Digital-Garden Hybrid:** Rigorous typography paired with modern interactive affordances (smooth underline wipe, light-dark dual themes, collapsible callouts).
- **First-Class Technical Notation:** Monospace code blocks, formulas, and architecture diagrams are integrated with equal aesthetic care as body text.
- **Bilingual Typographic Harmony:** Seamless visual balance across English and Traditional Chinese (CJK) letterforms.

## Colors

The color system is authored natively in the OKLCH color space using CSS `light-dark()` functions, providing perceptual linearity and chromatic harmony across both day and night reading environments, with a disciplined, editorial green palette.

### Primary

- **Pine & Mint** (`oklch(45% 0.13 148deg)` light / `oklch(78% 0.15 145deg)` dark): Used selectively for accent badges, active stage markers, reading progress, and verified states. Deep forest pine in light mode, luminous spring mint in dark mode.

### Secondary

- **Emerald & Jade** (`oklch(42% 0.14 148deg)` light / `oklch(76% 0.15 145deg)` dark): The interactive accent used for text link hover states, focus rings, and active navigation indicators. High contrast and crisp in light mode, radiant in dark mode without causing eye fatigue.

### Neutral

- **Sage Paper / Deep Pine Midnight** (`oklch(96.5% 0.006 150deg)` light / `oklch(20% 0.015 155deg)` dark): Canvas background. In light mode, a faint sage paper tone avoids the harsh glare of pure `#ffffff`. In dark mode, a deep pine midnight slate replaces pure `#000000` to prevent stark black/white halation.
- **Cypress Slate / Pale Sage** (`oklch(40% 0.03 150deg)` light / `oklch(88% 0.03 145deg)` dark): The primary prose and headline color, formulated for maximum legibility while avoiding jarring harshness.
- **Muted Canvas** (`oklch(92.5% 0.006 150deg)` light / `oklch(26% 0.012 155deg)` dark): Subtly recessed container fill used for code blocks, callout backgrounds, and pill badges.
- **Muted Foreground** (`oklch(56% 0.02 150deg)` light / `oklch(70% 0.02 145deg)` dark): Secondary metadata, publication dates, reading times, tags, and footer notes.
- **Hairline Border** (`oklch(88% 0.005 150deg)` light / `oklch(100% 0 0deg / 18%)` dark): Hairline divider lines, subtle card perimeters, and table outlines.

### Named Rules

**The Rarity Rule.** Primary and secondary accent colors (`--primary` and `--accent`) must occupy less than 5% of any viewport. Their restraint ensures that code highlights and prose remain the focal point.

**The Pure Black Prohibition.** Never use `#000000` for backgrounds or `#ffffff` for pure white text in dark mode. Always use calibrated OKLCH neutral tokens to preserve reading comfort over prolonged sessions.

## Typography

The typographic stack harmonizes geometric precision for Latin text, a clean developer-grade monospace for code, and proportional CJK fonts for bilingual Chinese/English technical articles.

**Display & Body Font:** `DM Sans`, `-apple-system`, `BlinkMacSystemFont`, `"Noto Sans CJK TC"`, `"PingFang TC"`, `sans-serif`
**Monospace / Code Font:** `Lilex`, `"SF Mono"`, `"Cascadia Code"`, `"Monaco"`, `"Roboto Mono"`, `monospace`
**Math Font:** `STIX Two Math`, `math`

**Character:** Calm, modern, and highly legible. Headings use balanced word wrapping (`text-wrap: balance`), while body paragraphs employ pretty wrapping (`text-wrap: pretty`) with a measured line-length constraint.

### Hierarchy

- **Display** (Bold 700, `clamp(2rem, 5vw, 3rem)`, line-height: `1.15`): Post titles and hero masthead.
- **Headline / H2** (Semibold 600, `1.875rem` / 30px, line-height: `1.25`, tracking: `tight`): Major essay sections and topic headers.
- **Title / H3** (Semibold 600, `1.5rem` / 24px, line-height: `1.3`): Subsections, case study phases, and card titles.
- **Body** (Regular 400, `1rem` / 16px, line-height: `1.75`): Main narrative prose. Constrained to `--measure: 44rem` (~704px, ~65-75 characters per line).
- **Label / Code** (Medium 450, `0.875rem` / 14px, line-height: `1.5`): Inline code, terminal snippets, tags, dates, and caption annotations.

### Named Rules

**The 44rem Measure Rule.** Running prose must never stretch beyond `44rem` (704px). Wide viewports place balanced outer whitespace in the margins rather than stretching paragraph line length.

**The Continuous Underline Wipe.** Inline prose links have a subtle muted underline at rest. On hover, a solid accent stroke sweeps continuously from inline-start to inline-end (`background-size: 0%` to `100%`). Under `prefers-reduced-motion: reduce`, this smoothly falls back to an instant color transition.

## Layout

The spatial model uses an asymmetric editorial grid anchored by a central reading column:

- **Central Reading Column:** Centered with a maximum width of `44rem` (`--measure`).
- **Wide Element Breakouts:** Code snippets, architectural system architecture diagrams, and benchmark data tables may break out of the 44rem column up to `56rem`–`64rem` for readability.
- **Responsive Padding:** Inline page padding shifts from `1.25rem` (mobile) to `2.5rem` (tablet/desktop) to maintain generous outer breathing room.

## Elevation & Depth

Scholar SWE Codex is flat-by-default, utilizing tonal layering and delicate borders instead of drop shadows.

- **Canvas vs. Surface Layering:** Background canvas (`--background`) sits below recessed code blocks and callouts (`--muted`).
- **Hairline Definition:** Structural divisions rely on `1px solid var(--border)` rather than drop shadows.
- **Interactive Elevation:** State changes (card hover, active pill) do not add heavy 3D shadows; they shift background tone subtly via `color-mix(in oklab, var(--accent) 18%, transparent)` and brighten border luminance.

### Named Rules

**The Shadowless Discipline.** No fuzzy multi-layer drop shadows (`box-shadow: 0 20px 25px...`). Surfaces declare depth exclusively through subtle background lightness deltas and razor-sharp 1px borders.

## Shapes

- **Radius Scale:**
  - Micro (`--radius-sm: 4px`): Checkboxes, copy buttons, inline tags.
  - Standard (`--radius-md: 6px`): Buttons, input fields, callout boxes.
  - Large (`--radius-lg: 8px`): Code block containers, project cards, modal overlays.
  - Pill (`--radius-full: 9999px`): Author badges, status chips, language toggle pills.
- **Form Language:** Crisp, rectangular discipline with gently softened corners (4–8px). Avoids ballooned roundness to maintain an architectural, engineered aesthetic.

## Components

### Code Blocks (Expressive Code)

- **Container:** Rounded (`--radius-lg: 8px`), framed by `1px solid var(--border)`, background set to `--muted`.
- **Header Bar:** Shows language badge (e.g. `TS`, `RUST`, `GO`), optional filename tab, and an interactive copy button with SVG feedback (`copy` icon swaps to green `check` mark).
- **Line Numbers & Highlighting:** Muted line numbers aligned left; highlighted lines feature a soft tinted background wash and subtle left indicator bar.

### Callout Boxes (Obsidian & Directive Style)

- **Styles:** `:::note`, `:::tip`, `:::warning`
- **Border & Background:** `1px solid var(--border)` with a 3px solid accent border along the inline-start edge. Background uses `color-mix(in oklab, [accent-color] 8%, var(--muted))`.
- **Typography:** Margin-block spacing `1em`, title in bold weight, body in body font size.

### Navigation & Masthead

- **Layout:** Compact horizontal header featuring author avatar/monogram, site title, primary nav links (`Posts`, `Projects`, `About`), RSS icon, and an OKLCH dark/light theme switch.
- **Active State:** Underlined with accent color; inactive links sit in `--muted-foreground` and hover to `--foreground`.

### Buttons & Tags

- **Tag Badge:** Pill shape (`--radius-full`), padding `2px 10px`, font size `--step-xs` (`0.875rem`), background `--muted`, text `--muted-foreground`. On hover, text shifts to `--foreground` and border brightens.
- **Primary Button:** Background `--primary`, text `--foreground`, padding `8px 16px`, radius `--radius-md` (6px).

## Do's and Don'ts

### Do:

- **Do** maintain a strict 44rem (~704px) maximum measure for prose paragraphs to guarantee effortless readability.
- **Do** test every code block, callout, and table in both light and dark modes to verify WCAG AAA contrast.
- **Do** provide copy buttons on all code snippets and include syntax highlighting language tags.
- **Do** use `light-dark()` with OKLCH colors for all color declarations.
- **Do** ensure Chinese characters (Traditional Chinese) render with appropriate line-height (`1.75`+) and fall back gracefully through system CJK fonts (`PingFang TC`, `Noto Sans CJK TC`).

### Don't:

- **Don't** use pure `#000000` or `#ffffff` high-glare surfaces; always use the calibrated paper and midnight slate tokens.
- **Don't** add decorative floating blob gradients, noisy background textures, or intrusive scrolling animations that distract from reading.
- **Don't** allow lines of technical prose to stretch across wide 1440px+ viewports without constraining the container.
- **Don't** wrap links in generic heavy buttons unless they trigger explicit state actions; use text links with the continuous underline wipe.
- **Don't** ship code blocks without an easy one-click copy mechanism.
