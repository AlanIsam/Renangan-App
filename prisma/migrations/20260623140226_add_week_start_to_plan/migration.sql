/*
  Warnings:

  - Added the required column `weekStart` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Plan" ("active", "createdAt", "id", "name", "summary", "weekStart") SELECT "active", "createdAt", "id", "name", "summary", date('now', 'weekday 1', '-7 days') FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE INDEX "Plan_weekStart_idx" ON "Plan"("weekStart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
