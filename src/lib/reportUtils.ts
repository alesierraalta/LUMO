/**
 * Report utility functions for exporting data and managing report views
 */

/**
 * Type for defining scheduled report configurations
 */
export type ScheduledReportConfig = {
  id?: string;
  name: string;
  reportType: 'margins' | 'low-stock' | 'inventory-value' | 'sales-performance';
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'pdf';
  recipients?: string[];
  lastRun?: Date;
  nextRun?: Date;
  active?: boolean;
};

/**
 * Type for CSV export options
 */
export type CSVExportOptions = {
  includeHeader?: boolean;
  delimiter?: string;
  fileName?: string;
};

/**
 * Formats an array of data into CSV format
 * @param data - Array of objects to convert to CSV
 * @param options - Export options
 * @returns CSV string
 */
export function formatDataToCSV(data: Record<string, any>[], options?: CSVExportOptions): string {
  if (!data || data.length === 0) return '';
  
  const delimiter = options?.delimiter || ',';
  const includeHeader = options?.includeHeader !== false;
  
  // Get all unique keys from the data
  const keys = Array.from(
    new Set(
      data.flatMap(obj => Object.keys(obj))
    )
  );
  
  const rows: string[] = [];
  
  // Add header row if requested
  if (includeHeader) {
    rows.push(keys.join(delimiter));
  }
  
  // Add data rows
  data.forEach(obj => {
    const row = keys.map(key => {
      let value = obj[key];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains delimiter or quotes
        if (value.includes(delimiter) || value.includes('"')) {
          value = value.replace(/"/g, '""');
          return `"${value}"`;
        }
        return value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
      } else if (value instanceof Date) {
        return value.toISOString();
      } else if (typeof value === 'object') {
        // Convert object to string
        const strValue = JSON.stringify(value);
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      
      return '';
    });
    
    rows.push(row.join(delimiter));
  });
  
  return rows.join('\n');
}

/**
 * Downloads data as a CSV file
 * @param data - Array of objects to convert to CSV
 * @param options - Export options
 */
export function downloadCSV(data: Record<string, any>[], options?: CSVExportOptions): void {
  if (!data || data.length === 0) return;
  
  const csv = formatDataToCSV(data, options);
  const fileName = options?.fileName || 'export.csv';
  
  // Create a blob with the CSV data
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create a link to download the blob
  const link = document.createElement('a');
  
  // Create object URL for the blob
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  // Add the link to the document and click it to start the download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers the print dialog for the current page with optimized styles
 */
export function printReport(): void {
  window.print();
}

/**
 * Gets current date formatted as YYYY-MM-DD
 */
export function getFormattedDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

/**
 * Formats the report title for use in exports
 * @param reportType - Type of report
 * @returns Formatted report name
 */
export function formatReportName(reportType: string): string {
  const formattedNames: { [key: string]: string } = {
    'margins': 'Margin Analysis',
    'low-stock': 'Low Stock',
    'inventory-value': 'Inventory Value',
    'sales-performance': 'Sales Performance'
  };
  
  return formattedNames[reportType] || reportType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Prepares margin report data for CSV export
 * @param products - Product data
 * @param categories - Category data
 * @returns Formatted data for CSV export
 */
export function prepareMarginReportData(products: any[], categories: any[]): Record<string, any>[] {
  return products.map(product => ({
    Name: product.name,
    SKU: product.sku,
    Category: product.category?.name || 'Uncategorized',
    Cost: Number(product.cost).toFixed(2),
    Price: Number(product.price).toFixed(2),
    'Margin (%)': Number(product.margin).toFixed(2),
    Status: product.active ? 'Active' : 'Inactive'
  }));
}

/**
 * Prepares low stock report data for CSV export
 * @param lowStockItems - Low stock inventory items
 * @param categories - Category data
 * @returns Formatted data for CSV export
 */
export function prepareLowStockReportData(lowStockItems: any[], categories: any[]): Record<string, any>[] {
  return lowStockItems.map(item => {
    const categoryName = categories.find(c => c.id === item.product.categoryId)?.name || 'Uncategorized';
    const status = item.quantity === 0 ? 'Out of Stock' : 'Low Stock';
    
    return {
      Product: item.product.name,
      SKU: item.product.sku,
      Category: categoryName,
      'Current Stock': item.quantity,
      'Minimum Level': item.minStockLevel,
      Status: status,
      Deficit: Math.max(0, item.minStockLevel - item.quantity)
    };
  });
} 