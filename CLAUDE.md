# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Restaurant Marifah** - Thai restaurant website with AI chatbot, located in Meyrin (Geneva), Switzerland. Bilingual (French/English). No build step - pure HTML/CSS/JS frontend served by Express.

## Commands

```bash
npm install          # Install dependencies (express, cors, nodemailer, better-sqlite3, qrcode)
npm start            # Start Express server on http://localhost:4000
```

There are no tests, linting, or build steps configured.

## Architecture

### Frontend (no framework)
- 4 public HTML pages: `index.html`, `menu.html`, `reservation.html`, `contact.html`
- 4 admin HTML pages: `admin/index.html` (login+dashboard), `admin/menu.html`, `admin/reservations.html`, `admin/vouchers.html`
- CSS in `css/` uses custom properties defined in `variables.css` (design tokens)
- `css/admin.css` - admin panel styles (sidebar layout, tables, modals, toasts, badges)
- JS files are standalone scripts loaded per-page, no bundling

### Backend (Express on port 4000)
- `server/index.js` serves static files from project root and provides API routes
- All non-API, non-admin routes fall back to `index.html` (SPA-style catch-all)
- Config in `server/config.js` - all secrets support env var overrides (DEEPSEEK_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SMTP_USER, SMTP_PASS, ADMIN_PASSWORD, DATABASE_PATH)

### Database (SQLite via better-sqlite3)
- `server/db.js` - initializes SQLite, creates tables, exposes `reservations` and `vouchers` helpers
- Database file: `data/marifah.db` (auto-created on first run, gitignored)
- Two tables: `reservations` (id, name, email, phone, date, time, guests, message, source, status, telegram_sent, email_sent, timestamps) and `vouchers` (id, code, discount_type, discount_value, expiry_date, max_uses, current_uses, is_active, created_at)

### Admin System
- Auth: simple password (`ADMIN_PASSWORD` in config, default `marifah2024`). Login returns password as token. Frontend stores in `sessionStorage`. All admin API calls include `x-admin-token` header.
- `server/middleware/auth.js` - checks `x-admin-token` header
- `js/admin.js` - shared utilities (auth, fetch wrapper, modals, toasts, helpers)
- `js/admin-menu.js`, `js/admin-reservations.js`, `js/admin-vouchers.js` - page-specific UI

### Key Data Flows

**Chatbot (DeepSeek AI):**
- `js/chatbot.js` → `POST /api/chat` → `server/services/deepseek.js`
- Conversation history stored in-memory (`Map` keyed by sessionId, last 10 messages kept)
- System prompt in `deepseek.js` contains full restaurant info, menu, hours, and reservation instructions
- When AI response contains a JSON code block with `{"reservation": {...}}`, the chat route auto-extracts it, sends Telegram + email notifications, and stores in SQLite

**Reservations (two paths):**
1. **Form**: `reservation.html` form → `POST /api/reservation` → Telegram + Email + SQLite
2. **Chatbot**: AI conversationally collects name/date/time/guests/phone → emits reservation JSON → same flow
- Validation: no Sundays (closed), no past dates
- Email via nodemailer SMTP (requires SMTP_USER + SMTP_PASS env vars)
- Admin can view/filter/update status at `/admin/reservations.html`

**Voucher System:**
- Admin creates vouchers at `/admin/vouchers.html` → stored in SQLite
- QR codes generated server-side via `qrcode` library (`GET /api/admin/vouchers/:id/qr`)
- Public validation: `GET /api/vouchers/validate/:code`

**Menu Admin:**
- Admin edits menu at `/admin/menu.html` → CRUD API reads/writes `data/menu.json` directly
- Supports add/edit/delete items and categories, category reordering

**i18n System:**
- HTML elements use `data-i18n="key.name"` attributes
- `js/i18n.js` contains all FR/EN translations, exposes `window.i18n` global
- Language stored in `localStorage('marifah-lang')`, defaults to French
- Dispatches `languageChanged` CustomEvent on `window` - other scripts (e.g., `menu.js`) listen to re-render

**Menu (public):**
- `data/menu.json` contains all 64+ items with bilingual names/descriptions, organized by category
- `js/menu.js` fetches JSON, renders client-side with category filter, tag filter (spicy/vegetarian/popular), and search
- Sidebar scroll-spy highlights active category using IntersectionObserver

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | - | Chatbot message |
| POST | `/api/reservation` | - | New reservation |
| GET | `/api/vouchers/validate/:code` | - | Validate voucher |
| GET | `/api/health` | - | Health check |
| POST | `/api/admin/login` | - | Admin login |
| GET/PUT | `/api/admin/menu` | Admin | Full menu CRUD |
| POST/PUT/DELETE | `/api/admin/menu/items[/:id]` | Admin | Item CRUD |
| POST/PUT/DELETE | `/api/admin/menu/categories[/:id]` | Admin | Category CRUD |
| PUT | `/api/admin/menu/categories/reorder` | Admin | Reorder categories |
| GET | `/api/admin/reservations` | Admin | List/filter reservations |
| PUT | `/api/admin/reservations/:id/status` | Admin | Update status |
| GET/POST | `/api/admin/vouchers` | Admin | List/create vouchers |
| PUT/DELETE | `/api/admin/vouchers/:id` | Admin | Update/delete voucher |
| GET | `/api/admin/vouchers/:id/qr` | Admin | QR code PNG |

### Design System

Colors: green palette primary (`--green-500: #22c55e`), cream background (`--cream: #fefdf8`), gray text (`--gray-800: #1f2937`)

Fonts: Plus Jakarta Sans (body), Cormorant Garamond (headings), Space Grotesk (accents)

Fluid typography via `clamp()` in `css/variables.css`.

## Deployment

Target: Raspberry Pi with PM2 + Nginx reverse proxy. See `PRD.md` for full restaurant details and complete menu.
