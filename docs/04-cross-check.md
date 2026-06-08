# Cross-Check Audit: Principles Verification & Additional Vulnerabilities

**Audit Date:** 2026-06-08  
**Scope:** Entire codebase verification against documented principles and additional security/performance analysis

---

## Part 1: Principles Compliance Verification

This section verifies whether the 21 principles documented in `docs/02-principles.md` are actually implemented in the codebase.

| # | Principle | Status | Evidence | Violation? |
|---|-----------|--------|----------|------------|
| 1 | Controlled Components | ✅ PASS | `ConfessionForm.jsx:6,11,26-27` - state controls textarea value | No |
| 2 | Immutability | ✅ PASS | `AppPage.jsx:28` - functional updater creates new array | No |
| 3 | Lifting State Up | ✅ PASS | `AppPage.jsx:7,26,66,74` - state in parent, passed down | No |
| 4 | Separation of Concerns | ✅ PASS | Each component has distinct responsibility (rendering, state, styling) | No |
| 5 | Single Responsibility Principle | ✅ PASS | Components do one thing (form, feed, background, cursor) | No |
| 6 | Declarative Rendering | ✅ PASS | `App.jsx:34-42` - UI as function of state | No |
| 7 | Composition over Inheritance | ✅ PASS | Components composed via props, no inheritance | No |
| 8 | Downward Data Flow | ✅ PASS | Props flow from parent to child | No |
| 9 | Callbacks as Props | ✅ PASS | `onEnter`, `onBack`, `onSubmit` passed as props | No |
| 10 | useCallback for Referential Stability | ✅ PASS | `App.jsx:11,28`, `LandingPage.jsx:12`, `AppPage.jsx:10` | No |
| 11 | useEffect for Side Effects | ✅ PASS | All side effects wrapped in useEffect | No |
| 12 | Conditional Rendering | ✅ PASS | Ternary operators used throughout | No |
| 13 | Early Return / Guard Clauses | ✅ PASS | `PsychedelicBackground.jsx:133,135,154-157`, `ConfessionFeed.jsx:5-11` | No |
| 14 | Refs for Mutable Values | ✅ PASS | `mousePosRef`, `wormholeRef`, `canvasRef` used appropriately | No |
| 15 | Functional Updater Pattern | ✅ PASS | `AppPage.jsx:28` - `(prev) => [...prev]` | No |
| 16 | Derived / Computed State | ✅ PASS | `ConfessionForm.jsx:8-9` - `trimmed` and `isValid` derived | No |
| 17 | CSS Modules for Style Scoping | ✅ PASS | All components use `.module.css` files | No |
| 18 | Cleanup in useEffect | ⚠️ PARTIAL | Most effects have cleanup, but one critical issue (see below) | Partial |
| 19 | Shader as String | ✅ PASS | `PsychedelicBackground.jsx:5-126` - GLSL embedded | No |
| 20 | Factory Pattern | ✅ PASS | `PsychedelicBackground.jsx:137-147` - compile function | No |
| 21 | Adapter Pattern | ✅ PASS | Coordinate space normalization in `LandingPage.jsx:15-23` | No |

**Principles Compliance Summary:** 20/21 fully compliant, 1 partially compliant

---

## Part 2: Additional Vulnerabilities (Not Covered in 03-audit.md)

### 2.1 Memory Leak: Uncancelled Animation Frame

**File:** `PsychedelicBackground.jsx:218-220`

**Issue:**
```jsx
requestAnimationFrame(render);
```

The `requestAnimationFrame` is never cancelled. When the component unmounts (e.g., during page transition), the render loop continues running, attempting to call WebGL methods on a destroyed context.

**Impact:**
- Console errors
- Wasted CPU cycles
- Potential memory leak if component remounts repeatedly

**Severity:** 🔴 High

**Fix:**
```jsx
let animId;
const render = (time) => {
  // ... render code
  animId = requestAnimationFrame(render);
};
animId = requestAnimationFrame(render);

return () => {
  cancelAnimationFrame(animId);
  window.removeEventListener('resize', resize);
};
```

---

### 2.2 Performance: Computed Styles Read Every Frame

**File:** `PsychedelicBackground.jsx:205-211`

**Issue:**
```jsx
const rootStyles = getComputedStyle(document.documentElement);
const hueVar = rootStyles.getPropertyValue('--accent-hue');
```

This runs 60 times per second inside the render loop, forcing browser style recalculation each frame.

**Impact:**
- Unnecessary CPU overhead
- Potential jank on lower-end devices

**Severity:** 🟡 Medium

**Fix:** Read once at setup:
```jsx
let baseHue = 350.0;
const hueVar = getComputedStyle(document.documentElement)
  .getPropertyValue('--accent-hue');
if (hueVar) {
  const parsed = parseFloat(hueVar.trim());
  if (!isNaN(parsed)) baseHue = parsed;
}
// Then use baseHue in render loop
```

---

### 2.3 Performance: State Updates on Every Mousemove

**File:** `CustomCursor.jsx:7`

**Issue:**
```jsx
const move = (e) => setPos({ x: e.clientX, y: e.clientY });
```

Triggers React re-render on every mouse movement (up to 120 times/second on high-refresh displays).

**Impact:**
- Unnecessary virtual DOM diffing
- Unnecessary DOM updates
- Poor performance on mouse-heavy interactions

**Severity:** 🟡 Medium

**Fix:** Use ref + direct DOM manipulation:
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

return <div ref={elRef} style={{ position: "fixed", ... }}><svg ... /></div>;
```

---

### 2.4 Accessibility: Decorative Elements Not Hidden from Screen Readers

**Files:** `LandingPage.jsx:38-45`, `AppPage.jsx:34-38`, `BackgroundBlobs.jsx`

**Issue:**
Decorative gradient divs and blobs are not marked with `aria-hidden="true"`, causing screen readers to announce them unnecessarily.

**Impact:**
- Poor screen reader experience
- Unnecessary noise for assistive technology users

**Severity:** 🟡 Medium

**Fix:**
```jsx
<div className={styles.gradient1} aria-hidden="true"></div>
```

---

### 2.5 Accessibility: Custom Cursor Not Respecting User Preferences

**File:** `CustomCursor.jsx`

**Issue:**
- No check for `prefers-reduced-motion`
- No media query check for pointer devices
- No `aria-hidden` attribute
- Renders on touch devices where cursors don't exist

**Impact:**
- Users who disable custom cursors cannot opt out
- Touch devices render invisible cursor overlay
- Screen readers may announce the SVG

**Severity:** 🟡 Medium

**Fix:**
```jsx
const [isPointer, setIsPointer] = useState(false);
const [prefersReduced, setPrefersReduced] = useState(false);

useEffect(() => {
  const pointerMq = window.matchMedia('(pointer: fine)');
  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  setIsPointer(pointerMq.matches);
  setPrefersReduced(reducedMq.matches);
}, []);

if (!isPointer || prefersReduced) return null;

return <div aria-hidden="true" ...><svg ... /></div>;
```

---

### 2.6 Anti-Pattern: Ref as useEffect Dependency

**File:** `PsychedelicBackground.jsx:225`

**Issue:**
```jsx
}, [mousePosRef]);
```

`mousePosRef` is a ref object (stable identity). Including it as a dependency is misleading - it suggests the effect should re-run when the ref changes, but refs never trigger re-renders.

**Impact:**
- Confusing code intent
- Misleading for future maintainers

**Severity:** 🟢 Low

**Fix:**
```jsx
}, []); // Empty array - effect only runs once
// Or add explanatory comment:
// mousePosRef is a ref - stable across renders, included as reminder
```

---

### 2.7 Anti-Pattern: Static Accessibility Check

**File:** `PsychedelicBackground.jsx:136`

**Issue:**
```jsx
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Checked once at mount, never listens for changes. If user toggles the setting while page is open, animation state becomes stale.

**Impact:**
- Accessibility setting not respected after page load
- Confusing user experience

**Severity:** 🟢 Low

**Fix:**
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

---

### 2.8 Missing Error Boundary for WebGL

**File:** `PsychedelicBackground.jsx:134-135`

**Issue:**
```jsx
const gl = canvas.getContext('webgl');
if (!gl) return;
```

If WebGL is unavailable, component returns nothing silently. User sees black hole where pattern should be.

**Impact:**
- Poor fallback experience
- Confusing on unsupported devices

**Severity:** 🟢 Low

**Fix:**
```jsx
if (!gl) return <div className={styles.fallback} aria-hidden="true" />;
```

---

### 2.9 Magic Numbers Without Named Constants

**Files:** Multiple

**Issue:**
Hard-coded values throughout codebase without semantic names:
- `PsychedelicBackground.jsx:71` - `0.5` (UV midpoint)
- `PsychedelicBackground.jsx:89` - `0.7` (suction strength)
- `PsychedelicBackground.jsx:114` - `0.12` (rim glow offset)
- `PsychedelicBackground.jsx:213` - `0.55` (radius)
- `App.jsx:14` - `2000` (wormhole duration)

**Impact:**
- Difficult to tune values
- Code not self-documenting
- Magic numbers hard to understand

**Severity:** 🟢 Low

**Fix:**
```jsx
const WORMHOLE_DURATION_MS = 2000;
const PORTAL_RADIUS = 0.55;
const RIM_GLOW_OFFSET = 0.12;
const SUCTION_STRENGTH = 0.7;
```

---

## Part 3: Security Assessment

### 3.1 XSS Vulnerability Check

**Status:** ✅ SAFE

**Evidence:**
- User input rendered via JSX: `ConfessionFeed.jsx:17` - `{item.text}`
- React automatically escapes text content
- No `dangerouslySetInnerHTML` usage
- Timestamp generated via `new Date().toISOString()` (not user input)

**Conclusion:** No XSS vulnerabilities present.

---

### 3.2 Data Validation

**Status:** ✅ ADEQUATE

**Evidence:**
- Input length validation: `ConfessionForm.jsx:9` - `trimmed.length <= max`
- Empty check: `trimmed.length > 0`
- Trim whitespace before submission: `ConfessionForm.jsx:8`

**Concern:** No content sanitization beyond length check. Malicious text (not executable) could be submitted.

**Recommendation:** Consider adding profanity filter or content moderation if this becomes a public-facing app.

---

### 3.3 Dependency Security

**Status:** ⚠️ NEEDS REVIEW

**Dependencies:**
- `react@^18.2.0`
- `react-dom@^18.2.0`
- `@react-three/fiber@^8.18.0`
- `@react-three/drei@^9.122.0`
- `vite@^5.3.1`

**Recommendation:** Run `npm audit` to check for known vulnerabilities in dependencies.

---

### 3.4 Client-Side Only Architecture

**Status:** ✅ SECURE FOR INTENDED USE

**Observation:**
- No backend, no API calls
- No data persistence (confessions lost on refresh)
- No authentication/authorization needed

**Security Implication:** Since there's no server or database, traditional web vulnerabilities (SQL injection, CSRF, server-side XSS) are not applicable.

---

## Part 4: Summary & Priorities

### Critical Issues (Fix Immediately)

| Issue | File | Severity |
|-------|------|----------|
| Uncancelled animation frame → memory leak | `PsychedelicBackground.jsx:218` | 🔴 High |

### High Priority (Fix Soon)

| Issue | File | Severity |
|-------|------|----------|
| Computed styles read 60x/sec | `PsychedelicBackground.jsx:205-211` | 🟡 Medium |
| State updates every mousemove | `CustomCursor.jsx:7` | 🟡 Medium |
| Decorative elements not aria-hidden | `LandingPage.jsx`, `AppPage.jsx` | 🟡 Medium |
| Custom cursor not accessible | `CustomCursor.jsx` | 🟡 Medium |

### Medium Priority (Fix When Convenient)

| Issue | File | Severity |
|-------|------|----------|
| Ref as useEffect dependency | `PsychedelicBackground.jsx:225` | 🟢 Low |
| Static accessibility check | `PsychedelicBackground.jsx:136` | 🟢 Low |
| No WebGL fallback | `PsychedelicBackground.jsx:134-135` | 🟢 Low |
| Magic numbers without constants | Multiple files | 🟢 Low |

### Principles Compliance

- **Fully Compliant:** 20/21 principles
- **Partially Compliant:** 1/21 (Cleanup in useEffect - missing animation frame cancellation)
- **Violations:** 0

### Overall Assessment

The codebase demonstrates strong adherence to documented software engineering principles. The primary issues are:
1. One memory leak risk (uncancelled animation frame)
2. Several performance optimizations needed
3. Accessibility improvements for screen readers and user preferences

No security vulnerabilities were found. The client-side-only architecture eliminates many traditional web security risks.

---

## Part 5: Recommended Action Plan

1. **Immediate:** Fix animation frame cancellation in `PsychedelicBackground.jsx`
2. **This Week:** Optimize computed styles reading and cursor state updates
3. **Next Sprint:** Add accessibility attributes (`aria-hidden`, media queries)
4. **Ongoing:** Run `npm audit` regularly, extract magic numbers to constants
