-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "elapsedTime" REAL NOT NULL DEFAULT 0,
    "movingTime" REAL NOT NULL DEFAULT 0,
    "distance" REAL NOT NULL DEFAULT 0,
    "maxHeartRate" REAL,
    "avgHeartRate" REAL,
    "calories" REAL,
    "avgSpeed" REAL,
    "poolLength" REAL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "Activity"("date");
