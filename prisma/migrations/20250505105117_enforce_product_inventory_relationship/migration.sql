-- CreateIndex
CREATE INDEX "inventory_items_productId_idx" ON "inventory_items"("productId");

-- CreateIndex
CREATE INDEX "sale_transactions_productId_idx" ON "sale_transactions"("productId");

-- CreateIndex
CREATE INDEX "sale_transactions_saleId_idx" ON "sale_transactions"("saleId");

-- CreateIndex
CREATE INDEX "stock_movements_inventoryItemId_idx" ON "stock_movements"("inventoryItemId");
