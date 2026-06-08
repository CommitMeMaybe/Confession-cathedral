# Code Audit: XSS, Accessibility, Performance, and Anti-Patterns

**Audited files:**
`App.jsx`, `LandingPage.jsx`, `PsychedelicBackground.jsx`, `AppPage.jsx`,
`ConfessionForm.jsx`, `ConfessionFeed.jsx`, `CustomCursor.jsx`,
`BackgroundBlobs.jsx`, `ConfessionForm.module.css`, `ConfessionFeed.module.css`,
`AppPage.module.css`, `LandingPage.module.css`

---

## 1. XSS (Cross-Site Scripting)

### What is XSS?

XSS is when a bad guy types JavaScript code into a text box, and the website
accidentally runs it. Imagine someone writing `<script>stealCookies()</script>`
as their confession — if the site treated that as real code instead of plain text,
it could steal data.

### Finding: User text is rendered safely ✅

The confession text is rendered at `ConfessionFeed.jsx:17`:

```jsx
<p className={styles.confessionText}>{item.text}</p>
```

React's JSX automatically escapes text content by default. If `item.text` contains
`<script>alert('xss')</script>`, React renders it as literal text — the angle
brackets become `&lt;` and `&gt;` in the DOM. The browser shows the ugly symbols
instead of running any code.

The same protection applies to the timestamp at line 19:

```jsx
{new Date(item.timestamp).toLocaleString()}
```

`toLocaleString()` returns a plain string. React escapes it.

### Why this is safe

| Risk | Why it's not vulnerable |
|------|------------------------|
| User types HTML in confession | React escapes `{item.text}` in JSX |
| User submits malicious input | `onSubmit(trimmed)` passes a string — no execution |
| Timestamp injection | Created by `new Date().toISOString()` — not from user input |
| `dangerouslySetInnerHTML` | Not used anywhere in the codebase ✅ |

### The one thing to watch for

If anyone later writes this:

```jsx
<p dangerouslySetInnerHTML={{ __html: item.text }} />
```

That would be an XSS disaster. Never do that with user-submitted text. If you
absolutely need to render formatted text, use a library like DOMPurify to clean
the input first. But for now, this codebase is safe.

---

## 2. Accessibility

### 2a. The textarea has no label (`ConfessionForm.jsx:23-28`)

```jsx
<textarea
  className={styles.textarea}
  placeholder="What weighs upon your soul…"
  value={value}
  onChange={handleChange}
  maxLength={max + 50}
/>
```

A `placeholder` is not a label. Screen readers (software blind people use to hear
websites) may read the placeholder, but once you start typing, it disappears — and
so does the user's understanding of what this box is for.

**Fix:** Add a visible `<label>` linked by `htmlFor`/`id`, or at minimum an
`aria-label`. Add this right before the textarea:

```jsx
<label htmlFor="confession-input" className={styles.visuallyHidden}>
  Your confession
</label>
<textarea
  id="confession-input"
  ...
/>
```

The `visuallyHidden` class keeps the label invisible on screen but readable
by screen readers. You can add it to your CSS:

```css
.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

Or simpler, add `aria-label="Your confession"` directly on the `<textarea>`:

```jsx
<textarea aria-label="Your confession" ... />
```

### 2b. The textarea has `outline: none` (`ConfessionForm.module.css:35`)

```css
.textarea {
  outline: none;
}
```

Keyboard users navigate with the Tab key. A blue glow (the "outline") shows them
which element is focused. Removing it makes the page unusable for people who
can't use a mouse.

**Fix:** Replace with a custom focus style instead of removing it entirely:

```css
.textarea:focus {
  outline: 1px solid rgba(155, 0, 25, 0.6);
  outline-offset: 2px;
}
```

Or if you want to keep the dark aesthetic, use a subtle red glow:

```css
.textarea:focus {
  box-shadow: 0 0 0 1px rgba(155, 0, 25, 0.4);
}
```

### 2c. Custom cursor hides the real cursor (`CustomCursor.jsx`)

The custom cursor replaces the native pointer with an SVG crosshair. There's no
way to disable it, and it has no `aria-hidden` attribute.

Problems:
- Users who need high-contrast cursors or specific cursor sizes lose their
  system settings.
- Screen readers might try to describe the SVG.
- The component is always rendered, even on touch devices where there is no cursor.

**Fix:** Add `aria-hidden="true"` to the wrapping div so screen readers ignore it.
Wrap the entire thing in a check that only renders on pointer devices:

```jsx
const [isPointer, setIsPointer] = useState(false);

useEffect(() => {
  const mq = window.matchMedia('(pointer: fine)');
  setIsPointer(mq.matches);
}, []);
```

Then wrap the cursor: `{isPointer && <div ...>}`

### 2d. Decorative elements not hidden from screen readers

The gradient divs in `LandingPage.jsx:38-45` and `AppPage.jsx:34-38` are purely
decorative, as are `BackgroundBlobs.jsx` and the icon/spacer divs throughout.

Screen readers don't need to know about these. They add noise.

**Fix:** Add `aria-hidden="true"` to all decorative divs:

```jsx
<div className={styles.gradient1} aria-hidden="true"></div>
```

And in `BackgroundBlobs.jsx`, wrap the fragment in `<div aria-hidden="true">`
or add the attribute to both blob divs.

### 2e. No focus management on page switch

When the wormhole animation finishes and `App.jsx` switches from LandingPage to
AppPage, focus resets to the top of the document. A keyboard user tabbing through
the landing page suddenly loses their place.

**Fix:** After switching pages, move focus to the first interactive element (the
back button or the textarea). In `AppPage`, use a `useEffect` + `ref`:

```jsx
const backBtnRef = useRef(null);

useEffect(() => {
  backBtnRef.current?.focus();
}, []);

// In JSX:
<button ref={backBtnRef} className={styles.backButton} onClick={onBack}>
```

### 2f. Keyboard shortcut not actually implemented (`ConfessionForm.jsx:41`)

```jsx
<p className={styles.keyboardHint}>⌘ + Enter to submit</p>
```

This hint tells users about a keyboard shortcut that doesn't exist. The
`handleSubmit` function only runs on form submission (button click or Enter in
most setups), not specifically on ⌘+Enter.

**Fix:** Add a keyboard listener, or remove the hint. To add the shortcut:

```jsx
useEffect(() => {
  const handler = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      document.getElementById('confession-form')?.requestSubmit();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### 2g. Missing `role` on the confession feed (`ConfessionFeed.jsx:14`)

```jsx
<div className={styles.feed}>
```

A feed of user-submitted content should have `role="feed"` so screen readers
know it's a dynamic list.

**Fix:** Add `role="feed"` and an `aria-label`:

```jsx
<div className={styles.feed} role="feed" aria-label="Confessions">
```

### 2h. Color contrast (borderline)

The counter text `#9a7a70` at 11.52px on `#1a0a10` background gives roughly a
4.9:1 contrast ratio. For small text under 18px, WCAG AA requires 4.5:1. This
passes but just barely. The `opacity: 0.5` on `.keyboardHint` makes it even
harder to read.

**Fix:** For the keyboard hint, increase opacity to at least 0.7 or use a lighter
colour to guarantee 4.5:1 on the dark background.

---

## 3. Performance for Long Lists

### 3a. Array index as key (`ConfessionFeed.jsx:16`)

```jsx
{items.map((item, i) => (
  <div key={i} className={styles.confessionItem}>
```

Using the array index as the `key` prop is the most common React performance trap.

**Why it's a problem:** When new confessions are added, they're inserted at the
*front* of the array (`[{ text, timestamp }, ...prev]`). With `key={i}`, every
existing item's key changes because their indices shift by 1. React thinks every
item is new and recreates all DOM nodes instead of reusing the existing ones.

**The fix:** Use a unique, stable identifier. Since we already have a timestamp,
use that (combined with a random suffix if needed):

```jsx
{items.map((item) => (
  <div key={item.timestamp} className={styles.confessionItem}>
```

Or generate a proper unique ID when adding:

```jsx
const addConfession = (text) => {
  setConfessions((prev) => [
    { text, timestamp: Date.now(), id: crypto.randomUUID() }, ...prev
  ]);
};
```

Then use `key={item.id}`.

### 3b. No list virtualization

With a `maxHeight: 360px` and `overflow-y: auto` (`ConfessionFeed.module.css:3-4`),
the feed scrolls. But all items are rendered in the DOM. At 1000 confessions, that
means 1000+ DOM nodes — each with their own event handlers, styles, and layout
calculations.

**The fix for now:** The simplest improvement is a `max-height` with overflow
(already done). If the list grows beyond ~200 items, add virtualization using
`react-window` or `@tanstack/react-virtual`:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef(null);
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
});

return (
  <div ref={parentRef} className={styles.feed} style={{ overflowY: 'auto' }}>
    <div style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((vItem) => (
        <div
          key={items[vItem.index].timestamp}
          style={{ transform: `translateY(${vItem.start}px)` }}
        >
          ... item content ...
        </div>
      ))}
    </div>
  </div>
);
```

This only renders ~10 items that are actually visible, no matter how many
thousands are in the list.

### 3c. requestAnimationFrame never cancelled (`PsychedelicBackground.jsx:218`)

```jsx
requestAnimationFrame(render);
```

If the component unmounts (e.g., during the wormhole transition), `render`
might still be scheduled. It will try to call WebGL methods on a destroyed
context, causing errors and wasting CPU.

**Fix:** Save the animation frame ID and cancel it in the cleanup:

```jsx
let animId;
const render = (time) => {
  ...
  animId = requestAnimationFrame(render);
};
animId = requestAnimationFrame(render);

return () => {
  cancelAnimationFrame(animId);
  window.removeEventListener('resize', resize);
};
```

### 3d. Reading computed styles every frame (`PsychedelicBackground.jsx:205-211`)

```jsx
const rootStyles = getComputedStyle(document.documentElement);
const hueVar = rootStyles.getPropertyValue('--accent-hue');
```

This runs 60 times per second inside the render loop. It forces the browser to
recalculate styles every frame, which can cause jank.

**Fix:** Read it once outside the loop:

```jsx
// Read once at setup
let baseHue = 350.0;
const hueVar = getComputedStyle(document.documentElement)
  .getPropertyValue('--accent-hue');
if (hueVar) {
  const parsed = parseFloat(hueVar.trim());
  if (!isNaN(parsed)) baseHue = parsed;
}

const render = (time) => {
  ...
  gl.uniform1f(uHue, baseHue);
  ...
};
```

### 3e. State updates on every mousemove (`CustomCursor.jsx:7`)

```jsx
const move = (e) => setPos({ x: e.clientX, y: e.clientY });
```

This triggers a React re-render (state change → virtual DOM diff → DOM update)
every time the mouse moves — up to 120 times per second on high-refresh screens.
The cursor is just a visual overlay; it doesn't need React's re-render cycle.

**Fix:** Use a ref for the position and update the DOM directly:

```jsx
const posRef = useRef({ x: -100, y: -100 });
const elRef = useRef(null);

useEffect(() => {
  const move = (e) => {
    posRef.current = { x: e.clientX, y: e.clientY };
    if (elRef.current) {
      elRef.current.style.transform = `translate(${e.clientX - 14}px, ${e.clientY - 18}px)`;
    }
  };
  window.addEventListener("mousemove", move);
  return () => window.removeEventListener("mousemove", move);
}, []);

return (
  <div
    ref={elRef}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999,
      pointerEvents: "none",
    }}
  >
    <svg ... />
  </div>
);
```

This updates the GPU-composited transform without triggering React re-renders.

---

## 4. Anti-Patterns

### 4a. Array index as key (`ConfessionFeed.jsx:16`)  ← also a performance issue

Already covered in section 3a. It's both a performance *and* correctness problem.

### 4b. Ref object as useEffect dependency (`PsychedelicBackground.jsx:225`)

```jsx
}, [mousePosRef]);
```

`mousePosRef` is a ref object — its identity never changes across renders.
Listing it as a dependency is misleading. It suggests "re-run this effect when the
ref changes", but that will never happen (React doesn't watch `.current`).

**Why it works anyway:** The effect only needs to run once to set up the WebGL
context and start the render loop. Since `mousePosRef` never changes, the effect
never re-runs. This is correct *behaviour* but confusing *code*.

**Fix:** Either use an empty dependency array (since `mousePosRef` is a ref and
doesn't need to be a dependency):

```jsx
}, []);
```

Or add a comment explaining the pattern:

```jsx
// mousePosRef is a ref — stable across renders, included as reminder
// that the render loop reads it each frame without re-running this effect
}, [mousePosRef]);
```

### 4c. State update inside ref-based animation (`CustomCursor.jsx:4`)

Covered in 3e. Using `useState` for something that updates 60-120 times per
second is an anti-pattern. Refs are for frequent-update values; state is for
things that affect the render tree.

### 4d. `prefers-reduced-motion` is checked once, never listened (`PsychedelicBackground.jsx:136`)

```jsx
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

If the user changes their accessibility setting while the page is open (some
OS-level toggles do this), the value is stale. The animation stays frozen or
unfrozen based on the old setting.

**Fix:** Listen for changes:

```jsx
const [prefersReduced, setPrefersReduced] = useState(false);

useEffect(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  setPrefersReduced(mq.matches);
  const handler = (e) => setPrefersReduced(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

### 4e. No error boundary for WebGL

If the GPU doesn't support WebGL (older devices, some browsers), `canvas.getContext('webgl')`
returns `null`. The component returns nothing silently — the user just sees a black
hole where the pattern should be.

**Fix:** Show a fallback when WebGL is unavailable. A simple approach in the
component:

```jsx
if (!gl) return <div className={styles.fallback} />;
```

Or better, create an error boundary component:

```jsx
class WebGLErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError
      ? <div className={styles.fallback} />
      : this.props.children;
  }
}
```

### 4f. Imperative DOM manipulation inside React (`LandingPage.jsx:22-23`)

```jsx
bgRef.current.style.setProperty('--mouse-x', `${pctX}%`);
bgRef.current.style.setProperty('--mouse-y', `${pctY}%`);
```

This is bending the rules of React's declarative model by directly touching the
DOM. In this case it's necessary — CSS custom properties can't be set through
React's `style` prop with dynamic values in a clean way.

**Not a bug, but worth noting:** If you ever add a CSS-in-JS solution or a styling
library, move this to that library's theming system. For now, the pattern is
acceptable because it only sets CSS variables (no layout-affecting properties).

### 4g. Magic numbers without named constants

Throughout the codebase, there are "magic numbers" — hard-coded values whose
meaning isn't obvious:

- `PsychedelicBackground.jsx:71`: `0.5` — why half? (It's the midpoint of UV space)
- `PsychedelicBackground.jsx:89`: `0.7` — the suction strength
- `PsychedelicBackground.jsx:114`: `0.12` — the rim glow offset
- `PsychedelicBackground.jsx:213`: `0.55` — the radius
- `App.jsx:14`: `2000` — the wormhole duration in ms

**Fix:** Extract these into named constants at the top of the file:

```js
const WORMHOLE_DURATION_MS = 2000;
const PORTAL_RADIUS = 0.55;
const RIM_GLOW_OFFSET = 0.12;
```

This makes the code self-documenting and easier to tune.

---

## Summary of Fix Priorities

| Severity | Issue | File | Line |
|----------|-------|------|------|
| 🔴 High | Textarea missing label | `ConfessionForm.jsx` | 23-28 |
| 🔴 High | `outline: none` kills keyboard focus | `ConfessionForm.module.css` | 35 |
| 🔴 High | `key={i}` causes broken re-renders | `ConfessionFeed.jsx` | 16 |
| 🔴 High | rAF never cancelled → errors on unmount | `PsychedelicBackground.jsx` | 218 |
| 🟡 Medium | Computed styles read 60 times/sec | `PsychedelicBackground.jsx` | 205-211 |
| 🟡 Medium | Custom cursor state update every frame | `CustomCursor.jsx` | 7 |
| 🟡 Medium | Cursor inaccessible / not `aria-hidden` | `CustomCursor.jsx` | 12-54 |
| 🟡 Medium | Decorative divs not `aria-hidden` | `LandingPage.jsx`, `AppPage.jsx` | 38-45, 34-38 |
| 🟡 Medium | `⌘+Enter` hint but no shortcut | `ConfessionForm.jsx` | 41 |
| 🟡 Medium | No focus management on page switch | `App.jsx`, `AppPage.jsx` | — |
| 🟡 Medium | Ref as useEffect dependency (misleading) | `PsychedelicBackground.jsx` | 225 |
| 🟢 Low | `prefers-reduced-motion` not watched | `PsychedelicBackground.jsx` | 136 |
| 🟢 Low | No WebGL error boundary fallback | `PsychedelicBackground.jsx` | 135 |
| 🟢 Low | Magic numbers without constants | Multiple files | — |
| 🟢 Low | Feed missing `role="feed"` | `ConfessionFeed.jsx` | 14 |
| 🟢 Low | Keyboard hint opacity too low | `ConfessionForm.module.css` | 106 |
