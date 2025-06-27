# 🚀 ReplyIQ - Complete SaaS Platform

> **ReplyIQ is an intelligent SaaS platform that empowers users to create engaging, contextually-appropriate responses for social media platforms using advanced AI technology. Designed for social media managers, content creators, and businesses, ReplyIQ streamlines social media engagement across multiple platforms.**

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-2596BE?logo=trpc&logoColor=white)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [🌐 Browser Extension](#-browser-extension)
- [📊 Tech Stack](#-tech-stack)
- [🛠️ Development](#️-development)
- [📚 API Documentation](#-api-documentation)
- [🔒 Security](#-security)
- [📈 Analytics](#-analytics)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

### 🎯 Core Features
- **AI-Powered Reply Generation** - Generate contextual replies using advanced AI models
- **Multi-Platform Support** - Twitter/X, LinkedIn, Facebook integration
- **Smart Emoji Suggestions** - Context-aware emoji recommendations
- **Tone Customization** - Multiple tone options (professional, casual, friendly, etc.)
- **Real-time Analytics** - Track engagement and usage statistics

### 🔧 SaaS Platform
- **User Authentication** - Secure auth with social providers
- **Subscription Management** - Tiered pricing with Stripe/PayPal integration
- **Usage Tracking** - Monitor API usage and billing
- **Admin Dashboard** - Comprehensive management interface

### 🌐 Browser Extension
- **Cross-Browser Support** - Chrome, Firefox, Edge compatibility
- **Seamless Integration** - Works directly on social media platforms
- **Enhanced Error Handling** - Comprehensive retry logic and user feedback
- **Theme Support** - Automatic dark/light mode detection
- **Performance Optimized** - Debounced operations and smart caching

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A["Next.js Web App"] --> B["tRPC Client"]
        C["Browser Extension"] --> D["Extension Background Script"]
    end
    
    subgraph "Backend"
        B --> E["tRPC API Routes"]
        D --> E
        E --> F["Database - Drizzle ORM"]
        E --> G["AI Services"]
        E --> H["Payment Providers"]
    end
    
    subgraph "External Services"
        G --> I["OpenAI/Claude"]
        H --> J["Stripe"]
        H --> K["PayPal"]
        L["Social Platforms"] --> C
    end
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun 1.0+
- PostgreSQL database
- API keys for AI services
- Stripe/PayPal accounts (for payments)

### 1. Clone the Repository
```bash
git clone https://github.com/WaitListNow/ai-social-replier.git
cd ai-social-replier
```

### 2. Install Dependencies
```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Environment Setup
```bash
# Copy environment file
cp .env.example .env.local

# Edit with your configuration
nano .env.local
```

### 4. Database Setup
```bash
# Run database migrations
bun run db:migrate

# Seed database (optional)
bun run db:seed
```

### 5. Start Development Server
```bash
# Start the web application
bun run dev

# In another terminal, start the extension development
cd extension-v6.0.0
bun run dev
```

## 📦 Installation

### Web Application

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Set up the database:**
   ```bash
   bun run db:migrate
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   ```

### Browser Extension

1. **Navigate to extension directory:**
   ```bash
   cd extension-v6.0.0
   ```

2. **Install extension dependencies:**
   ```bash
   bun install
   ```

3. **Build the extension:**
   ```bash
   # For Chrome
   bun run build:chrome
   
   # For Firefox
   bun run build:firefox
   
   # For Edge
   bun run build:edge
   
   # For all browsers
   bun run build:all
   ```

4. **Load in browser:**
   - Chrome: Load unpacked extension from `.output/chrome-mv3`
   - Firefox: Load temporary add-on from `.output/firefox-mv2`
   - Edge: Load unpacked extension from `.output/edge-mv3`

## 🔧 Configuration

### Environment Variables

#### Web Application (.env.local)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/replier"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI Services
OPENAI_API_KEY="your-openai-key"
CLAUDE_API_KEY="your-claude-key"

# Payment Providers
STRIPE_SECRET_KEY="your-stripe-secret"
PAYPAL_CLIENT_ID="your-paypal-client-id"

# Email
RESEND_API_KEY="your-resend-key"
```

#### Extension (.env)
```env
WXT_SITE_URL="http://localhost:3000"
```

### AI Model Configuration

Configure AI models in the admin dashboard:
- **OpenAI GPT-4** - Primary model for reply generation
- **Claude 3** - Alternative model option
- **Custom Models** - Support for custom API endpoints

## 🌐 Browser Extension

The browser extension provides seamless integration with social media platforms:

### Features
- **Smart Reply Generation** - AI-powered contextual replies with retry logic
- **Emoji Suggestions** - Context-aware emoji recommendations with keyboard navigation
- **Tone Selection** - Multiple tone options with visual feedback for last used tone
- **Real-time Sync** - Syncs with your web dashboard
- **Keyboard Shortcuts** - Quick access with Ctrl+Shift+R
- **Enhanced UX** - Loading states, error handling, and accessibility features

### Supported Platforms
- **Twitter/X** - Full reply and post generation
- **LinkedIn** - Professional content generation
- **Facebook** - Social engagement optimization

### Installation Guide
1. Download from [Chrome Web Store](https://chrome.google.com/webstore) or [Firefox Add-ons](https://addons.mozilla.org/)
2. Sign in with your account
3. Start generating AI-powered replies!

### Recent Improvements (v6.0.0)
- **Enhanced Error Handling** - Comprehensive retry logic with exponential backoff
- **Improved Performance** - Debounced operations and optimized rendering
- **Better UX** - Visual feedback, loading states, and accessibility improvements
- **Code Quality** - Restructured codebase with better organization and type safety
- **Cross-browser Optimization** - Enhanced support for Chrome, Firefox, and Edge

## 📊 Tech Stack

### Frontend
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand + tRPC
- **Type Safety:** TypeScript with strict mode
- **Authentication:** NextAuth.js

### Backend
- **API:** tRPC with type-safe endpoints
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** NextAuth.js with multiple providers
- **Payments:** Stripe & PayPal integration
- **Email:** Resend for transactional emails

### Browser Extension
- **Framework:** WXT with React
- **Build Tool:** Vite with TypeScript
- **Communication:** tRPC over Chrome runtime messaging with auto-reconnection
- **Styling:** Tailwind CSS with theme support and CSP compliance
- **Quality:** ESLint with Perfectionist plugin for code organization

### Infrastructure
- **Deployment:** Vercel (web) + Chrome Web Store/Firefox Add-ons
- **Database:** Supabase PostgreSQL
- **Monitoring:** Built-in analytics dashboard
- **CI/CD:** GitHub Actions

## 🛠️ Development

### Project Structure
```
├── src/                          # Web application source
│   ├── app/                      # Next.js app router
│   ├── components/               # Reusable UI components
│   ├── server/                   # Backend API and database
│   └── utils/                    # Shared utilities
├── extension-v6.0.0/             # Browser extension
│   ├── src/                      # Extension source code
│   ├── entrypoints/              # Extension entry points
│   └── components/               # Extension UI components
├── public/                       # Static assets
└── docs/                         # Documentation
```

### Available Scripts

#### Web Application
```bash
# Development
bun run dev                # Start development server
bun run build             # Build for production
bun run start             # Start production server

# Database
bun run db:generate       # Generate migrations
bun run db:migrate        # Run migrations
bun run db:seed           # Seed database

# Quality
bun run lint              # ESLint check
bun run type-check        # TypeScript check
bun run test              # Run tests
```

#### Browser Extension
```bash
# Development
bun run dev               # Start development mode
bun run build             # Build for production
bun run build:all         # Build for all browsers

# Quality
bun run typecheck         # TypeScript check
bun run lint              # ESLint check
bun run test:build        # Test build process
```

### Development Workflow

1. **Start development servers:**
   ```bash
   # Terminal 1: Web application
   bun run dev
   
   # Terminal 2: Extension
   cd extension-v6.0.0 && bun run dev
   ```

2. **Make changes and test:**
   - Web app auto-reloads at `http://localhost:3000`
   - Extension auto-reloads in browser

3. **Run quality checks:**
   ```bash
   bun run lint && bun run type-check
   ```

## 📚 API Documentation

### Authentication
All API endpoints require authentication via NextAuth.js:

```typescript
// Example API call
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: "Original post content",
    tone: "professional",
    platform: "linkedin"
  })
})
```

### Key Endpoints

#### AI Generation
- `POST /api/ai` - Generate AI replies
- `POST /api/ai/emojis` - Get emoji suggestions
- `POST /api/ai/hashtags` - Generate hashtags

#### Usage & Analytics
- `POST /api/usage` - Track usage statistics
- `GET /api/analytics` - Get analytics data

#### Payment Integration
- `POST /api/checkout/stripe` - Create Stripe checkout
- `POST /api/checkout/paypal` - Create PayPal payment

### tRPC Procedures

The application uses tRPC for type-safe API communication:

```typescript
// Client usage
const result = await trpc.generate.mutate({
  text: "Hello world",
  tone: "casual",
  platform: "twitter"
})
```

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens** - Secure session management
- **Role-based Access** - Admin, user, and team roles
- **OAuth Integration** - Google, GitHub, Discord providers
- **Session Security** - Automatic token refresh and validation

### Data Protection
- **Input Validation** - Zod schema validation on all inputs
- **SQL Injection Prevention** - Parameterized queries with Drizzle ORM
- **XSS Protection** - Content Security Policy headers
- **Rate Limiting** - API rate limiting per user/IP

### Privacy
- **Data Encryption** - All sensitive data encrypted at rest
- **GDPR Compliance** - User data export and deletion
- **Audit Logging** - Comprehensive action logging
- **Privacy Controls** - Granular privacy settings

## 📈 Analytics

### Usage Tracking
- **API Calls** - Track all AI generation requests
- **User Engagement** - Monitor feature usage patterns
- **Performance Metrics** - Response times and error rates
- **Conversion Tracking** - Subscription and upgrade analytics

### Dashboard Features
- **Real-time Metrics** - Live usage and performance data
- **Custom Reports** - Generate detailed analytics reports
- **Export Data** - CSV/JSON export for external analysis
- **Alerts** - Automated notifications for anomalies

## 🤝 Contributing

We welcome contributions! By contributing, you agree to license your contributions under the CC BY-NC-SA 4.0 license. Please follow these steps:

### 1. Fork the Repository
```bash
git clone https://github.com/your-username/ai-social-replier.git
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Run Quality Checks
```bash
bun run lint
bun run type-check
bun run test
```

### 5. Submit a Pull Request
- Provide a clear description of changes
- Include screenshots for UI changes
- Reference any related issues

### Development Guidelines
- **Code Style:** ESLint + Prettier configuration
- **Commits:** Conventional commit messages
- **Testing:** Write tests for new features
- **Documentation:** Update README and inline docs

## 📄 License

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### What this means:

✅ **You CAN:**
- View, download, and study the source code
- Contribute improvements via pull requests
- Fork for personal, educational, or research purposes
- Share and redistribute under the same license terms
- Modify the code for non-commercial purposes

❌ **You CANNOT:**
- Use this software for commercial purposes
- Sell this software or modified versions
- Use this software in commercial products or services
- Remove or modify license notices
- Distribute without providing source code and maintaining the same license

### Contributing
By contributing to this project, you agree that your contributions will be licensed under the same CC BY-NC-SA 4.0 license.

### Commercial Use
If you're interested in commercial licensing, please contact us at [contact@example.com](mailto:contact@example.com) to discuss commercial licensing options.

**Attribution Required:** If you use or redistribute this work, you must provide appropriate credit and indicate if changes were made.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=WaitListNow/ai-social-replier&type=Date)](https://star-history.com/#WaitListNow/ai-social-replier&Date)

## 🎉 Acknowledgments

- **OpenAI** - For powerful AI models
- **Vercel** - For seamless deployment
- **shadcn/ui** - For beautiful UI components
- **tRPC** - For type-safe API development

---

<div align="center">
  <strong>Built with ❤️ by WaitListNow</strong>
</div> 