/*
  Warnings:

  - You are about to drop the column `serviceType` on the `Vehicle` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "defaultPrice" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tipo" TEXT NOT NULL DEFAULT 'EXTERNO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Service" ("active", "category", "createdAt", "defaultPrice", "description", "id", "name", "unit", "updatedAt") SELECT "active", "category", "createdAt", "defaultPrice", "description", "id", "name", "unit", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT,
    "name" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "type" TEXT NOT NULL,
    "fuelType" TEXT,
    "capacityKg" REAL,
    "capacityM3" REAL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "insuranceExpiry" DATETIME,
    "inspectionExpiry" DATETIME,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Vehicle" ("active", "brand", "capacityKg", "capacityM3", "createdAt", "fuelType", "id", "inspectionExpiry", "insuranceExpiry", "licensePlate", "model", "name", "notes", "number", "status", "type", "updatedAt", "year") SELECT "active", "brand", "capacityKg", "capacityM3", "createdAt", "fuelType", "id", "inspectionExpiry", "insuranceExpiry", "licensePlate", "model", "name", "notes", "number", "status", "type", "updatedAt", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_number_key" ON "Vehicle"("number");
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
