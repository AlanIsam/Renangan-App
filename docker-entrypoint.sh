#!/bin/sh
# Use existing database if present, otherwise create tables
if [ -f /app/data/dev.db ]; then
  echo "Using existing database"
else
  echo "No database found, creating tables..."
  node -e "
    const { createClient } = require('@libsql/client');
    const client = createClient({ url: process.env.DATABASE_URL || 'file:./data/dev.db' });
    const sql = [
      'CREATE TABLE IF NOT EXISTS Activity (id TEXT PRIMARY KEY, date DATETIME NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, elapsedTime REAL DEFAULT 0, movingTime REAL DEFAULT 0, distance REAL DEFAULT 0, maxHeartRate REAL, avgHeartRate REAL, calories REAL, avgSpeed REAL, poolLength REAL, source TEXT DEFAULT \"manual\", createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE INDEX IF NOT EXISTS Activity_type_idx ON Activity(type)',
      'CREATE INDEX IF NOT EXISTS Activity_date_idx ON Activity(date)',
      'CREATE TABLE IF NOT EXISTS Workout (id TEXT PRIMARY KEY, date DATETIME NOT NULL, name TEXT NOT NULL, duration REAL, notes TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE INDEX IF NOT EXISTS Workout_date_idx ON Workout(date)',
      'CREATE TABLE IF NOT EXISTS Exercise (id TEXT PRIMARY KEY, workoutId TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, sets INTEGER NOT NULL, reps INTEGER, weight REAL, duration REAL, orderIdx INTEGER DEFAULT 0, FOREIGN KEY (workoutId) REFERENCES Workout(id) ON DELETE CASCADE)',
      'CREATE INDEX IF NOT EXISTS Exercise_workoutId_idx ON Exercise(workoutId)',
      'CREATE TABLE IF NOT EXISTS Plan (id TEXT PRIMARY KEY, name TEXT NOT NULL, weekStart DATETIME NOT NULL, active BOOLEAN DEFAULT 1, summary TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE INDEX IF NOT EXISTS Plan_weekStart_idx ON Plan(weekStart)',
      'CREATE TABLE IF NOT EXISTS PlanDay (id TEXT PRIMARY KEY, planId TEXT NOT NULL, dayOfWeek INTEGER NOT NULL, type TEXT NOT NULL, focus TEXT NOT NULL, notes TEXT, FOREIGN KEY (planId) REFERENCES Plan(id) ON DELETE CASCADE)',
      'CREATE INDEX IF NOT EXISTS PlanDay_planId_idx ON PlanDay(planId)',
      'CREATE TABLE IF NOT EXISTS PlanDayItem (id TEXT PRIMARY KEY, dayId TEXT NOT NULL, name TEXT NOT NULL, detail TEXT, tag TEXT, orderIdx INTEGER DEFAULT 0, FOREIGN KEY (dayId) REFERENCES PlanDay(id) ON DELETE CASCADE)',
      'CREATE INDEX IF NOT EXISTS PlanDayItem_dayId_idx ON PlanDayItem(dayId)',
    ];
    (async () => { for (const s of sql) { await client.execute(s); } console.log('Tables created'); })().catch(e => { console.error(e); process.exit(1); });
  "
fi

exec node server.js
