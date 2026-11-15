import * as THREE from 'three';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Small seeded random generator so every visit builds the same object.
export function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function radialTexture(rgb, alpha) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, `rgba(${rgb},${alpha})`);
  r.addColorStop(.4, `rgba(${rgb},${alpha * .35})`);
  r.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// One WebGL canvas, sized by its own CSS box (usually its whole parent). It tracks the pointer over the parent
// and only draws while on screen.
export function makeStage(canvas) {
  const host = canvas.parentElement;
  const small = matchMedia('(max-width:900px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  const s = { renderer, scene, camera, host, small, W: 1, H: 1, aspect: 1, mx: 0, my: 0, inside: false, vis: false, t: 0, force: null, update: null, onfit: null, onclick: null };

  s.fit = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    s.W = r.width; s.H = r.height; s.aspect = r.width / r.height;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = s.aspect; camera.updateProjectionMatrix();
    if (s.onfit) s.onfit();
  };
  host.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    s.mx = (e.clientX - r.left) / r.width * 2 - 1;
    s.my = -((e.clientY - r.top) / r.height * 2 - 1);
    s.inside = e.pointerType !== 'touch';
  });
  host.addEventListener('pointerleave', () => { s.inside = false; });
  host.addEventListener('click', e => { if (!e.target.closest('a,button') && s.onclick) s.onclick(); });
  new IntersectionObserver(es => { s.vis = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  new ResizeObserver(s.fit).observe(canvas);

  s.frame = dt => { if (!s.vis || !s.update) return; s.t += dt; s.update(dt); renderer.render(scene, camera); };
  // Advances the scene without waiting for real time. Used when checking a state in a test browser.
  s.step = (n = 1) => { for (let i = 0; i < n; i++) { s.t += .05; s.update(.05); } renderer.render(scene, camera); };
  return s;
}
