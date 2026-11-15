// Setup work (building a 3D scene, drawing its textures, uploading them) runs in small steps, and only while the
// page is at rest. Smooth scrolling runs on the main thread, so a long piece of work done mid-scroll shows up as a
// stutter. The same work done during a pause goes unnoticed.

const QUIET_MS = 250;   // how long the page must be still before the next step may run
let lastActivity = -Infinity;
let pending = false;
const queue = [];

const note = () => { lastActivity = performance.now(); };
for (const type of ['scroll', 'wheel', 'touchmove', 'pointerdown', 'keydown']) {
  addEventListener(type, note, { passive: true, capture: true });
}

const whenIdle = window.requestIdleCallback
  ? run => requestIdleCallback(run, { timeout: 1000 })
  : run => setTimeout(run, 1);

function pump() {
  if (pending || !queue.length) return;
  pending = true;
  const still = performance.now() - lastActivity;
  if (still < QUIET_MS) {
    setTimeout(() => { pending = false; pump(); }, QUIET_MS - still + 16);
    return;
  }
  whenIdle(() => {
    pending = false;
    if (performance.now() - lastActivity < QUIET_MS) { pump(); return; }
    // The code awaiting this step runs straight after, in this same quiet moment.
    queue.shift()();
    setTimeout(pump, 0);
  });
}

// Resolves at the next quiet moment. Await it before each step of setup work.
export function calm() {
  return new Promise(resolve => { queue.push(resolve); pump(); });
}
