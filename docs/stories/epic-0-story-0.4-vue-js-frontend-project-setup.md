# Story 0.4: Vue.js Frontend Project Setup

**Epic**: Epic 0 - Project Initialization  
**Priority**: P0 - Critical  
**Status**: Not Started  
**Estimated Effort**: 6 hours

## Description

Initialize Vue 3 + TypeScript + Tailwind CSS frontend project with Vue Router, Pinia state management, and Axios HTTP client.

## Dependencies

**Blocks**:

- Story 1.2-1.4: Scenario creation UI (needs frontend foundation)
- Story 4.4: Conversation Chat Interface (needs Vue components)
- Story 6.2: User Authentication Frontend (needs router and Pinia)
- All frontend stories

**Requires**:

- Story 0.1: Spring Boot Backend (API endpoints to consume)
- Story 0.5: Docker Configuration (Nginx reverse proxy)

## Acceptance Criteria

- [ ] Vue 3 project initialized with Vite 5+ build tool
- [ ] TypeScript 5+ configured with strict mode enabled
- [ ] Tailwind CSS 3+ integrated with custom design system colors
- [ ] Vue Router 4+ with route guards for authentication
- [ ] Pinia store for global state management (user auth, scenarios, conversations)
- [ ] Axios configured with base URL `http://localhost:8080/api` and JWT interceptor
- [ ] ESLint + Prettier configured for code quality
- [ ] Vitest framework setup for component testing
- [ ] Project structure: `/src/components/`, `/src/views/`, `/src/stores/`, `/src/router/`, `/src/types/`
- [ ] Development server runs on port 5173
- [ ] Environment variables loaded from `.env` file

## Technical Notes

**Project Structure**:

```
frontend/
├── src/
│   ├── components/
│   │   └── common/         # Reusable UI components
│   ├── views/
│   │   ├── HomeView.vue    # Landing page
│   │   ├── ChatView.vue    # Conversation interface
│   │   └── ScenarioView.vue
│   ├── stores/
│   │   ├── auth.ts         # Pinia auth store
│   │   └── conversation.ts # Conversation state
│   ├── router/
│   │   └── index.ts        # Route definitions
│   ├── types/
│   │   └── api.ts          # TypeScript interfaces
│   ├── services/
│   │   └── api.ts          # Axios instance
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

**Axios Interceptor** (JWT Authentication):

```typescript
// src/services/api.ts
import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      await authStore.refreshToken();
    }
    return Promise.reject(error);
  }
);

export default api;
```

## QA Checklist

### Functional Testing

- [ ] Development server starts on port 5173
- [ ] Vue Router navigates between views
- [ ] Pinia stores persist state across page refreshes
- [ ] Axios interceptor adds Authorization header
- [ ] 401 response triggers token refresh automatically
- [ ] Environment variables loaded from .env

### Build Configuration

- [ ] TypeScript compilation with zero errors
- [ ] Tailwind CSS classes apply correctly
- [ ] Production build generates optimized assets
- [ ] Build output size < 500KB (gzipped)
- [ ] Hot module replacement (HMR) works in dev mode

### Code Quality

- [ ] ESLint rules enforced (no unused variables, proper types)
- [ ] Prettier formats code automatically
- [ ] TypeScript strict mode catches type errors
- [ ] Vitest unit tests pass with >80% coverage requirement

### Design System

- [ ] Tailwind config includes custom colors from design guide
- [ ] Responsive breakpoints configured: sm, md, lg, xl
- [ ] Custom utility classes for common patterns

### Security

- [ ] API base URL from environment variable (not hardcoded)
- [ ] JWT token stored in memory (not localStorage)
- [ ] CSRF protection configured

## Estimated Effort

6 hours
