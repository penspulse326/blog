# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are fellow software engineers, systems programmers, technical leads, and engineering peers. They read long-form technical deep-dives, architecture postmortems, and engineering essays during focused desktop or mobile sessions, seeking thorough problem-solving insights and technical depth without corporate fluff.

## Product Purpose

A personal engineering journal and technical blog for a software engineer. It provides a calm, high-rigor, distraction-free environment for reading complex engineering essays, architecture breakdowns, and technical explanations. Success means readers can immerse themselves in deep technical material with effortless legibility, superior code presentation, and clear visual diagrams.

## Positioning

An articulate, high-craft personal engineering publication bridging digital-garden depth with academic rigor. Refuses corporate marketing gimmicks, aggressive popups, decorative noise, and low-signal summaries. Stands out through meticulous typographic rhythm, first-class code presentation, and thoughtful interactive technical details.

## Operating Context

Engineers reading long technical pieces in code editors or web browsers across 4K desktop displays, laptops, and mobile screens. Readers frequently copy code snippets, inspect architecture diagrams, parse mathematical or algorithm notation, expand callout boxes, and switch between light and dark modes according to their ambient lighting environment.

## Capabilities and Constraints

- **Platform & Framework**: Built on Astro 7 with static content collections and minimal client-side runtime.
- **Code Highlighting**: Expressive syntax highlighting with line numbers, code copy buttons, filename tabs, and language badges.
- **Typography & Markdown Extensions**: Obsidian/directive-style callout directives (`:::note`, `:::tip`, `:::warning`).
- **Technical Visuals**: Native SVG diagrams, Mermaid diagram rendering, and LaTeX/math formula formatting.
- **Bilingual Support**: Layout and typography tuned for both English and Traditional Chinese (CJK line-height, font fallback, and text wrap balance).
- **Theming**: Dark and light modes driven by modern CSS `light-dark()` with OKLCH color spaces.
- **Quality tooling**: Strict oxlint, oxfmt, stylelint, and TypeScript validation.

## Brand Commitments

- Bound visually to the calm, disciplined academic/digital-garden aesthetic exemplified by [My Scholar](https://myscholar.pages.dev/) (`mychiffonn/myscholar`).
- Clear, honest, engineering-first tone; typography and whitespace lead the design.

## Evidence on Hand

- Reference architecture and style: [My Scholar](https://myscholar.pages.dev/) and its [GitHub repository](https://github.com/mychiffonn/myscholar).
- Fresh Astro 7 scaffold with oxlint, oxfmt, and stylelint in repository.
- Author content, initial articles, and personal avatar/bio to be supplied by the user.

## Product Principles

1. **Legibility & Measure First**: Optimal reading measure (~65-75 characters / 42-46rem), comfortable leading (1.7-1.8 for prose), balanced headings, and optical hierarchy.
2. **First-Class Technical Notation**: Code blocks, mathematical formulations, and system diagrams are primary citizens, treated with the same typographic care as prose.
3. **Restraint and Craft**: The interface recedes to let the engineering content lead. Personality manifests in hairline borders, refined hover states, and smooth underline wipes rather than loud ornament.
4. **Equal Theme Parity**: Light and dark themes are independently calibrated using OKLCH for pleasant contrast, avoiding muddy grays or harsh pure blacks.
5. **Zero Friction & Accessible**: Semantic HTML5, full keyboard navigation, respect for `prefers-reduced-motion`, and lightning-fast static page loads.
