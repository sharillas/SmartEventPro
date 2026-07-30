-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nif" TEXT,
    "address" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "hourlyRate" REAL NOT NULL DEFAULT 0,
    "dailyRate" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("active", "address", "createdAt", "dailyRate", "department", "email", "endDate", "hourlyRate", "id", "name", "nif", "notes", "phone", "position", "startDate", "updatedAt") SELECT "active", "address", "createdAt", "dailyRate", "department", "email", "endDate", "hourlyRate", "id", "name", "nif", "notes", "phone", "position", "startDate", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
