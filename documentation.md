# SwimTracker - Component Documentation

Last updated: 2026-06-23

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activities/
│   │   │   ├── route.ts               # POST — create new activities
│   │   │   └── [id]/route.ts          # DELETE — delete activity by ID
│   │   └── workouts/
│   │       ├── route.ts               # POST — create workout with exercises
│   │       └── [id]/route.ts          # DELETE — delete workout + exercises
│   ├── strength/
│   │   └── page.tsx                   # Strength page (route: /strength) — server component
│   ├── swimming/
│   │   └── page.tsx                   # Swimming page (route: /swimming) — server component
│   ├── globals.css                    # Global styles, CSS variables, dark/light theme colors
│   ├── layout.tsx                     # Root layout — wraps every page
│   └── page.tsx                       # Dashboard page (route: /) — server component
├── components/
│   ├── app-sidebar.tsx                # Main sidebar navigation
│   ├── dashboard/
│   │   ├── dashboard-content.tsx      # Dashboard client component (filtering, interactivity)
│   │   ├── stats-cards.tsx            # Summary stat cards (sessions, distance, pace, peak)
│   │   ├── pace-chart.tsx             # Line chart — avg/best pace per month
│   │   ├── volume-chart.tsx           # Bar chart — monthly distance & sessions
│   │   └── recent-swims.tsx           # Table of last 8 swim sessions
│   ├── swimming/
│   │   ├── swimming-content.tsx       # Swimming page client component (stats, filter, layout)
│   │   ├── swim-table.tsx             # Sortable, paginated table of all swims
│   │   ├── personal-bests.tsx         # Personal best records (fastest, longest, etc.)
│   │   ├── pace-distribution.tsx      # Bar chart — pace bucket distribution
│   │   └── add-swim-form.tsx          # Manual swim entry form (modal)
│   ├── strength/
│   │   ├── strength-content.tsx       # Strength page client component (stats, filter, layout)
│   │   ├── workout-history.tsx        # Expandable workout cards with exercises
│   │   └── add-workout-form.tsx       # Add workout modal with dynamic exercise list
│   ├── confirm-modal.tsx              # Reusable delete confirmation modal
│   └── ui/                            # shadcn/ui components (auto-generated, rarely edit)
│       ├── button.tsx
│       ├── input.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       └── tooltip.tsx
├── generated/
│   └── prisma/                        # Auto-generated Prisma client (do not edit)
├── hooks/                             # Custom React hooks
└── lib/
    ├── activity-utils.ts              # Shared types + utility functions (server & client)
    ├── db.ts                          # Prisma client singleton
    ├── parse-activities.ts            # CSV parser — legacy, used by seed script
    ├── queries.ts                     # Database query functions (loadActivities, createActivity)
    └── utils.ts                       # Utility functions (cn helper for classnames)
prisma/
├── schema.prisma                      # Database schema (Activity model)
├── seed.ts                            # One-time CSV import script
├── migrations/                        # Database migration files
└── dev.db                             # SQLite database file
uploads/                               # Original CSV seed data (no longer read by the app)
```

---

## Architecture

### Server vs Client Components

| File | Type | Why |
|------|------|-----|
| `page.tsx` files | Server | Queries the database via Prisma |
| `*-content.tsx` files | Client | Handles interactivity (useState, buttons, forms) |
| `queries.ts` | Server only | Uses Prisma client to query SQLite |
| `db.ts` | Server only | Prisma client singleton |
| `activity-utils.ts` | Shared | No Node.js APIs — safe for both server and client |

### Data Flow

```
SQLite (dev.db)
  ↓ Prisma query
page.tsx (server) — loads data, converts dates to ISO strings
  ↓ props
*-content.tsx (client) — converts dates back, handles filtering/state
  ↓ renders
Charts, tables, cards
```

### Manual Data Input Flow

```
Add Swim Form (client)
  ↓ POST /api/activities
API Route (server) — validates input, creates DB record
  ↓ response
Form calls router.refresh() → page re-fetches from DB → UI updates
```

---

## Database

### Schema (`prisma/schema.prisma`)

**Activity model:**

**Activity model** (swim/run/walk data):

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Auto-generated (cuid) |
| `date` | DateTime | When the activity happened |
| `name` | String | e.g. "Afternoon Swim" |
| `type` | String | "Swim", "Run", "Walk", "Strength" |
| `elapsedTime` | Float | Total elapsed seconds |
| `movingTime` | Float | Active moving seconds |
| `distance` | Float | Distance in meters |
| `maxHeartRate` | Float? | Optional |
| `avgHeartRate` | Float? | Optional |
| `calories` | Float? | Optional |
| `avgSpeed` | Float? | Optional |
| `poolLength` | Float? | Optional (meters) |
| `source` | String | "csv" or "manual" |
| `createdAt` | DateTime | Auto-set on creation |
| `splits` | SwimSplit[] | Relation — optional per-set breakdown |

**SwimSplit model** (per-set pace data within a swim):

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Auto-generated (cuid) |
| `activityId` | String | Foreign key → Activity |
| `distance` | Float | Split distance in meters (e.g. 200) |
| `time` | Float | Split time in seconds |
| `orderIdx` | Int | Display order within the swim |

**Workout model** (gym sessions):

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Auto-generated (cuid) |
| `date` | DateTime | When the workout happened |
| `name` | String | e.g. "Pull + Core" |
| `duration` | Float? | Duration in minutes (optional) |
| `notes` | String? | Free text notes (optional) |
| `createdAt` | DateTime | Auto-set on creation |
| `exercises` | Exercise[] | Relation — has many exercises |

**Exercise model** (individual exercises within a workout):

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Auto-generated (cuid) |
| `workoutId` | String | Foreign key → Workout |
| `name` | String | e.g. "Lat Pulldown" |
| `category` | String | "Back", "Chest", "Core", etc. |
| `sets` | Int | Number of sets |
| `reps` | Int? | Reps per set (null for timed exercises) |
| `weight` | Float? | Weight in kg (optional) |
| `duration` | Float? | Duration in seconds (for planks, holds) |
| `orderIdx` | Int | Display order within workout |

**Relationships:** Workout → Exercise is one-to-many with cascade delete.

**What to edit:**

| Change | Where | How |
|--------|-------|-----|
| Add a new field | `prisma/schema.prisma` | Add field, run `npx prisma migrate dev --name <description>` |
| Change field type | `prisma/schema.prisma` | Modify type, run migrate |
| Add an index | `prisma/schema.prisma` | Add `@@index([fieldName])`, run migrate |

**TrainingNote model** (persistent AI context):

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Auto-generated |
| `content` | String | Note text (max 500 chars) |
| `createdAt` | DateTime | Auto-set |

**InsightReport model** (saved AI analysis):

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Auto-generated |
| `overall` | String | Overall summary text |
| `swimInsights` | String | JSON array of swim insights |
| `strengthInsights` | String | JSON array of strength insights |
| `recommendations` | String | JSON array of recommendations |
| `createdAt` | DateTime | Auto-set |

### Database Commands

```bash
# Apply schema changes
npx prisma migrate dev --name <description>

# Re-generate Prisma client after schema change
npx prisma generate

# Re-seed database from CSV
npx tsx prisma/seed.ts

# Open database GUI browser
npx prisma studio
```

### Prisma Client (`src/lib/db.ts`)

Singleton pattern — one Prisma instance shared across all requests. Uses `@prisma/adapter-libsql` for SQLite connection. The `globalForPrisma` trick prevents hot-reload from creating new connections.

### Query Functions (`src/lib/queries.ts`)

| Export | Purpose |
|--------|---------|
| `loadActivities()` | Returns all activities sorted by date (newest first) |
| `loadSwimActivities()` | Returns swim activities only |
| `loadWorkouts()` | Returns all workouts with exercises, newest first |
| `createActivity(data)` | Inserts a new activity with `source: "manual"` |
| `createWorkout(data)` | Creates a workout with exercises in one transaction |
| `deleteActivity(id)` | Deletes a single activity |
| `deleteWorkout(id)` | Deletes a workout and all its exercises (cascade) |
| `WorkoutWithExercises` | Type — workout with nested exercises array |

**What to edit:**

| Change | Where | How |
|--------|-------|-----|
| Add a new query | `src/lib/queries.ts` | Add new async function using `prisma.activity.findMany(...)` |
| Filter by source | Query `where` clause | Add `where: { source: "manual" }` |
| Add sorting | Query `orderBy` | Add `orderBy: { distance: "desc" }` |

---

## API Routes

### POST `/api/activities` (`src/app/api/activities/route.ts`)

**What it does:** Creates a new activity in the database.

**Request body (JSON):**
```json
{
  "date": "2026-06-23",
  "name": "Morning Swim",
  "type": "Swim",
  "distance": 1000,
  "movingTime": 1500,
  "avgHeartRate": 140,
  "poolLength": 50
}
```

**Required fields:** `date`, `name`, `type`, `distance`, `movingTime`
**Optional fields:** `avgHeartRate`, `maxHeartRate`, `calories`, `poolLength`
**Allowed types:** `"Swim"`, `"Run"`, `"Walk"`, `"Strength"`

**What to edit:**

| Change | Where | How |
|--------|-------|-----|
| Add allowed activity types | `allowedTypes` array | Add new type string |
| Add validation rules | Before `createActivity()` call | Add `if` checks |
| Name max length | `String(name).slice(0, 200)` | Change `200` |

### DELETE `/api/activities/[id]` (`src/app/api/activities/[id]/route.ts`)

**What it does:** Deletes a single activity by ID. Returns `{ success: true }` or 404.

### POST `/api/workouts` (`src/app/api/workouts/route.ts`)

**What it does:** Creates a workout with exercises in one request.

**Request body (JSON):**
```json
{
  "date": "2026-06-23",
  "name": "Pull + Core",
  "duration": 60,
  "notes": "Felt strong today",
  "exercises": [
    { "name": "Lat Pulldown", "category": "Back", "sets": 3, "reps": 12, "weight": 40 },
    { "name": "Plank", "category": "Core", "sets": 3, "duration": 45 }
  ]
}
```

**Required fields:** `date`, `name`, `exercises` (at least one)
**Each exercise requires:** `name`, `category`, `sets`
**Each exercise optional:** `reps`, `weight`, `duration` (reps or duration must be provided)
**Allowed categories:** Back, Chest, Shoulders, Arms, Legs, Core, Groin, Recovery, Prehab, Cardio

| Change | Where | How |
|--------|-------|-----|
| Add exercise categories | `ALLOWED_CATEGORIES` array in route.ts | Add new category string |
| Workout name max length | `String(name).slice(0, 200)` | Change `200` |
| Notes max length | `String(notes).slice(0, 500)` | Change `500` |

### DELETE `/api/workouts/[id]` (`src/app/api/workouts/[id]/route.ts`)

**What it does:** Deletes a workout and all its exercises (cascade). Returns `{ success: true }` or 404.

---

## Components

### 1. Root Layout (`src/app/layout.tsx`)

**What it does:** Wraps every page. Sets up fonts, dark mode, sidebar, tooltip provider.

| Change | Where | How |
|--------|-------|-----|
| App title / SEO | `metadata` object | Change `title` and `description` |
| Light/dark mode | `<html>` tag | Remove `dark` from className for light mode |
| Header height | `<header>` tag | Change `h-12` to another Tailwind height |
| Page padding | `<div className="p-6">` | Change `p-6` to desired padding |

---

### 2. App Sidebar (`src/components/app-sidebar.tsx`)

**What it does:** Left sidebar with navigation links. Collapsible on desktop, slides out on mobile.

| Change | Where | How |
|--------|-------|-----|
| Add/remove nav links | `navItems` array | Add/remove objects with `title`, `href`, `icon` |
| Change nav icons | `navItems` array | Import different icon from `lucide-react` |
| Logo color | `bg-green-700` on logo div | Change to any Tailwind color |
| Nav item spacing | `<SidebarMenu className="gap-2">` | Change gap value |

**Available icons:** https://lucide.dev/icons

---

### 3. Dashboard Page (`src/app/page.tsx`)

**What it does:** Server component. Queries all activities from database, passes to `DashboardContent`.

---

### 4. Dashboard Content (`src/components/dashboard/dashboard-content.tsx`)

**What it does:** Client component. Time range filter, stats, charts, recent swims.

| Change | Where | How |
|--------|-------|-----|
| Default time range | `useState<TimeRange>("all")` | Change `"all"` to `"3m"`, `"6m"`, or `"1y"` |
| Add time range options | `rangeOptions` array | Add entry (also update `TimeRange` type + `filterByRange` in `activity-utils.ts`) |
| Number of recent swims | `swims.slice(0, 8)` | Change `8` |
| Chart layout | `grid-cols-1 lg:grid-cols-2` | Change for different layouts |

---

### 5. Stats Cards (`src/components/dashboard/stats-cards.tsx`)

| Change | Where | How |
|--------|-------|-----|
| Card labels | `cards` array | Change `label` values |
| Card icons | `cards` array | Import different icons from `lucide-react` |
| Grid columns | `grid-cols-2 lg:grid-cols-4` | Change for different layouts |

---

### 6. Pace Chart (`src/components/dashboard/pace-chart.tsx`)

| Change | Where | How |
|--------|-------|-----|
| Chart height | `height={260}` | Change pixel value |
| Y-axis range | `domain={[110, 280]}` | Adjust min/max pace in seconds |
| Target pace line | `<ReferenceLine y={120}>` | Change `120` (seconds) |
| Line colors | `className="stroke-chart-1"` | Use `stroke-chart-1` through `stroke-chart-5` |

---

### 7. Volume Chart (`src/components/dashboard/volume-chart.tsx`)

| Change | Where | How |
|--------|-------|-----|
| Chart height | `height={260}` | Change pixel value |
| Bar colors | `className="fill-chart-1"` | Use `fill-chart-1` through `fill-chart-5` |

---

### 8. Recent Swims (`src/components/dashboard/recent-swims.tsx`)

| Change | Where | How |
|--------|-------|-----|
| Pace bar sensitivity | `(parseFloat(swim.pace) - 2.0) * 120` | Adjust multiplier |
| Columns shown | `<span>` elements inside row | Add/remove columns |

---

### 9. Swimming Page (`src/app/swimming/page.tsx`)

**What it does:** Server component. Queries swim activities from database, passes to `SwimmingContent`.

---

### 10. Swimming Content (`src/components/swimming/swimming-content.tsx`)

**What it does:** Client component. Swim-specific stats (sessions, distance, avg pace, avg HR), time range filter, and layout for all swimming sub-components.

| Change | Where | How |
|--------|-------|-----|
| Stats shown | `stats` array | Change labels, icons, calculations |
| Default time range | `useState<TimeRange>("all")` | Change default |

---

### 11. Swim Table (`src/components/swimming/swim-table.tsx`)

**What it does:** Sortable, paginated table of all swim sessions. Desktop shows table layout, mobile shows card layout with expandable splits.

| Change | Where | How |
|--------|-------|-----|
| Rows per page | `PER_PAGE` constant | Change `10` to desired number |
| Add/remove columns | `columns` array + row JSX | Add column definition and render |
| Default sort | `useState<SortKey>("date")` | Change to different column |
| Sortable columns | `columns` array | Set `key: null` to disable sort on a column |

Swims with splits show a chevron (▼) on mobile — tap to expand and see per-split pace breakdown.

---

### 12. Personal Bests (`src/components/swimming/personal-bests.tsx`)

**What it does:** 4 cards showing records: Fastest Pace, Longest Swim, Longest Duration, Most Sessions in a Day.

| Change | Where | How |
|--------|-------|-----|
| Add a new PB | `bests` array | Add new object with label, value, sub, icon |
| Change icons | Import from `lucide-react` | Swap icon component |

---

### 13. Pace Distribution (`src/components/swimming/pace-distribution.tsx`)

**What it does:** Bar chart showing how many sessions fall into each 10-second pace bucket.

| Change | Where | How |
|--------|-------|-----|
| Bucket size | `start += 10` in `buildBuckets` | Change `10` for wider/narrower buckets |
| Bucket range | `start = 110; start <= 300` | Adjust min/max pace range |
| Chart height | `height={260}` | Change pixel value |

---

### 14. Add Swim Form (`src/components/swimming/add-swim-form.tsx`)

**What it does:** Modal form with two modes: "Total Distance" (single entry) or "By Splits" (per-set breakdown). Submits to `POST /api/activities`.

**Modes:**
- **Total Distance** — enter total distance + total time (simple, like before)
- **By Splits** — add multiple rows, each with distance + time. Total auto-calculates

| Change | Where | How |
|--------|-------|-----|
| Default pool length | `poolLength: "50"` in initial state | Change `"50"` |
| Distance step | `step="25"` on distance input | Change increment value |
| Default name | `"Swim Session"` fallback | Change string |

---

### 14b. Edit Swim Form (`src/components/swimming/edit-swim-form.tsx`)

**What it does:** Same as Add form but pre-fills from existing swim. If the swim has splits, opens in "By Splits" mode with splits pre-filled. Submits to `PUT /api/activities/[id]`.

Switching from "By Splits" to "Total Distance" removes existing splits on save.

---

### 14c. Training Notes (`src/components/dashboard/training-notes.tsx`)

**What it does:** Inline list of persistent context notes on the dashboard. Notes are sent to AI with every plan generation and insights analysis. CRUD via `/api/notes`.

| Change | Where | How |
|--------|-------|-----|
| Max note length | `content.trim().slice(0, 500)` in API route | Change `500` |

---

### 14d. AI Insights (`src/components/dashboard/ai-insights.tsx`)

**What it does:** Persistent AI training analysis on the dashboard. Loads the latest saved report on page load. Click "Refresh" to generate a new analysis. Saved to database so it's visible across all sessions and devices.

**Sections:** Overall summary, Swim insights (positive/warning/neutral), Strength insights, Recommendations

---

### 15. Strength Page (`src/app/strength/page.tsx`)

**What it does:** Server component. Queries all workouts with exercises from database, passes to `StrengthContent`.

---

### 16. Strength Content (`src/components/strength/strength-content.tsx`)

**What it does:** Client component. Stats cards, time range filter, layout for workout history and add form.

| Change | Where | How |
|--------|-------|-----|
| Stats shown | `stats` array | Change labels, values, icons |
| Volume calculation | `totalVolume` variable | Currently `sets x reps x weight` |
| Default time range | `useState<TimeRange>("all")` | Change default |

---

### 17. Workout History (`src/components/strength/workout-history.tsx`)

**What it does:** Expandable workout cards. Click to show/hide exercises. Each exercise shows category tag, name, sets x reps, weight.

| Change | Where | How |
|--------|-------|-----|
| Category tag colors | `categoryColors` object | Add/change color mappings (uses Tailwind classes) |
| Add a new category color | `categoryColors` object | Add `NewCategory: "bg-color-900/40 text-color-400"` |
| Exercise display format | `<span>` with sets/reps/weight | Modify the template |

**Current category colors:**

| Category | Color |
|----------|-------|
| Back | Emerald |
| Chest | Pink |
| Shoulders | Violet |
| Arms | Amber |
| Legs | Orange |
| Core | Teal |
| Groin | Red |
| Recovery | Slate |
| Prehab | Cyan |
| Cardio | Yellow |

---

### 18. Add Workout Form (`src/components/strength/add-workout-form.tsx`)

**What it does:** Modal form for logging a gym session. Dynamic exercise list — add/remove rows. Submits to `POST /api/workouts`.

**Workout fields:** Date, Name, Duration (min), Notes
**Exercise fields (per row):** Name, Category (dropdown), Sets, Reps, Weight (kg), Duration (s)

| Change | Where | How |
|--------|-------|-----|
| Default sets | `emptyExercise` object | Change `sets: "3"` |
| Default category | `emptyExercise` object | Change `category: "Back"` |
| Category options | `CATEGORIES` array | Add/remove categories (also update API route) |
| Max exercises | No limit currently | Add check before `addExercise()` |

---

### 19. Confirm Modal (`src/components/confirm-modal.tsx`)

**What it does:** Reusable styled confirmation dialog. Centered modal with dark blurred backdrop, title, message, Cancel and destructive action buttons. Used for delete confirmations on both swimming and strength pages.

**Props:**

| Prop | Type | Purpose |
|------|------|---------|
| `open` | boolean | Show/hide the modal |
| `title` | string | Modal heading |
| `message` | string | Description text |
| `confirmLabel` | string | Action button text (default: "Delete") |
| `loading` | boolean | Disables buttons, shows "Deleting..." |
| `onConfirm` | function | Called when action button is clicked |
| `onCancel` | function | Called when Cancel or backdrop is clicked |

**Usage:**
```tsx
<ConfirmModal
  open={!!deleteTarget}
  title="Delete Item"
  message="Are you sure? This cannot be undone."
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```

---

## Data Layer

### Shared Utilities (`src/lib/activity-utils.ts`)

**Key exports:**

| Export | Purpose |
|--------|---------|
| `Activity` type | Shape of a single activity record |
| `MonthlyStats` type | Shape of monthly aggregated stats |
| `TimeRange` type | `"3m" \| "6m" \| "1y" \| "all"` |
| `filterByRange()` | Filters activities by time range from today |
| `getSwimActivities()` | Filters to swims only |
| `getMonthlySwimStats()` | Groups swims by month, calculates pace/volume stats |
| `formatPace()` | Converts distance + time to "M:SS/100m" |
| `formatDuration()` | Converts seconds to "Xh Ym" or "Xm Ys" |

### CSV Parser (`src/lib/parse-activities.ts`)

**Status:** Legacy — no longer used by the app. Kept for the seed script and as a reference. The app now reads from SQLite via `queries.ts`.

---

## Styling

### Theme Colors (`src/app/globals.css`)

Dark mode colors are under `.dark {}`.

| Variable | Used for |
|----------|----------|
| `--background` | Page background |
| `--foreground` | Default text color |
| `--card` / `--card-foreground` | Card backgrounds and text |
| `--primary` / `--primary-foreground` | Primary buttons, links |
| `--muted` / `--muted-foreground` | Subtle text, secondary info |
| `--border` | All border colors |
| `--sidebar` | Sidebar background |
| `--chart-1` to `--chart-5` | Chart colors (Recharts) |

**To change a color:** Edit `oklch()` value in `.dark {}`. Use https://oklch.com to pick colors.

---

## shadcn/ui Components (`src/components/ui/`)

Auto-generated by shadcn. You can edit them but usually don't need to.

**To add a new component:**
```bash
npx shadcn@latest add <component-name>
```
Browse at https://ui.shadcn.com

---

### 20. Edit Swim Form (`src/components/swimming/edit-swim-form.tsx`)

**What it does:** Modal form to edit an existing swim session. Pre-fills all fields from the swim record. Submits `PUT /api/activities/[id]`.

---

### 21. Edit Workout Form (`src/components/strength/edit-workout-form.tsx`)

**What it does:** Modal form to edit an existing workout. Pre-fills workout info and all exercises. Can add/remove exercises. Submits `PUT /api/workouts/[id]`.

---

### 22. API Client (`src/lib/api-client.ts`)

**What it does:** Centralized fetch helpers that attach the `x-api-token` header to every request.

**Exports:**

| Function | Purpose |
|----------|---------|
| `apiPost(url, body)` | POST with auth token |
| `apiPut(url, body)` | PUT with auth token |
| `apiDelete(url)` | DELETE with auth token |

All components use these instead of raw `fetch()`.

---

### 23. Rate Limiter (`src/lib/rate-limit.ts`)

**What it does:** In-memory rate limiting per key. Tracks request counts within a time window.

| Change | Where | How |
|--------|-------|-----|
| Plan generation limit | `route.ts` call to `rateLimit()` | Change `5` (max requests) or `60 * 60 * 1000` (window) |
| Activity creation limit | `route.ts` | Change `30` |
| Workout creation limit | `route.ts` | Change `20` |

---

### 24. Middleware (`src/middleware.ts`)

**What it does:** Runs on every `/api/*` request. Validates origin/referer headers match the app's domain. Checks `x-api-token` header against `API_SECRET` env var.

| Check | What it blocks |
|-------|---------------|
| Origin validation | Cross-origin requests from other websites |
| Referer validation | Requests with spoofed referers |
| API token | Direct curl/Postman/script calls without the token |

---

## Key Files Outside `src/`

| File | Purpose |
|------|---------|
| `components.json` | shadcn/ui config |
| `prisma/schema.prisma` | Database schema |
| `prisma/dev.db` | SQLite database file |
| `prisma/seed.ts` | CSV → database import script |
| `.env` | Environment variables (`DATABASE_URL`, `GEMINI_API_KEY`, `API_SECRET`, `NEXT_PUBLIC_API_TOKEN`) |
| `next.config.ts` | Next.js config (`output: "standalone"` for Docker) |
| `Dockerfile` | Multi-stage Docker build for Cloud Run |
| `.dockerignore` | Excludes node_modules, .next, .env, *.db from Docker |

---

## Deployment

### Docker Build

```bash
# Build image
docker build -t swim-tracker .

# Run locally
docker run -p 8080:8080 \
  -e GEMINI_API_KEY="your-key" \
  -e API_SECRET="your-secret" \
  -e NEXT_PUBLIC_API_TOKEN="your-secret" \
  -e DATABASE_URL="file:./data/dev.db" \
  swim-tracker
```

### Cloud Run Deployment

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable services (one-time)
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# Create artifact repo (one-time)
gcloud artifacts repositories create swim-tracker --repository-format=docker --location=REGION

# Build and push
gcloud builds submit --tag REGION-docker.pkg.dev/YOUR_PROJECT_ID/swim-tracker/app

# Deploy
gcloud run deploy swim-tracker \
  --image REGION-docker.pkg.dev/YOUR_PROJECT_ID/swim-tracker/app \
  --platform managed \
  --region REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "GEMINI_API_KEY=key,API_SECRET=secret,NEXT_PUBLIC_API_TOKEN=secret,DATABASE_URL=file:./data/dev.db"
```

### Database Persistence on Cloud Run

Cloud Run is stateless — SQLite file is lost on restart. Options:

| Option | How |
|--------|-----|
| **Cloud Run Volume Mount** | Mount Cloud Storage bucket to `/app/data` |
| **Turso** (hosted SQLite) | Change `DATABASE_URL` to Turso URL — same adapter already installed |
| **Cloud SQL** | Switch to PostgreSQL (requires schema tweaks) |

---

## How To

### Add a new page
1. Create folder: `src/app/<page-name>/`
2. Create file: `src/app/<page-name>/page.tsx`
3. Add nav link in `src/components/app-sidebar.tsx` → `navItems` array

### Add a new database field
1. `prisma/schema.prisma` → add field to Activity model
2. Run `npx prisma migrate dev --name add-<field-name>`
3. Update `Activity` type in `src/lib/activity-utils.ts`
4. Update query mapping in `src/lib/queries.ts`
5. Update API route validation in `src/app/api/activities/route.ts`

### Add new data manually
**Swim:** Go to `/swimming` → click "Add Swim" → fill form → Save
**Workout:** Go to `/strength` → click "Add Workout" → add exercises → Save

### Delete data
Click the trash icon on any swim row or workout card → confirm in the modal

### Add a new exercise category
1. `src/app/api/workouts/route.ts` → add to `ALLOWED_CATEGORIES` array
2. `src/components/strength/add-workout-form.tsx` → add to `CATEGORIES` array
3. `src/components/strength/workout-history.tsx` → add color to `categoryColors` object

### Import data from CSV
1. Place CSV in `uploads/` folder
2. Run `npx tsx prisma/seed.ts`
3. Note: will create duplicates if run multiple times — clear DB first with `npx prisma migrate reset`

### Change chart colors
1. `src/app/globals.css` → edit `--chart-1` through `--chart-5` in `.dark {}` block

### Add a new time range filter
1. `src/lib/activity-utils.ts` → add value to `TimeRange` type + case in `filterByRange()`
2. Add to `rangeOptions` array in the relevant `*-content.tsx` component

### Change the anomaly filter threshold
1. `src/lib/parse-activities.ts` → change `pacePerHundred < 110`
2. Note: this only affects CSV imports (seed script). Manual entries are not filtered.

### Edit data
Click the pencil icon on any swim row or workout card → edit in the pre-filled modal → Save Changes

### Change API security secret
1. Generate a new secret
2. `.env` → update both `API_SECRET` and `NEXT_PUBLIC_API_TOKEN` to the same value
3. Restart the dev server

### Deploy to Cloud Run
See the Deployment section above for full commands.

### Reset the database
```bash
npx prisma migrate reset
npx tsx prisma/seed.ts
```
