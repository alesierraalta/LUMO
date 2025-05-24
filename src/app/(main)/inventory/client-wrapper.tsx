"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import InventoryTable from "@/components/inventory/inventory-table";
import { StockStatus } from "@/services/inventoryService";

type InventoryClientWrapperProps = {
  inventoryItems: any[];
  allCategories: any[];
  initialTab: 'all' | 'normal' | 'low' | 'out_of_stock';
};

export default function InventoryClientWrapper({
  inventoryItems,
  allCategories,
  initialTab
}: InventoryClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'normal' | 'low' | 'out_of_stock'>(initialTab);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle tab changes
  const handleTabChange = (tab: 'all' | 'normal' | 'low' | 'out_of_stock') => {
    setActiveTab(tab);
    
    // Update URL with the new tab without causing navigation
    const params = new URLSearchParams(searchParams.toString());
    
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    
    // Use replace instead of push to update URL without navigation
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  return (
    <InventoryTable 
      inventoryItems={inventoryItems} 
      allCategories={allCategories} 
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
} 