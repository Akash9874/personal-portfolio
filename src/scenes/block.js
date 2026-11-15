import * as THREE from 'three';
import { makeStage, calm, clamp, smooth, rng, radialTexture } from './stage.js';

// The toolkit: a 3 x 3 x 3 block of clay tiles, each one a tool, around a glowing core.
// It loosens as the pointer comes near and breaks apart on click.
const SKILLS = ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Python', 'FastAPI', 'Docker', 'Tailwind CSS', 'Express', 'RAG', 'Qdrant', 'Ollama', 'scikit-learn', 'AWS', 'GitHub Actions', 'Vitest', 'Playwright', 'Netlify', 'Yjs', 'WebSockets', 'JavaScript', 'REST APIs', 'Git'];
const GLYPHS = ['{ }', '</>', '=>', '[ ]', '//', '&&', '( )', '::', '++', '#!', 'fn', '0 1'];
const CLAYS = [['#B8643C', '#1E120B'], ['#A9573A', '#1E120B'], ['#C4744A', '#1E120B'], ['#B8643C', '#1E120B'], ['#C48A3A', '#1E120B'], ['#3A2619', '#F1E7D8']];
const FONT = px => `600 ${px}px Switzer, system-ui, sans-serif`;

// Every tile face is drawn into one sheet of 8 x 7 tiles, so the block uploads a single texture, not 54.
// Tiles are drawn at 256 units and stored at 192 pixels, which is still sharper than they ever appear.
const CELL = 192, GRID = 8, ROWS = 7, SW = CELL * GRID, SH = CELL * ROWS, INSET = 3;

// Builds the block in small steps, one per quiet moment, and returns once it is built.
// `s.live` resolves when its shaders have compiled and it is on screen.
export async function createBlock(canvas, { reduce = false } = {}) {
  const s = makeStage(canvas), { scene, camera, renderer } = s, R = rng(9);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  camera.fov = 32; camera.position.set(0, 1.7, 8.8); camera.lookAt(0, 0, 0);
  const g = new THREE.Group(); g.rotation.set(.22, .6, 0); scene.add(g);

  await calm();
  const sheet = document.createElement('canvas'); sheet.width = SW; sheet.height = SH;
  const x = sheet.getContext('2d');
  // One shared layer of clay grain, laid over every tile.
  const grain = document.createElement('canvas'); grain.width = grain.height = 256;
  { const n = grain.getContext('2d'), G = rng(77); for (let i = 0; i < 900; i++) { n.fillStyle = `rgba(0,0,0,${G() * .08})`; n.fillRect(G() * 256, G() * 256, 2, 2); } }
  let used = 0;
  const cell = draw => {
    const c = used++;
    x.save(); x.translate((c % GRID) * CELL, Math.floor(c / GRID) * CELL); x.scale(CELL / 256, CELL / 256); draw(); x.restore();
    return c;
  };
  const INNER = cell(() => { x.fillStyle = '#1A110C'; x.fillRect(0, 0, 256, 256); });

  function face(text, glyph) {
    const p = CLAYS[Math.floor(R() * CLAYS.length)];
    // Each tile used to draw its own grain with 2,700 random numbers. Skipping the same amount keeps every
    // colour and every tile's flight path exactly as it was.
    for (let n = 0; n < 2700; n++) R();
    return cell(() => {
      x.fillStyle = p[0]; x.fillRect(0, 0, 256, 256);
      x.drawImage(grain, 0, 0);
      x.strokeStyle = p[1]; x.globalAlpha = .28; x.lineWidth = 3; x.strokeRect(14, 14, 228, 228);
      x.globalAlpha = glyph ? .45 : 1; x.fillStyle = p[1]; x.textAlign = 'center'; x.textBaseline = 'middle';
      const parts = (!glyph && text.includes(' ')) ? text.split(' ') : [text];
      let fs = glyph ? 92 : 46; x.font = FONT(fs);
      const w = Math.max(...parts.map(t => x.measureText(t).width));
      if (w > 204) { fs = fs * 204 / w; x.font = FONT(fs); }
      parts.forEach((t, i) => x.fillText(t, 128, 130 + (i - (parts.length - 1) / 2) * fs * 1.1));
    });
  }

  // A cube whose six faces show the given cells of the sheet.
  const cube = cells => {
    const geo = new THREE.BoxGeometry(.64, .64, .64), uv = geo.attributes.uv;
    cells.forEach((c, f) => {
      const u0 = ((c % GRID) * CELL + INSET) / SW, u1 = ((c % GRID + 1) * CELL - INSET) / SW;
      const v1 = 1 - (Math.floor(c / GRID) * CELL + INSET) / SH, v0 = 1 - ((Math.floor(c / GRID) + 1) * CELL - INSET) / SH;
      for (let k = f * 4; k < f * 4 + 4; k++) uv.setXY(k, u0 + uv.getX(k) * (u1 - u0), v0 + uv.getY(k) * (v1 - v0));
    });
    return geo;
  };

  const tiles = new THREE.CanvasTexture(sheet); tiles.colorSpace = THREE.SRGBColorSpace; tiles.anisotropy = 4;
  const clay = new THREE.MeshStandardMaterial({ map: tiles, roughness: .82, metalness: 0 });
  const cubes = []; let li = 0, gi = 0, side = 0;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
    if (!i && !j && !k) continue;
    const out = [i === 1, i === -1, j === 1, j === -1, k === 1, k === -1], cells = [];
    for (let f = 0; f < 6; f++) {
      if (!out[f]) { cells.push(INNER); continue; }
      if (f === 2 || f === 3) cells.push(face(GLYPHS[gi++ % GLYPHS.length], true));
      else { cells.push((side % 3 !== 2 && li < SKILLS.length) ? face(SKILLS[li++], false) : face(GLYPHS[gi++ % GLYPHS.length], true)); side++; }
    }
    const m = new THREE.Mesh(cube(cells), clay), p0 = new THREE.Vector3(i, j, k).multiplyScalar(.68);
    m.userData = {
      p0,
      dir: p0.clone().normalize().add(new THREE.Vector3(R() - .5, R() - .5, R() - .5).multiplyScalar(.5)).normalize(),
      axis: new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(),
      r: R()
    };
    g.add(m); cubes.push(m);
  }

  await calm();
  scene.add(new THREE.HemisphereLight('#8A6248', '#140C08', 1));
  const key = new THREE.DirectionalLight('#FFE6C8', 2.8); key.position.set(-3.5, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#FF7A33', 1.4); rim.position.set(4, 1.5, -4); scene.add(rim);
  const fire = new THREE.PointLight('#FF8A33', 0, 7, 2); g.add(fire);
  const core = new THREE.Mesh(new THREE.SphereGeometry(.26, 24, 24), new THREE.MeshBasicMaterial({ color: '#FFD08A', toneMapped: false })); g.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('255,150,60', 1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.set(3.4, 3.4, 1); g.add(glow);

  const EMBERS = s.small ? 90 : 220, ep = new Float32Array(EMBERS * 3), ev = [];
  for (let i = 0; i < EMBERS; i++) { ep[i * 3] = (R() - .5) * 11; ep[i * 3 + 1] = (R() - .5) * 6.6; ep[i * 3 + 2] = (R() - .5) * 4 - 1.5; ev.push(.1 + R() * .35, R() * 6.28); }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  scene.add(new THREE.Points(eg, new THREE.PointsMaterial({ color: '#FF9A4A', size: .03, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })));

  s.onfit = () => {
    const wide = s.aspect > 1.05;
    g.position.set(wide ? -2.05 * clamp(s.aspect / 1.6, .7, 1.12) : 0, wide ? .1 : .1, 0);
    g.scale.setScalar(wide ? 1 : .8);
  };

  let b = 0, burst = 9; const v = new THREE.Vector3();
  s.burst = () => { if (!reduce) burst = 0; };
  s.onclick = s.burst;
  s.update = dt => {
    burst += dt;
    const bump = burst < .35 ? smooth(0, .35, burst) : burst < 1.6 ? 1 : 1 - smooth(1.6, 3.6, burst);
    let prox = 0;
    if (s.inside) { v.set(0, 0, 0); g.localToWorld(v); v.project(camera); prox = 1 - clamp(Math.hypot((s.mx - v.x) * s.aspect, s.my - v.y) / .8, 0, 1); }
    let want = prox * prox * .14 + bump * .5;
    if (s.force != null) want = s.force;
    b += (want - b) * Math.min(1, dt * (want > b ? 8 : 3));
    const gap = .015 + prox * .07;
    cubes.forEach(m => {
      const u = m.userData;
      m.position.copy(u.p0).multiplyScalar(1 + gap).addScaledVector(u.dir, b * (1 + u.r));
      m.quaternion.setFromAxisAngle(u.axis, b * (1.2 + u.r * 2.2));
    });
    fire.intensity = b * 120 + prox * 10;
    glow.material.opacity = clamp(b * 1.6 + prox * .2, 0, 1);
    core.scale.setScalar(.6 + b * .9);
    if (!reduce) g.rotation.y += dt * .2;
    g.rotation.x += ((.22 + (s.inside ? -s.my * .1 : 0)) - g.rotation.x) * Math.min(1, dt * 3);
    for (let i = 0; i < EMBERS; i++) {
      ep[i * 3 + 1] += ev[i * 2] * dt; ep[i * 3] += Math.sin(s.t * .8 + ev[i * 2 + 1]) * dt * .08;
      if (ep[i * 3 + 1] > 3.4) ep[i * 3 + 1] = -3.4;
    }
    eg.attributes.position.needsUpdate = true;
  };
  s.fit();
  s.live = s.goLive([tiles, glow.material.map]);
  return s;
}
