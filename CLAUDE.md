# CLAUDE.md

## Project Overview

**Creative Importer Pro** is a client-side React 19 application for uploading and managing advertising creatives on Meta Ads (Facebook & Instagram). It provides a multi-step wizard for campaign configuration, automatic creative format detection, and JSON export.

There is no backend — all API calls go directly to the Meta Graph API v21.0 from the browser.

## Tech Stack

- **Framework**: React 19 (Create React App with react-scripts 5)
- **Language**: JavaScript (ES6+), no TypeScript in source despite dev dependency
- **State Management**: React Hooks only (useState, useEffect, useMemo, useCallback)
- **Styling**: Inline styles via JS objects (styles.css is nearly empty)
- **External API**: Meta Graph API v21.0 (OAuth 2.0, ad accounts, pages, campaigns)

## Repository Structure

```
src/
  index.js        # React entry point (StrictMode)
  App.js          # ALL application logic (~2,400 lines, single monolithic component)
  styles.css      # Minimal CSS (mostly unused)
public/
  index.html      # HTML template
```

Key point: **all logic lives in `src/App.js`** — there is no component decomposition. When making changes, this is the only source file you typically need to edit.

## Commands

```bash
npm start          # Dev server at http://localhost:3000
npm run build      # Production build to build/
npm test           # Run tests (jsdom)
```

No custom lint script is defined. ESLint is configured with `@typescript-eslint/parser` in `.eslintrc.json`.

## Architecture & Key Patterns

### Single-File Component
All UI, state, API calls, and business logic are in `src/App.js`. The component uses a step-based wizard (steps 0–4) controlled by state.

### Meta API Integration
```javascript
const createMetaApi = (accessToken) => ({
  baseUrl: `https://graph.facebook.com/${META_APP.apiVersion}`,
  async fetchUser() { ... },
  async fetchAdAccounts() { ... },
  // ... more methods
})
```
API calls are organized in a factory function that returns an object of async methods.

### Configuration Constants (top of App.js)
- `META_APP` — App ID, API version, redirect URI
- `GEO_ZONES` — Predefined country targeting sets (France, Belgium, Switzerland, Canada, USA, UK, Germany)
- `OBJECTIVES` — Campaign objectives (conversions, lead_form, lead_site)
- `META_PLACEMENTS` — Ad format specifications (story, feed_square, feed_portrait, feed_landscape)
- `CTA_OPTIONS` — Call-to-action button options

### Authentication Flow
OAuth 2.0 implicit grant via Facebook. Token stored in `localStorage` with expiration tracking. Token validity is checked on app load.

### Campaign Structures
- **CBO** (Campaign Budget Optimization): new campaign, add adsets to existing, add ads to existing adset
- **ABO** (Adset Budget Optimization): 1:1:1 (one campaign per creative) or multi (one campaign, multiple adsets)

### Media Processing
Files are analyzed for dimensions via async Promise-based detection. Aspect ratios map to format types:
- 9:16 → Stories
- 1:1 → Feed Square
- 4:5 → Feed Portrait
- 16:9 → Feed Landscape

## Development Conventions

- All state is managed with React hooks at the top of the App component (~30+ useState calls)
- UI styling is done with inline JS style objects — do not add CSS classes/modules
- No external routing library — navigation is step-based via state
- No Redux/Context API — keep state local to App component
- When adding features, add them within the existing App.js structure unless explicitly asked to refactor

## Security Notes

- OAuth tokens are stored in `localStorage` (client-side only)
- No secrets or API keys should be committed — the Facebook App ID is public-facing
- The `.gitignore` only excludes `node_modules` — be careful not to commit `.env` files or credentials

## Deployment

- Configured for Vercel deployment
- OAuth redirect URIs support both `localhost:3000` and production URLs
- Browser targets: `>0.2%`, no IE 11, no Opera Mini
