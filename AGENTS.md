# AGENTS.md

## Project Overview

THINGY is a browser-based AI chat application with GitHub Gist sync. Built with vanilla JavaScript/HTML/CSS, it uses GitHub Models API (via GitHub token) for AI responses and syncs conversations across devices via GitHub Gists.

**Key Features:**
- Multiple conversation threads
- Real-time streaming AI responses
- Markdown rendering for messages
- GitHub Gist sync (10s auto-sync)
- Offline-first with localStorage
- PWA support with service worker

## Architecture

```
┌─────────────────────────────────────┐
│  ChatApp (main controller)          │
├─────────────────────────────────────┤
│  GitHubProvider (API wrapper)       │
├─────────────────────────────────────┤
│  localStorage (offline cache)       │
│  GitHub Gist (cloud sync)           │
└─────────────────────────────────────┘
```

**Data Model:**
- `conversations`: Array of `{id, title, messages[], createdAt, updatedAt}`
- `messages`: Array of `{id, role, content, timestamp}`
- Stored in localStorage as `thingy-conversations`
- Synced to Gist as `conversations.json`

## Build / Lint / Test Commands

This is a vanilla JavaScript/HTML/CSS project with no build system configured.

- **No build step required** - Files are served statically
- **No linting configured** - Consider adding ESLint for JS
- **No tests configured** - Consider adding a test framework like Jest or Vitest
- **Serve locally**: Use `npx serve` or `python -m http.server` or VS Code Live Server

To run a local server:
```bash
npx serve
# or
python -m http.server 8080
```

## Code Style Guidelines

### JavaScript (app.js, service-worker.js)

**Formatting:**
- Indentation: 2 spaces
- Prefer single quotes for strings
- No trailing semicolons required
- Max line length: ~100 characters

**Naming Conventions:**
- Classes: `PascalCase` (e.g., `ChatApp`, `GitHubProvider`)
- Variables/Functions: `camelCase` (e.g., `currentConversationId`, `sendMessage`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `CACHE_NAME`)
- Private methods: prefix with `_` (not currently used)

**Code Organization:**
- Use ES6+ class syntax for app architecture
- Group related methods together (UI, sync, data)
- Initialize app at file end: `const app = new ChatApp()`
- Provider pattern for LLM APIs (allows easy provider swapping)

**Error Handling:**
- Use try/catch for async operations
- Log errors to console: `console.error('Message:', error)`
- Provide user feedback for failures (e.g., sync status, generation errors)

**Async Patterns:**
- Use async/await for promises
- Use async generators for streaming: `async* streamChat()`
- Check for null/undefined before operations
- Handle API failures gracefully

### CSS (styles.css)

**Formatting:**
- Indentation: 2 spaces
- Use CSS custom properties (variables) in `:root`
- Group related properties together

**Naming:**
- Classes/IDs: `kebab-case` (e.g., `message`, `conversation-item`)
- Use semantic class names that describe function, not appearance

**Patterns:**
- CSS variables for theming: `--primary`, `--bg`, `--text`
- Use `var(--variable)` for consistency
- Mobile-first with `@media` queries at end
- Animation keyframes grouped near related styles

### HTML (index.html)

**Formatting:**
- Indentation: 4 spaces (different from JS/CSS)
- Double quotes for attributes
- Semantic HTML5 elements

**Naming:**
- IDs: `camelCase` matching JS variables
- Classes: `kebab-case` matching CSS

**Structure:**
- Keep DOM structure flat where possible
- Use `data-*` attributes for JS state (e.g., `data-id`)
- Include ARIA labels for accessibility

### Project-Specific Conventions

**Storage Keys:**
- All localStorage keys prefixed with `thingy-`
- Examples: `thingy-conversations`, `thingy-github-token`, `thingy-gist-id`

**DOM References:**
- Cache DOM elements in constructor
- Use `this.elementName` pattern consistently
- Query selectors at top of class

**Event Handling:**
- Use arrow functions to preserve `this` context
- Add listeners in `init()` method
- Use event delegation for dynamic elements

**GitHub Sync:**
- Handle offline state gracefully
- Merge strategy: keep newer data (based on gist.updated_at)
- Rate limit awareness (10s sync interval)

**GitHub Limitations:**
- **Gist file size limit**: 100MB per file (API), 25MB per file (web interface) - conversations.json will fail to sync if > 100MB
- **GitHub Pages limit**: 1GB total site size, 100MB soft limit per file
- Consider implementing data cleanup/archiving if approaching limits
- Monitor localStorage usage (typically 5-10MB browser limit)

**GitHub Models API:**
- Endpoint: `https://models.github.ai/inference/chat/completions`
- Model: `gpt-4o` (configurable)
- Streaming supported via Server-Sent Events
- Requires GitHub personal access token

## Security Notes

- Never commit GitHub tokens
- Tokens stored in localStorage (not ideal for production)
- Use `escapeHtml()` to prevent XSS when rendering user content
- All AI responses are rendered as HTML (with markdown parsing)

## Adding New LLM Providers

To add a new provider (OpenAI, Anthropic, etc.):

1. Create a new provider class implementing the same interface as `GitHubProvider`
2. Implement `async* streamChat(messages)` method
3. Update `ChatApp` to instantiate the correct provider based on user selection
4. Add provider-specific UI in settings menu

Example provider interface:
```javascript
class ProviderName {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = '...'
    this.model = '...'
  }
  
  async* streamChat(messages) {
    // Yield text chunks as they arrive
    yield 'Hello'
    yield ' World'
  }
}
```
