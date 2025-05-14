// This is a server component
import ClientAddStockPage from "./client";

export default async function AddStockPage({ params }: { params: Promise<{ id: string }> }) {
  // Properly unwrap the params Promise
  const { id } = await params;
  
  // Pass the unwrapped id to the client component
  return <ClientAddStockPage inventoryId={id} />;
} 