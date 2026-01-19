# Daily Tracker

A dark, elegant daily tracker app for managing habits, events, and tasks. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Dashboard
- **Habits Panel**: Track daily habits with a clean checklist interface
- **Streak Tracking**: Monitor your progress with configurable timeframes (week/month/year/custom)
- **Click-to-toggle**: Switch between ratio (15/30) and percentage (50%) views
- **Priority Calendar**: Visual calendar highlighting high and medium priority events

### Events
- Create, edit, and delete events (exams, deadlines, project submissions)
- Set priority levels: High, Medium, Low
- Optional due date and time
- Add detailed notes to each event
- Filter and sort events by priority or date

### Tasks
- Per-event task checklists
- Drag-and-drop reordering (in custom order mode)
- Multiple sort modes: Custom, Date Added, Priority
- Optional priority for individual tasks
- Click to edit task names inline

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom CSS variables
- **UI Components**: Radix UI (accessible primitives)
- **State Management**: Zustand
- **Local Storage**: Dexie (IndexedDB)
- **Drag & Drop**: @dnd-kit
- **Calendar**: react-day-picker
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Design System

The app uses a custom dark theme with:
- Near-black base with warm graphite surfaces
- Burnt amber for high priority
- Desaturated teal for medium priority
- Neutral slate for low priority
- Warm gold accent color
- Muted sage green for success states

## Future Plans

- InstantDB integration for cloud sync
- User authentication
- Multi-device support
- Notifications and reminders

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (shell)/           # Main app shell with sidebar
│   │   ├── events/        # Events page
│   │   ├── tasks/         # Tasks pages
│   │   └── page.tsx       # Dashboard
│   └── globals.css        # CSS variables and base styles
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── events/            # Event list and editor
│   ├── shell/             # Sidebar and header
│   ├── tasks/             # Task board and drag-drop
│   └── ui/                # Reusable UI components
├── lib/
│   ├── repo/              # Repository abstraction
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utility functions
└── store/
    └── useAppStore.ts     # Zustand store
```
