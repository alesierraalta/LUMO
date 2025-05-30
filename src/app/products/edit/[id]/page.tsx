import { redirect } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // Redirect to the improved inventory edit page
  redirect(`/inventory/edit/${id}`);
} 