# Cube Timer Project

## Overview

A mobile-friendly Rubik's cube timer with statistics tracking and personal records.

**Key Features:**
- Timer with inspection time (configurable 8, 10, or 15 seconds)
- Random scramble generation (20 moves)
- Personal records (single, ao5, ao12, ao50)
- Solve history with filtering
- Statistics charts (time progression, distribution)
- PWA with offline support
- LocalStorage for data persistence

## Architecture

```
┌─────────────────────────────────────┐
│  CubeTimer (main controller)        │
├─────────────────────────────────────┤
│  localStorage (solve data, records) │
└─────────────────────────────────────┘
```

**Data Model:**
- `solves`: Array of `{id, time, scramble, timestamp, penalty, rawTime}`
- Records stored as individual localStorage keys

## Build / Lint / Test Commands

This is a vanilla JavaScript/HTML/CSS project with no build system configured.

- **No build step required** - Files are served statically
- **No linting configured** - Consider adding ESLint for JS
- **No tests configured** - Consider adding a test framework
- **Serve locally**: Use `npx serve` or `python -m http.server`

To run a local server:
```bash
npx serve
# or
python -m http.server 8080
```

## Code Style Guidelines

### JavaScript (app.js)

**Formatting:**
- Indentation: 2 spaces
- Prefer single quotes for strings
- Max line length: ~100 characters

**Naming Conventions:**
- Classes: `PascalCase` (e.g., `CubeTimer`)
- Variables/Functions: `camelCase` (e.g., `startTimer`, `elapsedTime`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `CACHE_NAME`)

**Code Organization:**
- Use ES6+ class syntax
- Group related methods together (timer, UI, data)
- Initialize app at file end: `const timer = new CubeTimer()`

**Error Handling:**
- Use try/catch for async operations
- Log errors to console: `console.error('Error:', error)`

**Async Patterns:**
- Use async/await for promises
- Check for null/undefined before operations

### CSS (styles.css)

**Formatting:**
- Indentation: 2 spaces
- Use CSS custom properties (variables) in `:root`

**Naming:**
- Classes/IDs: `kebab-case` (e.g., `timer-display`, `history-item`)

**Patterns:**
- CSS variables for theming: `--primary`, `--bg`, `--text`
- Mobile-first with `@media` queries at end

### HTML (index.html)

**Formatting:**
- Indentation: 2 spaces
- Double quotes for attributes

**Structure:**
- Semantic HTML5 elements
- Mobile-first viewport settings

## Project-Specific Conventions

**Storage Keys:**
- `cube-timer-solves`: Array of solve objects
- `cube-timer-settings`: User preferences
- Record keys: `cube-timer-single-record`, `cube-timer-ao5-record`, etc.

**DOM References:**
- Cache DOM elements in constructor
- Use `this.elementName` pattern

## PWA Settings

- **Display**: standalone
- **Orientation**: portrait-primary
- **Theme Color**: #e94560 (primary color)
