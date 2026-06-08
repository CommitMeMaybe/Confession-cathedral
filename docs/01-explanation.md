# How the Confession Cathedral Website Works

## The Very Beginning (`index.html`)

This is the single HTML page of the whole website. It's like the cover of a book — just
a shell that says "here is the empty page" and points to our scripts.

- **Line 6:** The title that shows up on your browser tab.
- **Line 10:** Loads fancy fonts (Cinzel and Crimson Text) from Google so text looks
  like it belongs in a church.
- **Line 13:** A `<div id="root">` — an empty box where the whole app gets built.
- **Line 14:** Loads `main.jsx` — the first JavaScript file that wakes everything up.

---

## The Starter Button (`main.jsx`)

This is like the ignition key. It grabs the empty `<div id="root">` box from the HTML
page and asks React to fill it with our `<App />` component.

- **Line 6:** `createRoot(document.getElementById('root'))` finds the empty div and
  prepares it for React.
- **Line 7–10:** `root.render(...)` tells React "start the App component here".
- **Line 8:** `<React.StrictMode>` is a helper that checks for mistakes during
  development — like a teacher looking over your shoulder.

---

## The Building Blocks Shared by Everyone (`index.css`)

Think of this as the paint colours and ruler for the whole house.

- **Line 2–4:** `:root { --accent-hue: 348; }` sets a CSS *variable* — a number that
  other parts of the code can use. 348 is a deep red colour, like blood crimson.
  If you change this number, the red colour changes everywhere.
- **Lines 7–15:** Sets the whole page to have no margin, a dark background, light
  text, and `overflow: hidden` (no scrollbars — the page fills the screen exactly).
- **Lines 17–19:** Makes the `#root` box stretch to fill the full height and width.

---

## The Boss Component (`App.jsx`)

`App` is like the CEO of the website. It decides which *page* to show and handles the
big transition when you click "Enter the Cathedral".

### Lines 1–4: Importing Tools

```jsx
import React, { useState, useRef, useCallback } from "react";
```

This is like saying "hey, can I borrow these special tools from React?"
- `useState` — a basket that holds a piece of information. When you put something new
  in the basket, React redraws the screen.
- `useRef` — a secret notebook you can write in without telling anybody. Changing it
  doesn't cause a redraw.
- `useCallback` — a way to wrap a function so it doesn't get recreated every time.

Then we import our two big pages (LandingPage and AppPage) and the CSS file.

### Lines 6–9: The Two Memory Slots

```jsx
const [currentPage, setCurrentPage] = useState("landing");
```

This is like a light switch. Right now the switch points to `"landing"` (the front
door page). `setCurrentPage` is the handle that flicks the switch. Whenever you call
`setCurrentPage("app")`, React remembers and redraws the screen with the new page.

```jsx
const wormholeRef = useRef(0);
const [wormholeActive, setWormholeActive] = useState(false);
```

`wormholeRef` is a secret counter that starts at 0 and will count up to 1 during the
wormhole animation. It's a ref because it changes 60 times per second — we don't want
to redraw the whole page that often. `wormholeActive` is a simple on/off switch that
tells the page "hey, the wormhole animation has started!"

### Lines 11–26: The Wormhole Animation (the most important part!)

```jsx
const handleEnterCathedral = useCallback(() => {
```

This function runs when you click "Enter the Cathedral".

1. **Line 12:** `setWormholeActive(true)` — flicks the switch so the page knows an
   animation is happening.
2. **Line 13:** `const start = performance.now();` — records the exact time right now
   (in milliseconds since the page loaded).
3. **Line 14:** `const duration = 2000;` — the whole animation should last 2000
   milliseconds = 2 seconds.

Then comes the clever part — a **tick function** (line 16):

```jsx
const tick = (now) => {
  const t = Math.min((now - start) / duration, 1);
  wormholeRef.current = t;
```

`t` is the *progress* of the animation. When `now` equals `start` (the very beginning),
`t` = 0. When 1 second has passed, `t` = 0.5. When 2 seconds have passed, `t` = 1.
`Math.min(..., 1)` makes sure it never goes past 1.

This `t` is stored in `wormholeRef.current` so the psychedelic background shader can
read it 60 times per second and make the wormhole effect stronger and stronger.

Then (lines 19–23):
- If `t` is still less than 1, we call `requestAnimationFrame(tick)` — which means
  "wait until the next screen refresh, then run tick again". This creates a loop that
  runs about 60 times per second.
- If `t` has reached 1, we call `setCurrentPage("app")` — switching to the main app
  page. The CEO is saying "ok, the animation is done, change the page now."

### Lines 28–30: Going Back

```jsx
const handleBackToLanding = useCallback(() => {
  setCurrentPage("landing");
}, []);
```

This just flicks the switch back to `"landing"`.

### Lines 32–44: The Big Decision

```jsx
{currentPage === "landing" ? (
  <LandingPage ... />
) : (
  <AppPage ... />
)}
```

This is a *ternary* — like saying "if the switch is on landing, show LandingPage.
Otherwise, show AppPage." React checks this every time `currentPage` changes.

When the wormhole animation finishes (after 2 seconds), `setCurrentPage("app")` runs,
React notices the state change, and instantly swaps LandingPage for AppPage.

---

## The Front Door (`LandingPage.jsx`)

This is the first thing you see — a dark page with a red glow and big title. It's like
the entrance hall of a cathedral.

### Lines 5–9: Receiving Props and Creating Refs

```jsx
export default function LandingPage({ onEnter, wormholeActive, wormholeRef }) {
```

It receives three gifts from App:
- `onEnter` — a function to call when the button is clicked
- `wormholeActive` — whether the wormhole animation is happening
- `wormholeRef` — the secret notebook with the animation progress

Then it makes:
- `bgRef` — a reference to the background div, so we can change its CSS directly
- `mousePosRef` — a secret notebook that tracks where the mouse is

### Lines 12–24: Tracking the Mouse

This function runs every time the mouse moves. Think of it like a pencil that follows
the mouse and writes down its position.

```jsx
const handleMouseMove = useCallback((e) => {
  if (!bgRef.current) return;
  const rect = bgRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const rawY = (e.clientY - rect.top) / rect.height;
  const y = 1.0 - rawY;
  mousePosRef.current.x = x;
  mousePosRef.current.y = y;
  const pctX = x * 100;
  const pctY = rawY * 100;
  bgRef.current.style.setProperty('--mouse-x', `${pctX}%`);
  bgRef.current.style.setProperty('--mouse-y', `${pctY}%`);
}, []);
```

- `e.clientX` and `e.clientY` tell us where the mouse is in *pixels* (how many dots
  from the top-left corner of the screen).
- We subtract where the box starts (`rect.left`, `rect.top`) and divide by its size,
  so `x` and `rawY` become numbers between 0 and 1 — like a percentage but written
  as a decimal.
- **Line 17:** `y = 1.0 - rawY` — this is a fix! In the browser, Y grows downward
  (0 at the top, 1 at the bottom). But in the WebGL shader, Y grows *upward*
  (-1 at the bottom, 1 at the top). So we flip it.
- **Lines 20–23:** We convert to percentages (`0`–`100`) and set them as CSS variables
  on the div. This makes the red glow follow the mouse.

### Lines 26–31: The Listener

```jsx
useEffect(() => {
  ...
  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, [handleMouseMove]);
```

When the page first appears, this says "hey browser, every time the mouse moves, tell
my handler function." The `return` part is cleanup — when the page goes away, it says
"never mind, stop telling me." This prevents memory leaks (like leaving the tap running).

### Lines 34–82: The Page Layout

- **Line 34:** Adds a special class name `styles.wormhole` only when `wormholeActive`
  is true. This will make the content shrink and fade away.
- **Line 37:** `<PsychedelicBackground>` — the WebGL canvas that draws the pretty
  patterns. It gets the mouse position notebook and the wormhole notebook.
- **Lines 38–45:** Seven gradient divs piled on top of each other. They create the
  dark red/purple glow effect.
- **Line 69:** The button calls `onEnter` when clicked — this triggers the wormhole
  animation in App.jsx.

---

## The Psychedelic Lights (`PsychedelicBackground.jsx`)

This is the most complicated part — it uses WebGL (a special graphics engine) to draw
hypnotic moving patterns on a canvas. Think of it as a little robot that paints really
fast, 60 times per second.

### Lines 5–12: The Vertex Shader (the robot's skeleton)

```glsl
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

This is a tiny program written in a language called GLSL. It runs on your graphics
card (GPU) — the same thing that makes video games look good.

The robot draws a rectangle that covers the whole screen. For each corner of the
rectangle, it calculates a UV coordinate (a number from 0 to 1 telling the paintbrush
where it is on the screen). `a_position * 0.5 + 0.5` converts from -1..1 to 0..1.

### Lines 18–126: The Fragment Shader (the robot's paintbrush)

This is the REAL magic. For every single dot on your screen (all 2 million of them),
this program runs and decides what colour that dot should be.

#### Lines 19–27: The Settings (Uniforms)

```glsl
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_baseHue;
uniform float u_radius;
uniform float u_intensity;
uniform float u_transition;
```

These are like the paint colours and brush settings that the JavaScript code (the
artist) sends to the robot every frame. They are:
- `u_time` — how many seconds have passed (for animation)
- `u_mouse` — where the mouse is (0–1)
- `u_resolution` — the width and height of the screen
- `u_baseHue` — the base colour (red)
- `u_radius` — how wide the mouse effect extends
- `u_intensity` — how strong the effect is
- `u_transition` — the wormhole progress (0 to 1)

#### Lines 29–33: The Rotation Helper

```glsl
mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}
```

This is a math helper that creates a *rotation* matrix. If you give it an angle, it
returns a little machine that can spin coordinates around. Like spinning a pizza
dough.

#### Lines 36–38: Smooth Wormhole Easing

```glsl
float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}
```

This makes the wormhole animation feel smoother. Instead of going 0 → 0.5 → 1 in a
straight line (which would feel mechanical), it eases in slowly, speeds up in the
middle, and slows down at the end. Like a car accelerating and then braking gently.

#### Lines 41–66: The Field Function (the background pattern)

```glsl
vec3 field(vec2 uv) {
  float sym = 6.0;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  angle = mod(angle, 6.283185 / sym);
  uv = vec2(cos(angle), sin(angle)) * radius;
  uv += sin(uv * 3.0 + u_time * 0.5) * 0.02;
  uv += cos(uv * 5.0 + u_time * 0.4) * 0.02;
  ...
```

This is the *stable background* — a kaleidoscope pattern that never moves with the
mouse. It spins on its own, like a lazy ceiling fan.

1. It calculates the `angle` and `radius` of each dot from the center of the screen.
2. It folds the angle into 6 slices (`mod(angle, 6.283/6)`) — this creates 6-fold
   symmetry like a snowflake.
3. It adds tiny wiggles using sin and cos — these make the pattern breathe and flow.
4. It calculates a colour using HSV (hue, saturation, lightness) and converts it to
   RGB for the screen.

#### Lines 68–124: The Main Function (painting each dot)

**Step 1 (lines 69–72):** Convert the UV coordinate (0–1) to clip space (-1 to 1).
This makes it so the center of the screen is (0,0) and the edges are -1 or 1. The
`* resolution.x / resolution.y` part accounts for wide vs. tall screens.

**Step 2 (lines 71–72):** Convert the mouse position (0–1) to the same space.

**Step 3 (line 74):** Start with the stable background colour.

**Step 4 (line 76–78):** Calculate `rel = uv - mouse` — this is the arrow pointing
from the mouse to the current dot. `dist = length(rel)` is how far away the dot is
from the mouse. `falloff` is a number that's 1 at the mouse position and 0 beyond
the radius.

**Step 5 (line 80):** Apply the smooth easing to the transition.

**Step 6 (lines 83–84):** If a wormhole is happening, make the effect cover the
entire screen and get stronger.

**Step 7 (lines 86–121):** If the dot is close enough to the mouse (or if the
wormhole is covering everything):

- **Lines 88–90 (Suction):** Pull the coordinate toward the mouse. During a
  wormhole, things get sucked inward.
- **Lines 93–94 (Vortex):** Spin the coordinate around the mouse. During a
  wormhole, this spins much faster.
- **Line 97 (Ripples):** Add waves that radiate outward from the mouse.
- **Lines 100–105 (Kaleidoscope):** Fold the coordinate into 10 or 18 slices,
  creating a kaleidoscope centered on the mouse.
- **Line 107:** Ask the field function "what colour would this warped position be?"
  This is like looking at the pattern through a bent lens.
- **Lines 109–111:** Blend the original colour with the warped colour. The closer
  to the mouse, the more warped it looks.
- **Lines 114–118:** Add a red ring glow at the edge of the portal and a bright
  center glow.
- **Line 121:** Make everything brighter as the wormhole opens.

**Line 124:** Finally, output the colour with 0.18 alpha (mostly transparent so the
CSS gradients show through).

### Lines 128–227: The React Part (controlling the robot)

#### Lines 128–129: Component Setup

```jsx
export default function PsychedelicBackground({ mousePosRef, wormholeRef }) {
  const canvasRef = useRef(null);
```

Accepts the mouse position notebook and the wormhole notebook, and creates a ref for
the `<canvas>` HTML element.

#### Lines 131–225: The Big useEffect (setting up the robot)

```jsx
useEffect(() => {
```

This runs once when the component first appears.

**Lines 132–135:** Gets the canvas element and asks for a "WebGL context" —
basically, permission to draw on the canvas with the GPU. If either is missing, it
stops early.

**Line 136:** Checks if the user prefers reduced motion (accessibility setting). If
so, time stands still later.

**Lines 137–147 (The Factory):** `compile` is a helper that creates a single shader
(either vertex or fragment), checks if it compiled correctly, and returns it. If
something is wrong with the shader code, it logs an error and returns nothing.

**Lines 148–157:** Creates both shaders and links them into a *program* — like taking
the skeleton and paintbrush and taping them together into one working robot.

**Lines 159–166:** Asks the program for the locations of all the uniform settings
by name. `getUniformLocation` is like saying "hey robot, where do I plug in the
time?" This lets us send values to the GPU later.

**Lines 168–178:** Creates a rectangle (two triangles) that covers the whole screen.
This is what the shader paints onto.

**Lines 180–186:** A resize function that makes the canvas fill the whole window
whenever the window changes size.

**Lines 188–219 (The Render Loop — the most important animation part!):**

```jsx
let start = null;
const render = (time) => {
  if (!start) start = time;
  let elapsed = prefersReduced ? 0 : (time - start) / 1000;
```

- `start` remembers the first time `render` ran.
- `elapsed` is how many seconds have passed since then — but if the user prefers
  reduced motion, it's always 0 (frozen).

Then it:
1. Clears the canvas to black
2. Tells the GPU to use our program
3. Sends all the uniform values (time, mouse, resolution, hue, radius, intensity,
   transition) to the GPU
4. Draws the two triangles that cover the whole screen — this runs the fragment
   shader for every single pixel
5. **Line 218:** `requestAnimationFrame(render)` — says "wait for the next screen
   refresh, then run render again." This creates the 60-frames-per-second loop.

The mouse position is read from `mousePosRef.current` (line 201) — the secret
notebook that LandingPage updates whenever the mouse moves. And the wormhole
progress is read from `wormholeRef.current` (line 215) — the notebook that App
updates during the wormhole animation.

**Lines 222–224:** Cleanup — when the component goes away, stop listening for
resize events.

### Line 227: The Canvas Element

```jsx
return <canvas ref={canvasRef} className={styles.canvas} />;
```

Renders a single `<canvas>` element — that's where all the WebGL drawing happens.

---

## The Main App (`AppPage.jsx`)

This is the page you see after the wormhole — the actual confessional app.

### Lines 7–8: State and Refs

```jsx
const [confessions, setConfessions] = useState([]);
const bgRef = useRef(null);
```

- `confessions` — an empty list that will hold all submitted confessions
- `bgRef` — a ref for the background div (for the mouse glow)

### Lines 10–17: Mouse Tracking (simpler version)

Same as LandingPage but simpler — just tracks mouse for the CSS glow, no shader.

### Lines 26–29: Adding a Confession (important state update!)

```jsx
const addConfession = (text) => {
  const timestamp = new Date().toISOString();
  setConfessions((prev) => [{ text, timestamp }, ...prev]);
};
```

This is called when someone submits a confession. Two important things:
1. `new Date().toISOString()` — stamps the current time so we can show when it
   was posted.
2. `setConfessions((prev) => [{ text, timestamp }, ...prev])` — this uses the
   *functional updater* pattern. Instead of saying "set confessions to this new
   list", it says "take whatever the previous list was, and make a new list with
   the new confession at the front." This is way safer because it guarantees we
   always have the latest list, even if something else changed it at the same time.

The `...prev` is called the *spread operator*. It copies all the old items into the
new array. We never change the original array (that would be *mutation* and it's bad)
— we always make a brand new one.

### Lines 69–75: Empty State

```jsx
{confessions.length === 0 ? (
  <div className={styles.emptyState}>
    <p>The cathedral awaits your first confession.</p>
  </div>
) : (
  <ConfessionFeed items={confessions} />
)}
```

If there are no confessions yet, show a message. Otherwise, show the list. This is
the site making a decision based on data — just like a person would say "if the box
is empty, tell me it's empty; otherwise show me what's inside."

---

## The Confession Form (`ConfessionForm.jsx`) — Controlled Input!

This is a great example of a **controlled component** — React is in charge of the
textarea, not the browser.

### Lines 5–6: State

```jsx
const max = 280;
const [value, setValue] = useState("");
```

- `max = 280` — like Twitter, confessions have a 280 character limit.
- `value = ""` — starts as an empty string. This is the source of truth for what's
  in the textarea.

### Lines 8–9: Derived State

```jsx
const trimmed = value.trim();
const isValid = trimmed.length > 0 && trimmed.length <= max;
```

These are *calculated* from `value` — we don't store them as separate state. If
`value` changes, these automatically change too. This is called *derived state*.

- `trimmed` is the text with spaces removed from both ends.
- `isValid` is true only if there's at least one character AND it's 280 or fewer.

### Lines 11–17: Handlers

```jsx
const handleChange = (e) => setValue(e.target.value);
const handleSubmit = (e) => {
  e.preventDefault();
  if (!isValid) return;
  onSubmit(trimmed);
  setValue("");
};
```

**handleChange** (line 11): Every time you type a letter, this runs.
`e.target.value` is whatever is now in the textarea (including the new letter). It
calls `setValue` with that — updating React's state.

**handleSubmit** (lines 12–17): When you press the form's submit button:
1. `e.preventDefault()` stops the browser from reloading the page (which forms
   normally do).
2. If the input isn't valid, it stops early.
3. Calls `onSubmit(trimmed)` — sending the cleaned text up to AppPage.
4. Resets the textarea to empty (`setValue("")`).

### Lines 19–43: The JSX (what you see)

```jsx
<textarea
  value={value}
  onChange={handleChange}
  maxLength={max + 50}
/>
```

**`value={value}`** — Line 26: This is what makes it a *controlled component*.
Instead of the browser owning the text and React asking "what's in the box?", React
*commands* the box "here is what you should show." When you type, `handleChange`
updates React's state, and React tells the textarea "show this new text." The text
always matches React's state — they can never get out of sync.

**`maxLength={max + 50}`** — Line 28: 330. We set it slightly higher than 280 so
the user can type past the limit and see the counter turn red before deleting.

Lines 31–35 show a counter: `{value.length} / {max}`. The CSS class changes to
`styles.error` (turns red) when the length goes over 280.

Line 36: The submit button is disabled when `!isValid` — you can't click it unless
there's text and it's not too long.

---

## The Confession Feed (`ConfessionFeed.jsx`)

This is the simplest component — it just shows a list.

### Lines 5–11: Empty State

If the list is empty (nobody has confessed yet), show a helpful message instead of
nothing.

### Lines 15–22: The List

```jsx
{items.map((item, i) => (
  <div key={i} className={styles.confessionItem}>
    <p className={styles.confessionText}>{item.text}</p>
    <p className={styles.timestamp}>
      {new Date(item.timestamp).toLocaleString()}
    </p>
  </div>
))}
```

- `items.map(...)` — loops through every confession and creates a div for each.
  Like "for each confession in the list, make a card."
- `key={i}` — helps React keep track of which items changed.
- `new Date(item.timestamp).toLocaleString()` — converts the stored time (like
  "2026-06-08T12:30:00.000Z") into something human-readable (like "6/8/2026,
  12:30:00 PM").

---

## The Custom Cursor (`CustomCursor.jsx`)

This replaces the normal arrow pointer with a cool SVG crosshair.

### Lines 4–10: Tracking the Mouse

```jsx
const [pos, setPos] = useState({ x: -100, y: -100 });
```

Starts hidden off-screen. When the mouse moves, the position updates and the SVG
follows. It uses `useEffect` with a `mousemove` listener and cleans it up.

### Lines 12–54: The SVG

Draws a decorative crosshair symbol with a red glow filter. The `pointerEvents: none`
(line 21) makes sure this div doesn't block clicks on the buttons underneath.

---

## The Background Blobs (`BackgroundBlobs.jsx`)

This is just two blobs of colour that sit behind everything. They're decorative only.
Each is a radial gradient (circle that fades from coloured to transparent).

---

## Summary: How It All Fits Together

Here's the flow of the whole website:

1. The HTML page loads, `main.jsx` starts React, and `App.jsx` becomes the boss.
2. `App` shows `LandingPage` — the dark entrance with swirling WebGL patterns.
3. As you move your mouse, `LandingPage` writes the position to `mousePosRef`.
4. `PsychedelicBackground` reads `mousePosRef` 60 times per second and warps the
   pattern around your cursor — like a portal opening where you point.
5. When you click "Enter the Cathedral", `App` starts the wormhole animation:
   - A counter goes from 0 to 1 over 2 seconds.
   - The shader reads this counter and gradually expands the portal to cover
     the whole screen, sucking everything inward.
   - The content CSS shrinks and fades away.
6. After 2 seconds, `App` switches to `AppPage` — the confession app.
7. You type a confession into the *controlled* textarea (React owns the value).
8. You submit — the new confession is added to the top of the list (immutably,
   by making a new array).
9. The feed updates and shows your confession. The empty state message disappears.
