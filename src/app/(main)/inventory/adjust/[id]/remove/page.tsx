// This is a server component
import ClientRemoveStockPage from "./client";

export default async function RemoveStockPage({ params }: { params: Promise<{ id: string }> }) {
  // Properly unwrap the params Promise
  const { id } = await params;
  
  // Pass the unwrapped id to the client component
  return <ClientRemoveStockPage inventoryId={id} />;
} 