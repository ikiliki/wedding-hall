# SKILL: mobile-responsive-css

Mobile-first invariants for the Wedding Hall client. Binding for any change that touches `client/src/styles/*.css` or any `wh-*` class. Read this **before** adding a new component, before adding new CSS, and before fixing a "things look weird on my phone" report.

## Why this exists

The wizard runs RTL Hebrew on iOS Safari at viewport widths down to 320 px (iPhone SE). The product brief is "mobile-first, black/white minimal luxury" (`RULES.md`). Most regressions in this codebase have been the same shape: a desktop-default rule shipped without a mobile counterpart, an absolutely-positioned popover with a hard-coded width, or a flex child without `min-width: 0` that refused to shrink. This skill is the checklist that makes those classes of bug not happen.

## The invariants (binding)

These are enforced at the top of `client/src/styles/style.css`. Don't undo them, and don't paper over them locally:

1. **`box-sizing: border-box` is global.** Set on `*, *::before, *::after`. Never write `box-sizing: content-box` anywhere; never re-declare `border-box` ad-hoc on a single class (it just adds noise).
2. **Media never escapes its container.** `img, picture, video, canvas, iframe { display: block; max-width: 100%; height: auto }`. `svg { max-width: 100% }`. If you need a fixed-aspect image, set `object-fit: cover` on the element, not `height: <px>` without a width sibling.
3. **No horizontal scroll at 320 px.** The wizard root has `overflow: hidden` and `html` has `overflow-x: hidden` — but those are last-resort guards. The real fix is always at the offending child.
4. **Containers cap themselves with `max-inline-size: min(<n>rem, 100%)`**, never a bare `max-width: <n>rem`. Bare `max-width` does the wrong thing inside a constrained ancestor (it can still let padding push the content past the parent if box-sizing is wrong, and it doesn't shrink with the viewport).
5. **Flex/grid children that hold text or inputs need `min-width: 0`.** This is the single most common cause of "my long Hebrew word overflows": flex items default to `min-width: auto` (= their intrinsic min-content size), which means a long unbreakable run keeps the flex item wider than the viewport. Add `min-width: 0` and pair with `overflow-wrap: anywhere` if the content has unbreakable strings.
6. **Mobile-first, then desktop add-ons.** Default rules describe the mobile layout. Use `@media (min-width: 640px) { ... }` to add desktop. Avoid `@media (max-width: 639px)` for anything except *undoing* a desktop-only convenience that doesn't apply to mobile — it's an anti-pattern to write the desktop case first and then strip it down.

## Breakpoint set (project convention)

Match the existing media queries in `style.css` and `stitch-overrides.css`. Do not invent new ones:

| Breakpoint | Width   | Used for                                              |
|------------|---------|-------------------------------------------------------|
| sm         | 640 px  | Two-column form grids, footer row direction.          |
| md         | 768 px  | Wizard top-nav appears, legal footer goes horizontal. |
| lg         | 1024 px | Dashboard sidebar, multi-pane wizard summary aside.   |
| xl         | 1280 px | Wider hero / dashboard tiles.                         |

`stitch-overrides.css` also uses two narrow breakpoints to fix specific component layouts: `(max-width: 520px)` (toggle becomes single column) and `(max-width: 899px)` (summary aside collapses inline). Don't add more — extend an existing one.

## Viewport units — the `dvh` rule

Use `100dvh` (dynamic viewport height) for any "fill the screen" container, with `100vh` as a fallback in the same declaration:

```css
.wh-wizard-root {
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
}
```

`100vh` on iOS Safari includes the address bar's space even when it's collapsed, which is why bottom-anchored content (footer bar) clips below the fold without the `dvh` fallback.

## Patterns

### Width

```css
/* Container that should fill its parent but cap at a comfortable
   reading width on desktop. */
.wh-some-container {
  width: 100%;
  max-inline-size: min(36rem, 100%);
  margin-inline: auto;
}
```

### Padding & safe-area

For fixed bars at the top/bottom of the viewport:

```css
.wh-some-bar {
  padding-inline: clamp(1rem, 4.5vw, 1.5rem);
  padding-block-end: max(1rem, env(safe-area-inset-bottom, 0px));
}
```

### Long unbreakable text

Hebrew runs without spaces (URLs, hashes, "אאאאאאאאאאאאאאאאאא") need both:

```css
.wh-some-text {
  min-width: 0;             /* on the flex/grid parent context */
  overflow-wrap: anywhere;  /* break inside any character */
  word-break: break-word;   /* legacy fallback for older Safari */
}
```

### Popovers / floating panels

A popover anchored to a trigger near the viewport edge will overflow unless you clamp it explicitly:

```css
.wh-some-popover {
  width: min(18rem, calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
}
```

This guarantees 1rem of breathing room on each side regardless of viewport width.

### Floating expandable panel (FAB)

When a side panel that's inline on desktop becomes a floating action button on mobile (the `WizardMiniBudgetSummary` budget circle is the canonical example): keep the same DOM, swap presentation via media query and a `data-expanded` attribute. The wrapper gets `pointer-events: none` so taps pass through to the content underneath; the inner button gets `pointer-events: auto` so it's still tappable. Click-outside detection lives in a `useEffect` that only attaches listeners while expanded:

```css
@media (max-width: 899px) {
  .wh-some-aside { position: fixed; inset-block-end: calc(<chrome-height> + env(safe-area-inset-bottom, 0px)); inset-inline-start: 1rem; pointer-events: none; z-index: 45; }
  .wh-some-aside .wh-some-inner { pointer-events: auto; position: relative; }
  .wh-some-fab { display: inline-flex; /* visible only on mobile */ }
  .wh-some-inner .wh-some-bubble { display: none; }
  .wh-some-inner[data-expanded="true"] .wh-some-bubble { display: block; position: absolute; inset-block-end: calc(100% + 0.65rem); width: min(20rem, calc(100vw - 2rem)); max-height: calc(100dvh - 14rem); overflow-y: auto; }
}
@media (min-width: 900px) {
  .wh-some-fab { display: none; }
}
```

Always cap the expanded bubble's `max-height` so a long list scrolls inside it instead of being clipped at the top of the viewport. Pin `inset-block-end` above the wizard's bottom chrome (footer-bar + legal-footer ≈ 9.5rem) so the FAB doesn't overlap the action buttons.

### Stacked buttons in a column

When a footer-action stack is `flex-direction: column` on mobile, every direct child must stretch — otherwise intrinsic-width buttons look ragged. Pattern:

```css
.wh-some-stack {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.wh-some-stack > * {
  width: 100%;
  max-width: 100%;
}
@media (min-width: 640px) {
  .wh-some-stack { flex-direction: row; }
  .wh-some-stack > * { width: auto; }
}
```

## Checklist for adding a new wizard component

Before merging, walk through this list with the actual code in front of you:

1. Component renders correctly at **320 × 568** (iPhone SE 1st gen — the worst-case viewport we still support). Use Chrome DevTools device toolbar, not a hunch.
2. No horizontal scroll at any wizard step. The browser's "horizontal scrollbar visible" is a hard fail.
3. The component's outermost container uses `width: 100%; max-inline-size: min(<cap>, 100%)`. No bare `max-width: <px>`.
4. Every flex/grid child that holds text or an `<input>` has `min-width: 0` *or* its parent has `grid-template-columns: minmax(0, 1fr) ...`.
5. All `<input>` and `<button>` elements either fill their cell or have a documented intrinsic width with `min-width: min(<n>rem, 100%)`.
6. Anywhere you used a hard-coded `width: <n>rem` for a popover, dropdown, tooltip, or modal — clamp it with `min(<n>rem, calc(100vw - 2rem))`.
7. RTL Hebrew text test: drop a 30-character no-space run into the longest label slot and confirm it breaks instead of overflowing.
8. The component has a co-located `*.styles.ts` exporting `wh-*` class names; the actual CSS lives in `client/src/styles/style.css` (legacy base) or `client/src/styles/stitch-overrides.css` (active wizard theme). Don't add new `<style>` tags in components, no inline `style=` except for dynamic values that can't be expressed in CSS (e.g. `style={{ width: \`${pct}%\` }}` for the progress fill).
9. If you added a Storybook story, add a `mobile` viewport variant that renders at 360 × 640.

## What NOT to do

- **Don't reach for utility-class soup** (`className="flex items-center w-full p-4"`). The styling system is `wh-*` classes. If you need a one-off layout, add a new `wh-*` class.
- **Don't introduce inline `style=` for layout.** Reserve inline style for genuinely dynamic values (computed widths, transforms tied to React state). Static layout belongs in CSS.
- **Don't add a third stylesheet.** Two are enough: `style.css` (base, design tokens, legacy components) and `stitch-overrides.css` (the active wizard theme). When in doubt, put it in `stitch-overrides.css`.
- **Don't write `@media (max-width: 639px)` to fix a desktop layout that should never have shipped.** Move the offending rule into `@media (min-width: 640px)` instead.
- **Don't use `vw` for font sizes** without a `clamp()` floor and ceiling. `clamp(1rem, 3vw, 1.25rem)` is fine; bare `font-size: 3vw` is not.
- **Don't set `min-height` on a card without a matching mobile override.** The bento cards on desktop have `min-height: 13.5rem` — they collapse to `min-height: auto` at ≤639 px. Always pair the two.

## When you fix a mobile bug

Open a follow-up PR for the prevention layer:

1. The local fix.
2. Add a row to the "Checklist" section above so the same shape doesn't recur.
3. If the fix touches a global class (popover, button stack, form grid), update the Patterns section with the new canonical recipe.

## See also

- `RULES.md` § "UX & quality" — the binding mobile-first rule and the `wh-*`-only style architecture.
- `AGENTS.md` § "Conventions" — the `*.styles.ts` colocation pattern.
- `client/src/styles/style.css` — global resets, design tokens, legacy components.
- `client/src/styles/stitch-overrides.css` — active wizard / dashboard theme.
- `.claude-rules/skills/wedding-hall-pr-workflow/SKILL.md` — branch + commit conventions for shipping the fix.
