// This is a server component
import ClientAdjustInventoryPage from "./client";

export default async function AdjustInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  // Properly unwrap the params Promise
  const { id } = await params;
  
  // Pass the unwrapped id to the client component
  return <ClientAdjustInventoryPage inventoryId={id} />;
}