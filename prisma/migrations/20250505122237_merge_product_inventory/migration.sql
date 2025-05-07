/*
  Warnings:

  - You are about to drop the column `productId` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `sale_transactions` table. All the data in the column will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sku]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryItemId` to the `sale_transactions` table without a default value. This is not possible if the table is not empty.

*/

-- First add the new columns to inventory_items table
ALTER TABLE "inventory_items" 
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "margin" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Copy data from products to inventory_items
UPDATE "inventory_items" i
SET "name" = p."name",
    "description" = p."description",
    "sku" = p."sku",
    "price" = p."price",
    "categoryId" = p."categoryId",
    "imageUrl" = p."imageUrl",
    "active" = p."active",
    "createdAt" = p."createdAt",
    "updatedAt" = p."updatedAt",
    "cost" = p."cost",
    "margin" = p."margin"
FROM "products" p
WHERE i."productId" = p."id";

-- Now make the columns required after setting values
ALTER TABLE "inventory_items" 
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "sku" SET NOT NULL;

-- Add the new column to sale_transactions but allow NULL first
ALTER TABLE "sale_transactions" 
ADD COLUMN     "inventoryItemId" TEXT;

-- Update sale_transactions to link to inventory_items through products
UPDATE "sale_transactions" st
SET "inventoryItemId" = i."id"
FROM "products" p
JOIN "inventory_items" i ON p."id" = i."productId"
WHERE st."productId" = p."id";

-- Now make the column required after setting values
ALTER TABLE "sale_transactions" 
ALTER COLUMN "inventoryItemId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "sale_transactions" DROP CONSTRAINT "sale_transactions_productId_fkey";

-- DropIndex
DROP INDEX "inventory_items_productId_idx";

-- DropIndex
DROP INDEX "inventory_items_productId_key";

-- DropIndex
DROP INDEX "sale_transactions_productId_idx";

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "productId";

-- AlterTable
ALTER TABLE "sale_transactions" DROP COLUMN "productId";

-- DropTable
DROP TABLE "products";

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_categoryId_idx" ON "inventory_items"("categoryId");

-- CreateIndex
CREATE INDEX "sale_transactions_inventoryItemId_idx" ON "sale_transactions"("inventoryItemId");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_transactions" ADD CONSTRAINT "sale_transactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
