import { createRoot } from 'react-dom/client';
import FlexCarousel from './flex/FlexCarousel.jsx';

// The Flex Carousel from React Bits (src/flex), with its "liquid" preset.
// captureWheel is off so the mouse wheel keeps scrolling the page; drag, arrow keys and clicks move the carousel.
export function mountCarousel(el, items, onChange) {
  createRoot(el).render(
    <FlexCarousel
      items={items}
      preset="liquid"
      intro="rise"
      cardHeight={0.5}
      gap={12}
      squeeze={0.2}
      focusOnClick
      captions
      fit="natural"
      radius={0}
      autoplay={false}
      captureWheel={false}
      onChange={onChange}
    />
  );
}

// `panel` says which write-up in index.html a card belongs to (0 is the first one in the section).
// Keep the last card at least as wide as the first: the carousel opens on whichever of the two sits nearer the centre.
export const WORK = [
  { src: '/work/hope-trust.webp', alt: 'Hope Trust India home page', title: 'Hope Trust India', subtitle: 'Mental health care, Hyderabad', panel: 0 },
  { src: '/work/hope-assistant.webp', alt: 'The Hope Trust AI Assistant open on the website, greeting a visitor', title: 'Hope Trust assistant', subtitle: 'The assistant on the website', panel: 1 },
  { src: '/work/hope-console.webp', alt: 'A WhatsApp chat with the Hope Trust assistant beside the intake console, shown with sample data', title: 'Hope Trust assistant', subtitle: 'WhatsApp and the intake console (sample data)', panel: 1 },
  { src: '/work/patil-group.webp', alt: 'Patil Group home page', title: 'Patil Group', subtitle: 'Railway infrastructure', panel: 2 },
  { src: '/work/our-sacred-space.webp', alt: 'Our Sacred Space home page', title: 'Our Sacred Space', subtitle: 'Cultural centre, Secunderabad', panel: 3 },
  { src: '/work/oss-dashboard.webp', alt: 'The Our Sacred Space admin dashboard with booking totals and charts. Revenue is hidden.', title: 'Our Sacred Space bookings', subtitle: 'The admin dashboard', panel: 4 },
  { src: '/work/oss-bookings.webp', alt: 'The bookings list in the admin portal. Customer details and amounts are hidden.', title: 'Our Sacred Space bookings', subtitle: 'Every booking, searchable', panel: 4 }
];

// Screenshots taken from each repository or its live site.
export const PROJECTS = [
  { src: '/projects/sandbox-before.webp', alt: 'The sandbox editor with a green box drawn around a function', title: 'Code Review Sandbox', subtitle: 'A box drawn around a function', panel: 0 },
  { src: '/projects/sandbox-after.webp', alt: 'The same editor after ten lines were added above. The box has moved down with the function.', title: 'Code Review Sandbox', subtitle: 'Ten lines later, the box moved with it', panel: 0 },
  { src: '/projects/rag-block.webp', alt: 'The RAG demo blocking a prompt injection, with a trace reading 0.92 ms', title: 'Enterprise RAG', subtitle: 'A prompt injection, blocked in 0.92 ms', panel: 1 },
  { src: '/projects/rag-trace.webp', alt: 'A guardrail trace chart listing six checks and an escalation', title: 'Enterprise RAG', subtitle: 'Each answer comes with its guardrail trace', panel: 1 },
  { src: '/projects/focus-overlay.webp', alt: 'A page blurred behind a timer at 0:00 and the message: That is reddit.com for today', title: 'Focus Timer', subtitle: 'Time is up, with five minutes to borrow', panel: 2 },
  { src: '/projects/focus-popup.webp', alt: 'The Focus Timer popup listing three sites with their daily limits and time left', title: 'Focus Timer', subtitle: 'The whole interface is one popup', panel: 2 },
  { src: '/projects/quickmart-home.webp', alt: 'QuickMart home page: Compare Prices, Save Money', title: 'QuickMart', subtitle: 'Grocery prices, compared across stores', panel: 3 },
  { src: '/projects/quickmart-products.webp', alt: 'QuickMart product cards showing the best price and the saving for each item', title: 'QuickMart', subtitle: 'The best price, marked on every product', panel: 3 }
];
