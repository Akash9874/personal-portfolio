import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeStage, clamp, smooth, rng, radialTexture } from './stage.js';

// The opening: a processor modelled on how a real one is packaged, pulled apart into six layers.
// Top to bottom: heat-spreader lid, solder-bump layer, green package substrate, memory die, logic die, land-grid base.
// Each layer stands for one layer of the stack, and labelEls follow them as the visitor scrolls.
const SPAN = 2.3;   // width of the widest layer; the labels line up against it
const C = 1024;     // textures are drawn in a 1024-unit space, whatever their real size

export function createProcessor(canvas, labelEls, { reduce = false } = {}) {
  const s = makeStage(canvas), { scene, camera, renderer } = s, R = rng(21);
  const TEX = s.small ? 512 : 1024;

  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  // Soft shadows are the most expensive part of this scene, so phones go without them.
  renderer.shadowMap.enabled = !s.small; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // A neutral studio environment gives the metal and silicon something real to reflect.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .6;
  pmrem.dispose();

  camera.fov = 30; camera.position.set(0, 4.4, 10.2); camera.lookAt(0, -.15, 0);
  const group = new THREE.Group(); group.rotation.set(0, -.62, 0); scene.add(group);

  const key = new THREE.DirectionalLight('#FFF4E2', 2.4);
  key.castShadow = !s.small; key.shadow.mapSize.set(s.small ? 1024 : 2048, s.small ? 1024 : 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -2.6; key.shadow.camera.right = key.shadow.camera.top = 2.6;
  key.shadow.camera.near = .5; key.shadow.camera.far = 22; key.shadow.bias = -.0006; key.shadow.radius = 5;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#E8B04A', 1.3); rim.position.set(6, 2, -5); scene.add(rim);

  /* ---------- texture helpers ---------- */
  const orm = (rough, metal) => `rgb(255,${Math.round(rough * 255)},${Math.round(metal * 255)})`;
  // Draws a colour map and a matching roughness/metalness map in one pass.
  function surface(draw) {
    const make = () => { const c = document.createElement('canvas'); c.width = c.height = TEX; const g = c.getContext('2d'); g.scale(TEX / C, TEX / C); return [c, g]; };
    const [c1, g] = make(), [c2, o] = make();
    draw(g, o);
    const map = new THREE.CanvasTexture(c1); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    const maps = new THREE.CanvasTexture(c2); maps.anisotropy = 8;
    return { map, maps };
  }
  // Paints the same shape on both maps: `color` on the colour map, roughness and metalness on the other.
  const both = (g, o, color, rough, metal, shape) => {
    g.fillStyle = g.strokeStyle = color; o.fillStyle = o.strokeStyle = orm(rough, metal);
    shape(g); shape(o);
  };
  const GOLD = '#D9B45A';
  const speckle = (g, n, a) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${a})`; g.fillRect(R() * C, R() * C, 2, 2); } };
  const cornerMark = k => { k.beginPath(); k.moveTo(44, C - 44); k.lineTo(128, C - 44); k.lineTo(44, C - 128); k.closePath(); k.fill(); };

  /* ---------- 1. lid: brushed nickel heat spreader with laser-etched markings ---------- */
  const lid = surface((g, o) => {
    g.fillStyle = '#C6C9CE'; g.fillRect(0, 0, C, C); o.fillStyle = orm(.3, 1); o.fillRect(0, 0, C, C);
    for (let i = 0; i < 2600; i++) {
      const y = R() * C, x = R() * C, w = 120 + R() * 520, a = .03 + R() * .06;
      g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${a})`; g.fillRect(x - w / 2, y, w, 1);
      o.globalAlpha = .35; o.fillStyle = orm(.2 + R() * .24, 1); o.fillRect(x - w / 2, y, w, 1); o.globalAlpha = 1;
    }
    const etch = shape => both(g, o, 'rgba(50,53,58,.84)', .64, .85, shape);
    etch(k => {
      k.textAlign = 'left'; k.textBaseline = 'alphabetic';
      k.font = '700 80px Arial, Helvetica, sans-serif'; k.fillText('AKASHDEEP', 116, 330); k.fillText('DASH', 116, 420);
      k.font = '500 40px Arial, Helvetica, sans-serif'; k.fillText('FULL-STACK + AI ENGINEER', 116, 504);
      k.font = '500 34px "Courier New", monospace';
      k.fillText('AD26  BLR  IN', 116, 590); k.fillText('628T  159U  27E  442R', 116, 640); k.fillText('L2026B110', 116, 690);
    });
    etch(k => { k.lineWidth = 7; k.beginPath(); k.arc(826, 300, 60, 0, 7); k.stroke(); k.font = '700 56px Arial, Helvetica, sans-serif'; k.textAlign = 'center'; k.fillText('AD', 826, 320); k.textAlign = 'left'; });
    etch(k => { for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (i === 0 || j === 11 || R() < .5) k.fillRect(748 + i * 13, 566 + j * 13, 12, 12); });
    etch(cornerMark);
  });

  /* ---------- 3. substrate: green package board with traces, vias and a bump field ---------- */
  const board = surface((g, o) => {
    g.fillStyle = '#0B4631'; g.fillRect(0, 0, C, C); o.fillStyle = orm(.46, 0); o.fillRect(0, 0, C, C);
    speckle(g, 5000, .03);
    for (let n = 0; n < 170; n++) {
      const a = R() * 6.283, r0 = 236 + R() * 40, x0 = 512 + Math.cos(a) * r0, y0 = 512 + Math.sin(a) * r0;
      const dx = Math.cos(a) < 0 ? -1 : 1, dy = Math.sin(a) < 0 ? -1 : 1, d1 = 40 + R() * 130, x1 = x0 + dx * d1, y1 = y0 + dy * d1;
      const flat = R() < .5, x2 = flat ? (dx > 0 ? 954 - R() * 70 : 70 + R() * 70) : x1, y2 = flat ? y1 : (dy > 0 ? 954 - R() * 70 : 70 + R() * 70);
      g.strokeStyle = '#15724D'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      both(g, o, GOLD, .3, 1, k => { k.beginPath(); k.arc(x2, y2, 5, 0, 7); k.fill(); });
    }
    both(g, o, GOLD, .3, 1, k => { for (let i = 0; i < 22; i++) for (let j = 0; j < 22; j++) k.fillRect(303 + i * 19, 303 + j * 19, 9, 9); });
    both(g, o, GOLD, .3, 1, k => { k.lineWidth = 4; k.strokeRect(282, 282, 460, 460); });
    both(g, o, GOLD, .3, 1, cornerMark);
    g.fillStyle = 'rgba(232,238,233,.85)'; g.font = '500 22px Arial, Helvetica, sans-serif';
    g.fillText('AD-FS  REV 4', 150, 82); g.fillText('C12  C13  C14  C15', 700, 964);
  });

  /* ---------- 4. memory die: banks of cells either side of a pad spine ---------- */
  const memory = surface((g, o) => {
    g.fillStyle = '#23263A'; g.fillRect(0, 0, C, C); o.fillStyle = orm(.3, .55); o.fillRect(0, 0, C, C);
    const hues = ['#2F8F8C', '#7C3F8F', '#3D62A8', '#9A7B35'];
    for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 2; by++) {
      const x = 56 + bx * 234, y = 70 + by * 470, w = 210, h = 414;
      const grad = g.createLinearGradient(x, y, x + w, y + h); grad.addColorStop(0, hues[(bx + by) % 4]); grad.addColorStop(1, hues[(bx + by + 1) % 4]);
      g.fillStyle = grad; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(0,0,0,.3)'; for (let l = 0; l < h; l += 5) g.fillRect(x, y + l, w, 1.6); for (let l = 0; l < w; l += 26) g.fillRect(x + l, y, 2, h);
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x, y + h / 2 - 5, w, 10);
    }
    both(g, o, GOLD, .3, 1, k => { for (let i = 0; i < 40; i++) k.fillRect(30 + i * 24.4, 505, 13, 14); });
  });

  /* ---------- 5. logic die: cores, caches and an input-output ring ---------- */
  const logic = surface((g, o) => {
    g.fillStyle = '#1E2030'; g.fillRect(0, 0, C, C); o.fillStyle = orm(.3, .55); o.fillRect(0, 0, C, C);
    const block = (x, y, w, h, c1, c2, step) => {
      const grad = g.createLinearGradient(x, y, x + w, y + h); grad.addColorStop(0, c1); grad.addColorStop(1, c2);
      g.fillStyle = grad; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(0,0,0,.3)'; for (let l = 0; l < h; l += step) g.fillRect(x, y + l, w, 1.6);
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3; g.strokeRect(x, y, w, h);
    };
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x = 222 + i * 146, y = 150 + j * 366;
      block(x, y, 136, 356, i % 2 ? '#3F6FB0' : '#7A4A9E', i % 2 ? '#2E8F8C' : '#B0703F', 7);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + 12, y + 20, 112, 60); g.fillRect(x + 12, y + 270, 50, 66);
    }
    block(60, 150, 150, 722, '#2B7F86', '#3D5FA6', 4); block(814, 150, 150, 722, '#9A7B35', '#8F3F7A', 4);
    block(60, 60, 904, 76, '#454A6A', '#33384F', 9); block(60, 886, 904, 76, '#454A6A', '#33384F', 9);
    both(g, o, GOLD, .3, 1, k => { for (let i = 0; i < 46; i++) { k.fillRect(26 + i * 21.2, 22, 12, 14); k.fillRect(26 + i * 21.2, 988, 12, 14); } });
  });
  // The one part that is not literal: thin gold paths between the cores that glow, to mark this as the AI layer.
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = TEX;
  {
    const g = glowCanvas.getContext('2d'); g.scale(TEX / C, TEX / C); g.fillStyle = '#000'; g.fillRect(0, 0, C, C);
    const nodes = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) nodes.push([290 + i * 146, 328 + j * 366]);
    g.strokeStyle = '#FFB347'; g.lineWidth = 6; g.lineCap = 'round';
    nodes.forEach(([x, y], n) => nodes.forEach(([x2, y2], m) => { if (m > n && R() < .42) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, (y + y2) / 2); g.lineTo(x2, (y + y2) / 2); g.lineTo(x2, y2); g.stroke(); } }));
    g.fillStyle = '#FFD08A'; nodes.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); });
  }
  const glowMap = new THREE.CanvasTexture(glowCanvas); glowMap.colorSpace = THREE.SRGBColorSpace;

  /* ---------- 6. base: the land grid, gold contact pads around a window of capacitors ---------- */
  const lands = surface((g, o) => {
    g.fillStyle = '#0A3526'; g.fillRect(0, 0, C, C); o.fillStyle = orm(.5, 0); o.fillRect(0, 0, C, C);
    speckle(g, 4000, .03);
    both(g, o, GOLD, .28, 1, k => {
      for (let i = 0; i < 32; i++) for (let j = 0; j < 32; j++) {
        if (i > 11 && i < 20 && j > 11 && j < 20) continue;
        k.beginPath(); k.roundRect(70 + i * 28, 70 + j * 28, 17, 17, 5); k.fill();
      }
    });
    both(g, o, '#B59A6A', .6, .1, k => { for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) k.fillRect(420 + i * 33, 424 + j * 38, 20, 12); });
    both(g, o, GOLD, .3, 1, cornerMark);
  });

  /* ---------- build the six layers ---------- */
  const pbr = t => new THREE.MeshStandardMaterial({ map: t.map, roughnessMap: t.maps, metalnessMap: t.maps, roughness: 1, metalness: 1 });
  const silicon = (t, extra = {}) => new THREE.MeshPhysicalMaterial({
    map: t.map, roughnessMap: t.maps, metalnessMap: t.maps, roughness: 1, metalness: 1,
    iridescence: .4, iridescenceIOR: 1.5, iridescenceThicknessRange: [260, 720], clearcoat: .35, clearcoatRoughness: .25, ...extra
  });
  const plain = (color, rough, metal) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const body = (w, h, d, mat, radius = .014) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, h / 2.2)), mat); m.castShadow = m.receiveShadow = true; return m;
  };
  // A flat face laid on top of a body. Its texture reads the right way up for someone in front of the stack.
  const face = (w, d, y, mat) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m;
  };

  const logicMat = silicon(logic, { emissive: new THREE.Color('#FFB347'), emissiveMap: glowMap, emissiveIntensity: 1 });
  const layers = [];
  const add = (height, parts) => { const g = new THREE.Group(); parts.forEach(p => g.add(p)); g.userData.h = height; group.add(g); layers.push(g); };

  // 1. Interface
  const flange = body(2.1, .045, 2.1, plain('#BFC3C8', .38, 1)); flange.position.y = -.0425;
  const plateau = body(1.74, .085, 1.74, plain('#C3C6CB', .36, 1), .03); plateau.position.y = .0225;
  add(.13, [flange, plateau, face(1.68, 1.68, .066, pbr(lid))]);

  // 2. Real-time: the solder bumps that carry every signal between die and board
  const bumpPlate = body(1.9, .034, 1.9, plain('#15171C', .32, .7));
  const side = s.small ? 18 : 26, bumps = new THREE.InstancedMesh(new THREE.SphereGeometry(.022, 10, 8), plain('#D9DBE0', .22, 1), side * side), m4 = new THREE.Matrix4();
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) { m4.setPosition((i / (side - 1) - .5) * 1.72, .02, (j / (side - 1) - .5) * 1.72); bumps.setMatrixAt(i * side + j, m4); }
  bumps.castShadow = true;
  add(.06, [bumpPlate, bumps]);

  // 3. Services
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(.085, .04, .045), plain('#B59A6A', .55, .15), 56);
  let ci = 0; const P = SPAN - .04, at = (cx, cy, turn) => { m4.makeRotationY(turn ? Math.PI / 2 : 0); m4.setPosition((cx / C - .5) * P, .055, (cy / C - .5) * P); caps.setMatrixAt(ci++, m4); };
  for (let i = 0; i < 8; i++) { at(330 + i * 52, 184); at(330 + i * 52, 232); at(330 + i * 52, 792); at(330 + i * 52, 840); }
  for (let i = 0; i < 6; i++) { at(184, 382 + i * 52, true); at(232, 382 + i * 52, true); at(792, 382 + i * 52, true); at(840, 382 + i * 52, true); }
  caps.castShadow = true;
  add(.07, [body(SPAN, .07, SPAN, plain('#1B5A40', .6, 0)), face(P, P, .0355, pbr(board)), caps]);

  // 4. Data
  add(.05, [body(2, .05, 1.7, plain('#17191F', .3, .8), .008), face(1.98, 1.68, .0255, silicon(memory))]);

  // 5. Intelligence
  add(.055, [body(2.1, .055, 1.8, plain('#17191F', .3, .8), .008), face(2.08, 1.78, .028, logicMat)]);

  // 6. Tests
  add(.08, [body(SPAN, .08, SPAN, plain('#123F2E', .6, 0)), face(P, P, .0405, pbr(lands))]);

  const total = layers.reduce((a, l) => a + l.userData.h, 0);
  let y = total / 2;
  layers.forEach((l, i) => { l.userData.y0 = y - l.userData.h / 2; l.userData.k = (layers.length - 1) / 2 - i; l.position.y = l.userData.y0; y -= l.userData.h; });

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: radialTexture('0,0,0', .8), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.1; group.add(shadow);

  s.progress = 0;   // 0 to 1 as the visitor scrolls through the opening
  let wide = true;
  s.onfit = () => {
    wide = s.aspect > 1.05;
    // On a phone the copy takes the top half, so the processor sits small in the lower half.
    group.position.set(wide ? 1.25 * clamp(s.aspect / 1.6, .72, 1.15) : 0, wide ? -.2 : -1.98, 0);
    group.scale.setScalar(wide ? 1 : .55);
    key.position.set(group.position.x - 3.4, group.position.y + 7, 4.6); key.target.position.copy(group.position);
  };

  let e = 0; const v = new THREE.Vector3();
  s.update = dt => {
    const hint = .05 + .02 * Math.sin(s.t * .8);
    let want = reduce ? 1 : Math.max(smooth(.03, .62, s.progress), s.inside && s.progress < .03 ? .16 : 0, hint);
    if (s.force != null) want = s.force;
    e += (want - e) * Math.min(1, dt * 4);
    const ee = e * e * (3 - 2 * e);
    layers.forEach(l => { l.position.y = l.userData.y0 + l.userData.k * .58 * ee; l.rotation.y = l.userData.k * .05 * ee; });
    logicMat.emissiveIntensity = reduce ? 1 : .9 + .45 * Math.sin(s.t * 1.5);
    const tx = s.inside ? s.mx : 0, ty = s.inside ? s.my : 0;
    group.rotation.y += ((-.62 - s.progress * .18 + tx * .18 + Math.sin(s.t * .25) * .04) - group.rotation.y) * Math.min(1, dt * 3);
    group.rotation.x += ((-ty * .07) - group.rotation.x) * Math.min(1, dt * 3);
    if (!wide) return;
    group.updateMatrixWorld(true);
    const show = smooth(.35, .85, ee);
    labelEls.forEach((el, i) => {
      v.set(SPAN / 2 * 1.05, layers[i].position.y, -SPAN / 2 * 1.05); group.localToWorld(v); v.project(camera);
      el.style.transform = `translate(${((v.x * .5 + .5) * s.W).toFixed(1)}px,${((-v.y * .5 + .5) * s.H).toFixed(1)}px) translateY(-50%)`;
      el.style.opacity = show.toFixed(2);
    });
  };
  s.fit();
  return s;
}
