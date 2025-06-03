/**
 * Tipo para definir el estado del stock
 */
export enum StockStatus {
  NORMAL = "normal",
  LOW = "low",
  OUT_OF_STOCK = "out_of_stock"
}

/**
 * Calcula el estado del stock basado en la cantidad actual y el nivel mínimo
 */
export function calculateStockStatus(quantity: number, minStockLevel: number): StockStatus {
  if (quantity <= 0) {
    return StockStatus.OUT_OF_STOCK;
  }
  
  if (quantity <= minStockLevel) {
    return StockStatus.LOW;
  }
  
  return StockStatus.NORMAL;
}

/**
 * Tipo para crear un movimiento de stock
 */
export type StockMovementInput = {
  inventoryItemId: string;
  quantity: number;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "INITIAL";
  notes?: string;
  createdBy?: string;
}; 