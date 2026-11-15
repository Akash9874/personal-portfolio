# Portfolio copy — approved 2026-11-14

**The idea in one sentence:** a portfolio told in three acts (build, break, prove) where every claim comes with its number, including the numbers that didn't go well.

How to read this file: plain text is what visitors see. Lines starting with `>` are notes to you and never appear on the site.

---

## Site basics

**Browser tab title:** Akashdeep Dash — Full-stack & AI engineer

**Search result description:** Full-stack and AI engineer in Bangalore. Real-time apps, AI systems with guardrails, and client websites and booking systems in production, all built and tested honestly.

**Navigation:** Work · Projects · Research · About · Contact

---

## Opening screen

**Small line above the headline:** Akashdeep Dash, full-stack and AI engineer in Bangalore

**Headline:** Solid all the way down.

**Line under the headline:** I build every layer myself, from the interface down to the model, and I test each one until it holds.

**Buttons:** See the work · Say hello

**Scroll cue:** Scroll to pull it apart

**Layer labels on the processor:** Interface (React, Next.js, design) · Real-time (WebSockets, CRDT sync) · Services (Node.js, FastAPI) · Data (PostgreSQL, vector search) · Intelligence (Retrieval, guardrails, evaluation) · Tests (628 automated tests underneath)

> Changed on 2026-11-15 to fit the processor design. The first approved headline was "I build things. Then I try to break them."
> 628 is 159 + 27 from the sandbox plus 442 from the RAG project.

---

## Act I — Build

**Label:** Act I — Build

**Headline:** One agency. One developer. Three sites and the systems behind them.

**Intro:** My first job was at Admirate, a creative agency. I was the only developer there, so there was nobody to hand the hard part to. I designed, built and shipped everything here myself, start to finish.

> Changed on 2026-11-15 at your request: South Glass and SportExpo were removed, and the Hope Trust assistant and the Our Sacred Space booking system were added. The five items are shown in the Flex Carousel.

### Hope Trust India

**What it is:** Mental health and de-addiction care in Hyderabad, since 2002.

**What I built:** People reach this site on a hard day, so it had to be calm, clear and quick to a booking.

**Tags:** Design · Website

**Link:** hopetrustindia.com

### Hope Trust assistant

**What it is:** The AI assistant on Hope Trust's website and WhatsApp, and the console their team works from.

**What I built:** A hello gets an answer straight away. The assistant says it's an AI and points anyone in danger to emergency services before anything else. It asks for a name and what's going on, suggests therapists who fit, and sends a link to book. Crisis messages, under-18s and requests for the coordinator are flagged to the team as they arrive, and every chat shows up on one console where staff can reply. The console pictured uses sample data, because the real one holds patient records.

**Tags:** Website chat · WhatsApp assistant · Intake console

**Link:** hopetrustindia.com

> The wording follows the Hope Trust section of admirate.in/services/digital. The console image is the sample-data version from that page.

### Patil Group

**What it is:** Railway sleepers and track systems for metro lines across India.

**What I built:** Fifty years of infrastructure work, six product lines and five track systems, organised so the projects speak first and nothing shouts.

**Tags:** Design · Website

**Link:** patilgroup.com

### Our Sacred Space

**What it is:** A cultural and community centre in Secunderabad, founded in 2012, bringing together art, wellness, learning and environmental awareness.

**What I built:** The place runs on its calendar: dance sessions, music events, workshops, markets. So events, classes and bookings sit at the front of the site, because that is what people come for.

**Tags:** Design · Website

**Link:** oursacredspace.in

### Our Sacred Space bookings

**What it is:** The booking system and admin portal behind Our Sacred Space.

**What I built:** Visitors book classes and events and request spaces on the site. The team runs all of it from one portal: every booking with its status, the classes and events on offer, co-working, and space requests waiting for review. Bookings can be searched by name, email, phone or ID, and filtered by type and status. Customer details and revenue are hidden in these screenshots.

**Tags:** Booking system · Admin portal · Dashboard

**Link:** oursacredspace.in

> In the two screenshots the revenue figure and chart, booking IDs, customer names, emails and amounts are covered, and the browser bar with the admin address is cropped out. Booking counts are still visible.

**Closing line of the act:** Three organisations run on these today. That taught me to ship. It also made me curious about what happens when things go wrong.

---

## Act II — Break

**Label:** Act II — Break

**Headline:** Then I went looking for harder problems.

**Intro:** Client work taught me to ship. My own projects are where I find out how things fail, and write the failures down.

### Project 01 — Collaborative Code Review Sandbox

**One line:** Edit code together, draw on it, run it. Nothing to install.

**The idea:** Code review lives in comment threads. The explaining happens on a whiteboard somewhere else. I wanted both in one browser tab.

**What I built:** A shared workspace where several people edit the same files, sketch boxes and arrows straight over the code, and run it to see the same output at the same moment. Edits sync through a Yjs CRDT over WebSockets, so two people can work offline and still merge cleanly when they reconnect.

**The hard part:** A drawing has to stay with the code it describes. Add ten lines above a function and the box around it moves down too. Delete the code and the drawing dims. It never slides onto something unrelated.

**The decision I'd defend:** Syncing and running code are two separate services. One only relays edits and never looks inside them. The other validates, rate-limits and runs code in isolated containers.

**Big numbers:**
- 159 unit and integration tests
- 27 browser tests, including two browsers drawing over one document
- 3 languages run in isolated containers: Python, JavaScript, TypeScript

**What it doesn't do yet:** The room link is the only lock, so anyone who has it can read and edit. Only the open file runs. It's a place to read code together, not a build system.

**Stack:** Next.js · TypeScript · Yjs · Monaco · Node.js · PostgreSQL · Piston · Vitest · Playwright

**Links:** Code on GitHub · Live demo (magnificent-torrone-9ce153.netlify.app)

> When I tested the demo, the room opened but stayed on "Waking the sandbox…" for over two minutes and Run showed "Offline". Get the server responding before the portfolio links here.
> The demo calls itself "CRDT Sandbox" and its address is an auto-generated Netlify name. Worth giving both a clean name that matches this section.

### Project 02 — Enterprise RAG with Guardrails & Evaluation

**One line:** An AI assistant you can attack, measure and trust, built on a laptop with no GPU.

**The constraint:** One rule from the start: no usable GPU, 16 GB of RAM, and no budget for paid inference.

**What I built:** A question-answering service where every request passes through a chain of safety checks, cheapest first. Pattern and personal-data checks take under a millisecond. Small classifier models run next. A language model is only called when the cheaper checks can't decide.

**How I know it works:** I attacked it. 22 attacks, plus 12 harmless questions as a control group.

**Big numbers:**
- 0.92 ms to stop a prompt injection
- 0 of 8 injection attacks got through
- 0 of 4 personal-data attacks got through
- 0 of 12 harmless questions wrongly refused

**Where it falls short:** 5 of the 22 attacks succeeded, and 4 of those were unanswerable questions it hedged on when it should have refused. Answers take 34.6 seconds against a 20-second target. 57% of answers cite no source. Each of these is written up in the repo with what it would cost to fix.

**The part I'm proudest of:** Scoring uses no AI judge, so the same commit gives the same score on my laptop and in CI. When I planted a regression on purpose, recall dropped from 0.661 to 0.464 and the build failed, as designed.

**Smaller numbers:** 442 tests · 30 written decision records · whole stack healthy in 21.4 seconds from one Docker command

**Stack:** Python · FastAPI · Qdrant · Ollama · Qwen2.5-3B · Docker

**Links:** Code on GitHub

### Project 03 — Focus Timer

**One line:** A gentle daily time budget for distracting sites. A Chrome extension with no dependencies.

**The idea:** Blocking a site outright is all or nothing. This gives it a daily allowance instead. A small countdown pill shows what's left, and when the allowance runs out the page blurs behind a reminder.

**The detail I like:** You can borrow five minutes, but it's a loan and not a reset: tomorrow starts five minutes shorter.

**The hard part:** Chrome shuts down an extension's background worker after about 30 seconds idle, so a running counter would quietly lose time. Time is worked out from saved timestamps instead, and each save is capped at 90 seconds so a sleeping laptop can't add phantom hours.

**Only when you're there:** The clock pauses when you switch tabs, leave the window, or stop touching the keyboard for 60 seconds.

**Big numbers:**
- 39 tests, with no browser automation
- 0 network requests. Everything stays on your machine.

**What it doesn't do yet:** It isn't on the Chrome Web Store, so it installs unpacked in developer mode.

**Stack:** Chrome Manifest V3 · JavaScript · chrome.storage · Vitest

**Links:** Code on GitHub

### Project 04 — QuickMart

**One line:** Compare the price of the same groceries across stores, and see the best deal.

**The idea:** One place to compare what the same item costs at several quick-commerce stores, with the cheapest one marked and the saving worked out.

**What I built:** A Next.js app on PostgreSQL with Prisma. You browse by category or search, each product lists its price at every store, the lowest is highlighted, and the saving shows as a percentage. Accounts, a cart and orders run through the app's own API routes.

**What it doesn't do yet:** The stores and prices are sample data seeded into the database, not live feeds from real retailers.

**Stack:** Next.js · React · TypeScript · Tailwind CSS · PostgreSQL · Prisma

**Links:** Code on GitHub · Live site (quickmart-theta.vercel.app)

> Added on 2026-11-15 at your request. Both write-ups follow the repositories' READMEs. The "sample data" line is my reading of the seed script and the store names; correct it if the prices are real.

---

## Act III — Prove

**Label:** Act III — Prove

**Headline:** If it's true, it should survive review.

### Published research

**Title:** Federated Learning for Privacy Preservation of IoT Device

**Where:** 2026 9th International Conference on Intelligent Computing and Control Systems (ICICCS) · IEEE Xplore · pages 1239–1245

**Authors:** First author, with Sai Suraj Voleti, Adithya P and Jasmine S.

**The problem, plainly:** Phones and sensors can train a shared model without their data ever leaving the device. The trouble is real devices. Some are slow, some are low on battery, some drop offline halfway through. Waiting for all of them stalls everyone.

**What we designed:** An asynchronous approach. The server takes updates as they arrive and gives late ones less weight. It chooses which devices to train on, and devices low on battery do less work each round. Each update gets noise added on the device for differential privacy, then is compressed to save bandwidth.

**Result:** Tested on human-activity sensor data, with each device holding a different mix of data, it reached accuracy comparable to centralized training and outperformed synchronous federated learning when the devices were uneven.

**Link:** Read on IEEE Xplore (ieeexplore.ieee.org/document/11503005)

> The published title says "IoT Device", singular. Your resume says "Devices". I used the published form.
> The result line follows the paper's abstract, which gives no figures. If you want a number here, send me the accuracy table from the paper.
> This section links to the paper, not the GitHub repo, because the repo README still has "[Your Name]" placeholders.

> The "Rules I don't skip" block was removed on 2026-11-15 at your request.

---

## Experience

**Headline:** Where I've worked

**KPMG India — Cybersecurity Analyst**
Oct 2026 to now · Bangalore
Information security and technology risk assessment.

> The Microsoft D365 internship entry was removed on 2026-11-15 at your request.

**Admirate — Full-stack Developer Intern, sole developer**
Sep 2025 to Jan 2026 · Remote
Designed, built and deployed every client site in Act I, in React, Next.js, Node.js and PostgreSQL.

**Education:** B.Tech in Computer Science (Cloud Computing), SRM Institute of Science and Technology, 2026

> College is one line and no section. Delete the line if you'd rather not show it.

---

## Toolkit

**Headline:** What I reach for

**Build:** TypeScript · React · Next.js · Node.js · Express · PostgreSQL · Tailwind CSS

**AI:** Python · FastAPI · Retrieval (RAG) · Qdrant · Ollama · scikit-learn

**Ship and test:** Docker · AWS · GitHub Actions · Vitest · Playwright · Netlify

---

## About

**Headline:** The short version

I'm Akashdeep. I'm 22 and I live in Bangalore.

I started out as the only developer at a creative agency, which is a quick way to learn that every part of a product is your problem. Now I work in cybersecurity at KPMG India, and my own hours go to full-stack and AI engineering: real-time systems, retrieval, guardrails, and the tests that show whether any of it works.

I like projects where the README can include the numbers that didn't go my way.

Away from the keyboard I watch a lot of films, read, play basketball and follow football.

---

## Contact

**Headline:** Have something that needs to hold up?

**Body:** If you're building in full-stack or AI and want someone who will ship it and tell you honestly how it tests, write to me.

**Button:** akashdeepdash@gmail.com

**Links:** LinkedIn · GitHub

**Footer:** Designed and built by Akashdeep Dash · Bangalore · 2026

---

## Small print

**Loading line:** Running checks…

**Page not found:** This page failed its tests. · Button: Back to the start
