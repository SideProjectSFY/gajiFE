# Gaji Frontend

Vue 3 + TypeScript + Vite frontend for the Gaji AI scenario conversation platform.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Pinia** - State management
- **Vue Router** - Routing
- **PandaCSS** - Zero-runtime CSS-in-JS
- **PrimeVue** - UI component library
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Generate PandaCSS files:

```bash
pnpm prepare
```

3. Start development server:

```bash
pnpm dev
```

The app will be available at http://localhost:3000

## Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable components
│   ├── common/      # Generic components
│   ├── scenario/    # Scenario-related
│   ├── conversation/# Conversation-related
│   └── user/        # User-related
├── views/           # Page components
├── router/          # Route definitions
├── stores/          # Pinia stores
├── services/
│   └── api.ts       # Axios instance (Spring Boot only)
├── types/           # TypeScript types
├── utils/           # Utility functions
└── styles/          # Global styles
```

## Available Scripts

- `pnpm dev` - Start development server (port 3000)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm prepare` - Generate PandaCSS files
- `pnpm lint` - Lint and fix files
- `pnpm format` - Format code with Prettier

## Environment Variables

Create `.env.development` and `.env.production` files:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Routes

### Public Routes

- `/` - Home/landing page
- `/login` - Login
- `/register` - Registration
- `/scenarios` - Browse scenarios

### Protected Routes (require authentication)

- `/scenarios/create` - Scenario creation
- `/conversations/:id` - Conversation chat
- `/profile` - User profile

## API Integration

The frontend communicates exclusively with the Spring Boot backend at `/api/v1/*`. All AI requests are proxied through Spring Boot for security.

## Development

### Adding a New Page

1. Create a Vue component in `src/views/`
2. Add route in `src/router/index.ts`
3. Add navigation links as needed

### State Management

Use Pinia stores in `src/stores/`:

- `useAuthStore` - Authentication state
- `useUserStore` - User profile data
- `useScenarioStore` - Scenario browsing/creation
- `useConversationStore` - Conversation management

### Styling with PandaCSS

```vue
<script setup lang="ts">
import { css } from '../styled-system/css'

const buttonStyle = css({
  padding: '0.75rem',
  backgroundColor: 'primary.600',
  color: 'white',
  borderRadius: 'md',
})
</script>

<template>
  <button :class="buttonStyle">Click me</button>
</template>
```

## License

MIT
