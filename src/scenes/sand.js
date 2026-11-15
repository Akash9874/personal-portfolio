import * as THREE from 'three';
import { makeStage } from './stage.js';

// The footer: grains of sand that gather into each phrase, hold, then drift into the next.
const PHRASES = ['Have an idea?', 'Let’s build it.', 'Say hello.'];
const FONT = px => `600 ${px}px Zodiak, Georgia, serif`;

const VERT = `attribute vec3 aTo;attribute vec4 aRnd;
uniform float uMix;uniform float uTime;uniform float uPx;uniform float uMouseOn;uniform vec2 uScale;uniform vec2 uOff;uniform vec2 uMouse;
varying float vS;
void main(){
  float m=clamp(uMix*1.7-aRnd.x*.7,0.,1.);m=m*m*(3.-2.*m);
  vec2 p=mix(position.xy,aTo.xy,m);
  float mid=sin(m*3.14159);
  vec2 q=p*2.+aRnd.xy*6.;
  vec2 flow=vec2(sin(q.y*3.1+uTime*.7)+sin(aRnd.z*6.+uTime*.5),sin(q.x*3.3-uTime*.4)+sin(aRnd.z*9.+uTime*.6))*.5;
  p+=flow*(.004+mid*(.1+aRnd.y*.22));
  vec2 d=p-uMouse;float f=uMouseOn*smoothstep(.2,0.,length(d));
  p+=normalize(d+vec2(1e-4))*f*(.07+aRnd.z*.11);
  gl_Position=vec4(p*uScale+uOff,0.,1.);
  gl_PointSize=uPx*(1.1+aRnd.w*1.7)*(1.+f);
  vS=aRnd.y;
}`;

const FRAG = `uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;varying float vS;
void main(){
  float d=length(gl_PointCoord-.5);if(d>.5)discard;
  vec3 c=vS<.5?uC1:vS<.82?uC2:uC3;
  gl_FragColor=vec4(c,smoothstep(.5,.3,d)*.95);
  #include <colorspace_fragment>
}`;

export function createSand(canvas, { reduce = false } = {}) {
  const s = makeStage(canvas), { scene } = s;
  const N = s.small ? 26000 : 70000;

  const measure = document.createElement('canvas').getContext('2d'); measure.font = FONT(200);
  const size = Math.min(290, 200 * 1480 / Math.max(...PHRASES.map(p => measure.measureText(p).width)));
  function sample(text, underline) {
    const c = document.createElement('canvas'); c.width = 1600; c.height = 440;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT(size); g.fillText(text, 800, 200);
    if (underline) { const w = g.measureText(text).width; g.fillRect(800 - w / 2, 200 + size * .6, w, 14); }
    const d = g.getImageData(0, 0, 1600, 440).data, pix = [];
    for (let y = 0; y < 440; y += 2) for (let x = 0; x < 1600; x += 2) if (d[(y * 1600 + x) * 4 + 3] > 128) pix.push(x, y);
    const out = new Float32Array(N * 3);
    if (!pix.length) return out;
    for (let i = 0; i < N; i++) {
      const k = Math.floor(Math.random() * pix.length / 2) * 2;
      out[i * 3] = (pix[k] + Math.random() * 2 - 800) / 800;
      out[i * 3 + 1] = -(pix[k + 1] + Math.random() * 2 - 220) / 800;
    }
    return out;
  }
  const targets = PHRASES.map((p, i) => sample(p, i === PHRASES.length - 1));

  const from = new Float32Array(N * 3), rnd = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    from[i * 3] = (Math.random() - .5) * 2.4; from[i * 3 + 1] = (Math.random() - .5) * .7;
    rnd[i * 4] = Math.random(); rnd[i * 4 + 1] = Math.random(); rnd[i * 4 + 2] = Math.random(); rnd[i * 4 + 3] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  const aFrom = new THREE.BufferAttribute(from, 3), aTo = new THREE.BufferAttribute(new Float32Array(targets[0]), 3);
  geo.setAttribute('position', aFrom); geo.setAttribute('aTo', aTo); geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));

  const U = {
    uMix: { value: reduce ? 1 : 0 }, uTime: { value: 0 }, uPx: { value: 2 },
    uScale: { value: new THREE.Vector2(.76, 1) }, uOff: { value: new THREE.Vector2(0, .22) },
    uMouse: { value: new THREE.Vector2(9, 9) }, uMouseOn: { value: 0 },
    uC1: { value: new THREE.Color('#FAFAF7') }, uC2: { value: new THREE.Color('#E8B04A') }, uC3: { value: new THREE.Color('#C96F45') }
  };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false }));
  points.frustumCulled = false; scene.add(points);

  s.onfit = () => {
    const span = s.aspect > 1.05 ? .76 : .92;   // share of the width the phrase may fill
    U.uScale.value.set(span, span * s.aspect);
    U.uOff.value.set(0, s.aspect > 1.05 ? .22 : .3);
    U.uPx.value = Math.max(1.3, s.H / 820 * 1.9) * s.renderer.getPixelRatio();
  };

  let idx = reduce ? PHRASES.length - 1 : 0, hold = reduce, tm = 0, skip = false;
  if (reduce) { aTo.array.set(targets[idx]); aTo.needsUpdate = true; }
  const go = n => { from.set(targets[idx]); aFrom.needsUpdate = true; aTo.array.set(targets[n]); aTo.needsUpdate = true; idx = n; U.uMix.value = 0; hold = false; tm = 0; skip = false; };
  s.onclick = () => { skip = true; };
  s.update = dt => {
    tm += dt; U.uTime.value = s.t;
    if (!hold) { U.uMix.value = Math.min(1, tm / 1.8); if (U.uMix.value >= 1) { hold = true; tm = 0; } }
    else if (!reduce) {
      const forced = s.force != null;
      if (forced ? idx !== s.force : (tm > 2.8 || skip)) go(forced ? s.force : (idx + 1) % PHRASES.length);
    }
    U.uMouseOn.value += ((s.inside ? 1 : 0) - U.uMouseOn.value) * Math.min(1, dt * 6);
    U.uMouse.value.set((s.mx - U.uOff.value.x) / U.uScale.value.x, (s.my - U.uOff.value.y) / U.uScale.value.y);
  };
  s.fit();
  return s;
}
