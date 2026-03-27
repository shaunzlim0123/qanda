## Dark Mode

I implemented a dark mode with a toggle switch in the header.

I defined all colours as CSS custom properties in `:root` and created a `[data-theme="dark"]` selector that overrides every variable with a dark palette. This means the entire UI adapts without changing any component code.

On first visit, an inline script in `<head>` checks the user's `prefers-color-scheme: dark` system preference before the page paints, so it prioritizes the user OS setting. I also added a `matchMedia` change listener that keeps the theme in sync if the user changes their OS setting mid-session.

The preference cascade I built follows this priority: `localStorage` override > system preference > default light. Clicking the toggle saves the choice to `localStorage`, and clearing it e.g. logging out resets to the system preference.

For elements with hardcoded colours that could not use CSS variables e.g. header background, offline banner, notification pings, modal backdrop, I added individual overrides under `[data-theme="dark"]`.

The toggle also scales down on mobile to fit the compact header layout.
