-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "oldPrice" REAL,
    "newPrice" REAL,
    "oldCost" REAL,
    "newCost" REAL,
    "oldMargin" REAL,
    "newMargin" REAL,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "price_history_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "price_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "price_history_inventoryItemId_idx" ON "price_history"("inventoryItemId");

-- CreateIndex
CREATE INDEX "price_history_userId_idx" ON "price_history"("userId");
