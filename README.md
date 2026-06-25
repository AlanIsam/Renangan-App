# SwimTracker

Personal swim and strength training tracker with AI-powered workout planning.

## Features

- **Dashboard** — weekly summary, today's workout, stats, pace/volume charts
- **Swimming** — log swims, track pace trends, personal bests, pace distribution
- **Strength** — log gym workouts with exercises, sets, reps, weights
- **Workout Plan** — AI-generated weekly plans via Gemini API with calendar view
- **AI Insights** — data-driven analysis of your training progress
- **Training Notes** — persistent context notes sent to AI for better recommendations

## Stack

Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Prisma 7, SQLite/Turso, Recharts, Gemini API

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create .env file
cp .env.example .env
# Edit .env with your keys

# Run locally (uses local SQLite)
npm run dev
```

## Environment Variables

Create a `.env` file with:

```env
# Database — use local SQLite for development
DATABASE_URL="file:./dev.db"

# Or use Turso for cloud persistence
# DATABASE_URL="libsql://your-db.turso.io"
# TURSO_AUTH_TOKEN="your-token"

# Gemini API key (https://aistudio.google.com/apikey)
GEMINI_API_KEY="your-gemini-key"

# App password for login
APP_PASSWORD="your-password"

# API secret (generate a random string)
API_SECRET="your-random-secret"
NEXT_PUBLIC_API_TOKEN="same-as-api-secret"
```

## Local SQLite Setup

For local development without Turso, create the database tables:

```bash
# Option 1: If prisma migrate works with your setup
npx prisma migrate dev

# Option 2: Create tables manually
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./dev.db' });
const tables = [
  'CREATE TABLE IF NOT EXISTS Activity (id TEXT PRIMARY KEY, date DATETIME NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, elapsedTime REAL DEFAULT 0, movingTime REAL DEFAULT 0, distance REAL DEFAULT 0, maxHeartRate REAL, avgHeartRate REAL, calories REAL, avgSpeed REAL, poolLength REAL, source TEXT DEFAULT \"manual\", createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS Workout (id TEXT PRIMARY KEY, date DATETIME NOT NULL, name TEXT NOT NULL, duration REAL, notes TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS Exercise (id TEXT PRIMARY KEY, workoutId TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, sets INTEGER NOT NULL, reps INTEGER, weight REAL, duration REAL, orderIdx INTEGER DEFAULT 0, FOREIGN KEY (workoutId) REFERENCES Workout(id) ON DELETE CASCADE)',
  'CREATE TABLE IF NOT EXISTS Plan (id TEXT PRIMARY KEY, name TEXT NOT NULL, weekStart DATETIME NOT NULL, active BOOLEAN DEFAULT 1, summary TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS PlanDay (id TEXT PRIMARY KEY, planId TEXT NOT NULL, dayOfWeek INTEGER NOT NULL, type TEXT NOT NULL, focus TEXT NOT NULL, notes TEXT, FOREIGN KEY (planId) REFERENCES Plan(id) ON DELETE CASCADE)',
  'CREATE TABLE IF NOT EXISTS PlanDayItem (id TEXT PRIMARY KEY, dayId TEXT NOT NULL, name TEXT NOT NULL, detail TEXT, tag TEXT, orderIdx INTEGER DEFAULT 0, FOREIGN KEY (dayId) REFERENCES PlanDay(id) ON DELETE CASCADE)',
  'CREATE TABLE IF NOT EXISTS TrainingNote (id TEXT PRIMARY KEY, content TEXT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
  'CREATE TABLE IF NOT EXISTS InsightReport (id TEXT PRIMARY KEY, overall TEXT NOT NULL, swimInsights TEXT NOT NULL, strengthInsights TEXT NOT NULL, recommendations TEXT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
];
(async () => { for (const s of tables) { await client.execute(s); } console.log('Done'); })();
"
```

## Docker

```bash
docker build -t swim-tracker .
docker run -p 8080:8080 \
  -e DATABASE_URL="file:./dev.db" \
  -e GEMINI_API_KEY="your-key" \
  -e APP_PASSWORD="your-password" \
  -e API_SECRET="your-secret" \
  -e NEXT_PUBLIC_API_TOKEN="your-secret" \
  swim-tracker
```

## PWA

The app can be installed on mobile as a Progressive Web App. Open it in Chrome and tap "Add to Home Screen".
