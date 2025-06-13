/*
  Warnings:

  - You are about to drop the column `createdById` on the `Category` table. All the data in the column will be lost.
  - Added the required column `created_by_id` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "created_by_id" TEXT NOT NULL,
    CONSTRAINT "Category_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE INDEX "Category_name_idx" ON "Category"("name");
CREATE INDEX "Category_created_by_id_idx" ON "Category"("created_by_id");
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minLevel" INTEGER NOT NULL DEFAULT 0,
    "min_stock_level" INTEGER NOT NULL DEFAULT 0,
    "maxLevel" INTEGER,
    "cost" REAL,
    "price" REAL,
    "margin" REAL,
    "image_url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT,
    "locationId" TEXT,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("barcode", "categoryId", "cost", "createdAt", "createdById", "currentStock", "description", "id", "isActive", "locationId", "maxLevel", "minLevel", "min_stock_level", "name", "price", "sku", "updatedAt") SELECT "barcode", "categoryId", "cost", "createdAt", "createdById", "currentStock", "description", "id", "isActive", "locationId", "maxLevel", "minLevel", "min_stock_level", "name", "price", "sku", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX "InventoryItem_sku_idx" ON "InventoryItem"("sku");
CREATE INDEX "InventoryItem_name_idx" ON "InventoryItem"("name");
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");
CREATE INDEX "InventoryItem_locationId_idx" ON "InventoryItem"("locationId");
CREATE INDEX "InventoryItem_createdById_idx" ON "InventoryItem"("createdById");
CREATE INDEX "InventoryItem_isActive_idx" ON "InventoryItem"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
