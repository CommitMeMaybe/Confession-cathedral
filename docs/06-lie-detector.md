# Lie Detector: Five Statements About the App

**Experiment Date:** 2026-06-08

---

## The Five Statements

> **Statement A:** The transition from the landing page to the confession page uses a 2000ms "wormhole" animation driven by `requestAnimationFrame`, and only switches the page after the animation completes.

> **Statement B:** The custom cursor is an SVG cross rendered via React state, positioned using fixed coordinates on every mousemove event.

> **Statement C:** The app uses React Router to handle navigation between the landing page and the confession page.

> **Statement D:** Confessions are stored in a state array and displayed newest-first, with an empty state message shown when there are none.

> **Statement E:** The psychedelic background's Y mouse coordinate is inverted (`1.0 - rawY`) before being passed to the shader, so moving the mouse up corresponds to an upward direction in the shader.

---

## Detecting the Lie

**The lie is Statement C.**

### How I spotted it

I read `src/App.jsx`. There is no import of `react-router-dom`, no `<BrowserRouter>`, no `<Routes>`, no `<Route>`, and no `<Link>` components anywhere in the codebase. Navigation is handled entirely via a `currentPage` state variable (`"landing"` or `"app"`) with a simple ternary conditional render:

```jsx
const [currentPage, setCurrentPage] = useState("landing");
// ...
{currentPage === "landing" ? (
  <LandingPage ... />
) : (
  <AppPage ... />
)}
```

The page switch is triggered inside a `requestAnimationFrame` callback after the wormhole animation finishes — but that's an animation step, not routing. No URL changes, no history stack, no router library involved.

### Why it's plausible

React Router is extremely common in React apps, and page-like conditional rendering with state can look like routing at a glance. A reader who only skims the component names (`LandingPage`, `AppPage`) might assume a router is involved.

---

## The AI's Answer

The AI presented five statements. Statement C is false. The remaining four statements (A, B, D, E) are true, verifiable against the source code.
