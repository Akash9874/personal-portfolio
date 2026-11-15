import {
  siTypescript, siReact, siNextdotjs, siNodedotjs, siExpress, siPostgresql, siTailwindcss,
  siPython, siFastapi, siQdrant, siOllama, siScikitlearn,
  siDocker, siGithubactions, siVitest, siNetlify
} from 'simple-icons';
import awsRaw from './logos/aws.svg?raw';
import playwrightRaw from './logos/playwright.svg?raw';

// Logos come from Simple Icons; AWS and Playwright are not in that set, so those two are from devicon (src/logos).
// `brand` is the colour a tile takes on hover. Logos whose brand colour is black keep the page's text colour.
const si = (name, icon, keepInk) => ({ name, box: 24, path: [icon.path], brand: keepInk ? null : `#${icon.hex}` });
const file = (name, raw, brand) => ({ name, box: 128, path: [raw.match(/ d="([^"]+)"/)[1]], brand });

const TOOLS = {
  build: [
    si('TypeScript', siTypescript), si('React', siReact), si('Next.js', siNextdotjs, true), si('Node.js', siNodedotjs),
    si('Express', siExpress, true), si('PostgreSQL', siPostgresql), si('Tailwind CSS', siTailwindcss)
  ],
  ai: [
    si('Python', siPython), si('FastAPI', siFastapi),
    // Retrieval is a technique, not a product, so it gets a drawn mark: a document and a magnifier.
    { name: 'RAG', box: 24, stroke: true, brand: '#E8B04A', path: ['M12 21H6V3h7l4 4v3.5', 'M13 3v4h4', 'M20 16.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z', 'M19 19l2.5 2.5'] },
    si('Qdrant', siQdrant), si('Ollama', siOllama, true), si('scikit-learn', siScikitlearn)
  ],
  ship: [
    si('Docker', siDocker), file('AWS', awsRaw, '#FF9900'), si('GitHub Actions', siGithubactions),
    si('Vitest', siVitest), file('Playwright', playwrightRaw, '#2EAD33'), si('Netlify', siNetlify)
  ]
};

const NS = 'http://www.w3.org/2000/svg';
function mark(tool) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${tool.box} ${tool.box}`);
  svg.setAttribute('aria-hidden', 'true');
  if (tool.stroke) {
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  } else svg.setAttribute('fill', 'currentColor');
  tool.path.forEach(d => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p); });
  return svg;
}

// Swaps each plain list of tool names (kept in the page for readers without scripts) for a row of logo tiles.
export function renderToolkit() {
  document.querySelectorAll('[data-tools]').forEach(host => {
    const tools = TOOLS[host.dataset.tools];
    if (!tools) return;
    const list = document.createElement('ul'); list.className = 'logos';
    tools.forEach(tool => {
      const item = document.createElement('li'); item.className = 'logo';
      if (tool.brand) item.style.setProperty('--brand', tool.brand);
      const tile = document.createElement('span'); tile.className = 'logo__tile'; tile.appendChild(mark(tool));
      const name = document.createElement('span'); name.className = 'logo__name'; name.textContent = tool.name;
      item.append(tile, name); list.appendChild(item);
    });
    host.replaceChildren(list);
  });
}
