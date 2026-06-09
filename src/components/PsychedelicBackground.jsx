import React, { useEffect, useRef } from 'react';
import styles from './PsychedelicBackground.module.css';

// Vertex shader (passes through position)
const vertexShaderSrc = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment shader — stable kaleidoscopic field with a localized
// cursor-driven lens/portal/vortex that distorts a local region.
// On transition (u_transition > 0) the vortex expands to a full-screen
// wormhole, sucking everything toward the cursor.
const fragmentShaderSrc = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_baseHue;
uniform float u_radius;
uniform float u_intensity;
uniform float u_transition; // 0 = idle, 1 = fully transitioned

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// Easing for smooth wormhole feel
float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

// Stable procedural field — anchored to UV space, cursor-independent.
vec3 field(vec2 uv) {
  float sym = 6.0;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  angle = mod(angle, 6.283185 / sym);
  uv = vec2(cos(angle), sin(angle)) * radius;
  uv += sin(uv * 3.0 + u_time * 0.5) * 0.02;
  uv += cos(uv * 5.0 + u_time * 0.4) * 0.02;

  float hue = u_baseHue + (angle / 6.283185) * 30.0;
  float sat = 0.8;
  float lig = 0.5 + 0.5 * sin(radius * 12.0 - u_time * 0.5);

  float C = lig * sat;
  float H = hue / 60.0;
  float X = C * (1.0 - abs(mod(H, 2.0) - 1.0));
  vec3 rgb;
  if (H < 1.0) rgb = vec3(C, X, 0.0);
  else if (H < 2.0) rgb = vec3(X, C, 0.0);
  else if (H < 3.0) rgb = vec3(0.0, C, X);
  else if (H < 4.0) rgb = vec3(0.0, X, C);
  else if (H < 5.0) rgb = vec3(X, 0.0, C);
  else rgb = vec3(C, 0.0, X);
  rgb += lig - C;
  return rgb;
}

void main() {
  vec2 uv = (v_uv * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);

  vec2 mouse = (u_mouse - vec2(0.5)) * 2.0;
  mouse.x *= u_resolution.x / u_resolution.y;

  vec3 color = field(uv);

  vec2 rel = uv - mouse;
  float dist = length(rel);
  float falloff = smoothstep(u_radius, 0.0, dist);

  float t = easeInOutCubic(clamp(u_transition, 0.0, 1.0));

  // During wormhole, expand influence and ramp intensity
  float effFalloff = mix(falloff, 1.0, t);
  float effIntensity = mix(u_intensity, 4.0, t);

  if (effFalloff > 0.001) {
    // Radial suction — compress coordinates toward cursor
    vec2 pulled = rel;
    float suction = t * 0.7 / (dist + 0.04);
    pulled *= (1.0 - suction);

    // Vortex — faster during transition
    float vortex = u_time * mix(2.5, 12.0, t) * effFalloff * effIntensity;
    vec2 warped = pulled * rot(vortex);

    // Radial ripples
    float wave = sin(dist * 24.0 - u_time * 3.5) * 0.06 * effIntensity;
    warped += normalize(pulled + 0.001) * wave * effFalloff;

    // Kaleidoscopic folding
    float sym = mix(10.0, 18.0, t);
    float a = atan(warped.y, warped.x);
    a = mod(a, 6.283185 / sym);
    a = abs(a - 3.141593 / sym);
    warped = vec2(cos(a), sin(a)) * length(warped);

    vec3 portalColor = field(mouse + warped);

    float hueShift = sin(dist * 12.0 + a * 4.0 - u_time * 2.0) * 0.5 + 0.5;
    float blend = effFalloff * effIntensity * (0.7 + 0.3 * hueShift);
    color = mix(color, portalColor, blend);

    // Brighter glow during wormhole
    float rim = exp(-abs(dist - 0.12) * 18.0) * 0.35 * effIntensity;
    color += vec3(0.6, 0.08, 0.18) * rim;

    float center = exp(-dist * 6.0) * effIntensity;
    color += vec3(0.85, 0.15, 0.25) * center * 0.5;

    // Brightness flash as wormhole opens
    color *= (1.0 + t * t * 0.6);
  }

  gl_FragColor = vec4(color, 0.18);
}
`;

export default function PsychedelicBackground({ mousePosRef, wormholeRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let baseHue = 350.0;
    const hueVar = getComputedStyle(document.documentElement).getPropertyValue('--accent-hue');
    if (hueVar) {
      const parsed = parseFloat(hueVar.trim());
      if (!isNaN(parsed)) baseHue = parsed;
    }

    const compile = (src, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = compile(vertexShaderSrc, gl.VERTEX_SHADER);
    const frag = compile(fragmentShaderSrc, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const aPos = gl.getAttribLocation(program, 'a_position');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uHue = gl.getUniformLocation(program, 'u_baseHue');
    const uRadius = gl.getUniformLocation(program, 'u_radius');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');
    const uTransition = gl.getUniformLocation(program, 'u_transition');

    const quad = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1,  1, 1, -1,  1, 1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let start = null;
    let animId;

    const render = (time) => {
      if (!start) start = time;
      const elapsed = prefersReduced ? 0 : (time - start) / 1000;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.enableVertexAttribArray(aPos);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(uTime, elapsed);
      const mouse = mousePosRef?.current || { x: 0.5, y: 0.5 };
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uHue, baseHue);
      gl.uniform1f(uRadius, 0.55);
      gl.uniform1f(uIntensity, 1.0);
      gl.uniform1f(uTransition, wormholeRef?.current ?? 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
