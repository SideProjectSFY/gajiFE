# UI/UX Specifications - Gaji Interactive Fiction Platform

**Version**: 1.0  
**Last Updated**: 2025-01-13  
**Design System**: PrimeVue 3.x + PandaCSS  
**Target Frameworks**: Vue.js 3.x, Vite 5.x

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [User Personas](#user-personas)
3. [User Journey Maps](#user-journey-maps)
4. [Design System](#design-system)
5. [Component Library](#component-library)
6. [Screen Specifications](#screen-specifications)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Interaction Patterns](#interaction-patterns)
10. [Visual Design](#visual-design)

---

## Design Philosophy

### Core Principles

1. **Exploration-First**: Encourage users to explore scenarios and conversations through visual discovery
2. **Mobile-First**: Design for mobile experience, enhance for desktop
3. **Progressive Disclosure**: Show essential information first, reveal complexity on demand
4. **Feedback-Rich**: Provide immediate visual feedback for all user actions
5. **Content-Focused**: Minimize chrome, maximize content visibility

### Design Goals

- **Intuitive Scenario Creation**: Users should create "What If" scenarios in < 60 seconds
- **Engaging Conversations**: Chat interface feels natural and responsive
- **Discoverable Forks**: Tree visualizations make scenario relationships obvious
- **Social First**: Following, liking, and sharing feel native

---

## User Personas

### Persona 1: The Creative Explorer (Primary)

**Name**: Sarah, 28, Marketing Manager  
**Goals**:

- Explore alternate storylines in favorite novels
- Create unique scenarios and share with friends
- Discover creative interpretations from community

**Pain Points**:

- Overwhelmed by too many options
- Uncertain how to start creating scenarios
- Wants inspiration from others' work

**Design Needs**:

- Guided scenario creation wizard
- Featured scenarios on homepage
- Simple fork/like interactions
- Social feed of followed users

---

### Persona 2: The Deep Diver (Secondary)

**Name**: Alex, 34, Software Developer  
**Goals**:

- Create complex meta-scenarios (scenarios of scenarios)
- Engage in long philosophical conversations with AI characters
- Explore scenario tree structures

**Pain Points**:

- Needs advanced filtering and search
- Wants to track conversation branches
- Requires memo system for notes

**Design Needs**:

- Advanced search/filter UI
- Conversation tree visualization
- Memo sidebar in conversations
- Keyboard shortcuts

---

### Persona 3: The Casual Reader (Tertiary)

**Name**: Michael, 22, University Student  
**Goals**:

- Quick entertainment during breaks
- Read interesting scenarios created by others
- Occasionally try conversations

**Pain Points**:

- Doesn't want to create account immediately
- Short attention span
- Prefers browsing to creating

**Design Needs**:

- Browse scenarios without login
- One-click scenario preview
- Guest conversation mode (future)
- Minimal onboarding friction

---

## User Journey Maps

### Journey 1: Create First Scenario

**User Goal**: Create "Hermione in Slytherin" scenario

| Step | User Action             | Screen                 | UI Elements                      | Emotions     |
| ---- | ----------------------- | ---------------------- | -------------------------------- | ------------ |
| 1    | Land on homepage        | Homepage               | Hero section, featured scenarios | Curious      |
| 2    | Click "Create Scenario" | -                      | CTA button                       | Interested   |
| 3    | Select novel            | Scenario Wizard Step 1 | Novel search/autocomplete        | Engaged      |
| 4    | Choose scenario type    | Scenario Wizard Step 2 | Radio cards with icons           | Confident    |
| 5    | Fill parameters         | Scenario Wizard Step 3 | Form with guided inputs          | Creative     |
| 6    | Preview scenario        | Scenario Wizard Step 4 | Preview card                     | Excited      |
| 7    | Publish                 | -                      | Submit button                    | Accomplished |
| 8    | View created scenario   | Scenario Detail        | Full scenario page               | Proud        |

**Success Metrics**:

- Completion rate > 70%
- Time to create < 2 minutes
- Abandonment rate < 20% (Step 3)

---

### Journey 2: Explore & Fork Conversation

**User Goal**: Find interesting conversation, create fork with own twist

| Step | User Action           | Screen                     | UI Elements                           | Emotions  |
| ---- | --------------------- | -------------------------- | ------------------------------------- | --------- |
| 1    | Browse scenarios      | Browse Page                | Card grid, filters                    | Browsing  |
| 2    | Click scenario        | Scenario Detail            | Hero, conversations list              | Intrigued |
| 3    | Read top conversation | Conversation Detail        | Message thread                        | Engaged   |
| 4    | Click "Fork"          | -                          | Fork button (header)                  | Inspired  |
| 5    | Enter fork title      | Fork Modal                 | Title input, message preview          | Creative  |
| 6    | Confirm fork          | -                          | Submit button                         | Confident |
| 7    | Redirect to fork      | Conversation Detail (Fork) | New conversation with copied messages | Excited   |
| 8    | Send first message    | -                          | Message input, AI response            | Satisfied |

**Success Metrics**:

- Fork rate per conversation > 5%
- Time to fork < 30 seconds
- Follow-up message rate after fork > 80%

---

### Journey 3: Discovery Through Social

**User Goal**: Find scenarios from favorite creators

| Step | User Action             | Screen                | UI Elements              | Emotions  |
| ---- | ----------------------- | --------------------- | ------------------------ | --------- |
| 1    | Click user profile      | User Profile          | Avatar, bio, stats       | Curious   |
| 2    | View scenarios tab      | Profile Scenarios Tab | Scenario cards           | Browsing  |
| 3    | Follow user             | -                     | Follow button            | Connected |
| 4    | Return to feed          | Homepage/Feed         | Followed users' activity | Satisfied |
| 5    | Like scenario from feed | -                     | Like button on card      | Engaged   |
| 6    | Browse liked scenarios  | Profile > Liked Tab   | Saved scenarios          | Organized |

**Success Metrics**:

- Follow conversion > 15% from profile visits
- Like rate > 25% from feed
- Return rate for feed > 60% daily active users

---

## Design System

### Color Palette (PandaCSS Tokens)

```typescript
// Primary Brand Colors
colors: {
  brand: {
    50: '#e8f5f0',   // Lightest green
    100: '#c1e6d9',
    200: '#9ad7c2',
    300: '#73c8ab',
    400: '#4cb994',
    500: '#1F7D51',  // Primary brand color (forest green)
    600: '#1a6a45',
    700: '#155739',
    800: '#10442d',
    900: '#0b3121',  // Darkest green
  },

  // Secondary/Accent Colors
  accent: {
    50: '#fef9e7',   // Lightest gold
    100: '#fcf0c2',
    200: '#fae79d',
    300: '#f8de78',
    400: '#f6d553',
    500: '#DEAD5C',  // Secondary brand color (gold)
    600: '#c8924d',
    700: '#a3783e',
    800: '#7e5d2f',
    900: '#594220',  // Darkest gold
  },

  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic Colors
  success: {
    500: '#10b981',  // Green
    600: '#059669',
  },
  error: {
    500: '#ef4444',  // Red
    600: '#dc2626',
  },
  warning: {
    500: '#f59e0b',  // Amber
    600: '#d97706',
  },
  info: {
    500: '#3b82f6',  // Blue
    600: '#2563eb',
  },
}
```

### Typography

```typescript
fonts: {
  heading: '"Inter", "Helvetica Neue", Arial, sans-serif',
  body: '"Inter", "Helvetica Neue", Arial, sans-serif',
  mono: '"Fira Code", "Monaco", "Courier New", monospace',
}

fontSizes: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
}

fontWeights: {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}
```

### Spacing Scale

```typescript
spacing: {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
}
```

### Breakpoints (Mobile-First)

```typescript
breakpoints: {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

### Border Radius

```typescript
radii: {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',   // Circular
}
```

### Shadows

```typescript
shadows: {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
}
```

---

## Component Library

### PrimeVue Components Used

#### Layout Components

- **Card** (`p-card`): Scenario cards, conversation cards
- **Panel** (`p-panel`): Collapsible sections
- **Divider** (`p-divider`): Content separation
- **ScrollPanel** (`p-scroll-panel`): Message list, tree view

#### Navigation

- **Menubar** (`p-menubar`): Main navigation
- **TabView** (`p-tab-view`): Profile tabs, scenario tabs
- **Breadcrumb** (`p-breadcrumb`): Nested navigation

#### Form Components

- **InputText** (`p-input-text`): Text inputs
- **Textarea** (`p-textarea`): Long text (descriptions, messages)
- **Dropdown** (`p-dropdown`): Select dropdowns
- **AutoComplete** (`p-auto-complete`): Novel search
- **RadioButton** (`p-radio-button`): Scenario type selection
- **Checkbox** (`p-checkbox`): Filter options
- **Button** (`p-button`): All CTAs

#### Data Display

- **DataView** (`p-data-view`): Scenario grid/list view
- **Paginator** (`p-paginator`): Pagination
- **Tag** (`p-tag`): Tags, badges
- **Avatar** (`p-avatar`): User avatars
- **Tree** (`p-tree`): Scenario tree, conversation tree

#### Overlay

- **Dialog** (`p-dialog`): Modals (fork, delete confirm)
- **OverlayPanel** (`p-overlay-panel`): Dropdowns, tooltips
- **Toast** (`p-toast`): Notifications
- **ConfirmDialog** (`p-confirm-dialog`): Confirmations

#### Misc

- **Skeleton** (`p-skeleton`): Loading states
- **ProgressSpinner** (`p-progress-spinner`): Async operations
- **FileUpload** (`p-file-upload`): Avatar upload

---

## Screen Specifications

### 1. Homepage / Landing

**Purpose**: Welcome users, showcase platform, drive sign-ups

**Layout** (Mobile-First):

```
┌─────────────────────────────────┐
│ [Logo]         [Login] [SignUp] │ ← Header (sticky)
├─────────────────────────────────┤
│                                 │
│  📖 Explore Infinite            │ ← Hero Section
│     Story Possibilities         │
│                                 │
│  [Create Scenario] [Browse]     │ ← CTAs
│                                 │
├─────────────────────────────────┤
│ ⭐ Featured Scenarios            │ ← Featured Grid
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │ Card  │ │ Card  │ │ Card  │  │ (Horizontal scroll on mobile)
│ └───────┘ └───────┘ └───────┘  │
│                                 │
├─────────────────────────────────┤
│ 🔥 Trending Conversations        │ ← Trending List
│                                 │
│ 1. Hermione in Slytherin...     │
│ 2. Gatsby's California Dream... │
│ 3. Pride & Prejudice Reversed...│
│                                 │
└─────────────────────────────────┘
```

**Desktop Enhancements**:

- Hero section full-width with background illustration
- Featured scenarios: 3-column grid (instead of scroll)
- Trending conversations: 2-column layout with preview

**Components**:

- Header: Custom navigation bar
- Hero: Custom hero component with gradient background
- Featured: `DataView` with `grid` layout
- Trending: `DataView` with `list` layout

---

### 2. Scenario Browse Page

**Purpose**: Discover scenarios through filtering and search

**Layout** (Mobile):

```
┌─────────────────────────────────┐
│ [Search: "hermione slytherin"] │ ← Search Bar
│ [Filters ▼]                    │ ← Filter Toggle
├─────────────────────────────────┤
│ Showing 23 results              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📘 HP: Hermione in Slytherin│ │ ← Scenario Card
│ │ By: @hermione_fan           │ │
│ │ ⭐ 0.85 | 💬 12 | 🍴 5      │ │ (Quality, Convos, Forks)
│ │ "What if Hermione was       │ │
│ │  sorted into..."            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📘 HP: Draco Redeemed       │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Load More]                     │
└─────────────────────────────────┘
```

**Filter Panel** (Expandable):

```
┌─────────────────────────────────┐
│ 📂 Filters                       │
│                                 │
│ 📚 Novel:                       │
│ ☐ Harry Potter (23)             │
│ ☐ Pride and Prejudice (5)       │
│ ☐ The Great Gatsby (12)         │
│                                 │
│ 🎭 Scenario Type:               │
│ ⚪ All                          │
│ ⚫ Character Change             │
│ ⚪ Event Alteration             │
│ ⚪ Setting Modification         │
│                                 │
│ ⭐ Min Quality:                 │
│ [────────●──] 0.7               │ (Slider)
│                                 │
│ [Apply] [Reset]                 │
└─────────────────────────────────┘
```

**Desktop Layout**:

```
┌───────────┬─────────────────────────────────────────────┐
│           │ [Search Bar]                  [View: Grid]  │
│           ├─────────────────────────────────────────────┤
│  Filters  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│  (Sidebar)│ │Card │ │Card │ │Card │ │Card │  3-col grid│
│           │ └─────┘ └─────┘ └─────┘ └─────┘            │
│  📚 Novel │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│  🎭 Type  │ │Card │ │Card │ │Card │ │Card │            │
│  ⭐ Score │ └─────┘ └─────┘ └─────┘ └─────┘            │
│           │                                             │
│           │ [← Previous] [1] [2] [3] [Next →]          │
└───────────┴─────────────────────────────────────────────┘
```

**Components**:

- Search: `AutoComplete` with debounce
- Filters: Custom filter panel with `Checkbox`, `RadioButton`, `Slider`
- Results: `DataView` with `grid`/`list` toggle
- Pagination: `Paginator`

---

### 3. Scenario Detail Page

**Purpose**: Display scenario details, list conversations, enable forking

**Layout** (Mobile):

```
┌─────────────────────────────────┐
│ ← Back to Browse                │ ← Breadcrumb
├─────────────────────────────────┤
│ 📘 Harry Potter                 │ ← Novel Badge
│                                 │
│ Hermione Sorted into Slytherin  │ ← Title (h1)
│ By @hermione_fan · 2 days ago   │ ← Meta
│                                 │
│ ⭐ Quality Score: 0.85           │ ← Stats Row
│ 💬 12 conversations | 🍴 5 forks│
│                                 │
│ [❤️ Like] [🍴 Fork] [Share]     │ ← Action Buttons
│                                 │
├─────────────────────────────────┤
│ 📝 Scenario Details              │ ← Collapsible Panel
│                                 │
│ Type: Character Change          │
│ Character: Hermione Granger     │
│ Property: House                 │
│ Original: Gryffindor            │
│ New: Slytherin                  │
│                                 │
│ Ripple Effects:                 │
│ • Different friend group        │
│ • Changed house dynamics        │
│ • Academic rivalry with Draco   │
├─────────────────────────────────┤
│ 💬 Conversations (12)            │ ← Conversations Tab
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📖 Hermione's First Day     │ │ ← Conversation Card
│ │ By @user1 · 1 day ago       │ │
│ │ 8 messages | ❤️ 23           │ │
│ │ [Read →]                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📖 Befriending Draco        │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Fork Modal**:

```
┌─────────────────────────────────┐
│ 🍴 Fork Scenario                │ ← Dialog Header
├─────────────────────────────────┤
│                                 │
│ You're creating a meta-scenario │
│ based on "Hermione in Slytherin"│
│                                 │
│ Scenario Type:                  │
│ ⚪ Character Change             │
│ ⚫ Event Alteration             │
│ ⚪ Setting Modification         │
│                                 │
│ [Continue to Details →]         │
│                                 │
│ [Cancel]                        │
└─────────────────────────────────┘
```

**Desktop Enhancements**:

- 2-column layout: Details (left) + Conversations (right)
- Sticky scenario summary on scroll
- Forking tree visualization below conversations

**Components**:

- Header: Custom hero section with stats
- Actions: `Button` group
- Details: `Panel` (collapsible)
- Conversations: `DataView` with `list` layout
- Fork Modal: `Dialog` with multi-step form

---

### 4. Conversation Detail Page

**Purpose**: Display conversation messages, enable messaging, forking

**Layout** (Mobile):

```
┌─────────────────────────────────┐
│ ← Back | [Fork] [Like] [Memo]  │ ← Header Actions
├─────────────────────────────────┤
│ Hermione's First Day in         │ ← Title
│ Slytherin                       │
│                                 │
│ 📘 Scenario: Hermione in        │ ← Scenario Link
│ Slytherin                       │
│ By @hermione_fan                │ ← Creator
│                                 │
├─────────────────────────────────┤
│ 💬 Messages                      │ ← Message Thread
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 You                      │ │ ← User Message
│ │ How would Hermione react to │ │
│ │ being sorted into Slytherin?│ │
│ │ 2 hours ago                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🤖 Hermione Granger         │ │ ← AI Message
│ │ I was shocked at first. The │ │
│ │ Sorting Hat saw my ambition │ │
│ │ and cunning, traits I never │ │
│ │ fully acknowledged...       │ │
│ │ 2 hours ago                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 You                      │ │
│ │ How did Draco react?        │ │
│ │ 1 hour ago                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🤖 Hermione Granger         │ │
│ │ ▮ (typing...)              │ │ ← Typing Indicator
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [Type your message...]          │ ← Message Input
│                            [→]  │ (Sticky bottom)
└─────────────────────────────────┘
```

**Message States**:

- **User Message**: Right-aligned, blue background
- **AI Message**: Left-aligned, gray background
- **Typing Indicator**: Animated dots "..."
- **Streaming Message**: Text appears word-by-word

**Memo Sidebar** (Slide-in from right):

```
┌─────────────────────────────────┐
│ 📝 Personal Memo         [X]    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Interesting take on         │ │ ← Editable Textarea
│ │ Hermione's adaptability.    │ │
│ │                             │ │
│ │ Should explore Draco        │ │
│ │ relationship more in next   │ │
│ │ fork.                       │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Save Memo]                     │
└─────────────────────────────────┘
```

**Desktop Layout**:

```
┌───────────┬─────────────────────────────────┬───────────┐
│ Scenario  │ 💬 Messages                      │ 📝 Memo   │
│ Summary   │                                 │ (Sidebar) │
│           │ ┌─────────────────────────────┐ │           │
│ 📘 HP     │ │ 👤 You                      │ │ [Memo]    │
│ Hermione  │ │ Message text...             │ │           │
│ in        │ └─────────────────────────────┘ │ [Edit]    │
│ Slytherin │                                 │           │
│           │ ┌─────────────────────────────┐ │ [Delete]  │
│ [Details] │ │ 🤖 Hermione                 │ │           │
│           │ │ Response text...            │ │           │
│           │ └─────────────────────────────┘ │           │
│           │                                 │           │
│           │ [Type message...]          [→] │           │
└───────────┴─────────────────────────────────┴───────────┘
```

**Components**:

- Message Thread: `ScrollPanel` with custom message components
- Message Input: `Textarea` with auto-resize
- Streaming: Custom component with SSE integration
- Memo: `OverlayPanel` (mobile) or sidebar (desktop)

---

### 5. Scenario Creation Wizard

**Purpose**: Guide users through scenario creation step-by-step

**Step 1: Select Novel** (Mobile):

```
┌─────────────────────────────────┐
│ Create New Scenario (1/4)       │ ← Progress Indicator
│ ━━━━━━                          │
│                                 │
│ 📚 Select a Novel               │
│                                 │
│ [Search novels...]              │ ← AutoComplete
│                                 │
│ Popular Choices:                │
│ ┌─────────────────────────────┐ │
│ │ 📘 Harry Potter Series      │ │ ← Novel Card
│ │ by J.K. Rowling             │ │
│ │ [Select]                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📖 Pride and Prejudice      │ │
│ │ by Jane Austen              │ │
│ │ [Select]                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancel]                [Next →]│ (Disabled until selection)
└─────────────────────────────────┘
```

**Step 2: Choose Scenario Type**:

```
┌─────────────────────────────────┐
│ Create New Scenario (2/4)       │
│ ━━━━━━━━━━                      │
│                                 │
│ 🎭 Scenario Type                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚪ 👤 Character Change       │ │ ← Radio Card
│ │ Alter a character's          │ │
│ │ properties or traits         │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚫ 🎬 Event Alteration       │ │ (Selected)
│ │ Change key events or         │ │
│ │ their outcomes               │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚪ 🌍 Setting Modification   │ │
│ │ Modify the world or          │ │
│ │ environment                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ [← Back]                [Next →]│
└─────────────────────────────────┘
```

**Step 3: Fill Parameters** (Dynamic based on type):

```
┌─────────────────────────────────┐
│ Create New Scenario (3/4)       │
│ ━━━━━━━━━━━━━━                  │
│                                 │
│ 🎬 Event Alteration Details     │
│                                 │
│ Event Name: *                   │
│ ┌─────────────────────────────┐ │
│ │ Gatsby and Daisy reunion    │ │ ← Input
│ └─────────────────────────────┘ │
│                                 │
│ Timeline Point: *               │
│ ┌─────────────────────────────┐ │
│ │ Chapter 5, Summer 1922      │ │
│ └─────────────────────────────┘ │
│                                 │
│ Alteration Type: *              │
│ [Prevent ▼] (Dropdown)          │
│                                 │
│ Original Outcome:               │
│ ┌─────────────────────────────┐ │
│ │ They reunite and rekindle   │ │ ← Textarea
│ │ romance                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ New Outcome: *                  │
│ ┌─────────────────────────────┐ │
│ │ Gatsby moves to California, │ │
│ │ never looks back            │ │
│ └─────────────────────────────┘ │
│                                 │
│ [← Back]                [Next →]│
└─────────────────────────────────┘
```

**Step 4: Preview & Publish**:

```
┌─────────────────────────────────┐
│ Create New Scenario (4/4)       │
│ ━━━━━━━━━━━━━━━━━━              │
│                                 │
│ 👀 Preview Your Scenario        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📘 The Great Gatsby         │ │ ← Scenario Preview Card
│ │                             │ │
│ │ Gatsby Never Met Daisy      │ │ (Title auto-generated)
│ │                             │ │
│ │ Type: Event Alteration      │ │
│ │ Event: Gatsby and Daisy...  │ │
│ │ New Outcome: Gatsby moves...│ │
│ │                             │ │
│ │ Quality Score: Calculating..│ │
│ └─────────────────────────────┘ │
│                                 │
│ Privacy:                        │
│ ⚫ Public ⚪ Private             │ ← Radio Buttons
│                                 │
│ [← Back]          [🚀 Publish]  │
└─────────────────────────────────┘
```

**Progress Indicators**:

- Step count: "1/4", "2/4", etc.
- Progress bar visual: `ProgressBar` component
- Breadcrumb trail on desktop

**Validation**:

- Real-time validation on each field
- Next button disabled until valid
- Error messages below fields

**Components**:

- Wizard Container: Custom stepper component
- Novel Search: `AutoComplete`
- Type Selection: Custom radio cards
- Form Fields: `InputText`, `Textarea`, `Dropdown`
- Preview: Custom scenario card

---

### 6. User Profile Page

**Purpose**: Display user activity, scenarios, conversations, followers

**Layout** (Mobile):

```
┌─────────────────────────────────┐
│ ← Back                          │
├─────────────────────────────────┤
│       ┌───────────┐              │ ← Avatar
│       │  Avatar   │              │
│       └───────────┘              │
│                                 │
│      @hermione_fan              │ ← Username (h1)
│                                 │
│ Slytherin Hermione enthusiast.  │ ← Bio
│ Exploring alternate timelines.  │
│                                 │
│ 👥 234 followers · 89 following │ ← Stats
│ 📖 12 scenarios · 💬 45 convos  │
│                                 │
│ [Follow] [Share]                │ ← Actions (if not self)
│ [Edit Profile]                  │ (if self)
│                                 │
├─────────────────────────────────┤
│ ┌─────┬─────┬─────┬─────┐       │ ← Tabs
│ │Scen │Conv │Liked│Memo │       │
│ └─────┴─────┴─────┴─────┘       │
│                                 │
│ 📖 Scenarios (12)               │ ← Active Tab Content
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📘 Hermione in Slytherin    │ │ ← Scenario Card
│ │ ⭐ 0.85 | 💬 12 | 🍴 5      │ │
│ │ 2 days ago                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📘 Draco Redeemed           │ │
│ │ ⭐ 0.72 | 💬 8 | 🍴 3       │ │
│ │ 1 week ago                  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Tabs**:

1. **Scenarios**: User's created scenarios
2. **Conversations**: User's conversations
3. **Liked**: Liked conversations (private if not self)
4. **Memos**: Personal memos (private, only visible to self)

**Edit Profile Modal** (if self):

```
┌─────────────────────────────────┐
│ ✏️ Edit Profile          [X]    │
├─────────────────────────────────┤
│                                 │
│ Avatar:                         │
│ ┌───────────┐ [Upload New]      │
│ │  Current  │                   │
│ │  Avatar   │                   │
│ └───────────┘                   │
│                                 │
│ Username: @hermione_fan         │ (Read-only)
│                                 │
│ Bio:                            │
│ ┌─────────────────────────────┐ │
│ │ Slytherin Hermione          │ │ ← Editable Textarea
│ │ enthusiast. Exploring       │ │ (500 char max)
│ │ alternate timelines.        │ │
│ └─────────────────────────────┘ │
│ 45 / 500 characters             │
│                                 │
│ [Cancel]            [Save]      │
└─────────────────────────────────┘
```

**Desktop Layout**:

```
┌───────────────────────────────────────────────────┐
│ ← Back                                            │
├─────────────────┬─────────────────────────────────┤
│                 │                                 │
│  ┌───────────┐  │  @hermione_fan                  │
│  │  Avatar   │  │                                 │
│  └───────────┘  │  Slytherin Hermione enthusiast. │
│                 │  Exploring alternate timelines. │
│  [Edit Profile] │                                 │
│  [Share]        │  👥 234 · 89 | 📖 12 · 💬 45     │
│                 │                                 │
│                 │  ┌──┬──┬──┬──┐                  │
│                 │  │Sc│Co│Li│Me│                  │
│                 │  └──┴──┴──┴──┘                  │
│                 │                                 │
│                 │  ┌───┐ ┌───┐ ┌───┐              │
│                 │  │ S │ │ S │ │ S │  2-col grid  │
│                 │  └───┘ └───┘ └───┘              │
│                 │  ┌───┐ ┌───┐ ┌───┐              │
│                 │  │ S │ │ S │ │ S │              │
│                 │  └───┘ └───┘ └───┘              │
└─────────────────┴─────────────────────────────────┘
```

**Components**:

- Avatar: `Avatar` with upload button
- Stats: Custom stat counters
- Tabs: `TabView`
- Content: `DataView` with `grid` layout
- Edit Modal: `Dialog` with `FileUpload`

---

## Responsive Design

### Mobile-First Breakpoints

**Base (< 640px): Mobile**

- Single column layouts
- Bottom navigation
- Hamburger menu
- Cards stack vertically
- Modal fills screen

**SM (640px - 767px): Large Mobile**

- 2-column grids for cards
- Expanded filter panels
- Larger touch targets

**MD (768px - 1023px): Tablets**

- 3-column grids
- Side navigation appears
- Multi-column layouts
- Split views for detail pages

**LG (1024px+): Desktop**

- 4-column grids
- Persistent sidebars
- Hover states
- Keyboard shortcuts

### Responsive Patterns

**Navigation**:

- Mobile: Bottom tab bar + hamburger menu
- Desktop: Top menubar + sidebar

**Cards**:

- Mobile: 1 column, full width
- Tablet: 2 columns
- Desktop: 3-4 columns

**Forms**:

- Mobile: Stacked labels above inputs
- Desktop: Inline labels (left of inputs)

**Modals**:

- Mobile: Full-screen takeover
- Desktop: Centered overlay (max 600px width)

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast**:

- Text: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio

**Keyboard Navigation**:

- All interactive elements reachable via Tab
- Logical tab order (top to bottom, left to right)
- Focus indicators visible (2px outline)
- Escape closes modals
- Enter/Space activates buttons

**Screen Reader Support**:

- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content (streaming messages)
- Form labels associated with inputs

**Focus Management**:

- Focus trapped in modals
- Focus returned after modal close
- Skip to main content link
- Focus outlines: 2px solid brand-500

**Touch Targets**:

- Minimum 44x44px for all interactive elements
- Increased spacing between buttons

---

## Interaction Patterns

### Loading States

**Skeleton Screens**:

```
┌─────────────────────────────────┐
│ ████████                        │ ← Title
│ ████                            │ ← Meta
│                                 │
│ ████████████████                │ ← Description
│ ████████                        │
│                                 │
│ [████] [████] [████]            │ ← Buttons
└─────────────────────────────────┘
```

**Spinners**:

- Page load: Full-screen spinner with logo
- Button actions: Inline spinner in button
- Infinite scroll: Footer spinner

**Streaming Messages**:

- Typing indicator (3 animated dots)
- Text appears word-by-word
- Scroll follows new content

### Animations

**Transitions** (using PandaCSS):

```typescript
transition: {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
}
```

**Micro-Interactions**:

- Button hover: Scale 1.02, shadow increase
- Card hover: Lift (shadow increase)
- Like button: Heart scale + color change
- Fork button: Icon rotation
- Input focus: Border glow

**Page Transitions**:

- Fade in: 200ms
- Slide in (modals): 300ms from bottom (mobile), center (desktop)

### Error Handling

**Inline Validation**:

```
Email: *
┌─────────────────────────────────┐
│ not-an-email                    │ ← Input (red border)
└─────────────────────────────────┘
❌ Please enter a valid email address ← Error message (red)
```

**Toast Notifications**:

- Success: Green toast, top-right, 3s auto-dismiss
- Error: Red toast, top-right, 5s auto-dismiss, manual close
- Info: Blue toast, top-right, 3s auto-dismiss

**Empty States**:

```
┌─────────────────────────────────┐
│                                 │
│         🔍                      │ ← Illustration
│                                 │
│   No scenarios found            │ ← Heading
│   Try adjusting your filters    │ ← Suggestion
│                                 │
│   [Create New Scenario]         │ ← CTA
│                                 │
└─────────────────────────────────┘
```

---

## Visual Design

### Iconography

**Icon Library**: Heroicons (Outline for UI, Solid for filled states)

**Common Icons**:

- 🔍 Search
- ➕ Create/Add
- 🍴 Fork
- ❤️ Like (outline) / ❤️ (solid when liked)
- 💬 Conversation
- 📖 Scenario
- 👤 User
- ⚙️ Settings
- 🔔 Notifications
- 📝 Memo

### Illustrations

**Placeholder Illustrations** (using unDraw or custom):

- Empty states (no scenarios, no conversations)
- Hero section background
- Error pages (404, 500)

### Card Designs

**Scenario Card** (Detailed):

```
┌─────────────────────────────────┐
│ 📘 Harry Potter                 │ ← Novel badge (top-left)
│                          ⭐ 0.85 │ ← Quality score (top-right)
│                                 │
│ Hermione Sorted into Slytherin  │ ← Title (bold, 18px)
│                                 │
│ What if Hermione was sorted     │ ← Description (truncated)
│ into Slytherin instead of...    │
│                                 │
│ 👤 @hermione_fan · 2 days ago   │ ← Creator + timestamp
│                                 │
│ 💬 12 convos | 🍴 5 forks        │ ← Stats row
│                                 │
│ [Read More]               [❤️]  │ ← Actions
└─────────────────────────────────┘
```

**Visual Hierarchy**:

- Novel badge: Small, colored, top-left
- Quality score: Large, prominent, top-right
- Title: Bold, 18px
- Description: Regular, 14px, gray-700
- Meta: Small, 12px, gray-500

---

## Design Handoff

### Developer Resources

**Figma Files** (Future):

- Component library
- Responsive wireframes
- Interactive prototypes

**Design Tokens** (PandaCSS):

- Exported from Figma or manually defined
- Located in `panda.config.ts`

**Component Props**:

- PrimeVue documentation: https://primevue.org/
- Custom component storybook (future)

### QA Checklist

- [ ] All screens responsive (mobile, tablet, desktop)
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Empty states designed
- [ ] Touch targets minimum 44px
- [ ] Focus indicators visible
- [ ] Animations smooth (60fps)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-13  
**Maintained By**: Design Team  
**Feedback**: #gaji-design on Slack
