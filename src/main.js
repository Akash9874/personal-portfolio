import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

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

/* ---------- loading the heavy parts only when they are needed ---------- */
// Runs `run` once, when the element is within `margin` of the screen. Everything below the opening
// (3D scenes, carousels) waits for this, so a visitor never pays for a section they have not reached.
const near = (selector, margin, run) => {
  const el = document.querySelector(selector);
  if (!el) return;
  const watch = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { watch.disconnect(); run(); }
  }, { rootMargin: margin });
  watch.observe(el);
};

// The toolkit logos are a separate small download, fetched as soon as the page is up.
import('./toolkit.js').then(({ renderToolkit }) => renderToolkit()).catch(err => console.warn('Toolkit logos unavailable', err));

/* ---------- 3D scenes ---------- */
const stages = {};
const safely = (name, make) => { try { stages[name] = make(); } catch (err) { console.warn(`${name} scene unavailable`, err); } };

// The opening is on screen straight away, so its scene loads first.
import('./scenes/processor.js').then(({ createProcessor }) => {
  safely('processor', () => createProcessor(document.getElementById('sceneProcessor'), [...document.querySelectorAll('#layers .layer')], { reduce }));
  if (stages.processor) {
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom bottom', onUpdate: self => { stages.processor.progress = self.progress; } });
  }
}).catch(err => console.warn('3D opening unavailable', err));

// The block and the sand draw text, so they also wait for the fonts.
const fonts = Promise.all([document.fonts.load('600 46px Switzer'), document.fonts.load('600 200px Zodiak')]).catch(() => {});
near('#toolkit', '120% 0px', () => {
  Promise.all([import('./scenes/block.js'), fonts]).then(([{ createBlock }]) => {
    safely('block', () => createBlock(document.getElementById('sceneBlock'), { reduce }));
    if (stages.block) ScrollTrigger.create({ trigger: '#toolkit', start: 'top 35%', once: true, onEnter: () => stages.block.burst() });
  }).catch(err => console.warn('Toolkit scene unavailable', err));
});
near('#contact', '120% 0px', () => {
  Promise.all([import('./scenes/sand.js'), fonts]).then(([{ createSand }]) => {
    safely('sand', () => createSand(document.getElementById('sceneSand'), { reduce }));
  }).catch(err => console.warn('Footer scene unavailable', err));
});

/* ---------- Flex Carousel for the client sites and the GitHub projects ---------- */
// It needs WebGL 2. Without it, both sections stay as the plain list that is already in the page.
if (document.createElement('canvas').getContext('webgl2')) {
  let chunk = null;
  const load = () => chunk || (chunk = import('./carousels.jsx'));
  const wire = (section, host, panelSelector, pick) => {
    const el = document.querySelector(section), panels = [...el.querySelectorAll(panelSelector)], wrap = panels[0].parentElement;
    // The section switches to its carousel layout at once; the carousel itself arrives when the visitor gets close.
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
    let timer = 0;
    addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(reserve, 200); });
    document.fonts.ready.then(reserve);

    near(section, '150% 0px', () => {
      load().then(mod => {
        const items = pick(mod);
        mod.mountCarousel(document.querySelector(host), items, index => show(items[index].panel));
      }).catch(err => {
        // Fall back to the plain list.
        console.warn('Carousel unavailable', err);
        el.classList.remove('has-carousel'); wrap.style.minHeight = '';
        panels.forEach(panel => panel.classList.remove('is-active'));
        gsap.set(panels, { clearProps: 'all' });
        ScrollTrigger.refresh();
      });
    });
  };
  wire('#work', '#workCarousel', '.case', mod => mod.WORK);
  wire('#projects', '#projectCarousel', '.project', mod => mod.PROJECTS);
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
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(title.lines, { yPercent: 112, duration: 1.4, stagger: .1 }, .1)
    .from('.hero__kicker, .hero__lede, .hero__cta, .hero__scroll', { autoAlpha: 0, y: 24, duration: 1.1, stagger: .08 }, .45)
    .from('#sceneProcessor', { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, .2)
    .from('#nav', { yPercent: -160, duration: 1.1 }, .6);
}

/* ---------- start ---------- */
const start = () => {
  root.classList.add('is-ready');
  if (reduce) return;
  intro(); reveals();
  ScrollTrigger.refresh();
};
if (reduce) start();
else {
  const num = document.getElementById('loaderNum'), counter = { v: 0 };
  gsap.to(counter, {
    v: 100, duration: .8, ease: 'power2.inOut',
    onUpdate: () => { num.textContent = Math.round(counter.v); },
    onComplete: () => document.fonts.ready.then(start)
  });
}
