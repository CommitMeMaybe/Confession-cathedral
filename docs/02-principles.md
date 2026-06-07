# Software Engineering Principles

## 1. Controlled Components

**Definition:** A form element (input, textarea, select) whose value is managed by React state rather than the DOM. The component stores the current value in state and uses an `onChange` handler to update it, giving React single source of truth over the input.

**File:** `src/components/ConfessionForm.jsx`
- Line 6: `const [value, setValue] = useState("");` — state holds the textarea value
- Line 11: `const handleChange = (e) => setValue(e.target.value);` — every keystroke updates state
- Line 26: `value={value}` — textarea displays from state, not DOM
- Line 27: `onChange={handleChange}` — user input flows through React

---

## 2. Immutability

**Definition:** State is never mutated directly. Instead, a new copy of the data is created with the desired changes and passed to the setter. This preserves the previous state for reference, enables time-travel debugging, and lets React detect changes via reference equality.

**File:** `src/components/AppPage.jsx`
- Line 28: `setConfessions((prev) => [{ text, timestamp }, ...prev]);` — a new array is created (prepend), the old array is never mutated

**File:** `src/components/ConfessionForm.jsx`
- Line 16: `setValue("");` — value is replaced, not mutated

**File:** `src/components/LandingPage.jsx`
- Lines 18–19: `mousePosRef.current.x = x;` — refs are an intentional exception (imperative, non-rendering)

---

## 3. Lifting State Up

**Definition:** When multiple components need to share or react to the same data, the state is hoisted to the nearest common ancestor and passed down as props. Child components receive data and callbacks rather than owning the data themselves.

**File:** `src/components/AppPage.jsx`
- Line 7: `const [confessions, setConfessions] = useState([]);` — state lives in AppPage
- Line 26: `const addConfession = (text) => { ... setConfessions(...) }` — updater lives in AppPage
- Line 66: `<ConfessionForm onSubmit={addConfession} />` — passes callback down
- Line 74: `<ConfessionFeed items={confessions} />` — passes data down

**File:** `src/App.jsx`
- Line 7: `const [currentPage, setCurrentPage] = useState("landing");` — page state lives in App
- Line 35–39: passes `onEnter`, `wormholeActive`, `wormholeRef` to LandingPage
- Line 41: passes `onBack` to AppPage

---

## 4. Separation of Concerns

**Definition:** Each module or component addresses a distinct concern or responsibility. The codebase is organised so that rendering, state management, side effects, styling, and procedural logic live in separate, well-defined places.

| Concern | File |
|---|---|
| Page routing / top-level state | `src/App.jsx` |
| Entry / hero page layout | `src/components/LandingPage.jsx` |
| WebGL shader rendering | `src/components/PsychedelicBackground.jsx` |
| Main app layout & confessions state | `src/components/AppPage.jsx` |
| Text input & validation | `src/components/ConfessionForm.jsx` |
| List rendering | `src/components/ConfessionFeed.jsx` |
| Custom cursor SVG | `src/components/CustomCursor.jsx` |
| Decorative blobs | `src/components/BackgroundBlobs.jsx` |
| App styles | `src/AppPage.module.css`, `src/index.css` |
| Component styles | `src/components/*.module.css` |

---

## 5. Single Responsibility Principle

**Definition:** A component should have exactly one reason to change. It should do one thing and do it well, keeping the codebase modular and testable.

- **`ConfessionForm.jsx`** — only handles text input, validation, and submission. It owns no confession data.
- **`ConfessionFeed.jsx`** — only renders a list of items and handles the empty state.
- **`PsychedelicBackground.jsx`** — only manages a WebGL canvas lifecycle (compile, link, resize, render loop, cleanup).
- **`CustomCursor.jsx`** — only replaces the native cursor with an SVG crosshair.
- **`BackgroundBlobs.jsx`** — only renders two decorative gradient blobs.

---

## 6. Declarative Rendering

**Definition:** Components describe *what* the UI should look like for a given state, not *how* to achieve it. React handles the imperative DOM updates under the hood.

**File:** `src/App.jsx`
- Lines 33–42: `{currentPage === "landing" ? <LandingPage .../> : <AppPage .../>}` — UI is a pure function of state

**File:** `src/components/AppPage.jsx`
- Lines 69–75: `{confessions.length === 0 ? <EmptyState/> : <ConfessionFeed/>}` — renders different UI based on data

**File:** `src/components/ConfessionFeed.jsx`
- Lines 5–11: Early return for empty state before rendering the list

---

## 7. Composition over Inheritance

**Definition:** UI is built by composing small, independent components together rather than extending base classes or using inheritance hierarchies. Props wire components together.

**File:** `src/App.jsx`
- Line 35: `<LandingPage>` composes `<PsychedelicBackground>` + gradients + content

**File:** `src/components/AppPage.jsx`
- Line 66: `<ConfessionForm>` is composed inside AppPage
- Line 74: `<ConfessionFeed>` is composed inside AppPage

---

## 8. Downward Data Flow (Unidirectional)

**Definition:** Data flows from parent to child via props. Children never directly modify parent state — they call callbacks received as props. This makes data flow predictable and traceable.

- `App` → `LandingPage` (props: `onEnter`, `wormholeActive`, `wormholeRef`)
- `App` → `AppPage` (props: `onBack`)
- `AppPage` → `ConfessionForm` (props: `onSubmit`)
- `AppPage` → `ConfessionFeed` (props: `items`)
- `LandingPage` → `PsychedelicBackground` (props: `mousePosRef`, `wormholeRef`)

---

## 9. Callbacks as Props (Upward Communication)

**Definition:** Children communicate events or data to parents by calling function props passed down from the parent. This preserves unidirectional flow while allowing upward data movement.

| Callback | Passed From | Received By | File (lines) |
|---|---|---|---|
| `onEnter` | `App` → `LandingPage` → button `onClick` | `App.handleEnterCathedral` | `App.jsx:11,35; LandingPage.jsx:69` |
| `onBack` | `App` → `AppPage` → button `onClick` | `App.handleBackToLanding` | `App.jsx:28,41; AppPage.jsx:42` |
| `onSubmit` | `AppPage` → `ConfessionForm` → form `onSubmit` | `AppPage.addConfession` | `AppPage.jsx:26,66; ConfessionForm.jsx:12` |

---

## 10. useCallback for Referential Stability

**Definition:** `useCallback` returns a memoised function that only changes when its dependencies change. This prevents unnecessary re-renders of child components that receive the callback as a prop.

**File:** `src/App.jsx`
- Line 11: `const handleEnterCathedral = useCallback(() => { ... }, []);`
- Line 28: `const handleBackToLanding = useCallback(() => { ... }, []);`

**File:** `src/components/LandingPage.jsx`
- Line 12: `const handleMouseMove = useCallback((e) => { ... }, []);`

**File:** `src/components/AppPage.jsx`
- Line 10: `const handleMouseMove = useCallback((e) => { ... }, []);`

---

## 11. useEffect for Side Effects

**Definition:** Side effects (DOM manipulation, event listeners, timers, WebGL setup) are wrapped in `useEffect` with proper cleanup returned to avoid memory leaks and stale subscriptions.

**File:** `src/components/LandingPage.jsx`
- Lines 26–31: `useEffect` adds `mousemove` listener, cleanup removes it

**File:** `src/components/PsychedelicBackground.jsx`
- Lines 131–225: `useEffect` handles entire WebGL lifecycle:
  - Lines 180–186: Resize listener with cleanup
  - Lines 220–224: `requestAnimationFrame` with cleanup (missing explicit cancel but pattern is intended)

**File:** `src/components/AppPage.jsx`
- Lines 19–24: Mouse listener with cleanup

**File:** `src/components/CustomCursor.jsx`
- Lines 6–10: Mouse listener with cleanup

---

## 12. Conditional Rendering

**Definition:** Different JSX is returned based on state or props using ternary operators, `&&`, or early returns.

- `src/App.jsx:34`: Ternary switches between LandingPage and AppPage
- `src/components/AppPage.jsx:69`: Ternary switches between empty state and feed
- `src/components/ConfessionFeed.jsx:5–11`: Early return for empty state
- `src/components/PsychedelicBackground.jsx:86`: `if (effFalloff > 0.001)` controls shader branch

---

## 13. Early Return / Guard Clauses

**Definition:** A function or component returns early when preconditions are not met, avoiding nested conditionals and making the happy path clearer.

**File:** `src/components/PsychedelicBackground.jsx`
- Line 133: `if (!canvas) return;`
- Line 135: `if (!gl) return;`
- Line 154–157: `if (!gl.getProgramParameter(...)) { ... return; }`

**File:** `src/components/LandingPage.jsx`
- Line 13: `if (!bgRef.current) return;`

**File:** `src/components/ConfessionFeed.jsx`
- Lines 5–11: Early return with empty-state message when list is empty

**File:** `src/components/ConfessionForm.jsx`
- Line 14: `if (!isValid) return;` — prevents submission of invalid data

---

## 14. Refs for Mutable Values / Avoiding Re-renders

**Definition:** `useRef` stores mutable values that persist across renders but do not trigger re-renders when changed. Used for DOM references, animation state, and shared mutable objects.

| Ref | Purpose | File |
|---|---|---|
| `canvasRef` | Direct WebGL canvas access | `PsychedelicBackground.jsx:129` |
| `bgRef` (Landing) | CSS custom property updates on DOM | `LandingPage.jsx:7` |
| `bgRef` (App) | CSS custom property updates on DOM | `AppPage.jsx:8` |
| `mousePosRef` | Mutable mouse position read by shader render loop | `LandingPage.jsx:9` |
| `wormholeRef` | Animation progress read by shader render loop | `App.jsx:8` |

---

## 15. Functional Updater Pattern

**Definition:** When new state depends on previous state, the `useState` setter receives a function `(prev) => next` rather than a value. This guarantees the update uses the latest state, avoiding stale closures.

**File:** `src/components/AppPage.jsx`
- Line 28: `setConfessions((prev) => [{ text, timestamp }, ...prev]);`

---

## 16. Derived / Computed State

**Definition:** Values that can be calculated from existing state are computed at render time rather than stored as separate state. This eliminates synchronisation bugs.

**File:** `src/components/ConfessionForm.jsx`
- Line 8: `const trimmed = value.trim();` — derived from `value`
- Line 9: `const isValid = trimmed.length > 0 && trimmed.length <= max;` — derived from `trimmed`

---

## 17. CSS Modules for Style Scoping

**Definition:** CSS Module files (`.module.css`) generate locally-scoped class names at build time, preventing style collisions between components.

**Files:**
- `src/components/LandingPage.module.css`
- `src/components/AppPage.module.css`
- `src/components/ConfessionForm.module.css`
- `src/components/ConfessionFeed.module.css`
- `src/components/BackgroundBlobs.module.css` (referenced by BackgroundBlobs)

**Usage pattern (e.g., `LandingPage.jsx:2`):** `import styles from './LandingPage.module.css';`

---

## 18. Cleanup in useEffect

**Definition:** Side effects return a cleanup function from `useEffect` to tear down subscriptions, remove listeners, or cancel animations when the component unmounts or dependencies change. This prevents memory leaks.

**File:** `src/components/LandingPage.jsx`
- Line 30: `return () => window.removeEventListener('mousemove', handleMouseMove);`

**File:** `src/components/PsychedelicBackground.jsx`
- Line 223: `return () => { window.removeEventListener('resize', resize); };`

**File:** `src/components/AppPage.jsx`
- Line 23: `return () => window.removeEventListener('mousemove', handleMouseMove);`

**File:** `src/components/CustomCursor.jsx`
- Line 9: `return () => window.removeEventListener("mousemove", move);`

---

## 19. Shader as String (Embedded Domain-Specific Language)

**Definition:** GLSL shader source code is embedded as JavaScript template literals. This keeps the shader co-located with its JavaScript harness while remaining a distinct language with its own compilation step.

**File:** `src/components/PsychedelicBackground.jsx`
- Lines 5–11: `const vertexShaderSrc = \`...\`;` — vertex shader
- Lines 18–126: `const fragmentShaderSrc = \`...\`;` — fragment shader

---

## 20. Factory Pattern (Shader Compilation)

**Definition:** The `compile` function acts as a factory that encapsulates the creation and validation of WebGL shader objects, returning null on failure instead of throwing.

**File:** `src/components/PsychedelicBackground.jsx`
- Lines 137–147: `const compile = (src, type) => { ... return shader; }`
- Line 148: `const vert = compile(vertexShaderSrc, gl.VERTEX_SHADER);`
- Line 149: `const frag = compile(fragmentShaderSrc, gl.FRAGMENT_SHADER);`

---

## 21. Adapter Pattern (Coordinate Space Normalisation)

**Definition:** Mouse coordinates from the browser (`clientX`/`clientY` in pixel space) are adapted into normalised spaces for different consumers: CSS percentage for the glow, UV space (0–1) for the shared ref, and clip space (–1 to 1 with aspect correction) for the WebGL shader.

**File:** `src/components/LandingPage.jsx`
- Lines 15–16: Browser pixels → normalised 0–1 (`x`, `rawY`)
- Lines 18–19: Stored in ref for shader
- Lines 20–23: Converted to percentages for CSS custom properties

**File:** `src/components/PsychedelicBackground.jsx` (shader)
- Lines 69–72: UV (0–1) → clip space (–1 to 1) with aspect ratio correction
