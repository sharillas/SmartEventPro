-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "serviceType" TEXT NOT NULL DEFAULT 'EXTERNO',
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
