import { redirect } from "next/navigation";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  
  // Redirect to the improved inventory edit page
  redirect(`/inventory/edit/${id}`);
}