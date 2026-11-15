import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { calm } from './calm.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add('js');

/* ---------- smooth scrolling ---------- */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: .1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { duration: 1.4 }); else target.scrollIntoView();
}));

/* ---------- nav: tuck away going down, return going up ---------- */
const nav = document.getElementById('nav');
let lastY = 0;
const onScroll = y => { nav.classList.toggle('nav--hidden', y > lastY && y > innerHeight * .6); lastY = y; };
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

// The toolkit logos are a separate small download, fetched as soon as the page is up.
import('./toolkit.js').then(({ renderToolkit }) => renderToolkit()).catch(err => console.warn('Toolkit logos unavailable', err));

/* ---------- 3D scenes ---------- */
// Every scene is built in small steps that only run while the page is still (see calm.js), compiles its shaders
// in the background, and fades in when it is ready. Before this, building a section mid-scroll froze the page.
const stages = {};
const warn = what => err => console.warn(`${what} unavailable`, err);
const fonts = Promise.all([document.fonts.load('600 46px Switzer'), document.fonts.load('600 200px Zodiak')]).catch(() => {});

// The opening is built first, before the page reveals itself, so nothing is animating while it builds.
const opening = import('./scenes/processor.js')
  .then(({ createProcessor }) => createProcessor(document.getElementById('sceneProcessor'), [...document.querySelectorAll('#layers .layer')], { reduce }))
  .then(s => {
    stages.processor = s;
    const watch = ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom bottom', onUpdate: self => { s.progress = self.progress; } });
    s.progress = watch.progress;
  })
  .catch(warn('3D opening'));

/* ---------- Flex Carousel for the client sites and the GitHub projects ---------- */
// It needs WebGL 2. Without it, both sections stay as the plain list that is already in the page.
// The same spare context is used to compile the carousel's shaders ahead of time.
const spare = document.createElement('canvas').getContext('webgl2');
const carousels = [];
if (spare) {
  const wire = (section, host, panelSelector, pick) => {
    const el = document.querySelector(section), panels = [...el.querySelectorAll(panelSelector)], wrap = panels[0].parentElement;
    // The section switches to its carousel layout at once; the carousel itself mounts in a quiet moment.
    el.classList.add('has-carousel');
    let shown = -1;
    const show = p => {
      if (p === shown) return;
      shown = p;
      panels.forEach((panel, k) => panel.classList.toggle('is-active', k === p));
      if (!reduce) gsap.fromTo(panels[p], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'expo.out', overwrite: true });
    };
    // Reserve room for the tallest write-up so the page doesn't jump when the card changes.
    const reserve = () => {
      wrap.style.minHeight = '';
      panels.forEach(panel => panel.classList.add('is-active'));
      const tallest = Math.max(...panels.map(panel => panel.offsetHeight));
      panels.forEach((panel, k) => panel.classList.toggle('is-active', k === shown));
      wrap.style.minHeight = `${tallest}px`;
      ScrollTrigger.refresh();
    };
    show(0); reserve();
    // Only a change of width can change the write-ups' height. On phones the height changes whenever the
    // address bar slides away mid-scroll, and measuring then caused a stutter.
    let timer = 0, width = innerWidth;
    addEventListener('resize', () => {
      if (innerWidth === width) return;
      width = innerWidth; clearTimeout(timer); timer = setTimeout(reserve, 200);
    });
    fonts.then(reserve);

    const fallBack = err => {
      console.warn('Carousel unavailable', err);
      el.classList.remove('has-carousel'); wrap.style.minHeight = '';
      panels.forEach(panel => panel.classList.remove('is-active'));
      gsap.set(panels, { clearProps: 'all' });
      ScrollTrigger.refresh();
    };
    carousels.push({ host, pick, show, fallBack });
  };
  wire('#work', '#workCarousel', '.case', mod => mod.WORK);
  wire('#projects', '#projectCarousel', '.project', mod => mod.PROJECTS);
}

// Everything below the opening, built in page order once the opening has finished its entrance.
async function buildTheRest() {
  if (carousels.length) {
    try {
      const mod = await import('./carousels.jsx');
      await mod.prewarm(spare);
      for (const c of carousels) {
        await calm();
        try { const items = c.pick(mod); mod.mountCarousel(document.querySelector(c.host), items, index => c.show(items[index].panel)); }
        catch (err) { c.fallBack(err); }
      }
    } catch (err) { carousels.forEach(c => c.fallBack(err)); }
    spare.getExtension('WEBGL_lose_context')?.loseContext();
  }
  await fonts;
  try {
    const { createBlock } = await import('./scenes/block.js');
    const block = await createBlock(document.getElementById('sceneBlock'), { reduce });
    stages.block = block;
    ScrollTrigger.create({ trigger: '#toolkit', start: 'top 35%', once: true, onEnter: () => block.burst() });
  } catch (err) { warn('Toolkit scene')(err); }
  try {
    const { createSand } = await import('./scenes/sand.js');
    stages.sand = await createSand(document.getElementById('sceneSand'), { reduce });
  } catch (err) { warn('Footer scene')(err); }
}

gsap.ticker.add((time, deltaMs) => {
  const dt = Math.min(.05, deltaMs / 1000);
  for (const key in stages) stages[key].frame(dt);
});
if (import.meta.env.DEV) { window.__stages = stages; window.__lenis = lenis; }

/* ---------- reveals ---------- */
function reveals() {
  document.querySelectorAll('[data-split]').forEach(el => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln' });
    gsap.from(split.lines, { yPercent: 112, duration: 1.2, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.fromTo(el, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), decimals = (el.dataset.count.split('.')[1] || '').length, state = { v: 0 };
    el.textContent = (0).toFixed(decimals);
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(state, { v: end, duration: 1.5, ease: 'power3.out', onUpdate: () => { el.textContent = state.v.toFixed(decimals); } })
    });
  });
}

function intro() {
  const title = SplitText.create('#heroTitle', { type: 'lines', mask: 'lines', linesClass: 'ln' });
  return gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from(title.lines, { yPercent: 112, duration: 1.4, stagger: .1 }, .1)
    .from('.hero__kicker, .hero__lede, .hero__cta, .hero__scroll', { autoAlpha: 0, y: 24, duration: 1.1, stagger: .08 }, .45)
    .from('#nav', { yPercent: -160, duration: 1.1 }, .6);
}

/* ---------- start ---------- */
// The page shows itself once the fonts are in and the opening scene is built, or after 1.5 s at the latest.
const atMost = ms => new Promise(resolve => setTimeout(resolve, ms));
Promise.all([Promise.race([fonts, atMost(1500)]), Promise.race([opening, atMost(1500)])]).then(() => {
  root.classList.add('is-ready');
  if (reduce) { ScrollTrigger.refresh(); buildTheRest(); return; }
  const entrance = intro();
  reveals();
  ScrollTrigger.refresh();
  entrance.then(buildTheRest);
});
