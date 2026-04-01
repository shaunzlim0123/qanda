# Qanda

**A zero-dependency forum SPA where routing, state, components, and rendering are all built from scratch in vanilla JavaScript.**

![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?logo=javascript&logoColor=000)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=fff)
![REST API](https://img.shields.io/badge/REST-API-009688)
![Responsive](https://img.shields.io/badge/Responsive-Design-4CAF50)

Qanda is a fully functional forum inspired by [EdStem](https://edstem.org), built entirely with vanilla JavaScript, HTML5, and CSS3. No React. No Vue. No build tools. Every piece of the application, the SPA router, the component system, the state layer, the real-time polling engine, is hand-built from browser primitives.

<!-- Add demo GIF here. Screen recording showing: browsing the thread sidebar, creating a new post, nested comment threading with replies, live like count updates, dark mode toggle, and mobile responsive layout -->

## Why Vanilla JS?

I built Qanda without frameworks as a deliberate engineering choice, not a limitation. Building a complete SPA without framework abstractions forced me to solve the problems that React, Vue, and Angular were created to solve, and to understand _why_ those solutions exist. I implemented my own hash-based router, my own component lifecycle via factory functions, my own state management through a shared application object, and my own DOM reconciliation logic for live-updating content without full re-renders.

The result is a stronger mental model for working _with_ frameworks at scale. Having manually wired `hashchange` listeners, diffed comment trees to avoid unnecessary DOM mutations, and managed polling intervals across page transitions, I understand the "why" behind virtual DOMs, reactive state, and declarative rendering because I've built the imperative equivalents from scratch. This is the kind of foundation that matters on teams maintaining bespoke component systems alongside framework code.

## Key Features

- **Custom SPA Router**: Fragment-based URL routing (`/#thread={id}`, `/#profile={userId}`) with authenticated route guards, hash-state persistence, and back-navigation support, built from scratch on the `hashchange` API
- **Recursive Nested Comment Trees**: Parent-child comment relationships rendered recursively to unlimited depth with visual indentation, dual sort order (newest-first at root, chronological within threads), and per-comment like/reply/edit controls
- **Real-Time Live Polling**: 2-second thread polling and 3-second notification polling that live-updates like counts, detects new comments, and pushes toast notifications for watched threads, all with state diffing to avoid unnecessary DOM writes
- **Infinite Scroll Pagination**: Progressive thread loading triggered by scroll position with batch fetching, duplicate-request guards, and automatic pre-fill when the viewport isn't scrollable
- **Offline-First Caching**: Most recent thread and comment tree serialised to `localStorage` for offline access, with a read-only fallback UI, network detection via `navigator.onLine`, and graceful degradation of all interactive elements
- **Modular Component Architecture**: Factory functions that compose DOM trees, a centralised API service with token-aware headers, and a shared state object passed between modules, forming a hand-built micro-framework mirroring how production UI libraries manage rendering and state

---

## Architecture Overview

Qanda is structured as a set of ES modules, each responsible for a distinct domain. There is no framework, no bundler, and no build step. The browser loads modules natively via `<script type="module">`.

The architecture follows a **factory function pattern**: each module exports render functions (e.g., `renderThreadList`, `renderComments`, `renderProfileContent`) that imperatively create DOM elements, attach event listeners, and return or append their output. A central `app` object acts as the shared state container, holding references to the active DOM region, loaded thread IDs, polling intervals, and the router function itself. This object is passed to every module, giving each access to application state without global variables or a pub/sub system.

The API layer is a single `apiCall()` function that wraps `fetch` with Bearer token injection, offline detection, and standardised error handling. Every server interaction flows through this one function.

```
frontend/
├── index.html                 # Entry point, loads ES modules, no build step
├── styles/
│   └── global.css             # CSS custom properties, flexbox/grid layout, dark mode, responsive
└── src/
    ├── main.js                # App bootstrap, SPA router, authenticated layout, theme toggle
    ├── auth.js                # Login/registration pages, client-side validation, JWT storage
    ├── thread.js              # Thread CRUD, sidebar list, infinite scroll, 2s live polling
    ├── comments.js            # Recursive comment tree, reply/edit modals, like toggles
    ├── user.js                # Profile display/editing, avatar upload, admin role management
    ├── notifications.js       # Watched thread polling (3s), toast notifications, state diffing
    ├── helpers.js             # apiCall() wrapper, DOM utilities, hash parser, timestamp formatting
    ├── config.js              # Backend URL configuration
    └── theme-init.js          # OS theme detection before first paint (prevents flash)
```

### Design Patterns

| Pattern                      | Where                                      | Purpose                                                                            |
| ---------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| **Factory Functions**        | Every `render*()` function                 | Compose DOM subtrees with encapsulated event listeners and local state             |
| **Centralised State Object** | `app` in `main.js`                         | Single source of truth passed between modules, avoids globals, enables cleanup      |
| **Module Pattern**           | ES module boundaries                       | Each file encapsulates a domain; only public render/utility functions are exported |
| **Event Delegation**         | Scroll listeners, modal overlays           | Efficient DOM event handling without per-element binding                           |
| **State Diffing**            | Polling in `thread.js`, `notifications.js` | Compare server state against last-known state to avoid unnecessary re-renders      |

---

## Tech Stack

| Layer             | Technology                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Language          | Vanilla JavaScript (ES6+ modules, arrow functions, async/await, destructuring)                |
| Markup            | HTML5 (semantic elements, `data-*` attributes, `<dialog>`-style modals)                       |
| Styling           | CSS3 with custom properties, Flexbox, Grid, media queries, `data-theme` dark mode             |
| API Communication | Fetch API with Bearer token auth, offline detection, centralised error handling               |
| Authentication    | JWT tokens stored in `localStorage`, decoded client-side via `atob()` for user ID extraction  |
| Persistence       | `localStorage` for session tokens, theme preference, offline thread/comment cache             |
| Backend           | Node.js / Express REST API (separate repository)                                              |

---

## Getting Started

```bash
# 1. Clone the backend
git clone https://github.com/shaunzlim0123/qanda-backend.git
cd qanda-backend
npm install
npm start
# Backend runs on http://localhost:5005

# 2. Clone the frontend
git clone https://github.com/shaunzlim0123/qanda.git
cd qanda

# 3. Open in browser, no build step required
open frontend/index.html
# Or use a local server: npx serve frontend
```

> **Note**: The backend must be running on port `5005` for API calls to connect. Update `frontend/src/config.js` if your backend runs on a different port.

---

## Design Decisions

### Hash-Based SPA Router

The router is built on the `hashchange` event listener. `parseHash()` extracts the current page and data from the URL fragment (e.g., `#thread=42` produces `{ page: "thread", data: "42" }`), and `navigateTo()` acts as the central dispatcher, clearing stale DOM content, delegating to the correct render function, and managing polling interval cleanup. Route guards check for a valid JWT in `localStorage` before rendering authenticated pages; unauthenticated users are redirected to the login screen. This gives the app deep-linkable, bookmarkable URLs without a server-side router or `history.pushState` complexity.

### Recursive Comment Trees with Dual Sort Order

Comments arrive as a flat array from the API, each with a `parentCommentId` field. The rendering logic builds a `childrenMap` (parent ID to children array), then renders top-level comments in reverse chronological order (newest first) while rendering nested replies in chronological order (oldest first). This mirrors how platforms like Reddit and EdStem present conversations: you see the latest discussion at the top, but replies within a thread read naturally top to bottom. The `renderComment()` function calls itself recursively for each child, with CSS `margin-left` creating visual depth.

### Efficient Live Polling with State Diffing

Two independent polling loops run during active use: a 2-second interval for thread data (likes, comment counts) and a 3-second interval for watched-thread notifications. Rather than re-rendering the entire page on each tick, the polling logic compares incoming data against the current DOM state, only updating specific text nodes or triggering a comment re-render when counts actually change. Polling intervals are cleaned up on every page transition via `clearInterval()` to prevent memory leaks and stale callbacks.

### Offline Caching and Graceful Degradation

When a user views a thread, the full thread object and its comment tree (including resolved author names) are serialised to `localStorage`. If the app detects `navigator.onLine === false`, it loads cached data into a read-only view with an "Offline - READ ONLY" banner, disabling all interactive controls. This isn't a full service worker implementation but rather a pragmatic cache of the last-viewed thread that provides meaningful offline access without the complexity of a full offline-first architecture.

---

## What I Learned

Building a complete SPA without frameworks gave me a visceral understanding of the browser platform: the event loop, DOM lifecycle, memory management around intervals and listeners, and the real cost of unnecessary re-renders. I now understand _why_ React's virtual DOM exists (manual DOM diffing is tedious and error-prone), _why_ routers abstract `hashchange`/`popstate` (edge cases multiply fast), and _why_ state management libraries enforce unidirectional data flow (shared mutable state across modules requires discipline). More importantly, I'm confident I can build custom solutions when off-the-shelf tools don't fit, a skill that matters on teams maintaining bespoke component systems alongside framework code.
