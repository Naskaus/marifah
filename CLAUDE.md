# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Restaurant Marifah** - Thai restaurant website with AI chatbot, located in Meyrin (Geneva), Switzerland.

- **Website**: Modern, minimalist design with green tones (inspired by Thai cuisine)
- **Bilingual**: French/English with i18n system
- **Features**: AI chatbot (DeepSeek), reservation system, Telegram notifications

## Tech Stack

### Frontend
- Pure HTML5 / CSS3 / Vanilla JS (no framework - optimized for Raspberry Pi)
- CSS Custom Properties for theming
- Mobile-first responsive design
- GSAP-style animations (CSS only)

### Backend
- Node.js + Express
- DeepSeek API (deepseek-chat model) for AI chatbot
- Telegram Bot API for notifications
- SQLite ready (for future database needs)

## Project Structure

```
marifah/
├── index.html              # Homepage
├── menu.html               # Menu page with filters
├── reservation.html        # Reservation form + chatbot
├── contact.html            # Contact info + map
├── css/
│   ├── variables.css       # Design tokens, colors, fonts
│   ├── main.css            # Main styles
│   ├── animations.css      # Scroll reveal, transitions
│   └── responsive.css      # Mobile breakpoints
├── js/
│   ├── main.js             # Header, mobile menu, scroll
│   ├── i18n.js             # FR/EN translations
│   ├── animations.js       # Parallax, typewriter effects
│   ├── menu.js             # Dynamic menu from JSON
│   └── chatbot.js          # Chat UI + API calls
├── data/
│   └── menu.json           # All 64 menu items (bilingual)
├── assets/
│   ├── images/             # Food photos
│   └── icons/              # Favicon, icons
├── server/
│   ├── index.js            # Express server
│   ├── config.js           # API keys, settings
│   ├── routes/
│   │   ├── chat.js         # POST /api/chat
│   │   └── reservation.js  # POST /api/reservation
│   └── services/
│       ├── deepseek.js     # AI chat with system prompt
│       ├── telegram.js     # Telegram notifications
│       └── email.js        # Email notifications (optional)
└── package.json
```

## Commands

```bash
# Install dependencies
npm install

# Start server (development)
npm start

# Server runs on http://localhost:4000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to AI chatbot |
| POST | `/api/reservation` | Create reservation (sends to Telegram) |
| GET | `/api/health` | Health check |

## Configuration

Edit `server/config.js`:

```js
// Already configured:
DEEPSEEK_API_KEY: 'sk-xxx...',
TELEGRAM_BOT_TOKEN: '828531...',
TELEGRAM_CHAT_ID: '410275983',

// Optional - Email (requires SMTP):
EMAIL: {
  enabled: false,
  smtp: { ... }
}
```

## Deployment (Raspberry Pi)

```bash
# Install PM2 for process management
npm install -g pm2

# Start and persist
pm2 start server/index.js --name marifah
pm2 save
pm2 startup

# With Nginx reverse proxy on port 80
# Configure SSL with Let's Encrypt
```

## Key Features

### AI Chatbot
- Model: DeepSeek V3.2 (deepseek-chat)
- System prompt includes: restaurant info, menu, hours, reservation flow
- Detects reservation intent and extracts: name, date, time, guests, phone
- Sends completed reservations to Telegram automatically

### Reservation System
- Form submission → Telegram notification with WhatsApp link
- Chatbot can also collect reservation info conversationally
- Validates: no Sundays (closed), no past dates

### i18n System
- `data-i18n` attributes on HTML elements
- `js/i18n.js` contains all translations
- Language persists in localStorage

## Design System

### Colors
```css
--green-500: #22c55e;  /* Primary */
--cream: #fefdf8;      /* Background */
--gray-800: #1f2937;   /* Text */
```

### Fonts
- **Plus Jakarta Sans** - Body text (light weights)
- **Cormorant Garamond** - Headings (elegant serif)
- **Space Grotesk** - Accents

## TODO / Future

- [ ] Admin interface for menu editing
- [ ] Voucher/QR code system
- [ ] SQLite database for reservations history
- [ ] Email notifications via nodemailer
- [ ] WhatsApp Business API integration
