/*
  Warnings:

  - You are about to drop the column `clientId` on the `OrderNote` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `OrderNote` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `OrderNote` table. All the data in the column will be lost.
  - You are about to drop the column `equipmentId` on the `OrderNoteItem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CLIENTE',
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "nif" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Portugal',
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("active", "address", "city", "companyName", "country", "createdAt", "email", "id", "name", "nif", "notes", "phone", "postalCode", "updatedAt") SELECT "active", "address", "city", "companyName", "country", "createdAt", "email", "id", "name", "nif", "notes", "phone", "postalCode", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE TABLE "new_OrderNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "supplierId" TEXT,
    "department" TEXT,
    "projectCode" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "fixedAsset" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrderNote" ("createdAt", "date", "id", "notes", "number", "status", "subtotal", "taxAmount", "total", "updatedAt") SELECT "createdAt", "date", "id", "notes", "number", "status", "subtotal", "taxAmount", "total", "updatedAt" FROM "OrderNote";
DROP TABLE "OrderNote";
ALTER TABLE "new_OrderNote" RENAME TO "OrderNote";
CREATE UNIQUE INDEX "OrderNote_number_key" ON "OrderNote"("number");
CREATE TABLE "new_OrderNoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 23,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "OrderNoteItem_orderNoteId_fkey" FOREIGN KEY ("orderNoteId") REFERENCES "OrderNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderNoteItem" ("description", "id", "orderNoteId", "quantity", "total", "unitPrice") SELECT "description", "id", "orderNoteId", "quantity", "total", "unitPrice" FROM "OrderNoteItem";
DROP TABLE "OrderNoteItem";
ALTER TABLE "new_OrderNoteItem" RENAME TO "OrderNoteItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
